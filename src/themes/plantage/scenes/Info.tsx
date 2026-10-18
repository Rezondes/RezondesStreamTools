// Commands page of the Plantage theme (public under /s/<login>/): the mango field at the chosen time of day stays fixed in
// the background, in front of it wooden signs with the commands (roles of the mango soldiers as minime variants). List,
// texts and intro come from the info context of the core (useInfoPage), here only the plantation look.
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import Field, { type TimeOfDay } from "../Field.tsx";
import { plantageSettings } from "../settings.ts";
import { plantageNames, usePlantage } from "../usePlantage.ts";

export default function Info() {
  const values = usePlantage();
  const page = useInfoPage(values, plantageNames(values), readMinimeOptions(values, plantageSettings.minimeVariants).rules);
  if (!page) return null;
  return (
    <div className="pl-info">
      <div className="pl-info-backdrop"><Field time={values.timeInfo as TimeOfDay} /></div>
      <main className="pl-info-column">
        <header className="pl-wood pl-info-sign">
          <h1 className="pl-title">{page.title}</h1>
          <p>{page.intro}</p>
        </header>
        {page.sections.length === 0 && <p className="pl-wood pl-info-board">{page.empty}</p>}
        {page.sections.map(section => (
          <section key={section.id} className="pl-wood pl-info-board">
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
