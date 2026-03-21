import type { APIRoute } from "astro";

export const prerender = false;

type NavidromeTrack = {
	title: string;
	artist: string;
	album: string;
	coverArtId: string | null;
	coverArtUrl: string | null;
	durationSeconds: number | null;
};

type TrackState = "playing" | "last_played" | "idle";

type NowPlayingPayload = {
	isPlaying: boolean;
	source: TrackState;
	track: NavidromeTrack | null;
	lastPlayedAt: string | null;
	progress: {
		positionSeconds: number;
		percent: number;
	} | null;
};

type StoredTrack = {
	track: NavidromeTrack;
	lastPlayedAt: string;
};

const DEFAULT_API_VERSION = "1.16.1";
const DEFAULT_CLIENT_NAME = "learningis1.st";
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

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const readNumber = (value: unknown) => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

const getTrackFromResponse = (
	raw: unknown,
): { track: NavidromeTrack; positionSeconds: number; percent: number } | null => {
	if (!raw || typeof raw !== "object") {
		return null;
	}

	const root = raw as Record<string, unknown>;
	const response = root["subsonic-response"];
	if (!response || typeof response !== "object") {
		return null;
	}

	const nowPlaying = (response as Record<string, unknown>).nowPlaying;
	if (!nowPlaying || typeof nowPlaying !== "object") {
		return null;
	}

	const entries = (nowPlaying as Record<string, unknown>).entry;
	if (!Array.isArray(entries) || entries.length === 0) {
		return null;
	}

	const firstEntry = entries[0];
	if (!firstEntry || typeof firstEntry !== "object") {
		return null;
	}

	const entry = firstEntry as Record<string, unknown>;
	const title = readString(entry.title);
	const artist = readString(entry.artist);
	const album = readString(entry.album);
	const coverArtId = readString(entry.coverArt);
	const durationSeconds = readNumber(entry.duration);
	const minutesAgo = readNumber(entry.minutesAgo);

	if (!title) {
		return null;
	}

	const playbackSeconds = minutesAgo !== null ? Math.floor(minutesAgo * 60) : 0;
	const boundedPosition = durationSeconds ? clamp(playbackSeconds, 0, durationSeconds) : playbackSeconds;
	const percent = durationSeconds && durationSeconds > 0
		? clamp(Math.round((boundedPosition / durationSeconds) * 100), 0, 100)
		: 0;

	const track: NavidromeTrack = {
		title,
		artist: artist || "Unknown artist",
		album: album || "Unknown album",
		coverArtId: coverArtId || null,
		coverArtUrl: coverArtId ? `/api/navidrome/cover-art/${encodeURIComponent(coverArtId)}` : null,
		durationSeconds: durationSeconds !== null ? Math.max(0, Math.floor(durationSeconds)) : null,
	};

	return { track, positionSeconds: boundedPosition, percent };
};

export const GET: APIRoute = async ({ locals }) => {
	const env = locals.runtime.env;
	const baseUrl = readString(env.NAVIDROME_BASE_URL);
	const username = readString(env.NAVIDROME_USERNAME);
	const token = readString(env.NAVIDROME_TOKEN);
	const salt = readString(env.NAVIDROME_SALT);
	const clientName = readString(env.NAVIDROME_CLIENT_NAME) || DEFAULT_CLIENT_NAME;
	const apiVersion = readString(env.NAVIDROME_API_VERSION) || DEFAULT_API_VERSION;
	const lastListenedStore = env.LAST_LISTENED_KV;

	if (!baseUrl || !username || !token || !salt) {
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

	const query = new URLSearchParams({
		u: username,
		t: token,
		s: salt,
		v: apiVersion,
		c: clientName,
		f: "json",
	});

	const endpoint = `${normalizeBaseUrl(baseUrl)}/rest/getNowPlaying.view?${query.toString()}`;

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
		const nowPlaying = getTrackFromResponse(data);
		if (!nowPlaying) {
			const fallback = await getFallbackPayload(lastListenedStore);
			return json(fallback);
		}

		const lastPlayedAt = new Date().toISOString();
		if (lastListenedStore) {
			await lastListenedStore.put(
				LAST_TRACK_KEY,
				JSON.stringify({
					track: nowPlaying.track,
					lastPlayedAt,
				} satisfies StoredTrack),
			);
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

