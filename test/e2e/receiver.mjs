import { createServer } from 'node:http';

/**
 * A local receiver for the sandbox's signed deliveries (the sandbox accepts http and local URLs). In JavaScript and
 * apart from sandbox.e2e.ts because it needs Node's http server, which the n8n lint forbids in TypeScript: that rule
 * is for code that runs inside n8n, and tests never ship (the package is dist/ only).
 *
 * @returns {Promise<{ url: string, deliveries: Array<{ headers: import('node:http').IncomingHttpHeaders, raw: Buffer }>, close: () => Promise<void> }>}
 */
export function startReceiver() {
	const deliveries = [];
	const server = createServer((req, res) => {
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => {
			deliveries.push({ headers: req.headers, raw: Buffer.concat(chunks) });
			res.writeHead(200).end();
		});
	});
	return new Promise((resolve) =>
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address();
			resolve({
				url: `http://127.0.0.1:${port}/webhook/e2e/webhook`,
				deliveries,
				close: () => new Promise((done) => server.close(() => done())),
			});
		}),
	);
}
