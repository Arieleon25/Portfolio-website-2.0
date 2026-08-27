/**
 * Entry point for the static site.
 *
 * Static assets are served directly by Cloudflare; this code only runs when no
 * asset matches the request path.
 *
 * It exists because the asset config uses html_handling "none", so that
 * /SavoraAIPort.html keeps serving at that exact URL instead of being
 * redirected to /SavoraAIPort. That setting also switches off the implicit
 * "/" -> "/index.html" mapping, so the homepage is wired up here by hand.
 *
 * not_found_handling is deliberately NOT set in wrangler.jsonc: it would make
 * the asset handler answer every unmatched path with 404.html before this
 * Worker ever ran, which would take the homepage down. The 404 is served here
 * instead.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return env.ASSETS.fetch(new URL('/index.html', url));
    }

    const response = await env.ASSETS.fetch(request);

    if (response.status === 404) {
      const notFound = await env.ASSETS.fetch(new URL('/404.html', url));
      return new Response(notFound.body, {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    return response;
  },
};
