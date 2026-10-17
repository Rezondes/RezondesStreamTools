// Hook: clock of a full-screen scene. Countdown until ?at=20:00 or for ?min=5 (otherwise countdownSeconds from the
// settings), break time since opening, ?ticker and ?next override the texts from the settings.
import { useMemo, useState } from "react";
import { useNow } from "../hooks/useNow.ts";
import { countdownEnd } from "../overlayTiming.ts";
import { numberParam, params } from "../params.ts";
import { countdown } from "./screens.ts";

const SECOND_MS = 1000;
const MINUTE_SECONDS = 60;

export function useScreen(settings: { countdownSeconds: number; ticker: string; next: string }) {
  const [start] = useState(Date.now);
  const now = useNow();
  const seconds = numberParam("min", settings.countdownSeconds / MINUTE_SECONDS) * MINUTE_SECONDS;
  const end = useMemo(() => countdownEnd(params.get("at"), seconds, new Date(start)), [seconds, start]);
  return {
    now,
    start,
    ...countdown(start, end, now),
    away: (now - start) / SECOND_MS,
    ticker: params.get("ticker") ?? settings.ticker,
    next: params.get("next") ?? settings.next,
  };
}
