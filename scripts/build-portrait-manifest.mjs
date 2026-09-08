import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Read the actual source bytes. A larger requested image size cannot restore
// detail in a small original, and replacing an asset must invalidate its cache.
const root = process.cwd();
const portraits = new Set();
async function collect(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (entry.name.endsWith(".json")) {
      const official = JSON.parse(await fs.readFile(file, "utf8"));
      for (const photo of [official.photo, official.featuredPhoto]) {
        if (photo?.startsWith("/images/")) portraits.add(photo);
      }
    }
  }
}
await collect(path.join(root, "src/data/officials"));
const manifest = {};
for (const photo of [...portraits].sort()) {
  const bytes = await fs.readFile(path.join(root, "public", photo));
  const metadata = await sharp(bytes).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Invalid portrait: ${photo}`);
  const rotated = [5, 6, 7, 8].includes(metadata.orientation);
  manifest[photo] = {
    width: rotated ? metadata.height : metadata.width,
    height: rotated ? metadata.width : metadata.height,
    revision: createHash("sha256").update(bytes).digest("hex").slice(0, 12),
  };
}
await fs.writeFile(path.join(root, "src/data/portrait-manifest.json"), `${JSON.stringify(manifest)}\n`);
console.log(`Measured and versioned ${portraits.size} source portraits.`);
