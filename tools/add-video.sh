#!/bin/bash
# ---------------------------------------------------------------------------
# Add one new portfolio video: compress it for web, then push it to R2.
#
# This is the everyday script. Point it at an export master anywhere on disk
# and it handles the rest. The original is never modified.
#
# Usage:
#   ./tools/add-video.sh ~/Desktop/NewClient_Ad.mp4
#   ./tools/add-video.sh ~/Desktop/raw.mp4 NewClient_Ad.mp4   # rename on the way
#
# After it finishes, reference the video in the HTML as:
#   data-video="Ecom-videos/NewClient_Ad.mp4"
# ---------------------------------------------------------------------------
set -uo pipefail

BUCKET="arieeskinazi-media"
CRF=26                     # quality: lower = better/bigger. 26 is the tuned default.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DST="$ROOT/Ecom-videos-web"

source "$(dirname "${BASH_SOURCE[0]}")/wrangler-bin.sh"

SRC="${1:-}"
if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "Usage: ./tools/add-video.sh <path-to-video> [output-name.mp4]"
  [ -n "$SRC" ] && echo "Error: file not found: $SRC"
  exit 1
fi

NAME="${2:-$(basename "$SRC")}"
NAME="${NAME%.*}.mp4"              # always land on .mp4
OUT="$DST/$NAME"
mkdir -p "$DST"

if [ -f "$OUT" ]; then
  echo "Warning: $NAME already exists locally and will be overwritten."
fi

echo "==> Compressing $(basename "$SRC")"
before=$(( $(stat -f%z "$SRC") / 1048576 ))

if ! ffmpeg -y -v error -i "$SRC" \
     -c:v libx264 -crf "$CRF" -preset slow \
     -profile:v high -pix_fmt yuv420p \
     -movflags +faststart \
     -c:a aac -b:a 128k \
     "$OUT"; then
  echo "Error: ffmpeg failed. Nothing was uploaded."
  exit 1
fi

after=$(( $(stat -f%z "$OUT") / 1048576 ))
echo "    ${before}MB -> ${after}MB"

echo "==> Uploading to R2"
if ! wrangler_run r2 object put "$BUCKET/Ecom-videos/$NAME" \
     --file="$OUT" --content-type="video/mp4" --remote; then
  echo "Error: upload failed. The compressed file is kept at:"
  echo "  $OUT"
  exit 1
fi

echo
echo "=========================================="
echo " Live at: https://media.arieeskinazi.com/Ecom-videos/$NAME"
echo
echo " Reference it in the HTML with:"
echo "   data-video=\"Ecom-videos/$NAME\""
echo "=========================================="
