import type { Owner } from './possession';

export function canDeke(owner: Owner | null, moving: boolean, now: number, lastDekeAt: number, cooldownMs: number): boolean {
  return owner === 'human' && moving && now - lastDekeAt >= cooldownMs;
}

export function isDekeImmune(owner: Owner | null, now: number, immunityUntil: number): boolean {
  return owner === 'human' && now < immunityUntil;
}

export function isDekeRecovering(now: number, immunityUntil: number, recoveryUntil: number): boolean {
  return now >= immunityUntil && now < recoveryUntil;
}
