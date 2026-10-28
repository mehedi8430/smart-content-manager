#!/usr/bin/env bun
/**
 * Rebuilds the promo video from the storyboard (index.html).
 *
 * Pipeline:
 *   1. Renders promo/index.html frame-by-frame (deterministic `window.__render(t)`)
 *      with headless Chromium via playwright-core -> promo/frames/*.png
 *   2. Synthesizes the ambient chord-pad soundtrack -> promo/audio.wav
 *   3. Muxes frames + audio into the final MP4 -> promo/smart-content-manager-promo.mp4
 *
 * Usage:
 *   bun promo/capture.mjs              # full rebuild (~3-4 min)
 *   SMOKE=1 bun promo/capture.mjs      # renders ~16 key frames only (no encode) for visual checks
 *
 * Requirements: bun, ffmpeg on PATH with libx264 + aac, playwright-core
 * (restored by `bun install` at the repo root; falls back to bun's install cache).
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FPS = 30;
const DURATION = 40.0; // keep in sync with the scene timings in index.html
const TOTAL = FPS * DURATION;

const here = path.dirname(fileURLToPath(import.meta.url));
const FRAMES = path.join(here, "frames");
const AUDIO = path.join(here, "audio.wav");
const OUTPUT = path.join(here, "smart-content-manager-promo.mp4");
const STORYBOARD = path.join(here, "index.html");

/* ---------- toolchain resolution ---------- */

function loadChromium() {
  const require = createRequire(import.meta.url); // resolves from promo/ upward: repo node_modules
  try {
    return require("playwright-core").chromium;
  } catch {
    /* fall through */
  }
  const cache = path.join(process.env.HOME ?? "", ".bun/install/cache");
  if (existsSync(cache)) {
    for (const entry of readdirSync(cache)) {
      if (entry.startsWith("playwright-core@")) {
        return require(path.join(cache, entry, "index.js")).chromium;
      }
    }
  }
  throw new Error("playwright-core not found — run `bun install` at the repo root first.");
}

function loadFFmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch {
    throw new Error("ffmpeg not found on PATH. Install it, or grab a static build with libx264+aac from https://johnvansickle.com/ffmpeg/.");
  }
  const encoders = execSync("ffmpeg -hide_banner -encoders 2>/dev/null || true").toString();
  if (!encoders.includes("libx264") || !encoders.includes(" aac")) {
    throw new Error("ffmpeg on PATH lacks libx264/aac (e.g. Playwright's bundled build). Install a full build.");
  }
}

/* ---------- 1. frame rendering ---------- */

async function renderFrames(chromium) {
  if (!process.env.SMOKE) mkdirSync(FRAMES, { recursive: true });
  else mkdirSync(FRAMES, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(`file://${STORYBOARD}`);
  await page.evaluate(() => document.fonts.ready);

  const smokeTimes = [0.5, 2.5, 4.2, 7, 10, 13.5, 15.5, 16.8, 18.5, 21, 24, 26.5, 29.5, 31.5, 35.5, 38.5];
  const times = process.env.SMOKE
    ? smokeTimes
    : Array.from({ length: TOTAL }, (_, f) => f / FPS);

  console.log(`rendering ${times.length} frames -> ${FRAMES}`);
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    await page.evaluate((t) => window.__render(t), t);
    const name = process.env.SMOKE ? `smoke_${t.toFixed(1).replace(".", "_")}.png` : `${String(i).padStart(4, "0")}.png`;
    await page.screenshot({ path: path.join(FRAMES, name) });
    if (!process.env.SMOKE && i % 300 === 0) console.log(`  frame ${i}/${times.length}`);
  }
  await browser.close();
}

/* ---------- 2. soundtrack synthesis ---------- */

function synthesizeAudio() {
  const sr = 44100, N = Math.floor(sr * DURATION);
  const L = new Float32Array(N), R = new Float32Array(N);

  /* Fmaj7 -> Am7 -> Cmaj7 -> G, 10s each with 1.6s linear crossfades */
  const chords = [
    { t0: 0.0, t1: 10.8, freqs: [174.61, 220.0, 261.63, 329.63], sub: 87.31 },
    { t0: 9.7, t1: 20.3, freqs: [220.0, 261.63, 329.63, 392.0], sub: 110.0 },
    { t0: 19.2, t1: 29.8, freqs: [130.81, 164.81, 196.0, 246.94], sub: 65.41 },
    { t0: 28.7, t1: 40.0, freqs: [196.0, 246.94, 293.66], sub: 98.0 },
  ];
  const XF = 1.6;
  const win = (t, t0, t1) =>
    Math.min(Math.max(0, (t - t0) / XF), Math.min(1, Math.max(0, (t1 - t) / XF)));
  const blooms = [5, 12, 19.5, 27.5, 33.5]; /* gentle swell at each scene change */

  for (let n = 0; n < N; n++) {
    const t = n / sr;
    let l = 0, r = 0;
    for (const c of chords) {
      const w = win(t, c.t0, c.t1);
      if (w <= 0) continue;
      c.freqs.forEach((f, i) => {
        const det = 1 + 0.0012 * Math.sin(i * 1.7 + 0.4);
        const lfo = 1 + 0.10 * Math.sin(t * (0.07 + i * 0.013) * Math.PI * 2 + i * 2.1);
        const amp = 0.155 * (i === 3 ? 0.65 : 1);
        const v = Math.sin(2 * Math.PI * f * det * t) * amp * w * lfo;
        l += v * (1 + 0.18 * Math.sin(t * 0.11 + i));
        r += v * (1 - 0.18 * Math.sin(t * 0.11 + i));
      });
      const s = Math.sin(2 * Math.PI * c.sub * t) * 0.11 * w;
      l += s; r += s;
    }
    if (t > 5) { /* quiet shimmer after the product reveal */
      const sw = Math.min(1, (t - 5) / 6) * Math.min(1, Math.max(0, (DURATION - t) / 4));
      const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 0.4 * t);
      l += Math.sin(2 * Math.PI * 659.26 * vib * t) * 0.016 * sw;
      r += Math.sin(2 * Math.PI * 987.77 * vib * t) * 0.011 * sw;
    }
    let env = 1;
    for (const b of blooms) {
      const dt = t - b;
      if (dt > 0) env += 0.20 * Math.exp(-(dt * dt) / 0.98);
    }
    const g = Math.min(1, t / 1.6) * Math.min(1, (DURATION - t) / 2.6);
    L[n] = Math.tanh(l * env * g);
    R[n] = Math.tanh(r * env * g);
  }

  let peak = 0;
  for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
  const gain = 0.30 / peak;

  const dataSize = N * 4;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(dataSize, 40);
  for (let n = 0; n < N; n++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[n] * gain * 32767))), 44 + n * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[n] * gain * 32767))), 46 + n * 4);
  }
  Bun.write(AUDIO, buf);
  console.log(`synthesized soundtrack -> ${AUDIO}`);
}

/* ---------- 3. encode ---------- */

function encode() {
  console.log(`encoding -> ${OUTPUT}`);
  execSync(
    `ffmpeg -y -framerate ${FPS} -i ${FRAMES}/%04d.png -i ${AUDIO} ` +
      `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p ` +
      `-c:a aac -b:a 192k -shortest -movflags +faststart ${OUTPUT}`,
    { stdio: ["ignore", "ignore", "inherit"] },
  );
}

/* ---------- main ---------- */

if (process.env.SMOKE) {
  await renderFrames(loadChromium());
  console.log("smoke frames written (skipping audio/encode) — inspect promo/frames/smoke_*.png");
} else {
  loadFFmpeg();
  await renderFrames(loadChromium());
  synthesizeAudio();
  encode();
  const kb = (execSync(`stat -c %s ${OUTPUT}`).toString() / 1e6).toFixed(1);
  console.log(`done: ${OUTPUT} (${kb} MB, ${DURATION}s, ${FPS}fps)`);
}
