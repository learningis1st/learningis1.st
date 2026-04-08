import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { buildSubsonicViewUrl, getNavidromeConfig } from "../../../lib/navidrome";

export const prerender = false;

const json = (body: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
		},
	});

const isSubsonicOk = (payload: unknown) => {
	if (!payload || typeof payload !== "object") {
		return false;
	}

	const response = (payload as Record<string, unknown>)["subsonic-response"];
	if (!response || typeof response !== "object") {
		return false;
	}

	return ((response as Record<string, unknown>).status as string | undefined) === "ok";
};

export const GET: APIRoute = async () => {
	const config = getNavidromeConfig(env as unknown as Env);

	if (!config) {
		return json(
			{
				ok: false,
				error: "Navidrome environment variables are missing.",
			},
			500,
		);
	}

	const endpoint = buildSubsonicViewUrl(config, "ping.view");
	const startedAt = Date.now();

	try {
		const response = await fetch(endpoint, {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			return json(
				{
					ok: false,
					status: response.status,
					error: "Navidrome ping request failed.",
				},
				502,
			);
		}

		const payload: unknown = await response.json();
		if (!isSubsonicOk(payload)) {
			return json(
				{
					ok: false,
					error: "Navidrome ping response was not ok.",
				},
				502,
			);
		}

		return json({
			ok: true,
			latencyMs: Date.now() - startedAt,
		});
	} catch (_error) {
		return json(
			{
				ok: false,
				error: "Navidrome ping request failed.",
			},
			502,
		);
	}
};

