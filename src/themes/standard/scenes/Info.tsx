// Befehlsseite des Standard-Themes (öffentlich unter /s/<login>/): Titel mit Verlauf, je Abschnitt eine Karte mit den
// Befehlen als Chips, Erklärung und Details. Texte aus den Einstellungen (INFO_FIELDS), Liste aus useCommands.
// Das Standard-Theme hat keine Minimes, darum zeigt die Demo nur Hilfe und Trigger.
import { useCommands } from "../../../core/hooks/useCommands.ts";
import { describeCommands } from "../../../core/infoFields.ts";
import { fillTemplate } from "../../../core/template.ts";
import { standardNames, useStandard } from "../useStandard.ts";

export default function Info() {
  const values = useStandard();
  const list = useCommands(null);
  if (!list) return null;
  const sections = describeCommands(list, values);
  return (
    <div className="standard-info">
      <main className="standard-info-column">
        <h1 className="standard-info-title">{values.infoTitle}</h1>
        <p className="standard-muted">{fillTemplate(values.infoIntro, standardNames(values))}</p>
        {sections.length === 0 && <p className="standard-card standard-info-card">{values.infoEmpty}</p>}
        {sections.map(section => (
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
