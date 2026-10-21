// Acceptance protocol of the Dachdecker Ending (DESIGN-DACHDECKER.md "Szenen"): a plan sheet on the left with millimetre
// grid, white edge and terracotta corner marks, the title in copper and one row per line of the setting with its number
// in terracotta (rows from protocol.ts). It slides in from the left and shakes once when the stamp hits.
import type { CSSProperties } from "react";
import type { ProtocolRow } from "../protocol.ts";

type Props = { title: string; rows: readonly ProtocolRow[]; shown: number; shake: number };

export default function Protocol({ title, rows, shown, shake }: Props) {
  return (
    <section className="dd-protocol dd-sheet" style={{ opacity: shown, "--slide": 1 - shown, "--shake": shake } as CSSProperties}>
      {title && <h2>{title}</h2>}
      {rows.map((row, index) => (
        <p key={index} className="dd-protocol-row"><span>{row.label}</span><b>{row.value}</b></p>
      ))}
    </section>
  );
}
