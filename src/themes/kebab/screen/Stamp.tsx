// A round stamp printed onto its paper (DESIGN-KEBAB.md "Bewegung"): a double ring in the red for text with the text
// in the title font. It sits inside the paper and blends with it (multiply), so it moves, tilts and fades with the
// paper; the GSAP timeline of the scene lets it hit (class kb-stamp).
export default function Stamp({ text }: { text: string }) {
  return <div className="kb-stamp"><span>{text}</span></div>;
}
