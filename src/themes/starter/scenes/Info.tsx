// Befehlsseite des Starter-Themes (öffentlich unter /s/<login>/): Titel mit Verlauf, je Abschnitt eine Karte mit den
// Befehlen als Chips, Erklärung und Details. Texte aus den Einstellungen (INFO_FIELDS), Liste aus useCommands.
// Das Starter-Theme hat keine Minimes, darum zeigt die Demo nur Hilfe und Trigger.
import { useCommands } from "../../../core/hooks/useCommands.ts";
import { describeCommands } from "../../../core/infoFields.ts";
import { fillTemplate } from "../../../core/template.ts";
import { starterNames, useStarter } from "../useStarter.ts";

export default function Info() {
  const values = useStarter();
  const list = useCommands(null);
  if (!list) return null;
  const sections = describeCommands(list, values);
  return (
    <div className="starter-info">
      <main className="starter-info-column">
        <h1 className="starter-info-title">{values.infoTitle}</h1>
        <p className="starter-muted">{fillTemplate(values.infoIntro, starterNames(values))}</p>
        {sections.length === 0 && <p className="starter-card starter-info-card">{values.infoEmpty}</p>}
        {sections.map(section => (
          <section key={section.id} className="starter-card starter-info-card">
            <h2 className="starter-eyebrow">{section.heading}</h2>
            {section.entries.map((entry, index) => (
              <article key={index} className="starter-info-entry">
                {entry.command && <span className="starter-chip">{entry.command}</span>}
                {entry.text && <p className="starter-line">{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="starter-muted">{detail}</p>)}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
