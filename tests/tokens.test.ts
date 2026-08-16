import { describe, expect, it } from 'vitest';

import { fonts, typeScale } from '../src/ui/tokens';

describe('type tokens (fidelity Round 1)', () => {
  it('declares the house font stack', () => {
    expect(fonts.display).toBe('ArchivoBlack');
    expect(fonts.body).toBe('Inter');
    expect(fonts.mono).toBe('JetBrainsMono');
  });

  it('defines a complete scale with mono meta tracking', () => {
    expect(typeScale.display.fontSize).toBeGreaterThan(typeScale.heading.fontSize);
    expect(typeScale.heading.fontSize).toBeGreaterThan(typeScale.body.fontSize);
    expect(typeScale.meta.fontFamily).toBe(fonts.mono);
    expect(typeScale.meta.letterSpacing).toBeGreaterThanOrEqual(1.5);
    expect(typeScale.label.fontFamily).toBe(fonts.bodyBlack);
  });
});
