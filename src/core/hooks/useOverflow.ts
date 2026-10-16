// Hook: wie weit ein Text über seinen Rahmen hinausragt (px, 0 = passt), für Lauftexte. Misst nicht nur beim neuen
// Text, sondern bei jeder Grössenänderung von Rahmen oder Text (nachgeladene Webschrift, Einblenden, andere
// Einstellungen); sonst stimmt die Strecke nicht und das Ende langer Titel bleibt unsichtbar.
import { useLayoutEffect, useRef, useState } from "react";

export function useOverflow<Outer extends HTMLElement, Inner extends HTMLElement>(text: string) {
  const outer = useRef<Outer>(null);
  const inner = useRef<Inner>(null);
  const [overflow, setOverflow] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      if (outer.current && inner.current) setOverflow(Math.max(0, Math.ceil(inner.current.scrollWidth - outer.current.clientWidth)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (outer.current) observer.observe(outer.current);
    if (inner.current) observer.observe(inner.current);
    let active = true;
    document.fonts.ready.then(() => { if (active) measure(); }).catch(() => {});
    return () => { active = false; observer.disconnect(); };
  }, [text]);
  return { outer, inner, overflow };
}
