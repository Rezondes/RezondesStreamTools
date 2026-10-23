// Commands page of the Kebab theme (public under /s/<login>/): a menu on paper with the title in the title font, the
// intro and per section a bon with the commands as dishes, a dashed line from the explanation to the command on the
// right, and the details below. List, texts and intro come from the info context of the core (useInfoPage).
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { kebabNames, useKebab } from "../useKebab.ts";

export default function Info() {
  const values = useKebab();
  const page = useInfoPage(values, kebabNames(values), null);
  if (!page) return null;
  return (
    <div className="kb-info">
      <main className="kb-info-column">
        <h1 className="kb-info-title">{page.title}</h1>
        <p className="kb-info-intro">{page.intro}</p>
        {page.sections.length === 0 && <section className="kb-info-card">{page.empty}</section>}
        {page.sections.map(section => (
          <section key={section.id} className="kb-info-card">
            <h2 className="kb-info-heading">{section.heading}</h2>
            {section.entries.map((entry, row) => (
              <article key={row} className="kb-info-entry">
                <p className="kb-info-dish">
                  <span className="kb-info-text">{entry.text}</span>
                  <i className="kb-info-dots" aria-hidden="true" />
                  {entry.command && <b className="kb-info-command">{entry.command}</b>}
                </p>
                {entry.details.map(detail => <p key={detail} className="kb-info-detail">{detail}</p>)}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
