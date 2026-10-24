// Voice limit for sound clips (plans/PLAN-TOENE.md package 1): which playing voices give way so a new clip fits under
// the limit of simultaneous voices. Pure rule; the caller passes the playing voices. Check: clipVoices.check.ts.

export type ClipVoice = { id: number; startedAt: number };
export type VoiceDecision = { admit: boolean; stop: number[] };

// active: the voices playing now with their start; limit: most voices at once (0 or less plays nothing). The oldest
// voices give way first, as many as needed so that the new voice is the limit-th one.
export function admitVoice(active: readonly ClipVoice[], limit: number): VoiceDecision {
  if (limit <= 0) return { admit: false, stop: [] };
  const surplus = active.length - limit + 1;
  if (surplus <= 0) return { admit: true, stop: [] };
  const oldestFirst = [...active].sort((first, second) => first.startedAt - second.startedAt);
  return { admit: true, stop: oldestFirst.slice(0, surplus).map(voice => voice.id) };
}
