#!/usr/bin/env node
/**
 * Builds Bankbook's favicon, app icons, and social cards from the SVG masters
 * in this folder and the two fixed-size OG layouts.
 *
 * Usage: node assets/brand/build-assets.js
 * Requires Google Chrome (or Edge) for rasterization.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const iconsDir = path.join(root, 'assets', 'icons');
const tmpDir = path.join(os.tmpdir(), 'bankbook-brand-build');
const fontCache = path.join(tmpDir, 'fonts');
const chrome = findChrome();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(fontCache, { recursive: true });

let pageCounter = 0;

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  const found = candidates.find(candidate => fs.existsSync(candidate));
  if (!found) throw new Error('Chrome/Edge not found. Set CHROME_PATH to a Chromium browser.');
  return found;
}

function readSvg(name) {
  return fs.readFileSync(path.join(__dirname, name), 'utf8');
}

function pngSize(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} is not a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function renderPage(html, width, height, output) {
  const page = path.join(tmpDir, `page-${++pageCounter}.html`);
  fs.writeFileSync(page, html, 'utf8');
  const url = `file:///${page.replace(/\\/g, '/')}`;
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    '--default-background-color=00000000',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=5000',
    `--screenshot=${output}`,
    url
  ], { stdio: 'ignore', timeout: 90000 });
  const size = pngSize(output);
  if (size.width !== width || size.height !== height) {
    throw new Error(`${path.basename(output)} is ${size.width}x${size.height}, expected ${width}x${height}`);
  }
}

function renderIcon(svg, size, output, background = 'transparent') {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${background}}
svg{display:block;width:100%;height:100%}
</style></head><body>${svg}</body></html>`;
  renderPage(html, size, size, output);
}

function resizePng(input, output, size, background = '') {
  if (process.platform === 'win32') {
    const script = path.join(tmpDir, 'resize.ps1');
    fs.writeFileSync(script, `param([string]$InputPath,[string]$OutputPath,[int]$Size,[string]$Background = '')
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile($InputPath)
$dst = New-Object System.Drawing.Bitmap($Size, $Size)
$g = [System.Drawing.Graphics]::FromImage($dst)
if ($Background) {
  $parts = $Background.Split(',')
  $g.Clear([System.Drawing.Color]::FromArgb(255, [int]$parts[0], [int]$parts[1], [int]$parts[2]))
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
} else {
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
}
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::High
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.DrawImage($src, 0, 0, $Size, $Size)
$dst.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$dst.Dispose()
$src.Dispose()
`, 'utf8');
    const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-InputPath', input, '-OutputPath', output, '-Size', String(size)];
    if (background) args.push('-Background', background);
    execFileSync('powershell.exe', args, { stdio: 'ignore' });
  } else if (process.platform === 'darwin') {
    execFileSync('sips', ['-z', String(size), String(size), input, '--out', output], { stdio: 'ignore' });
  } else {
    execFileSync('convert', [input, '-resize', `${size}x${size}`, output], { stdio: 'ignore' });
  }
  const rendered = pngSize(output);
  if (rendered.width !== size || rendered.height !== size) {
    throw new Error(`${path.basename(output)} is ${rendered.width}x${rendered.height}, expected ${size}x${size}`);
  }
}

function buildIco(pngFiles, output) {
  const images = pngFiles.map(file => ({ data: fs.readFileSync(file), ...pngSize(file) }));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = Buffer.alloc(16 * images.length);
  let offset = 6 + entries.length;
  images.forEach((image, index) => {
    const entry = index * 16;
    entries.writeUInt8(image.width >= 256 ? 0 : image.width, entry);
    entries.writeUInt8(image.height >= 256 ? 0 : image.height, entry + 1);
    entries.writeUInt8(0, entry + 2);
    entries.writeUInt8(0, entry + 3);
    entries.writeUInt16LE(1, entry + 4);
    entries.writeUInt16LE(32, entry + 6);
    entries.writeUInt32LE(image.data.length, entry + 8);
    entries.writeUInt32LE(offset, entry + 12);
    offset += image.data.length;
  });

  fs.writeFileSync(output, Buffer.concat([header, entries, ...images.map(image => image.data)]));
}

async function downloadFontCss() {
  const cssUrl = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Kantumruy+Pro:wght@400;500&display=swap';
  const css = await fetch(cssUrl, { headers: { 'user-agent': UA } }).then(response => {
    if (!response.ok) throw new Error(`Google Fonts CSS returned ${response.status}`);
    return response.text();
  });
  const blocks = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(match => match[1]);
  const specs = [
    { family: 'DM Serif Display', style: 'normal', weight: '400', range: 'U+0000-00FF' },
    { family: 'DM Serif Display', style: 'italic', weight: '400', range: 'U+0000-00FF' },
    { family: 'DM Sans', style: 'normal', weight: '100 900', range: 'U+0000-00FF' },
    { family: 'Kantumruy Pro', style: 'normal', weight: '400 700', range: 'U+1780-17FF' }
  ];
  const rules = [];
  for (const spec of specs) {
    const block = blocks.find(candidate => {
      const family = (candidate.match(/font-family:\s*'([^']+)'/) || [])[1];
      const style = (candidate.match(/font-style:\s*([^;]+)/) || [])[1]?.trim();
      const range = (candidate.match(/unicode-range:\s*([^;]+)/) || [])[1] || '';
      return family === spec.family && style === spec.style && range.includes(spec.range);
    });
    if (!block) throw new Error(`Font block not found: ${spec.family} ${spec.style}`);
    const url = (block.match(/url\((https:\/\/[^)]+)\)/) || [])[1];
    if (!url) throw new Error(`Font URL not found: ${spec.family} ${spec.style}`);
    const name = `${spec.family.toLowerCase().replace(/[^a-z]+/g, '-')}-${spec.style}.woff2`;
    const cacheFile = path.join(fontCache, name);
    if (!fs.existsSync(cacheFile)) {
      const data = Buffer.from(await fetch(url).then(response => {
        if (!response.ok) throw new Error(`Font download returned ${response.status}`);
        return response.arrayBuffer();
      }));
      fs.writeFileSync(cacheFile, data);
    }
    const data = fs.readFileSync(cacheFile).toString('base64');
    rules.push(`@font-face{font-family:'${spec.family}';font-style:${spec.style};font-weight:${spec.weight};font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${spec.range};}`);
  }
  return rules.join('\n');
}

async function main() {
  console.log(`Using browser: ${chrome}`);
  console.log('Preparing fonts…');
  let fontCss = '';
  try {
    fontCss = await downloadFontCss();
  } catch (error) {
    console.warn(`Font download failed; social cards will use fallback fonts. ${error.message}`);
  }

  const full = readSvg('icon.svg');
  const compact = readSvg('icon-compact.svg');
  const tiny = readSvg('icon-tiny.svg');
  const square = readSvg('icon-square.svg');
  const maskable = readSvg('icon-maskable.svg');

  console.log('Rendering 512px masters…');
  const masters = {
    full: path.join(tmpDir, 'master-full.png'),
    compact: path.join(tmpDir, 'master-compact.png'),
    tiny: path.join(tmpDir, 'master-tiny.png'),
    square: path.join(tmpDir, 'master-square.png'),
    maskable: path.join(tmpDir, 'master-maskable.png')
  };
  renderIcon(full, 512, masters.full);
  renderIcon(compact, 512, masters.compact);
  renderIcon(tiny, 512, masters.tiny);
  renderIcon(square, 512, masters.square, '#173f35');
  renderIcon(maskable, 512, masters.maskable, '#173f35');

  console.log('Resizing favicon and app icons…');
  const iconJobs = [
    { master: 'tiny', size: 16, file: 'icon-16.png', direct: tiny },
    { master: 'compact', size: 32, file: 'icon-32.png', direct: compact },
    { master: 'compact', size: 48, file: 'icon-48.png', direct: compact },
    { master: 'full', size: 192, file: 'icon-192.png' },
    { master: 'full', size: 512, file: 'icon-512.png' },
    { master: 'maskable', size: 192, file: 'icon-maskable-192.png', background: '23,63,53' },
    { master: 'maskable', size: 512, file: 'icon-maskable-512.png' },
    { master: 'square', size: 150, file: 'mstile-150.png', background: '23,63,53' }
  ];
  for (const job of iconJobs) {
    const output = path.join(iconsDir, job.file);
    if (job.direct) renderIcon(job.direct, job.size, output);
    else if (job.size === 512) fs.copyFileSync(masters[job.master], output);
    else resizePng(masters[job.master], output, job.size, job.background);
    console.log(`  ${job.file} (${job.size}×${job.size})`);
  }

  resizePng(masters.square, path.join(root, 'apple-touch-icon.png'), 180, '23,63,53');
  console.log('  apple-touch-icon.png (180×180)');

  fs.writeFileSync(path.join(root, 'favicon.svg'), compact, 'utf8');
  fs.copyFileSync(path.join(__dirname, 'safari-pinned-tab.svg'), path.join(iconsDir, 'safari-pinned-tab.svg'));
  console.log('  favicon.svg');
  console.log('  safari-pinned-tab.svg');

  buildIco([
    path.join(iconsDir, 'icon-16.png'),
    path.join(iconsDir, 'icon-32.png'),
    path.join(iconsDir, 'icon-48.png')
  ], path.join(root, 'favicon.ico'));
  console.log('  favicon.ico (16/32/48)');

  console.log('Rendering social cards…');
  for (const card of [
    { source: 'og-image.html', width: 1200, height: 630, output: 'og-image.png' },
    { source: 'og-square.html', width: 1200, height: 1200, output: 'og-square.png' }
  ]) {
    const html = fs.readFileSync(path.join(__dirname, card.source), 'utf8').replace('/* __FONT_FACES__ */', fontCss);
    renderPage(html, card.width, card.height, path.join(root, card.output));
    console.log(`  ${card.output} (${card.width}×${card.height})`);
  }

  console.log('\nDone.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
