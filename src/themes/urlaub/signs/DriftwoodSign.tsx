// A sign of weathered driftwood for the realistic Urlaub Starting (PLAN-URLAUB.md package 5): planks lit from above with
// darker joints and worn edges, grain from an SVG turbulence when switched on, light carved letters; hanging on two ropes
// (it swings on the scene timeline) or standing on a post that grows out of the sand.
import type { ReactNode } from "react";

type Props = { hanging: boolean; grain: boolean; className?: string; children: ReactNode };

export default function DriftwoodSign({ hanging, grain, className = "", children }: Props) {
  return <div className={`ul-wood ul-driftwood ${hanging ? "ul-sign-haengend" : "ul-post"} ${grain ? "ul-grain" : ""} ${className}`}>{children}</div>;
}
