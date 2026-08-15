interface Env {
  ASSETS: Fetcher;
  LAST_LISTENED_KV?: KVNamespace;
  NAVIDROME_BASE_URL: string;
  NAVIDROME_USERNAME: string;
  NAVIDROME_TOKEN: string;
  NAVIDROME_SALT: string;
  NAVIDROME_CLIENT_NAME?: string;
  NAVIDROME_API_VERSION?: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
