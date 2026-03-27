import type { APIRoute } from "astro";
import { getNowPlayingPayload } from "../../lib/now-playing/server";

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
export const GET: APIRoute = async ({ locals }) => {
	const { status, payload } = await getNowPlayingPayload(locals.runtime?.env);
	return json(payload as Record<string, unknown>, { status });
};

