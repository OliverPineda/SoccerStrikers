export type Side = 'left' | 'right';
export type Score = { left: number; right: number };
export type Point = { x: number; y: number };

export function crossedGoalLine(
  ball: Point,
  radius: number,
  pitch: { left: number; right: number; top: number; bottom: number; goalHalfHeight: number },
): Side | null {
  const centerY = (pitch.top + pitch.bottom) / 2;
  if (Math.abs(ball.y - centerY) + radius > pitch.goalHalfHeight) return null;
  if (ball.x + radius < pitch.left) return 'left';
  if (ball.x - radius > pitch.right) return 'right';
  return null;
}

export function addGoal(score: Score, crossedSide: Side): Score {
  return crossedSide === 'left'
    ? { left: score.left, right: score.right + 1 }
    : { left: score.left + 1, right: score.right };
}

export function resetScore(): Score {
  return { left: 0, right: 0 };
}
