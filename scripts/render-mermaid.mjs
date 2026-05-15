#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';

const exec = promisify(execFile);
const SRC = 'slides.md';
const OUT = 'slides.build.md';
const DIR = 'diagrams';

const md = await readFile(SRC, 'utf8');
await mkdir(DIR, { recursive: true });

const re = /```mermaid\n([\s\S]*?)```/g;
const blocks = [];
let m;
while ((m = re.exec(md)) !== null) blocks.push({ full: m[0], src: m[1] });

let out = md;
for (const b of blocks) {
  const hash = createHash('sha1').update(b.src).digest('hex').slice(0, 10);
  const mmd = `${DIR}/${hash}.mmd`;
  const svg = `${DIR}/${hash}.svg`;
  if (!existsSync(svg)) {
    await writeFile(mmd, b.src);
    await exec('npx', ['--yes', 'mmdc', '-i', mmd, '-o', svg, '-b', 'transparent', '-t', 'default']);
  }
  out = out.replace(b.full, `![diagram](${svg})`);
}

await writeFile(OUT, out);
console.log(`rendered ${blocks.length} mermaid diagrams -> ${OUT}`);
