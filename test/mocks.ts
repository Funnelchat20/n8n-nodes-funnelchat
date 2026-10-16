import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INode,
	IWebhookFunctions,
} from 'n8n-workflow';
import { vi } from 'vitest';

/** A simulated API response. No network: every request is answered from this queue, in order. */
export interface FakeResponse {
	status?: number;
	headers?: IDataObject;
	body?: unknown;
}

export interface RecordedCall {
	credential: string;
	options: IHttpRequestOptions;
}

const NODE: INode = {
	id: 'node-1',
	name: 'Funnelchat',
	type: 'n8n-nodes-funnelchat.funnelchat',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

function fakeHttp(responses: FakeResponse[]) {
	const calls: RecordedCall[] = [];
	const queue = [...responses];
	const httpRequestWithAuthentication = vi.fn(
		async (credential: string, options: IHttpRequestOptions) => {
			calls.push({
				credential,
				options: JSON.parse(JSON.stringify(options)) as IHttpRequestOptions,
			});
			const next = queue.shift();
			if (!next) throw new Error(`Pedido sin respuesta simulada: ${options.method} ${options.url}`);
			return { statusCode: next.status ?? 200, headers: next.headers ?? {}, body: next.body };
		},
	);
	return { calls, queue, httpRequestWithAuthentication };
}

export function executeContext(opts: {
	params: IDataObject;
	responses: FakeResponse[];
	continueOnFail?: boolean;
	environment?: string;
	items?: number;
}) {
	const http = fakeHttp(opts.responses);
	const ctx = {
		getInputData: () => Array.from({ length: opts.items ?? 1 }, () => ({ json: {} })),
		getNodeParameter: (name: string, _itemIndex: number, fallback?: unknown) =>
			name in opts.params ? opts.params[name] : fallback,
		getNode: () => NODE,
		continueOnFail: () => opts.continueOnFail ?? false,
		getCredentials: async () => ({
			apiKey: 'clave-de-prueba',
			environment: opts.environment ?? 'production',
		}),
		helpers: { httpRequestWithAuthentication: http.httpRequestWithAuthentication },
	};
	return { ctx: ctx as unknown as IExecuteFunctions, calls: http.calls, queue: http.queue };
}

export const WEBHOOK_URL = 'https://n8n.example.com/webhook/abc123/webhook';
export const TEST_WEBHOOK_URL = 'https://n8n.example.com/webhook-test/abc123/webhook';

export function hookContext(opts: {
	params: IDataObject;
	responses: FakeResponse[];
	staticData?: IDataObject;
	webhookUrl?: string;
	workflowName?: string;
}) {
	const http = fakeHttp(opts.responses);
	const staticData: IDataObject = opts.staticData ?? {};
	const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
	const ctx = {
		getWorkflowStaticData: () => staticData,
		getNodeWebhookUrl: () => opts.webhookUrl ?? WEBHOOK_URL,
		getNodeParameter: (name: string, fallback?: unknown) =>
			name in opts.params ? opts.params[name] : fallback,
		getWorkflow: () => ({ id: 'wf-1', name: opts.workflowName ?? 'Mi flujo', active: true }),
		getNode: () => ({
			...NODE,
			name: 'Funnelchat Trigger',
			type: 'n8n-nodes-funnelchat.funnelchatTrigger',
		}),
		getCredentials: async () => ({ apiKey: 'clave-de-prueba', environment: 'production' }),
		helpers: { httpRequestWithAuthentication: http.httpRequestWithAuthentication },
		logger,
	};
	return { ctx: ctx as unknown as IHookFunctions, calls: http.calls, staticData, logger };
}

export function loadOptionsContext(responses: FakeResponse[]) {
	const http = fakeHttp(responses);
	const ctx = {
		getNode: () => NODE,
		getCredentials: async () => ({ apiKey: 'clave-de-prueba', environment: 'staging' }),
		helpers: { httpRequestWithAuthentication: http.httpRequestWithAuthentication },
	};
	return { ctx: ctx as unknown as ILoadOptionsFunctions, calls: http.calls };
}

export function webhookContext(opts: {
	rawBody?: Buffer;
	headers: IDataObject;
	staticData: IDataObject;
}) {
	const response = {
		status: vi.fn(),
		json: vi.fn(),
	};
	response.status.mockReturnValue(response);
	response.json.mockReturnValue(response);
	const request = { rawBody: opts.rawBody, headers: opts.headers };
	const ctx = {
		getRequestObject: () => request,
		getResponseObject: () => response,
		getWorkflowStaticData: () => opts.staticData,
		getNode: () => NODE,
	};
	return { ctx: ctx as unknown as IWebhookFunctions, response };
}

/** Path and query of a recorded call, decoded, to compare against what the API expects. */
export function requestLine(call: RecordedCall): string {
	return `${call.options.method} ${decodeURIComponent(call.options.url)}`;
}
