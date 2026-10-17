// Hook: how far a text sticks out of its frame (px, 0 = fits), for scrolling texts. Measures not only on new
// text but on every size change of frame or text (late-loaded web font, fade-in, other
// settings); otherwise the distance is wrong and the end of long titles stays invisible.
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
