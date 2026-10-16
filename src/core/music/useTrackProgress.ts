// Hook: Fortschritt eines Titels (trackProgress in music.ts), viermal pro Sekunde neu berechnet.
import { useNow } from "../hooks/useNow.ts";
import type { Track } from "../types.ts";
import { trackProgress } from "./music.ts";

const TICK_MS = 250;

export const useTrackProgress = (track: Track, at: number) => trackProgress(track, at, useNow(TICK_MS));
