import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import { Funnelchat } from '../nodes/Funnelchat/Funnelchat.node';
import { OPERATIONS } from '../nodes/Funnelchat/generated/operations';
import type { OperationSpec } from '../nodes/Funnelchat/operationTypes';
import { buildRequest, RequestBuildError, toUrl } from '../nodes/Funnelchat/request';
import { funnelchatApiRequest } from '../nodes/shared/transport';
import { executeContext, requestLine } from './mocks';

/** The generated operation, so these tests follow the specification and not a hand-written copy. */
function op(value: string): OperationSpec {
	const found = OPERATIONS.find((o) => o.value === value);
	if (!found) throw new Error(`No está la operación ${value}`);
	return found;
}

function url(value: string, values: Record<string, unknown>, jsonBody?: unknown): string {
	const built = buildRequest(op(value), values, jsonBody);
	return `${built.method} ${decodeURIComponent(toUrl(built.path, built.query))}`;
}

describe('armado de pedidos (buildRequest)', () => {
	it('Listar contactos: filtros simples, listas con [] y modo de etiquetas', () => {
		expect(
			url('contact.index', {
				name: 'Ana',
				tag_ids: '1, 2',
				tag_mode: 'any',
				lead_score_min: 40,
				country_codes: ['AR', 'UY'],
			}),
		).toBe(
			'GET /api/v1/contacts?name=Ana&country_codes[]=AR&country_codes[]=UY&tag_ids[]=1&tag_ids[]=2&tag_mode=any&lead_score_min=40',
		);
	});

	it('Listar contactos: un filtro con objetos (deepObject) va con índices', () => {
		expect(url('contact.index', { tag_filters: '[{"mode":"all","tag_ids":[3,4]}]' })).toBe(
			'GET /api/v1/contacts?tag_filters[0][mode]=all&tag_filters[0][tag_ids][]=3&tag_filters[0][tag_ids][]=4',
		);
	});

	it('Listar conversaciones: los booleanos van como 1/0 y lo vacío no se manda', () => {
		expect(url('conversation.index', { favorites: true, unreadMessages: false, perName: '' })).toBe(
			'GET /api/v1/conversations?favorites=1&unreadMessages=0',
		);
	});

	it('Crear o actualizar un contacto: cuerpo con los campos cargados', () => {
		const built = buildRequest(op('contact.updateOrCreate'), {
			phone: '5491100000099',
			name: 'Ana',
			email: '',
		});
		expect(built).toEqual({
			method: 'POST',
			path: '/api/v1/contacts/update-or-create',
			query: [],
			body: { phone: '5491100000099', name: 'Ana' },
		});
	});

	it('Crear o actualizar un contacto: sin teléfono, no sale el pedido', () => {
		expect(() => buildRequest(op('contact.updateOrCreate'), { name: 'Ana' })).toThrow(
			RequestBuildError,
		);
		expect(() => buildRequest(op('contact.updateOrCreate'), { name: 'Ana' })).toThrow(
			'Falta «Teléfono».',
		);
	});

	it('Enviar un mensaje a un contacto: ruta con el contacto y los ids como enteros', () => {
		const built = buildRequest(op('conversation.sendMessage'), {
			contact: '2001',
			device_id: '7',
			contact_id: 2001,
			text: 'Hola, ¿en qué te ayudo?',
			link_preview: false,
		});
		expect(built).toEqual({
			method: 'POST',
			path: '/api/v1/contacts/2001/message',
			query: [],
			body: {
				device_id: 7,
				contact_id: 2001,
				text: 'Hola, ¿en qué te ayudo?',
				link_preview: false,
			},
		});
	});

	it('un id que no es número se rechaza antes de llamar a la API', () => {
		expect(() =>
			buildRequest(op('conversation.sendMessage'), {
				contact: '1',
				device_id: 'abc',
				contact_id: 1,
			}),
		).toThrow('«ID del número» tiene que ser un número');
	});

	it('Eliminar etiquetas: una lista separada por comas', () => {
		expect(buildRequest(op('tag.destroy'), { tagIds: '3, 4' }).body).toEqual({
			tagIds: ['3', '4'],
		});
	});

	it('Asignar un campo personalizado: el cuerpo es una lista JSON', () => {
		const built = buildRequest(op('contact.attachCustomField'), {
			body: '[{"customFieldId":5,"contactId":2001,"value":"Premium"}]',
		});
		expect(built.body).toEqual([{ customFieldId: 5, contactId: 2001, value: 'Premium' }]);
	});

	it('Ver un contacto: el id va escapado en la ruta', () => {
		expect(buildRequest(op('contact.show'), { contact: '12/../3' }).path).toBe(
			'/api/v1/contacts/12%2F..%2F3',
		);
	});

	it('Actualizar una suscripción de webhook (suplemento de accounts): uuid, objeto JSON y opción', () => {
		const built = buildRequest(op('webhookSubscription.update'), {
			id: '0f486bfd-2f55-4ed6-8a12-b09e31a6ac08',
			url: 'https://n8n.example.com/webhook/abc',
			events: 'message.received, contact.created',
			filters: { campaign_ids: ['campania-1'] },
			status: 'paused',
		});
		expect(built).toEqual({
			method: 'PUT',
			path: '/api/v1/webhooks/0f486bfd-2f55-4ed6-8a12-b09e31a6ac08',
			query: [],
			body: {
				url: 'https://n8n.example.com/webhook/abc',
				events: ['message.received', 'contact.created'],
				filters: { campaign_ids: ['campania-1'] },
				status: 'paused',
			},
		});
	});

	it('Listar los registros de un número: fechas date-time tal cual, métodos con []', () => {
		expect(
			url('deviceLogs.index', { device: 9, from: '2026-10-15T00:00:00Z', methods: 'GET,POST' }),
		).toBe('GET /api/v1/devices/9/logs?from=2026-10-15T00:00:00Z&methods[]=GET&methods[]=POST');
	});

	it('Listar contactos: las fechas date se mandan como AAAA-MM-DD', () => {
		expect(url('contact.index', { custom_field_date_from: '2026-10-16T10:30:00' })).toBe(
			'GET /api/v1/contacts?custom_field_date_from=2026-10-16',
		);
	});

	it('con «Enviar el cuerpo como JSON» se usa ese cuerpo y la ruta sigue saliendo de los campos', () => {
		const built = buildRequest(
			op('contact.update'),
			{ contact: '55', name: 'ignorado' },
			'{"name":"Ana","email":null}',
		);
		expect(built).toEqual({
			method: 'PUT',
			path: '/api/v1/contacts/55',
			query: [],
			body: { name: 'Ana', email: null },
		});
	});

	it('un JSON inválido se explica', () => {
		expect(() => buildRequest(op('contact.attachCustomField'), { body: '[{' })).toThrow(
			'«Elementos (JSON)» no es un JSON válido.',
		);
	});
});

describe('ejecución del nodo con respuestas simuladas', () => {
	const node = new Funnelchat();

	it('Listar contactos con «devolver todo» recorre las páginas de Laravel', async () => {
		const { ctx, calls } = executeContext({
			params: {
				resource: 'contact',
				operation: 'contact.index',
				returnAll: true,
				filters: { name: 'Ana' },
			},
			responses: [
				{
					body: {
						data: [{ id: 1 }, { id: 2 }],
						meta: { current_page: 1, last_page: 2 },
						links: {},
					},
				},
				{ body: { data: [{ id: 3 }], meta: { current_page: 2, last_page: 2 }, links: {} } },
			],
		});
		const [out] = await node.execute.call(ctx);
		expect(out.map((i) => i.json.id)).toEqual([1, 2, 3]);
		expect(out.every((i) => (i.pairedItem as { item: number }).item === 0)).toBe(true);
		expect(calls.map(requestLine)).toEqual([
			'GET /api/v1/contacts?name=Ana&perPage=100&page=1',
			'GET /api/v1/contacts?name=Ana&perPage=100&page=2',
		]);
		expect(calls[0].credential).toBe('funnelchatApi');
		expect(calls[0].options.baseURL).toBe('https://api.funnelchat.com');
		expect(calls[0].options.returnFullResponse).toBe(true);
	});

	it('Listar conversaciones con límite: sigue el cursor y corta en el límite', async () => {
		const { ctx, calls } = executeContext({
			params: {
				resource: 'conversation',
				operation: 'conversation.index',
				returnAll: false,
				limit: 3,
			},
			environment: 'staging',
			responses: [
				{ body: { data: [{ id: 1 }, { id: 2 }], meta: { next_cursor: 'abc', per_page: 3 } } },
				{ body: { data: [{ id: 3 }, { id: 4 }], meta: { next_cursor: 'def', per_page: 3 } } },
			],
		});
		const [out] = await node.execute.call(ctx);
		expect(out.map((i) => i.json.id)).toEqual([1, 2, 3]);
		expect(calls.map(requestLine)).toEqual([
			'GET /api/v1/conversations?perPage=3',
			'GET /api/v1/conversations?perPage=3&cursor=abc',
		]);
		expect(calls[0].options.baseURL).toBe('https://api-staging.funnelchat.com');
	});

	it('Crear un contacto devuelve el contacto y un 204 vuelve como success', async () => {
		const create = executeContext({
			params: {
				resource: 'contact',
				operation: 'contact.store',
				useJsonBody: false,
				additionalFields: { phone: '5491100000099', name: 'Ana' },
			},
			responses: [{ body: { id: 10, phone: '5491100000099' } }],
		});
		const [created] = await node.execute.call(create.ctx);
		expect(created[0].json).toEqual({ id: 10, phone: '5491100000099' });
		expect(create.calls[0].options.body).toEqual({ phone: '5491100000099', name: 'Ana' });

		const remove = executeContext({
			params: { resource: 'contact', operation: 'contactNote.destroy', contact: '10', note: '3' },
			responses: [{ status: 204, body: '' }],
		});
		const [removed] = await node.execute.call(remove.ctx);
		expect(requestLine(remove.calls[0])).toBe('DELETE /api/v1/contacts/10/notes/3');
		expect(removed[0].json).toEqual({ success: true });
	});

	it('un error de la API sale con su message y su error', async () => {
		const { ctx } = executeContext({
			params: {
				resource: 'conversation',
				operation: 'conversation.sendMessage',
				contact: '1',
				device_id: '2',
				contact_id: '1',
				useJsonBody: false,
				additionalFields: { text: 'hola' },
			},
			responses: [
				{
					status: 403,
					body: {
						error: 'route_not_available',
						message: 'Esta ruta todavía no está disponible para claves.',
					},
				},
			],
		});
		const error = await node.execute.call(ctx).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(NodeApiError);
		expect((error as NodeApiError).message).toBe(
			'Esta ruta todavía no está disponible para claves.',
		);
		expect((error as NodeApiError).description).toContain('error: route_not_available');
		expect((error as NodeApiError).httpCode).toBe('403');
	});

	it('un 422 de validación lista los campos', async () => {
		const { ctx } = executeContext({
			params: {
				resource: 'tag',
				operation: 'tag.store',
				name: 'VIP',
				useJsonBody: false,
				additionalFields: {},
			},
			responses: [
				{
					status: 422,
					body: { message: 'El nombre ya existe.', errors: { name: ['El nombre ya existe.'] } },
				},
			],
		});
		const error = (await node.execute.call(ctx).catch((e: unknown) => e)) as NodeApiError;
		expect(error.message).toBe('El nombre ya existe.');
		expect(error.description).toContain('name: El nombre ya existe.');
	});

	it('con «continuar ante errores», el ítem lleva error y message de la API', async () => {
		const { ctx } = executeContext({
			continueOnFail: true,
			items: 2,
			params: { resource: 'tag', operation: 'tag.show', tag: '99' },
			responses: [
				{ status: 404, body: { error: 'not_found', message: 'No existe la etiqueta.' } },
				{ body: { id: 99, name: 'VIP' } },
			],
		});
		const [out] = await node.execute.call(ctx);
		expect(out[0].json).toEqual({
			error: 'not_found',
			message: 'No existe la etiqueta.',
			httpCode: '404',
		});
		expect(out[1].json).toEqual({ id: 99, name: 'VIP' });
		expect(out.map((i) => (i.pairedItem as { item: number }).item)).toEqual([0, 1]);
	});

	it('el X-Request-Id de la respuesta va en el error y en el ítem de «continuar ante errores»', async () => {
		const requestId = '0b3f5a1e-6c2d-4e8f-9a7b-1c2d3e4f5a6b';
		const failing = () =>
			executeContext({
				params: { resource: 'tag', operation: 'tag.show', tag: '99' },
				responses: [
					{
						status: 404,
						headers: { 'x-request-id': requestId },
						body: { error: 'not_found', message: 'No existe la etiqueta.' },
					},
				],
			});
		const error = (await node.execute.call(failing().ctx).catch((e: unknown) => e)) as NodeApiError;
		expect(error.description).toContain(`X-Request-Id: ${requestId}`);
		expect(error.context.requestId).toBe(requestId);

		const { ctx } = executeContext({
			continueOnFail: true,
			params: { resource: 'tag', operation: 'tag.show', tag: '99' },
			responses: [
				{
					status: 404,
					headers: { 'X-Request-Id': requestId },
					body: { error: 'not_found', message: 'No existe la etiqueta.' },
				},
			],
		});
		const [out] = await node.execute.call(ctx);
		expect(out[0].json).toEqual({
			error: 'not_found',
			message: 'No existe la etiqueta.',
			httpCode: '404',
			requestId,
		});
	});

	it('los errores propios de la entrada de la API (route_not_found) salen igual, con su id', async () => {
		const { ctx } = executeContext({
			params: { resource: 'tag', operation: 'tag.show', tag: '99' },
			responses: [
				{
					status: 404,
					headers: { 'x-request-id': 'edge-1' },
					body: { error: 'route_not_found', message: 'La ruta no existe en la API.' },
				},
			],
		});
		const error = (await node.execute.call(ctx).catch((e: unknown) => e)) as NodeApiError;
		expect(error.message).toBe('La ruta no existe en la API.');
		expect(error.description).toContain('error: route_not_found');
		expect(error.description).toContain('X-Request-Id: edge-1');
	});

	it('un 502 en una escritura avisa que puede haberse aplicado; en una lectura, no', async () => {
		const edge = {
			status: 502,
			headers: { 'x-request-id': 'edge-2' },
			body: { error: 'origin_unreachable', message: 'La API no está disponible en este momento.' },
		};
		const write = executeContext({
			params: {
				resource: 'tag',
				operation: 'tag.store',
				name: 'VIP',
				useJsonBody: false,
				additionalFields: {},
			},
			responses: [edge],
		});
		const writeError = (await node.execute
			.call(write.ctx)
			.catch((e: unknown) => e)) as NodeApiError;
		expect(writeError.httpCode).toBe('502');
		expect(writeError.description).toContain('revisá el estado antes de repetirlo');
		expect(write.calls).toHaveLength(1);

		const read = executeContext({
			params: { resource: 'tag', operation: 'tag.show', tag: '99' },
			responses: [edge],
		});
		const readError = (await node.execute.call(read.ctx).catch((e: unknown) => e)) as NodeApiError;
		expect(readError.description).not.toContain('revisá el estado');
	});

	it('un campo obligatorio vacío es un error del nodo, no un pedido', async () => {
		const { ctx, calls } = executeContext({
			params: { resource: 'contact', operation: 'contact.show', contact: '' },
			responses: [],
		});
		const error = await node.execute.call(ctx).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(NodeOperationError);
		expect((error as Error).message).toBe('Falta «ID del contacto».');
		expect(calls).toHaveLength(0);
	});
});

describe('429 y Retry-After', () => {
	it('espera lo que pide Retry-After y reintenta', async () => {
		const { ctx, calls } = executeContext({
			params: {},
			responses: [
				{
					status: 429,
					headers: { 'retry-after': '2' },
					body: { error: 'rate_limited', message: 'Más despacio.' },
				},
				{ body: { data: [] } },
			],
		});
		const wait = vi.fn(async () => undefined);
		const response = await funnelchatApiRequest.call(
			ctx,
			{ method: 'GET', url: '/api/v1/tags' },
			wait,
		);
		expect(response.statusCode).toBe(200);
		expect(wait).toHaveBeenCalledWith(2000);
		expect(calls).toHaveLength(2);
	});

	it('si la espera es larga, no reintenta y lo dice', async () => {
		const { ctx } = executeContext({
			params: {},
			responses: [
				{
					status: 429,
					headers: { 'Retry-After': '120' },
					body: { error: 'rate_limited', message: 'Más despacio.' },
				},
			],
		});
		const wait = vi.fn(async () => undefined);
		const error = (await funnelchatApiRequest
			.call(ctx, { method: 'GET', url: '/api/v1/tags' }, wait)
			.catch((e: unknown) => e)) as NodeApiError;
		expect(wait).not.toHaveBeenCalled();
		expect(error.message).toBe('Más despacio.');
		expect(error.description).toContain('error: rate_limited');
		expect(error.description).toContain('Volvé a intentar en 120 s (Retry-After).');
	});
});
