import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || "playwright");
const destination = path.resolve(process.argv[3] || "artifacts/verification");
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const errors = [];

async function ready(page) {
  await page.locator(".loading-scene").waitFor({ state: "hidden" });
  await page.locator(".vinny-ready").waitFor();
  await page.waitForTimeout(1100);
}

async function floor(page, fraction) {
  const rectangle = await page.locator(".scene-canvas").boundingBox();
  await page.touchscreen.tap(rectangle.x + rectangle.width * fraction, rectangle.height * .852);
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:5174/#hall");
  await ready(page);
  assert.ok(await page.locator(".scene-art").evaluate(img => img.currentSrc.includes("hall-detail.webp")));
  const alphaPixels = await page.locator(".vinny canvas").evaluate(canvas => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) count++;
    return count;
  });
  assert.ok(alphaPixels > 2000 && alphaPixels < 35000, "Sprite should be visible with transparent margins");
  const pet = page.locator(".vinny");
  const first = await pet.getAttribute("data-sprite-cell");
  await page.waitForTimeout(350);
  assert.notEqual(await pet.getAttribute("data-sprite-cell"), first, "Idle animation should change frames");

  await floor(page, .72);
  await page.waitForFunction(() => document.querySelector(".vinny").dataset.spriteCell.startsWith("1:"));
  await page.waitForFunction(() => document.querySelector(".vinny").dataset.animation === "idle");
  const right = await pet.evaluate(element => new DOMMatrix(element.style.transform).m41);
  await floor(page, .27);
  await page.waitForFunction(() => document.querySelector(".vinny").dataset.spriteCell.startsWith("2:"));
  await page.waitForFunction(() => document.querySelector(".vinny").dataset.animation === "idle");
  assert.ok(await pet.evaluate(element => new DOMMatrix(element.style.transform).m41) < right);
  await pet.click();
  await page.waitForFunction(() => document.querySelector(".vinny").dataset.spriteCell.startsWith("3:"));
  await page.screenshot({ path: path.join(destination, "vinny-hall-hidpi.png") });

  // A newer destination cancels the earlier object's action.
  await page.locator('[data-hotspot="welcome"]').click();
  await floor(page, .66);
  await page.waitForTimeout(1800);
  assert.equal(await page.getByRole("dialog").count(), 0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await ready(page);
  assert.equal(await pet.getAttribute("data-sprite-cell"), "0:0");
  await page.locator('[data-hotspot="welcome"]').click();
  await page.getByRole("dialog").waitFor({ timeout: 1000 });
  await page.keyboard.press("Escape");

  const missing = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await missing.route("**/pet/vinny.webp", route => route.abort());
  await missing.goto("http://127.0.0.1:5174/#hall");
  await missing.locator(".loading-scene").waitFor({ state: "hidden" });
  await missing.waitForTimeout(800);
  await missing.locator('[data-hotspot="welcome"]').click();
  await missing.getByRole("dialog").waitFor({ timeout: 2000 });

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  desktop.on("pageerror", error => errors.push(error.message));
  await desktop.goto("http://127.0.0.1:5174/#lounge");
  await ready(desktop);
  const desktopPet = await desktop.locator(".vinny").boundingBox();
  await desktop.mouse.move(desktopPet.x + 190, desktopPet.y + 40);
  await desktop.waitForFunction(() => /^(9|10):/.test(document.querySelector(".vinny").dataset.spriteCell));
  await desktop.screenshot({ path: path.join(destination, "vinny-desktop.png") });
  assert.deepEqual(errors, []);
  console.log("PASS: high-DPI backgrounds, transparent sprite, idle/walk/wave animation, destination cancellation, reduced motion and missing-sprite navigation fallback.");
} finally {
  await browser.close();
}
