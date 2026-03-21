import type { ParsedNowPlaying, NavidromeTrack } from "../types/navidrome";

const DEFAULT_API_VERSION = "1.16.1";
const DEFAULT_CLIENT_NAME = "learningis1.st";

type NavidromeConfig = {
	baseUrl: string;
	username: string;
	token: string;
	salt: string;
	clientName: string;
	apiVersion: string;
};

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

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

export const getNavidromeConfig = (env: Env): NavidromeConfig | null => {
	const baseUrl = readString(env.NAVIDROME_BASE_URL);
	const username = readString(env.NAVIDROME_USERNAME);
	const token = readString(env.NAVIDROME_TOKEN);
	const salt = readString(env.NAVIDROME_SALT);
	const clientName = readString(env.NAVIDROME_CLIENT_NAME) || DEFAULT_CLIENT_NAME;
	const apiVersion = readString(env.NAVIDROME_API_VERSION) || DEFAULT_API_VERSION;

	if (!baseUrl || !username || !token || !salt) {
		return null;
	}

	return {
		baseUrl,
		username,
		token,
		salt,
		clientName,
		apiVersion,
	};
};

export const buildSubsonicViewUrl = (
	config: NavidromeConfig,
	viewName: string,
	extraParams?: Record<string, string>,
) => {
	const query = new URLSearchParams({
		u: config.username,
		t: config.token,
		s: config.salt,
		v: config.apiVersion,
		c: config.clientName,
		f: "json",
		...extraParams,
	});

	return `${normalizeBaseUrl(config.baseUrl)}/rest/${viewName}?${query.toString()}`;
};

export const parseNowPlayingResponse = (raw: unknown): ParsedNowPlaying | null => {
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

