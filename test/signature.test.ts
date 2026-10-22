import { createHash, createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { verifySignature } from '../nodes/shared/signature';
import vectors from './fixtures/firmas.json';

/*
 * The vectors of the portal (developers-portal feat/armar-funnelchat-portal @ dd7cd42, tests/test_firmas.py): the same
 * secret, the same raw body and the same thirteen cases of `casos()`, in the same order (their names translated). On
 * top of that, a fixed-timestamp vector signed by the portal's own `firmar()` and the cases of the brief (several
 * `v1`). The fixture keeps the portal's own keys (`secreto`, `cuerpo`, `vector_fijo`…).
 */

const KEY = vectors.secreto;
const BODY = Buffer.from(vectors.cuerpo, 'utf8');

/** The portal's `firmar()`: `t=<t>,v1=<HMAC-SHA256 of "<t>." + raw body>`. */
function sign(body: Buffer, key: string, t: number): string {
	const v1 = createHmac('sha256', key).update(`${t}.`).update(body).digest('hex');
	return `t=${t},v1=${v1}`;
}

interface Case {
	name: string;
	body: Buffer;
	header: string;
	key: string;
	expected: boolean;
}

function cases(t: number): Case[] {
	const ok = sign(BODY, KEY, t);
	const v1 = ok.split('v1=')[1];
	const alteredV1 = (v1[0] !== '0' ? '0' : '1') + v1.slice(1);
	const alteredBody = Buffer.from(vectors.cuerpo.replace('Hola', 'Hole'), 'utf8');
	const reserializedBody = Buffer.from(JSON.stringify(JSON.parse(vectors.cuerpo), null, 2), 'utf8');
	const utf8Body = Buffer.from(vectors.cuerpo_utf8, 'utf8');
	const withoutPrefix = vectors.secreto_sin_prefijo;
	return [
		{ name: 'correct signature', body: BODY, header: ok, key: KEY, expected: true },
		{
			name: 'altered body (one character)',
			body: alteredBody,
			header: ok,
			key: KEY,
			expected: false,
		},
		{
			name: 're-serialized body (same JSON, other whitespace)',
			body: reserializedBody,
			header: ok,
			key: KEY,
			expected: false,
		},
		{
			name: 'altered signature (one digit)',
			body: BODY,
			header: `t=${t},v1=${alteredV1}`,
			key: KEY,
			expected: false,
		},
		{ name: 'wrong secret', body: BODY, header: ok, key: `${KEY}x`, expected: false },
		{
			name: 'altered timestamp in the header',
			body: BODY,
			header: `t=${t + 1},v1=${v1}`,
			key: KEY,
			expected: false,
		},
		{
			name: 'old timestamp (10 min ago), properly signed',
			body: BODY,
			header: sign(BODY, KEY, t - 600),
			key: KEY,
			expected: false,
		},
		{
			name: 'malformed header',
			body: BODY,
			header: `sha256=${v1}`,
			key: KEY,
			expected: false,
		},
		{ name: 'header without v1', body: BODY, header: `t=${t}`, key: KEY, expected: false },
		{ name: 'empty header', body: BODY, header: '', key: KEY, expected: false },
		{
			name: 'UTF-8 body (ñ, emoji) signed over the raw bytes',
			body: utf8Body,
			header: sign(utf8Body, KEY, t),
			key: KEY,
			expected: true,
		},
		{
			name: 'secret without the whsec_ prefix (used as is)',
			body: BODY,
			header: sign(BODY, withoutPrefix, t),
			key: withoutPrefix,
			expected: true,
		},
		{
			name: 'secret with its prefix cut by mistake',
			body: BODY,
			header: ok,
			key: KEY.replace(/^whsec_/, ''),
			expected: false,
		},
	];
}

describe("verifySignature with the portal's vectors (tests/test_firmas.py)", () => {
	const nowMs = Date.now();
	const t = Math.floor(nowMs / 1000);

	it("the fixture's body is the bytes the portal signs", () => {
		expect(createHash('sha256').update(BODY).digest('hex')).toBe(vectors.sha256_cuerpo);
	});

	for (const c of cases(t)) {
		it(c.name, () => {
			expect(verifySignature(c.body, c.header, c.key, 300, nowMs)).toBe(c.expected);
		});
	}
});

describe("fixed vector signed by the portal's firmar()", () => {
	const fixed = vectors.vector_fijo;
	const at = fixed.t * 1000;

	it('accepts the header computed by the reference implementation', () => {
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at)).toBe(true);
	});

	it('accepts the reference UTF-8 body and the secret without prefix', () => {
		expect(
			verifySignature(Buffer.from(vectors.cuerpo_utf8, 'utf8'), fixed.cabecera_utf8, KEY, 300, at),
		).toBe(true);
		expect(
			verifySignature(BODY, fixed.cabecera_sin_prefijo, vectors.secreto_sin_prefijo, 300, at),
		).toBe(true);
	});

	it('computes exactly the same v1', () => {
		expect(sign(BODY, KEY, fixed.t)).toBe(fixed.cabecera);
	});

	it('accepts the body as text as well as bytes', () => {
		expect(verifySignature(vectors.cuerpo, fixed.cabecera, KEY, 300, at)).toBe(true);
	});

	it('tolerates up to 300 s of difference, both ways, and rejects 301', () => {
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at + 300_000)).toBe(true);
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at - 300_000)).toBe(true);
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at + 301_000)).toBe(false);
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at - 301_000)).toBe(false);
	});
});

describe('several v1 in the header', () => {
	const fixed = vectors.vector_fijo;
	const at = fixed.t * 1000;
	const good = fixed.cabecera.split('v1=')[1];
	const other = sign(BODY, 'another-test-secret', fixed.t).split('v1=')[1];

	it('accepts if any matches, first or last', () => {
		expect(verifySignature(BODY, `t=${fixed.t},v1=${other},v1=${good}`, KEY, 300, at)).toBe(true);
		expect(verifySignature(BODY, `t=${fixed.t},v1=${good},v1=${other}`, KEY, 300, at)).toBe(true);
		expect(verifySignature(BODY, `t=${fixed.t}, v1=${other}, v1=${good}`, KEY, 300, at)).toBe(true);
	});

	it('rejects if none matches', () => {
		expect(verifySignature(BODY, `t=${fixed.t},v1=${other},v1=${other}`, KEY, 300, at)).toBe(false);
	});
});

describe('invalid input', () => {
	const fixed = vectors.vector_fijo;
	const at = fixed.t * 1000;

	it('without a header or a secret, it rejects', () => {
		expect(verifySignature(BODY, undefined, KEY, 300, at)).toBe(false);
		expect(verifySignature(BODY, fixed.cabecera, '', 300, at)).toBe(false);
		expect(verifySignature(BODY, fixed.cabecera, undefined, 300, at)).toBe(false);
	});

	it('a t that is not an integer, it rejects', () => {
		const v1 = fixed.cabecera.split('v1=')[1];
		expect(verifySignature(BODY, `t=1790000000.0,v1=${v1}`, KEY, 300, at)).toBe(false);
		expect(verifySignature(BODY, `t=-1790000000,v1=${v1}`, KEY, 300, at)).toBe(false);
	});
});
