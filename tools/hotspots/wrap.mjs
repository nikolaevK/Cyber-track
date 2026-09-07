import sharp from "sharp";
const W = 3000, H = 520;                       // matches the nose panel's on-truck proportions (~5.8:1)
const BLUE = "#0080FF", BLUE2 = "#0087E6";     // peptideads.com --primary and --gradient-primary end stop

// White version of the real wordmark: keep the logo's alpha, paint RGB white.
const { data, info } = await sharp("brand/pepads-logo.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; }
const wordmarkW = 1500;
const wordmark = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .resize({ width: wordmarkW, kernel: "lanczos3" }).png().toBuffer();
const wmMeta = await sharp(wordmark).metadata();
const wmX = Math.round((W - wordmarkW) / 2) + 60;
const wmY = Math.round((H - wmMeta.height) / 2) - 6;

const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BLUE}"/><stop offset="1" stop-color="${BLUE2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <!-- subtle diagonal sheen like their hero gradient -->
  <rect width="${W}" height="${H}" fill="white" opacity="0.06" transform="skewX(-20)" x="1900"/>
  <!-- brand dot from the secondary lockup -->
  <circle cx="${wmX - 120}" cy="${H / 2}" r="46" fill="white"/>
  <!-- monospace markers in the peptideads.com style -->
  <g font-family="Menlo, 'Courier New', monospace" font-size="34" fill="white" letter-spacing="7">
    <text x="70" y="${H / 2 - 14}" opacity="0.95">+ GROWTH MARKETING</text>
    <text x="70" y="${H / 2 + 40}" opacity="0.7">FOR PEPTIDE BRANDS</text>
    <text x="${W - 70}" y="${H / 2 - 14}" text-anchor="end" opacity="0.95">+ EST. 2024</text>
    <text x="${W - 70}" y="${H / 2 + 40}" text-anchor="end" opacity="0.7">PEPTIDEADS.COM</text>
  </g>
</svg>`;
await sharp(Buffer.from(bg)).png()
  .composite([{ input: wordmark, left: wmX, top: wmY }])
  .toFile("brand/peptideads-wrap.png");
await sharp("brand/peptideads-wrap.png").resize({ width: 1500 }).jpeg({ quality: 90 }).toFile("brand/peptideads-wrap-preview.jpg");
console.log("wrap written", W, H, "wordmark", wmMeta.width, wmMeta.height);
