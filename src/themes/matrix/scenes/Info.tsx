// Commands page of the matrix theme (public under /s/<login>/): terminal column over the matrix rain, per section
// a heading and per command a line with explanation and details. List, texts and intro come from the
// info context of the core (useInfoPage), here only the matrix look.
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import MatrixRain from "../MatrixRain.tsx";
import { placeholders, useMatrix } from "../useMatrix.ts";

export default function Info() {
  const values = useMatrix();
  const page = useInfoPage(values, placeholders(values), readMinimeOptions(values).rules);
  if (!page) return null;
  return (
    <div className="matrix-info">
      {values.infoRain && <div className="matrix-info-rain"><MatrixRain size={values.rainSizeScreens} opacity={values.rainOpacityScreens} /></div>}
      <main className="matrix-info-column">
        <h1 className="glow">{page.title}</h1>
        <p className="muted">{page.intro}</p>
        {page.sections.length === 0 && <p>{page.empty}</p>}
        {page.sections.map(section => (
          <section key={section.id} className="matrix-info-section">
            <h2>{section.heading}</h2>
            {section.entries.map((entry, index) => (
              <article key={index} className="matrix-info-entry">
                {entry.command && <code className="glow">{entry.command}</code>}
                {entry.text && <p>{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="muted">{detail}</p>)}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
