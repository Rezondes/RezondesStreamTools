// A mango soldier as a cartoon SVG: mango with blush, leaf, helmet and the weapon of its role (mangos.ts), face with eyes,
// cheeks and mouth; lying (down) it gets cross eyes. Colors via CSS (settings), the action on the minime controls the rest.
import { findRole, MANGO } from "./mangos.ts";

export default function Mango({ role, faces, down }: { role: string; faces: boolean; down: boolean }) {
  const weapon = findRole(role).weapon;
  const { x, y, size } = MANGO.face;
  return (
    <svg className={`pl-mango role-${role}`} viewBox="0 -4 110 104" aria-hidden="true">
      <path className="mango-leaf" d={MANGO.leaf} />
      <path className="mango-body" d={MANGO.body} />
      <path className="mango-blush" d={MANGO.blush} />
      <path className="mango-helmet" d={MANGO.helmet} />
      <path className="mango-strap" d={MANGO.strap} />
      {faces && (
        <g className="mango-face" transform={`translate(${x} ${y}) scale(${size})`}>
          <ellipse className="mango-cheek" cx="-15" cy="7" rx="5" ry="3.5" />
          <ellipse className="mango-cheek" cx="15" cy="7" rx="5" ry="3.5" />
          {down
            ? <path className="mango-cross" d="M-14 -8 L-6 0 M-6 -8 L-14 0 M6 -8 L14 0 M14 -8 L6 0" />
            : <g className="mango-eyes"><ellipse className="mango-eye" cx="-10" cy="-4" rx="3.4" ry="4.6" /><ellipse className="mango-eye" cx="10" cy="-4" rx="3.4" ry="4.6" /></g>}
          <path className="mango-mouth" d={down ? "M-5 9 Q0 5 5 9" : "M-6 6 Q0 12 6 6"} />
        </g>
      )}
      <g className="mango-weapon">
        {weapon.map((part, index) => <path key={index} className={`weapon-${part.kind}`} d={part.d} />)}
      </g>
    </svg>
  );
}
