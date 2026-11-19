const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_ICON = path.resolve('assets/icon.png');
const ANDROID_RES = path.resolve('android/app/src/main/res');
const ANDROID_MAIN = path.resolve('android/app/src/main');
const PUBLIC_DIR = path.resolve('public');
const PUBLIC_ICONS_DIR = path.resolve('public/icons');

// Consistent Solid White Background (#FFFFFF) for everything (no theme switching)
const APP_BG = { r: 255, g: 255, b: 255, alpha: 1 };
const APP_BG_HEX = '#FFFFFF';

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

  // 2. Prepare monochrome version (pure white #FFFFFF silhouette with alpha) for Material You
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

  // Helper to place graphic into adaptive canvas with safe zone scaling (61% safe circle)
  async function renderAdaptiveLayer(graphicBuffer, canvasSize) {
    const maxDim = Math.round(canvasSize * 0.61);
    const resized = await sharp(graphicBuffer)
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
        background: APP_BG,
      },
    })
      .composite([{ input: resized, left, top }])
      .png()
      .toBuffer();

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
        background: APP_BG,
      },
    })
      .png()
      .toBuffer();
  }

  // 3. Generate Android Mipmap densities (PNG only to avoid AAPT duplicate resource errors)
  console.log('Generating Android Mipmap densities (PNG)...');
  for (const density of ANDROID_DENSITIES) {
    const dir = path.join(ANDROID_RES, density.folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Clean up any stale webp files that cause AAPT duplicate resource errors
    const existingFiles = fs.readdirSync(dir);
    for (const f of existingFiles) {
      if (f.endsWith('.webp')) {
        fs.unlinkSync(path.join(dir, f));
      }
    }

    // A. Adaptive Foreground
    const fgPng = await renderAdaptiveLayer(trimmedLogoBuffer, density.adaptiveSize);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgPng);

    // B. Adaptive Monochrome (Material You Themed Icons)
    const monoPng = await renderAdaptiveLayer(monochromeTrimmed, density.adaptiveSize);
    fs.writeFileSync(path.join(dir, 'ic_launcher_monochrome.png'), monoPng);

    // C. Adaptive Background (Solid White #FFFFFF)
    const bgPng = await renderAdaptiveBg(density.adaptiveSize);
    fs.writeFileSync(path.join(dir, 'ic_launcher_background.png'), bgPng);

    // D. Legacy square/squircle
    const legacyPng = await renderLegacyIcon(density.legacySize, false);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), legacyPng);

    // E. Legacy round
    const legacyRoundPng = await renderLegacyIcon(density.legacySize, true);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), legacyRoundPng);

    console.log(`  ✓ Generated ${density.folder} (adaptive: ${density.adaptiveSize}px, legacy: ${density.legacySize}px)`);
  }

  // 4. Update Adaptive Icon XMLs with Monochrome (Material You) and Background Color
  const anydpiDir = path.join(ANDROID_RES, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) {
    fs.mkdirSync(anydpiDir, { recursive: true });
  }

  const adaptiveXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`;

  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXmlContent, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXmlContent, 'utf8');
  console.log('  ✓ Updated mipmap-anydpi-v26 XMLs with Material You <monochrome> layer.');

  // 5. Update Background Color and Vector Drawables (Consistent White #FFFFFF for both modes)
  const valuesDir = path.join(ANDROID_RES, 'values');
  const valuesNightDir = path.join(ANDROID_RES, 'values-night');

  const colorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${APP_BG_HEX}</color>
</resources>
`;
  fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), colorXml, 'utf8');

  // Remove values-night color override so Android never switches the background to dark in dark mode
  if (fs.existsSync(valuesNightDir)) {
    const nightBgFile = path.join(valuesNightDir, 'ic_launcher_background.xml');
    if (fs.existsSync(nightBgFile)) {
      fs.unlinkSync(nightBgFile);
    }
    // If values-night is empty, remove the folder
    try {
      const remaining = fs.readdirSync(valuesNightDir);
      if (remaining.length === 0) {
        fs.rmdirSync(valuesNightDir);
      }
    } catch {
      // ignore
    }
  }

  // Update res/drawable/ic_launcher_background.xml to solid white vector (removes green grid)
  const drawableDir = path.join(ANDROID_RES, 'drawable');
  if (fs.existsSync(drawableDir)) {
    const vectorBg = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="${APP_BG_HEX}"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
`;
    fs.writeFileSync(path.join(drawableDir, 'ic_launcher_background.xml'), vectorBg, 'utf8');
  }
  console.log('  ✓ Configured consistent #FFFFFF background for all display modes.');

  // 6. Play Store & App Logo Icon (512x512)
  const playStoreIcon = await renderLegacyIcon(512, false);
  fs.writeFileSync(path.join(ANDROID_MAIN, 'ic_launcher-web.png'), playStoreIcon);
  fs.writeFileSync(path.join(ANDROID_MAIN, 'ic_launcher-playstore.png'), playStoreIcon);
  fs.writeFileSync(path.resolve('assets/play-store-icon.png'), playStoreIcon);
  fs.writeFileSync(path.resolve('assets/logo.png'), playStoreIcon);
  fs.writeFileSync(path.resolve('public/logo.png'), playStoreIcon);
  console.log('  ✓ Generated 512x512 Play Store and Logo icons (assets/logo.png, public/logo.png).');

  // 7. Web & PWA Icons (public/icons/)
  if (!fs.existsSync(PUBLIC_ICONS_DIR)) {
    fs.mkdirSync(PUBLIC_ICONS_DIR, { recursive: true });
  }

  for (const size of WEB_SIZES) {
    const pngBuf = await renderLegacyIcon(size, false);
    const webpOut = await sharp(pngBuf).webp({ quality: 95 }).toBuffer();
    fs.writeFileSync(path.join(PUBLIC_ICONS_DIR, `icon-${size}.webp`), webpOut);

    if ([192, 512].includes(size)) {
      fs.writeFileSync(path.join(PUBLIC_ICONS_DIR, `icon-${size}.png`), pngBuf);
    }
  }

  // Apple touch icon (180x180)
  const appleTouchIcon = await renderLegacyIcon(180, false);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), appleTouchIcon);
  console.log('  ✓ Generated Web/PWA icons in public/icons/ (48 to 512px).');

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

  // 9. Consistent SVG Favicon (public/favicon.svg) - Solid #FFFFFF in all modes (no theme switching)
  const logo512Buf = await sharp(trimmedLogoBuffer)
    .resize({ width: 360, height: 360, fit: 'inside' })
    .png()
    .toBuffer();
  const base64Logo = logo512Buf.toString('base64');

  const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect fill="${APP_BG_HEX}" width="512" height="512" rx="112" />
  <image href="data:image/png;base64,${base64Logo}" x="76" y="76" width="360" height="360" />
</svg>
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), svgFavicon, 'utf8');
  console.log('  ✓ Generated consistent SVG favicon with #FFFFFF background.');

  console.log('\nAll app icons successfully generated!');
}

main().catch((err) => {
  console.error('Fatal error generating icons:', err);
  process.exit(1);
});
