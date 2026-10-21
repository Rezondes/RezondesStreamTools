// Progress of the Dachdecker countdown as a dimension chain (DESIGN-DACHDECKER.md "Masslinie"): a thin white line with
// end strokes and slashes, a tick every tenth, and the part already gone drawn over it in terracotta.
const WIDTH = 640;
const HEIGHT = 40;
const MIDDLE = HEIGHT / 2;
const END = 12;
const SLASH = 6;
const TICK = 5;
const TICKS = 10;

export default function Progress({ share }: { share: number }) {
  const reach = Math.min(1, Math.max(0, share)) * WIDTH;
  const ends = [0, WIDTH];
  return (
    <svg className="dd-progress" viewBox={`${-END} 0 ${WIDTH + 2 * END} ${HEIGHT}`} aria-hidden="true">
      <line className="dd-dim" x1={0} y1={MIDDLE} x2={WIDTH} y2={MIDDLE} />
      {ends.map(x => <line key={`end ${x}`} className="dd-dim" x1={x} y1={MIDDLE - END} x2={x} y2={MIDDLE + END} />)}
      {ends.map(x => <line key={`slash ${x}`} className="dd-dim" x1={x - SLASH} y1={MIDDLE + SLASH} x2={x + SLASH} y2={MIDDLE - SLASH} />)}
      {Array.from({ length: TICKS - 1 }, (_, index) => {
        const x = ((index + 1) * WIDTH) / TICKS;
        return <line key={`tick ${index}`} className="dd-dim dd-tick" x1={x} y1={MIDDLE - TICK} x2={x} y2={MIDDLE + TICK} />;
      })}
      <line className="dd-dim-done" x1={0} y1={MIDDLE} x2={reach} y2={MIDDLE} />
    </svg>
  );
}
