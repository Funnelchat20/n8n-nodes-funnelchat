import { createHmac } from 'crypto';
import { NodeApiError, NodeOperationError, type IDataObject } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import { FunnelchatTrigger, getEvents } from '../nodes/FunnelchatTrigger/FunnelchatTrigger.node';
import { EVENT_CATALOG } from '../nodes/FunnelchatTrigger/generated/events';
import vectors from './fixtures/firmas.json';
import {
	hookContext,
	loadOptionsContext,
	requestLine,
	TEST_WEBHOOK_URL,
	webhookContext,
	WEBHOOK_URL,
} from './mocks';

/*
 * The create/check/delete cycle of the subscription against simulated responses shaped like accounts v1.4.24
 * (300cc8435) (WebhookSubscriptionController: the resource goes unwrapped, `secret` only on creation, 204 on delete).
 */

const SUBSCRIPTION_ID = '0f486bfd-2f55-4ed6-8a12-b09e31a6ac08';
const SIGNING_VALUE = vectors.secreto;
const trigger = new FunnelchatTrigger();
const methods = trigger.webhookMethods.default;

function subscription(overrides: IDataObject = {}): IDataObject {
	return {
		id: SUBSCRIPTION_ID,
		url: WEBHOOK_URL,
		description: 'n8n · My workflow',
		events: ['message.received', 'contact.created'],
		filters: {},
		status: 'active',
		disabled_reason: null,
		...overrides,
	};
}

const PARAMS = { events: ['message.received', 'contact.created'], options: {} };

describe("the trigger's subscription cycle", () => {
	it('without a stored subscription, checkExists does not call the API and returns false', async () => {
		const { ctx, calls } = hookContext({ params: PARAMS, responses: [] });
		await expect(methods.checkExists.call(ctx)).resolves.toBe(false);
		expect(calls).toHaveLength(0);
	});

	it("create registers the subscription with n8n's URL and stores its id and secret", async () => {
		const { ctx, calls, staticData } = hookContext({
			params: { ...PARAMS, options: { campaignIds: 'campaign-1, campaign-2' } },
			responses: [
				{
					status: 201,
					body: {
						...subscription({ filters: { campaign_ids: ['campaign-1', 'campaign-2'] } }),
						secret: SIGNING_VALUE,
						secret_notice: 'Keep this secret now.',
					},
				},
			],
		});
		await expect(methods.create.call(ctx)).resolves.toBe(true);

		expect(requestLine(calls[0])).toBe('POST /api/v1/webhooks');
		expect(calls[0].options.body).toEqual({
			url: WEBHOOK_URL,
			events: ['message.received', 'contact.created'],
			description: 'n8n · My workflow',
			filters: { campaign_ids: ['campaign-1', 'campaign-2'] },
		});
		expect(staticData.subscriptions).toEqual({
			[WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE },
		});
	});

	it('checkExists confirms the stored subscription if it matches', async () => {
		const { ctx, calls } = hookContext({
			params: PARAMS,
			staticData: {
				subscriptions: { [WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE } },
			},
			responses: [{ body: subscription({ events: ['contact.created', 'message.received'] }) }],
		});
		await expect(methods.checkExists.call(ctx)).resolves.toBe(true);
		expect(calls.map(requestLine)).toEqual([`GET /api/v1/webhooks/${SUBSCRIPTION_ID}`]);
	});

	it('if the events changed, it updates it in place (the secret does not change)', async () => {
		const stored = {
			subscriptions: { [WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE } },
		};
		const { ctx, calls, staticData } = hookContext({
			params: { events: ['group_participant.joined'], options: {} },
			staticData: stored,
			responses: [
				{ body: subscription() },
				{ body: subscription({ events: ['group_participant.joined'] }) },
			],
		});
		await expect(methods.checkExists.call(ctx)).resolves.toBe(true);
		expect(calls.map(requestLine)).toEqual([
			`GET /api/v1/webhooks/${SUBSCRIPTION_ID}`,
			`PUT /api/v1/webhooks/${SUBSCRIPTION_ID}`,
		]);
		expect(calls[1].options.body).toEqual({
			url: WEBHOOK_URL,
			events: ['group_participant.joined'],
			description: 'n8n · My workflow',
			status: 'active',
		});
		expect(staticData.subscriptions).toEqual(stored.subscriptions);
	});

	it('if it no longer exists in Funnelchat (404), it forgets it and returns false', async () => {
		const { ctx, staticData } = hookContext({
			params: PARAMS,
			staticData: {
				subscriptions: { [WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE } },
			},
			responses: [{ status: 404, body: { message: 'Suscripción de webhook no encontrada.' } }],
		});
		await expect(methods.checkExists.call(ctx)).resolves.toBe(false);
		expect(staticData.subscriptions).toBeUndefined();
	});

	it('if it was disabled, it deletes it and returns false to create another one', async () => {
		const { ctx, calls, staticData } = hookContext({
			params: PARAMS,
			staticData: {
				subscriptions: { [WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE } },
			},
			responses: [
				{ body: subscription({ status: 'disabled', disabled_reason: 'key_revoked' }) },
				{ status: 204, body: '' },
			],
		});
		await expect(methods.checkExists.call(ctx)).resolves.toBe(false);
		expect(calls.map(requestLine)).toEqual([
			`GET /api/v1/webhooks/${SUBSCRIPTION_ID}`,
			`DELETE /api/v1/webhooks/${SUBSCRIPTION_ID}`,
		]);
		expect(staticData.subscriptions).toBeUndefined();
	});

	it("delete removes this URL's subscription and keeps the other URL's", async () => {
		const testId = '11111111-2222-4333-8444-555555555555';
		const { ctx, calls, staticData } = hookContext({
			params: PARAMS,
			staticData: {
				subscriptions: {
					[WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE },
					[TEST_WEBHOOK_URL]: { id: testId, secret: SIGNING_VALUE },
				},
			},
			responses: [{ status: 204, body: '' }],
		});
		await expect(methods.delete.call(ctx)).resolves.toBe(true);
		expect(calls.map(requestLine)).toEqual([`DELETE /api/v1/webhooks/${SUBSCRIPTION_ID}`]);
		expect(staticData.subscriptions).toEqual({
			[TEST_WEBHOOK_URL]: { id: testId, secret: SIGNING_VALUE },
		});
	});

	it('delete with a 404 forgets it anyway', async () => {
		const { ctx, staticData } = hookContext({
			params: PARAMS,
			staticData: {
				subscriptions: { [WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE } },
			},
			responses: [{ status: 404, body: { message: 'Suscripción de webhook no encontrada.' } }],
		});
		await expect(methods.delete.call(ctx)).resolves.toBe(true);
		expect(staticData.subscriptions).toBeUndefined();
	});

	it('the full cycle: create, check, delete', async () => {
		const staticData: IDataObject = {};
		const created = hookContext({
			params: PARAMS,
			staticData,
			responses: [{ status: 201, body: { ...subscription(), secret: SIGNING_VALUE } }],
		});
		expect(await methods.checkExists.call(created.ctx)).toBe(false);
		expect(await methods.create.call(created.ctx)).toBe(true);

		const checked = hookContext({
			params: PARAMS,
			staticData,
			responses: [{ body: subscription() }],
		});
		expect(await methods.checkExists.call(checked.ctx)).toBe(true);

		const deleted = hookContext({
			params: PARAMS,
			staticData,
			responses: [{ status: 204, body: '' }],
		});
		expect(await methods.delete.call(deleted.ctx)).toBe(true);
		expect(staticData).toEqual({});
		expect([...created.calls, ...checked.calls, ...deleted.calls].map(requestLine)).toEqual([
			'POST /api/v1/webhooks',
			`GET /api/v1/webhooks/${SUBSCRIPTION_ID}`,
			`DELETE /api/v1/webhooks/${SUBSCRIPTION_ID}`,
		]);
	});

	it('if the creation response has no secret, it fails with a clear error', async () => {
		const { ctx } = hookContext({
			params: PARAMS,
			responses: [{ status: 201, body: subscription() }],
		});
		const error = await methods.create.call(ctx).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(NodeOperationError);
		expect((error as Error).message).toContain('did not include its id or its secret');
	});

	it("without the read permission of an event's area, creating fails with accounts' 422", async () => {
		const { ctx, staticData } = hookContext({
			params: PARAMS,
			responses: [
				{
					status: 422,
					headers: { 'x-request-id': '7d1c2b3a-4e5f-4a6b-8c7d-9e0f1a2b3c4d' },
					body: {
						message:
							'La clave de API no tiene permiso de lectura sobre el área de estos eventos: conversations:read.',
						errors: {
							events: [
								'La clave de API no tiene permiso de lectura sobre el área de estos eventos: conversations:read.',
							],
						},
					},
				},
			],
		});
		const error = (await methods.create.call(ctx).catch((e: unknown) => e)) as NodeApiError;
		expect(error).toBeInstanceOf(NodeApiError);
		expect(error.message).toContain('conversations:read');
		expect(error.description).toContain('events: La clave de API no tiene permiso de lectura');
		expect(error.description).toContain('X-Request-Id: 7d1c2b3a-4e5f-4a6b-8c7d-9e0f1a2b3c4d');
		expect(staticData.subscriptions).toBeUndefined();
	});
});

describe('deliveries: signature check', () => {
	const body = Buffer.from(vectors.cuerpo, 'utf8');
	const staticData = {
		subscriptions: { [WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE } },
	};

	function sign(raw: Buffer, key: string, t = Math.floor(Date.now() / 1000)): string {
		return `t=${t},v1=${createHmac('sha256', key).update(`${t}.`).update(raw).digest('hex')}`;
	}

	it('a properly signed delivery starts the workflow with the event', async () => {
		const { ctx, response } = webhookContext({
			rawBody: body,
			headers: { 'x-funnelchat-signature': sign(body, SIGNING_VALUE) },
			staticData,
		});
		const result = await trigger.webhook.call(ctx);
		expect(response.status).not.toHaveBeenCalled();
		expect(result.workflowData?.[0][0].json).toEqual(JSON.parse(vectors.cuerpo));
	});

	it('the secret of any of its subscriptions works (test and production)', async () => {
		const otherKey = 'another-test-secret';
		const { ctx } = webhookContext({
			rawBody: body,
			headers: { 'x-funnelchat-signature': sign(body, otherKey) },
			staticData: {
				subscriptions: {
					[WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE },
					[TEST_WEBHOOK_URL]: { id: 'other', secret: otherKey },
				},
			},
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	for (const [name, headers, raw] of [
		[
			'signature with another secret',
			{ 'x-funnelchat-signature': sign(body, 'another-test-secret') },
			body,
		],
		['without a signature header', {}, body],
		[
			'altered body',
			{ 'x-funnelchat-signature': sign(body, SIGNING_VALUE) },
			Buffer.from(vectors.cuerpo.replace('Hola', 'Hole')),
		],
		[
			'old signature (10 min ago)',
			{ 'x-funnelchat-signature': sign(body, SIGNING_VALUE, Math.floor(Date.now() / 1000) - 600) },
			body,
		],
	] as Array<[string, IDataObject, Buffer]>) {
		it(`rejects with 400: ${name}`, async () => {
			const { ctx, response } = webhookContext({ rawBody: raw, headers, staticData });
			const result = await trigger.webhook.call(ctx);
			expect(result).toEqual({ noWebhookResponse: true });
			expect(response.status).toHaveBeenCalledWith(400);
			expect(response.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: 'invalid_signature' }),
			);
		});
	}

	it('without a stored subscription, no delivery gets through', async () => {
		const { ctx, response } = webhookContext({
			rawBody: body,
			headers: { 'x-funnelchat-signature': sign(body, SIGNING_VALUE) },
			staticData: {},
		});
		await trigger.webhook.call(ctx);
		expect(response.status).toHaveBeenCalledWith(400);
	});
});

describe('event list from the catalog', () => {
	it('shows the types that can be subscribed to, with their status and area, in English when the node knows them', async () => {
		const { ctx, calls } = loadOptionsContext([
			{
				body: {
					data: [
						{
							type: 'webhook.test',
							area: 'accounts',
							status: 'active',
							label: 'Evento de prueba',
							description: 'Prueba.',
							subscribable: false,
						},
						{
							type: 'message.received',
							area: 'conversations',
							status: 'active',
							label: 'Mensaje recibido',
							description: 'Un contacto escribió.',
							subscribable: true,
						},
						{
							type: 'message.status_changed',
							area: 'conversations',
							status: 'planned',
							label: 'Estado de mensaje cambiado',
							description: 'Cambió el estado.',
							subscribable: true,
						},
						{
							type: 'device.disconnected',
							area: 'accounts',
							status: 'active',
							label: 'Número desconectado',
							description: 'Se desconectó.',
							subscribable: true,
						},
						{
							type: 'nuevo.evento',
							area: 'conversations',
							status: 'active',
							label: 'Evento nuevo',
							description: 'Un tipo que el nodo todavía no conoce.',
							subscribable: true,
						},
					],
					meta: { total: 4, active: 3 },
				},
			},
		]);
		const options = await getEvents.call(ctx);
		expect(requestLine(calls[0])).toBe('GET /api/v1/webhooks/events');
		expect(calls[0].options.baseURL).toBe('https://api-staging.funnelchat.com');
		expect(options.map((o) => o.value)).toEqual([
			'nuevo.evento',
			'message.received',
			'message.status_changed',
			'device.disconnected',
		]);
		const statusChanged = EVENT_CATALOG.find((e) => e.type === 'message.status_changed')!;
		expect(options.find((o) => o.value === 'message.status_changed')).toEqual({
			name: 'Message status changed (message.status_changed)',
			value: 'message.status_changed',
			description: `${statusChanged.description} Not emitted yet (planned). Area: conversations; with an API key it needs conversations:read.`,
		});
		// A type the node does not know yet keeps the catalog's own texts.
		expect(options[0].name).toBe('Evento nuevo (nuevo.evento)');
	});

	it("if the key cannot read the catalog, it shows the node's list (accounts v1.4.24 catalog)", async () => {
		const { ctx, calls } = loadOptionsContext([
			{
				status: 403,
				body: {
					error: 'permission_denied',
					message: 'Esta API key no tiene el permiso accounts:read.',
				},
			},
		]);
		const options = await getEvents.call(ctx);
		expect(calls).toHaveLength(1);
		const values = options.map((o) => o.value);
		expect(values).toEqual(
			EVENT_CATALOG.map((e) => e.type).sort((a, b) => {
				const name = (t: string) => {
					const e = EVENT_CATALOG.find((x) => x.type === t)!;
					return `${e.label} (${e.type})`;
				};
				return name(a).localeCompare(name(b), 'en');
			}),
		);
		for (const type of [
			'message.received',
			'message.status_changed',
			'whatsapp_form.completed',
			'group.message_received',
			'group_action.completed',
			'group.reaction_added',
			'device.disconnected',
		])
			expect(values).toContain(type);
		expect(values).not.toContain('webhook.test');
		const form = options.find((o) => o.value === 'whatsapp_form.completed')!;
		expect(form.name).toBe('WhatsApp form completed (whatsapp_form.completed)');
		expect(form.description).toContain('with an API key it needs conversations:read');
	});
});
