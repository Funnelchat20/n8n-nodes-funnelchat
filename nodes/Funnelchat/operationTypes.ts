/**
 * Shapes of the operation table that `scripts/generate.mjs` writes to `generated/operations.ts`.
 * The node builds its parameters and its requests from this table, so the generated file is data only.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ParamLocation = 'path' | 'query' | 'body';

/**
 * How a value is collected in n8n and sent to the API.
 *
 * - `list`: a list of scalars, typed as text separated by commas (or an array from an expression).
 * - `json`: objects, arrays of objects and anything the generator cannot map to a simple field.
 * - `body`: the whole request body when the body itself is an array (JSON).
 */
export type ParamKind =
	| 'string'
	| 'number'
	| 'boolean'
	| 'options'
	| 'multiOptions'
	| 'list'
	| 'json'
	| 'dateTime'
	| 'body';

export interface ParamSpec {
	/** n8n parameter name (unique inside the operation). */
	name: string;
	/** Name in the API: path placeholder, query key (may end in `[]`) or body property. */
	apiName: string;
	location: ParamLocation;
	required: boolean;
	kind: ParamKind;
	displayName: string;
	description?: string;
	/** Scalar type of the value, or of each item for `list` and `multiOptions`. */
	valueType?: 'string' | 'integer' | 'number' | 'boolean';
	/** `date` values are sent as `YYYY-MM-DD`; `date-time` as given. */
	format?: 'date' | 'date-time';
	options?: Array<string | number>;
	/** An optional field shown as a field of its own instead of inside a collection (`topLevelFields`). */
	topLevel?: boolean;
}

export interface ListSpec {
	/** How to ask for the next page: Laravel `page`, a `cursor`, or no pagination at all. */
	pagination: 'page' | 'cursor' | 'none';
	/** Query parameter that sets the page size. */
	sizeParam?: string;
	maxPageSize: number;
}

export interface OperationSpec {
	resource: string;
	/** The operation id in the specification (stable value of the n8n option). */
	value: string;
	/**
	 * The operation id in the specification, only when it is not `value`: the specification renamed the operation and
	 * the node keeps the value saved workflows use (`keepOperationValues` in scripts/generator.config.json).
	 */
	operationId?: string;
	/** Short name in the portal (`summary`). */
	name: string;
	description: string;
	method: HttpMethod;
	path: string;
	/** Permission the key needs (`x-fc-permission`), when the specification says it. */
	permission: string | null;
	/** The category of the portal its group belongs to, in English, when the specification gives it. */
	category?: string;
	/** Warning shown above the fields (what the specification does not say, irreversible operations). */
	notice?: string;
	list?: ListSpec;
	body?: { required: boolean; root: 'object' | 'array' };
	params: ParamSpec[];
}

export interface ResourceSpec {
	value: string;
	name: string;
	description: string;
	/**
	 * The categories of the portal its operations belong to ("First use", "WhatsApp functions", "Funnelchat functions"),
	 * in the portal's order, when the specification gives them. The resources come ordered by the first one.
	 */
	categories?: string[];
	/** The resource selected by default, pinned in the config: saved workflows that never changed it use this one. */
	default?: boolean;
	/** The operation selected by default, pinned in the config: saved workflows that never changed it run this one. */
	defaultOperation?: string;
}

export interface SpecSource {
	title: string;
	sha256: string;
	description: string;
}
