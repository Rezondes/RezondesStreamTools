// Hook: Uhr einer Vollbild-Szene. Countdown bis ?at=20:00 oder für ?min=5 (sonst countdownSeconds aus den
// Einstellungen), Pausenzeit seit dem Öffnen, ?ticker und ?next überschreiben die Texte aus den Einstellungen.
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
