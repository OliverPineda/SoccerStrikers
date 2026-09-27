import type { Owner } from './possession';

export function canAttemptHit(owner: Owner | null, now: number, lastHitAt: number, cooldownMs: number): boolean {
  return owner !== 'human' && now - lastHitAt >= cooldownMs;
}

export function hitConnects(owner: Owner | null, distanceToAi: number, hitRange: number): boolean {
  return owner === 'ai' && distanceToAi <= hitRange;
}
