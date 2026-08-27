#!/bin/bash
# ---------------------------------------------------------------------------
# Upload the full media library to Cloudflare R2.
#
# This is the ONE-TIME bulk upload. For adding a single new video later,
# use tools/add-video.sh instead.
#
# R2 keys deliberately mirror the original site paths ("Ecom-videos/X.mp4"),
# so the HTML keeps using the same relative paths it always has and only
# MEDIA_BASE in js/main.js decides where they resolve.
#
# Usage:  ./tools/upload-media.sh
# ---------------------------------------------------------------------------
set -uo pipefail

BUCKET="arieeskinazi-media"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_VIDEOS="$ROOT/Ecom-videos-web"
ORIG_VIDEOS="$ROOT/Ecom-videos"
GAMES="$ROOT/Games"

source "$(dirname "${BASH_SOURCE[0]}")/wrangler-bin.sh"

ok=0
fail=0
failed_files=()

# Pick the right Content-Type. Unity WebGL in particular breaks without
# application/wasm on the .wasm file.
content_type() {
  case "${1##*.}" in
    mp4)  echo "video/mp4" ;;
    png)  echo "image/png" ;;
    jpg|jpeg) echo "image/jpeg" ;;
    ico)  echo "image/x-icon" ;;
    html) echo "text/html" ;;
    css)  echo "text/css" ;;
    js)   echo "application/javascript" ;;
    wasm) echo "application/wasm" ;;
    json) echo "application/json" ;;
    *)    echo "application/octet-stream" ;;
  esac
}

put() {
  local file="$1" key="$2"
  local ct; ct="$(content_type "$file")"
  local size; size=$(( $(stat -f%z "$file") / 1048576 ))

  printf "  %-52s %4sMB ... " "$key" "$size"

  local err
  if err=$(wrangler_run r2 object put "$BUCKET/$key" \
             --file="$file" --content-type="$ct" --remote 2>&1); then
    echo "ok"
    ok=$((ok+1))
  else
    echo "FAILED"
    echo "$err" | tail -3 | sed 's/^/      /'
    fail=$((fail+1))
    failed_files+=("$key")
  fi
}

echo "==> Uploading compressed videos"
for f in "$WEB_VIDEOS"/*.mp4; do
  [ -e "$f" ] || continue
  put "$f" "Ecom-videos/$(basename "$f")"
done

echo "==> Uploading static images (served from the same folder)"
for f in "$ORIG_VIDEOS"/*.png; do
  [ -e "$f" ] || continue
  put "$f" "Ecom-videos/$(basename "$f")"
done

echo "==> Uploading homepage hero video"
HERO="$ROOT/Images/Default-Images/CameraVideo-web.mp4"
[ -f "$HERO" ] && put "$HERO" "Images/Default-Images/CameraVideo.mp4"

echo "==> Uploading Arcade game build"
if [ -d "$GAMES" ]; then
  while IFS= read -r f; do
    put "$f" "${f#$ROOT/}"
  done < <(find "$GAMES" -type f ! -name '.DS_Store')
fi

echo
echo "=========================================="
echo " Uploaded: $ok    Failed: $fail"
if [ "$fail" -gt 0 ]; then
  echo " Failed files:"
  printf '   %s\n' "${failed_files[@]}"
  exit 1
fi
echo " All media live at https://media.arieeskinazi.com/"
echo "=========================================="
