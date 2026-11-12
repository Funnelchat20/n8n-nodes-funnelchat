/**
 * Helpers of test/generate.test.ts that need the file system: a throwaway copy of the repository's layout with a
 * specification and a config of its own, to run scripts/generate.mjs on it. They live in a .mjs file because the n8n
 * lint does not allow node:fs in the TypeScript tests (as test/e2e/receiver.mjs does for an http server).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** A new folder with these files (path → text, or an object written as JSON). */
export function makeRoot(files) {
	const root = mkdtempSync(join(tmpdir(), 'funnelchat-generate-'));
	for (const [path, content] of Object.entries(files)) {
		const target = join(root, path);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(
			target,
			typeof content === 'string' ? content : `${JSON.stringify(content, null, '\t')}\n`,
		);
	}
	return root;
}

export function readText(root, path) {
	return readFileSync(join(root, path), 'utf8');
}

/** The SHA-256 of a file of the repository (for example spec/funnelchat.json). */
export function repoSha256(path) {
	return createHash('sha256')
		.update(readFileSync(join(REPO, path), 'utf8'))
		.digest('hex');
}

export function repoText(path) {
	return readFileSync(join(REPO, path), 'utf8');
}
