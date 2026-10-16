import { NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import { FunnelchatApi } from '../credentials/FunnelchatApi.credentials';
import { Funnelchat } from '../nodes/Funnelchat/Funnelchat.node';
import { FunnelchatTrigger } from '../nodes/FunnelchatTrigger/FunnelchatTrigger.node';
import { baseUrlFor, isValidBaseUrl } from '../nodes/shared/transport';
import vectors from './fixtures/firmas.json';
import { executeContext, hookContext, requestLine } from './mocks';

/*
 * The «Personalizado» environment: a base URL of its own, for example the local sandbox
 * (Funnelchat20/funnelchat-sandbox, http://localhost:4010).
 */

const SANDBOX = 'http://localhost:4010';

describe('credencial con URL base personalizada', () => {
	const credential = new FunnelchatApi();
	const environment = credential.properties.find((p) => p.name === 'environment');
	const baseUrl = credential.properties.find((p) => p.name === 'baseUrl');

	it('el entorno ofrece Producción, Staging y Personalizado', () => {
		expect(environment?.options?.map((o) => ('value' in o ? o.value : undefined))).toEqual([
			'production',
			'staging',
			'custom',
		]);
		expect(environment?.default).toBe('production');
	});

	it('la URL base es obligatoria y solo aparece con Personalizado', () => {
		expect(baseUrl).toMatchObject({
			displayName: 'URL base',
			type: 'string',
			required: true,
			placeholder: SANDBOX,
			displayOptions: { show: { environment: ['custom'] } },
		});
	});

	it('la prueba de la credencial usa esa URL, y una inválida apunta a un host .invalid', () => {
		const expression = String(credential.test.request.baseURL);
		expect(expression).toContain('$credentials.environment === "custom"');
		expect(expression).toContain('$credentials.baseUrl');
		expect(expression).toContain('https://url-base-invalida.invalid');
		expect(expression).toContain('https://api-staging.funnelchat.com');
		expect(expression).toContain('https://api.funnelchat.com');
		expect(credential.test.request.url).toBe('/api/v1/me');
	});
});

describe('validación de la URL base', () => {
	it.each([
		SANDBOX,
		'http://127.0.0.1:4010',
		'http://host.docker.internal:4010',
		'https://sandbox.example.com',
		'https://sandbox.example.com/prefijo',
	])('acepta %s', (value) => {
		expect(isValidBaseUrl(value)).toBe(true);
		expect(baseUrlFor('custom', value)).toBe(value);
	});

	it.each([
		['con barra final', 'http://localhost:4010/'],
		['con barra final después de un camino', 'https://sandbox.example.com/prefijo/'],
		['sin protocolo', 'localhost:4010'],
		['con otro protocolo', 'ftp://localhost:4010'],
		['sin host', 'http://'],
		['vacía', ''],
		['con espacios alrededor', ' http://localhost:4010'],
		['con query', 'http://localhost:4010?x=1'],
		['con fragmento', 'http://localhost:4010#x'],
	])('rechaza una URL %s', (_name, value) => {
		expect(isValidBaseUrl(value)).toBe(false);
		expect(baseUrlFor('custom', value)).toBeUndefined();
	});

	it('Producción y Staging no cambian y no miran la URL base', () => {
		expect(baseUrlFor('production', SANDBOX)).toBe('https://api.funnelchat.com');
		expect(baseUrlFor('staging', SANDBOX)).toBe('https://api-staging.funnelchat.com');
		expect(baseUrlFor(undefined)).toBe('https://api.funnelchat.com');
	});
});

describe('el nodo contra una URL base personalizada', () => {
	const node = new Funnelchat();

	it('Crear o actualizar un contacto va a la URL del sandbox con la ruta completa', async () => {
		const { ctx, calls } = executeContext({
			environment: 'custom',
			baseUrl: SANDBOX,
			params: {
				resource: 'contact',
				operation: 'contact.updateOrCreate',
				phone: '5491100000099',
				useJsonBody: false,
				additionalFields: { name: 'Ana' },
			},
			responses: [{ body: { id: 2002, phone: '5491100000099', name: 'Ana' } }],
		});
		const [out] = await node.execute.call(ctx);
		expect(out[0].json).toEqual({ id: 2002, phone: '5491100000099', name: 'Ana' });
		expect(calls).toHaveLength(1);
		expect(calls[0].credential).toBe('funnelchatApi');
		expect(calls[0].options.baseURL).toBe(SANDBOX);
		expect(requestLine(calls[0])).toBe('POST /api/v1/contacts/update-or-create');
		expect(calls[0].options.body).toEqual({ phone: '5491100000099', name: 'Ana' });
	});

	it('los listados paginan igual contra el sandbox', async () => {
		const { ctx, calls } = executeContext({
			environment: 'custom',
			baseUrl: 'http://host.docker.internal:4010',
			params: { resource: 'tag', operation: 'tag.index', returnAll: true },
			responses: [
				{ body: { data: [{ id: 4001 }], meta: { current_page: 1, last_page: 2 }, links: {} } },
				{ body: { data: [{ id: 4002 }], meta: { current_page: 2, last_page: 2 }, links: {} } },
			],
		});
		const [out] = await node.execute.call(ctx);
		expect(out.map((i) => i.json.id)).toEqual([4001, 4002]);
		expect(calls.map((c) => `${c.options.baseURL}${decodeURIComponent(c.options.url)}`)).toEqual([
			'http://host.docker.internal:4010/api/v1/tags?perPage=100&page=1',
			'http://host.docker.internal:4010/api/v1/tags?perPage=100&page=2',
		]);
	});

	it('con una URL base inválida no sale ningún pedido y el error dice por qué', async () => {
		const { ctx, calls } = executeContext({
			environment: 'custom',
			baseUrl: 'http://localhost:4010/',
			params: { resource: 'contact', operation: 'contact.show', contact: '2001' },
			responses: [],
		});
		const error = await node.execute.call(ctx).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(NodeOperationError);
		expect((error as Error).message).toBe(
			'La URL base de la credencial no es válida: tiene que empezar con http:// o https:// y no terminar en /.',
		);
		expect((error as NodeOperationError).description).toContain('http://localhost:4010/');
		expect(calls).toHaveLength(0);
	});
});

describe('el disparador con una URL base personalizada y n8n local', () => {
	const methods = new FunnelchatTrigger().webhookMethods.default;
	const LOCAL_WEBHOOK = 'http://localhost:5678/webhook/abc123/webhook';

	it('suscribe la URL local de n8n en el sandbox y la borra al desactivar', async () => {
		const created = hookContext({
			environment: 'custom',
			baseUrl: SANDBOX,
			webhookUrl: LOCAL_WEBHOOK,
			params: { events: ['message.received'], options: {} },
			responses: [
				{
					status: 201,
					body: {
						id: '0f486bfd-2f55-4ed6-8a12-b09e31a6ac08',
						url: LOCAL_WEBHOOK,
						events: ['message.received'],
						filters: {},
						status: 'active',
						secret: vectors.secreto,
					},
				},
			],
		});
		await expect(methods.create.call(created.ctx)).resolves.toBe(true);
		expect(created.calls[0].options.baseURL).toBe(SANDBOX);
		expect(requestLine(created.calls[0])).toBe('POST /api/v1/webhooks');
		expect(created.calls[0].options.body).toMatchObject({
			url: LOCAL_WEBHOOK,
			events: ['message.received'],
		});
		expect(Object.keys(created.staticData.subscriptions as object)).toEqual([LOCAL_WEBHOOK]);

		const deleted = hookContext({
			environment: 'custom',
			baseUrl: SANDBOX,
			webhookUrl: LOCAL_WEBHOOK,
			staticData: created.staticData,
			params: { events: ['message.received'], options: {} },
			responses: [{ status: 204, body: '' }],
		});
		await expect(methods.delete.call(deleted.ctx)).resolves.toBe(true);
		expect(deleted.calls[0].options.baseURL).toBe(SANDBOX);
		expect(requestLine(deleted.calls[0])).toBe(
			'DELETE /api/v1/webhooks/0f486bfd-2f55-4ed6-8a12-b09e31a6ac08',
		);
		expect(created.staticData.subscriptions).toBeUndefined();
	});
});
