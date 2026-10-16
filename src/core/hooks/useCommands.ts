// Hook: Chat-Befehle für die Befehlsseite (Szene info), alle 60 s neu geladen. Mit ?demo oder ohne Streamer eine
// Beispielliste; demoMinimes: Regeln der Minimes des Themes aus seinen aktuellen Werten (null = Theme ohne Minimes),
// damit die Vorschau im Dashboard zum Theme passt. null, bis die Liste geladen ist.
import { useEffect, useState } from "react";
import type { CommandList } from "../commands.ts";
import { fetchCommands, streamer } from "../connection.ts";
import { demoCommands } from "../demo.ts";
import type { MinimeRules } from "../minimes.ts";
import { params } from "../params.ts";

const REFRESH_MS = 60_000;
const useDemo = params.has("demo") || !streamer;

export function useCommands(demoMinimes: MinimeRules | null): CommandList | null {
  const [list, setList] = useState<CommandList | null>(null);
  useEffect(() => {
    if (useDemo) return;
    let active = true;
    const load = () => { fetchCommands().then(loaded => { if (active && loaded) setList(loaded); }).catch(() => {}); };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return useDemo ? demoCommands(demoMinimes) : list;
}
