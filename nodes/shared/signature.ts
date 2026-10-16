import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verification of the `X-Funnelchat-Signature` header of a webhook delivery: `t=<unix>,v1=<hex>`, where `v1` is the
 * HMAC-SHA256, with the subscription's full secret, of `"<t>." + raw body`. There may be several `v1` (any one that
 * matches is enough) and `t` must be within 300 seconds of the server clock.
 *
 * A line-by-line port of the portal snippet `snippets/verificar-firma.js` (developers-portal
 * feat/armar-funnelchat-portal @ dd7cd42), which is what `tests/test_firmas.py` checks there and what platform-gate's
 * `Signature` signs. `test/signature.test.ts` runs the same vectors.
 */

export const SIGNATURE_HEADER = 'x-funnelchat-signature';
export const DEFAULT_TOLERANCE_SECONDS = 300;

export function verifySignature(
	rawBody: Buffer | string,
	header: unknown,
	secret: unknown,
	toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
	nowMs = Date.now(),
): boolean {
	if (typeof header !== 'string' || typeof secret !== 'string' || secret === '') return false;

	let t: string | null = null;
	const signatures: string[] = [];
	for (const part of header.split(',')) {
		const i = part.indexOf('=');
		if (i === -1) continue;
		const key = part.slice(0, i).trim();
		const value = part.slice(i + 1).trim();
		if (key === 't') t = value;
		if (key === 'v1') signatures.push(value);
	}
	if (t === null || !/^\d+$/.test(t) || signatures.length === 0) return false;

	// Reject old deliveries and deliveries from the future (replay protection).
	if (Math.abs(Math.floor(nowMs / 1000) - Number(t)) > toleranceSeconds) return false;

	const expected = createHmac('sha256', secret).update(`${t}.`).update(rawBody).digest('hex');
	const a = Buffer.from(expected, 'utf8');

	return signatures.some((v1) => {
		const b = Buffer.from(v1, 'utf8');
		return a.length === b.length && timingSafeEqual(a, b);
	});
}
