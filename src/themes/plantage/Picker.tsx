// The streamer as the mango picker on the full-screen scenes: figure with straw hat, shirt, picking pole and basket.
// Starting: reaches up with the pole, BRB: picks (pole swings, a mango drops into the basket), Ending: the basket is
// full and the picker waves. Name tag from {channel}. Colors and size come from the settings, the motion from the CSS.
import type { ScreenKind } from "../../core/screens/screens.ts";
import { circle } from "./field.ts";
import { usePlantage } from "./usePlantage.ts";

// fixed: shapes of the figure in its own 200 x 320 space
const SHAPE = {
  hat: "M40 70 C40 40 70 26 100 26 C130 26 160 40 160 70 Z M14 74 C40 60 160 60 186 74 C160 86 40 86 14 74 Z",
  band: "M42 64 C70 56 130 56 158 64 L158 72 C130 64 70 64 42 72 Z",
  head: circle(100, 104, 30),
  shirt: "M58 140 C70 130 130 130 142 140 L156 230 L44 230 Z",
  arm: "M136 150 C150 130 160 110 168 88 L180 94 C172 118 160 140 146 160 Z",
  otherArm: "M62 150 C50 170 46 190 52 210 L64 206 C60 190 62 172 72 158 Z",
  legs: "M60 230 L72 312 L92 312 L98 236 L102 236 L108 312 L128 312 L140 230 Z",
  pole: "M170 96 L196 -60",
  hook: "M196 -60 C206 -64 210 -52 202 -46",
  basket: "M4 236 L76 236 L66 300 L14 300 Z",
  weave: "M8 254 L72 254 M10 272 L70 272 M12 290 L68 290 M24 236 L28 300 M40 236 L40 300 M56 236 L52 300",
  face: "M88 100 L88 104 M112 100 L112 104 M90 116 Q100 124 110 116",
};
const BASKET_MANGOS = [[20, 232], [38, 226], [56, 232], [30, 218], [48, 214]];

export default function Picker({ kind }: { kind: ScreenKind }) {
  const values = usePlantage();
  const full = kind === "ending";
  return (
    <div className={`pl-picker pl-picker-${values.pickerSide} pl-picker-${kind}`} aria-hidden="true">
      <svg className="pl-picker-figure" viewBox="0 -70 210 390">
        <path className="pl-picker-pole" d={`${SHAPE.pole} ${SHAPE.hook}`} />
        <path className="pl-picker-legs" d={SHAPE.legs} />
        <path className="pl-picker-shirt" d={`${SHAPE.shirt} ${SHAPE.otherArm}`} />
        <g className="pl-picker-arm"><path className="pl-picker-shirt" d={SHAPE.arm} /></g>
        <path className="pl-picker-skin" d={SHAPE.head} />
        <path className="pl-picker-face" d={SHAPE.face} />
        <path className="pl-picker-hat" d={SHAPE.hat} />
        <path className="pl-picker-band" d={SHAPE.band} />
        {(full ? BASKET_MANGOS : BASKET_MANGOS.slice(0, 2)).map(([x, y], index) => (
          <ellipse key={index} className="pl-picker-mango" cx={x} cy={y} rx="11" ry="14" />
        ))}
        {kind === "brb" && <ellipse className="pl-picker-mango pl-picker-falling" cx="196" cy="-40" rx="11" ry="14" />}
        <path className="pl-picker-basket" d={SHAPE.basket} />
        <path className="pl-picker-weave" d={SHAPE.weave} />
      </svg>
      <span className="pl-picker-name">{values.channelName}</span>
    </div>
  );
}
