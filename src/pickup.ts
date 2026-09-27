import type { Point } from './rules';

export function withinPickupRadius(player: Point, pickup: Point, radius: number): boolean {
  return (player.x - pickup.x) ** 2 + (player.y - pickup.y) ** 2 <= radius ** 2;
}

export function canRespawnPickup(now: number, respawnAt: number): boolean {
  return now >= respawnAt;
}
