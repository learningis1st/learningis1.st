import type { APIRoute } from "astro";

export const prerender = false;

const DEFAULT_API_VERSION = "1.16.1";
const DEFAULT_CLIENT_NAME = "learningis1.st";

const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

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

export const GET: APIRoute = async ({ locals }) => {
	const env = locals.runtime.env;
	const baseUrl = readString(env.NAVIDROME_BASE_URL);
	const username = readString(env.NAVIDROME_USERNAME);
	const token = readString(env.NAVIDROME_TOKEN);
	const salt = readString(env.NAVIDROME_SALT);
	const clientName = readString(env.NAVIDROME_CLIENT_NAME) || DEFAULT_CLIENT_NAME;
	const apiVersion = readString(env.NAVIDROME_API_VERSION) || DEFAULT_API_VERSION;

	if (!baseUrl || !username || !token || !salt) {
		return json(
			{
				ok: false,
				error: "Navidrome environment variables are missing.",
			},
			500,
		);
	}

	const query = new URLSearchParams({
		u: username,
		t: token,
		s: salt,
		v: apiVersion,
		c: clientName,
		f: "json",
	});

	const endpoint = `${normalizeBaseUrl(baseUrl)}/rest/ping.view?${query.toString()}`;
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

