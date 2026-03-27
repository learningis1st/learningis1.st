export type NavidromeTrack = {
	title: string;
	artist: string;
	album: string;
	albumArtist: string;
	coverArtId: string | null;
	durationSeconds: number | null;
};

export type TrackState = "playing" | "last_played" | "idle";

export type NowPlayingProgress = {
	positionSeconds: number;
	percent: number;
};

export type NowPlayingPayload = {
	isPlaying: boolean;
	source: TrackState;
	track: NavidromeTrack | null;
	lastPlayedAt: string | null;
	progress: NowPlayingProgress | null;
};

export type StoredTrack = {
	track: NavidromeTrack;
	lastPlayedAt: string;
};

export type ParsedNowPlaying = {
	track: NavidromeTrack;
	positionSeconds: number;
	percent: number;
};
