import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * API key of the Funnelchat public API (`Authorization: Bearer <id>|fc_live_...`) and where it goes: production, or a
 * custom base URL (for example the local sandbox, Funnelchat20/funnelchat-sandbox, on http://localhost:4010).
 *
 * The base URL of each environment and the check of a custom one live in `nodes/shared/transport.ts`; the test below
 * repeats them because a credential test cannot import code. A custom URL that is not http(s) or ends in `/` makes the
 * test point at an `.invalid` host, so it fails instead of testing something else; so does an fc_live_ key with http:// to another machine
 * (`live-key-needs-https.invalid`): the key never goes out in clear text. Staging is no longer offered (since 0.5.0):
 * it shares the data and the numbers of production, so it was never a place to test. A credential saved with it fails
 * the test on `environment-not-offered.invalid`, and the node stops before sending anything.
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
					name: 'Custom',
					value: 'custom',
					description: 'Another base URL, for example the local sandbox on http://localhost:4010',
				},
			],
			default: 'production',
			description:
				'Where the requests go: Funnelchat (Production), or a base URL of your own, such as the local sandbox to test without real effects.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'http://localhost:4010',
			description:
				'Starts with http:// or https:// and does not end in /. Without /api/v1: the node adds it. With an fc_live_ key, http:// only to localhost, 127.0.0.1 or [::1] (the local sandbox); another host needs https://.',
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
				'={{$credentials.environment === "custom" ? (!(($credentials.baseUrl || "").startsWith("http://") || ($credentials.baseUrl || "").startsWith("https://")) || ($credentials.baseUrl || "").endsWith("/") ? "https://invalid-base-url.invalid" : ($credentials.baseUrl || "").startsWith("http://") && /(^|\\|)fc_live_/.test(String($credentials.apiKey || "").trim()) && !/^http:\\/\\/(localhost|127\\.0\\.0\\.1|\\[::1\\])(:\\d+)?(\\/|$)/i.test($credentials.baseUrl) ? "https://live-key-needs-https.invalid" : $credentials.baseUrl) : (!$credentials.environment || $credentials.environment === "production" ? "https://api.funnelchat.com" : "https://environment-not-offered.invalid")}}',
			url: '/api/v1/me',
			method: 'GET',
			headers: { Accept: 'application/json' },
		},
	};
}
