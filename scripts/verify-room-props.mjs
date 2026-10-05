import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || "playwright");
const output = path.resolve(process.argv[3] || "artifacts/verification");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const errors = [];
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.on("pageerror", error => errors.push(error.message));
  for (const [width, height] of [[320, 568], [390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const room of ["lounge", "library", "chapel", "dining"]) {
      await page.goto(`http://127.0.0.1:5174/#${room}`);
      await page.locator(".loading-scene").waitFor({ state: "hidden" });
      await page.locator(".vinny-ready").waitFor();
      const photo = page.locator('[data-hotspot="photo"]');
      const preview = photo.locator(".little-frame img");
      await preview.evaluate(img => img.decode());
      const frame = await photo.boundingBox();
      const song = await page.locator('[data-hotspot="song"]').boundingBox();
      const note = await page.locator('[data-hotspot="note"]').boundingBox();
      assert.ok(frame.x >= 0 && frame.x + frame.width <= width, `${room}: photo outside initial view at ${width}`);
      const center = box => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
      const a = center(frame);
      const distance = box => Math.hypot(a.x - center(box).x, a.y - center(box).y);
      assert.ok(Math.min(distance(song), distance(note)) < 150, `${room}: objects too far apart`);
      assert.equal(await page.locator(".footer-whisper, .hotspot-label, .room-heading .eyebrow").count(), 0);
      if (room === "dining") assert.ok((await preview.getAttribute("src")).endsWith("/photos/dracula.png"));
      await page.screenshot({ path: path.join(output, `props-${room}-${width}.png`) });
      await photo.hover();
      assert.equal(await photo.innerText(), "");
      await photo.click();
      await page.getByRole("dialog").waitFor();
      assert.equal((await page.getByRole("dialog").innerText()).includes("Algumas coisas merecem ficar guardadas"), false);
      await page.keyboard.press("Escape");
      await page.locator('[data-hotspot="note"]').click();
      await page.getByRole("dialog").waitFor();
      await page.keyboard.press("Escape");
      await page.locator('[data-hotspot="song"]').click();
      await page.getByRole("dialog").waitFor();
      assert.equal(await page.locator(".play-button").isDisabled(), false);
    }
  }
  assert.deepEqual(errors, []);
  console.log("PASS: all room photo frames visible near other objects at 320/390/1440px; Dracula preview, no hover labels/subtitles, all three objects clickable.");
} finally {
  await browser.close();
}
