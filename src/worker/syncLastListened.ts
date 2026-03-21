import {
	buildSubsonicViewUrl,
	getNavidromeConfig,
	getTrackSignature,
	parseNowPlayingResponse,
} from "../lib/navidrome";
import type { NavidromeTrack, StoredTrack } from "../types/navidrome";

const LAST_TRACK_KEY = "last-track";

export type SyncResult =
	| { status: "skipped"; reason: string }
	| { status: "updated"; track: Pick<NavidromeTrack, "title" | "artist" | "album"> };


export const syncLastListened = async (env: Env): Promise<SyncResult> => {
	if (!env.LAST_LISTENED_KV) {
		return { status: "skipped", reason: "missing_kv_binding" };
	}

	const config = getNavidromeConfig(env);
	if (!config) {
		return { status: "skipped", reason: "missing_navidrome_env" };
	}

	const endpoint = buildSubsonicViewUrl(config, "getNowPlaying.view");
	const response = await fetch(endpoint, {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		return { status: "skipped", reason: `upstream_http_${response.status}` };
	}

	const payload: unknown = await response.json();
	const nowPlaying = parseNowPlayingResponse(payload);
	if (!nowPlaying) {
		return { status: "skipped", reason: "no_now_playing_track" };
	}
	const track = nowPlaying.track;

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

