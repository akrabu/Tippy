import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const paths = ['dist/index.html', 'dist/sw.js'].map(path => new URL(path, root));
const sources = await Promise.all(paths.map(path => readFile(path, 'utf8')));
const version = sources[0].match(/<meta name="application-version" content="(\d+\.\d+\.\d+)-(\d+)">/);
if (!version) throw new Error('Missing application version.');
const revision = Number(version[2]) + 1;
if (!Number.isSafeInteger(revision)) throw new Error('Testing revision is out of range.');
const current = `${version[1]}-${version[2]}`;
const next = `${version[1]}-${String(revision).padStart(5, '0')}`;
for (const source of sources) {
  for (const file of ['styles.css', 'app.mjs']) {
    if (!source.includes(`${file}?v=${current}`)) throw new Error(`Release URL for ${file} is out of sync.`);
  }
}
if (!sources[1].includes(`tipsy-v${current}`)) throw new Error('Service worker version is out of sync.');
await Promise.all(paths.map((path, index) => writeFile(path, sources[index].replaceAll(current, next))));
console.log(`Tippy v${next} (${fileURLToPath(root)})`);
