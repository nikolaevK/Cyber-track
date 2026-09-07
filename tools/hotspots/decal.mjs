import sharp from "sharp";
// White version of the real wordmark, transparent background, generous padding.
const { data, info } = await sharp("brand/pepads-logo.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; }
const wm = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .resize({ width: 1600, kernel: "lanczos3" }).png().toBuffer();
const m = await sharp(wm).metadata();
// Site overlay asset: transparent PNG, tight.
await sharp(wm).toFile("brand/peptideads-wordmark-white.png");
// AI reference sheet: white wordmark centred on charcoal, nothing else.
const W = 3000, H = 520;
await sharp({ create: { width: W, height: H, channels: 4, background: "#2b2b2b" } })
  .composite([{ input: wm, left: Math.round((W - m.width) / 2), top: Math.round((H - m.height) / 2) }])
  .png().toFile("brand/peptideads-decal-ref.png");
console.log("wordmark", m.width, m.height);
