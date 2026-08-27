# arieeskinazi.com — portfolio site

Static multi-page site (plain HTML, CSS, vanilla JS). **No build step.**
Deploys automatically to Cloudflare Workers on every push to `main`.

Cloudflare deprecated Pages for new projects in favour of Workers static
assets, so this is a Worker that only serves files. `wrangler.jsonc` holds the
config and `.assetsignore` lists what stays private (tooling, docs, the dead
PHP file). Neither needs touching for normal content changes.

## How to ship a change

```bash
git add -A
git commit -m "what changed"
git push
```

That's the whole deploy. Cloudflare picks up the push and the site is live in
about 30 seconds. There is no FTP any more, and nothing needs to be dragged
into a file manager.

## Architecture — why media is split out

| What | Where it lives | Why |
|---|---|---|
| HTML, CSS, JS, thumbnails | This repo → Cloudflare Workers | Small, versioned, changes often |
| Portfolio videos, hero video, Unity game | Cloudflare R2 → `media.arieeskinazi.com` | Workers caps assets at 25MB per file; these are far bigger |

R2 object keys **deliberately mirror the old site paths** (`Ecom-videos/X.mp4`),
so the HTML still writes plain relative paths and only one constant decides
where they resolve.

**`js/main.js` has a `MEDIA_BASE` constant.** It is the single place that turns
`Ecom-videos/Foo.mp4` into a full media URL. To move the media host, change
that one line. Don't hardcode media URLs into the HTML.

Two files reference media directly rather than through `MEDIA_BASE`, because
they aren't driven by the modal JS:
- `index.html` — the hero background video
- `ArcadeGamePort.html` — the game iframe

## Adding a new portfolio video

```bash
./tools/add-video.sh ~/Desktop/NewClient_Ad.mp4
```

It compresses the master for web and uploads it to R2, then prints the exact
`data-video="..."` attribute to paste into `E-commerce_webpage-VV.html`.
The original file is never modified.

Then commit and push the HTML change as usual.

## Video compression policy

Source files are export masters at roughly 10 Mbps, which is about double what
Netflix uses for 1080p and far too heavy to serve directly. Everything is
re-encoded to **CRF 26, H.264, faststart** before upload. On the existing
library that took **4.7GB down to 1.0GB** with no visible quality loss at the
size these play back at.

The hero video is treated more aggressively (720p, CRF 30, audio stripped)
because it is a muted background loop sitting behind an overlay: 68MB → 9MB.

Masters stay in `Ecom-videos/` locally. Web copies go in `Ecom-videos-web/`.
**Both are gitignored** — they belong in R2, not in the repo.

## Bulk media re-upload

Only needed for disaster recovery or a bucket change:

```bash
./tools/upload-media.sh
```

## Gotchas

- **Don't un-gitignore the media folders.** A 25MB-per-file cap and a 1GB video
  library make that break deploys immediately.
- **`assets/` and `vendor/` are dead.** They belong to the pre-2026 template
  build and are only referenced by two orphaned pages: `meeting-details.html`
  and `E-commerce_webpage_old.html`. Neither is linked from anywhere on the
  live site. Safe to delete all four together; nothing else touches them.
- **`submit-form.php` is dead code.** There is not a single `<form>` tag on the
  site and nothing posts to it. It also cannot run on a static-asset Worker,
  and `.assetsignore` keeps it off the public site. If a contact form is ever
  wanted, add a Worker route or use a hosted form service.
- **`E-commerce_webpage.html`** is just a meta-refresh redirect to
  `E-commerce_webpage-VV.html`. The `-VV` file is the real page.

## Domain

- Registered at GoDaddy, DNS managed by Cloudflare.
- GoDaddy hosting was retired in Aug 2026; it served the site over FTP before that.
- No email on this domain — there are no MX records, so DNS changes are low-risk.
