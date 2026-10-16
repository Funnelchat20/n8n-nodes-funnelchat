#!/usr/bin/env node
/**
 * Generates the operation table of the Funnelchat node from the unified OpenAPI specification.
 *
 *   npm run generate            writes nodes/Funnelchat/generated/operations.ts and the operations block of the README
 *   npm run generate -- --check exits 1 if those files are not what the specification produces (used by the tests)
 *
 * Everything that depends on the API comes from the specification (and its supplements): operations, short names
 * (`summary`), purpose (`x-fc-proposito`), permissions, notes, parameters, bodies and pagination. The config file only
 * says which tags go into each resource and how fields are labelled in Spanish. Regenerating with a new snapshot never
 * requires touching code.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = 'scripts/generator.config.json';
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const SIZE_PARAM_CANDIDATES = ['perPage', 'per_page', 'pageSize', 'limit'];
const RESERVED_NAMES = new Set([
	'resource',
	'operation',
	'returnAll',
	'limit',
	'filters',
	'additionalFields',
	'useJsonBody',
	'jsonBody',
]);
const README_START = '<!-- operaciones:inicio (generado por npm run generate) -->';
const README_END = '<!-- operaciones:fin -->';
const PORTAL_FLAG_NOTES = {
	send_pending: 'El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.',
};

// ---------------------------------------------------------------------------------------------------------------
// OpenAPI helpers
// ---------------------------------------------------------------------------------------------------------------

function deref(doc, node, depth = 0) {
	let current = node;
	let guard = 0;
	while (current && typeof current === 'object' && typeof current.$ref === 'string') {
		if (guard++ > 20 || depth > 40)
			throw new Error(`Referencia circular o demasiado profunda: ${current.$ref}`);
		const parts = current.$ref.replace(/^#\//, '').split('/');
		let target = doc;
		for (const part of parts) target = target?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
		if (target === undefined) throw new Error(`No se encontró ${current.$ref}`);
		current = target;
	}
	return current;
}

/** Resolves references and merges `allOf`, so callers see one plain schema. */
function normalize(doc, schema, depth = 0) {
	const s = deref(doc, schema, depth);
	if (!s || typeof s !== 'object') return {};
	if (Array.isArray(s.allOf)) {
		const merged = {
			...s,
			properties: { ...(s.properties ?? {}) },
			required: [...(s.required ?? [])],
		};
		delete merged.allOf;
		for (const part of s.allOf) {
			const p = normalize(doc, part, depth + 1);
			Object.assign(merged.properties, p.properties ?? {});
			merged.required.push(...(p.required ?? []));
			if (!merged.type && p.type) merged.type = p.type;
		}
		return merged;
	}
	const variants = s.anyOf ?? s.oneOf;
	if (Array.isArray(variants)) {
		const nonNull = variants
			.map((v) => normalize(doc, v, depth + 1))
			.filter((v) => v.type !== 'null');
		if (nonNull.length === 1)
			return { ...nonNull[0], description: s.description ?? nonNull[0].description };
	}
	return s;
}

/** All alternatives of a schema (`anyOf`/`oneOf`), normalized. */
function variantsOf(doc, schema) {
	const s = normalize(doc, schema);
	const list = s.anyOf ?? s.oneOf;
	if (Array.isArray(list))
		return list.map((v) => normalize(doc, v)).filter((v) => v.type !== 'null');
	return [s];
}

function typeOf(schema) {
	const t = schema?.type;
	if (Array.isArray(t)) {
		const nonNull = t.filter((x) => x !== 'null');
		return nonNull.length === 1 ? nonNull[0] : nonNull.length === 0 ? undefined : 'mixed';
	}
	if (t) return t;
	if (schema?.anyOf || schema?.oneOf) return 'mixed';
	if (schema?.properties) return 'object';
	return undefined;
}

function enumOf(schema) {
	if (!Array.isArray(schema?.enum)) return undefined;
	const values = schema.enum.filter((v) => v !== null && v !== undefined);
	return values.length > 0 ? values : undefined;
}

function cleanText(text) {
	if (!text) return '';
	return String(text).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

function firstSentences(text, max = 300) {
	const t = cleanText(text);
	if (t.length <= max) return t;
	const cut = t.slice(0, max);
	const end = cut.lastIndexOf('. ');
	return end > 80 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

/** The «Nota del portal» block an operation description may start with. */
function portalNote(description) {
	if (!description) return undefined;
	const match = description.match(/>\s*\*\*Nota del portal[^*]*\*\*\s*([\s\S]*?)(?:\n\s*\n|$)/);
	if (!match) return undefined;
	return cleanText(match[1].replace(/^>\s?/gm, '')).replace(/\s*\((?:[A-Z]\d+[^)]*)\)\s*$/, '');
}

// ---------------------------------------------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------------------------------------------

function fieldFor(doc, schema) {
	const s = normalize(doc, schema);
	const t = typeOf(s);
	const values = enumOf(s);
	const scalar = (x) => ['string', 'integer', 'number'].includes(x);

	if (t === 'array') {
		const items = normalize(doc, s.items ?? {});
		const it = typeOf(items);
		const itemValues = enumOf(items) ?? values;
		if (itemValues && scalar(it ?? 'string')) {
			return { kind: 'multiOptions', valueType: it ?? 'string', options: itemValues };
		}
		if (scalar(it)) return { kind: 'list', valueType: it };
		return { kind: 'json' };
	}
	if (values && scalar(t ?? 'string'))
		return { kind: 'options', valueType: t ?? 'string', options: values };
	if (t === 'boolean') return { kind: 'boolean', valueType: 'boolean' };
	if (t === 'integer' || t === 'number') return { kind: 'number', valueType: t };
	if (t === 'string') {
		if (s.format === 'date' || s.format === 'date-time')
			return { kind: 'dateTime', format: s.format };
		return { kind: 'string', valueType: 'string' };
	}
	return { kind: 'json' };
}

function labelFor(config, operationId, apiName) {
	const prefix = String(operationId).split('.')[0];
	return (
		config.labelsByOperationPrefix?.[prefix]?.[apiName] ??
		config.labels?.[apiName] ??
		config.labels?.[apiName.replace(/\[\]$/, '')] ??
		apiName
	);
}

function describeField(schema, apiName, kind) {
	const parts = [];
	const own = cleanText(schema?.description);
	if (own) parts.push(own.endsWith('.') || own.endsWith(')') ? own : `${own}.`);
	if (kind === 'list') parts.push('Separá los valores con comas.');
	parts.push(`En la API: ${apiName}.`);
	return parts.join(' ');
}

function sanitizeName(apiName) {
	const base = apiName.replace(/\[\]$/, '').replace(/[^A-Za-z0-9_]/g, '_');
	return base === '' ? 'value' : base;
}

// ---------------------------------------------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------------------------------------------

function successSchema(doc, op) {
	for (const [code, response] of Object.entries(op.responses ?? {})) {
		if (!code.startsWith('2')) continue;
		const r = deref(doc, response);
		const content = r?.content?.['application/json'];
		if (content?.schema) return content.schema;
	}
	return undefined;
}

function listInfo(doc, op, method, queryNames) {
	if (method !== 'GET') return undefined;
	const schema = successSchema(doc, op);
	if (!schema) return undefined;
	const variants = variantsOf(doc, schema);
	const hasItems = variants.some((v) => {
		if (typeOf(v) === 'array') return true;
		const data = v.properties?.data ? normalize(doc, v.properties.data) : undefined;
		return typeOf(data) === 'array';
	});
	if (!hasItems) return undefined;

	const metaOf = (v) => (v.properties?.meta ? normalize(doc, v.properties.meta) : undefined);
	const listing = op['x-fc-listing'];
	const cursor =
		variants.some((v) => metaOf(v)?.properties?.next_cursor || v.properties?.next_cursor) ||
		queryNames.has('cursor');
	const page =
		variants.some((v) => metaOf(v)?.properties?.last_page || metaOf(v)?.properties?.current_page) ||
		queryNames.has('page') ||
		Boolean(listing);
	const pagination = cursor ? 'cursor' : page ? 'page' : 'none';
	if (pagination === 'none') return { pagination };

	const sizeParam =
		listing?.size_params?.[0] ?? SIZE_PARAM_CANDIDATES.find((n) => queryNames.has(n)) ?? 'perPage';
	const maxPageSize = Number(listing?.per_page_max) || 100;
	return {
		pagination,
		sizeParam,
		maxPageSize,
		ignore: new Set([...(listing?.size_params ?? []), sizeParam]),
	};
}

function buildOperation(ctx, doc, path, method, op, resource, source) {
	const { config, warnings } = ctx;
	const operationId = op.operationId ?? `${method}${path.replace(/[^A-Za-z0-9]+/g, '_')}`;
	const httpMethod = method.toUpperCase();

	const rawParams = [...(doc.paths[path].parameters ?? []), ...(op.parameters ?? [])].map((p) =>
		deref(doc, p),
	);
	const queryNames = new Set(rawParams.filter((p) => p.in === 'query').map((p) => p.name));
	const list = listInfo(doc, op, httpMethod, queryNames);
	const pagerParams = new Set();
	if (list && list.pagination !== 'none') {
		for (const n of list.ignore) pagerParams.add(n);
		pagerParams.add(list.pagination === 'cursor' ? 'cursor' : 'page');
	}

	const used = new Set();
	const uniqueName = (apiName, location, topLevel) => {
		let name = sanitizeName(apiName);
		if (used.has(name)) name = `${location}_${name}`;
		if (topLevel && RESERVED_NAMES.has(name)) name = `${name}Value`;
		while (used.has(name)) name = `${name}_`;
		used.add(name);
		return name;
	};

	const params = [];
	for (const p of rawParams) {
		if (p.in !== 'path' && p.in !== 'query') continue;
		if (p.in === 'query' && pagerParams.has(p.name)) continue;
		const schema = p.schema ?? {};
		const required = p.in === 'path' ? true : Boolean(p.required);
		const field =
			p.in === 'path'
				? {
						kind: 'string',
						valueType: typeOf(normalize(doc, schema)) === 'integer' ? 'integer' : 'string',
					}
				: fieldFor(doc, schema);
		const description = describeField(
			{ description: p.description ?? normalize(doc, schema).description },
			p.name,
			field.kind,
		);
		params.push({
			name: uniqueName(p.name, p.in, required),
			apiName: p.name,
			location: p.in,
			required,
			kind: field.kind,
			displayName: labelFor(config, operationId, p.name),
			description,
			...(field.valueType ? { valueType: field.valueType } : {}),
			...(field.format ? { format: field.format } : {}),
			...(field.options ? { options: field.options } : {}),
		});
	}

	let body;
	if (op.requestBody) {
		const rb = deref(doc, op.requestBody);
		const content = rb.content?.['application/json'] ?? Object.values(rb.content ?? {})[0];
		const schema = normalize(doc, content?.schema ?? {});
		if (typeOf(schema) === 'array') {
			body = { required: Boolean(rb.required), root: 'array' };
			const items = normalize(doc, schema.items ?? {});
			const keys = Object.keys(items.properties ?? {});
			params.push({
				name: uniqueName('body', 'body', true),
				apiName: '',
				location: 'body',
				required: true,
				kind: 'body',
				displayName: 'Elementos (JSON)',
				description: `Lista JSON de objetos${keys.length ? ` con ${keys.join(', ')}` : ''}.`,
			});
		} else {
			body = { required: Boolean(rb.required), root: 'object' };
			const required = new Set(schema.required ?? []);
			for (const [prop, propSchema] of Object.entries(schema.properties ?? {})) {
				const field = fieldFor(doc, propSchema);
				const isRequired = required.has(prop);
				params.push({
					name: uniqueName(prop, 'body', isRequired),
					apiName: prop,
					location: 'body',
					required: isRequired,
					kind: field.kind,
					displayName: labelFor(config, operationId, prop),
					description: describeField(normalize(doc, propSchema), prop, field.kind),
					...(field.valueType ? { valueType: field.valueType } : {}),
					...(field.format ? { format: field.format } : {}),
					...(field.options ? { options: field.options } : {}),
				});
			}
		}
	}

	const notices = [];
	const destructive =
		op['x-fc-destructive'] === true || String(op['x-fc-permission'] ?? '').endsWith(':operate');
	if (destructive) {
		notices.push(
			String(op['x-fc-permission'] ?? '').endsWith(':operate')
				? `Operación irreversible: pide el permiso ${op['x-fc-permission']}.`
				: 'Operación irreversible.',
		);
	}
	const note = op['x-fc-nota'] ?? portalNote(op.description);
	if (note) notices.push(cleanText(note));
	const flag = op['x-portal-v0'];
	if (flag && PORTAL_FLAG_NOTES[flag]) notices.push(PORTAL_FLAG_NOTES[flag]);
	if (flag && !PORTAL_FLAG_NOTES[flag])
		warnings.push(`${operationId}: x-portal-v0 «${flag}» sin nota conocida`);

	const permission = op['x-fc-permission'] ?? null;
	const purpose = firstSentences(op['x-fc-proposito'] ?? op.summary ?? '');
	const description = permission ? `${purpose} Permiso: ${permission}.` : purpose;

	// Sorting keeps the generated parameters stable and in the order the node shows them.
	const order = (p) =>
		p.location === 'path'
			? 0
			: p.required
				? p.location === 'query'
					? 1
					: 2
				: p.location === 'query'
					? 3
					: 4;
	params.sort((a, b) => order(a) - order(b));

	return {
		resource,
		value: operationId,
		name: cleanText(op.summary ?? operationId),
		description,
		method: httpMethod,
		path,
		permission,
		...(notices.length ? { notice: notices.join(' ') } : {}),
		source,
		...(list
			? {
					list: {
						pagination: list.pagination,
						...(list.sizeParam ? { sizeParam: list.sizeParam } : {}),
						maxPageSize: list.maxPageSize ?? 100,
					},
				}
			: {}),
		...(body ? { body } : {}),
		params,
	};
}

// ---------------------------------------------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------------------------------------------

function readJson(root, file) {
	return JSON.parse(readFileSync(resolve(root, file), 'utf8'));
}

export function generate(root = ROOT) {
	const config = readJson(root, CONFIG_PATH);
	const specText = readFileSync(resolve(root, config.spec), 'utf8');
	const spec = JSON.parse(specText);
	const specSha = createHash('sha256').update(specText).digest('hex');
	if (config.provenance) {
		const provenance = readFileSync(resolve(root, config.provenance), 'utf8');
		if (!provenance.includes(specSha)) {
			throw new Error(
				`${config.provenance} no registra la especificación copiada (sha256 ${specSha}): anotá de dónde salió antes de generar.`,
			);
		}
	}
	const warnings = [];
	const ctx = { config, warnings };

	const tagToResource = new Map();
	for (const r of config.resources) for (const tag of r.tags) tagToResource.set(tag, r.value);
	const excluded = new Set(config.excludeOperations ?? []);

	// Each operation keeps the document it came from, to resolve its references.
	const entries = [];
	const seen = new Set();
	for (const [path, item] of Object.entries(spec.paths)) {
		for (const method of METHODS) {
			if (!item[method]) continue;
			seen.add(`${method.toUpperCase()} ${path}`);
			entries.push({ doc: spec, path, method, op: item[method], source: 'spec' });
		}
	}

	const supplements = [];
	for (const file of config.supplements ?? []) {
		const sup = readJson(root, file);
		const info = sup['x-fc-suplemento'] ?? {};
		const record = { id: info.id ?? file, source: info.fuente ?? file, used: 0, ignored: 0 };
		for (const [path, item] of Object.entries(sup.paths ?? {})) {
			for (const method of METHODS) {
				if (!item[method]) continue;
				const key = `${method.toUpperCase()} ${path}`;
				if (seen.has(key)) {
					record.ignored++;
					warnings.push(
						`${record.id}: ${key} ya está en la especificación; se usa la de la especificación`,
					);
					continue;
				}
				record.used++;
				entries.push({ doc: sup, path, method, op: item[method], source: record.id });
			}
		}
		supplements.push({ record, tags: sup.tags ?? [] });
	}

	const tagInfo = new Map();
	for (const t of spec.tags ?? []) tagInfo.set(t.name, t);
	for (const s of supplements)
		for (const t of s.tags) if (!tagInfo.has(t.name)) tagInfo.set(t.name, t);
	for (const r of config.resources) {
		for (const tag of r.tags)
			if (!tagInfo.has(tag))
				warnings.push(
					`El recurso ${r.value} usa la etiqueta ${tag}, que no está en la especificación`,
				);
	}

	const operations = [];
	for (const { doc, path, method, op, source } of entries) {
		const tag = op.tags?.[0];
		const resource = tagToResource.get(tag);
		if (!resource) continue;
		if (excluded.has(op.operationId)) continue;
		operations.push({
			tagIndex: config.resources.find((r) => r.value === resource).tags.indexOf(tag),
			op: buildOperation(ctx, doc, path, method, op, resource, source),
		});
	}

	// Resource by resource, in the tag order of the config and then in the order of the specification.
	const ordered = [];
	for (const r of config.resources) {
		const ops = operations
			.filter((o) => o.op.resource === r.value)
			.sort((a, b) => a.tagIndex - b.tagIndex);
		const names = new Map();
		const values = new Set();
		for (const { op } of ops) {
			if (values.has(op.value)) throw new Error(`Operación repetida en ${r.value}: ${op.value}`);
			values.add(op.value);
			if (names.has(op.name))
				warnings.push(
					`Nombre repetido en ${r.value}: «${op.name}» (${names.get(op.name)} y ${op.value})`,
				);
			names.set(op.name, op.value);
			ordered.push(op);
		}
		if (ops.length === 0) warnings.push(`El recurso ${r.value} quedó sin operaciones`);
	}

	const resources = config.resources.map((r) => ({
		value: r.value,
		name: r.name,
		description: firstSentences(tagInfo.get(r.tags[0])?.description ?? '', 200),
	}));

	const source = {
		title: `${spec.info?.title ?? 'Funnelchat API'} ${spec.info?.version ?? ''}`.trim(),
		sha256: specSha,
		description: firstSentences(
			(spec.info?.description ?? '').replace(/^>\s*\*\*[^*]+\*\*\s*·\s*/, ''),
			400,
		),
		supplements: supplements.map((s) => s.record),
	};

	const header = [
		'// Generado por scripts/generate.mjs a partir de spec/funnelchat.json y sus suplementos.',
		'// No editar a mano: cambiá la especificación o scripts/generator.config.json y corré `npm run generate`.',
		`// Especificación: ${source.title}, sha256 ${source.sha256}.`,
		'',
		"import type { OperationSpec, ResourceSpec, SpecSource } from '../operationTypes';",
		'',
	].join('\n');
	const operationsTs =
		`${header}\nexport const SPEC_SOURCE: SpecSource = ${JSON.stringify(source, null, '\t')};\n\n` +
		`export const RESOURCES: ResourceSpec[] = ${JSON.stringify(resources, null, '\t')};\n\n` +
		`export const OPERATIONS: OperationSpec[] = ${JSON.stringify(ordered, null, '\t')};\n`;

	const readmeBlock = renderReadmeBlock(resources, ordered, source);
	const summary = resources.map(
		(r) => `${r.name}: ${ordered.filter((o) => o.resource === r.value).length}`,
	);
	return { operationsTs, readmeBlock, summary, warnings, total: ordered.length };
}

function renderReadmeBlock(resources, operations, source) {
	const lines = [README_START, ''];
	lines.push(
		`${operations.length} operaciones generadas de la especificación (sha256 \`${source.sha256.slice(0, 12)}\`). ` +
			'Las marcadas con ⚠ tienen un aviso en el nodo (nota del portal, fuente sin mergear u operación irreversible).',
		'',
	);
	for (const r of resources) {
		const ops = operations.filter((o) => o.resource === r.value);
		lines.push(`<details><summary><strong>${r.name}</strong> (${ops.length})</summary>`, '');
		lines.push('| Operación | Ruta | Permiso |', '|---|---|---|');
		for (const o of ops) {
			const flags = [
				o.notice ? '⚠' : '',
				o.list && o.list.pagination !== 'none' ? '«devolver todo»' : '',
			]
				.filter(Boolean)
				.join(' ');
			lines.push(
				`| ${o.name}${flags ? ` ${flags}` : ''} | \`${o.method} ${o.path}\` | ${o.permission ? `\`${o.permission}\`` : '—'} |`,
			);
		}
		lines.push('', '</details>', '');
	}
	lines.push(README_END);
	return lines.join('\n');
}

function replaceReadmeBlock(readme, block) {
	const start = readme.indexOf(README_START);
	const end = readme.indexOf(README_END);
	if (start === -1 || end === -1 || end < start) {
		throw new Error(
			`El README no tiene el bloque de operaciones (${README_START} … ${README_END})`,
		);
	}
	return readme.slice(0, start) + block + readme.slice(end + README_END.length);
}

export function expectedFiles(root = ROOT) {
	const config = readJson(root, CONFIG_PATH);
	const result = generate(root);
	const readmePath = resolve(root, config.readme);
	const readme = replaceReadmeBlock(readFileSync(readmePath, 'utf8'), result.readmeBlock);
	return {
		result,
		files: [
			{ path: resolve(root, config.output), content: result.operationsTs },
			{ path: readmePath, content: readme },
		],
	};
}

/** Generated files whose content on disk is not what the specification produces (relative paths). */
export function staleFiles(root = ROOT) {
	const { files } = expectedFiles(root);
	return files
		.filter((f) => {
			try {
				return readFileSync(f.path, 'utf8') !== f.content;
			} catch {
				return true;
			}
		})
		.map((f) => f.path.replace(`${root}/`, ''));
}

function main() {
	const check = process.argv.includes('--check');
	const { result, files } = expectedFiles(ROOT);
	for (const w of result.warnings) console.warn(`aviso: ${w}`);
	if (check) {
		const stale = staleFiles(ROOT);
		if (stale.length) {
			console.error(`Desactualizado: ${stale.join(', ')}. Corré npm run generate.`);
			process.exit(1);
		}
		console.log(`Al día: ${result.total} operaciones.`);
		return;
	}
	for (const f of files) writeFileSync(f.path, f.content);
	console.log(`Generadas ${result.total} operaciones (${result.summary.join(', ')}).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
