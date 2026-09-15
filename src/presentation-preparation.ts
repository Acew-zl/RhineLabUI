// Last fully covered instant before the authored array entrance (21.9 s).
export const PREPARATION_BOUNDARY = 21.85;

export function preparedBootTime(time: number, ready: boolean) {
  return ready ? time : Math.min(time, PREPARATION_BOUNDARY);
}

// Yield between expensive GPU setup stages without requiring a visible tab.
export const yieldPreparation = () => new Promise<void>(resolve => setTimeout(resolve, 0));
