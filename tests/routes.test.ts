import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const routeFiles = ['src/app/_layout.tsx', 'src/app/index.tsx', 'src/app/catalog.tsx', 'src/app/profile.tsx'];

describe('Expo Router routes', () => {
  it('ships the status, catalog, and profile routes from src/app', () => {
    for (const route of routeFiles) {
      expect(readFileSync(join(projectRoot, route), 'utf8')).toContain('export default');
    }
  });

  it('uses Expo Router imports and does not directly import React Navigation', () => {
    const source = routeFiles
      .map((route) => readFileSync(join(projectRoot, route), 'utf8'))
      .join('\n');
    expect(source).toContain("from 'expo-router'");
    expect(source).not.toContain('@react-navigation/');
  });

  it('wires the Profile route to the typed backend /me reader', () => {
    const profile = readFileSync(join(projectRoot, 'src/app/profile.tsx'), 'utf8');
    expect(profile).toContain("protectedQueryKey(queryScope ?? 'inactive', 'me')");
    expect(profile).toContain('api.getMe()');
    expect(profile).toContain('enabled: queryScope !== null');
  });

  it('disables protected catalog reads without a fixture or authenticated scope', () => {
    const catalog = readFileSync(join(projectRoot, 'src/app/catalog.tsx'), 'utf8');
    expect(catalog).toContain('enabled: protectedEnabled');
    expect(catalog).toContain('protectedQueryKey(scope, \'catalog\')');
  });
});
