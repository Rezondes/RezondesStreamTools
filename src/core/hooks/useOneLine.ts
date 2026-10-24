// Hook: keeps a text (an alert name) on one line in its box. A copy of the element with the whole text is measured
// unwrapped; when it is wider than the box, the font of the element shrinks until it fits, it never grows. The element
// must be a block as wide as its box; its min-width is set to 0, so the unwrapped text does not widen a grid or flex
// column. Measured again when the text changes and once the fonts are loaded; a text that is typed or decoded in is
// measured as a whole, so the size does not change while it appears.
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

// fixed: a little room, so rounding never pushes the last letter onto a second line
const SAFETY = 0.98;

export function useOneLine<T extends HTMLElement>(text: string): RefObject<T | null> {
  const ref = useRef<T>(null);
  const [fonts, setFonts] = useState(0);
  useEffect(() => {
    let alive = true;
    void document.fonts.ready.then(() => { if (alive) setFonts(count => count + 1); });
    return () => { alive = false; };
  }, []);
  useLayoutEffect(() => {
    const element = ref.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    element.style.fontSize = "";
    element.style.whiteSpace = "nowrap";
    element.style.minWidth = "0";
    const probe = element.cloneNode(false) as T;
    probe.textContent = text;
    probe.setAttribute("aria-hidden", "true");
    Object.assign(probe.style, { position: "absolute", left: "0", top: "0", width: "auto", visibility: "hidden", whiteSpace: "pre" });
    parent.append(probe);
    const style = getComputedStyle(element);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const natural = probe.offsetWidth - padding;
    probe.remove();
    const room = element.clientWidth - padding;
    if (natural > room && natural > 0) element.style.fontSize = `${parseFloat(style.fontSize) * (room / natural) * SAFETY}px`;
  }, [text, fonts]);
  return ref;
}
