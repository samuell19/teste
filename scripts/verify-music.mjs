import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || "playwright");
const output = path.resolve(process.argv[3] || "artifacts/verification");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge", args: ["--mute-audio"] });
const tracks = {
  lounge: { file: "saint-vice-kill.m4a", title: "KILL" },
  library: { file: "porch-light-oxygen.m4a", title: "Oxygen" },
  chapel: { file: "alcest-ecailles-de-lune-pt-1.m4a", title: "Écailles de lune, Pt. 1" },
  dining: { file: "sleep-token-hypnosis.m4a", title: "Hypnosis" },
};
const errors = [];

async function ready(page) {
  await page.locator(".loading-scene").waitFor({ state: "hidden" });
  await page.waitForTimeout(200);
}

async function openPlayer(page) {
  await page.getByRole("button", { name: "Escolher música", exact: true }).click();
  await page.getByRole("dialog").waitFor();
}

async function waitPlaying(page, file) {
  await page.waitForFunction(filename => {
    const audio = window.__testAudio.at(-1);
    return audio && audio.src.endsWith(filename) && !audio.paused && audio.currentTime > .1 && audio.duration > 1;
  }, file, { timeout: 15000 });
  assert.equal(await page.locator(".audio-error").count(), 0);
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.__testAudio = [];
    const Original = window.Audio;
    window.Audio = class extends Original {
      constructor(...args) { super(...args); window.__testAudio.push(this); }
    };
  });
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.url().includes("/music/") && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("http://127.0.0.1:5174/#hall");
  await ready(page);
  await openPlayer(page);
  assert.equal(await page.locator(".empty-music").count(), 1);
  await page.keyboard.press("Escape");

  await page.goto("http://127.0.0.1:5174/#lounge");
  await ready(page);
  await page.locator('[data-hotspot="song"]').click();
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.locator("#music-selection option:disabled").count(), 3);
  await page.getByRole("button", { name: "Ouvir música", exact: true }).click();
  await waitPlaying(page, tracks.lounge.file);
  await page.keyboard.press("Escape");
  await page.locator('.game-header button[aria-label="Voltar à sala de estar"]').click();
  await page.waitForURL("**/#hall");
  await ready(page);
  await waitPlaying(page, tracks.lounge.file);
  await page.goBack();
  await page.waitForURL("**/#lounge");
  await ready(page);
  await waitPlaying(page, tracks.lounge.file);

  // Unlock the remaining tracks by finding their room objects, not via the player.
  for (const room of ["library", "chapel", "dining"]) {
    await page.locator('.game-header button[aria-label="Voltar à sala de estar"]').click();
    await page.waitForURL("**/#hall");
    await ready(page);
    const route = page.locator(`[data-hotspot="to-${room}"]`);
    await route.scrollIntoViewIfNeeded();
    await route.click();
    await page.waitForURL(`**/#${room}`);
    await ready(page);
    await page.locator('[data-hotspot="song"]').click();
    await page.getByRole("dialog").waitFor();
    assert.equal(await page.locator(".song-view h2").innerText(), tracks[room].title);
    await page.keyboard.press("Escape");
  }
  await openPlayer(page);
  const select = page.getByRole("dialog").getByLabel("Escolher música", { exact: true });
  assert.equal(await select.locator("option:disabled").count(), 0);
  assert.equal(await page.locator(".song-view .eyebrow, .song-dedication").count(), 0);
  for (const [room, track] of Object.entries(tracks)) {
    await select.selectOption(room);
    // Selecting the already displayed track does not fire a change event.
    if (await page.getByRole("button", { name: "Ouvir música", exact: true }).count()) {
      await page.getByRole("button", { name: "Ouvir música", exact: true }).click();
    }
    await waitPlaying(page, track.file);
    console.log(`${track.title}: ${(await page.evaluate(() => window.__testAudio.at(-1).duration)).toFixed(1)}s decoded`);
  }

  await page.getByRole("button", { name: "Pausar música", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__testAudio.at(-1).paused), true);
  await page.getByRole("button", { name: "Ouvir música", exact: true }).click();
  await waitPlaying(page, tracks.dining.file);
  await page.getByRole("button", { name: "Música anterior", exact: true }).click();
  await waitPlaying(page, tracks.chapel.file);
  await page.getByRole("button", { name: "Próxima música", exact: true }).click();
  await waitPlaying(page, tracks.dining.file);
  await page.getByLabel("Posição da música").fill("30");
  await page.waitForFunction(() => window.__testAudio.at(-1).currentTime >= 29);
  await page.screenshot({ path: path.join(output, "music-player-mobile.png") });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Desligar som", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__testAudio.at(-1).muted), true);
  await page.getByRole("button", { name: "Ligar som", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__testAudio.at(-1).muted), false);
  await openPlayer(page);
  await select.selectOption("lounge");
  await select.selectOption("chapel");
  await select.selectOption("library");
  await waitPlaying(page, tracks.library.file);
  assert.equal(await page.evaluate(() => window.__testAudio.filter(audio => !audio.paused && audio.src).length), 1);

  await page.setViewportSize({ width: 320, height: 568 });
  assert.equal(await page.getByRole("dialog").evaluate(el => el.scrollWidth > el.clientWidth), false);
  const bounds = await page.locator(".header-left, .header-tools").evaluateAll(items => items.map(el => el.getBoundingClientRect().toJSON()));
  assert.ok(bounds[0].right <= bounds[1].left, "Header controls should not overlap the brand");
  await select.focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
  await page.screenshot({ path: path.join(output, "music-player-small.png") });
  assert.deepEqual(errors, []);
  console.log("PASS: four decoded audio files, discovery unlocks, track selection, play/pause, next/previous, seeking, mute, rapid switching, single-player playback and navigation persistence.");
} finally {
  await browser.close();
}
