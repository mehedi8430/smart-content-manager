# Promo Video

A 40-second, 1920×1080 @ 30fps product promo for Smart Content Manager — built
entirely from code. No stock footage, no screen recordings, no copyrighted audio.

**Output:** [`smart-content-manager-promo.mp4`](./smart-content-manager-promo.mp4) (also embedded on the landing page hero)

## How it's made

Every frame is drawn by a deterministic animation function (`window.__render(t)`)
inside [`index.html`](./index.html) — a storyboard that recreates the app's real UI
(dashboard, kanban drag-and-drop, AI studio streaming, copilot chat) using the
product's actual design tokens: the dark `oklch` palette from
`apps/web/src/app/globals.css` and the Geist font (bundled in [`fonts/`](./fonts)).

- [`capture.mjs`](./capture.mjs) renders the storyboard frame-by-frame with
  headless Chromium (playwright-core), synthesizes the ambient chord-pad
  soundtrack (Fmaj7 → Am7 → Cmaj7 → G, written directly as WAV PCM), and muxes
  everything into H.264 + AAC with ffmpeg.
- Motion is a pure function of time — every scene's opacity, transforms, typing
  effects, and the kanban drag sequence are computed per frame, so renders are
  perfectly reproducible.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Storyboard: all six scenes + the `__render(t)` timeline |
| `capture.mjs` | Full pipeline: render frames → synth audio → encode MP4 |
| `fonts/` | Geist Sans / Geist Mono (the app's real font) |
| `smart-content-manager-promo.mp4` | Final video |

Generated artifacts (`frames/`, `audio.wav`) are gitignored.

## Rebuilding

Requirements: **Bun**, **ffmpeg** with `libx264` + `aac` on PATH (Playwright's
bundled ffmpeg is *not* enough — it only has VP8), and **playwright-core**
(restored by `bun install` at the repo root; the script also falls back to bun's
install cache).

```bash
# quick visual check: renders ~16 key frames to promo/frames/ (no encode)
SMOKE=1 bun promo/capture.mjs

# full rebuild (~3-4 min)
bun promo/capture.mjs
```

After editing `index.html`, rerun the full build. If you change scene timings,
update `DURATION` in `capture.mjs` to match. When the video changes, re-copy it
to the web app so the landing page picks it up:

```bash
cp promo/smart-content-manager-promo.mp4 apps/web/public/promo/
```

## Timeline

| Time | Scene |
| --- | --- |
| 0–5s | Hook — content work scattered across three tools |
| 5–12s | Dashboard — KPIs count up, activity feed, campaign progress |
| 12–19.5s | Kanban — card drags *To do* → *In progress* (ghost slot, column highlight, optimistic drop) |
| 19.5–27.5s | AI Studio — brief in, ad copy streams out live from Claude |
| 27.5–33.5s | Copilot — campaign-aware chat with streaming reply |
| 33.5–40s | End card — logo, tagline, stack badges |

## Landing page embed

The hero's dashboard preview section (`apps/web/src/app/_landing/hero.tsx`)
replaced its static placeholder with:

```tsx
<video src="/promo/smart-content-manager-promo.mp4" autoPlay loop muted playsInline />
```

The MP4 is served from `apps/web/public/promo/`. Muted autoplay + `playsInline`
keeps it looping inline on every browser, including iOS Safari.
