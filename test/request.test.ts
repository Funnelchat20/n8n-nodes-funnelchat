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
	if (!found) throw new Error(`Operation ${value} is missing`);
	return found;
}

function url(value: string, values: Record<string, unknown>, jsonBody?: unknown): string {
	const built = buildRequest(op(value), values, jsonBody);
	return `${built.method} ${decodeURIComponent(toUrl(built.path, built.query))}`;
}

describe('building requests (buildRequest)', () => {
	it('List contacts: simple filters, lists with [] and tag mode', () => {
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

	it('List contacts: a filter with objects (deepObject) goes with indexes', () => {
		expect(url('contact.index', { tag_filters: '[{"mode":"all","tag_ids":[3,4]}]' })).toBe(
			'GET /api/v1/contacts?tag_filters[0][mode]=all&tag_filters[0][tag_ids][]=3&tag_filters[0][tag_ids][]=4',
		);
	});

	it('List conversations: booleans go as 1/0 and empty values are not sent', () => {
		expect(url('conversation.index', { favorites: true, unreadMessages: false, perName: '' })).toBe(
			'GET /api/v1/conversations?favorites=1&unreadMessages=0',
		);
	});

	it('Create or update a contact: body with the filled fields', () => {
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

	it('Create or update a contact: without a phone, no request goes out', () => {
		expect(() => buildRequest(op('contact.updateOrCreate'), { name: 'Ana' })).toThrow(
			RequestBuildError,
		);
		expect(() => buildRequest(op('contact.updateOrCreate'), { name: 'Ana' })).toThrow(
			'Missing "Phone".',
		);
	});

	it('Send a message to a contact: route with the contact and IDs as integers', () => {
		const built = buildRequest(op('conversation.sendMessage'), {
			contact: '2001',
			device_id: '7',
			contact_id: 2001,
			text: 'Hi, how can I help you?',
			link_preview: false,
		});
		expect(built).toEqual({
			method: 'POST',
			path: '/api/v1/contacts/2001/message',
			query: [],
			body: {
				device_id: 7,
				contact_id: 2001,
				text: 'Hi, how can I help you?',
				link_preview: false,
			},
		});
	});

	it('Send a message to a contact: file by URL with type, name and client reference', () => {
		const built = buildRequest(op('conversation.sendMessage'), {
			contact: '2001',
			device_id: '7',
			contact_id: 2001,
			phone: '5491100000000',
			file: 'https://cdn.example.com/f?id=9&signature=abc',
			file_type: 'document',
			file_name: 'invoice.pdf',
			client_reference: 'order-981',
		});
		expect(built.body).toEqual({
			device_id: 7,
			contact_id: 2001,
			phone: '5491100000000',
			file: 'https://cdn.example.com/f?id=9&signature=abc',
			file_type: 'document',
			file_name: 'invoice.pdf',
			client_reference: 'order-981',
		});
	});

	it('Send a form to a contact: form_id and device_id as integers', () => {
		const built = buildRequest(op('whatsappFormSend.store'), {
			contact: '2001',
			form_id: '8001',
			device_id: '7',
			button_text: 'Fill in',
		});
		expect(built).toEqual({
			method: 'POST',
			path: '/api/v1/contacts/2001/message/form',
			query: [],
			body: { form_id: 8001, device_id: 7, button_text: 'Fill in' },
		});
	});

	it('Get a message, and the form routes by version and by form', () => {
		expect(url('showMessage', { contact: '2001', message: '1001' })).toBe(
			'GET /api/v1/contacts/2001/messages/1001',
		);
		expect(url('whatsappForm.publish', { id: '8105' })).toBe('POST /api/v1/forms/8105/publish');
		expect(
			url('whatsappForm.responses', { familyId: '8001', status: 'completed', from: '2026-10-01' }),
		).toBe('GET /api/v1/forms/families/8001/responses?from=2026-10-01&status=completed');
	});

	it('an ID that is not a number is rejected before calling the API', () => {
		expect(() =>
			buildRequest(op('conversation.sendMessage'), {
				contact: '1',
				device_id: 'abc',
				contact_id: 1,
			}),
		).toThrow('"Number ID" has to be a number');
	});

	it('Delete tags: a comma-separated list', () => {
		expect(buildRequest(op('tag.destroy'), { tagIds: '3, 4' }).body).toEqual({
			tagIds: ['3', '4'],
		});
	});

	it('Set a custom field on contacts: the body is a JSON list', () => {
		const built = buildRequest(op('contact.attachCustomField'), {
			body: '[{"customFieldId":5,"contactId":2001,"value":"Premium"}]',
		});
		expect(built.body).toEqual([{ customFieldId: 5, contactId: 2001, value: 'Premium' }]);
	});

	it('Get a contact: the ID is escaped in the route', () => {
		expect(buildRequest(op('contact.show'), { contact: '12/../3' }).path).toBe(
			'/api/v1/contacts/12%2F..%2F3',
		);
	});

	it('Update a webhook subscription (accounts supplement): UUID, JSON object and option', () => {
		const built = buildRequest(op('webhookSubscription.update'), {
			id: '0f486bfd-2f55-4ed6-8a12-b09e31a6ac08',
			url: 'https://n8n.example.com/webhook/abc',
			events: 'message.received, contact.created',
			filters: { campaign_ids: ['campaign-1'] },
			status: 'paused',
		});
		expect(built).toEqual({
			method: 'PUT',
			path: '/api/v1/webhooks/0f486bfd-2f55-4ed6-8a12-b09e31a6ac08',
			query: [],
			body: {
				url: 'https://n8n.example.com/webhook/abc',
				events: ['message.received', 'contact.created'],
				filters: { campaign_ids: ['campaign-1'] },
				status: 'paused',
			},
		});
	});

	it("List a number's logs: date-time values as given, methods with []", () => {
		expect(
			url('deviceLogs.index', { device: 9, from: '2026-10-15T00:00:00Z', methods: 'GET,POST' }),
		).toBe('GET /api/v1/devices/9/logs?from=2026-10-15T00:00:00Z&methods[]=GET&methods[]=POST');
	});

	it('List contacts: date values are sent as YYYY-MM-DD', () => {
		expect(url('contact.index', { custom_field_date_from: '2026-10-16T10:30:00' })).toBe(
			'GET /api/v1/contacts?custom_field_date_from=2026-10-16',
		);
	});

	it('with "Send Body as JSON" that body is used and the route still comes from the fields', () => {
		const built = buildRequest(
			op('contact.update'),
			{ contact: '55', name: 'ignored' },
			'{"name":"Ana","email":null}',
		);
		expect(built).toEqual({
			method: 'PUT',
			path: '/api/v1/contacts/55',
			query: [],
			body: { name: 'Ana', email: null },
		});
	});

	it('invalid JSON is explained', () => {
		expect(() => buildRequest(op('contact.attachCustomField'), { body: '[{' })).toThrow(
			'"Items (JSON)" is not valid JSON.',
		);
	});
});

describe('running the node with simulated responses', () => {
	const node = new Funnelchat();

	it('List contacts with "Return All" goes through the Laravel pages', async () => {
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

	it('List conversations with a limit: follows the cursor and stops at the limit', async () => {
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

	it('Create a contact returns the contact, and a 204 comes back as success', async () => {
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

	it('a send returns the queued message, not the envelope', async () => {
		const queued = {
			id: 1001,
			contact_id: 2001,
			device_id: 7,
			direction: 'outbound',
			type: 'text',
			status: 'queued',
			error: null,
			client_reference: 'order-981',
			created_at: '2026-10-22T13:05:00Z',
			updated_at: '2026-10-22T13:05:00Z',
		};
		const { ctx, calls } = executeContext({
			params: {
				resource: 'conversation',
				operation: 'conversation.sendMessage',
				contact: '2001',
				device_id: '7',
				contact_id: '2001',
				useJsonBody: false,
				additionalFields: { phone: '5491100000000', text: 'Hello', client_reference: 'order-981' },
			},
			responses: [{ body: { message: queued } }],
		});
		const [out] = await node.execute.call(ctx);
		expect(requestLine(calls[0])).toBe('POST /api/v1/contacts/2001/message');
		expect(calls[0].options.body).toMatchObject({ client_reference: 'order-981' });
		expect(out.map((i) => i.json)).toEqual([queued]);
	});

	it('a contact card returns one item per message; a forward, one per target', async () => {
		const card = executeContext({
			params: {
				resource: 'conversation',
				operation: 'contactCard.store',
				contact: '2001',
				device_id: '7',
				contact_card_ids: '2002, 2003',
				useJsonBody: false,
				additionalFields: {},
			},
			responses: [
				{
					body: {
						messages: [
							{ id: 1, type: 'contact' },
							{ id: 2, type: 'contact' },
						],
					},
				},
			],
		});
		const [cards] = await node.execute.call(card.ctx);
		expect(card.calls[0].options.body).toEqual({ device_id: 7, contact_card_ids: [2002, 2003] });
		expect(cards.map((i) => i.json.id)).toEqual([1, 2]);

		const forward = executeContext({
			params: {
				resource: 'conversation',
				operation: 'forwardMessage.store',
				contact: '2001',
				message: '1001',
				targets: '[{"contact_id": 2002, "device_id": 7}]',
				useJsonBody: false,
				additionalFields: {},
			},
			responses: [
				{
					body: [
						{
							contact_id: 2002,
							mode: 'internal',
							status: 'queued',
							reason: null,
							message: { id: 3 },
						},
					],
				},
			],
		});
		const [forwarded] = await node.execute.call(forward.ctx);
		expect(forwarded[0].json).toMatchObject({ contact_id: 2002, status: 'queued' });
	});

	it('List forms with "Return All" goes through the pages with per_page', async () => {
		const { ctx, calls } = executeContext({
			params: { resource: 'form', operation: 'whatsappForm.index', returnAll: true, filters: {} },
			responses: [
				{ body: { data: [{ id: 1 }], meta: { current_page: 1, last_page: 2 } } },
				{ body: { data: [{ id: 2 }], meta: { current_page: 2, last_page: 2 } } },
			],
		});
		const [out] = await node.execute.call(ctx);
		expect(calls.map(requestLine)).toEqual([
			'GET /api/v1/forms?per_page=100&page=1',
			'GET /api/v1/forms?per_page=100&page=2',
		]);
		expect(out.map((i) => i.json.id)).toEqual([1, 2]);
	});

	it('an API error comes out with its message and its error', async () => {
		const { ctx } = executeContext({
			params: {
				resource: 'conversation',
				operation: 'conversation.sendMessage',
				contact: '1',
				device_id: '2',
				contact_id: '1',
				useJsonBody: false,
				additionalFields: { text: 'hello' },
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

	it('a validation 422 lists the fields', async () => {
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

	it("with Continue On Fail, the item carries the API's error and message", async () => {
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

	it("the response's X-Request-Id goes in the error and in the Continue On Fail item", async () => {
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

	it("the API entry point's own errors (route_not_found) come out the same, with their ID", async () => {
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

	it('a 502 on a write warns it may have been applied; on a read, it does not', async () => {
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
		expect(writeError.description).toContain('check the state before repeating it');
		expect(write.calls).toHaveLength(1);

		const read = executeContext({
			params: { resource: 'tag', operation: 'tag.show', tag: '99' },
			responses: [edge],
		});
		const readError = (await node.execute.call(read.ctx).catch((e: unknown) => e)) as NodeApiError;
		expect(readError.description).not.toContain('check the state');
	});

	it('an empty required field is a node error, not a request', async () => {
		const { ctx, calls } = executeContext({
			params: { resource: 'contact', operation: 'contact.show', contact: '' },
			responses: [],
		});
		const error = await node.execute.call(ctx).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(NodeOperationError);
		expect((error as Error).message).toBe('Missing "Contact ID".');
		expect(calls).toHaveLength(0);
	});
});

describe('429 and Retry-After', () => {
	it('waits what Retry-After asks for and retries', async () => {
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

	it('if the wait is long, it does not retry and says so', async () => {
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
		expect(error.description).toContain('Try again in 120 s (Retry-After).');
	});
});
