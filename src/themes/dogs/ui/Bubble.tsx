// The speech bubble of the sign layer (DESIGN-DOGS.md "Sprechblase"): a pixel box with a stepped tail at the bottom
// left; the scene places it next to the head and sets its size every frame (boxRef).
import type { Ref } from "react";
import PixelBox from "./PixelBox.tsx";

export default function Bubble({ text, boxRef }: { text: string; boxRef: Ref<HTMLDivElement> }) {
  return <PixelBox className="dg-bubble" boxRef={boxRef}>{text}</PixelBox>;
}
