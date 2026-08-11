import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const routeFiles = [
  'src/app/_layout.tsx',
  'src/app/index.tsx',
  'src/app/catalog.tsx',
  'src/app/profile.tsx',
  'src/app/fight.tsx',
];

describe('Expo Router routes', () => {
  it('ships the status, catalog, profile, and fight routes from src/app', () => {
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

  it('registers the Fight route and keeps it on Expo Router navigation only', () => {
    const layout = readFileSync(join(projectRoot, 'src/app/_layout.tsx'), 'utf8');
    const home = readFileSync(join(projectRoot, 'src/app/index.tsx'), 'utf8');
    const appScreen = readFileSync(join(projectRoot, 'src/ui/app-screen.tsx'), 'utf8');
    const fight = readFileSync(join(projectRoot, 'src/app/fight.tsx'), 'utf8');
    expect(layout).toContain('<Stack.Screen name="fight" />');
    expect(home).toContain('href="/fight"');
    expect(appScreen).toContain('href="/fight" label="FIGHT"');
    expect(fight).toContain('export function FightContent');
    expect(fight).toContain('useFight');
    expect(fight).toContain('<AppScreen title="FIGHT / PRACTICE LOOP">');
    expect(fight).not.toContain('@react-navigation/');
  });
});
