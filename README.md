# learningis1.st

Personal site built with Astro and deployed on Cloudflare Workers.

## Quick start

```bash
npm install
npm run dev
```

## Build and preview

```bash
npm run build
npm run preview
```

## Deploy

```bash
npm run check
npm run deploy
```

## Navidrome now playing widget

Set these secrets before deploying:

```bash
wrangler secret put NAVIDROME_BASE_URL
wrangler secret put NAVIDROME_USERNAME
wrangler secret put NAVIDROME_TOKEN
wrangler secret put NAVIDROME_SALT
```

This follows the Subsonic token flow (`u`, `t`, `s`).

Optional vars in `wrangler.json`:

- `NAVIDROME_CLIENT_NAME` (default: `learningis1.st`)
- `NAVIDROME_API_VERSION` (default: `1.16.1`)

The widget fetches data from `GET /api/now-playing.json`.
It also uses `GET /api/navidrome/cover-art/:id` as an authenticated image proxy.
For setup/debugging, use `GET /api/health/navidrome.json` to validate Subsonic auth (`u`, `t`, `s`).

`LAST_LISTENED_KV` is also refreshed by a cron trigger (`*/2 * * * *`) so history continues updating even if nobody opens the site.

To enable "last listened" fallback, bind a KV namespace:

```bash
wrangler kv namespace create LAST_LISTENED_KV
wrangler kv namespace create LAST_LISTENED_KV --preview
```

Then add the returned IDs to `wrangler.json`:

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

Without KV, the endpoint still works but cannot return the last listened track when playback is idle.

Current payload from `GET /api/now-playing.json` includes:

- `source`: `playing`, `last_played`, or `idle`
- `track`: title/artist/album + `coverArtUrl` when available
- `progress`: playback percentage when currently playing

## Project map

- Home page: `src/pages/index.astro`
- Base layout: `src/layouts/BaseLayout.astro`
- Global styles: `src/styles/global.css`
- Worker/deploy config: `wrangler.json`

## Runtime

- Node.js `>=22`
