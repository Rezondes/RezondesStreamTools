// A pill of the sign layer (DESIGN-DOGS.md "Pillen"): a red pixel box with the paw sign and spaced capitals.
import PixelBox from "./PixelBox.tsx";

export default function Pill({ text, className = "" }: { text: string; className?: string }) {
  return (
    <PixelBox red className={`dg-pill ${className}`}>
      <i className="dg-paw" aria-hidden />
      {text}
    </PixelBox>
  );
}
