const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_ICON = path.resolve('assets/icon.png');
const ANDROID_RES = path.resolve('android/app/src/main/res');
const PUBLIC_DIR = path.resolve('public');
const PUBLIC_ICONS_DIR = path.resolve('public/icons');

// Color Palette for Display Modes
const LIGHT_BG = { r: 250, g: 249, b: 246, alpha: 1 }; // #FAF9F6 (Evenly warm surface)
const LIGHT_BG_HEX = '#FAF9F6';
const DARK_BG_HEX = '#141316'; // Evenly dark surface

// Densities configuration for Android
const ANDROID_DENSITIES = [
  { folder: 'mipmap-ldpi', adaptiveSize: 81, legacySize: 36 },
  { folder: 'mipmap-mdpi', adaptiveSize: 108, legacySize: 48 },
  { folder: 'mipmap-hdpi', adaptiveSize: 162, legacySize: 72 },
  { folder: 'mipmap-xhdpi', adaptiveSize: 216, legacySize: 96 },
  { folder: 'mipmap-xxhdpi', adaptiveSize: 324, legacySize: 144 },
  { folder: 'mipmap-xxxhdpi', adaptiveSize: 432, legacySize: 192 },
];

// Web icon sizes
const WEB_SIZES = [48, 72, 96, 128, 192, 256, 512];

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerLength = 6;
  const dirEntryLength = 16;
  let offset = headerLength + count * dirEntryLength;

  const header = Buffer.alloc(headerLength);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(dirEntryLength);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    offset += buffer.length;
    dirEntries.push(entry);
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
}

/**
 * Extracts the foreground logo artwork by flood-filling the outer connected background
 * (so any white details inside the logo are preserved, while the outer background is made transparent).
 */
async function extractLogoWithTransparency(sourcePath) {
  const { data, info } = await sharp(sourcePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const isOuterBg = new Uint8Array(w * h);
  const queue = [];

  function checkAndEnqueue(p) {
    const idx = p * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    // Threshold for off-white background
    if (r >= 244 && g >= 244 && b >= 244) {
      if (!isOuterBg[p]) {
        isOuterBg[p] = 1;
        queue.push(p);
      }
    }
  }

  // Enqueue 4 perimeter borders
  for (let x = 0; x < w; x++) {
    checkAndEnqueue(x);
    checkAndEnqueue((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    checkAndEnqueue(y * w);
    checkAndEnqueue(y * w + (w - 1));
  }

  let head = 0;
  while (head < queue.length) {
    const p = queue[head++];
    const px = p % w;
    const py = Math.floor(p / w);

    if (px > 0) checkAndEnqueue(p - 1);
    if (px < w - 1) checkAndEnqueue(p + 1);
    if (py > 0) checkAndEnqueue(p - w);
    if (py < h - 1) checkAndEnqueue(p + w);
  }

  const outData = Buffer.from(data);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    if (isOuterBg[i]) {
      outData[idx + 3] = 0; // transparent
    } else {
      // Smooth edge antialiasing for boundary pixels touching outer background
      const px = i % w;
      const py = Math.floor(i / w);
      let touchesBg = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            if (isOuterBg[ny * w + nx]) {
              touchesBg = true;
              break;
            }
          }
        }
        if (touchesBg) break;
      }
      if (touchesBg) {
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Anti-alias alpha smoothly based on edge luminance
        outData[idx + 3] = Math.min(255, Math.max(0, Math.round((1 - lum) * 255 * 1.5)));
      }
    }
  }

  const transparentImg = await sharp(outData, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png()
    .toBuffer();

  return transparentImg;
}

async function main() {
  console.log('Reading source icon:', SOURCE_ICON);
  if (!fs.existsSync(SOURCE_ICON)) {
    throw new Error(`Source icon not found at ${SOURCE_ICON}`);
  }

  // 1. Extract trimmed transparent logo mark
  const trimmedLogoBuffer = await extractLogoWithTransparency(SOURCE_ICON);
  const trimmedMeta = await sharp(trimmedLogoBuffer).metadata();
  console.log(`Trimmed logo artwork: ${trimmedMeta.width}x${trimmedMeta.height}`);

  // 2. Prepare monochrome version (pure white #FFFFFF preserving alpha) for Material You
  const { data: alphaData, info: alphaInfo } = await sharp(trimmedLogoBuffer)
    .extractChannel(3)
    .toBuffer({ resolveWithObject: true });

  const whiteBase = await sharp({
    create: {
      width: alphaInfo.width,
      height: alphaInfo.height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();

  const monochromeTrimmed = await sharp(whiteBase).joinChannel(alphaData).png().toBuffer();
  console.log('Monochrome logo mark created for Material Theme.');

  // Helper to place graphic into adaptive canvas with safe zone scaling
  // Safe zone for circular/squircle mask is central 62% of 108dp canvas
  async function renderAdaptiveLayer(graphicBuffer, canvasSize, withContrastHalo = false) {
    const maxDim = Math.round(canvasSize * 0.62);
    let resized = await sharp(graphicBuffer)
      .resize({
        width: maxDim,
        height: maxDim,
        fit: 'inside',
      })
      .png()
      .toBuffer();

    // In dark display mode, a subtle soft white outline provides crisp separation for dark navy parts
    if (withContrastHalo) {
      const haloAlpha = await sharp(resized).extractChannel(3).toBuffer();
      const haloWhite = await sharp({
        create: {
          width: (await sharp(resized).metadata()).width,
          height: (await sharp(resized).metadata()).height,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const whiteMask = await sharp(haloWhite).joinChannel(haloAlpha).png().toBuffer();
      // Dilate / blur slightly to form subtle halo
      const blurredHalo = await sharp(whiteMask)
        .blur(1.2)
        .linear(1, 0)
        .png()
        .toBuffer();

      resized = await sharp(blurredHalo)
        .composite([{ input: resized, blend: 'over' }])
        .png()
        .toBuffer();
    }

    const resizedMeta = await sharp(resized).metadata();
    const left = Math.round((canvasSize - resizedMeta.width) / 2);
    const top = Math.round((canvasSize - resizedMeta.height) / 2);

    return await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resized, left, top }])
      .png()
      .toBuffer();
  }

  // Helper to render legacy squircle icon
  async function renderLegacyIcon(canvasSize, isRound = false) {
    const maxDim = Math.round(canvasSize * (isRound ? 0.64 : 0.68));
    const resized = await sharp(trimmedLogoBuffer)
      .resize({
        width: maxDim,
        height: maxDim,
        fit: 'inside',
      })
      .png()
      .toBuffer();

    const resizedMeta = await sharp(resized).metadata();
    const left = Math.round((canvasSize - resizedMeta.width) / 2);
    const top = Math.round((canvasSize - resizedMeta.height) / 2);

    const cornerRadius = isRound ? Math.round(canvasSize / 2) : Math.round(canvasSize * 0.22);
    const maskSvg = `<svg width="${canvasSize}" height="${canvasSize}">
      <rect x="0" y="0" width="${canvasSize}" height="${canvasSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#ffffff"/>
    </svg>`;

    const bgWithLogo = await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: LIGHT_BG,
      },
    })
      .composite([{ input: resized, left, top }])
      .png()
      .toBuffer();

    // Clip with rounded / circular mask for smooth antialiasing
    return await sharp(bgWithLogo)
      .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
      .png()
      .toBuffer();
  }

  // Helper to render adaptive background image
  async function renderAdaptiveBg(canvasSize) {
    return await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: LIGHT_BG,
      },
    })
      .png()
      .toBuffer();
  }

  // 3. Generate Android Mipmap densities
  console.log('Generating Android Mipmap densities...');
  for (const density of ANDROID_DENSITIES) {
    const dir = path.join(ANDROID_RES, density.folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // A. Adaptive Foreground (with subtle halo for dark mode display contrast)
    const fg = await renderAdaptiveLayer(trimmedLogoBuffer, density.adaptiveSize, true);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fg);

    // B. Adaptive Monochrome (Material You Themed Icons - pure white mask)
    const mono = await renderAdaptiveLayer(monochromeTrimmed, density.adaptiveSize, false);
    fs.writeFileSync(path.join(dir, 'ic_launcher_monochrome.png'), mono);

    // C. Adaptive Background (Raster fallback)
    const bg = await renderAdaptiveBg(density.adaptiveSize);
    fs.writeFileSync(path.join(dir, 'ic_launcher_background.png'), bg);

    // D. Legacy square/squircle
    const legacy = await renderLegacyIcon(density.legacySize, false);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), legacy);

    // E. Legacy round
    const legacyRound = await renderLegacyIcon(density.legacySize, true);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), legacyRound);

    console.log(`  ✓ Generated ${density.folder} (adaptive: ${density.adaptiveSize}px, legacy: ${density.legacySize}px)`);
  }

  // 4. Update Adaptive Icon XMLs with Monochrome (Material You) and Background Color
  const anydpiDir = path.join(ANDROID_RES, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) {
    fs.mkdirSync(anydpiDir, { recursive: true });
  }

  const adaptiveXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`;

  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXmlContent, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXmlContent, 'utf8');
  console.log('  ✓ Updated mipmap-anydpi-v26 XMLs with Material You <monochrome> layer.');

  // 5. Setup Display Mode Color resources (Light and Dark Mode Launcher Backgrounds)
  const valuesDir = path.join(ANDROID_RES, 'values');
  const valuesNightDir = path.join(ANDROID_RES, 'values-night');
  if (!fs.existsSync(valuesNightDir)) {
    fs.mkdirSync(valuesNightDir, { recursive: true });
  }

  const lightColorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${LIGHT_BG_HEX}</color>
</resources>
`;
  const darkColorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${DARK_BG_HEX}</color>
</resources>
`;

  fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), lightColorXml, 'utf8');
  fs.writeFileSync(path.join(valuesNightDir, 'ic_launcher_background.xml'), darkColorXml, 'utf8');
  console.log('  ✓ Configured display modes: Light (#FAF9F6) and Dark (#141316) in values/ and values-night/.');

  // 6. Play Store Icon (512x512)
  const playStoreIcon = await renderLegacyIcon(512, false);
  fs.writeFileSync(path.join(ANDROID_RES, '../ic_launcher-web.png'), playStoreIcon);
  fs.writeFileSync(path.resolve('assets/play-store-icon.png'), playStoreIcon);
  console.log('  ✓ Generated 512x512 Play Store icon (ic_launcher-web.png).');

  // 7. Web & PWA Icons (public/icons/)
  if (!fs.existsSync(PUBLIC_ICONS_DIR)) {
    fs.mkdirSync(PUBLIC_ICONS_DIR, { recursive: true });
  }

  for (const size of WEB_SIZES) {
    const webpBuf = await renderLegacyIcon(size, false);
    // Convert to webp
    const webpOut = await sharp(webpBuf).webp({ quality: 95 }).toBuffer();
    fs.writeFileSync(path.join(PUBLIC_ICONS_DIR, `icon-${size}.webp`), webpOut);

    // Also output png for key sizes
    if ([192, 512].includes(size)) {
      fs.writeFileSync(path.join(PUBLIC_ICONS_DIR, `icon-${size}.png`), webpBuf);
    }
  }

  // Apple touch icon (180x180)
  const appleTouchIcon = await renderLegacyIcon(180, false);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), appleTouchIcon);
  console.log('  ✓ Generated Web/PWA icons in public/icons/ (48, 72, 96, 128, 192, 256, 512 webp & png).');

  // 8. Favicon ICO (16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const icoPngBuffers = [];
  for (const s of icoSizes) {
    const buf = await renderLegacyIcon(s, false);
    icoPngBuffers.push({ width: s, height: s, buffer: buf });
  }
  const icoBuffer = createIco(icoPngBuffers);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('  ✓ Generated multi-resolution favicon.ico (16, 32, 48px).');

  // 9. Adaptive SVG Favicon (public/favicon.svg)
  // Embed the high-resolution logo as base64 with CSS media query for light and dark display modes
  const logo512Buf = await sharp(trimmedLogoBuffer)
    .resize({ width: 360, height: 360, fit: 'inside' })
    .png()
    .toBuffer();
  const base64Logo = logo512Buf.toString('base64');

  const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <style>
      .bg { fill: #FAF9F6; rx: 112px; }
      @media (prefers-color-scheme: dark) {
        .bg { fill: #141316; }
      }
    </style>
  </defs>
  <rect class="bg" width="512" height="512" rx="112" />
  <image href="data:image/png;base64,${base64Logo}" x="76" y="76" width="360" height="360" />
</svg>
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), svgFavicon, 'utf8');
  console.log('  ✓ Generated adaptive SVG favicon with light/dark display mode media queries.');

  console.log('\nAll app icons successfully generated!');
}

main().catch((err) => {
  console.error('Fatal error generating icons:', err);
  process.exit(1);
});
