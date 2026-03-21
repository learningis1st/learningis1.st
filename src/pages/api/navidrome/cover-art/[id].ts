import type { APIRoute } from "astro";

export const prerender = false;

const DEFAULT_API_VERSION = "1.16.1";
const DEFAULT_CLIENT_NAME = "learningis1.st";

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");
const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const GET: APIRoute = async ({ params, locals }) => {
	const id = readString(params.id);
	if (!id || !/^[A-Za-z0-9:_-]+$/.test(id)) {
		return new Response("Invalid cover art id", { status: 400 });
	}

	const env = locals.runtime.env;
	const baseUrl = readString(env.NAVIDROME_BASE_URL);
	const username = readString(env.NAVIDROME_USERNAME);
	const token = readString(env.NAVIDROME_TOKEN);
	const salt = readString(env.NAVIDROME_SALT);
	const clientName = readString(env.NAVIDROME_CLIENT_NAME) || DEFAULT_CLIENT_NAME;
	const apiVersion = readString(env.NAVIDROME_API_VERSION) || DEFAULT_API_VERSION;

	if (!baseUrl || !username || !token || !salt) {
		return new Response("Navidrome environment variables are missing.", { status: 500 });
	}

	const query = new URLSearchParams({
		u: username,
		t: token,
		s: salt,
		v: apiVersion,
		c: clientName,
		f: "json",
		id,
		size: "128",
	});

	const endpoint = `${normalizeBaseUrl(baseUrl)}/rest/getCoverArt.view?${query.toString()}`;

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


