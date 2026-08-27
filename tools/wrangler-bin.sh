#!/bin/bash
# Resolve wrangler once and expose it as the shell function `wrangler_run`.
#
# Calling `npx wrangler@latest` per file re-resolves the package on every
# invocation, which turns a 95-file upload into a very long wait. This finds an
# already-installed wrangler and falls back to npx only if there isn't one.
#
# Source this, don't execute it:  source "$(dirname "$0")/wrangler-bin.sh"
# Then call:                      wrangler_run r2 object put ...

_WRANGLER_CMD=()

_resolve_wrangler() {
  # 1. A real wrangler on PATH (global install)
  if command -v wrangler >/dev/null 2>&1; then
    _WRANGLER_CMD=(wrangler)
    return
  fi

  # 2. A project-local install
  if [ -n "${ROOT:-}" ] && [ -x "$ROOT/node_modules/.bin/wrangler" ]; then
    _WRANGLER_CMD=("$ROOT/node_modules/.bin/wrangler")
    return
  fi

  # 3. Whatever npx already cached — most recently modified first
  local cached
  cached=$(find "$HOME/.npm/_npx" -type f -path "*wrangler/bin/wrangler.js" 2>/dev/null \
           | while read -r f; do echo "$(stat -f %m "$f") $f"; done \
           | sort -rn | head -1 | cut -d' ' -f2-)
  if [ -n "$cached" ] && [ -f "$cached" ]; then
    _WRANGLER_CMD=(node "$cached")
    return
  fi

  # 4. Last resort — slow, but always works
  _WRANGLER_CMD=(npx --yes wrangler@latest)
}

wrangler_run() {
  "${_WRANGLER_CMD[@]}" "$@"
}

_resolve_wrangler
