// Befehlsseite des Matrix-Themes (öffentlich unter /s/<login>/): Terminal-Spalte über dem Matrix-Regen, je Abschnitt
// eine Überschrift und je Befehl eine Zeile mit Erklärung und Details. Liste, Texte und Einleitung kommen aus dem
// Info-Kontext des Kerns (useInfoPage), hier nur das Matrix-Aussehen.
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
