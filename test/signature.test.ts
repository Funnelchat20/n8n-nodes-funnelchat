import { createHash, createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { verifySignature } from '../nodes/shared/signature';
import vectors from './fixtures/firmas.json';

/*
 * The vectors of the portal (developers-portal feat/armar-funnelchat-portal @ dd7cd42, tests/test_firmas.py): the same
 * secret, the same raw body and the same thirteen cases of `casos()`, in the same order and with the same names. On top
 * of that, a fixed-timestamp vector signed by the portal's own `firmar()` and the cases of the brief (several `v1`).
 */

const KEY = vectors.secreto;
const BODY = Buffer.from(vectors.cuerpo, 'utf8');

function firmar(body: Buffer, key: string, t: number): string {
	const v1 = createHmac('sha256', key).update(`${t}.`).update(body).digest('hex');
	return `t=${t},v1=${v1}`;
}

interface Case {
	nombre: string;
	cuerpo: Buffer;
	cabecera: string;
	clave: string;
	esperado: boolean;
}

function casos(t: number): Case[] {
	const ok = firmar(BODY, KEY, t);
	const v1 = ok.split('v1=')[1];
	const v1Alterada = (v1[0] !== '0' ? '0' : '1') + v1.slice(1);
	const cuerpoAlterado = Buffer.from(vectors.cuerpo.replace('Hola', 'Hole'), 'utf8');
	const cuerpoReserializado = Buffer.from(
		JSON.stringify(JSON.parse(vectors.cuerpo), null, 2),
		'utf8',
	);
	const cuerpoUtf8 = Buffer.from(vectors.cuerpo_utf8, 'utf8');
	const sinPrefijo = vectors.secreto_sin_prefijo;
	return [
		{ nombre: 'firma correcta', cuerpo: BODY, cabecera: ok, clave: KEY, esperado: true },
		{
			nombre: 'cuerpo alterado (un carácter)',
			cuerpo: cuerpoAlterado,
			cabecera: ok,
			clave: KEY,
			esperado: false,
		},
		{
			nombre: 'cuerpo re-serializado (mismo JSON, otros espacios)',
			cuerpo: cuerpoReserializado,
			cabecera: ok,
			clave: KEY,
			esperado: false,
		},
		{
			nombre: 'firma alterada (un dígito)',
			cuerpo: BODY,
			cabecera: `t=${t},v1=${v1Alterada}`,
			clave: KEY,
			esperado: false,
		},
		{ nombre: 'secreto equivocado', cuerpo: BODY, cabecera: ok, clave: `${KEY}x`, esperado: false },
		{
			nombre: 'timestamp alterado en la cabecera',
			cuerpo: BODY,
			cabecera: `t=${t + 1},v1=${v1}`,
			clave: KEY,
			esperado: false,
		},
		{
			nombre: 'timestamp viejo (hace 10 min), bien firmado',
			cuerpo: BODY,
			cabecera: firmar(BODY, KEY, t - 600),
			clave: KEY,
			esperado: false,
		},
		{
			nombre: 'cabecera mal formada',
			cuerpo: BODY,
			cabecera: `sha256=${v1}`,
			clave: KEY,
			esperado: false,
		},
		{ nombre: 'cabecera sin v1', cuerpo: BODY, cabecera: `t=${t}`, clave: KEY, esperado: false },
		{ nombre: 'cabecera vacía', cuerpo: BODY, cabecera: '', clave: KEY, esperado: false },
		{
			nombre: 'cuerpo UTF-8 (ñ, emoji) firmado sobre los bytes crudos',
			cuerpo: cuerpoUtf8,
			cabecera: firmar(cuerpoUtf8, KEY, t),
			clave: KEY,
			esperado: true,
		},
		{
			nombre: 'secreto sin prefijo whsec_ (se usa tal cual)',
			cuerpo: BODY,
			cabecera: firmar(BODY, sinPrefijo, t),
			clave: sinPrefijo,
			esperado: true,
		},
		{
			nombre: 'secreto con prefijo recortado por error',
			cuerpo: BODY,
			cabecera: ok,
			clave: KEY.replace(/^whsec_/, ''),
			esperado: false,
		},
	];
}

describe('verifySignature con los vectores del portal (tests/test_firmas.py)', () => {
	const nowMs = Date.now();
	const t = Math.floor(nowMs / 1000);

	it('el cuerpo del fixture son los bytes que firma el portal', () => {
		expect(createHash('sha256').update(BODY).digest('hex')).toBe(vectors.sha256_cuerpo);
	});

	for (const c of casos(t)) {
		it(c.nombre, () => {
			expect(verifySignature(c.cuerpo, c.cabecera, c.clave, 300, nowMs)).toBe(c.esperado);
		});
	}
});

describe('vector fijo firmado por firmar() del portal', () => {
	const fixed = vectors.vector_fijo;
	const at = fixed.t * 1000;

	it('acepta la cabecera calculada por la implementación de referencia', () => {
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at)).toBe(true);
	});

	it('acepta el cuerpo UTF-8 y el secreto sin prefijo de referencia', () => {
		expect(
			verifySignature(Buffer.from(vectors.cuerpo_utf8, 'utf8'), fixed.cabecera_utf8, KEY, 300, at),
		).toBe(true);
		expect(
			verifySignature(BODY, fixed.cabecera_sin_prefijo, vectors.secreto_sin_prefijo, 300, at),
		).toBe(true);
	});

	it('calcula exactamente el mismo v1', () => {
		expect(firmar(BODY, KEY, fixed.t)).toBe(fixed.cabecera);
	});

	it('acepta el cuerpo como texto además de como bytes', () => {
		expect(verifySignature(vectors.cuerpo, fixed.cabecera, KEY, 300, at)).toBe(true);
	});

	it('tolera hasta 300 s de diferencia, en los dos sentidos, y rechaza 301', () => {
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at + 300_000)).toBe(true);
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at - 300_000)).toBe(true);
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at + 301_000)).toBe(false);
		expect(verifySignature(BODY, fixed.cabecera, KEY, 300, at - 301_000)).toBe(false);
	});
});

describe('varias v1 en la cabecera', () => {
	const fixed = vectors.vector_fijo;
	const at = fixed.t * 1000;
	const good = fixed.cabecera.split('v1=')[1];
	const other = firmar(BODY, 'otro-secreto-de-prueba', fixed.t).split('v1=')[1];

	it('acepta si alguna coincide, esté primera o última', () => {
		expect(verifySignature(BODY, `t=${fixed.t},v1=${other},v1=${good}`, KEY, 300, at)).toBe(true);
		expect(verifySignature(BODY, `t=${fixed.t},v1=${good},v1=${other}`, KEY, 300, at)).toBe(true);
		expect(verifySignature(BODY, `t=${fixed.t}, v1=${other}, v1=${good}`, KEY, 300, at)).toBe(true);
	});

	it('rechaza si ninguna coincide', () => {
		expect(verifySignature(BODY, `t=${fixed.t},v1=${other},v1=${other}`, KEY, 300, at)).toBe(false);
	});
});

describe('entradas inválidas', () => {
	const fixed = vectors.vector_fijo;
	const at = fixed.t * 1000;

	it('sin cabecera o sin secreto, rechaza', () => {
		expect(verifySignature(BODY, undefined, KEY, 300, at)).toBe(false);
		expect(verifySignature(BODY, fixed.cabecera, '', 300, at)).toBe(false);
		expect(verifySignature(BODY, fixed.cabecera, undefined, 300, at)).toBe(false);
	});

	it('un t que no es un entero, rechaza', () => {
		const v1 = fixed.cabecera.split('v1=')[1];
		expect(verifySignature(BODY, `t=1790000000.0,v1=${v1}`, KEY, 300, at)).toBe(false);
		expect(verifySignature(BODY, `t=-1790000000,v1=${v1}`, KEY, 300, at)).toBe(false);
	});
});
