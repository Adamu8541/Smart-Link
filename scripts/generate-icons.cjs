const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const logoPath = path.join(__dirname, '../public/logo.png');
  const publicDir = path.join(__dirname, '../public');

  if (!fs.existsSync(logoPath)) {
    console.error('logo.png not found in /public!');
    process.exit(1);
  }

  const logoMeta = await sharp(logoPath).metadata();
  console.log(`Original logo dimensions: ${logoMeta.width}x${logoMeta.height}`);

  // Helper to place logo on square canvas maintaining aspect ratio
  async function createSquareIcon(size, paddingFactor = 0.88, bg = { r: 255, g: 255, b: 255, alpha: 1 }) {
    const maxDimension = Math.floor(size * paddingFactor);
    const scale = Math.min(maxDimension / logoMeta.width, maxDimension / logoMeta.height);
    const scaledW = Math.round(logoMeta.width * scale);
    const scaledH = Math.round(logoMeta.height * scale);

    const resizedLogo = await sharp(logoPath)
      .resize(scaledW, scaledH, { fit: 'contain' })
      .toBuffer();

    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: bg
      }
    })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png();
  }

  // Helper to place logo on maskable canvas (central 70% safe zone with white background)
  async function createMaskableIcon(size) {
    return createSquareIcon(size, 0.70, { r: 255, g: 255, b: 255, alpha: 1 });
  }

  // 1. favicon-16x16.png
  console.log('Generating favicon-16x16.png...');
  await (await createSquareIcon(16, 0.95)).toFile(path.join(publicDir, 'favicon-16x16.png'));

  // 2. favicon-32x32.png
  console.log('Generating favicon-32x32.png...');
  await (await createSquareIcon(32, 0.92)).toFile(path.join(publicDir, 'favicon-32x32.png'));

  // 3. favicon-48x48.png
  console.log('Generating favicon-48x48.png...');
  await (await createSquareIcon(48, 0.90)).toFile(path.join(publicDir, 'favicon-48x48.png'));

  // 4. favicon-96x96.png
  console.log('Generating favicon-96x96.png...');
  await (await createSquareIcon(96, 0.88)).toFile(path.join(publicDir, 'favicon-96x96.png'));

  // 5. apple-touch-icon.png (180x180)
  console.log('Generating apple-touch-icon.png...');
  await (await createSquareIcon(180, 0.85, { r: 255, g: 255, b: 255, alpha: 1 })).toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 6. pwa-192x192.png & icon-192.png
  console.log('Generating pwa-192x192.png and icon-192.png...');
  const icon192 = await createSquareIcon(192, 0.88);
  await icon192.toFile(path.join(publicDir, 'pwa-192x192.png'));
  await (await createSquareIcon(192, 0.88)).toFile(path.join(publicDir, 'icon-192.png'));

  // 7. pwa-512x512.png & icon-512.png
  console.log('Generating pwa-512x512.png and icon-512.png...');
  const icon512 = await createSquareIcon(512, 0.88);
  await icon512.toFile(path.join(publicDir, 'pwa-512x512.png'));
  await (await createSquareIcon(512, 0.88)).toFile(path.join(publicDir, 'icon-512.png'));

  // 8. pwa-maskable-512x512.png & icon-maskable-512.png & icon-maskable-192.png
  console.log('Generating maskable icons...');
  await (await createMaskableIcon(512)).toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await (await createMaskableIcon(512)).toFile(path.join(publicDir, 'icon-maskable-512.png'));
  await (await createMaskableIcon(192)).toFile(path.join(publicDir, 'icon-maskable-192.png'));

  // 9. favicon.png
  console.log('Generating favicon.png...');
  await (await createSquareIcon(512, 0.88)).toFile(path.join(publicDir, 'favicon.png'));

  // 10. favicon.webp
  console.log('Generating favicon.webp...');
  const webpBuffer = await (await createSquareIcon(512, 0.88)).webp().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.webp'), webpBuffer);

  // 11. favicon.ico (Convert 32x32 PNG to .ico header or direct ico buffer)
  console.log('Generating favicon.ico...');
  const ico32Buffer = await (await createSquareIcon(32, 0.92)).toBuffer();
  // Build standard ICO file header for single 32x32 PNG inside ICO
  const icoHeader = Buffer.alloc(22);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // image type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // number of images = 1
  icoHeader.writeUInt8(32, 6);   // width
  icoHeader.writeUInt8(32, 7);   // height
  icoHeader.writeUInt8(0, 8);    // color palette
  icoHeader.writeUInt8(0, 9);    // reserved
  icoHeader.writeUInt16LE(1, 10); // color planes
  icoHeader.writeUInt16LE(32, 12); // bits per pixel
  icoHeader.writeUInt32LE(ico32Buffer.length, 14); // image size
  icoHeader.writeUInt32LE(22, 18); // image offset

  const icoBuffer = Buffer.concat([icoHeader, ico32Buffer]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  // 12. Copy root level logo.png if needed
  fs.copyFileSync(logoPath, path.join(__dirname, '../logo.png'));

  console.log('✓ All favicon and PWA icons generated successfully from logo.png!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
