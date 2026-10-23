// Hook: clock of a full-screen scene. Countdown until countdownAt (e.g. 20:00) or for countdownSeconds, break time since
// opening, ticker and next text; everything comes from the settings, the OBS URL carries only the overlay key.
// In a recorded video (?video, set by the recorder of the dashboard) the break time stays hidden (showAway): a loop
// cannot know how long the break already lasts.
import { useMemo, useState } from "react";
import { useNow } from "../hooks/useNow.ts";
import { countdownEnd } from "../overlayTiming.ts";
import { params } from "../params.ts";
import { countdown } from "./screens.ts";

const SECOND_MS = 1000;
const IN_VIDEO = params.has("video");

export function useScreen(settings: { countdownSeconds: number; countdownAt: string; ticker: string; next: string }) {
  const [start] = useState(Date.now);
  const now = useNow();
  const { countdownSeconds: seconds, countdownAt: at } = settings;
  const end = useMemo(() => countdownEnd(at, seconds, new Date(start)), [at, seconds, start]);
  return {
    now,
    start,
    ...countdown(start, end, now),
    // Seconds from the start of the scene to the end of the countdown (0 without countdown)
    total: Math.max(0, (end - start) / SECOND_MS),
    away: (now - start) / SECOND_MS,
    showAway: !IN_VIDEO,
    ticker: settings.ticker,
    next: settings.next,
  };
}
