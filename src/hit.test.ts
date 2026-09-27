import { describe, expect, it } from 'vitest';
import { canAttemptHit, hitConnects } from './hit';

describe('human hit', () => {
  it('blocks attempts in possession or during cooldown, including after a miss', () => {
    expect(canAttemptHit('human', 2000, -Infinity, 1100)).toBe(false);
    expect(canAttemptHit(null, 0, -Infinity, 1100)).toBe(true);
    const missedAt = 100;
    expect(canAttemptHit(null, 1199, missedAt, 1100)).toBe(false);
    expect(canAttemptHit(null, 1200, missedAt, 1100)).toBe(true);
  });

  it('connects only against an AI possessor within range', () => {
    expect(hitConnects('ai', 68, 68)).toBe(true);
    expect(hitConnects('ai', 68.1, 68)).toBe(false);
    expect(hitConnects(null, 30, 68)).toBe(false);
    expect(hitConnects('human', 30, 68)).toBe(false);
  });
});
