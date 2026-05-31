import { rm } from 'node:fs/promises';

const targets = [
  'node_modules/.vite',
  'node_modules/.astro',
  '.astro',
];

for (const target of targets) {
  await rm(target, { recursive: true, force: true });
}
