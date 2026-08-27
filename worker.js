/**
 * Entry point for arieeskinazi.com.
 *
 * Two jobs:
 *
 *  1. Serve the heavy media (portfolio videos, the Unity build, the hero loop)
 *     out of the R2 bucket under the SAME origin as the site, at the same
 *     paths the old GoDaddy host used: /Ecom-videos/..., /Games/..., etc.
 *
 *     This matters. Serving them from a separate media subdomain made every
 *     video a cross-origin request, and cross-origin media gets filtered by
 *     ad blockers, privacy extensions and filtering DNS in ways that
 *     same-origin media does not — 34 of the 73 filenames contain "_Ad_",
 *     which many blocklists match on. Keeping media first-party sidesteps
 *     that whole class of problem.
 *
 *  2. Serve "/" as index.html, which the asset config's html_handling "none"
 *     otherwise leaves unmapped.
 *
 * Everything else is a plain static asset and never reaches this code.
 */

// Path prefixes that live in R2 rather than in the repo.
const R2_PREFIXES = [
  'Ecom-videos/',
  'Games/',
  'Images/Default-Images/CameraVideo.mp4',
];

function isR2Path(pathname) {
  const key = pathname.replace(/^\/+/, '');
  return R2_PREFIXES.some((p) => key === p || key.startsWith(p));
}

/** Parse a Range header into R2's offset/length form. Returns null if absent. */
function parseRange(header, size) {
  if (!header) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, startRaw, endRaw] = match;

  // Suffix range: "bytes=-500" means the last 500 bytes.
  if (startRaw === '') {
    if (endRaw === '') return null;
    const length = Math.min(parseInt(endRaw, 10), size);
    if (!length) return null;
    return { offset: size - length, length };
  }

  const offset = parseInt(startRaw, 10);
  if (offset >= size) return { unsatisfiable: true };

  const end = endRaw === '' ? size - 1 : Math.min(parseInt(endRaw, 10), size - 1);
  return { offset, length: end - offset + 1 };
}

async function serveFromR2(request, env, url) {
  const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));

  // Cheap metadata lookup so we know the size before deciding on ranges.
  const head = await env.MEDIA.head(key);
  if (!head) return new Response('Not found', { status: 404 });

  const size = head.size;
  const contentType = head.httpMetadata?.contentType || 'application/octet-stream';

  const baseHeaders = {
    'content-type': contentType,
    'accept-ranges': 'bytes',
    'etag': head.httpEtag,
    // Media is immutable once uploaded; a new video gets a new filename.
    'cache-control': 'public, max-age=31536000, immutable',
  };

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: { ...baseHeaders, 'content-length': String(size) },
    });
  }

  const range = parseRange(request.headers.get('range'), size);

  if (range && range.unsatisfiable) {
    return new Response('Range not satisfiable', {
      status: 416,
      headers: { ...baseHeaders, 'content-range': `bytes */${size}` },
    });
  }

  if (range) {
    const object = await env.MEDIA.get(key, {
      range: { offset: range.offset, length: range.length },
    });
    if (!object) return new Response('Not found', { status: 404 });

    const end = range.offset + range.length - 1;
    return new Response(object.body, {
      status: 206,
      headers: {
        ...baseHeaders,
        'content-length': String(range.length),
        'content-range': `bytes ${range.offset}-${end}/${size}`,
      },
    });
  }

  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  return new Response(object.body, {
    status: 200,
    headers: { ...baseHeaders, 'content-length': String(size) },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isR2Path(url.pathname)) {
      return serveFromR2(request, env, url);
    }

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
