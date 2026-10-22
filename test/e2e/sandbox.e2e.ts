import { createServer, type IncomingHttpHeaders, type Server } from 'http';
import type { AddressInfo } from 'net';
import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHookFunctions,
	type IHttpRequestOptions,
	type IWebhookFunctions,
} from 'n8n-workflow';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Funnelchat } from '../../nodes/Funnelchat/Funnelchat.node';
import { FunnelchatTrigger } from '../../nodes/FunnelchatTrigger/FunnelchatTrigger.node';

/*
 * End to end against a running funnelchat-sandbox (Funnelchat20/funnelchat-sandbox, branch feat/inicial): the real
 * HTTP of the node, with a credential on the «Personalizado» environment. Skipped unless FUNNELCHAT_SANDBOX_URL is set:
 *
 *   FUNNELCHAT_SANDBOX_URL=http://127.0.0.1:4010 npm run test:e2e
 *
 * Uses the sandbox's seed (contact 2001 with phone 5491100000000, QR number 4 without a 24-hour window) and resets it
 * before each test with POST /_sandbox/reset.
 */

const SANDBOX = process.env.FUNNELCHAT_SANDBOX_URL;
const KEY = '1|fc_live_e2e';
const CONTACT = 2001;
const PHONE = '5491100000000';
const DEVICE = 4;

const NODE = {
	id: 'e2e',
	name: 'Funnelchat',
	type: 'n8n-nodes-funnelchat.funnelchat',
	typeVersion: 1,
	position: [0, 0] as [number, number],
	parameters: {},
};

/** What n8n's httpRequestWithAuthentication does for this credential: base URL, Bearer key, JSON body, full response. */
async function realHttp(_credential: string, options: IHttpRequestOptions) {
	const response = await fetch(`${options.baseURL ?? ''}${options.url}`, {
		method: options.method ?? 'GET',
		headers: {
			...(options.headers as Record<string, string>),
			Authorization: `Bearer ${KEY}`,
			...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
		},
		body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
	});
	const headers: IDataObject = {};
	response.headers.forEach((value, name) => (headers[name] = value));
	return { statusCode: response.status, headers, body: await response.text() };
}

const credentials = async () => ({ apiKey: KEY, environment: 'custom', baseUrl: SANDBOX });

function execute(params: IDataObject, continueOnFail = false): IExecuteFunctions {
	return {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name: string, _i: number, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		getNode: () => NODE,
		continueOnFail: () => continueOnFail,
		getCredentials: credentials,
		helpers: { httpRequestWithAuthentication: realHttp },
	} as unknown as IExecuteFunctions;
}

async function run(params: IDataObject): Promise<IDataObject[]> {
	const [out] = await new Funnelchat().execute.call(execute(params));
	return out.map((i) => i.json);
}

interface Delivery {
	headers: IncomingHttpHeaders;
	raw: Buffer;
}

/** A local receiver for the sandbox's signed deliveries (the sandbox accepts http and local URLs). */
function receiver(): Promise<{ server: Server; url: string; deliveries: Delivery[] }> {
	const deliveries: Delivery[] = [];
	const server = createServer((req, res) => {
		const chunks: Buffer[] = [];
		req.on('data', (c: Buffer) => chunks.push(c));
		req.on('end', () => {
			deliveries.push({ headers: req.headers, raw: Buffer.concat(chunks) });
			res.writeHead(200).end();
		});
	});
	return new Promise((resolve) =>
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as AddressInfo;
			resolve({ server, url: `http://127.0.0.1:${port}/webhook/e2e/webhook`, deliveries });
		}),
	);
}

async function until<T>(what: string, check: () => T | undefined, seconds = 15): Promise<T> {
	const end = Date.now() + seconds * 1000;
	for (;;) {
		const value = check();
		if (value !== undefined) return value;
		if (Date.now() > end) throw new Error(`No llegó a tiempo: ${what}`);
		await new Promise((r) => setTimeout(r, 200));
	}
}

describe.skipIf(!SANDBOX)('e2e contra el sandbox', () => {
	beforeEach(async () => {
		const reset = await fetch(`${SANDBOX}/_sandbox/reset`, { method: 'POST' });
		expect(reset.ok).toBe(true);
	});

	it('enviar un mensaje devuelve el mensaje en cola, y se lee por id', async () => {
		const [queued] = await run({
			resource: 'conversation',
			operation: 'conversation.sendMessage',
			contact: String(CONTACT),
			device_id: String(DEVICE),
			contact_id: String(CONTACT),
			useJsonBody: false,
			additionalFields: { phone: PHONE, text: 'Hola desde n8n', client_reference: 'e2e-envio-1' },
		});
		expect(queued).toMatchObject({
			contact_id: CONTACT,
			device_id: DEVICE,
			direction: 'outbound',
			status: 'queued',
			client_reference: 'e2e-envio-1',
		});
		expect(typeof queued.id).toBe('number');

		const [read] = await run({
			resource: 'conversation',
			operation: 'showMessage',
			contact: String(CONTACT),
			message: String(queued.id),
		});
		expect(read).toMatchObject({ id: queued.id, client_reference: 'e2e-envio-1' });
	});

	it('archivo por URL sin extensión: sin tipo responde 422 en file_type; con tipo, sale', async () => {
		const params = {
			resource: 'conversation',
			operation: 'conversation.sendMessage',
			contact: String(CONTACT),
			device_id: String(DEVICE),
			contact_id: String(CONTACT),
			useJsonBody: false,
		};
		const file = 'https://cdn.example.com/descarga?id=9&firma=abc';
		const error = (await run({
			...params,
			additionalFields: { phone: PHONE, file },
		}).catch((e: unknown) => e)) as NodeApiError;
		expect(error).toBeInstanceOf(NodeApiError);
		expect(error.httpCode).toBe('422');
		expect(error.description).toContain('file_type');

		const [queued] = await run({
			...params,
			additionalFields: { phone: PHONE, file, file_type: 'document', file_name: 'factura.pdf' },
		});
		expect(queued).toMatchObject({ status: 'queued', type: 'document' });
	});

	it('un error de la API trae su X-Request-Id, también con «continuar ante errores»', async () => {
		const error = (await run({
			resource: 'conversation',
			operation: 'showMessage',
			contact: String(CONTACT),
			message: '999999',
		}).catch((e: unknown) => e)) as NodeApiError;
		expect(error).toBeInstanceOf(NodeApiError);
		expect(error.httpCode).toBe('404');
		expect(error.context.requestId).toEqual(expect.any(String));
		expect(error.description).toContain(`X-Request-Id: ${error.context.requestId as string}`);

		const [out] = await new Funnelchat().execute.call(
			execute(
				{
					resource: 'conversation',
					operation: 'showMessage',
					contact: String(CONTACT),
					message: '999999',
				},
				true,
			),
		);
		expect(out[0].json).toMatchObject({ httpCode: '404', requestId: expect.any(String) });
	});

	describe('disparador', () => {
		let hook: Awaited<ReturnType<typeof receiver>>;
		beforeAll(async () => {
			hook = await receiver();
		});
		afterAll(() => new Promise<void>((r) => hook.server.close(() => r())));

		function hookContext(staticData: IDataObject, events: string[]): IHookFunctions {
			const logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} };
			return {
				getWorkflowStaticData: () => staticData,
				getNodeWebhookUrl: () => hook.url,
				getNodeParameter: (name: string, fallback?: unknown) =>
					name === 'events' ? events : name === 'options' ? {} : fallback,
				getWorkflow: () => ({ id: 'wf-e2e', name: 'e2e', active: true }),
				getNode: () => ({ ...NODE, name: 'Funnelchat Trigger' }),
				getCredentials: credentials,
				helpers: { httpRequestWithAuthentication: realHttp },
				logger,
			} as unknown as IHookFunctions;
		}

		function deliver(staticData: IDataObject, delivery: Delivery) {
			const response = { status: () => response, json: () => response };
			const ctx = {
				getRequestObject: () => ({ rawBody: delivery.raw, headers: delivery.headers }),
				getResponseObject: () => response,
				getWorkflowStaticData: () => staticData,
				getNode: () => NODE,
			} as unknown as IWebhookFunctions;
			return new FunnelchatTrigger().webhook.call(ctx);
		}

		it('alta, aviso firmado de message.status_changed con la referencia propia, y baja', async () => {
			hook.deliveries.length = 0;
			const staticData: IDataObject = {};
			const methods = new FunnelchatTrigger().webhookMethods.default;
			const ctx = hookContext(staticData, ['message.status_changed']);

			expect(await methods.checkExists.call(ctx)).toBe(false);
			expect(await methods.create.call(ctx)).toBe(true);
			expect(await methods.checkExists.call(ctx)).toBe(true);

			const [queued] = await run({
				resource: 'conversation',
				operation: 'conversation.sendMessage',
				contact: String(CONTACT),
				device_id: String(DEVICE),
				contact_id: String(CONTACT),
				useJsonBody: false,
				additionalFields: { phone: PHONE, text: 'Hola', client_reference: 'e2e-aviso-1' },
			});

			const delivery = await until('message.status_changed sent', () =>
				hook.deliveries.find((d) => {
					const event = JSON.parse(d.raw.toString('utf8')) as IDataObject;
					const data = event.data as IDataObject;
					return event.type === 'message.status_changed' && data.message_id === queued.id;
				}),
			);
			const result = await deliver(staticData, delivery);
			const event = result.workflowData?.[0][0].json as IDataObject;
			expect(event.type).toBe('message.status_changed');
			expect(event.data).toMatchObject({
				message_id: queued.id,
				client_reference: 'e2e-aviso-1',
			});

			// A forged delivery does not start the workflow.
			const forged = await deliver(staticData, {
				headers: { ...delivery.headers, 'x-funnelchat-signature': 't=1,v1=00' },
				raw: delivery.raw,
			});
			expect(forged.workflowData).toBeUndefined();

			expect(await methods.delete.call(ctx)).toBe(true);
			expect(staticData.subscriptions).toBeUndefined();
		});
	});
});
