# learningis1.st

Personal site built with Astro and deployed on Cloudflare Workers.

## Quick start

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run build
npm run preview
npm run check
npm run deploy
npm run cf-typegen
```

- `dev`: Astro dev server
- `build`: Astro production build
- `preview`: build + `wrangler dev` against the Worker output
- `check`: build + TypeScript check + `wrangler deploy --dry-run`
- `deploy`: build + Cloudflare deploy
- `cf-typegen`: regenerate Worker env types via `wrangler types`

## Navidrome now playing

Required secrets:

```bash
wrangler secret put NAVIDROME_BASE_URL
wrangler secret put NAVIDROME_USERNAME
wrangler secret put NAVIDROME_TOKEN
wrangler secret put NAVIDROME_SALT
```

Optional `vars` in `wrangler.json`:

- `NAVIDROME_CLIENT_NAME` (default: `learningis1.st`)
- `NAVIDROME_API_VERSION` (default: `1.16.1`)

Subsonic auth uses token params (`u`, `t`, `s`) and requests are scoped to `NAVIDROME_USERNAME` only.

## Cloudflare bindings

- `ASSETS` (required): static asset binding used by the Astro Cloudflare adapter
- `LAST_LISTENED_KV` (optional): stores the latest track for idle fallback

Create KV namespaces:

```bash
wrangler kv namespace create LAST_LISTENED_KV
wrangler kv namespace create LAST_LISTENED_KV --preview
```

Then set IDs in `wrangler.json`:

```json
{
  "kv_namespaces": [
	{
	  "binding": "LAST_LISTENED_KV",
	  "id": "<production-namespace-id>",
	  "preview_id": "<preview-namespace-id>"
	}
  ]
}
```

If `LAST_LISTENED_KV` is missing, `/api/now-playing.json` still works but fallback becomes `idle` when live playback cannot be read.

## API routes

- `GET /api/now-playing.json`
  - returns `200` for normal/fallback payloads
  - returns `500` when required Navidrome env vars are missing
- `GET /api/navidrome/cover-art/:id`
  - authenticated cover art proxy (`getCoverArt.view`), 128px request size
  - validates `:id` (`[A-Za-z0-9:_-]+`), returns `400` for invalid IDs
- `GET /api/health/navidrome.json`
  - pings `ping.view` and validates Subsonic `status: "ok"`
  - returns `ok`, `latencyMs`, and error details for failed upstream checks

## Now playing payload

`GET /api/now-playing.json` returns this shape:

```json
{
  "isPlaying": true,
  "source": "playing",
  "track": {
    "title": "It’s Safe to Say You Dig the Backseat",
    "artist": "Dance Gavin Dance",
    "album": "Downtown Battle Mountain",
    "albumArtist": "Dance Gavin Dance",
    "coverArtId": "mf-fOzNstsKlApI8DW25h2OZS_69b9b8a0",
    "durationSeconds": 314
  },
  "lastPlayedAt": "2026-03-26T20:53:50.795Z",
  "progress": {
    "positionSeconds": 120,
    "percent": 38
  }
}
```

Notes:

- `source` is one of `playing`, `last_played`, or `idle`
- `track.artist` prefers Subsonic `displayArtist` then `artist`
- `track.albumArtist` prefers `displayAlbumArtist` then `track.artist`
- `progress` is `null` when not actively playing

## Scheduled sync

`wrangler.json` configures cron `*/4 * * * *`.

The Worker scheduled handler (`src/worker.ts`) runs `syncLastListened` to refresh KV so the widget can keep showing the last track even when no user is currently browsing the site.

## Project map

- Home page: `src/pages/index.astro`
- Now playing UI: `src/components/NowPlaying.astro`
- Now playing client logic: `src/components/now-playing.client.ts`
- Server now-playing logic: `src/lib/now-playing/server.ts`
- Navidrome helpers: `src/lib/navidrome/index.ts`
- Worker entry/cron: `src/worker.ts`
- Worker sync job: `src/worker/syncLastListened.ts`
- Worker config: `wrangler.json`

## Runtime

- Node.js `>=22`
