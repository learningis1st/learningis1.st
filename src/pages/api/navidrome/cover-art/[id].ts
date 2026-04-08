import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { buildSubsonicViewUrl, getNavidromeConfig } from "../../../../lib/navidrome";

export const prerender = false;
const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const GET: APIRoute = async ({ params }) => {
	const id = readString(params.id);
	if (!id || !/^[A-Za-z0-9:_-]+$/.test(id)) {
		return new Response("Invalid cover art id", { status: 400 });
	}

	const config = getNavidromeConfig(env as unknown as Env);

	if (!config) {
		return new Response("Navidrome environment variables are missing.", { status: 500 });
	}

	const endpoint = buildSubsonicViewUrl(config, "getCoverArt.view", {
		id,
		size: "128",
	});


	try {
		const upstream = await fetch(endpoint);
		if (!upstream.ok) {
			return new Response("Cover art unavailable", { status: 404 });
		}

		const headers = new Headers();
		headers.set("cache-control", "public, max-age=600, stale-while-revalidate=86400");
		const contentType = upstream.headers.get("content-type");
		if (contentType) {
			headers.set("content-type", contentType);
		}

		return new Response(upstream.body, {
			status: 200,
			headers,
		});
	} catch (_error) {
		return new Response("Cover art unavailable", { status: 502 });
	}
};


