import type { APIRoute } from "astro";

export const prerender = false;

const OPENAPI = "3.1.0";

export const GET: APIRoute = ({ url }) => {
	const origin = url.origin;

	const body = {
		openapi: OPENAPI,
		info: {
			title: "learningis1.st API",
			version: "1.0.0",
			description: "Now-playing and Navidrome helper endpoints.",
		},
		servers: [{ url: origin }],
		paths: {
			"/api/now-playing.json": {
				get: {
					summary: "Get current now-playing payload",
					responses: {
						"200": { description: "Now-playing payload" },
						"500": { description: "Navidrome configuration missing" },
					},
				},
			},
			"/api/navidrome/cover-art/{id}": {
				get: {
					summary: "Proxy cover art from Navidrome",
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": { description: "Cover art image" },
						"400": { description: "Invalid cover art id" },
					},
				},
			},
			"/api/health/navidrome.json": {
				get: {
					summary: "Check Navidrome reachability",
					responses: {
						"200": { description: "Health check succeeded" },
						"500": { description: "Configuration missing" },
						"502": { description: "Upstream check failed" },
					},
				},
			},
		},
	};

	return new Response(JSON.stringify(body, null, 2), {
		headers: {
			"content-type": "application/openapi+json; charset=utf-8",
			"cache-control": "public, max-age=300",
		},
	});
};

