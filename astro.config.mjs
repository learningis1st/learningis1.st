// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
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
