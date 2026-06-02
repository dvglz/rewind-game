import { expect, test } from 'vitest';
import viteConfig from '../../vite.config';

test('preview allows the deployed DigitalOcean hostname', () => {
  const config = typeof viteConfig === 'function' ? viteConfig({ command: 'serve', mode: 'test', isSsrBuild: false, isPreview: true }) : viteConfig;
  const allowedHosts = config.preview?.allowedHosts ?? [];

  expect(allowedHosts).toContain('rewind-game-dqkul.ondigitalocean.app');
});
