type Track = {
	title?: string;
	artist?: string;
	album?: string;
	albumArtist?: string;
	coverArtId?: string | null;
	durationSeconds?: number | null;
};

type Payload = {
	source?: string;
	track?: Track | null;
	lastPlayedAt?: string | null;
	progress?: {
		positionSeconds?: number;
		percent?: number;
	} | null;
} | null;

const NOW_PLAYING_CFG = {
	QUANTUM_SEC: 60,
	MIN_POLL_SEC: 1.5,
	END_WINDOW_EXTRA_SEC: 0.5,
	END_POLL_RATE_SEC: 2.0,
	IDLE_POLL_SEC: 30,
	DEFAULT_POLL_SEC: 12.0,
	TRACK_SWITCH_UNCERTAINTY_SEC: 3.0,
	TRACK_SWITCH_POLL_SEC: 1.5,
	LOADING_DELAY_MS: 400,
	TEXT_TRANSITION_MS: 150,
	LABEL_TRANSITION_MS: 200,
	COVER_TRANSITION_MS: 150,
	MIN_FETCH_DELAY_MS: 1000,
} as const;

type WidgetState = {
	hasLoaded: boolean;
	tickerId: number | null;
	fetchId: number | null;
	loadingId: number | null;
	trackKey: string | null;
	reqId: number;
	basePosition: number;
	baseTimestamp: number;
	uncertaintySec: number;
	pollRateSec: number;
	visualSec: number;
	durationSec: number;
	lastTick: number;
	lastAnnouncementKey: string;
};

type ProgressFrameInput = {
	nowMs: number;
	lastTickMs: number;
	basePositionSec: number;
	baseTimestampMs: number;
	visualSec: number;
	durationSec: number;
	quantumSec: number;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getTrackKey = (t?: Track | null) =>
	JSON.stringify([t?.title, t?.artist, t?.album, t?.albumArtist, t?.coverArtId, t?.durationSeconds]);

const formatRelativeTime = (iso: string | null | undefined) => {
	if (!iso) return "";
	const ts = Date.parse(iso);
	if (Number.isNaN(ts)) return "";

	const mins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
	if (mins < 60) return `${mins}m ago`;

	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;

	return `${Math.floor(hrs / 24)}d ago`;
};

const createInitialState = (): WidgetState => ({
	hasLoaded: false,
	tickerId: null,
	fetchId: null,
	loadingId: null,
	trackKey: null,
	reqId: 0,
	basePosition: 0,
	baseTimestamp: Date.now(),
	uncertaintySec: NOW_PLAYING_CFG.QUANTUM_SEC,
	pollRateSec: NOW_PLAYING_CFG.DEFAULT_POLL_SEC,
	visualSec: 0,
	durationSec: 0,
	lastTick: Date.now(),
	lastAnnouncementKey: "",
});

const calculateProgressFrame = (input: ProgressFrameInput) => {
	const {
		nowMs,
		lastTickMs,
		basePositionSec,
		baseTimestampMs,
		visualSec,
		durationSec,
		quantumSec,
	} = input;

	const deltaTickSec = Math.max(0, (nowMs - lastTickMs) / 1000);
	const elapsedSinceBaseSec = Math.max(0, (nowMs - baseTimestampMs) / 1000);
	const maxAllowedSec = basePositionSec + quantumSec;
	const targetSec = Math.min(basePositionSec + elapsedSinceBaseSec, maxAllowedSec, durationSec);

	const distanceSec = targetSec - visualSec;
	let adjustedVisualSec = visualSec;
	let speed = 1.0;

	if (distanceSec > 0.5) {
		speed = 1.0 + (distanceSec / 5.0);
	} else if (distanceSec < -5.0) {
		adjustedVisualSec = targetSec;
		speed = 1.0;
	} else if (distanceSec < 0) {
		speed = 0.5;
	}

	adjustedVisualSec += speed * deltaTickSec;
	adjustedVisualSec = Math.max(0, Math.min(adjustedVisualSec, durationSec));

	return {
		lastTickMs: nowMs,
		visualSec: adjustedVisualSec,
		percent: durationSec > 0 ? (adjustedVisualSec / durationSec) * 100 : 0,
		shouldStop: adjustedVisualSec >= durationSec,
	};
};

const computeNextPollDelayMs = (params: {
	triggerBoundarySleep: boolean;
	pollRateSec: number;
	uncertaintySec: number;
	durationSec: number;
	basePositionSec: number;
	baseTimestampMs: number;
	nowMs: number;
}) => {
	const {
		triggerBoundarySleep,
		pollRateSec,
		uncertaintySec,
		durationSec,
		basePositionSec,
		baseTimestampMs,
		nowMs,
	} = params;

	const elapsedSinceBaseSec = Math.max(0, (nowMs - baseTimestampMs) / 1000);
	const estimatedPos = basePositionSec + elapsedSinceBaseSec;
	const remainingSec = Math.max(0, durationSec - estimatedPos);

	let nextDelayMs = triggerBoundarySleep
		? (NOW_PLAYING_CFG.QUANTUM_SEC - (uncertaintySec / 2)) * 1000
		: pollRateSec * 1000;

	const currentEndWindowSec = uncertaintySec + NOW_PLAYING_CFG.END_WINDOW_EXTRA_SEC;

	if (durationSec > 0) {
		if (remainingSec <= currentEndWindowSec) {
			nextDelayMs = NOW_PLAYING_CFG.END_POLL_RATE_SEC * 1000;
		} else {
			const timeUntilEndWindowMs = (remainingSec - currentEndWindowSec) * 1000;
			nextDelayMs = Math.max(
				NOW_PLAYING_CFG.END_POLL_RATE_SEC * 1000,
				Math.min(nextDelayMs, timeUntilEndWindowMs),
			);
		}
	}

	return nextDelayMs;
};

const parseInitialPayload = (raw: string | undefined): Payload => {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as Payload;
	} catch {
		return null;
	}
};

export const initNowPlayingWidget = (root: HTMLElement) => {
	const endpoint = root.dataset.endpoint ?? "/api/now-playing.json";
	const refreshMs = Number(root.dataset.refreshMs ?? "10000");
	const initialPayload = parseInitialPayload(root.dataset.initialPayload);

	const $ = (selector: string) => root.querySelector<HTMLElement>(selector);
	const els = {
		status: $("[data-status]"),
		announce: $("[data-announce]"),
		label: $("[data-label]"),
		track: $("[data-track]"),
		meta: $("[data-meta]"),
		time: $("[data-time]"),
		coverWrap: $("[data-cover-wrap]"),
		cover: root.querySelector<HTMLImageElement>("[data-cover]"),
		progress: $("[data-progress]"),
		progressBar: $("[data-progress-bar]"),
	};

	const state = createInitialState();

	const stopTicker = () => {
		if (state.tickerId === null) return;
		window.cancelAnimationFrame(state.tickerId);
		state.tickerId = null;
	};

	const clearFetch = () => {
		if (state.fetchId === null) return;
		window.clearTimeout(state.fetchId);
		state.fetchId = null;
	};

	const clearLoading = () => {
		if (state.loadingId === null) return;
		window.clearTimeout(state.loadingId);
		state.loadingId = null;
	};

	const resetProgress = () => {
		Object.assign(state, {
			basePosition: 0,
			baseTimestamp: Date.now(),
			uncertaintySec: NOW_PLAYING_CFG.QUANTUM_SEC,
			pollRateSec: NOW_PLAYING_CFG.DEFAULT_POLL_SEC,
			visualSec: 0,
			durationSec: 0,
			trackKey: null,
		});
	};

	const markReady = () => {
		if (state.hasLoaded) return;
		state.hasLoaded = true;
		root.dataset.state = "ready";
	};

	const showLoadingWithDelay = () => {
		clearLoading();
		if (!els.status) return;

		state.loadingId = window.setTimeout(() => {
			if (!els.status) return;
			els.status.textContent = "Loading...";
			els.status.hidden = false;
			state.loadingId = null;
		}, NOW_PLAYING_CFG.LOADING_DELAY_MS);
	};

	const setTextContent = (
		el: HTMLElement | null,
		text: string,
		transitionMs: number = NOW_PLAYING_CFG.TEXT_TRANSITION_MS,
	) => {
		if (!el || el.textContent === text) return;
		el.classList.add("transitioning");
		window.setTimeout(() => {
			if (!document.contains(root)) return;
			el.textContent = text;
			el.classList.remove("transitioning");
		}, transitionMs);
	};

	const setLabelText = (text: string) => setTextContent(els.label, text, NOW_PLAYING_CFG.LABEL_TRANSITION_MS);

	const announce = (key: string, message: string) => {
		if (!els.announce) return;
		if (!message) return;
		if (state.lastAnnouncementKey === key) return;
		state.lastAnnouncementKey = key;
		els.announce.textContent = message;
	};

	const setIdleState = (message: string) => {
		setLabelText("Last listened album");

		if (els.status) {
			els.status.textContent = message;
			els.status.hidden = false;
		}

		if (els.track) els.track.hidden = true;
		if (els.meta) els.meta.hidden = true;
		if (els.time) els.time.hidden = true;
		if (els.coverWrap) els.coverWrap.hidden = true;

		resetProgress();
		stopTicker();

		if (els.progress) els.progress.hidden = true;
		if (els.progressBar) els.progressBar.style.transform = "scaleX(0)";

		markReady();
	};

	const setCover = (url: string | null | undefined) => {
		const { coverWrap, cover } = els;
		if (!coverWrap || !cover) return;

		if (!url) {
			coverWrap.classList.add("transitioning");
			window.setTimeout(() => {
				if (!document.contains(root)) return;
				coverWrap.hidden = true;
				cover.removeAttribute("src");
				coverWrap.classList.remove("transitioning");
			}, NOW_PLAYING_CFG.COVER_TRANSITION_MS);
			return;
		}

		if (cover.getAttribute("src") === url) return;

		coverWrap.classList.add("transitioning");
		window.setTimeout(() => {
			if (!document.contains(root)) return;
			coverWrap.hidden = false;
			cover.onload = cover.onerror = () => {
				coverWrap.classList.remove("transitioning");
				if (!cover) return;
				cover.onload = cover.onerror = null;
			};
			cover.src = url;
		}, NOW_PLAYING_CFG.COVER_TRANSITION_MS);
	};

	const setProgress = (percent: number, shouldShow: boolean) => {
		if (!els.progress || !els.progressBar) return;

		if (!shouldShow) {
			els.progress.hidden = true;
			els.progressBar.style.transform = "scaleX(0)";
			return;
		}

		els.progress.hidden = false;
		els.progressBar.style.transform = `scaleX(${clampPercent(percent) / 100})`;
	};

	const renderEstimatedProgress = () => {
		if (state.durationSec <= 0) return;

		const frame = calculateProgressFrame({
			nowMs: Date.now(),
			lastTickMs: state.lastTick,
			basePositionSec: state.basePosition,
			baseTimestampMs: state.baseTimestamp,
			visualSec: state.visualSec,
			durationSec: state.durationSec,
			quantumSec: NOW_PLAYING_CFG.QUANTUM_SEC,
		});

		state.lastTick = frame.lastTickMs;
		state.visualSec = frame.visualSec;
		setProgress(frame.percent, true);

		if (frame.shouldStop) stopTicker();
	};

	const tickProgress = () => {
		if (!document.contains(root)) return stopTicker();
		renderEstimatedProgress();
		if (state.tickerId !== null) {
			state.tickerId = window.requestAnimationFrame(tickProgress);
		}
	};

	const startTicker = () => {
		if (state.tickerId !== null) return;
		state.lastTick = Date.now();
		state.tickerId = window.requestAnimationFrame(tickProgress);
	};

	const scheduleNextFetch = (delayMs: number) => {
		clearFetch();
		if (!document.contains(root)) return;
		state.fetchId = window.setTimeout(() => {
			void fetchNowPlaying();
		}, Math.max(NOW_PLAYING_CFG.MIN_FETCH_DELAY_MS, delayMs));
	};

	const handlePayload = (payload: Payload, fetchStartMs: number) => {
		clearLoading();

		if (!payload?.track) {
			setIdleState("Not listening right now");
			announce("idle:none", "Not listening right now.");
			return NOW_PLAYING_CFG.IDLE_POLL_SEC * 1000;
		}

		const { track, source, lastPlayedAt } = payload;

		if (els.status) els.status.hidden = true;
		if (els.track) els.track.hidden = false;
		if (els.meta) els.meta.hidden = false;

		const coverUrl = track.coverArtId
			? `/api/navidrome/cover-art/${encodeURIComponent(track.coverArtId)}`
			: null;
		setCover(coverUrl);
		markReady();

		const title = track.title || "Unknown track";
		const metaStr = `${track.artist || "Unknown artist"} - ${track.album || "Unknown album"}`;
		const albumArtist = track.albumArtist || track.artist || "Unknown artist";

		if (source !== "playing") {
			setTextContent(els.track, track.album || "Unknown album");
			setTextContent(els.meta, albumArtist);
			setLabelText("Last listened album");
			announce(
				`paused:${track.title || ""}:${albumArtist}:${track.album || ""}`,
				`Last listened album: ${track.album || "Unknown album"} by ${albumArtist}.`,
			);

			resetProgress();
			stopTicker();
			setProgress(0, false);

			const relTime = formatRelativeTime(lastPlayedAt);
			if (els.time) {
				els.time.hidden = !relTime;
				if (relTime) els.time.textContent = relTime;
			}
			return NOW_PLAYING_CFG.IDLE_POLL_SEC * 1000;
		}

		setTextContent(els.track, title);
		setTextContent(els.meta, metaStr);
		setLabelText("Now listening");
		announce(
			`playing:${track.title || ""}:${track.artist || ""}:${track.album || ""}`,
			`Now listening: ${title} by ${track.artist || "Unknown artist"}.`,
		);
		if (els.time) els.time.hidden = true;

		const trackKey = getTrackKey(track);
		const rawSec = Math.max(0, payload.progress?.positionSeconds || 0);
		const durationSec = track.durationSeconds || 0;
		const timestamp = fetchStartMs || Date.now();

		let triggerBoundarySleep = false;

		if (trackKey !== state.trackKey) {
			const isFirstLoad = state.trackKey === null;
			state.trackKey = trackKey;
			state.basePosition = rawSec;
			state.baseTimestamp = timestamp;
			state.visualSec = rawSec;

			if (isFirstLoad) {
				state.uncertaintySec = NOW_PLAYING_CFG.QUANTUM_SEC;
				state.pollRateSec = NOW_PLAYING_CFG.DEFAULT_POLL_SEC;
			} else {
				state.uncertaintySec = NOW_PLAYING_CFG.TRACK_SWITCH_UNCERTAINTY_SEC;
				state.pollRateSec = NOW_PLAYING_CFG.TRACK_SWITCH_POLL_SEC;
				triggerBoundarySleep = true;
			}
		} else if (rawSec < state.basePosition) {
			state.basePosition = rawSec;
			state.baseTimestamp = timestamp;
			state.uncertaintySec = NOW_PLAYING_CFG.QUANTUM_SEC;
			state.pollRateSec = NOW_PLAYING_CFG.DEFAULT_POLL_SEC;
		} else if (rawSec > state.basePosition) {
			state.basePosition = rawSec;
			state.baseTimestamp = timestamp;
			state.uncertaintySec = state.pollRateSec;
			state.pollRateSec = Math.max(NOW_PLAYING_CFG.MIN_POLL_SEC, state.pollRateSec / 2);
			triggerBoundarySleep = true;
		}

		state.durationSec = durationSec;
		renderEstimatedProgress();
		startTicker();

		return computeNextPollDelayMs({
			triggerBoundarySleep,
			pollRateSec: state.pollRateSec,
			uncertaintySec: state.uncertaintySec,
			durationSec: state.durationSec,
			basePositionSec: state.basePosition,
			baseTimestampMs: state.baseTimestamp,
			nowMs: Date.now(),
		});
	};

	const fetchNowPlaying = async () => {
		if (!document.contains(root)) return;

		const reqId = ++state.reqId;
		if (!state.hasLoaded) showLoadingWithDelay();

		const fetchStartMs = Date.now();

		try {
			const res = await fetch(endpoint, {
				headers: { Accept: "application/json" },
				cache: "no-store",
			});

			if (reqId !== state.reqId) return;
			if (!res.ok) throw new Error("Fetch failed");

			const payload = (await res.json()) as Payload;
			if (reqId !== state.reqId) return;

			const nextDelayMs = handlePayload(payload, fetchStartMs);
			scheduleNextFetch(nextDelayMs);
		} catch {
			if (reqId !== state.reqId) return;
			clearLoading();
			setIdleState("Unable to load now-playing widget");
			announce("error:load", "Unable to load now playing.");
			scheduleNextFetch(refreshMs);
		}
	};

	if (initialPayload) {
		const nextDelayMs = handlePayload(initialPayload, Date.now());
		scheduleNextFetch(nextDelayMs);
	} else {
		void fetchNowPlaying();
	}
};
