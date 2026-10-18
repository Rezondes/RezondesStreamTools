// Commands page of the KOTH theme (public under /s/<login>/): the hill at the chosen time of day stays fixed in the
// background, in front of it briefing sheets with the commands (roles and factions of the soldiers). List, texts and
// intro come from the info context of the core (useInfoPage), here only the military look.
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import Hill, { type TimeOfDay } from "../Hill.tsx";
import { kothSettings } from "../settings.ts";
import { kothNames, useKoth } from "../useKoth.ts";

export default function Info() {
  const values = useKoth();
  const page = useInfoPage(values, kothNames(values), readMinimeOptions(values, kothSettings.minimeVariants, kothSettings.minimeTeams).rules);
  if (!page) return null;
  return (
    <div className="kh-info">
      <div className="kh-info-backdrop"><Hill time={values.timeInfo as TimeOfDay} /></div>
      <main className="kh-info-column">
        <header className="kh-sheet kh-info-sign">
          <h1 className="kh-title">{page.title}</h1>
          <p>{page.intro}</p>
        </header>
        {page.sections.length === 0 && <p className="kh-sheet kh-info-board">{page.empty}</p>}
        {page.sections.map(section => (
          <section key={section.id} className="kh-sheet kh-info-board">
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
