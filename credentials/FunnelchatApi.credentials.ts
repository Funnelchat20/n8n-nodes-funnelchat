import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * API key of the Funnelchat public API (`Authorization: Bearer <id>|fc_live_...`) and the environment it belongs to.
 * The base URL of each environment lives in `nodes/shared/transport.ts` (`BASE_URLS`); the test below repeats them
 * because a credential test cannot import code.
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
			],
			default: 'production',
			description: 'A qué URL base van los pedidos. Una clave de producción no sirve en staging.',
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
				'={{$credentials.environment === "staging" ? "https://api-staging.funnelchat.com" : "https://api.funnelchat.com"}}',
			url: '/api/v1/me',
			method: 'GET',
			headers: { Accept: 'application/json' },
		},
	};
}
