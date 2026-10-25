// Commands page of the Plantage theme (public under /s/<login>/): the mango field at the chosen time of day stays fixed in
// the background, in front of it frosted paper cards with the commands (roles of the mango soldiers as minime variants).
// List, texts and intro come from the info context of the core (useInfoPage), here only the plantation look.
import { useRef } from "react";
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import WorldBackdrop from "../pixi/WorldBackdrop.tsx";
import { kindOfTime } from "../world.ts";
import { plantageSettings } from "../settings.ts";
import { plantageNames, usePlantage } from "../usePlantage.ts";

// fixed: the curve of the dropping cards; their fall, turn and times come from the settings
const DROP_EASE = "bounce.out";

export default function Info() {
  const values = usePlantage();
  const page = useInfoPage(values, plantageNames(values), readMinimeOptions(values, plantageSettings.minimeVariants).rules);
  const column = useRef<HTMLElement>(null);
  useTimeline(timeline => {
    const cards = column.current?.querySelectorAll(":scope > .pl-card");
    if (cards?.length) timeline.from(cards, { opacity: 0, y: values.infoDropFall, rotate: values.infoDropTurn, duration: values.infoDropLength, ease: DROP_EASE, stagger: values.infoDropStep });
  }, [page?.sections.length ?? 0, values.infoDropFall, values.infoDropTurn, values.infoDropLength, values.infoDropStep], column);
  if (!page) return null;
  return (
    <div className="pl-info">
      <div className="pl-info-backdrop"><WorldBackdrop values={values} kind={kindOfTime(values.timeInfo)} /></div>
      <main ref={column} className="pl-info-column">
        <header className="pl-card pl-info-sign">
          <h1 className="pl-title">{page.title}</h1>
          <p>{page.intro}</p>
        </header>
        {page.sections.length === 0 && <p className="pl-card pl-info-board">{page.empty}</p>}
        {page.sections.map(section => (
          <section key={section.id} className="pl-card pl-info-board">
            <h2 className="pl-eyebrow">{section.heading}</h2>
            {section.entries.map((entry, index) => (
              <article key={index} className="pl-info-entry">
                {entry.command && <b className="pl-info-command">{entry.command}</b>}
                {entry.text && <p>{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="pl-info-detail">{detail}</p>)}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
