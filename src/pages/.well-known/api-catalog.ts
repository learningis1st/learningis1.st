import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
	const origin = url.origin;
	const apiAnchor = new URL("/api", origin).toString();
	const readmeUrl = "https://github.com/learningis1st/learningis1.st#readme";

	const body = {
		linkset: [
			{
				anchor: apiAnchor,
				"service-desc": [
					{
						href: new URL("/api/openapi.json", origin).toString(),
						type: "application/openapi+json",
					},
				],
				"service-doc": [
					{
						href: readmeUrl,
						type: "text/html",
					},
				],
				status: [
					{
						href: new URL("/api/health/navidrome.json", origin).toString(),
						type: "application/json",
					},
				],
			},
		],
	};

	return new Response(JSON.stringify(body), {
		headers: {
			"content-type": "application/linkset+json; charset=utf-8",
			"cache-control": "public, max-age=300",
		},
	});
};

