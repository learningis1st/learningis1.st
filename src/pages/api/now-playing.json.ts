import type { APIRoute } from "astro";
import {
	buildSubsonicViewUrl,
	getNavidromeConfig,
	getTrackSignature,
	parseNowPlayingResponse,
} from "../../lib/navidrome";
import type { NowPlayingPayload, StoredTrack } from "../../types/navidrome";

export const prerender = false;
const LAST_TRACK_KEY = "last-track";

const json = (body: Record<string, unknown>, init?: ResponseInit) =>
	new Response(JSON.stringify(body), {
		status: init?.status ?? 200,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "public, max-age=15, stale-while-revalidate=45",
			...init?.headers,
		},
	});

const getFallbackPayload = async (kv?: KVNamespace): Promise<NowPlayingPayload> => {
	if (!kv) {
		return {
			isPlaying: false,
			source: "idle",
			track: null,
			lastPlayedAt: null,
			progress: null,
		};
	}

	const raw = await kv.get(LAST_TRACK_KEY, "json");
	if (!raw || typeof raw !== "object") {
		return {
			isPlaying: false,
			source: "idle",
			track: null,
			lastPlayedAt: null,
			progress: null,
		};
	}

	const parsed = raw as Partial<StoredTrack>;
	if (!parsed.track || !parsed.lastPlayedAt) {
		return {
			isPlaying: false,
			source: "idle",
			track: null,
			lastPlayedAt: null,
			progress: null,
		};
	}

	return {
		isPlaying: false,
		source: "last_played",
		track: parsed.track,
		lastPlayedAt: parsed.lastPlayedAt,
		progress: null,
	};
};
export const GET: APIRoute = async ({ locals }) => {
	const config = getNavidromeConfig(locals.runtime.env);
	const lastListenedStore = locals.runtime.env.LAST_LISTENED_KV;

	if (!config) {
		return json(
			{
				error: "Navidrome environment variables are missing.",
				isPlaying: false,
				source: "idle",
				track: null,
				lastPlayedAt: null,
				progress: null,
			},
			{ status: 500 },
		);
	}

	const endpoint = buildSubsonicViewUrl(config, "getNowPlaying.view");

	try {
		const upstream = await fetch(endpoint, {
			headers: {
				Accept: "application/json",
			},
		});

		if (!upstream.ok) {
			const fallback = await getFallbackPayload(lastListenedStore);
			return json(fallback, { status: 200 });
		}

		const data: unknown = await upstream.json();
		const nowPlaying = parseNowPlayingResponse(data);
		if (!nowPlaying) {
			const fallback = await getFallbackPayload(lastListenedStore);
			return json(fallback);
		}

		const lastPlayedAt = new Date().toISOString();
		if (lastListenedStore) {
			const previous = await lastListenedStore.get(LAST_TRACK_KEY, "json");
			let shouldWrite = true;

			if (previous && typeof previous === "object") {
				const previousTrack = (previous as Partial<StoredTrack>).track;
				if (previousTrack && getTrackSignature(previousTrack) === getTrackSignature(nowPlaying.track)) {
					shouldWrite = false;
				}
			}

			if (shouldWrite) {
				await lastListenedStore.put(
					LAST_TRACK_KEY,
					JSON.stringify({
						track: nowPlaying.track,
						lastPlayedAt,
					} satisfies StoredTrack),
				);
			}
		}

		const body: NowPlayingPayload = {
			isPlaying: true,
			source: "playing",
			track: nowPlaying.track,
			lastPlayedAt,
			progress: {
				positionSeconds: nowPlaying.positionSeconds,
				percent: nowPlaying.percent,
			},
		};

		return json(body);
	} catch (_error) {
		const fallback = await getFallbackPayload(lastListenedStore);
		return json(fallback, { status: 200 });
	}
};

