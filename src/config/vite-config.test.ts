import { expect, test } from 'vitest';
import viteConfig from '../../vite.config';

function transformHtml(config: ReturnType<Extract<typeof viteConfig, (...args: never[]) => unknown>>, html: string): string {
  const plugin = config.plugins?.find((p) => p && !Array.isArray(p) && typeof p === 'object' && 'name' in p && p.name === 'rewind-public-app-url');
  if (!plugin || !('transformIndexHtml' in plugin) || typeof plugin.transformIndexHtml !== 'function') return html;
  const transform = plugin.transformIndexHtml as (html: string, ctx: { path: string; filename: string }) => string;
  return transform(html, { path: '/', filename: 'index.html' });
}

test('preview allows the deployed DigitalOcean hostname', () => {
  const config = typeof viteConfig === 'function' ? viteConfig({ command: 'serve', mode: 'test', isSsrBuild: false, isPreview: true }) : viteConfig;
  const allowedHosts = config.preview?.allowedHosts ?? [];

  expect(allowedHosts).toContain('rewind-game-dqkul.ondigitalocean.app');
});

test('allows indexing for the production public app url', () => {
  process.env.VITE_PUBLIC_APP_URL = 'https://rewindgame.com';
  const config = typeof viteConfig === 'function' ? viteConfig({ command: 'build', mode: 'production', isSsrBuild: false, isPreview: false }) : viteConfig;
  const html = '<meta name="robots" content="__ROBOTS_DIRECTIVE__" />';

  expect(transformHtml(config, html)).toContain('content="index, follow"');

  delete process.env.VITE_PUBLIC_APP_URL;
});

test('keeps indexing disabled for non-production public app urls', () => {
  process.env.VITE_PUBLIC_APP_URL = 'https://clutchpoints-rewind-test.4taps.me';
  const config = typeof viteConfig === 'function' ? viteConfig({ command: 'build', mode: 'production', isSsrBuild: false, isPreview: false }) : viteConfig;
  const html = '<meta name="robots" content="__ROBOTS_DIRECTIVE__" />';

  expect(transformHtml(config, html)).toContain('content="noindex, nofollow"');

  delete process.env.VITE_PUBLIC_APP_URL;
});
