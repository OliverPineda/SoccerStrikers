import { describe, expect, it } from 'vitest';
import { canRespawnPickup, withinPickupRadius } from './pickup';

describe('speed pickup', () => {
  it('is collected at or inside its radius, not outside', () => {
    const pickup = { x: 500, y: 325 };
    expect(withinPickupRadius({ x: 530, y: 325 }, pickup, 30)).toBe(true);
    expect(withinPickupRadius({ x: 531, y: 325 }, pickup, 30)).toBe(false);
  });

  it('respawns only once its timer has elapsed', () => {
    expect(canRespawnPickup(5499, 5500)).toBe(false);
    expect(canRespawnPickup(5500, 5500)).toBe(true);
  });
});
