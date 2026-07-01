/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const previewAllowedHosts = [
  'rewind-game-dqkul.ondigitalocean.app',
  'clutchpoints-rewind-test.4taps.me',
  'rewindgame.com',
  'rewind.clutchpoints.com',
  'clutchpoints-rewind-7rcvt.ondigitalocean.app',
  'rewind-game-prod-xise3.ondigitalocean.app',
  ...(process.env.VITE_PREVIEW_ALLOWED_HOSTS
    ? process.env.VITE_PREVIEW_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : []),
];

export default defineConfig(() => {
  const publicAppUrl = (process.env.VITE_PUBLIC_APP_URL || 'https://clutchpoints-rewind-test.4taps.me').replace(/\/+$/, '');
  const robotsDirective = publicAppUrl === 'https://rewindgame.com' ? 'index, follow' : 'noindex, nofollow';

  return {
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      {
        name: 'rewind-public-app-url',
        transformIndexHtml(html) {
          return html
            .replaceAll('__PUBLIC_APP_URL__', publicAppUrl)
            .replaceAll('__ROBOTS_DIRECTIVE__', robotsDirective);
        },
      },
    ],
    preview: {
      allowedHosts: previewAllowedHosts,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      // Keep analytics a no-op in tests regardless of .env.local.
      env: { VITE_GA_MEASUREMENT_ID: '' },
    },
  };
});
