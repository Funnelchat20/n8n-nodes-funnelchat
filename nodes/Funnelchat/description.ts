import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import type { OperationSpec, ParamSpec, ResourceSpec } from './operationTypes';

/** Required parameters and path parameters are shown as fields; the rest go into the «Filtros» and «Campos adicionales» collections. */
export function isTopLevel(param: ParamSpec): boolean {
	return param.location === 'path' || param.required;
}

export function hasJsonBodyOption(op: OperationSpec): boolean {
	return op.body?.root === 'object';
}

export function hasPagination(op: OperationSpec): boolean {
	return Boolean(op.list && op.list.pagination !== 'none');
}

function fieldProperty(param: ParamSpec, topLevel: boolean): INodeProperties {
	const base = {
		displayName: param.displayName,
		name: param.name,
		...(param.description ? { description: param.description } : {}),
		...(topLevel && param.required ? { required: true } : {}),
	};

	switch (param.kind) {
		case 'number':
			// A required integer (almost always an id) is a text field, so an empty value is caught instead of sending 0.
			if (topLevel && param.valueType === 'integer')
				return { ...base, type: 'string', default: '' };
			return { ...base, type: 'number', default: 0 };
		case 'boolean':
			return { ...base, type: 'boolean', default: false };
		case 'options': {
			const options: INodePropertyOptions[] = (param.options ?? []).map((v) => ({
				name: String(v),
				value: v,
			}));
			return { ...base, type: 'options', options, default: options[0]?.value ?? '' };
		}
		case 'multiOptions': {
			const options: INodePropertyOptions[] = (param.options ?? []).map((v) => ({
				name: String(v),
				value: v,
			}));
			return { ...base, type: 'multiOptions', options, default: [] };
		}
		case 'dateTime':
			return { ...base, type: 'dateTime', default: '' };
		case 'json':
			return { ...base, type: 'json', default: '' };
		case 'body':
			return { ...base, type: 'json', default: '[]' };
		case 'list':
			return { ...base, type: 'string', default: '', placeholder: 'valor1, valor2' };
		case 'string':
		default:
			return { ...base, type: 'string', default: '' };
	}
}

function operationProperties(op: OperationSpec): INodeProperties[] {
	const show = { resource: [op.resource], operation: [op.value] };
	const props: INodeProperties[] = [];
	const jsonOption = hasJsonBodyOption(op);
	const bodyShow = jsonOption ? { ...show, useJsonBody: [false] } : show;

	if (op.notice) {
		props.push({
			displayName: op.notice,
			name: 'notice',
			type: 'notice',
			default: '',
			displayOptions: { show },
		});
	}

	for (const param of op.params.filter(isTopLevel)) {
		props.push({
			...fieldProperty(param, true),
			displayOptions: { show: param.location === 'body' ? bodyShow : show },
		});
	}

	if (jsonOption) {
		props.push(
			{
				displayName: 'Enviar el cuerpo como JSON',
				name: 'useJsonBody',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether -- the UI of this package is in Spanish (see README); this rule enforces English wording
				description:
					'Si está activo, escribís el cuerpo completo del pedido en JSON en vez de completar los campos uno por uno',
				displayOptions: { show },
			},
			{
				displayName: 'Cuerpo (JSON)',
				name: 'jsonBody',
				type: 'json',
				default: '{}',
				description: 'El cuerpo del pedido tal como lo describe la referencia del portal',
				displayOptions: { show: { ...show, useJsonBody: [true] } },
			},
		);
	}

	if (hasPagination(op)) {
		props.push(
			{
				displayName: 'Devolver todo',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether, n8n-nodes-base/node-param-description-wrong-for-return-all -- the UI of this package is in Spanish (see README); this rule enforces English wording
				description: 'Si está activo, trae todas las páginas; si no, hasta el límite',
				displayOptions: { show },
			},
			{
				displayName: 'Límite',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-limit -- the UI of this package is in Spanish (see README); this rule enforces English wording
				description: 'Cantidad máxima de resultados',
				displayOptions: { show: { ...show, returnAll: [false] } },
			},
		);
	}

	const optionalQuery = op.params.filter((p) => !isTopLevel(p) && p.location === 'query');
	if (optionalQuery.length) {
		props.push({
			displayName: op.method === 'GET' ? 'Filtros' : 'Opciones de consulta',
			name: 'filters',
			type: 'collection',
			placeholder: op.method === 'GET' ? 'Agregar filtro' : 'Agregar opción',
			default: {},
			displayOptions: { show },
			options: optionalQuery.map((p) => fieldProperty(p, false)),
		});
	}

	const optionalBody = op.params.filter((p) => !isTopLevel(p) && p.location === 'body');
	if (optionalBody.length) {
		props.push({
			displayName: 'Campos adicionales',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Agregar campo',
			default: {},
			displayOptions: { show: bodyShow },
			options: optionalBody.map((p) => fieldProperty(p, false)),
		});
	}

	return props;
}

/** The parameters of the node: resource, the operations of each resource and the fields of each operation. */
export function buildProperties(
	resources: ResourceSpec[],
	operations: OperationSpec[],
): INodeProperties[] {
	const defaultResource = resources[0]?.value ?? '';
	const props: INodeProperties[] = [
		{
			displayName: 'Recurso',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			options: resources.map((r) => ({
				name: r.name,
				value: r.value,
				...(r.description ? { description: r.description } : {}),
			})),
			default: defaultResource,
		},
	];

	for (const resource of resources) {
		const ops = operations
			.filter((o) => o.resource === resource.value)
			.sort((a, b) => a.name.localeCompare(b.name, 'es'));
		if (ops.length === 0) continue;
		const defaultOperation = (ops.find((o) => o.list) ?? ops[0]).value;
		props.push({
			displayName: 'Operación',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resource.value] } },
			options: ops.map((o) => ({
				name: o.name,
				value: o.value,
				action: o.name,
				description: o.description,
			})),
			default: defaultOperation,
		});
	}

	for (const op of operations) props.push(...operationProperties(op));
	return props;
}
