// The streamer as the mango picker on the full-screen scenes, drawn like the backdrop (Field.tsx): no outlines, every
// part in a light and a shade tone with the light from the upper left, a soft shadow on the soil. Straw hat with a band,
// shirt, trousers and boots, a bamboo picking pole and a woven basket with glossy mangos.
// Starting: reaches up with the pole, BRB: picks (pole swings, a mango drops into the basket), Ending: the basket is full
// and the picker waves. Name tag from {channel}. Colors and size come from the settings, the motion from the CSS.
import type { ScreenKind } from "../../core/screens/screens.ts";
import { usePlantage } from "./usePlantage.ts";

// fixed: shapes of the figure in its own 260 x 420 space (ground at y 410)
const SHAPE = {
  legs: "M104 300 L98 396 L122 396 L128 314 L134 314 L140 396 L164 396 L158 300 Z",
  legsShade: "M134 314 L140 396 L164 396 L158 300 L131 300 Z",
  boots: "M96 392 L124 392 L124 408 L86 408 C86 400 90 394 96 392 Z M138 392 L166 392 C174 395 178 401 178 408 L138 408 Z",
  torso: "M96 198 C96 180 166 180 166 198 L172 306 L90 306 Z",
  torsoShade: "M131 186 C150 186 166 190 166 198 L172 306 L131 306 Z",
  belt: "M90 296 L172 296 L172 306 L90 306 Z",
  collar: "M118 184 L131 206 L144 184 Z",
  backArm: "M98 202 C84 222 80 252 84 278 L98 278 C96 254 100 230 108 212 Z",
  neck: "M122 170 L140 170 L140 188 L122 188 Z",
  raisedArm: "M154 194 C170 176 184 150 192 128 L208 134 C200 162 186 192 166 210 Z",
  raisedArmShade: "M200 131 L208 134 C200 162 186 192 166 210 L160 202 C178 186 192 160 200 131 Z",
  face: "M131 120 C148 120 161 133 161 150 C161 168 148 181 131 181 C114 181 101 168 101 150 C101 133 114 120 131 120 Z",
  faceShade: "M131 120 C148 120 161 133 161 150 C161 168 148 181 131 181 C142 172 147 162 147 150 C147 138 142 128 131 120 Z",
  brim: "M67 128 C67 118 96 112 131 112 C166 112 195 118 195 128 C195 138 166 144 131 144 C96 144 67 138 67 128 Z",
  brimShade: "M67 128 C67 138 96 144 131 144 C166 144 195 138 195 128 C185 134 160 137 131 137 C102 137 77 134 67 128 Z",
  crown: "M100 128 C100 100 112 88 131 88 C150 88 162 100 162 128 Z",
  crownShade: "M131 88 C150 88 162 100 162 128 L140 128 C146 110 142 96 131 88 Z",
  band: "M100 116 C120 120 142 120 162 116 L162 126 C142 130 120 130 100 126 Z",
  weave: "M106 104 L156 104 M103 116 L159 116 M80 128 L182 128",
  basket: "M48 282 L120 282 L112 342 C100 354 68 354 56 342 Z",
  basketShade: "M84 282 L120 282 L112 342 C104 350 94 353 84 354 Z",
  basketWeave: "M52 300 L116 300 M54 318 L114 318 M58 336 L110 336 M66 282 L68 350 M84 282 L84 354 M102 282 L100 350",
  handle: "M54 282 C58 248 110 248 114 282",
  pole: "M178 244 L236 8",
  poleNodes: "M193 184 L201 186 M207 128 L215 130 M221 72 L229 74",
  hook: "M236 8 C246 4 252 16 244 22",
};
// fixed: mangos on the basket rim (a few while picking, a heap at the end)
const FEW = [[70, 278], [92, 276]];
const HEAP = [[60, 280], [76, 272], [92, 276], [108, 280], [68, 264], [86, 260], [102, 266]];

export default function Picker({ kind }: { kind: ScreenKind }) {
  const values = usePlantage();
  const ending = kind === "ending";
  return (
    <div className={`pl-picker pl-picker-${values.pickerSide} pl-picker-${kind}`} aria-hidden="true">
      <svg className="pl-picker-figure" viewBox="0 0 260 420">
        <defs>
          <radialGradient id="pl-picker-mango" cx="0.35" cy="0.3" r="0.8">
            <stop className="pl-stop-gloss" offset="0" />
            <stop className="pl-stop-mango" offset="0.35" />
            <stop className="pl-stop-blush" offset="1" />
          </radialGradient>
        </defs>
        <ellipse className="pl-picker-shadow" cx="132" cy="410" rx="92" ry="12" />
        <path className="pl-picker-pants" d={SHAPE.legs} />
        <path className="pl-picker-pants-shade" d={SHAPE.legsShade} />
        <path className="pl-picker-boots" d={SHAPE.boots} />
        <path className="pl-picker-shirt" d={SHAPE.backArm} />
        <circle className="pl-picker-skin" cx="91" cy="284" r="9" />
        <path className="pl-picker-shirt" d={SHAPE.torso} />
        <path className="pl-picker-shirt-shade" d={SHAPE.torsoShade} />
        <path className="pl-picker-belt" d={SHAPE.belt} />
        <path className="pl-picker-skin-shade" d={SHAPE.neck} />
        <path className="pl-picker-skin" d={SHAPE.collar} />
        <g className="pl-picker-arm">
          {!ending && <path className="pl-picker-pole" d={`${SHAPE.pole} ${SHAPE.hook}`} />}
          {!ending && <path className="pl-picker-pole-nodes" d={SHAPE.poleNodes} />}
          <path className="pl-picker-shirt" d={SHAPE.raisedArm} />
          <path className="pl-picker-shirt-shade" d={SHAPE.raisedArmShade} />
          <circle className="pl-picker-skin" cx="201" cy="126" r="10" />
        </g>
        <Head />
        {kind === "brb" && <ellipse className="pl-picker-falling" cx="236" cy="30" rx="10" ry="13" fill="url(#pl-picker-mango)" />}
        {(ending ? HEAP : FEW).map(([x, y], index) => (
          <ellipse key={index} cx={x} cy={y} rx="11" ry="13" fill="url(#pl-picker-mango)" />
        ))}
        <path className="pl-picker-handle" d={SHAPE.handle} />
        <path className="pl-picker-basket" d={SHAPE.basket} />
        <path className="pl-picker-basket-shade" d={SHAPE.basketShade} />
        <path className="pl-picker-weave" d={SHAPE.basketWeave} />
      </svg>
      <span className="pl-picker-name">{values.channelName}</span>
    </div>
  );
}

// Face with soft shading, cheeks, eyes and a smile under a straw hat with band and weave
function Head() {
  return (
    <g>
      <circle className="pl-picker-skin-shade" cx="102" cy="154" r="7" />
      <path className="pl-picker-skin" d={SHAPE.face} />
      <path className="pl-picker-skin-shade" d={SHAPE.faceShade} />
      <ellipse className="pl-picker-cheek" cx="118" cy="162" rx="7" ry="4.5" />
      <ellipse className="pl-picker-cheek" cx="146" cy="162" rx="6" ry="4" />
      <ellipse className="pl-picker-eye" cx="121" cy="150" rx="3" ry="4" />
      <ellipse className="pl-picker-eye" cx="142" cy="150" rx="3" ry="4" />
      <path className="pl-picker-line" d="M133 155 C137 160 135 163 131 163 M122 169 C127 174 136 174 141 169" />
      <path className="pl-picker-hat" d={SHAPE.brim} />
      <path className="pl-picker-hat-shade" d={SHAPE.brimShade} />
      <path className="pl-picker-hat" d={SHAPE.crown} />
      <path className="pl-picker-hat-shade" d={SHAPE.crownShade} />
      <path className="pl-picker-band" d={SHAPE.band} />
      <path className="pl-picker-hat-weave" d={SHAPE.weave} />
    </g>
  );
}
