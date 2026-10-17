// Commands page of the standard theme (public under /s/<login>/): title with gradient, per section a card with the
// commands as chips, explanation and details. List, texts and intro come from the info context of the core
// (useInfoPage). The standard theme has no minimes, so the demo only shows help and triggers.
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { standardNames, useStandard } from "../useStandard.ts";

export default function Info() {
  const values = useStandard();
  const page = useInfoPage(values, standardNames(values), null);
  if (!page) return null;
  return (
    <div className="standard-info">
      <main className="standard-info-column">
        <h1 className="standard-info-title">{page.title}</h1>
        <p className="standard-muted">{page.intro}</p>
        {page.sections.length === 0 && <p className="standard-card standard-info-card">{page.empty}</p>}
        {page.sections.map(section => (
          <section key={section.id} className="standard-card standard-info-card">
            <h2 className="standard-eyebrow">{section.heading}</h2>
            {section.entries.map((entry, index) => (
              <article key={index} className="standard-info-entry">
                {entry.command && <span className="standard-chip">{entry.command}</span>}
                {entry.text && <p className="standard-line">{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="standard-muted">{detail}</p>)}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
