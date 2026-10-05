import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || "playwright");
const destination = path.resolve(process.argv[3] || "artifacts/verification");
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const errors = [];
const rooms = ["lounge", "library", "chapel", "dining"];

async function ready(page) {
  await page.locator(".loading-scene").waitFor({ state: "hidden" });
  await page.locator(".scene-art").waitFor();
  await page.waitForTimeout(700);
}

async function select(page, id) {
  const hash = new URL(page.url()).hash;
  const hotspot = page.locator(`[data-hotspot="${id}"]`);
  await hotspot.evaluate(element => element.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" }));
  await hotspot.click();
  if (id.startsWith("to-") || id === "exit" || id === "gift") {
    await page.waitForURL(url => url.hash !== hash);
  } else {
    await page.getByRole("dialog").waitFor();
  }
  await page.waitForTimeout(350);
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.url().includes("/castle/") && response.status() >= 400) errors.push(`Asset ${response.status()}: ${response.url()}`); });
  await page.goto("http://127.0.0.1:5174/");
  await ready(page);
  await page.screenshot({ path: path.join(destination, "01-mobile-entrance.png") });
  await page.getByRole("button", { name: "Entrar no castelo", exact: true }).last().click();
  await ready(page);
  assert.equal(await page.locator("h1").innerText(), "A sala de estar");
  await page.screenshot({ path: path.join(destination, "02-mobile-hall.png") });
  await select(page, "welcome");
  assert.equal(await page.getByRole("dialog").count(), 1);
  await page.screenshot({ path: path.join(destination, "03-mobile-letter.png") });
  await page.getByRole("button", { name: "Fechar", exact: true }).click();

  for (const room of rooms) {
    await select(page, `to-${room}`);
    await ready(page);
    await page.screenshot({ path: path.join(destination, `room-${room}-mobile.png`) });
    await select(page, "song");
    await page.getByRole("dialog").waitFor();
    assert.equal(await page.locator(".play-button").isDisabled(), false);
    if (room === "lounge") await page.screenshot({ path: path.join(destination, "04-mobile-music.png") });
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await select(page, "note");
    assert.equal(await page.locator(".handwritten-note").count(), 1);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await select(page, "photo");
    assert.equal(await page.locator(".antique-photo img").count(), 1);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page.locator('.game-header button[aria-label="Voltar à sala de estar"]').click();
    await ready(page);
  }

  assert.equal(await page.locator(".candle.lit").count(), 4);
  await page.reload();
  await ready(page);
  assert.equal(await page.locator(".candle.lit").count(), 4);
  await page.getByRole("button", { name: "Abrir diário", exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(destination, "05-mobile-journal.png") });
  assert.equal(await page.locator(".journal-entry").count(), 4);
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Ir para seu presente", exact: true }).click();
  await ready(page);
  await select(page, "present");
  await page.getByRole("button", { name: "Desembrulhar", exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(destination, "06-mobile-birthday.png") });
  assert.ok((await page.locator(".birthday-view").innerText()).includes("Fiz esse presentinho pra vc"));
  assert.ok((await page.locator(".gift-poem").innerText()).includes("enquanto houver presas em meu coração."));
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.goBack();
  await ready(page);
  assert.equal(await page.locator("h1").innerText(), "A sala de estar");

  for (const dimensions of [{ width: 320, height: 568 }, { width: 430, height: 932 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    const desktop = dimensions.width > 1000;
    await page.setViewportSize(dimensions);
    await page.goto(`http://127.0.0.1:5174/#${desktop ? "lounge" : "hall"}`);
    await ready(page);
    const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
    assert.equal(size.scroll, size.width, `Page overflow at ${dimensions.width}`);
    assert.equal(await page.locator(".scene-art").evaluate(img => img.complete && img.naturalWidth > 0), true);
    await page.screenshot({ path: path.join(destination, `viewport-${dimensions.width}x${dimensions.height}.png`) });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:5174/#library");
  await ready(page);
  await select(page, "note");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
  assert.deepEqual(errors, []);
  console.log("PASS: all rooms, music/note/photo hotspots, gift, journal, saved progress, browser back, focus trap, reduced motion and four viewport sizes.");
} finally {
  await browser.close();
}
