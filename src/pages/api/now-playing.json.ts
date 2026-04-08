import type { APIRoute } from "astro";
import { getNowPlayingPayload } from "../../lib/now-playing/server";
import { env } from "cloudflare:workers";

export const prerender = false;

const json = (body: Record<string, unknown>, init?: ResponseInit) =>
	new Response(JSON.stringify(body), {
		status: init?.status ?? 200,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
			...init?.headers,
		},
	});
export const GET: APIRoute = async () => {
	const { status, payload } = await getNowPlayingPayload(env as unknown as Env);
	return json(payload as Record<string, unknown>, { status });
};

