// Commands page of the Dachdecker theme (public under /s/<login>/): a blueprint sheet with millimetre grid, the title in
// terracotta, the intro and per section a sign with the commands, explanation and details. List, texts and intro come
// from the info context of the core (useInfoPage).
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import PlanSign from "../plan/PlanSign.tsx";
import { dachdeckerNames, useDachdecker } from "../useDachdecker.ts";

export default function Info() {
  const values = useDachdecker();
  const page = useInfoPage(values, dachdeckerNames(values, Date.now()), null);
  if (!page) return null;
  return (
    <div className="dd-info">
      <main className="dd-info-column">
        <h1 className="dd-info-title">{page.title}</h1>
        <p className="dd-info-intro">{page.intro}</p>
        {page.sections.length === 0 && <PlanSign className="dd-info-card">{page.empty}</PlanSign>}
        {page.sections.map(section => (
          <PlanSign key={section.id} className="dd-info-card">
            <h2 className="dd-info-heading">{section.heading}</h2>
            {section.entries.map((entry, row) => (
              <article key={row} className="dd-info-entry">
                {entry.command && <span className="dd-chip">{entry.command}</span>}
                {entry.text && <p className="dd-info-text">{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="dd-info-detail">{detail}</p>)}
              </article>
            ))}
          </PlanSign>
        ))}
      </main>
    </div>
  );
}
