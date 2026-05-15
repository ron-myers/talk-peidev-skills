#!/usr/bin/env node
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';

const SRC = 'slides.md';
const DEBOUNCE_MS = 300;

let timer = null;
let running = false;
let pending = false;

function build() {
  if (running) { pending = true; return; }
  running = true;
  const started = new Date().toLocaleTimeString();
  console.log(`[${started}] building slides.pdf…`);
  const child = spawn('npm', ['run', 'pdf'], { stdio: 'inherit' });
  child.on('close', (code) => {
    running = false;
    const done = new Date().toLocaleTimeString();
    console.log(`[${done}] ${code === 0 ? 'ok' : `failed (exit ${code})`}`);
    if (pending) { pending = false; build(); }
  });
}

console.log(`watching ${SRC} — edit + save to rebuild slides.pdf. Ctrl+C to stop.`);
build();

watch(SRC, { persistent: true }, (event) => {
  if (event !== 'change' && event !== 'rename') return;
  clearTimeout(timer);
  timer = setTimeout(build, DEBOUNCE_MS);
});
