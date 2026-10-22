import {
	NodeApiError,
	NodeOperationError,
	sleep,
	type IDataObject,
	type IExecuteFunctions,
	type IHookFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type ILoadOptionsFunctions,
	type IN8nHttpFullResponse,
	type INode,
	type JsonObject,
} from 'n8n-workflow';

export const CREDENTIAL_NAME = 'funnelchatApi';

/** Base URL of each environment of the credential (`environment`). */
export const BASE_URLS: Record<string, string> = {
	production: 'https://api.funnelchat.com',
	staging: 'https://api-staging.funnelchat.com',
};

/** A `429` is retried after `Retry-After` when the wait is this short (seconds), at most `MAX_RETRIES` times. */
const MAX_RETRY_AFTER_SECONDS = 60;
const MAX_RETRIES = 3;

export type FunnelchatContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

export interface FunnelchatRequest {
	method: IHttpRequestMethods;
	/** Path with its query string, e.g. `/api/v1/contacts?perPage=100`. */
	url: string;
	body?: IDataObject | IDataObject[];
	itemIndex?: number;
	/** Error statuses returned as a response instead of thrown (e.g. `404` when checking a subscription). */
	acceptStatuses?: number[];
}

export interface FunnelchatResponse {
	statusCode: number;
	headers: IDataObject;
	body: unknown;
}

/** The `environment` value of a custom base URL (for example the local sandbox, `http://localhost:4010`). */
export const CUSTOM_ENVIRONMENT = 'custom';

/** A custom base URL is `http://` or `https://` with a host, and does not end in `/` (the node appends `/api/v1/…`). */
export function isValidBaseUrl(value: unknown): value is string {
	if (typeof value !== 'string' || value !== value.trim()) return false;
	if (!/^https?:\/\/[^\s/?#]+/.test(value) || value.endsWith('/') || /[?#]/.test(value))
		return false;
	try {
		const url = new URL(value);
		return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '';
	} catch {
		return false;
	}
}

/** The base URL of the credential: the one of its environment, or its own when the environment is `custom`. */
export function baseUrlFor(environment: unknown, customBaseUrl?: unknown): string | undefined {
	if (environment === CUSTOM_ENVIRONMENT)
		return isValidBaseUrl(customBaseUrl) ? customBaseUrl : undefined;
	return BASE_URLS[String(environment)] ?? BASE_URLS.production;
}

function header(headers: IDataObject | undefined, name: string): string | undefined {
	if (!headers) return undefined;
	const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
	const value = key ? headers[key] : undefined;
	if (Array.isArray(value)) return value.length ? String(value[0]) : undefined;
	return value === undefined || value === null ? undefined : String(value);
}

/** Seconds to wait from a `Retry-After` header (seconds or an HTTP date), or `undefined`. */
export function retryAfterSeconds(
	headers: IDataObject | undefined,
	now = Date.now(),
): number | undefined {
	const value = header(headers, 'retry-after');
	if (value === undefined || value.trim() === '') return undefined;
	if (/^\d+$/.test(value.trim())) return Number(value.trim());
	const date = Date.parse(value);
	if (Number.isNaN(date)) return undefined;
	return Math.max(0, Math.ceil((date - now) / 1000));
}

function parseBody(body: unknown): unknown {
	if (typeof body !== 'string') return body;
	const text = body.trim();
	if (text === '') return undefined;
	try {
		return JSON.parse(text);
	} catch {
		return body;
	}
}

/** The `X-Request-Id` of a response: every response of the API carries one, errors included, to quote to support. */
export function requestIdOf(headers: IDataObject | undefined): string | undefined {
	const value = header(headers, 'x-request-id')?.trim();
	return value ? value : undefined;
}

/**
 * The API's error as an n8n error: `message` from the body's `message`, and the stable `error` code (plus the
 * validation details of a `422`, the `Retry-After` of a `429` and the `X-Request-Id`) in the description.
 *
 * A `502` (the API could not reach its origin, or the origin failed) on a write is a timeout: the write may have been
 * applied, so the description says to read the state before repeating it.
 */
export function apiError(
	node: INode,
	response: FunnelchatResponse,
	itemIndex?: number,
	method?: IHttpRequestMethods,
): NodeApiError {
	const body = parseBody(response.body);
	const data =
		body && typeof body === 'object' && !Array.isArray(body) ? (body as IDataObject) : {};
	const code = typeof data.error === 'string' ? data.error : undefined;
	const apiMessage =
		typeof data.message === 'string' && data.message.trim() !== '' ? data.message : undefined;
	const requestId = requestIdOf(response.headers);

	const details: string[] = [];
	if (code) details.push(`error: ${code}`);
	if (data.errors && typeof data.errors === 'object') {
		for (const [field, messages] of Object.entries(data.errors as IDataObject)) {
			const list = Array.isArray(messages) ? messages.map(String) : [String(messages)];
			details.push(`${field}: ${list.join(' ')}`);
		}
	}
	const wait = retryAfterSeconds(response.headers);
	if (response.statusCode === 429 && wait !== undefined) {
		details.push(`Try again in ${wait} s (Retry-After).`);
	}
	if (response.statusCode === 502 && method !== undefined && method !== 'GET') {
		details.push('The change may have been applied anyway: check the state before repeating it.');
	}
	if (!apiMessage && typeof body === 'string' && body.trim() !== '') {
		details.push(body.slice(0, 300));
	}
	if (requestId) details.push(`X-Request-Id: ${requestId} (quote it if you contact support)`);

	const errorResponse: JsonObject = {
		...(data as JsonObject),
		httpCode: String(response.statusCode),
	};
	if (code) errorResponse.error = code;
	if (apiMessage) errorResponse.message = apiMessage;
	if (requestId) errorResponse.requestId = requestId;

	const error = new NodeApiError(node, errorResponse, {
		message: apiMessage ?? `The API answered ${response.statusCode}`,
		description: details.length ? details.join('\n') : undefined,
		httpCode: String(response.statusCode),
		itemIndex,
	});
	// Kept apart so the node can output them as they came with "Continue On Fail".
	error.context.apiError = code ?? null;
	error.context.apiMessage = apiMessage ?? null;
	error.context.requestId = requestId ?? null;
	return error;
}

/**
 * One request to the Funnelchat API with the credential's key and base URL. Returns the full response; an HTTP error
 * becomes a `NodeApiError` with the API's `error` and `message`. A `429` with a short `Retry-After` is retried.
 */
export async function funnelchatApiRequest(
	this: FunnelchatContext,
	request: FunnelchatRequest,
	wait: (ms: number) => Promise<void> = sleep,
): Promise<FunnelchatResponse> {
	const credentials = await this.getCredentials(CREDENTIAL_NAME);
	const baseURL = baseUrlFor(credentials.environment, credentials.baseUrl);
	if (!baseURL) {
		throw new NodeOperationError(
			this.getNode(),
			"The credential's base URL is not valid: it has to start with http:// or https:// and not end in /.",
			{
				itemIndex: request.itemIndex,
				description: `Current value: ${String(credentials.baseUrl ?? '') || '(empty)'}. For example: http://localhost:4010.`,
			},
		);
	}
	const options: IHttpRequestOptions = {
		method: request.method,
		baseURL,
		url: request.url,
		headers: { Accept: 'application/json' },
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};
	if (request.body !== undefined) options.body = request.body;

	for (let attempt = 0; ; attempt++) {
		const raw = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			CREDENTIAL_NAME,
			options,
		)) as IN8nHttpFullResponse;
		const response: FunnelchatResponse = {
			statusCode: raw.statusCode,
			headers: raw.headers ?? {},
			body: parseBody(raw.body),
		};
		if (response.statusCode < 400 || request.acceptStatuses?.includes(response.statusCode))
			return response;

		const seconds = retryAfterSeconds(response.headers);
		if (
			response.statusCode === 429 &&
			seconds !== undefined &&
			seconds <= MAX_RETRY_AFTER_SECONDS &&
			attempt < MAX_RETRIES
		) {
			await wait(seconds * 1000);
			continue;
		}
		throw apiError(this.getNode(), response, request.itemIndex, request.method);
	}
}
