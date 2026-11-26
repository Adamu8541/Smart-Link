const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const logoPath = path.join(root, 'public/logo.png');
const resDir = path.join(root, 'android/app/src/main/res');

async function main() {
  if (!fs.existsSync(logoPath)) {
    throw new Error('Original logo not found: public/logo.png');
  }
  if (!fs.existsSync(resDir)) {
    throw new Error('Android resources not found. Run npx cap add android first.');
  }

  const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  const metadata = await sharp(logoPath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read original logo dimensions.');
  }

  for (const [density, size] of Object.entries(sizes)) {
    const dir = path.join(resDir, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });

    const logo = await sharp(logoPath)
      .resize(Math.round(size * 0.76), Math.round(size * 0.76), { fit: 'contain' })
      .png()
      .toBuffer();

    const iconPath = path.join(dir, 'ic_launcher.png');
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: '#ffffff',
      },
    })
      .composite([{ input: logo, gravity: 'centre' }])
      .png()
      .toFile(iconPath);

    await fs.promises.copyFile(iconPath, path.join(dir, 'ic_launcher_round.png'));
  }

  const drawableDir = path.join(resDir, 'drawable-nodpi');
  fs.mkdirSync(drawableDir, { recursive: true });

  const foreground = await sharp(logoPath)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([{ input: foreground, gravity: 'centre' }])
    .png()
    .toFile(path.join(drawableDir, 'ic_launcher_foreground.png'));

  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`;

  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);

  const valuesDir = path.join(resDir, 'values');
  fs.mkdirSync(valuesDir, { recursive: true });
  const colorsPath = path.join(valuesDir, 'colors.xml');

  let colors = fs.existsSync(colorsPath)
    ? fs.readFileSync(colorsPath, 'utf8')
    : '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n';

  const backgroundColor = '<color name="ic_launcher_background">#FFFFFF</color>';
  const colorPattern = /<color\s+name=["']ic_launcher_background["'][^>]*>[\s\S]*?<\/color>/;

  if (colorPattern.test(colors)) {
    colors = colors.replace(colorPattern, backgroundColor);
  } else {
    colors = colors.replace('</resources>', `    ${backgroundColor}\n</resources>`);
  }

  fs.writeFileSync(colorsPath, colors);

  console.log(
    `Generated Android launcher icons from public/logo.png (${metadata.width}x${metadata.height}).`
  );
}

main().catch((error) => {
  console.error('Android icon generation failed:', error);
  process.exitCode = 1;
});
