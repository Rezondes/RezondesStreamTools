// Commands page of the KOTH theme (public under /s/<login>/): the hill at the chosen time of day stays fixed in the
// background, in front of it briefing sheets with the commands (roles and factions of the soldiers). List, texts and
// intro come from the info context of the core (useInfoPage), here only the military look; the sheets drop in one after
// the other.
import { type CSSProperties, useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import WorldBackdrop, { kindOfTime } from "../three/WorldBackdrop.tsx";
import { kothSettings } from "../settings.ts";
import { kothNames, useKoth } from "../useKoth.ts";

// fixed: how the mission sheets drop in (px, deg, s, s between two, ease)
const DROP = { y: -60, turn: -2, length: 0.6, step: 0.12, ease: "back.out(2)" };

export default function Info() {
  const values = useKoth();
  const column = useRef<HTMLElement>(null);
  const page = useInfoPage(values, kothNames(values), readMinimeOptions(values, kothSettings.minimeVariants, kothSettings.minimeTeams).rules);
  useTimeline(timeline => {
    const sheets = column.current?.querySelectorAll(":scope > .kh-sheet");
    if (sheets?.length) timeline.from(sheets, { opacity: 0, y: DROP.y, rotate: DROP.turn, duration: DROP.length, ease: DROP.ease, stagger: DROP.step });
  }, [page?.sections.length ?? 0], column);
  if (!page) return null;
  return (
    <div className="kh-info">
      <div className="kh-info-backdrop"><WorldBackdrop values={values} kind={kindOfTime(values.timeInfo)} /></div>
      <main ref={column} className="kh-info-column">
        <header className="kh-sheet kh-info-sign">
          <h1 className="kh-title">{page.title}</h1>
          <p>{page.intro}</p>
        </header>
        {page.sections.length === 0 && <p className="kh-sheet kh-info-board">{page.empty}</p>}
        {page.sections.map((section, index) => (
          <section key={section.id} className="kh-sheet kh-info-board" style={{ "--i": index + 1 } as CSSProperties}>
            <h2 className="kh-eyebrow">{section.heading}</h2>
            {section.entries.map((entry, index) => (
              <article key={index} className="kh-info-entry">
                {entry.command && <b className="kh-info-command">{entry.command}</b>}
                {entry.text && <p>{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="kh-info-detail">{detail}</p>)}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
