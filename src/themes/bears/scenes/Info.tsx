// Commands page of the Bärenbande theme (public under /s/<login>/): the watercolor world at the chosen time of day stays
// fixed in the background, in front of it paper cards with the commands, the chosen bear (or the tower) waves in the
// header. List, texts and intro come from the info context of the core (useInfoPage), here only the look.
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import type { BearId, PoseName } from "../bears.ts";
import Hero from "../Hero.tsx";
import { bearsNames, useBears } from "../useBears.ts";
import World, { type TimeOfDay } from "../World.tsx";

const POSES: Record<BearId, PoseName> = { eisbaer: "wave", grizzly: "wave", panda: "wave" };

export default function Info() {
  const values = useBears();
  const page = useInfoPage(values, bearsNames(values), null);
  if (!page) return null;
  return (
    <div className={`bb-info bb-facing-${values.facing} ${values.blinkEvery > 0 ? "bb-blinking" : ""}`}>
      <div className="bb-info-backdrop"><World time={values.timeInfo as TimeOfDay} /></div>
      <main className="bb-info-column">
        <header className="bb-info-head">
          <div className="bb-info-bear"><Hero choice={values.bearInfo} poses={POSES} className="bb-hero" /></div>
          <div className="bb-card bb-info-sign">
            <h1 className="bb-title">{page.title}</h1>
            <p>{page.intro}</p>
          </div>
        </header>
        {page.sections.length === 0 && <p className="bb-card bb-info-board">{page.empty}</p>}
        {page.sections.map(section => (
          <section key={section.id} className="bb-card bb-info-board">
            <h2 className="bb-eyebrow bb-pill">{section.heading}</h2>
            {section.entries.map((entry, index) => (
              <article key={index} className="bb-info-entry">
                {entry.command && <b className="bb-info-command">{entry.command}</b>}
                {entry.text && <p>{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="bb-info-detail">{detail}</p>)}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
