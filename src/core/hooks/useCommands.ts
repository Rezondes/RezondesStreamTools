// Hook: chat commands for the commands page (scene info), reloaded every 60 s. With ?demo or without a streamer a
// sample list; demoMinimes: minime rules of the theme from its current values (null = theme without minimes),
// so the preview in the dashboard matches the theme. null until the list is loaded.
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
