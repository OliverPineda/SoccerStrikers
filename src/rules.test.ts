import { describe, expect, it } from 'vitest';
import { addGoal, crossedGoalLine, resetScore } from './rules';

const pitch = { left: 70, right: 930, top: 75, bottom: 575, goalHalfHeight: 78 };

describe('goal detection', () => {
  it('scores only when the whole ball crosses either line', () => {
    expect(crossedGoalLine({ x: 59, y: 325 }, 10, pitch)).toBe('left');
    expect(crossedGoalLine({ x: 941, y: 325 }, 10, pitch)).toBe('right');
    expect(crossedGoalLine({ x: 60, y: 325 }, 10, pitch)).toBeNull();
    expect(crossedGoalLine({ x: 940, y: 325 }, 10, pitch)).toBeNull();
  });

  it('requires the whole ball to fit within the goal mouth', () => {
    expect(crossedGoalLine({ x: 50, y: 400 }, 10, pitch)).toBeNull();
  });
});

describe('scoring and reset', () => {
  it('awards the AI side when the ball crosses the human goal line', () => {
    const crossed = crossedGoalLine({ x: 59, y: 325 }, 10, pitch);
    expect(crossed).toBe('left');
    expect(addGoal(resetScore(), crossed!)).toEqual({ left: 0, right: 1 });
  });

  it('clears both sides after goals', () => {
    const score = addGoal(addGoal(resetScore(), 'left'), 'right');
    expect(score).toEqual({ left: 1, right: 1 });
    expect(resetScore()).toEqual({ left: 0, right: 0 });
  });
});
