import {
	NodeApiError,
	sleep,
	type IDataObject,
	type IExecuteFunctions,
	type IHookFunctions,
	type IHttpRequestOptions,
	type IWebhookFunctions,
} from 'n8n-workflow';
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { Funnelchat } from '../../nodes/Funnelchat/Funnelchat.node';
import { FunnelchatTrigger } from '../../nodes/FunnelchatTrigger/FunnelchatTrigger.node';
import { startReceiver } from './receiver.mjs';

/*
 * End to end against a running funnelchat-sandbox (Funnelchat20/funnelchat-sandbox, 0.2.0 or later: connecting
 * numbers came in 0.2.0): the real HTTP of the node, with a credential on the "Custom" environment. Skipped unless
 * FUNNELCHAT_SANDBOX_URL is set:
 *
 *   npx @funnelchat-hq/sandbox --port 4010 --status-delays 0.2,0.2,0.2
 *   FUNNELCHAT_SANDBOX_URL=http://127.0.0.1:4010 npm run test:e2e
 *
 * Uses the sandbox's seed (contact 2001 with phone 5491100000000, QR number 4 without a 24-hour window) and resets it
 * before each test with POST /_sandbox/reset. Short status delays make the wait for "read" short; with the default
 * ones (1, 2 and 3 seconds) the first use takes about six seconds.
 */

const SANDBOX = inject('sandboxUrl') || undefined;
const KEY = '1|fc_live_e2e';
const CONTACT = 2001;
const PHONE = '5491100000000';
const DEVICE = 4;

const NODE = {
	id: 'e2e',
	name: 'Funnelchat',
	type: '@funnelchat-hq/n8n-nodes-funnelchat.funnelchat',
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

type Delivery = Awaited<ReturnType<typeof startReceiver>>['deliveries'][number];

async function until<T>(what: string, check: () => T | undefined, seconds = 15): Promise<T> {
	const end = Date.now() + seconds * 1000;
	for (;;) {
		const value = check();
		if (value !== undefined) return value;
		if (Date.now() > end) throw new Error(`Did not arrive in time: ${what}`);
		await sleep(200);
	}
}

describe.skipIf(!SANDBOX)('e2e against the sandbox', () => {
	beforeEach(async () => {
		const reset = await fetch(`${SANDBOX}/_sandbox/reset`, { method: 'POST' });
		expect(reset.ok).toBe(true);
	});

	it('sending a message returns the queued message, and it can be read by ID', async () => {
		const [queued] = await run({
			resource: 'conversation',
			operation: 'conversation.sendMessage',
			contact: String(CONTACT),
			device_id: String(DEVICE),
			contact_id: String(CONTACT),
			useJsonBody: false,
			additionalFields: { phone: PHONE, text: 'Hello from n8n', client_reference: 'e2e-send-1' },
		});
		expect(queued).toMatchObject({
			contact_id: CONTACT,
			device_id: DEVICE,
			direction: 'outbound',
			status: 'queued',
			client_reference: 'e2e-send-1',
		});
		expect(typeof queued.id).toBe('number');

		const [read] = await run({
			resource: 'conversation',
			operation: 'showMessage',
			contact: String(CONTACT),
			message: String(queued.id),
		});
		expect(read).toMatchObject({ id: queued.id, client_reference: 'e2e-send-1' });
	});

	it('file by URL without an extension: without a type it answers 422 on file_type; with one, it goes out', async () => {
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

	it('an API error carries its X-Request-Id, also with Continue On Fail', async () => {
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

	describe('trigger', () => {
		let hook: Awaited<ReturnType<typeof startReceiver>>;
		beforeAll(async () => {
			hook = await startReceiver();
		});
		afterAll(() => hook.close());

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

		/** The first delivery of `type` that matches, verified by the trigger as n8n would run it. */
		async function received(
			staticData: IDataObject,
			type: string,
			match: (data: IDataObject) => boolean = () => true,
		): Promise<IDataObject> {
			const delivery = await until(type, () =>
				hook.deliveries.find((d) => {
					const event = JSON.parse(d.raw.toString('utf8')) as IDataObject;
					return event.type === type && match(event.data as IDataObject);
				}),
			);
			const result = await deliver(staticData, delivery);
			return result.workflowData?.[0][0].json as IDataObject;
		}

		it('the first use of the README: Send a message, and the trigger follows it up to read', async () => {
			hook.deliveries.length = 0;
			const staticData: IDataObject = {};
			const methods = new FunnelchatTrigger().webhookMethods.default;
			const ctx = hookContext(staticData, ['message.status_changed']);
			expect(await methods.create.call(ctx)).toBe(true);

			const [queued] = await run({
				resource: 'conversation',
				operation: 'message.sendMessage',
				device_id: String(DEVICE),
				contact_id: String(CONTACT),
				useJsonBody: false,
				additionalFields: { text: 'Hello!', client_reference: 'e2e-first-use' },
			});
			expect(queued).toMatchObject({ status: 'queued', client_reference: 'e2e-first-use' });

			const read = await received(
				staticData,
				'message.status_changed',
				(data) => data.message_id === queued.id && data.status === 'read',
			);
			expect(read.data).toMatchObject({
				message_id: queued.id,
				status: 'read',
				client_reference: 'e2e-first-use',
			});
			expect(await methods.delete.call(ctx)).toBe(true);
		});

		it('connect a number by QR: create it, read its QR, and device.connected reaches the trigger', async () => {
			hook.deliveries.length = 0;
			const staticData: IDataObject = {};
			const methods = new FunnelchatTrigger().webhookMethods.default;
			const ctx = hookContext(staticData, ['device.connected', 'device.disconnected']);
			expect(await methods.create.call(ctx)).toBe(true);

			const [number] = await run({
				resource: 'device',
				operation: 'deviceProvisioning.store',
				connection: 'qr',
				useJsonBody: false,
				additionalFields: { alias: 'e2e', external_reference: 'e2e-qr-1' },
			});
			expect(typeof number.id).toBe('number');
			expect(Boolean(number.connected)).toBe(false);

			const [qr] = await run({
				resource: 'device',
				operation: 'deviceProvisioning.qr',
				device: String(number.id),
			});
			expect(qr).toMatchObject({ connected: false, expires_in: 5 });
			expect(String(qr.qr_code)).toMatch(/^data:image\/png;base64,/);

			// The scan of the QR, which only the sandbox can do.
			const scan = await fetch(`${SANDBOX}/_sandbox/devices/${number.id as number}/connect`, {
				method: 'POST',
			});
			expect(scan.ok).toBe(true);
			const connected = await received(
				staticData,
				'device.connected',
				(data) => (data.device as IDataObject)?.id === number.id,
			);
			expect((connected.data as IDataObject).device).toMatchObject({
				id: number.id,
				external_reference: 'e2e-qr-1',
			});

			const found = await run({
				resource: 'device',
				operation: 'device.index',
				returnAll: true,
				filters: { external_reference: 'e2e-qr-1' },
			});
			expect(found.map((d) => d.id)).toEqual([number.id]);
			expect(Boolean(found[0].connected)).toBe(true);
			expect(await methods.delete.call(ctx)).toBe(true);
		});

		it('a connect link: create it with its url, read it, list it by reference and revoke it', async () => {
			const [link] = await run({
				resource: 'device',
				operation: 'connectLink.store',
				type: 'qr',
				useJsonBody: false,
				additionalFields: { external_reference: 'e2e-link-1', expires_in_minutes: 60 },
			});
			expect(link).toMatchObject({
				type: 'qr',
				status: 'pending',
				external_reference: 'e2e-link-1',
			});
			expect(String(link.url)).toContain('/connect/');

			const [read] = await run({
				resource: 'device',
				operation: 'connectLink.show',
				link: String(link.id),
			});
			expect(read).toMatchObject({ id: link.id, status: 'pending' });
			// Only the creation shows the url: accounts answers null afterwards, the sandbox 0.2.0 leaves it out.
			expect(read.url ?? null).toBeNull();

			const listed = await run({
				resource: 'device',
				operation: 'connectLink.index',
				returnAll: true,
				filters: { external_reference: 'e2e-link-1' },
			});
			expect(listed.map((l) => l.id)).toEqual([link.id]);

			const [revoked] = await run({
				resource: 'device',
				operation: 'connectLink.destroy',
				link: String(link.id),
			});
			expect(revoked).toEqual({ success: true });
			const [after] = await run({
				resource: 'device',
				operation: 'connectLink.show',
				link: String(link.id),
			});
			expect(after.status).toBe('revoked');
		});

		it('group participants: joined and left reach the trigger', async () => {
			hook.deliveries.length = 0;
			const staticData: IDataObject = {};
			const methods = new FunnelchatTrigger().webhookMethods.default;
			const ctx = hookContext(staticData, ['group_participant.joined', 'group_participant.left']);
			expect(await methods.create.call(ctx)).toBe(true);

			const group = { uid: '120363000000000099@g.us', name: 'e2e group' };
			for (const route of ['participant-joined', 'participant-left']) {
				const fired = await fetch(`${SANDBOX}/_sandbox/groups/${route}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ group, participant: { phone: '5491100000077', name: 'Ana' } }),
				});
				expect(fired.ok).toBe(true);
			}
			for (const type of ['group_participant.joined', 'group_participant.left']) {
				const event = await received(staticData, type);
				expect((event.data as IDataObject).group).toMatchObject({ uid: group.uid });
				expect((event.data as IDataObject).participant).toMatchObject({
					identity: '5491100000077',
				});
			}
			expect(await methods.delete.call(ctx)).toBe(true);
		});

		it('subscribe, signed message.status_changed with the client reference, and unsubscribe', async () => {
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
				additionalFields: { phone: PHONE, text: 'Hello', client_reference: 'e2e-event-1' },
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
				client_reference: 'e2e-event-1',
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

		it('form: create, publish, send and receive whatsapp_form.completed', async () => {
			hook.deliveries.length = 0;
			const staticData: IDataObject = {};
			const methods = new FunnelchatTrigger().webhookMethods.default;
			const ctx = hookContext(staticData, ['whatsapp_form.completed']);
			expect(await methods.create.call(ctx)).toBe(true);

			// Forms only go out from the official number (3), inside the 24-hour window.
			const [created] = await run({
				resource: 'form',
				operation: 'whatsappForm.store',
				device_id: '3',
				template_key: 'lead',
				useJsonBody: false,
				additionalFields: {},
			});
			const form = created.data as IDataObject;
			await run({ resource: 'form', operation: 'whatsappForm.publish', id: String(form.id) });
			const window = await fetch(`${SANDBOX}/_sandbox/window`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contact_id: CONTACT, device_id: 3, open: true }),
			});
			expect(window.ok).toBe(true);

			const [sent] = await run({
				resource: 'form',
				operation: 'whatsappFormSend.store',
				contact: String(CONTACT),
				form_id: String(form.family_id),
				device_id: '3',
				useJsonBody: false,
				additionalFields: { client_reference: 'e2e-form-1' },
			});
			expect(sent).toMatchObject({
				type: 'whatsapp_form',
				status: 'queued',
				client_reference: 'e2e-form-1',
			});

			const complete = await fetch(`${SANDBOX}/_sandbox/forms/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message_id: sent.id }),
			});
			expect(complete.ok).toBe(true);
			const delivery = await until('whatsapp_form.completed', () =>
				hook.deliveries.find(
					(d) =>
						(JSON.parse(d.raw.toString('utf8')) as IDataObject).type === 'whatsapp_form.completed',
				),
			);
			const result = await deliver(staticData, delivery);
			const event = result.workflowData?.[0][0].json as IDataObject;
			expect(event.data).toMatchObject({
				form: { id: form.family_id },
				message_id: sent.id,
				contact_id: CONTACT,
			});
			expect(Array.isArray((event.data as IDataObject).answers)).toBe(true);

			expect(await methods.delete.call(ctx)).toBe(true);
		});
	});
});
