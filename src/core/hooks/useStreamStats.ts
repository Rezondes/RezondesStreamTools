// Hook: the current stream stats from the server (SSE stats), null until the first message; with ?demo the demo stats.
// Format the lines with describeStats (stats/stats.ts).
import { useEffect, useState } from "react";
import { connect } from "../connection.ts";
import type { StreamStats } from "../types.ts";

export function useStreamStats(): StreamStats | null {
  const [stats, setStats] = useState<StreamStats | null>(null);
  useEffect(() => connect({ stats: setStats }), []);
  return stats;
}
