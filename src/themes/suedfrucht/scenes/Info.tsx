// Commands page of the Südfrucht theme (public under /s/<login>/): the beach at the chosen time of day stays fixed in the
// background, in front of it wooden signs with the commands (fruits as minime variants). List, texts and intro come
// from the info context of the core (useInfoPage), here only the beach look.
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import Beach, { type TimeOfDay } from "../Beach.tsx";
import { suedfruchtSettings } from "../settings.ts";
import { suedfruchtNames, useSuedfrucht } from "../useSuedfrucht.ts";

export default function Info() {
  const values = useSuedfrucht();
  const page = useInfoPage(values, suedfruchtNames(values), readMinimeOptions(values, suedfruchtSettings.minimeVariants).rules);
  if (!page) return null;
  return (
    <div className="sf-info">
      <div className="sf-info-backdrop"><Beach time={values.timeInfo as TimeOfDay} /></div>
      <main className="sf-info-column">
        <header className="sf-wood sf-info-sign">
          <h1 className="sf-title">{page.title}</h1>
          <p>{page.intro}</p>
        </header>
        {page.sections.length === 0 && <p className="sf-wood sf-info-board">{page.empty}</p>}
        {page.sections.map(section => (
          <section key={section.id} className="sf-wood sf-info-board">
            <h2 className="sf-eyebrow">{section.heading}</h2>
            {section.entries.map((entry, index) => (
              <article key={index} className="sf-info-entry">
                {entry.command && <b className="sf-info-command">{entry.command}</b>}
                {entry.text && <p>{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="sf-info-detail">{detail}</p>)}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
