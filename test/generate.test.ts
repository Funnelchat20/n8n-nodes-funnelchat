import { describe, expect, it } from 'vitest';
import { Funnelchat } from '../nodes/Funnelchat/Funnelchat.node';
import { OPERATIONS, RESOURCES, SPEC_SOURCE } from '../nodes/Funnelchat/generated/operations';
import { generate, staleFiles } from '../scripts/generate.mjs';
import spec from '../spec/funnelchat.json';

describe('generación desde la especificación', () => {
	it('lo generado está al día con spec/ (si falla: npm run generate)', () => {
		expect(staleFiles()).toEqual([]);
	});

	it('cada recurso del portal pedido tiene operaciones', () => {
		expect(RESOURCES.map((r) => r.name)).toEqual([
			'Contactos',
			'Conversaciones y mensajes',
			'Plantillas',
			'Etiquetas',
			'Campos personalizados',
			'Grupos',
			'Números',
			'Webhooks',
		]);
		for (const r of RESOURCES)
			expect(OPERATIONS.filter((o) => o.resource === r.value).length, r.value).toBeGreaterThan(0);
	});

	it('los nombres son los summary del portal y las rutas, las de la especificación', () => {
		const paths = spec.paths as unknown as Record<
			string,
			Record<string, { summary?: string; operationId?: string }>
		>;
		for (const op of OPERATIONS.filter((o) => o.source === 'spec')) {
			const fromSpec = paths[op.path]?.[op.method.toLowerCase()];
			expect(fromSpec, `${op.method} ${op.path}`).toBeDefined();
			expect(op.name).toBe(fromSpec?.summary);
			expect(op.value).toBe(fromSpec?.operationId);
		}
	});

	it('la procedencia registra la especificación copiada (el generador se niega si no)', () => {
		expect(SPEC_SOURCE.sha256).toMatch(/^[0-9a-f]{64}$/);
		expect(() => generate()).not.toThrow();
	});

	it('las suscripciones de accounts vienen del suplemento y avisan su estado', () => {
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
		for (const o of fromSupplement) expect(o.notice).toContain('route_not_available');
	});

	it('los envíos pendientes en v0 llevan la nota del portal', () => {
		const sends = OPERATIONS.filter((o) => o.permission === 'conversations:send');
		expect(sends.length).toBeGreaterThan(0);
		for (const o of sends) expect(o.notice, o.value).toContain('PR #2284');
	});

	it('los listados paginados ofrecen «devolver todo»', () => {
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
			]),
		);
	});
});
