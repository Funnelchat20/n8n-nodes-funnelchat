import { defineConfig } from 'vitest/config';

// End-to-end tests against a running funnelchat-sandbox (see test/e2e/sandbox.e2e.ts). `npm test` does not run them.
export default defineConfig({
	test: {
		include: ['test/e2e/**/*.e2e.ts'],
		testTimeout: 30000,
	},
});
