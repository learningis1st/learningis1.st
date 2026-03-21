const DEFAULT_API_VERSION = "1.16.1";
const DEFAULT_CLIENT_NAME = "learningis1.st";
const LAST_TRACK_KEY = "last-track";

type NavidromeTrack = {
	title: string;
	artist: string;
	album: string;
	coverArtId: string | null;
	coverArtUrl: string | null;
	durationSeconds: number | null;
};

type StoredTrack = {
	track: NavidromeTrack;
	lastPlayedAt: string;
};

export type SyncResult =
	| { status: "skipped"; reason: string }
	| { status: "updated"; track: Pick<NavidromeTrack, "title" | "artist" | "album"> };

const getTrackSignature = (track: NavidromeTrack) =>
	JSON.stringify({
		title: track.title,
		artist: track.artist,
		album: track.album,
		coverArtId: track.coverArtId,
		durationSeconds: track.durationSeconds,
	});

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

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const getTrackFromResponse = (raw: unknown): NavidromeTrack | null => {
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
	if (!title) {
		return null;
	}

	const artist = readString(entry.artist);
	const album = readString(entry.album);
	const coverArtId = readString(entry.coverArt);
	const durationSeconds = readNumber(entry.duration);

	return {
		title,
		artist: artist || "Unknown artist",
		album: album || "Unknown album",
		coverArtId: coverArtId || null,
		coverArtUrl: coverArtId ? `/api/navidrome/cover-art/${encodeURIComponent(coverArtId)}` : null,
		durationSeconds: durationSeconds !== null ? Math.max(0, Math.floor(durationSeconds)) : null,
	};
};

export const syncLastListened = async (env: Env): Promise<SyncResult> => {
	if (!env.LAST_LISTENED_KV) {
		return { status: "skipped", reason: "missing_kv_binding" };
	}

	const baseUrl = readString(env.NAVIDROME_BASE_URL);
	const username = readString(env.NAVIDROME_USERNAME);
	const token = readString(env.NAVIDROME_TOKEN);
	const salt = readString(env.NAVIDROME_SALT);
	const clientName = readString(env.NAVIDROME_CLIENT_NAME) || DEFAULT_CLIENT_NAME;
	const apiVersion = readString(env.NAVIDROME_API_VERSION) || DEFAULT_API_VERSION;

	if (!baseUrl || !username || !token || !salt) {
		return { status: "skipped", reason: "missing_navidrome_env" };
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
	const response = await fetch(endpoint, {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		return { status: "skipped", reason: `upstream_http_${response.status}` };
	}

	const payload: unknown = await response.json();
	const track = getTrackFromResponse(payload);
	if (!track) {
		return { status: "skipped", reason: "no_now_playing_track" };
	}

	const previous = await env.LAST_LISTENED_KV.get(LAST_TRACK_KEY, "json");
	if (previous && typeof previous === "object") {
		const previousTrack = (previous as Partial<StoredTrack>).track;
		if (previousTrack && getTrackSignature(previousTrack) === getTrackSignature(track)) {
			return { status: "skipped", reason: "same_track_as_existing" };
		}
	}

	const record: StoredTrack = {
		track,
		lastPlayedAt: new Date().toISOString(),
	};

	await env.LAST_LISTENED_KV.put(LAST_TRACK_KEY, JSON.stringify(record));

	return {
		status: "updated",
		track: {
			title: track.title,
			artist: track.artist,
			album: track.album,
		},
	};
};

