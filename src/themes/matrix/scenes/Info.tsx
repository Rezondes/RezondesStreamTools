// Commands page of the matrix theme (public under /s/<login>/): terminal column over the matrix rain, per section
// a heading and per command a line with explanation and details. List, texts and intro come from the
// info context of the core (useInfoPage), here only the matrix look. The lines type themselves one after the other
// like terminal output, the column glitches as it appears (infoType).
import { useRef } from "react";
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { GLITCH, glitchKeys, typeIn } from "../crtMotion.ts";
import Rain from "../pixi/Rain.tsx";
import { placeholders, useMatrix } from "../useMatrix.ts";

// fixed: how much later each line starts typing (s)
const INFO_STAGGER = 0.05;

export default function Info() {
  const values = useMatrix();
  const page = useInfoPage(values, placeholders(values), readMinimeOptions(values).rules);
  const scope = useRef<HTMLElement>(null);
  useTimeline(timeline => {
    const column = scope.current;
    if (!column || !values.infoType) return;
    timeline.to(column, { keyframes: glitchKeys(), duration: GLITCH.length }, 0);
    column.querySelectorAll("h1, h2, p, code").forEach((line, index) => typeIn(timeline, line, index * INFO_STAGGER, values.decodeSpeed));
  }, [page, values.infoType, values.decodeSpeed], scope);
  if (!page) return null;
  return (
    <div className="matrix-info">
      {values.infoRain && <div className="matrix-info-rain"><Rain opacity={values.rainOpacityScreens} /></div>}
      <main ref={scope} className="matrix-info-column">
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
