// A frosted card of the Plantage screens: harvest paper as milk glass over the PixiJS world (blur of the world behind,
// thin light rim, light edge on top, soft lift), styles in theme.css (.pl-frost).
import type { ReactNode } from "react";

export default function FrostCard({ className, children }: { className: string; children: ReactNode }) {
  return <div className={`pl-frost ${className}`}>{children}</div>;
}
