// Hook: current Spotify track. track = current state (null = nothing playing), last = last known track
// (for fade-out animations), receivedAt = time of receipt for currentProgress.
import { useEffect, useState } from "react";
import { connect } from "../connection.ts";
import type { Track } from "../types.ts";

export function useMusic() {
  const [state, setState] = useState<{ track: Track | null; last: Track | null; receivedAt: number }>({ track: null, last: null, receivedAt: 0 });
  useEffect(() => connect({
    music: track => setState(previous => ({ track, last: track ?? previous.last, receivedAt: Date.now() })),
  }), []);
  return state;
}
