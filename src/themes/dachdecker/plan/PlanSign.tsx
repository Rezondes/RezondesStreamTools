// Blueprint sign of the Dachdecker overlays (DESIGN-DACHDECKER.md "Bauplan-Schild"): a plan sheet with millimetre grid,
// white edge and terracotta corner marks (top left, bottom right), for alerts, chat notes, music and the commands page.
import type { CSSProperties, ReactNode } from "react";

type Props = { corners?: boolean; className?: string; style?: CSSProperties; children: ReactNode };

export default function PlanSign({ corners = true, className = "", style, children }: Props) {
  return <div className={`dd-sheet dd-sign${corners ? "" : " dd-no-corners"} ${className}`} style={style}>{children}</div>;
}
