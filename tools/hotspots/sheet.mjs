import sharp from "sharp";
// usage: node sheet.mjs out.jpg cols img1 img2 ...
const [out, colsS, ...files] = process.argv.slice(2);
const cols = Number(colsS), tw = 1000, th = Math.round(tw * 1536 / 2752);
const tiles = await Promise.all(files.map((f) => sharp(f).resize(tw, th).jpeg({ quality: 82 }).toBuffer()));
const rows = Math.ceil(tiles.length / cols);
await sharp({ create: { width: tw * cols, height: th * rows, channels: 3, background: "#ffffff" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % cols) * tw, top: Math.floor(i / cols) * th })))
  .jpeg({ quality: 82 }).toFile(out);
console.log("sheet", out, tiles.length, "tiles");
