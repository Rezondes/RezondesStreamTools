// Dimension line of the Dachdecker overlays (DESIGN-DACHDECKER.md "Masslinie"): a thin white line with end strokes and
// slashes at both ends, the text in copper above it. It draws itself from the middle outwards (theme CSS).
const WIDTH = 1000;
const HEIGHT = 24;
const MIDDLE = HEIGHT / 2;
const SLASH = 7;

export default function DimensionLine({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`dd-dimension ${className}`}>
      {text && <span className="dd-dimension-text">{text}</span>}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
        <line className="dd-dimension-half" x1={WIDTH / 2} y1={MIDDLE} x2={0} y2={MIDDLE} pathLength={1} />
        <line className="dd-dimension-half" x1={WIDTH / 2} y1={MIDDLE} x2={WIDTH} y2={MIDDLE} pathLength={1} />
        {[0, WIDTH].map(x => (
          <g key={x} className="dd-dimension-end">
            <line x1={x} y1={0} x2={x} y2={HEIGHT} />
            <line x1={x - SLASH} y1={MIDDLE + SLASH} x2={x + SLASH} y2={MIDDLE - SLASH} />
          </g>
        ))}
      </svg>
    </div>
  );
}
