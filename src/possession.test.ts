import { describe, expect, it } from 'vitest';
import { resolveCapture } from './possession';

describe('contested possession', () => {
  it('awards the first eligible entrant and allows the opponent to steal on a later entry', () => {
    const ai = { owner: 'ai' as const, distance: 40, entered: true };
    const human = { owner: 'human' as const, distance: 35, entered: true };
    expect(resolveCapture(null, [ai, human], 100, 52, 260)).toBe('ai');
    expect(resolveCapture('ai', [{ ...human, entered: false }], 100, 52, 260)).toBe('ai');
    expect(resolveCapture('ai', [human], 100, 52, 260)).toBe('human');
  });

  it('requires capture distance and a slow enough ball for either entity', () => {
    const ai = { owner: 'ai' as const, distance: 40, entered: true };
    expect(resolveCapture('human', [ai], 260, 52, 260)).toBe('human');
    expect(resolveCapture('human', [{ ...ai, distance: 53 }], 100, 52, 260)).toBe('human');
  });
});
