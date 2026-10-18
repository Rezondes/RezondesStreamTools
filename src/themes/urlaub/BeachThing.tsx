// A beach thing as a cartoon SVG: shape from beachThings.ts, colors via CSS (class thing-<id>, settings), face with
// eyes, cheeks, mouth and sunglasses at the spot the thing defines. The action (class on the minime) controls
// blinking, sleeping and sunglasses.
import { findThing } from "./beachThings.ts";

export default function BeachThing({ id, faces }: { id: string; faces: boolean }) {
  const thing = findThing(id);
  const { x, y, size } = thing.face;
  return (
    <svg className={`ul-thing thing-${thing.id}`} viewBox="0 -4 100 104" aria-hidden="true">
      {thing.parts.map((part, index) => <path key={index} className={`thing-${part.kind}`} d={part.d} />)}
      {faces && (
        <g className="thing-face" transform={`translate(${x} ${y}) scale(${size})`}>
          <ellipse className="thing-cheek" cx="-16" cy="6" rx="6" ry="4" />
          <ellipse className="thing-cheek" cx="16" cy="6" rx="6" ry="4" />
          <g className="thing-eyes">
            <ellipse className="thing-eye" cx="-10" cy="-4" rx="3.6" ry="5" />
            <ellipse className="thing-eye" cx="10" cy="-4" rx="3.6" ry="5" />
          </g>
          <path className="thing-sleepy" d="M-14 -3 Q-10 0 -6 -3 M6 -3 Q10 0 14 -3" />
          <path className="thing-mouth" d="M-6 6 Q0 12 6 6" />
          <ellipse className="thing-snore" cx="0" cy="9" rx="3" ry="3.5" />
          <path className="thing-glasses" d="M-19 -9 L-2 -9 L-3 1 Q-10 4 -17 1 Z M2 -9 L19 -9 L17 1 Q10 4 3 1 Z M-2 -7 L2 -7" />
        </g>
      )}
    </svg>
  );
}
