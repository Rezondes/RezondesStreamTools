// Commands page of the Chaos theme (public under /s/<login>/): the wall full of scribbles stands behind, in front of it the
// sprayed title, the intro and per section a note with the commands on tape, explanation and details. List, texts and
// intro come from the info context of the core (useInfoPage); the demo shows the minime commands from the own values.
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import PaintedWall from "../PaintedWall.tsx";
import Note, { inkOf } from "../Note.tsx";
import SprayTitle from "../SprayTitle.tsx";
import { chaosNames, useChaos } from "../useChaos.ts";

export default function Info() {
  const values = useChaos();
  const page = useInfoPage(values, chaosNames(values), readMinimeOptions(values).rules);
  if (!page) return null;
  return (
    <div className="ch-info">
      <div className="ch-info-wall"><PaintedWall seed="info" gesture="keine" mainColor="cyan" boilFps={values.boilFps} /></div>
      <main className="ch-info-column">
        <SprayTitle text={page.title} seed="info" className="ch-info-title" />
        <p className="ch-muted">{page.intro}</p>
        {page.sections.length === 0 && <Note className="ch-info-card">{page.empty}</Note>}
        {page.sections.map((section, index) => (
          <Note key={section.id} ink={inkOf(index)} tape className="ch-info-card">
            <h2 className="ch-eyebrow">{section.heading}</h2>
            {section.entries.map((entry, row) => (
              <article key={row} className="ch-info-entry">
                {entry.command && <span className="ch-chip">{entry.command}</span>}
                {entry.text && <p className="ch-info-text">{entry.text}</p>}
                {entry.details.map(detail => <p key={detail} className="ch-muted">{detail}</p>)}
              </article>
            ))}
          </Note>
        ))}
      </main>
    </div>
  );
}
