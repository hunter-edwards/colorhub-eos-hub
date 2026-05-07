export type ProgressInput = {
  completed: number | null | undefined;
  needed: number | null | undefined;
};

export type ProgressResult = {
  pct: number;
  overBy: number;
  isOver: boolean;
  completed: number;
  needed: number;
};

export function progress(input: ProgressInput): ProgressResult {
  const completed = input.completed ?? 0;
  const needed = input.needed ?? 0;
  const completedNum = typeof completed === 'number' ? completed : 0;
  const neededNum = typeof needed === 'number' ? needed : 0;

  const pct =
    neededNum > 0 && input.completed != null
      ? (completedNum / neededNum) * 100
      : 0;
  const overBy = Math.max(0, completedNum - neededNum);
  const isOver = completedNum > neededNum;

  return {
    pct,
    overBy,
    isOver,
    completed: completedNum,
    needed: neededNum,
  };
}
