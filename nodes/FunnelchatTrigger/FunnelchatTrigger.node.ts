import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IHookFunctions,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { SIGNATURE_HEADER, verifySignature } from '../shared/signature';
import { funnelchatApiRequest } from '../shared/transport';

/*
 * The trigger subscribes through the unified webhook subscriptions of accounts (`/api/v1/webhooks`). Those routes
 * are not in the portal's unified specification yet: they are taken from accounts origin/main @ c34cba2c0
 * (routes/api/webhooks.php and Modules/Webhook/Http/Controllers/WebhookSubscription*Controller.php, read only) and from
 * the portal's content/webhooks.md (feat/armar-funnelchat-portal @ dd7cd42). See spec/PROCEDENCIA.md.
 *
 *   POST   /api/v1/webhooks       {url, events, description?, filters?: {campaign_ids}} → 201 {id, …, secret}
 *   GET    /api/v1/webhooks/{id}  → {id, url, events, filters, status, …} (never the secret) | 404
 *   PUT    /api/v1/webhooks/{id}  {url, events, description?, filters?, status?} → the subscription (same secret)
 *   DELETE /api/v1/webhooks/{id}  → 204 | 404
 *   GET    /api/v1/webhooks/events → {data: [{type, area, status, label, description, subscribable, …}], meta}
 *
 * The secret is returned only once, on creation, so it is kept in the node's static data next to the subscription
 * id, by webhook URL: the test URL and the production URL have their own subscription and never touch each other.
 *
 * The node never filters the webhook URL n8n gives it: the API decides. The real API only accepts public https URLs;
 * the sandbox (credential with a custom base URL) also accepts http and local ones, such as http://localhost:5678.
 */

const SUBSCRIPTIONS_PATH = '/api/v1/webhooks';
const CATALOG_PATH = '/api/v1/webhooks/events';

interface StoredSubscription {
	id: string;
	secret: string;
}

type Subscriptions = Record<string, StoredSubscription>;

function storedSubscriptions(data: IDataObject): Subscriptions {
	const value = data.subscriptions;
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as unknown as Subscriptions)
		: {};
}

function saveSubscriptions(data: IDataObject, subscriptions: Subscriptions): void {
	if (Object.keys(subscriptions).length === 0) delete data.subscriptions;
	else data.subscriptions = subscriptions as unknown as IDataObject;
}

/** The subscription object of a response (accounts answers it unwrapped; `{data: …}` is accepted too). */
function subscriptionOf(body: unknown): IDataObject | undefined {
	if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
	const b = body as IDataObject;
	if (b.id === undefined && b.data && typeof b.data === 'object' && !Array.isArray(b.data)) {
		return b.data as IDataObject;
	}
	return b;
}

function sameSet(a: unknown, b: string[]): boolean {
	const left = new Set(Array.isArray(a) ? a.map(String) : []);
	const right = new Set(b);
	return left.size === right.size && [...right].every((x) => left.has(x));
}

function splitList(value: unknown): string[] {
	return String(value ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s !== '');
}

/** The body for `POST`/`PUT /api/v1/webhooks` from the node's parameters. */
export function subscriptionBody(this: IHookFunctions, url: string): IDataObject {
	const events = this.getNodeParameter('events', []) as string[];
	const options = this.getNodeParameter('options', {}) as IDataObject;
	const campaignIds = splitList(options.campaignIds);
	const workflowName = this.getWorkflow().name;
	const description =
		String(options.description ?? '').trim() || `n8n · ${workflowName || 'flujo sin nombre'}`;
	return {
		url,
		events,
		description: description.slice(0, 160),
		...(campaignIds.length ? { filters: { campaign_ids: campaignIds } } : {}),
	};
}

function webhookUrl(context: IHookFunctions): string {
	const url = context.getNodeWebhookUrl('default');
	if (!url)
		throw new NodeOperationError(context.getNode(), 'n8n no dio la URL del webhook de este nodo.');
	return url;
}

export async function getEvents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await funnelchatApiRequest.call(this, { method: 'GET', url: CATALOG_PATH });
	const body = response.body as IDataObject | IDataObject[] | undefined;
	const entries = (
		Array.isArray(body) ? body : Array.isArray(body?.data) ? body?.data : []
	) as IDataObject[];
	return entries
		.filter((e) => typeof e.type === 'string' && e.subscribable !== false)
		.map((e) => {
			const type = e.type as string;
			const description = [
				typeof e.description === 'string' ? e.description : '',
				e.status === 'planned' ? 'Todavía no se emite (planned).' : '',
				typeof e.area === 'string' ? `Área: ${e.area}.` : '',
			]
				.filter(Boolean)
				.join(' ');
			return {
				name: typeof e.label === 'string' && e.label !== '' ? `${e.label} (${type})` : type,
				value: type,
				...(description ? { description } : {}),
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export class FunnelchatTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Funnelchat Trigger',
		name: 'funnelchatTrigger',
		icon: {
			light: 'file:../../icons/funnelchat.svg',
			dark: 'file:../../icons/funnelchat.dark.svg',
		},
		group: ['trigger'],
		version: 1,
		subtitle: '={{($parameter["events"] || []).join(", ")}}',
		description: 'Arranca el flujo con cada evento firmado que Funnelchat manda por webhook',
		defaults: {
			name: 'Funnelchat Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'funnelchatApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'Al activar el flujo se crea una suscripción en Funnelchat (POST /api/v1/webhooks) y al desactivarlo se borra. Con Producción o Staging, la URL de n8n tiene que ser https y pública; con una URL base personalizada (por ejemplo el sandbox local) también sirve una URL local, como http://localhost:5678. Las entregas sin una firma válida se rechazan con 400.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options -- the UI of this package is in Spanish (see README); this rule enforces English wording
				displayName: 'Eventos',
				name: 'events',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getEvents',
				},
				required: true,
				default: [],
				// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-multi-options -- the UI of this package is in Spanish (see README); this rule enforces English wording
				description:
					'Elegilos de la lista, que sale del catálogo de Funnelchat (GET /api/v1/webhooks/events), o escribí los tipos con una <a href="https://docs.n8n.io/code/expressions/">expresión</a>. Con una clave, cada tipo pide el permiso de lectura de su área.',
			},
			{
				displayName: 'Opciones',
				name: 'options',
				type: 'collection',
				placeholder: 'Agregar opción',
				default: {},
				options: [
					{
						displayName: 'Descripción',
						name: 'description',
						type: 'string',
						default: '',
						description:
							'Texto para reconocer la suscripción en Funnelchat (hasta 160 caracteres). Si lo dejás vacío: «n8n · nombre del flujo».',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased -- the UI of this package is in Spanish (see README); this rule enforces English wording
						displayName: 'IDs de campaña',
						name: 'campaignIds',
						type: 'string',
						default: '',
						placeholder: 'campania-1, campania-2',
						description:
							'Recibir solo eventos de estas campañas (filters.campaign_ids), separadas por comas. Con filtro, un evento sin campaña no llega.',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			getEvents,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				const subscriptions = storedSubscriptions(data);
				const url = webhookUrl(this);
				const stored = subscriptions[url];
				if (!stored) return false;

				const response = await funnelchatApiRequest.call(this, {
					method: 'GET',
					url: `${SUBSCRIPTIONS_PATH}/${encodeURIComponent(stored.id)}`,
					acceptStatuses: [404],
				});
				const current = subscriptionOf(response.body);
				if (response.statusCode === 404 || !current) {
					this.logger.info(`Funnelchat: la suscripción ${stored.id} ya no existe; se crea otra`);
					delete subscriptions[url];
					saveSubscriptions(data, subscriptions);
					return false;
				}

				// Disabled (key revoked, too many failures): it cannot come back, so it is replaced by a new one.
				if (current.status === 'disabled') {
					this.logger.info(
						`Funnelchat: la suscripción ${stored.id} está deshabilitada; se reemplaza`,
					);
					await funnelchatApiRequest.call(this, {
						method: 'DELETE',
						url: `${SUBSCRIPTIONS_PATH}/${encodeURIComponent(stored.id)}`,
						acceptStatuses: [404],
					});
					delete subscriptions[url];
					saveSubscriptions(data, subscriptions);
					return false;
				}

				// Ours, but with other events, filter or URL, or paused: brought up to date in place (the secret stays).
				const wanted = subscriptionBody.call(this, url);
				const wantedFilter =
					((wanted.filters as IDataObject | undefined)?.campaign_ids as string[]) ?? [];
				const currentFilter =
					((current.filters as IDataObject | undefined)?.campaign_ids as string[]) ?? [];
				const upToDate =
					current.url === url &&
					current.status === 'active' &&
					sameSet(current.events, wanted.events as string[]) &&
					sameSet(currentFilter, wantedFilter);
				if (!upToDate) {
					await funnelchatApiRequest.call(this, {
						method: 'PUT',
						url: `${SUBSCRIPTIONS_PATH}/${encodeURIComponent(stored.id)}`,
						body: { ...wanted, status: 'active' },
					});
				}
				return true;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				const subscriptions = storedSubscriptions(data);
				const url = webhookUrl(this);

				const response = await funnelchatApiRequest.call(this, {
					method: 'POST',
					url: SUBSCRIPTIONS_PATH,
					body: subscriptionBody.call(this, url),
				});
				const created = subscriptionOf(response.body);
				if (!created || typeof created.id !== 'string' || typeof created.secret !== 'string') {
					throw new NodeOperationError(
						this.getNode(),
						'Funnelchat creó la suscripción pero la respuesta no trajo su id o su secreto.',
					);
				}

				subscriptions[url] = { id: created.id, secret: created.secret };
				saveSubscriptions(data, subscriptions);
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				const subscriptions = storedSubscriptions(data);
				const url = webhookUrl(this);
				const stored = subscriptions[url];
				if (!stored) return true;

				const response = await funnelchatApiRequest.call(this, {
					method: 'DELETE',
					url: `${SUBSCRIPTIONS_PATH}/${encodeURIComponent(stored.id)}`,
					acceptStatuses: [404],
				});
				if (response.statusCode === 404) {
					this.logger.info(`Funnelchat: la suscripción ${stored.id} ya no existía`);
				}
				delete subscriptions[url];
				saveSubscriptions(data, subscriptions);
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const request = this.getRequestObject();
		const secrets = Object.values(storedSubscriptions(this.getWorkflowStaticData('node'))).map(
			(s) => s.secret,
		);

		let raw: Buffer | undefined = request.rawBody;
		if (!raw && typeof request.readRawBody === 'function') {
			await request.readRawBody();
			raw = request.rawBody;
		}
		const headerValue = request.headers[SIGNATURE_HEADER];
		const signature = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;

		const valid =
			raw !== undefined && secrets.some((secret) => verifySignature(raw, signature, secret));
		let event: unknown;
		if (valid) {
			try {
				event = JSON.parse(raw!.toString('utf8'));
			} catch {
				event = undefined;
			}
		}

		if (!valid || !event || typeof event !== 'object' || Array.isArray(event)) {
			this.getResponseObject().status(400).json({
				error: 'invalid_signature',
				message: 'La firma X-Funnelchat-Signature no es válida para esta suscripción.',
			});
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [[{ json: event as IDataObject }]],
		};
	}
}
