import { describe, expect, it } from 'vitest';
import { Funnelchat } from '../nodes/Funnelchat/Funnelchat.node';
import { OPERATIONS, RESOURCES, SPEC_SOURCE } from '../nodes/Funnelchat/generated/operations';
import { generate, looksSpanish, staleFiles } from '../scripts/generate.mjs';
import published from './fixtures/published-operations.json';
import translations from '../scripts/operations.en.json';
import spec from '../spec/funnelchat.json';

describe('generation from the specification', () => {
	it('the generated files are up to date with spec/ (if it fails: npm run generate)', () => {
		expect(staleFiles()).toEqual([]);
	});

	it('each resource of the portal that was asked for has operations', () => {
		expect(RESOURCES.map((r) => r.name)).toEqual([
			'Contacts',
			'Conversations and Messages',
			'Templates',
			'WhatsApp Forms',
			'Tags',
			'Custom Fields',
			'Groups',
			'Numbers',
			'Webhooks',
		]);
		for (const r of RESOURCES)
			expect(OPERATIONS.filter((o) => o.resource === r.value).length, r.value).toBeGreaterThan(0);
	});

	it("the specification's operations keep their route and operationId, with their English name", () => {
		const paths = spec.paths as unknown as Record<string, Record<string, { operationId?: string }>>;
		const english = translations as unknown as Record<string, { name: string; purpose: string }>;
		for (const op of OPERATIONS.filter((o) => o.source === 'spec')) {
			const fromSpec = paths[op.path]?.[op.method.toLowerCase()];
			expect(fromSpec, `${op.method} ${op.path}`).toBeDefined();
			const operationId = op.operationId ?? op.value;
			expect(operationId).toBe(fromSpec?.operationId);
			expect(op.name).toBe(english[operationId].name);
			expect(op.description.startsWith(english[operationId].purpose), op.value).toBe(true);
		}
	});

	it('every operation the node has published is still there, in its resource', () => {
		const values = new Map(OPERATIONS.map((o) => [o.value, o.resource]));
		for (const { resource, value } of published.operations)
			expect(values.get(value), value).toBe(resource);
		expect(OPERATIONS.length).toBeGreaterThanOrEqual(published.operations.length);
	});

	it('an operation the specification renamed keeps the value saved workflows use', () => {
		const show = OPERATIONS.find((o) => o.value === 'showMessage')!;
		expect(show.operationId).toBe('message.showMessage');
		expect(OPERATIONS.find((o) => o.value === 'message.showMessage')).toBeUndefined();
		// The rest are the specification's own.
		expect(OPERATIONS.filter((o) => o.operationId).map((o) => o.value)).toEqual(['showMessage']);
	});

	it('the provenance records the copied specification (the generator refuses otherwise)', () => {
		expect(SPEC_SOURCE.sha256).toBe(
			'0f451feaba59418f3a556f58856f841f12570973fd6525103e8cc0128ab64374',
		);
		expect(() => generate()).not.toThrow();
		expect(generate().warnings).toEqual([]);
		expect(SPEC_SOURCE.supplements.map((s) => s.id)).toEqual([
			'conversations-forms',
			'conversations-kept-2026-10-15',
			'communities-v2.35.5',
		]);
		for (const s of SPEC_SOURCE.supplements) expect(s.ignored, s.id).toBe(0);
	});

	it('the webhook subscriptions come from the specification, with webhooks:* and the area rule', () => {
		const subscriptions = OPERATIONS.filter(
			(o) =>
				o.path.startsWith('/api/v1/webhooks') &&
				!o.path.includes('endpoints') &&
				!o.path.endsWith('/events'),
		);
		expect(subscriptions.map((o) => `${o.method} ${o.path} ${o.source}`)).toEqual([
			'GET /api/v1/webhooks spec',
			'POST /api/v1/webhooks spec',
			'GET /api/v1/webhooks/{id} spec',
			'PUT /api/v1/webhooks/{id} spec',
			'DELETE /api/v1/webhooks/{id} spec',
			'GET /api/v1/webhooks/{id}/deliveries spec',
			'POST /api/v1/webhooks/{id}/test spec',
		]);
		for (const o of subscriptions) {
			expect(o.resource, o.value).toBe('webhook');
			expect(o.permission).toBe(o.method === 'GET' ? 'webhooks:read' : 'webhooks:write');
			expect(o.notice).toContain('read permission of the area');
		}
		// Typed with commas, as the node published them, although the specification now lists the types.
		for (const value of ['webhookSubscription.store', 'webhookSubscription.update'])
			expect(
				OPERATIONS.find((o) => o.value === value)!.params.find((p) => p.apiName === 'events')!.kind,
			).toBe('list');
		// Filters the code reads and the specification does not list.
		const deliveries = OPERATIONS.find((o) => o.value === 'webhookSubscriptionDelivery.index')!;
		expect(deliveries.params.map((p) => p.apiName)).toEqual(['id', 'event_type', 'event_id']);
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
			expect(o.source, value).toBe('spec');
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
		// Poll and event invitation, still closed to keys, kept so saved workflows do not lose them.
		for (const value of ['interactiveMessage.storePoll', 'interactiveMessage.storeEvent']) {
			const o = OPERATIONS.find((x) => x.value === value)!;
			expect(o.source).toBe('conversations-kept-2026-10-15');
			expect(o.notice).toContain('route_not_available');
		}
	});

	it('no text the node shows is in Spanish', () => {
		for (const o of OPERATIONS) {
			expect(looksSpanish(o.name), o.value).toBe(false);
			expect(looksSpanish(o.description), o.value).toBe(false);
			expect(looksSpanish(o.notice ?? ''), o.value).toBe(false);
			for (const p of o.params)
				expect(looksSpanish(p.description ?? ''), `${o.value} ${p.apiName}`).toBe(false);
		}
	});

	it('message by ID and WhatsApp forms, with their permission', () => {
		const show = OPERATIONS.find((o) => o.value === 'showMessage')!;
		expect(`${show.method} ${show.path} ${show.permission}`).toBe(
			'GET /api/v1/contacts/{contact}/messages/{message} conversations:read',
		);
		const forms = OPERATIONS.filter((o) => o.resource === 'form');
		expect(forms).toHaveLength(19);
		const send = forms.find((o) => o.value === 'whatsappFormSend.store')!;
		expect(send.permission).toBe('conversations:send');
		expect(send.params.filter((p) => p.required).map((p) => p.apiName)).toEqual([
			'contact',
			'form_id',
			'device_id',
		]);
		for (const o of forms.filter((x) => x !== send)) {
			expect(o.source, o.value).toBe('conversations-forms');
			expect(o.permission, o.value).toBe(
				o.method === 'GET' ? 'conversations:read' : 'conversations:write',
			);
		}
		expect(forms.find((o) => o.value === 'whatsappForm.index')!.list).toEqual({
			pagination: 'page',
			sizeParam: 'per_page',
			maxPageSize: 100,
		});
	});

	it('connecting a number comes from the specification, with the operationIds of the supplement it replaces', () => {
		const numbers = OPERATIONS.filter(
			(o) =>
				['device.index', 'deviceProvisioning.store', 'deviceProvisioning.qr'].includes(o.value) ||
				o.value.startsWith('connectLink.'),
		);
		expect(
			numbers.map((o) => `${o.method} ${o.path} ${o.value} ${o.permission} ${o.source}`),
		).toEqual([
			'GET /api/v1/devices device.index accounts:read spec',
			'POST /api/v1/devices deviceProvisioning.store accounts:operate spec',
			'GET /api/v1/devices/{device}/qr deviceProvisioning.qr accounts:operate spec',
			'GET /api/v1/connect-links connectLink.index accounts:read spec',
			'POST /api/v1/connect-links connectLink.store accounts:operate spec',
			'GET /api/v1/connect-links/{link} connectLink.show accounts:read spec',
			'DELETE /api/v1/connect-links/{link} connectLink.destroy accounts:operate spec',
		]);
		for (const o of numbers) {
			expect(o.resource, o.value).toBe('device');
			// accounts:operate here gives control of a number; it is not an irreversible operation.
			expect(o.notice ?? '', o.value).not.toContain('Irreversible');
		}
		expect(OPERATIONS.find((o) => o.value === 'device.destroy')!.notice).toContain(
			'Irreversible operation',
		);
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

	it('new operations of the specification: mark as read, typing and template metrics', () => {
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
	});

	it('a message to a group comes from communities v2.35.5, in the Groups resource', () => {
		const send = OPERATIONS.find((o) => o.value === 'apiGroupAction.sendMessage')!;
		expect(`${send.resource} ${send.method} ${send.path} ${send.permission}`).toBe(
			'group POST /api/v1/groups/{group}/messages communities:send',
		);
		expect(send.params.filter((p) => p.required).map((p) => p.apiName)).toEqual([
			'group',
			'device_id',
			'type',
		]);
		expect(send.params.find((p) => p.apiName === 'type')!.options).toEqual([
			'text',
			'image',
			'video',
			'audio',
			'document',
		]);
		expect(send.notice).toContain('Get a group action');
		const show = OPERATIONS.find((o) => o.value === 'apiGroupAction.show')!;
		expect(`${show.resource} ${show.method} ${show.path} ${show.permission}`).toBe(
			'group GET /api/v1/groups/actions/{action} communities:read',
		);
		// Group actions are on in production (API_GROUP_ACTIONS_ENABLED=true, 04-11): no "may be off" notice.
		for (const o of [send, show])
			expect(o.notice ?? '', o.value).not.toContain('route_not_available');
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

	it('the default operation of each resource does not change (saved workflows rely on it)', () => {
		const node = new Funnelchat();
		const defaults = Object.fromEntries(
			node.description.properties
				.filter((p) => p.name === 'operation')
				.map((p) => [p.displayOptions!.show!.resource![0], p.default]),
		);
		expect(defaults).toEqual({
			contact: 'contact.customFields',
			conversation: 'conversation.getLatestMessages',
			template: 'messageTemplate.quickReplyButtons',
			form: 'whatsappForm.responses',
			tag: 'tag.index',
			customField: 'customField.index',
			group: 'campaign.participantEvents',
			device: 'deviceConnectionEvent.index',
			webhook: 'webhookSubscriptionDelivery.index',
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
			]),
		);
	});
});
