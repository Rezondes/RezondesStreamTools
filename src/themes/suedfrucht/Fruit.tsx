// A fruit as a cartoon SVG: shape from fruits.ts, colors via CSS (class fruit-<id>, settings), face with
// eyes, cheeks, mouth and sunglasses at the spot the fruit defines. The action (class on the minime) controls
// blinking, sleeping and sunglasses.
import { findFruit } from "./fruits.ts";

export default function Fruit({ id, faces }: { id: string; faces: boolean }) {
  const fruit = findFruit(id);
  const { x, y, size } = fruit.face;
  return (
    <svg className={`sf-fruit fruit-${fruit.id}`} viewBox="0 -4 100 104" aria-hidden="true">
      {fruit.parts.map((part, index) => <path key={index} className={`fruit-${part.kind}`} d={part.d} />)}
      {faces && (
        <g className="fruit-face" transform={`translate(${x} ${y}) scale(${size})`}>
          <ellipse className="fruit-cheek" cx="-16" cy="6" rx="6" ry="4" />
          <ellipse className="fruit-cheek" cx="16" cy="6" rx="6" ry="4" />
          <g className="fruit-eyes">
            <ellipse className="fruit-eye" cx="-10" cy="-4" rx="3.6" ry="5" />
            <ellipse className="fruit-eye" cx="10" cy="-4" rx="3.6" ry="5" />
          </g>
          <path className="fruit-sleepy" d="M-14 -3 Q-10 0 -6 -3 M6 -3 Q10 0 14 -3" />
          <path className="fruit-mouth" d="M-6 6 Q0 12 6 6" />
          <ellipse className="fruit-snore" cx="0" cy="9" rx="3" ry="3.5" />
          <path className="fruit-glasses" d="M-19 -9 L-2 -9 L-3 1 Q-10 4 -17 1 Z M2 -9 L19 -9 L17 1 Q10 4 3 1 Z M-2 -7 L2 -7" />
        </g>
      )}
    </svg>
  );
}
