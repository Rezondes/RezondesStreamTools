// Befehlsseite des Südfrucht-Themes (öffentlich unter /s/<login>/): der Strand zur gewählten Tageszeit steht fest im
// Hintergrund, davor Holzschilder mit den Befehlen (Früchte als Typen der Minimes). Texte aus den Einstellungen
// (INFO_FIELDS), Liste aus dem Kern-Hook useCommands.
import { useCommands } from "../../../core/hooks/useCommands.ts";
import { describeCommands } from "../../../core/infoFields.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { fillTemplate } from "../../../core/template.ts";
import Beach, { type TimeOfDay } from "../Beach.tsx";
import { suedfruchtSettings } from "../settings.ts";
import { suedfruchtNames, useSuedfrucht } from "../useSuedfrucht.ts";

export default function Info() {
  const values = useSuedfrucht();
  const list = useCommands(readMinimeOptions(values, suedfruchtSettings.minimeVariants).rules);
  if (!list) return null;
  const sections = describeCommands(list, values);
  return (
    <div className="sf-info">
      <div className="sf-info-backdrop"><Beach time={values.timeInfo as TimeOfDay} /></div>
      <main className="sf-info-column">
        <header className="sf-wood sf-info-sign">
          <h1 className="sf-title">{values.infoTitle}</h1>
          <p>{fillTemplate(values.infoIntro, suedfruchtNames(values))}</p>
        </header>
        {sections.length === 0 && <p className="sf-wood sf-info-board">{values.infoEmpty}</p>}
        {sections.map(section => (
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
