import {
	buildSubsonicViewUrl,
	getNavidromeConfig,
	getTrackSignature,
	parseNowPlayingResponse,
} from "../navidrome";
import type { NowPlayingPayload, StoredTrack } from "../../types/navidrome";

const LAST_TRACK_KEY = "last-track";

const IDLE_PAYLOAD: NowPlayingPayload = {
	isPlaying: false,
	source: "idle",
	track: null,
	lastPlayedAt: null,
	progress: null,
};

export const getFallbackPayload = async (kv?: KVNamespace): Promise<NowPlayingPayload> => {
	if (!kv) return IDLE_PAYLOAD;

	const parsed = await kv.get<Partial<StoredTrack>>(LAST_TRACK_KEY, "json");
	if (!parsed?.track || !parsed?.lastPlayedAt) return IDLE_PAYLOAD;

	return {
		...IDLE_PAYLOAD,
		source: "last_played",
		track: parsed.track,
		lastPlayedAt: parsed.lastPlayedAt,
	};
};

export const getNowPlayingPayload = async (env: Env) => {
	const config = getNavidromeConfig(env);
	const kv = env.LAST_LISTENED_KV;

	if (!config) {
		return {
			status: 500,
			payload: { error: "Navidrome environment variables are missing.", ...IDLE_PAYLOAD },
		};
	}

	try {
		const upstream = await fetch(buildSubsonicViewUrl(config, "getNowPlaying.view"), {
			headers: { Accept: "application/json" },
		});

		if (!upstream.ok) throw new Error("Upstream error");

		const nowPlaying = parseNowPlayingResponse(await upstream.json(), config.username);
		if (!nowPlaying) throw new Error("Empty payload");

		const track = nowPlaying.track;

		const lastPlayedAt = new Date().toISOString();

		if (kv) {
			const previous = await kv.get<Partial<StoredTrack>>(LAST_TRACK_KEY, "json");
			const shouldWrite = !previous?.track || getTrackSignature(previous.track) !== getTrackSignature(track);

			if (shouldWrite) {
				await kv.put(
					LAST_TRACK_KEY,
					JSON.stringify({ track, lastPlayedAt } satisfies StoredTrack),
				);
			}
		}

		return {
			status: 200,
			payload: {
				isPlaying: true,
				source: "playing",
				track,
				lastPlayedAt,
				progress: {
					positionSeconds: nowPlaying.positionSeconds,
					percent: nowPlaying.percent,
				},
			} satisfies NowPlayingPayload,
		};
	} catch (_error) {
		return {
			status: 200,
			payload: await getFallbackPayload(kv),
		};
	}
};
