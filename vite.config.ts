/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const previewAllowedHosts = [
  'rewind-game-dqkul.ondigitalocean.app',
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
  },
}));
