import type { ParsedNowPlaying, NavidromeTrack } from "../../types/navidrome";

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
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");
const normalizeUsername = (value: unknown) => readString(value).toLowerCase();

export const getTrackSignature = (track: NavidromeTrack) =>
	JSON.stringify({
		title: track.title,
		artist: track.artist,
		album: track.album,
		albumArtist: track.albumArtist,
		coverArtId: track.coverArtId,
		durationSeconds: track.durationSeconds,
	});

export const getNavidromeConfig = (env: Env): NavidromeConfig | null => {
	const baseUrl = readString(env.NAVIDROME_BASE_URL);
	const username = readString(env.NAVIDROME_USERNAME);
	const token = readString(env.NAVIDROME_TOKEN);
	const salt = readString(env.NAVIDROME_SALT);

	if (!baseUrl || !username || !token || !salt) {
		return null;
	}

	return {
		baseUrl,
		username,
		token,
		salt,
		clientName: readString(env.NAVIDROME_CLIENT_NAME) || DEFAULT_CLIENT_NAME,
		apiVersion: readString(env.NAVIDROME_API_VERSION) || DEFAULT_API_VERSION,
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

export const parseNowPlayingResponse = (raw: unknown, configuredUsername: string): ParsedNowPlaying | null => {
	const entries = (raw as any)?.["subsonic-response"]?.nowPlaying?.entry;
	if (!Array.isArray(entries) || entries.length === 0) return null;

	const targetUsername = normalizeUsername(configuredUsername);
	if (!targetUsername) return null;

	const entry = entries.find((candidate: any) => normalizeUsername(candidate?.username) === targetUsername);
	if (!entry) return null;

	const title = readString(entry.title);
	if (!title) return null;

	const artist = readString(entry.displayArtist) || readString(entry.artist) || "Unknown artist";
	const album = readString(entry.album) || "Unknown album";
	const albumArtist = readString(entry.displayAlbumArtist) || artist;
	const coverArtId = readString(entry.coverArt) || null;
	const durationSeconds = readNumber(entry.duration);
	const minutesAgo = readNumber(entry.minutesAgo);

	const playbackSeconds = minutesAgo !== null ? Math.floor(minutesAgo * 60) : 0;
	const boundedPosition = durationSeconds ? clamp(playbackSeconds, 0, durationSeconds) : playbackSeconds;
	const percent = durationSeconds && durationSeconds > 0
		? clamp(Math.round((boundedPosition / durationSeconds) * 100), 0, 100)
		: 0;

	return {
		track: {
			title,
			artist,
			album,
			albumArtist,
			coverArtId,
			durationSeconds: durationSeconds !== null ? Math.max(0, Math.floor(durationSeconds)) : null,
		},
		positionSeconds: boundedPosition,
		percent,
	};
};
