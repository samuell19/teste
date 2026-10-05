import { createRequire } from "node:module";
import { readdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || "sharp");
const directory = path.resolve("assets/castle-sources");
const output = path.resolve("public/castle");
const files = (await readdir(directory)).filter(file => /\.(png|jpg)$/.test(file) && !file.includes("original") && (!process.argv[3] || file === process.argv[3]));
for (const file of files) {
  const destination = path.join(output, file.replace(/\.(png|jpg)$/, ".webp"));
  const input = path.join(directory, file);
  const metadata = await sharp(input).metadata();
  const hall = file === "hall.jpg";
  const pipeline = () => sharp(input)
    .modulate({ brightness: hall ? 1.075 : 1.025, saturation: 1.015 });
  await pipeline()
    .sharpen({ sigma: hall ? .75 : .45, m1: .4, m2: hall ? 1.8 : 1.1 })
    .webp({ quality: 96, effort: 6 })
    .toFile(destination);
  const scale = Math.min(2, 3000 / Math.max(metadata.width, metadata.height));
  const detail = destination.replace(".webp", "-detail.webp");
  await pipeline()
    .resize({ width: Math.round(metadata.width * scale), kernel: "lanczos3" })
    .sharpen({ sigma: hall ? 1.05 : .65, m1: .45, m2: hall ? 2 : 1.25 })
    .webp({ quality: 94, effort: 6 })
    .toFile(detail);
  console.log(`${file}: original-resolution + ${Math.round(metadata.width * scale)}px detailed export`);
}
