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

	documentationUrl = 'https://github.com/Funnelchat20/n8n-nodes-funnelchat#credencial';

	properties: INodeProperties[] = [
		{
			displayName: 'Clave de API',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: '<id>|fc_live_...',
			description:
				'La clave completa que creaste en la pantalla Desarrolladores de Funnelchat, tal como se mostró (id|fc_live_…). Se manda como Authorization: Bearer.',
		},
		{
			displayName: 'Entorno',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Producción',
					value: 'production',
					description: 'https://api.funnelchat.com',
				},
				{
					name: 'Staging',
					value: 'staging',
					description: 'https://api-staging.funnelchat.com',
				},
				{
					name: 'Personalizado',
					value: 'custom',
					description: 'Otra URL base, por ejemplo el sandbox local en http://localhost:4010',
				},
			],
			default: 'production',
			description: 'A qué URL base van los pedidos. Una clave de producción no sirve en staging.',
		},
		{
			displayName: 'URL base',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'http://localhost:4010',
			description:
				'Empieza con http:// o https:// y no termina en /. Sin /api/v1: el nodo lo agrega. Si n8n corre en Docker y el sandbox en tu máquina, usá http://host.docker.internal:4010.',
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

	// `GET /api/v1/me` («Ver mi cuenta»): the cheapest read of the specification. It needs `accounts:read`.
	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.environment === "custom" ? ((($credentials.baseUrl || "").startsWith("http://") || ($credentials.baseUrl || "").startsWith("https://")) && !($credentials.baseUrl || "").endsWith("/") ? $credentials.baseUrl : "https://url-base-invalida.invalid") : ($credentials.environment === "staging" ? "https://api-staging.funnelchat.com" : "https://api.funnelchat.com")}}',
			url: '/api/v1/me',
			method: 'GET',
			headers: { Accept: 'application/json' },
		},
	};
}
