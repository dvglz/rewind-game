/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const previewAllowedHosts = [
  'rewind-game-dqkul.ondigitalocean.app',
  'clutchpoints-rewind-test.4taps.me',
  'rewindgame.com',
  'clutchpoints-rewind-7rcvt.ondigitalocean.app',
  'rewind-game-prod-xise3.ondigitalocean.app',
  ...(process.env.VITE_PREVIEW_ALLOWED_HOSTS
    ? process.env.VITE_PREVIEW_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : []),
];

export default defineConfig(() => ({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  preview: {
    allowedHosts: previewAllowedHosts,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    // Keep analytics a no-op in tests regardless of .env.local.
    env: { VITE_GA_MEASUREMENT_ID: '' },
  },
}));
