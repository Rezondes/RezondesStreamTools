// The pixel box of the sign layer (DESIGN-DOGS.md "Pixel-Box"): cream with a stepped ink edge, white light inside at
// the top, the edge color at the bottom and a hard shadow below (theme.css); red: the variant in the accent color.
import type { CSSProperties, ReactNode, Ref } from "react";

type Props = { className?: string; red?: boolean; style?: CSSProperties; boxRef?: Ref<HTMLDivElement>; children: ReactNode };

export default function PixelBox({ className = "", red = false, style, boxRef, children }: Props) {
  return <div ref={boxRef} className={`dg-box${red ? " dg-box-red" : ""} ${className}`} style={style}>{children}</div>;
}
