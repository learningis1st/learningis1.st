// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
	site: "https://learningis1.st",
	integrations: [sitemap()],
	adapter: cloudflare({
		workerEntryPoint: {
			path: "src/worker.ts",
			namedExports: ["scheduled"],
		},
		platformProxy: {
			enabled: true,
		},
	}),
});
