// Hook: sounds of an alert exactly once, open on appearing and leave on fading out. Both are captured on
// appearing, so changed settings never make a running alert sound again. null = no sound.
import { useEffect, useState } from "react";

export function useAlertSounds(open: (() => void) | null, leave: (() => void) | null, leaving: boolean) {
  const [atOpen] = useState(() => open);
  const [atLeave] = useState(() => leave);
  useEffect(() => { atOpen?.(); }, [atOpen]);
  useEffect(() => { if (leaving) atLeave?.(); }, [leaving, atLeave]);
}
