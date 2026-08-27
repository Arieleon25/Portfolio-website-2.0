/**
 * Entry point for the static site.
 *
 * Static assets are served directly by Cloudflare and this code never runs for
 * them. It exists for one reason: the asset config uses html_handling "none"
 * so that /SavoraAIPort.html keeps serving at that exact URL instead of being
 * redirected to /SavoraAIPort. That setting also switches off the implicit
 * "/" -> "/index.html" mapping, so the homepage is wired up here by hand.
 *
 * Anything else falls through to the asset handler, which serves 404.html.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return env.ASSETS.fetch(new URL('/index.html', url));
    }

    return env.ASSETS.fetch(request);
  },
};
