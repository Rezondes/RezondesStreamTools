// Mission report of the KOTH Ending: a paper card with the title, the lines of the setting with the real numbers of the
// stream counting up (countedStats of the core, dashes without stats) and the stamp that hits at the end.
import type { CSSProperties } from "react";
import type { StatRow } from "../../../core/stats/stats.ts";
import { nail, outCubic, type Steps, stepShare } from "../build.ts";

type Props = { time: number; steps: Steps; title: string; rows: readonly StatRow[]; stamp: string };

// fixed: the card slides in from the left, the stamp hits from twice its size
const SLIDE = 60;
const STAMP_SCALE = 2;

export default function Report({ time, steps, title, rows, stamp }: Props) {
  const shown = outCubic(stepShare(steps.report, time));
  const hit = stepShare(steps.stamp, time);
  const card = { opacity: shown, transform: `translateX(${(shown - 1) * SLIDE}px) rotate(-1.5deg)` } as CSSProperties;
  return (
    <div className="kh-report" style={card}>
      <h2 className="kh-report-title">{title}</h2>
      {rows.map((row, index) => (
        <p key={index} className="kh-report-row" style={{ opacity: stepShare(steps.rows, time, index) > 0 ? 1 : 0 }}>
          <span>{row.label}</span><b>{row.value}</b>
        </p>
      ))}
      {stamp && (
        <b className="kh-report-stamp" style={{ opacity: hit > 0 ? 1 : 0, transform: `rotate(-12deg) scale(${STAMP_SCALE - (STAMP_SCALE - 1) * nail(hit)})` }}>{stamp}</b>
      )}
    </div>
  );
}
