import { NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import { FunnelchatApi } from '../credentials/FunnelchatApi.credentials';
import { Funnelchat } from '../nodes/Funnelchat/Funnelchat.node';
import { FunnelchatTrigger } from '../nodes/FunnelchatTrigger/FunnelchatTrigger.node';
import { baseUrlFor, isValidBaseUrl } from '../nodes/shared/transport';
import vectors from './fixtures/firmas.json';
import { executeContext, hookContext, requestLine } from './mocks';

/*
 * The "Custom" environment: a base URL of its own, for example the local sandbox
 * (Funnelchat20/funnelchat-sandbox, http://localhost:4010).
 */

const SANDBOX = 'http://localhost:4010';

describe('credential with a custom base URL', () => {
	const credential = new FunnelchatApi();
	const environment = credential.properties.find((p) => p.name === 'environment');
	const baseUrl = credential.properties.find((p) => p.name === 'baseUrl');

	it('the environment offers Production, Staging and Custom', () => {
		expect(environment?.options?.map((o) => ('value' in o ? o.value : undefined))).toEqual([
			'production',
			'staging',
			'custom',
		]);
		expect(environment?.default).toBe('production');
	});

	it('the base URL is required and only shows with Custom', () => {
		expect(baseUrl).toMatchObject({
			displayName: 'Base URL',
			type: 'string',
			required: true,
			placeholder: SANDBOX,
			displayOptions: { show: { environment: ['custom'] } },
		});
	});

	it('the credential test uses that URL, and an invalid one points to an .invalid host', () => {
		const expression = String(credential.test.request.baseURL);
		expect(expression).toContain('$credentials.environment === "custom"');
		expect(expression).toContain('$credentials.baseUrl');
		expect(expression).toContain('https://invalid-base-url.invalid');
		expect(expression).toContain('https://api-staging.funnelchat.com');
		expect(expression).toContain('https://api.funnelchat.com');
		expect(credential.test.request.url).toBe('/api/v1/me');
	});
});

describe('base URL validation', () => {
	it.each([
		SANDBOX,
		'http://127.0.0.1:4010',
		'http://host.docker.internal:4010',
		'https://sandbox.example.com',
		'https://sandbox.example.com/prefix',
	])('accepts %s', (value) => {
		expect(isValidBaseUrl(value)).toBe(true);
		expect(baseUrlFor('custom', value)).toBe(value);
	});

	it.each([
		['with a trailing slash', 'http://localhost:4010/'],
		['with a trailing slash after a path', 'https://sandbox.example.com/prefix/'],
		['without a protocol', 'localhost:4010'],
		['with another protocol', 'ftp://localhost:4010'],
		['without a host', 'http://'],
		['empty', ''],
		['with surrounding spaces', ' http://localhost:4010'],
		['with a query', 'http://localhost:4010?x=1'],
		['with a fragment', 'http://localhost:4010#x'],
	])('rejects a URL %s', (_name, value) => {
		expect(isValidBaseUrl(value)).toBe(false);
		expect(baseUrlFor('custom', value)).toBeUndefined();
	});

	it('Production and Staging do not change and ignore the base URL', () => {
		expect(baseUrlFor('production', SANDBOX)).toBe('https://api.funnelchat.com');
		expect(baseUrlFor('staging', SANDBOX)).toBe('https://api-staging.funnelchat.com');
		expect(baseUrlFor(undefined)).toBe('https://api.funnelchat.com');
	});
});

describe('the node against a custom base URL', () => {
	const node = new Funnelchat();

	it("Create or update a contact goes to the sandbox's URL with the full route", async () => {
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

	it('lists paginate the same against the sandbox', async () => {
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

	it('with an invalid base URL no request goes out and the error says why', async () => {
		const { ctx, calls } = executeContext({
			environment: 'custom',
			baseUrl: 'http://localhost:4010/',
			params: { resource: 'contact', operation: 'contact.show', contact: '2001' },
			responses: [],
		});
		const error = await node.execute.call(ctx).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(NodeOperationError);
		expect((error as Error).message).toBe(
			"The credential's base URL is not valid: it has to start with http:// or https:// and not end in /.",
		);
		expect((error as NodeOperationError).description).toContain('http://localhost:4010/');
		expect(calls).toHaveLength(0);
	});
});

describe('the trigger with a custom base URL and a local n8n', () => {
	const methods = new FunnelchatTrigger().webhookMethods.default;
	const LOCAL_WEBHOOK = 'http://localhost:5678/webhook/abc123/webhook';

	it("subscribes n8n's local URL in the sandbox and deletes it on deactivation", async () => {
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
