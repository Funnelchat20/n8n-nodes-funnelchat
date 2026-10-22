import { describe, expect, it } from 'vitest';
import { Funnelchat } from '../nodes/Funnelchat/Funnelchat.node';
import { OPERATIONS, RESOURCES, SPEC_SOURCE } from '../nodes/Funnelchat/generated/operations';
import { generate, staleFiles } from '../scripts/generate.mjs';
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
			expect(op.value).toBe(fromSpec?.operationId);
			expect(op.name).toBe(english[op.value].name);
			expect(op.description.startsWith(english[op.value].purpose), op.value).toBe(true);
		}
	});

	it('the provenance records the copied specification (the generator refuses otherwise)', () => {
		expect(SPEC_SOURCE.sha256).toMatch(/^[0-9a-f]{64}$/);
		expect(() => generate()).not.toThrow();
	});

	it('the accounts subscriptions come from the supplement, with webhooks:* and the area rule', () => {
		const fromSupplement = OPERATIONS.filter((o) => o.source === 'accounts-webhook-subscriptions');
		expect(fromSupplement.map((o) => `${o.method} ${o.path}`)).toEqual([
			'GET /api/v1/webhooks',
			'POST /api/v1/webhooks',
			'GET /api/v1/webhooks/{id}',
			'PUT /api/v1/webhooks/{id}',
			'DELETE /api/v1/webhooks/{id}',
			'GET /api/v1/webhooks/{id}/deliveries',
			'POST /api/v1/webhooks/{id}/test',
		]);
		for (const o of fromSupplement) {
			expect(o.permission).toBe(o.method === 'GET' ? 'webhooks:read' : 'webhooks:write');
			expect(o.notice).toContain('read permission of the area');
		}
	});

	it('sends with an API key come from conversations v1.18.10: same operationId, new fields, without the v0 note', () => {
		const replaced = [
			'conversation.sendMessage',
			'message.sendMessage',
			'forwardMessage.store',
			'contactCard.store',
			'messageTemplate.send',
		];
		const paths = spec.paths as unknown as Record<string, Record<string, { operationId?: string }>>;
		for (const value of replaced) {
			const o = OPERATIONS.find((x) => x.value === value)!;
			expect(o.source, value).toBe('conversations-v1.18.10');
			expect(paths[o.path][o.method.toLowerCase()].operationId).toBe(value);
			expect(
				o.params.map((p) => p.apiName),
				value,
			).toContain('client_reference');
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
		// Nothing keeps the "on its way" note of the 13-10 snapshot.
		for (const o of OPERATIONS) expect(o.notice ?? '', o.value).not.toContain('PR #2284');
		for (const value of ['interactiveMessage.storePoll', 'interactiveMessage.storeEvent'])
			expect(OPERATIONS.find((x) => x.value === value)!.notice).toContain('route_not_available');
		expect(SPEC_SOURCE.supplements.find((x) => x.id === 'conversations-v1.18.10')).toMatchObject({
			replaced: 5,
		});
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
		for (const o of forms.filter((x) => x !== send))
			expect(o.permission, o.value).toBe(
				o.method === 'GET' ? 'conversations:read' : 'conversations:write',
			);
		expect(forms.find((o) => o.value === 'whatsappForm.index')!.list).toEqual({
			pagination: 'page',
			sizeParam: 'per_page',
			maxPageSize: 100,
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
