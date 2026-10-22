import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INode,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { funnelchatApiRequest } from '../shared/transport';
import { buildProperties, hasJsonBodyOption, hasPagination, isTopLevel } from './description';
import { OPERATIONS, RESOURCES } from './generated/operations';
import type { OperationSpec } from './operationTypes';
import {
	buildRequest,
	extractItems,
	nextPage,
	RequestBuildError,
	responseToItems,
	toUrl,
	type BuiltRequest,
	type ParamValues,
} from './request';

/** Hard stop for "Return All", in case an endpoint keeps announcing a next page. */
const MAX_PAGES = 1000;

export function findOperation(resource: string, operation: string): OperationSpec | undefined {
	return OPERATIONS.find((o) => o.resource === resource && o.value === operation);
}

function toNodeError(
	node: INode,
	error: unknown,
	itemIndex: number,
): NodeApiError | NodeOperationError {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) return error;
	if (error instanceof RequestBuildError)
		return new NodeOperationError(node, error.message, { itemIndex });
	return new NodeOperationError(node, error as Error, { itemIndex });
}

async function paginate(
	this: IExecuteFunctions,
	op: OperationSpec,
	built: BuiltRequest,
	returnAll: boolean,
	limit: number,
	itemIndex: number,
): Promise<IDataObject[]> {
	const list = op.list!;
	const pageSize = returnAll ? list.maxPageSize : Math.min(list.maxPageSize, Math.max(1, limit));
	const results: IDataObject[] = [];
	let page = 1;
	let cursor: string | undefined;

	for (let n = 0; n < MAX_PAGES; n++) {
		const query = [...built.query];
		if (list.sizeParam) query.push([list.sizeParam, String(pageSize)]);
		if (list.pagination === 'page') query.push(['page', String(page)]);
		if (list.pagination === 'cursor' && cursor) query.push(['cursor', cursor]);

		const response = await funnelchatApiRequest.call(this, {
			method: built.method,
			url: toUrl(built.path, query),
			itemIndex,
		});
		const items = extractItems(response.body);
		if (!items) return n === 0 ? responseToItems(response.body) : results;

		results.push(...responseToItems(response.body));
		if (!returnAll && results.length >= limit) return results.slice(0, limit);

		const next = nextPage(response.body, list.pagination as 'page' | 'cursor', page);
		if (!next || items.length === 0) break;
		if ('page' in next) page = next.page;
		else cursor = next.cursor;
	}
	return results;
}

async function runOperation(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject[]> {
	const resource = this.getNodeParameter('resource', itemIndex) as string;
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const op = findOperation(resource, operation);
	if (!op) {
		throw new NodeOperationError(this.getNode(), `Unknown operation: ${resource} / ${operation}`, {
			itemIndex,
		});
	}

	const values: ParamValues = {};
	const optional = op.params.filter((p) => !isTopLevel(p));
	const filters = optional.some((p) => p.location === 'query')
		? (this.getNodeParameter('filters', itemIndex, {}) as IDataObject)
		: {};
	const additional = optional.some((p) => p.location === 'body')
		? (this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject)
		: {};

	const useJsonBody = hasJsonBodyOption(op)
		? (this.getNodeParameter('useJsonBody', itemIndex, false) as boolean)
		: false;

	for (const param of op.params) {
		if (isTopLevel(param)) {
			if (param.location === 'body' && useJsonBody) continue;
			values[param.name] = this.getNodeParameter(param.name, itemIndex, null);
		} else {
			values[param.name] =
				param.location === 'query' ? filters[param.name] : additional[param.name];
		}
	}

	const jsonBody = useJsonBody ? this.getNodeParameter('jsonBody', itemIndex, '{}') : undefined;
	const built = buildRequest(op, values, jsonBody);

	if (hasPagination(op)) {
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = returnAll
			? Number.POSITIVE_INFINITY
			: (this.getNodeParameter('limit', itemIndex, 50) as number);
		return await paginate.call(this, op, built, returnAll, limit, itemIndex);
	}

	const response = await funnelchatApiRequest.call(this, {
		method: built.method,
		url: toUrl(built.path, built.query),
		...(built.body !== undefined ? { body: built.body } : {}),
		itemIndex,
	});
	return responseToItems(response.body);
}

export class Funnelchat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Funnelchat',
		name: 'funnelchat',
		icon: {
			light: 'file:../../icons/funnelchat.svg',
			dark: 'file:../../icons/funnelchat.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Contacts, conversations and messages, templates, WhatsApp forms, tags, custom fields, groups, numbers and webhooks of the Funnelchat public API',
		defaults: {
			name: 'Funnelchat',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'funnelchatApi',
				required: true,
			},
		],
		properties: buildProperties(RESOURCES, OPERATIONS),
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			let results: IDataObject[] = [];
			let failure: NodeApiError | NodeOperationError | undefined;
			try {
				results = await runOperation.call(this, itemIndex);
			} catch (error) {
				failure = toNodeError(this.getNode(), error, itemIndex);
			}

			if (failure) {
				if (!this.continueOnFail()) throw failure;
				returnData.push({
					json: {
						error: (failure.context.apiError as string | null | undefined) ?? null,
						message: (failure.context.apiMessage as string | null | undefined) ?? failure.message,
						...(failure instanceof NodeApiError && failure.httpCode
							? { httpCode: failure.httpCode }
							: {}),
						...(failure.context.requestId
							? { requestId: failure.context.requestId as string }
							: {}),
					},
					pairedItem: { item: itemIndex },
				});
				continue;
			}

			for (const json of results) returnData.push({ json, pairedItem: { item: itemIndex } });
		}

		return [returnData];
	}
}
