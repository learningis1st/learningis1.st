import { createExports as createCloudflareExports } from "@astrojs/cloudflare/entrypoints/server.js";
import { syncLastListened } from "./worker/syncLastListened";

export const scheduled: ExportedHandlerScheduledHandler<Env> = async (_event, env, context) => {
	context.waitUntil(
		(async () => {
			try {
				const result = await syncLastListened(env);
				if (result.status === "updated") {
					console.log("[cron] last-listened updated", result.track);
					return;
				}

				console.log("[cron] last-listened skipped", { reason: result.reason });
			} catch (error) {
				console.error("[cron] last-listened sync failed", error);
			}
		})(),
	);
};

export const createExports = (manifest: Parameters<typeof createCloudflareExports>[0]) => {
	const baseExports = createCloudflareExports(manifest);
	return {
		...baseExports,
		default: {
			...baseExports.default,
			scheduled,
		},
		scheduled,
	};
};


