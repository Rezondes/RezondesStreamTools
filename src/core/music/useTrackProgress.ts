// Hook: progress of a track (trackProgress in music.ts), recalculated four times per second.
import { useNow } from "../hooks/useNow.ts";
import type { Track } from "../types.ts";
import { trackProgress } from "./music.ts";

const TICK_MS = 250;

export const useTrackProgress = (track: Track, at: number) => trackProgress(track, at, useNow(TICK_MS));
