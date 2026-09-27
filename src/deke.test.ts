import { describe, expect, it } from 'vitest';
import { canDeke, isDekeImmune, isDekeRecovering } from './deke';

describe('deke timing', () => {
  it('requires human possession, movement, and an expired cooldown', () => {
    expect(canDeke(null, true, 2000, 0, 1500)).toBe(false);
    expect(canDeke('ai', true, 2000, 0, 1500)).toBe(false);
    expect(canDeke('human', false, 2000, 0, 1500)).toBe(false);
    expect(canDeke('human', true, 1499, 0, 1500)).toBe(false);
    expect(canDeke('human', true, 1500, 0, 1500)).toBe(true);
  });

  it('blocks capture only during immunity and starts recovery afterward', () => {
    expect(isDekeImmune('human', 1239, 1240)).toBe(true);
    expect(isDekeImmune('human', 1240, 1240)).toBe(false);
    expect(isDekeImmune('ai', 1100, 1240)).toBe(false);
    expect(isDekeRecovering(1239, 1240, 1660)).toBe(false);
    expect(isDekeRecovering(1240, 1240, 1660)).toBe(true);
    expect(isDekeRecovering(1660, 1240, 1660)).toBe(false);
  });
});
