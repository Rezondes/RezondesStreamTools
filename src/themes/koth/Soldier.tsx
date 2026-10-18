// A soldier as a small SVG figure from the side: legs, torso in the faction color (--team), belt, sleeve, head, helmet, an
// eye and the weapon of its role (soldiers.ts); lying (down) the eye becomes a cross. Colors via CSS (settings), the
// action on the minime controls the rest.
import { findRole, SOLDIER } from "./soldiers.ts";

export default function Soldier({ role, faces, down }: { role: string; faces: boolean; down: boolean }) {
  const weapon = findRole(role).weapon;
  const { x, y } = SOLDIER.eye;
  return (
    <svg className={`kh-soldier role-${role}`} viewBox="0 0 90 120" aria-hidden="true">
      <path className="soldier-legs" d={SOLDIER.legs} />
      <g className="soldier-upper">
        <path className="soldier-torso" d={SOLDIER.torso} />
        <path className="soldier-belt" d={SOLDIER.belt} />
        <path className="soldier-skin" d={SOLDIER.head} />
        {faces && (down
          ? <path className="soldier-cross" d={`M${x - 3} ${y - 3} L${x + 3} ${y + 3} M${x + 3} ${y - 3} L${x - 3} ${y + 3}`} />
          : <ellipse className="soldier-eye" cx={x} cy={y} rx="2" ry="2.6" />)}
        <path className="soldier-helmet" d={SOLDIER.helmet} />
        <g className="soldier-weapon">
          {weapon.map((part, index) => <path key={index} className={`weapon-${part.kind}`} d={part.d} />)}
          <path className="soldier-torso soldier-sleeve" d={SOLDIER.sleeve} />
        </g>
      </g>
    </svg>
  );
}
