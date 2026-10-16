// Befehlsseite des Matrix-Themes (öffentlich unter /s/<login>/): Terminal-Spalte über dem Matrix-Regen, je Abschnitt
// eine Überschrift und je Befehl eine Zeile mit Erklärung und Details. Texte aus den Einstellungen (INFO_FIELDS),
// Liste aus dem Kern-Hook useCommands.
import { useCommands } from "../../../core/hooks/useCommands.ts";
import { describeCommands } from "../../../core/infoFields.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { fillTemplate } from "../../../core/template.ts";
import MatrixRain from "../MatrixRain.tsx";
import { placeholders, useMatrix } from "../useMatrix.ts";

export default function Info() {
  const values = useMatrix();
  const list = useCommands(readMinimeOptions(values).rules);
  if (!list) return null;
  const sections = describeCommands(list, values);
  return (
    <div className="matrix-info">
      {values.infoRain && <div className="matrix-info-rain"><MatrixRain size={values.rainSizeScreens} opacity={values.rainOpacityScreens} /></div>}
      <main className="matrix-info-column">
        <h1 className="glow">{values.infoTitle}</h1>
        <p className="muted">{fillTemplate(values.infoIntro, placeholders(values))}</p>
        {sections.length === 0 && <p>{values.infoEmpty}</p>}
        {sections.map(section => (
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
