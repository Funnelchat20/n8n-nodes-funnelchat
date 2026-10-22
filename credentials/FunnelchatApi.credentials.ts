import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * API key of the Funnelchat public API (`Authorization: Bearer <id>|fc_live_...`) and the environment it belongs to:
 * production, staging, or a custom base URL (for example the local sandbox, Funnelchat20/funnelchat-sandbox, on
 * http://localhost:4010).
 *
 * The base URL of each environment and the check of a custom one live in `nodes/shared/transport.ts`; the test below
 * repeats them because a credential test cannot import code. A custom URL that is not http(s) or ends in `/` makes the
 * test point at an `.invalid` host, so it fails instead of testing something else.
 */
export class FunnelchatApi implements ICredentialType {
	name = 'funnelchatApi';

	displayName = 'Funnelchat API';

	icon: Icon = { light: 'file:../icons/funnelchat.svg', dark: 'file:../icons/funnelchat.dark.svg' };

	documentationUrl = 'https://github.com/Funnelchat20/n8n-nodes-funnelchat#credential';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: '<id>|fc_live_...',
			description:
				'The full key you created on the Developers screen of Funnelchat, as it was shown (id|fc_live_…). It is sent as Authorization: Bearer.',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Production',
					value: 'production',
					description: 'https://api.funnelchat.com',
				},
				{
					name: 'Staging',
					value: 'staging',
					description: 'https://api-staging.funnelchat.com',
				},
				{
					name: 'Custom',
					value: 'custom',
					description: 'Another base URL, for example the local sandbox on http://localhost:4010',
				},
			],
			default: 'production',
			description: 'Which base URL the requests go to. A production key does not work on staging.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'http://localhost:4010',
			description:
				'Starts with http:// or https:// and does not end in /. Without /api/v1: the node adds it. If n8n runs in Docker and the sandbox on your machine, use http://host.docker.internal:4010.',
			displayOptions: {
				show: {
					environment: ['custom'],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// `GET /api/v1/me` (Get my account): the cheapest read of the specification. It needs `accounts:read`.
	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.environment === "custom" ? ((($credentials.baseUrl || "").startsWith("http://") || ($credentials.baseUrl || "").startsWith("https://")) && !($credentials.baseUrl || "").endsWith("/") ? $credentials.baseUrl : "https://invalid-base-url.invalid") : ($credentials.environment === "staging" ? "https://api-staging.funnelchat.com" : "https://api.funnelchat.com")}}',
			url: '/api/v1/me',
			method: 'GET',
			headers: { Accept: 'application/json' },
		},
	};
}
