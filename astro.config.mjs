// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import analogjsangular from '@analogjs/astro-angular';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [analogjsangular()],
  devToolbar: {
    enabled: false,
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@angular/common',
        '@angular/common/http',
        '@angular/core',
        '@angular/forms',
        '@angular/platform-browser',
        'rxjs',
        'rxjs/operators',
      ],
    },
  }
});
