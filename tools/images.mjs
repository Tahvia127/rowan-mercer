/* Image pipeline: source JPEGs -> responsive WebP set + inline LQIP + manifest.
   Run once when photos change:  node tools/images.mjs <source-dir>
   Requires cwebp and ImageMagick on PATH. */
import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, statSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];
if (!SRC) { console.error('usage: node tools/images.mjs <source-dir>'); process.exit(1) }
const OUT = 'assets/img';
mkdirSync(OUT, { recursive: true });

const WIDTHS = [480, 900, 1600];
const sh = c => execSync(c, { encoding: 'utf8' }).trim();

const files = readdirSync(SRC).filter(f => /\.jpe?g$/i.test(f))
  .sort((a,b) => (+a.replace(/\D/g,'')) - (+b.replace(/\D/g,'')));

const manifest = [];
let srcBytes = 0, outBytes = 0;

for (const f of files) {
  const src = join(SRC, f);
  const id = f.replace(/\.jpe?g$/i, '');
  const [w, h] = sh(`magick identify -format "%w %h" "${src}"`).split(' ').map(Number);
  srcBytes += statSync(src).size;

  const sizes = [];
  for (const tw of WIDTHS) {
    if (tw > w) continue;
    const out = `${OUT}/${id}-${tw}.webp`;
    sh(`cwebp -quiet -q 78 -resize ${tw} 0 "${src}" -o "${out}"`);
    const b = statSync(out).size; outBytes += b;
    sizes.push({ w: tw, bytes: b });
  }
  // tiny placeholder, inlined as a data URI so it costs no request
  const tmp = `${OUT}/.lqip.webp`;
  sh(`cwebp -quiet -q 22 -resize 20 0 "${src}" -o "${tmp}"`);
  const lqip = 'data:image/webp;base64,' + readFileSync(tmp).toString('base64');
  sh(`rm -f "${tmp}"`);

  manifest.push({ id, w, h, ratio: +(w/h).toFixed(4), sizes, lqip });
}

writeFileSync('data/images.json', JSON.stringify({
  generated: new Date().toISOString().slice(0,10),
  widths: WIDTHS,
  sourceBytes: srcBytes,
  outputBytes: outBytes,
  images: manifest
}, null, 2));

const mb = n => (n/1048576).toFixed(2) + ' MB';
console.log(`  ${manifest.length} images -> ${manifest.reduce((n,m)=>n+m.sizes.length,0)} WebP renditions`);
console.log(`  source ${mb(srcBytes)}  ->  all renditions ${mb(outBytes)}`);
console.log(`  largest single rendition: ${Math.max(...manifest.flatMap(m=>m.sizes.map(s=>s.bytes)))/1024|0} KB`);
