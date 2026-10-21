// One anchor element per minime login for the 3D minimes, the same across renders, so a 3D figure (PartFigure.tsx) keeps
// following the box the core moves with CSS
import { createRef, type RefObject, useRef } from "react";

export function useAnchors() {
  const anchors = useRef(new Map<string, RefObject<HTMLDivElement | null>>());
  return (login: string) => {
    const known = anchors.current.get(login);
    if (known) return known;
    const anchor = createRef<HTMLDivElement>();
    anchors.current.set(login, anchor);
    return anchor;
  };
}
