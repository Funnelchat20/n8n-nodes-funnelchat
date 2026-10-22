import type { IDataObject } from 'n8n-workflow';
import type { HttpMethod, OperationSpec, ParamSpec } from './operationTypes';

/** Values of an operation's parameters, by n8n parameter name (top-level fields and collections merged). */
export type ParamValues = Record<string, unknown>;

export type QueryPair = [string, string];

export interface BuiltRequest {
	method: HttpMethod;
	path: string;
	query: QueryPair[];
	body?: IDataObject | IDataObject[];
}

export class RequestBuildError extends Error {
	constructor(
		message: string,
		readonly param?: string,
	) {
		super(message);
		this.name = 'RequestBuildError';
	}
}

function isEmpty(value: unknown): boolean {
	if (value === undefined || value === null) return true;
	if (typeof value === 'string') return value.trim() === '';
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

function toScalar(
	value: unknown,
	type: ParamSpec['valueType'],
	param: ParamSpec,
): string | number | boolean {
	if (type === 'integer' || type === 'number') {
		const n = typeof value === 'number' ? value : Number(String(value).trim());
		if (!Number.isFinite(n)) {
			throw new RequestBuildError(
				`«${param.displayName}» tiene que ser un número (recibió ${String(value)}).`,
				param.name,
			);
		}
		return type === 'integer' ? Math.trunc(n) : n;
	}
	if (type === 'boolean') {
		if (typeof value === 'boolean') return value;
		return ['1', 'true', 'sí', 'si', 'yes'].includes(String(value).trim().toLowerCase());
	}
	return typeof value === 'string' ? value : String(value);
}

function toDateString(value: unknown, format: ParamSpec['format']): string {
	let text: string;
	if (
		value &&
		typeof value === 'object' &&
		typeof (value as { toISO?: unknown }).toISO === 'function'
	) {
		text = String((value as { toISO: () => string }).toISO());
	} else if (value instanceof Date) {
		text = value.toISOString();
	} else {
		text = String(value).trim();
	}
	return format === 'date' ? text.slice(0, 10) : text;
}

const INVALID_JSON = Symbol('invalid-json');

function tryJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return INVALID_JSON;
	}
}

function parseJson(value: unknown, param: ParamSpec): unknown {
	if (typeof value !== 'string') return value;
	const parsed = tryJson(value);
	if (parsed === INVALID_JSON) {
		throw new RequestBuildError(`«${param.displayName}» no es un JSON válido.`, param.name);
	}
	return parsed;
}

/** Converts what n8n gives for a parameter to the value the API expects. */
export function coerceValue(param: ParamSpec, value: unknown): unknown {
	switch (param.kind) {
		case 'number':
			return toScalar(value, param.valueType ?? 'number', param);
		case 'boolean':
			return toScalar(value, 'boolean', param);
		case 'options':
			return toScalar(value, param.valueType ?? 'string', param);
		case 'multiOptions':
		case 'list': {
			const items = Array.isArray(value)
				? value
				: String(value)
						.split(',')
						.map((s) => s.trim())
						.filter((s) => s !== '');
			return items.map((item) => toScalar(item, param.valueType ?? 'string', param));
		}
		case 'dateTime':
			return toDateString(value, param.format);
		case 'json':
		case 'body':
			return parseJson(value, param);
		case 'string':
		default:
			return typeof value === 'string' ? value : String(value);
	}
}

/** Laravel reads `a[]=1&a[]=2` and `f[0][mode]=all`; booleans go as `1`/`0`, which its `boolean` rule accepts. */
export function serializeQuery(key: string, value: unknown, out: QueryPair[] = []): QueryPair[] {
	if (value === undefined || value === null) return out;
	if (Array.isArray(value)) {
		const scalars = value.every((v) => v === null || typeof v !== 'object');
		if (scalars) {
			const k = key.endsWith('[]') ? key : `${key}[]`;
			for (const v of value) if (v !== null && v !== undefined) serializeQuery(k, v, out);
		} else {
			const base = key.replace(/\[\]$/, '');
			value.forEach((v, i) => serializeQuery(`${base}[${i}]`, v, out));
		}
		return out;
	}
	if (typeof value === 'object') {
		for (const [k, v] of Object.entries(value as IDataObject))
			serializeQuery(`${key}[${k}]`, v, out);
		return out;
	}
	if (typeof value === 'boolean') {
		out.push([key, value ? '1' : '0']);
		return out;
	}
	out.push([key, String(value)]);
	return out;
}

function encodeKey(key: string): string {
	return encodeURIComponent(key).replace(/%5B/gi, '[').replace(/%5D/gi, ']');
}

export function toUrl(path: string, query: QueryPair[]): string {
	if (query.length === 0) return path;
	return `${path}?${query.map(([k, v]) => `${encodeKey(k)}=${encodeURIComponent(v)}`).join('&')}`;
}

/**
 * Builds method, path, query and body of an operation from the values of its parameters. Pure: the node collects the
 * values from n8n and the tests pass them directly.
 *
 * With `jsonBody`, the body is that JSON as given and the body fields are ignored (path and query still apply).
 */
export function buildRequest(
	op: OperationSpec,
	values: ParamValues,
	jsonBody?: unknown,
): BuiltRequest {
	let path = op.path;
	const query: QueryPair[] = [];
	let body: IDataObject | IDataObject[] | undefined;

	for (const param of op.params) {
		const raw = values[param.name];
		if (param.location === 'path') {
			if (isEmpty(raw)) throw new RequestBuildError(`Falta «${param.displayName}».`, param.name);
			const value = String(raw).trim();
			path = path.replace(`{${param.apiName}}`, encodeURIComponent(value));
			continue;
		}
		if (param.location === 'body' && jsonBody !== undefined) continue;
		if (isEmpty(raw)) {
			if (param.required) throw new RequestBuildError(`Falta «${param.displayName}».`, param.name);
			continue;
		}
		const value = coerceValue(param, raw);
		if (param.location === 'query') {
			serializeQuery(param.apiName, value, query);
		} else if (param.kind === 'body') {
			body = value as IDataObject[];
		} else {
			body = {
				...((body as IDataObject) ?? {}),
				[param.apiName]: value as IDataObject[keyof IDataObject],
			};
		}
	}

	if (jsonBody !== undefined) {
		const parsed = typeof jsonBody === 'string' ? safeJson(jsonBody) : jsonBody;
		if (parsed === undefined || parsed === null || typeof parsed !== 'object') {
			throw new RequestBuildError(
				'El cuerpo JSON tiene que ser un objeto o una lista.',
				'jsonBody',
			);
		}
		body = parsed as IDataObject | IDataObject[];
	}

	if (op.body && body === undefined && op.method !== 'GET' && op.method !== 'DELETE') body = {};
	return { method: op.method, path, query, ...(body !== undefined ? { body } : {}) };
}

function safeJson(text: string): unknown {
	const parsed = tryJson(text);
	if (parsed === INVALID_JSON)
		throw new RequestBuildError('El cuerpo JSON no es válido.', 'jsonBody');
	return parsed;
}

// ---------------------------------------------------------------------------------------------------------------
// Responses and pagination
// ---------------------------------------------------------------------------------------------------------------

/** The items of a list response (`[...]` or `{data: [...]}`), or `undefined` if it is not a list. */
export function extractItems(body: unknown): unknown[] | undefined {
	if (Array.isArray(body)) return body;
	if (body && typeof body === 'object' && Array.isArray((body as IDataObject).data)) {
		return (body as IDataObject).data as unknown[];
	}
	return undefined;
}

export type NextPage = { page: number } | { cursor: string } | null;

/** Where the next page is, from Laravel's `meta` (`current_page`/`last_page`, `next_cursor`) or `links.next`. */
export function nextPage(
	body: unknown,
	pagination: 'page' | 'cursor',
	currentPage: number,
): NextPage {
	if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
	const b = body as IDataObject;
	const meta = (b.meta && typeof b.meta === 'object' ? b.meta : {}) as IDataObject;
	if (pagination === 'cursor') {
		const cursor = meta.next_cursor ?? b.next_cursor;
		const hasMore = b.has_more;
		if (hasMore === false || hasMore === 'false' || hasMore === 0 || hasMore === '0') return null;
		return typeof cursor === 'string' && cursor !== '' ? { cursor } : null;
	}
	const current = Number(meta.current_page);
	const last = Number(meta.last_page);
	if (Number.isFinite(current) && Number.isFinite(last) && meta.last_page !== undefined) {
		return current < last ? { page: current + 1 } : null;
	}
	const links = (b.links && typeof b.links === 'object' ? b.links : {}) as IDataObject;
	return links.next ? { page: currentPage + 1 } : null;
}

function isObject(value: unknown): value is IDataObject {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * What one API response becomes in n8n: one item per element of a list, the object of `{data: {...}}`, the message
 * of a send (`{message: {...}}`, one item per message of `{messages: [...]}`), the body as is, `{success: true}` for
 * an empty body, and `{result}` for a scalar.
 */
export function responseToItems(body: unknown): IDataObject[] {
	if (isObject(body) && Object.keys(body).length === 1) {
		if (isObject(body.message)) return [body.message];
		if (Array.isArray(body.messages) && body.messages.every(isObject))
			return body.messages as IDataObject[];
	}
	const items = extractItems(body);
	if (items)
		return items.map((i) =>
			i && typeof i === 'object' ? (i as IDataObject) : { value: i as string },
		);
	if (body === undefined || body === null || body === '') return [{ success: true }];
	if (typeof body !== 'object') return [{ result: body as string }];
	const b = body as IDataObject;
	const keys = Object.keys(b);
	if (keys.length === 1 && keys[0] === 'data' && b.data && typeof b.data === 'object')
		return [b.data as IDataObject];
	return [b];
}
