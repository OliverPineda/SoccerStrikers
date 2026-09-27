export type Owner = 'human' | 'ai';
export type CaptureCandidate = { owner: Owner; distance: number; entered: boolean };

export function resolveCapture(
  current: Owner | null,
  candidates: CaptureCandidate[],
  ballSpeed: number,
  range: number,
  maxSpeed: number,
): Owner | null {
  if (ballSpeed >= maxSpeed) return current;
  // Candidate order is the order of entry; callers use distance for a same-frame tie.
  for (const candidate of candidates) {
    if (candidate.owner !== current && candidate.entered && candidate.distance <= range) return candidate.owner;
  }
  return current;
}
