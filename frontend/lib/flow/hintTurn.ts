export type HintPose = 'idle' | 'working' | 'done';

export type HintBubble = {
  pose: HintPose;
  text: string;
};

export type HintTurn = {
  generation: number;
  bubble: HintBubble;
};

export function createHintTurn(text: string): HintTurn {
  return { generation: 0, bubble: { pose: 'idle', text } };
}

export function beginHint(turn: HintTurn, thinking: string): { turn: HintTurn; requestId: number } {
  const requestId = turn.generation + 1;
  return {
    requestId,
    turn: { generation: requestId, bubble: { pose: 'working', text: thinking } },
  };
}

export function noteAnswer(turn: HintTurn, text: string, pose: HintPose): HintTurn {
  return { generation: turn.generation + 1, bubble: { pose, text } };
}

export function invalidateHint(turn: HintTurn): HintTurn {
  return { generation: turn.generation + 1, bubble: turn.bubble };
}

export function resetHint(turn: HintTurn, text: string): HintTurn {
  return { generation: turn.generation + 1, bubble: { pose: 'idle', text } };
}

export function applyHint(
  turn: HintTurn,
  requestId: number,
  text: string,
  pose: HintPose,
): { applied: boolean; turn: HintTurn } {
  if (requestId !== turn.generation) {
    return { applied: false, turn };
  }

  return { applied: true, turn: { generation: turn.generation, bubble: { pose, text } } };
}
