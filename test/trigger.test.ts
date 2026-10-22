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
		description: 'n8n · Mi flujo',
		events: ['message.received', 'contact.created'],
		filters: {},
		status: 'active',
		disabled_reason: null,
		...overrides,
	};
}

const PARAMS = { events: ['message.received', 'contact.created'], options: {} };

describe('ciclo de la suscripción del disparador', () => {
	it('sin suscripción guardada, checkExists no llama a la API y devuelve false', async () => {
		const { ctx, calls } = hookContext({ params: PARAMS, responses: [] });
		await expect(methods.checkExists.call(ctx)).resolves.toBe(false);
		expect(calls).toHaveLength(0);
	});

	it('create da de alta la suscripción con la URL de n8n y guarda id y secreto', async () => {
		const { ctx, calls, staticData } = hookContext({
			params: { ...PARAMS, options: { campaignIds: 'campania-1, campania-2' } },
			responses: [
				{
					status: 201,
					body: {
						...subscription({ filters: { campaign_ids: ['campania-1', 'campania-2'] } }),
						secret: SIGNING_VALUE,
						secret_notice: 'Guardá este secreto ahora.',
					},
				},
			],
		});
		await expect(methods.create.call(ctx)).resolves.toBe(true);

		expect(requestLine(calls[0])).toBe('POST /api/v1/webhooks');
		expect(calls[0].options.body).toEqual({
			url: WEBHOOK_URL,
			events: ['message.received', 'contact.created'],
			description: 'n8n · Mi flujo',
			filters: { campaign_ids: ['campania-1', 'campania-2'] },
		});
		expect(staticData.subscriptions).toEqual({
			[WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE },
		});
	});

	it('checkExists confirma la suscripción guardada si coincide', async () => {
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

	it('si cambiaron los eventos, la actualiza en el lugar (el secreto no cambia)', async () => {
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
			description: 'n8n · Mi flujo',
			status: 'active',
		});
		expect(staticData.subscriptions).toEqual(stored.subscriptions);
	});

	it('si en Funnelchat ya no existe (404), la olvida y devuelve false', async () => {
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

	it('si quedó deshabilitada, la borra y devuelve false para crear otra', async () => {
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

	it('delete borra la suscripción de esta URL y deja la de la otra URL', async () => {
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

	it('delete con 404 igual la olvida', async () => {
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

	it('el ciclo completo: crear, confirmar, borrar', async () => {
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

	it('si la respuesta del alta no trae el secreto, falla con un error claro', async () => {
		const { ctx } = hookContext({
			params: PARAMS,
			responses: [{ status: 201, body: subscription() }],
		});
		const error = await methods.create.call(ctx).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(NodeOperationError);
		expect((error as Error).message).toContain('no trajo su id o su secreto');
	});

	it('sin el permiso de lectura del área de un evento, el alta falla con el 422 de accounts', async () => {
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

describe('entregas: verificación de la firma', () => {
	const body = Buffer.from(vectors.cuerpo, 'utf8');
	const staticData = {
		subscriptions: { [WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE } },
	};

	function sign(raw: Buffer, key: string, t = Math.floor(Date.now() / 1000)): string {
		return `t=${t},v1=${createHmac('sha256', key).update(`${t}.`).update(raw).digest('hex')}`;
	}

	it('una entrega bien firmada arranca el flujo con el evento', async () => {
		const { ctx, response } = webhookContext({
			rawBody: body,
			headers: { 'x-funnelchat-signature': sign(body, SIGNING_VALUE) },
			staticData,
		});
		const result = await trigger.webhook.call(ctx);
		expect(response.status).not.toHaveBeenCalled();
		expect(result.workflowData?.[0][0].json).toEqual(JSON.parse(vectors.cuerpo));
	});

	it('vale el secreto de cualquiera de sus suscripciones (prueba y producción)', async () => {
		const otherKey = 'otro-secreto-de-prueba';
		const { ctx } = webhookContext({
			rawBody: body,
			headers: { 'x-funnelchat-signature': sign(body, otherKey) },
			staticData: {
				subscriptions: {
					[WEBHOOK_URL]: { id: SUBSCRIPTION_ID, secret: SIGNING_VALUE },
					[TEST_WEBHOOK_URL]: { id: 'otro', secret: otherKey },
				},
			},
		});
		const result = await trigger.webhook.call(ctx);
		expect(result.workflowData).toBeDefined();
	});

	for (const [nombre, headers, raw] of [
		[
			'firma de otro secreto',
			{ 'x-funnelchat-signature': sign(body, 'otro-secreto-de-prueba') },
			body,
		],
		['sin cabecera de firma', {}, body],
		[
			'cuerpo alterado',
			{ 'x-funnelchat-signature': sign(body, SIGNING_VALUE) },
			Buffer.from(vectors.cuerpo.replace('Hola', 'Hole')),
		],
		[
			'firma vieja (hace 10 min)',
			{ 'x-funnelchat-signature': sign(body, SIGNING_VALUE, Math.floor(Date.now() / 1000) - 600) },
			body,
		],
	] as Array<[string, IDataObject, Buffer]>) {
		it(`rechaza con 400: ${nombre}`, async () => {
			const { ctx, response } = webhookContext({ rawBody: raw, headers, staticData });
			const result = await trigger.webhook.call(ctx);
			expect(result).toEqual({ noWebhookResponse: true });
			expect(response.status).toHaveBeenCalledWith(400);
			expect(response.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: 'invalid_signature' }),
			);
		});
	}

	it('sin suscripción guardada, ninguna entrega pasa', async () => {
		const { ctx, response } = webhookContext({
			rawBody: body,
			headers: { 'x-funnelchat-signature': sign(body, SIGNING_VALUE) },
			staticData: {},
		});
		await trigger.webhook.call(ctx);
		expect(response.status).toHaveBeenCalledWith(400);
	});
});

describe('lista de eventos desde el catálogo', () => {
	it('muestra los tipos que se pueden suscribir, con su estado y área', async () => {
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
					],
					meta: { total: 4, active: 3 },
				},
			},
		]);
		const options = await getEvents.call(ctx);
		expect(requestLine(calls[0])).toBe('GET /api/v1/webhooks/events');
		expect(calls[0].options.baseURL).toBe('https://api-staging.funnelchat.com');
		expect(options.map((o) => o.value)).toEqual([
			'message.status_changed',
			'message.received',
			'device.disconnected',
		]);
		expect(options[0]).toEqual({
			name: 'Estado de mensaje cambiado (message.status_changed)',
			value: 'message.status_changed',
			description:
				'Cambió el estado. Todavía no se emite (planned). Área: conversations; con una clave pide conversations:read.',
		});
	});

	it('si la clave no puede leer el catálogo, muestra la lista del nodo (catálogo de accounts v1.4.24)', async () => {
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
				return name(a).localeCompare(name(b), 'es');
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
		expect(form.name).toBe('Formulario de WhatsApp completado (whatsapp_form.completed)');
		expect(form.description).toContain('con una clave pide conversations:read');
	});
});
