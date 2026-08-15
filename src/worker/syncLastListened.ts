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
	| { status: "updated"; track: Pick<NavidromeTrack, "title" | "artist" | "album" | "albumArtist"> };

export const syncLastListened = async (env: Env): Promise<SyncResult> => {
	const kv = env.LAST_LISTENED_KV;
	if (!kv) return { status: "skipped", reason: "missing_kv_binding" };

	const config = getNavidromeConfig(env);
	if (!config) return { status: "skipped", reason: "missing_navidrome_env" };

	const response = await fetch(buildSubsonicViewUrl(config, "getNowPlaying.view"), {
		headers: { Accept: "application/json" },
	});

	if (!response.ok) return { status: "skipped", reason: `upstream_http_${response.status}` };

	const nowPlaying = parseNowPlayingResponse(await response.json(), config.username);
	if (!nowPlaying?.track) return { status: "skipped", reason: "no_now_playing_track" };

	const track = nowPlaying.track;
	const previous = await kv.get<Partial<StoredTrack>>(LAST_TRACK_KEY, "json");

	if (previous?.track && getTrackSignature(previous.track) === getTrackSignature(track)) {
		return { status: "skipped", reason: "same_track_as_existing" };
	}

	await kv.put(LAST_TRACK_KEY, JSON.stringify({
		track,
		lastPlayedAt: new Date().toISOString(),
	} satisfies StoredTrack));

	return {
		status: "updated",
		track: {
			title: track.title,
			artist: track.artist,
			album: track.album,
			albumArtist: track.albumArtist,
		},
	};
};
