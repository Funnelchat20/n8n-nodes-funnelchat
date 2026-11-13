import { describe, expect, it } from 'vitest';
import { Funnelchat } from '../nodes/Funnelchat/Funnelchat.node';
import { OPERATIONS, RESOURCES, SPEC_SOURCE } from '../nodes/Funnelchat/generated/operations';
import { EVENT_CATALOG } from '../nodes/FunnelchatTrigger/generated/events';
import { copySpec, generate, looksSpanish, staleFiles } from '../scripts/generate.mjs';
import published from './fixtures/published-operations.json';
import translations from '../scripts/operations.en.json';
import spec from '../spec/funnelchat.json';
import { makeRoot, readText, repoSha256, repoText } from './generator-root.mjs';

/*
 * These tests hold for any specification the portal publishes, so regenerating with a new one does not require
 * touching them: they check what the node keeps for saved workflows, not the numbers of one copy.
 */

type SpecOperation = {
	operationId?: string;
	tags?: string[];
	'x-fc-destructive'?: boolean;
	'x-fc-permission'?: string;
};
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const paths = spec.paths as unknown as Record<string, Record<string, SpecOperation>>;
const specOperations = Object.entries(paths).flatMap(([path, item]) =>
	METHODS.filter((m) => item[m]).map((m) => ({ path, method: m.toUpperCase(), op: item[m] })),
);
const CONFIRM = 'Irreversible: ask for confirmation before running it.';

describe('generation from the published specification', () => {
	it('the generated files are up to date with spec/ (if it fails: npm run generate)', () => {
		expect(staleFiles()).toEqual([]);
	});

	it('the provenance records the copied specification, and the config matches it', () => {
		expect(SPEC_SOURCE.sha256).toBe(repoSha256('spec/funnelchat.json'));
		expect(repoText('spec/PROVENANCE.md')).toContain(SPEC_SOURCE.sha256);
		expect(() => generate()).not.toThrow();
		expect(generate().warnings).toEqual([]);
	});

	it('every operation the portal publishes is in the node, once, with its route and operationId', () => {
		expect(OPERATIONS).toHaveLength(specOperations.length);
		const english = translations as unknown as Record<string, { name: string; purpose: string }>;
		for (const op of OPERATIONS) {
			const fromSpec = paths[op.path]?.[op.method.toLowerCase()];
			expect(fromSpec, `${op.method} ${op.path}`).toBeDefined();
			const operationId = op.operationId ?? op.value;
			if (fromSpec?.operationId) expect(operationId).toBe(fromSpec.operationId);
			const en = english[operationId] ?? english[`${op.method} ${op.path}`];
			// One without its English texts shows its route (and the generator lists it in review).
			if (!en) expect(op.name).toBe(`${op.method} ${op.path}`);
			else {
				expect(op.name).toBe(en.name);
				expect(op.description.startsWith(en.purpose), op.value).toBe(true);
			}
		}
	});

	it('the resources the node published keep their value, and every resource has operations', () => {
		expect(RESOURCES.map((r) => `${r.value} ${r.name}`)).toEqual(
			expect.arrayContaining([
				'contact Contacts',
				'conversation Conversations and Messages',
				'template Templates',
				'form WhatsApp Forms',
				'tag Tags',
				'customField Custom Fields',
				'group Groups',
				'device Numbers',
				'webhook Webhooks',
			]),
		);
		for (const r of RESOURCES)
			expect(OPERATIONS.filter((o) => o.resource === r.value).length, r.value).toBeGreaterThan(0);
	});

	it('every operation the node has published is still there, in its resource, or went out on record', () => {
		const values = new Map(OPERATIONS.map((o) => [o.value, o.resource]));
		const removed = new Set(published.removed.map((o) => o.value));
		for (const { resource, value } of published.operations)
			if (!removed.has(value)) expect(values.get(value), value).toBe(resource);
		for (const o of published.removed) {
			expect(published.operations, o.value).toContainEqual({
				resource: o.resource,
				value: o.value,
			});
			expect(o.version, o.value).toMatch(/^\d+\.\d+\.\d+$/);
		}
	});

	it('an operation the portal moved to another group stays in the resource it was published in', () => {
		const resourceOf = (value: string) => OPERATIONS.find((o) => o.value === value)?.resource;
		expect(resourceOf('messageTemplate.templates')).toBe('template');
		expect(resourceOf('contact.customFields')).toBe('contact');
		expect(resourceOf('whatsappFormSend.store')).toBe('form');
		expect(resourceOf('campaign.participantEvents')).toBe('group');
	});

	it('an operation the specification renamed keeps the value saved workflows use', () => {
		const show = OPERATIONS.find((o) => o.value === 'showMessage')!;
		expect(show.operationId).toBe('message.showMessage');
		expect(OPERATIONS.find((o) => o.value === 'message.showMessage')).toBeUndefined();
		// The rest are the specification's own.
		expect(OPERATIONS.filter((o) => o.operationId).map((o) => o.value)).toEqual(['showMessage']);
	});

	it('an irreversible operation (x-fc-destructive) asks for confirmation, and only those', () => {
		const destructive = specOperations.filter(({ op }) => op['x-fc-destructive'] === true);
		expect(destructive.length).toBeGreaterThan(0);
		for (const o of OPERATIONS) {
			const fromSpec = paths[o.path][o.method.toLowerCase()];
			const irreversible =
				fromSpec['x-fc-destructive'] === true ||
				(fromSpec['x-fc-destructive'] === undefined &&
					fromSpec['x-fc-permission'] === 'accounts:operate');
			expect(o.description.endsWith(CONFIRM), o.value).toBe(irreversible);
			if (irreversible) expect(o.notice, o.value).toContain('Irreversible operation');
		}
		expect(OPERATIONS.find((o) => o.value === 'device.destroy')!.description).toContain(CONFIRM);
	});

	it('the webhook subscriptions come from the specification, with webhooks:* and the area rule', () => {
		const subscriptions = OPERATIONS.filter(
			(o) => o.path.startsWith('/api/v1/webhooks') && !o.path.endsWith('/events'),
		);
		expect(subscriptions.map((o) => `${o.method} ${o.path}`)).toEqual([
			'GET /api/v1/webhooks',
			'POST /api/v1/webhooks',
			'GET /api/v1/webhooks/{id}',
			'PUT /api/v1/webhooks/{id}',
			'DELETE /api/v1/webhooks/{id}',
			'GET /api/v1/webhooks/{id}/deliveries',
			'POST /api/v1/webhooks/{id}/test',
		]);
		for (const o of subscriptions) {
			expect(o.resource, o.value).toBe('webhook');
			expect(o.permission).toBe(o.method === 'GET' ? 'webhooks:read' : 'webhooks:write');
			expect(o.notice).toContain('read permission of the area');
		}
		// Typed with commas, as the node published them, although the specification lists the types.
		for (const value of ['webhookSubscription.store', 'webhookSubscription.update'])
			expect(
				OPERATIONS.find((o) => o.value === value)!.params.find((p) => p.apiName === 'events')!.kind,
			).toBe('list');
		// Filters the code reads and the specification does not list.
		const deliveries = OPERATIONS.find((o) => o.value === 'webhookSubscriptionDelivery.index')!;
		expect(deliveries.params.map((p) => p.apiName)).toEqual(['id', 'event_type', 'event_id']);
	});

	it("the trigger's built-in list is the event types of the specification a subscription takes", () => {
		type Schema = {
			$ref?: string;
			properties?: Record<string, Schema>;
			items?: Schema;
			enum?: string[];
		};
		const schemas = spec.components.schemas as unknown as Record<string, Schema>;
		const resolve = (s: Schema): Schema =>
			s.$ref ? resolve(schemas[s.$ref.split('/').pop()!]) : s;
		const store = paths['/api/v1/webhooks'].post as unknown as {
			requestBody: { content: { 'application/json': { schema: Schema } } };
		};
		const body = resolve(store.requestBody.content['application/json'].schema);
		const subscribable = resolve(resolve(body.properties!.events).items!).enum!;
		expect(EVENT_CATALOG.map((e) => e.type).sort()).toEqual([...subscribable].sort());
		expect(EVENT_CATALOG.map((e) => e.type)).not.toContain('webhook.test');
		const webhooks = spec.webhooks as unknown as Record<string, { post: { summary: string } }>;
		const described = new Set(Object.values(webhooks).map((w) => w.post.summary));
		for (const e of EVENT_CATALOG) {
			expect(described.has(e.type), e.type).toBe(true);
			expect(['accounts', 'conversations', 'communities'], e.type).toContain(e.area);
		}
		// These two identify the message by data.message.uid, as the portal's example shows since v0.6.14: the description
		// says so and no longer says the example differs.
		for (const type of ['group.message_received', 'group.reaction_added']) {
			const description = EVENT_CATALOG.find((e) => e.type === type)!.description;
			expect(description, type).toContain('data.message with its uid');
			expect(description, type).not.toContain('example');
		}
	});

	it('when the specification gives the category of the groups, every operation has its own', () => {
		const groups = (spec as unknown as { 'x-tagGroups'?: Array<Record<string, unknown>> })[
			'x-tagGroups'
		];
		const categorized = (groups ?? []).some((g) =>
			Object.keys(g).some((k) => /^x-.*categor/i.test(k)),
		);
		for (const o of OPERATIONS) expect(o.category !== undefined, o.value).toBe(categorized);
		for (const r of RESOURCES) {
			const own = new Set(
				OPERATIONS.filter((o) => o.resource === r.value && o.category).map((o) => o.category),
			);
			expect(new Set(r.categories ?? []), r.value).toEqual(own);
		}
	});

	it('sends with an API key: the same operationIds, client_reference and their notices', () => {
		for (const value of [
			'conversation.sendMessage',
			'message.sendMessage',
			'forwardMessage.store',
			'contactCard.store',
			'messageTemplate.send',
			'whatsappFormSend.store',
		]) {
			const o = OPERATIONS.find((x) => x.value === value)!;
			expect(
				o.params.map((p) => p.apiName),
				value,
			).toContain('client_reference');
			expect(o.notice ?? '', value).toContain('With an API key');
			expect(o.notice ?? '', value).not.toContain('route_not_available');
		}
		for (const value of ['conversation.sendMessage', 'message.sendMessage']) {
			const names = OPERATIONS.find((x) => x.value === value)!.params.map((p) => p.apiName);
			expect(names).toEqual(expect.arrayContaining(['file', 'file_type', 'file_name']));
		}
		const fileType = OPERATIONS.find((x) => x.value === 'conversation.sendMessage')!.params.find(
			(p) => p.apiName === 'file_type',
		)!;
		expect(fileType.options).toEqual(['image', 'video', 'audio', 'document', 'sticker']);
		expect(fileType.description).toContain('a URL that does not show its extension');
		// Nothing keeps the "on its way" note of the 13-10 snapshot.
		for (const o of OPERATIONS) expect(o.notice ?? '', o.value).not.toContain('PR #2284');
	});

	it('no text the node shows is in Spanish', () => {
		for (const r of RESOURCES) {
			expect(looksSpanish(r.name), r.value).toBe(false);
			expect(looksSpanish(r.description), r.value).toBe(false);
		}
		for (const o of OPERATIONS) {
			expect(looksSpanish(o.name), o.value).toBe(false);
			expect(looksSpanish(o.description), o.value).toBe(false);
			expect(looksSpanish(o.notice ?? ''), o.value).toBe(false);
			for (const p of o.params)
				expect(looksSpanish(p.description ?? ''), `${o.value} ${p.apiName}`).toBe(false);
		}
		for (const e of EVENT_CATALOG) {
			expect(looksSpanish(e.label), e.type).toBe(false);
			expect(looksSpanish(e.description), e.type).toBe(false);
		}
	});

	it('message by ID and WhatsApp forms, with their permission', () => {
		const show = OPERATIONS.find((o) => o.value === 'showMessage')!;
		expect(`${show.method} ${show.path} ${show.permission}`).toBe(
			'GET /api/v1/contacts/{contact}/messages/{message} conversations:read',
		);
		const forms = OPERATIONS.filter((o) => o.resource === 'form');
		expect(forms.length).toBeGreaterThanOrEqual(19);
		const send = forms.find((o) => o.value === 'whatsappFormSend.store')!;
		expect(send.permission).toBe('conversations:send');
		expect(send.params.filter((p) => p.required).map((p) => p.apiName)).toEqual([
			'contact',
			'form_id',
			'device_id',
		]);
		for (const o of forms.filter((x) => x !== send))
			expect(o.permission, o.value).toBe(
				o.method === 'GET' ? 'conversations:read' : 'conversations:write',
			);
		expect(forms.find((o) => o.value === 'whatsappForm.index')!.list?.pagination).toBe('page');
		// The English descriptions of the forms' fields, which the specification does not have.
		expect(
			forms.find((o) => o.value === 'whatsappForm.show')!.params.find((p) => p.apiName === 'id')!
				.description,
		).toContain('ID of a version of the form');
	});

	it('connecting a number comes from the specification, with the operationIds the node published', () => {
		const numbers = OPERATIONS.filter(
			(o) =>
				['device.index', 'deviceProvisioning.store', 'deviceProvisioning.qr'].includes(o.value) ||
				o.value.startsWith('connectLink.'),
		);
		expect(numbers.map((o) => `${o.method} ${o.path} ${o.value} ${o.permission}`).sort()).toEqual(
			[
				'GET /api/v1/devices device.index accounts:read',
				'POST /api/v1/devices deviceProvisioning.store accounts:operate',
				'GET /api/v1/devices/{device}/qr deviceProvisioning.qr accounts:operate',
				'GET /api/v1/connect-links connectLink.index accounts:read',
				'POST /api/v1/connect-links connectLink.store accounts:operate',
				'GET /api/v1/connect-links/{link} connectLink.show accounts:read',
				'DELETE /api/v1/connect-links/{link} connectLink.destroy accounts:operate',
			].sort(),
		);
		for (const o of numbers) {
			expect(o.resource, o.value).toBe('device');
			// accounts:operate here gives control of a number; it is not an irreversible operation.
			expect(o.notice ?? '', o.value).not.toContain('Irreversible');
		}
		const list = OPERATIONS.find((o) => o.value === 'device.index')!;
		expect(list.list).toEqual({ pagination: 'page', sizeParam: 'perPage', maxPageSize: 100 });
		expect(list.params.map((p) => `${p.location}:${p.apiName}`)).toEqual([
			'query:external_reference',
		]);
		const link = OPERATIONS.find((o) => o.value === 'connectLink.store')!;
		expect(link.params.filter((p) => p.required).map((p) => p.apiName)).toEqual(['type']);
		// qr first: it is the default, the one the first use needs (meta answers 503 while it is off).
		expect(link.params.find((p) => p.apiName === 'type')!.options).toEqual(['qr', 'meta']);
	});

	it('a field whose kind the specification changed keeps the one saved workflows have', () => {
		const type = OPERATIONS.find((o) => o.value === 'customField.store')!.params.find(
			(p) => p.apiName === 'type',
		)!;
		expect(type.kind).toBe('number');
		expect(type.required).toBe(true);
	});

	it('mark as read, typing, template metrics and a message to a group', () => {
		const added = [
			'message.markMessageRead',
			'message.typingIndicator',
			'message.templateMetrics',
		].map((value) => OPERATIONS.find((o) => o.value === value)!);
		expect(added.map((o) => `${o.resource} ${o.method} ${o.path} ${o.permission}`)).toEqual([
			'conversation POST /api/v1/contacts/{contact}/messages/{message}/read conversations:send',
			'conversation POST /api/v1/contacts/{contact}/typing conversations:send',
			'template GET /api/v1/templates/{template}/metrics conversations:read',
		]);
		const send = OPERATIONS.find((o) => o.value === 'apiGroupAction.sendMessage')!;
		expect(`${send.resource} ${send.method} ${send.path} ${send.permission}`).toBe(
			'group POST /api/v1/groups/{group}/messages communities:send',
		);
		expect(send.params.filter((p) => p.required).map((p) => p.apiName)).toEqual([
			'group',
			'device_id',
			'type',
		]);
		expect(send.notice).toContain('Get a group action');
	});

	it('the first use is all there: numbers, contacts, a text, a template, a message, groups', () => {
		for (const value of [
			'device.index',
			'device.status',
			'deviceProvisioning.store',
			'deviceProvisioning.qr',
			'connectLink.store',
			'contact.store',
			'message.sendMessage',
			'conversation.sendMessage',
			'messageTemplate.send',
			'showMessage',
			'group.index',
			'apiGroupAction.sendMessage',
		])
			expect(
				OPERATIONS.find((o) => o.value === value),
				value,
			).toBeDefined();
	});

	it('the default resource and operations do not change (saved workflows rely on them)', () => {
		const node = new Funnelchat();
		const resource = node.description.properties.find((p) => p.name === 'resource')!;
		expect(resource.default).toBe('contact');
		const defaults = Object.fromEntries(
			node.description.properties
				.filter((p) => p.name === 'operation')
				.map((p) => [p.displayOptions!.show!.resource![0], p.default]),
		);
		expect(defaults).toMatchObject({
			contact: 'contact.customFields',
			conversation: 'conversation.getLatestMessages',
			// "Get a template's quick reply buttons" went out in 0.3.0.
			template: 'messageTemplate.templates',
			form: 'whatsappForm.responses',
			tag: 'tag.index',
			customField: 'customField.index',
			group: 'campaign.participantEvents',
			device: 'deviceConnectionEvent.index',
			webhook: 'webhookSubscriptionDelivery.index',
			campaign: 'campaign.index',
			scheduledMessage: 'scheduledMessage.index',
			stats: 'stats.participantStats',
			broadcast: 'broadcast.index',
			flow: 'flow.index',
			flowFolder: 'folder.index',
			board: 'kanbanSetting.index',
			ticket: 'ticket.index',
			quickReply: 'quickReply.index',
			leadScore: 'leadScoreSettings.show',
			sales: 'salesDashboard.index',
			account: 'user.index',
			metaAccount: 'whatsAppBusinessAccount.index',
			conversionsApi: 'capiConnection.datasets',
			customDomain: 'customDomain.index',
			alert: 'alertCatalog.index',
		});
	});

	it('paginated lists offer "Return All"', () => {
		const node = new Funnelchat();
		const returnAll = node.description.properties.filter((p) => p.name === 'returnAll');
		const paginated = OPERATIONS.filter((o) => o.list && o.list.pagination !== 'none');
		expect(returnAll).toHaveLength(paginated.length);
		expect(paginated.map((o) => o.value)).toEqual(
			expect.arrayContaining([
				'contact.index',
				'conversation.index',
				'messageTemplate.templates',
				'group.index',
				'whatsappForm.index',
				'whatsappForm.responses',
				'broadcast.index',
			]),
		);
	});
});

// ---------------------------------------------------------------------------------------------------------------
// The generator on a specification of its own: categories, groups without a resource, texts without English, --spec
// ---------------------------------------------------------------------------------------------------------------

const response = { '200': { description: 'OK' } };
const list = {
	'200': {
		description: 'OK',
		content: {
			'application/json': {
				schema: {
					type: 'object',
					properties: { data: { type: 'array', items: { type: 'object' } } },
				},
			},
		},
	},
};

function miniSpec(tagGroups: unknown[], extra: Record<string, unknown> = {}) {
	return {
		...extra,
		openapi: '3.1.0',
		info: { title: 'Funnelchat API', version: 'v0' },
		tags: [{ name: 'Números' }, { name: 'Difusiones' }, { name: 'Alertas' }, { name: 'Tu cuenta' }],
		'x-tagGroups': tagGroups,
		paths: {
			'/api/v1/broadcasts': {
				get: {
					operationId: 'broadcast.index',
					tags: ['Difusiones'],
					'x-fc-permission': 'conversations:read',
					responses: list,
				},
				post: {
					operationId: 'broadcast.nueva',
					tags: ['Difusiones'],
					'x-fc-permission': 'conversations:write',
					responses: response,
				},
			},
			'/api/v1/devices': {
				get: {
					operationId: 'device.index',
					tags: ['Números'],
					'x-fc-permission': 'accounts:read',
					responses: list,
				},
			},
			'/api/v1/devices/{device}': {
				delete: {
					operationId: 'device.destroy',
					tags: ['Números'],
					'x-fc-permission': 'accounts:operate',
					'x-fc-destructive': true,
					parameters: [{ name: 'device', in: 'path', required: true, schema: { type: 'integer' } }],
					responses: response,
				},
			},
			'/api/v1/alerts/catalog': {
				get: {
					operationId: 'alertCatalog.index',
					tags: ['Alertas'],
					'x-fc-permission': 'accounts:read',
					responses: response,
				},
			},
			'/api/v1/me': {
				get: { tags: ['Tu cuenta'], 'x-fc-permission': 'accounts:read', responses: response },
			},
		},
		webhooks: {
			'device.connected': {
				post: { summary: 'device.connected', 'x-fc-domain': 'accounts', 'x-fc-status': 'live' },
			},
			'webhook.test (communities)': {
				post: { summary: 'webhook.test', 'x-fc-domain': 'communities' },
			},
			'nuevo.evento': { post: { summary: 'nuevo.evento', 'x-fc-domain': 'conversations' } },
		},
	};
}

const BY_PROPERTY = [
	{ name: 'Números', 'x-fc-categoria': 'Funciones de WhatsApp', tags: ['Números'] },
	{ name: 'Difusiones', 'x-fc-categoria': 'Funciones de Funnelchat', tags: ['Difusiones'] },
	{ name: 'Alertas', 'x-fc-categoria': 'Funciones de Funnelchat', tags: ['Alertas'] },
	{ name: 'Tu cuenta', tags: ['Tu cuenta'] },
];
const BY_GROUP = [
	{ name: 'Funciones de WhatsApp', tags: ['Números'] },
	{ name: 'Funciones de Funnelchat', tags: ['Difusiones', 'Alertas'] },
	{ name: 'Tu cuenta', tags: ['Tu cuenta'] },
];
const WITHOUT = [
	{ name: 'Números', tags: ['Números'] },
	{ name: 'Difusiones', tags: ['Difusiones'] },
	{ name: 'Alertas', tags: ['Alertas'] },
	{ name: 'Tu cuenta', tags: ['Tu cuenta'] },
];

const PROVENANCE = [
	'# Where the specification comes from',
	'',
	'<!-- spec:start (written by npm run generate -- --spec) -->',
	'<!-- spec:end -->',
	'',
	'## History',
	'',
].join('\n');

function miniRoot(
	tagGroups: unknown[],
	specExtra: Record<string, unknown> = {},
	configExtra: Record<string, unknown> = {},
) {
	return makeRoot({
		'scripts/generator.config.json': {
			spec: 'spec/funnelchat.json',
			publishedSpecUrl: 'https://developers-portal.funnelchat.app/specs/funnelchat.json',
			provenance: 'spec/PROVENANCE.md',
			output: 'out/operations.ts',
			eventsOutput: 'out/events.ts',
			readme: 'README.md',
			events: { notSubscribable: ['webhook.test'] },
			categories: {
				keys: ['x-fc-categoria'],
				names: {
					'Funciones de WhatsApp': 'WhatsApp functions',
					'Funciones de Funnelchat': 'Funnelchat functions',
				},
			},
			defaultResource: 'broadcast',
			...configExtra,
			resources: [
				{
					value: 'broadcast',
					name: 'Broadcasts',
					description: 'Broadcasts.',
					tags: ['Difusiones'],
				},
				{
					value: 'device',
					name: 'Numbers',
					description: 'Numbers.',
					defaultOperation: 'device.index',
					tags: ['Números'],
				},
				{
					value: 'alert',
					name: 'Alerts',
					description: 'Alerts.',
					optional: true,
					tags: ['Alertas'],
				},
				{
					value: 'flow',
					name: 'Automations',
					description: '',
					optional: true,
					tags: ['Automatizaciones'],
				},
			],
		},
		'scripts/operations.en.json': {
			'broadcast.index': { name: 'List broadcasts', purpose: 'Lists them.' },
			'device.index': { name: 'List numbers', purpose: 'Lists them.' },
			'device.destroy': { name: 'Delete a number', purpose: 'Deletes it.' },
			'alertCatalog.index': { name: 'List the alert types', purpose: 'Lists them.' },
			'GET /api/v1/me': { name: 'Get my account', purpose: 'Shows it.' },
		},
		'scripts/events.en.json': {
			'device.connected': { label: 'Number connected', description: 'A number connected.' },
		},
		'spec/PROVENANCE.md': PROVENANCE,
		'incoming/funnelchat-v9.9.9.json': miniSpec(tagGroups, specExtra),
	});
}

/** A root whose specification was copied with --spec, as the command does. */
function copied(tagGroups: unknown[]) {
	const root = miniRoot(tagGroups);
	copySpec(root, `${root}/incoming/funnelchat-v9.9.9.json`, '2026-11-11');
	return root;
}

function generated(root: string) {
	const result = generate(root);
	const pick = (name: string) =>
		JSON.parse(
			result.operationsTs.split(`export const ${name}: `)[1].split(' = ')[1].split(';\n')[0],
		);
	return {
		result,
		resources: pick('RESOURCES') as Array<{
			value: string;
			name: string;
			categories?: string[];
			default?: boolean;
			description: string;
		}>,
		operations: pick('OPERATIONS') as Array<{
			value: string;
			resource: string;
			name: string;
			description: string;
			category?: string;
			notice?: string;
		}>,
		events: JSON.parse(result.eventsTs.split(' = ')[1].split(';\n')[0]) as Array<{
			type: string;
			label: string;
			area: string;
		}>,
	};
}

describe('the generator, on a specification of its own', () => {
	it('--spec copies the file as it is and records it in PROVENANCE.md, keeping the history', () => {
		const root = copied(WITHOUT);
		expect(readText(root, 'spec/funnelchat.json')).toBe(
			readText(root, 'incoming/funnelchat-v9.9.9.json'),
		);
		const provenance = readText(root, 'spec/PROVENANCE.md');
		const { result } = generated(root);
		expect(provenance).toContain(result.operationsTs.match(/sha256 ([0-9a-f]{64})/)![1]);
		// The name of the local file it was copied from is not recorded: the repository is public.
		expect(provenance).not.toContain('funnelchat-v9.9.9');
		expect(provenance).toContain('| Copied | 2026-11-11 |');
		expect(provenance).toContain('| Operations | 6, in 4 groups |');
		expect(provenance).toContain(
			'none: the specification does not give the category of its groups',
		);
		expect(provenance).toContain('## History');
		// Copying again replaces the block, it does not add another one.
		copySpec(root, `${root}/incoming/funnelchat-v9.9.9.json`, '2026-11-12');
		const again = readText(root, 'spec/PROVENANCE.md');
		expect(again.match(/spec:start/g)).toHaveLength(1);
		expect(again).toContain('| Copied | 2026-11-12 |');
	});

	it('a file that is not a specification is not copied', () => {
		const root = makeRoot({ 'scripts/generator.config.json': { spec: 'spec/funnelchat.json' } });
		const bad = makeRoot({ 'a.json': '{"openapi": "3.1.0"}', 'b.json': 'not json' });
		expect(() => copySpec(root, `${bad}/a.json`)).toThrow('has no paths');
		expect(() => copySpec(root, `${bad}/b.json`)).toThrow('is not JSON');
	});

	it('without the provenance of the specification, the generator refuses to run', () => {
		const root = miniRoot(WITHOUT);
		const spec = readText(root, 'incoming/funnelchat-v9.9.9.json');
		const other = makeRoot({
			'scripts/generator.config.json': JSON.parse(readText(root, 'scripts/generator.config.json')),
			'scripts/operations.en.json': '{}',
			'scripts/events.en.json': '{}',
			'spec/funnelchat.json': spec,
			'spec/PROVENANCE.md': PROVENANCE,
		});
		expect(() => generate(other)).toThrow('does not record the specification');
	});

	it('every operation goes in, with neutral texts where there is no English, and nothing stops it', () => {
		const { result, resources, operations, events } = generated(copied(WITHOUT));
		expect(result.warnings).toEqual([]);
		expect(operations).toHaveLength(6);
		// A group no resource lists gets its own; an optional resource without operations is left out.
		expect(resources.map((r) => r.value)).toEqual(['broadcast', 'device', 'alert', 'tuCuenta']);
		expect(resources.find((r) => r.value === 'tuCuenta')!.name).toBe('Tu cuenta');
		// An operation without operationId takes its English texts by its route; one without them shows its route.
		expect(operations.find((o) => o.resource === 'tuCuenta')!.name).toBe('Get my account');
		expect(operations.find((o) => o.value === 'broadcast.nueva')!.name).toBe(
			'POST /api/v1/broadcasts',
		);
		expect(result.review).toEqual([
			'broadcast.nueva (POST /api/v1/broadcasts) has no English name and purpose in scripts/operations.en.json: the node shows its route',
			'The group "Tu cuenta" has no resource in scripts/generator.config.json: its operations go into a resource of their own named "Tu cuenta" (value tuCuenta); add it to resources with that value and an English name',
			"Event nuevo.evento has no English label and description in scripts/events.en.json: the trigger shows the catalog's own texts, or its type",
		]);
		// The irreversible one asks for confirmation.
		const destroy = operations.find((o) => o.value === 'device.destroy')!;
		expect(destroy.description).toBe(`Deletes it. Permission: accounts:operate. ${CONFIRM}`);
		expect(destroy.notice).toContain('Irreversible operation');
		// The events: the ones a subscription takes, with empty texts for the one without English.
		expect(events.map((e) => `${e.type} ${e.area} ${e.label}`)).toEqual([
			'device.connected accounts Number connected',
			'nuevo.evento conversations ',
		]);
		// Without categories, no resource has one and the README lists the resources as they are.
		expect(resources.every((r) => r.categories === undefined)).toBe(true);
		expect(result.readmeBlock).not.toContain('####');
		expect(resources.find((r) => r.value === 'broadcast')!.default).toBe(true);
	});

	it('a property of the groups that the generator does not read is listed to review', () => {
		const groups = WITHOUT.map((g) => ({ ...g, 'x-fc-bloque': 'Piezas' }));
		const { result, resources } = generated(copied(groups));
		expect(resources.every((r) => r.categories === undefined)).toBe(true);
		expect(result.review).toContain(
			'The groups of x-tagGroups have x-fc-bloque, which is not read: if it is their category, add it to categories.keys in scripts/generator.config.json',
		);
	});

	for (const [how, groups] of [
		['as a property of each group in x-tagGroups', BY_PROPERTY],
		[
			'as a property under another name',
			BY_PROPERTY.map(({ 'x-fc-categoria': c, ...g }) => (c ? { ...g, 'x-categoria': c } : g)),
		],
		['as groups of x-tagGroups named after the category', BY_GROUP],
	] as const) {
		it(`with the category of each group (${how}), resources and README go category by category`, () => {
			const { result, resources } = generated(copied([...groups]));
			expect(result.warnings).toEqual([]);
			expect(resources.map((r) => `${r.value} ${r.categories?.join(' + ') ?? '-'}`)).toEqual([
				'device WhatsApp functions',
				'broadcast Funnelchat functions',
				'alert Funnelchat functions',
				'tuCuenta -',
			]);
			// The default resource is pinned, whatever the order.
			expect(resources.filter((r) => r.default).map((r) => r.value)).toEqual(['broadcast']);
			const block = result.readmeBlock;
			const at = (text: string) => block.indexOf(text);
			expect(at('#### WhatsApp functions (2)')).toBeGreaterThan(-1);
			expect(at('#### Funnelchat functions (3)')).toBeGreaterThan(at('#### WhatsApp functions'));
			expect(at('#### Other (1)')).toBeGreaterThan(at('#### Funnelchat functions'));
			expect(at('<strong>Numbers</strong>')).toBeLessThan(at('<strong>Broadcasts</strong>'));
		});
	}

	it("with the portal's list of categories, their order, title and link come from it, and a resource can take several", () => {
		const root = miniRoot(
			[
				{ name: 'Números', 'x-fc-categoria': 'whatsapp', tags: ['Números'] },
				{ name: 'Difusiones', 'x-fc-categoria': 'funnelchat', tags: ['Difusiones'] },
				{ name: 'Alertas', 'x-fc-categoria': 'funnelchat', tags: ['Alertas'] },
				{ name: 'Tu cuenta', 'x-fc-categoria': 'primer-uso', tags: ['Tu cuenta'] },
			],
			{
				'x-fc-categorias': [
					{ id: 'primer-uso', title: 'Primer uso', url: 'https://portal.example/' },
					{ id: 'whatsapp', title: 'Funciones de WhatsApp', url: 'https://portal.example/w/' },
					{ id: 'funnelchat', title: 'Funciones de Funnelchat', url: 'https://portal.example/f/' },
				],
			},
			// An operation the portal has in Difusiones, published in Numbers.
			{ operationResources: { 'broadcast.nueva': 'device' } },
		);
		copySpec(root, `${root}/incoming/funnelchat-v9.9.9.json`, '2026-11-11');
		const { result, resources, operations } = generated(root);
		expect(result.warnings).toEqual([]);
		expect(resources.map((r) => `${r.value} ${r.categories?.join(' + ')}`)).toEqual([
			'tuCuenta Primer uso',
			'device WhatsApp functions + Funnelchat functions',
			'broadcast Funnelchat functions',
			'alert Funnelchat functions',
		]);
		expect(operations.find((o) => o.value === 'broadcast.nueva')!.category).toBe(
			'Funnelchat functions',
		);
		// A category without an English name shows the portal's title, and is listed to review.
		expect(result.review).toContain(
			'The category "primer-uso" has no English name in categories.names of scripts/generator.config.json: it is shown as "Primer uso"',
		);
		// The README goes category by category, with its link; Numbers shows up in two of them.
		const block = result.readmeBlock;
		const at = (text: string) => block.indexOf(text);
		expect(at('#### [Primer uso](https://portal.example/) (1)')).toBeGreaterThan(-1);
		expect(at('#### [WhatsApp functions](https://portal.example/w/) (2)')).toBeGreaterThan(
			at('#### [Primer uso]'),
		);
		expect(at('#### [Funnelchat functions](https://portal.example/f/) (3)')).toBeGreaterThan(
			at('#### [WhatsApp functions]'),
		);
		expect(block.match(/<strong>Numbers<\/strong> \((\d)\)/g)).toEqual([
			'<strong>Numbers</strong> (2)',
			'<strong>Numbers</strong> (1)',
		]);
		expect(block).not.toContain('#### Other');
		expect(readText(root, 'spec/PROVENANCE.md')).toContain(
			'| Categories | Primer uso (`primer-uso`): 1 group, Funciones de WhatsApp (`whatsapp`): 1 group, Funciones de Funnelchat (`funnelchat`): 2 groups |',
		);
	});

	it('the node shows the categories of a resource in its description', () => {
		const node = new Funnelchat();
		const resource = node.description.properties.find((p) => p.name === 'resource')!;
		const options = resource.options as Array<{ value: string; description?: string }>;
		for (const r of RESOURCES) {
			const option = options.find((o) => o.value === r.value)!;
			expect(option.description ?? '', r.value).toBe(
				[r.categories?.length ? `${r.categories.join(', ')}.` : '', r.description]
					.filter(Boolean)
					.join(' '),
			);
		}
	});
});
