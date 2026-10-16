// Hook: Töne eines Alerts genau einmal, open beim Erscheinen und leave beim Ausblenden. Beide werden beim Erscheinen
// festgehalten, damit geänderte Einstellungen einen laufenden Alert nicht noch einmal klingen lassen. null = kein Ton.
import { useEffect, useState } from "react";

export function useAlertSounds(open: (() => void) | null, leave: (() => void) | null, leaving: boolean) {
  const [atOpen] = useState(() => open);
  const [atLeave] = useState(() => leave);
  useEffect(() => { atOpen?.(); }, [atOpen]);
  useEffect(() => { if (leaving) atLeave?.(); }, [leaving, atLeave]);
}
