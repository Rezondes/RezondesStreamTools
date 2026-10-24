// Commands page of the Dogs theme (public under /s/<login>/, DESIGN-DOGS.md "Befehlsseite"): the meadow (or cream) as
// background, at the top the streamer's dog next to the title, per section a pixel sign with a red pill as heading and
// the commands. List, texts and intro come from the info context of the core (useInfoPage).
import { useMemo } from "react";
import { useInfoPage } from "../../../core/info/useInfoPage.ts";
import { BREED_IDS, isBreed } from "../breeds.ts";
import { dogCache } from "../dog.ts";
import { dogLookOf } from "../looks.ts";
import { poseAt } from "../poses.ts";
import Pill from "../ui/Pill.tsx";
import Pixels from "../ui/Pixels.tsx";
import PixelBox from "../ui/PixelBox.tsx";
import { dogsNames, useDogs } from "../useDogs.ts";

export default function Info() {
  const values = useDogs();
  const page = useInfoPage(values, dogsNames(values), null);
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const dog = useMemo(() => dogCache(dogLookOf(values, breed, values.coat)).pose(poseAt({ time: 0, mode: "stand", fps: values.walkFps, wagSpeed: 0, blinkEvery: 0, pant: values.pant })), [values, breed]);
  if (!page) return null;
  return (
    <div className={`dg-info dg-info-${values.infoBackground}`}>
      <main className="dg-info-column">
        <header className="dg-info-head">
          <Pixels image={dog} className="dg-info-dog" pixelScale={values.pixelScale} />
          <h1 className="dg-info-title">{page.title}</h1>
        </header>
        <p className="dg-info-intro">{page.intro}</p>
        {page.sections.length === 0 && <PixelBox className="dg-info-card">{page.empty}</PixelBox>}
        {page.sections.map(section => (
          <PixelBox key={section.id} className="dg-info-card">
            <Pill className="dg-info-heading" text={section.heading} />
            {section.entries.map((entry, row) => (
              <article key={row} className="dg-info-entry">
                <p className="dg-info-line">
                  <span className="dg-info-text">{entry.text}</span>
                  {entry.command && <b className="dg-info-command">{entry.command}</b>}
                </p>
                {entry.details.map(detail => <p key={detail} className="dg-info-detail">{detail}</p>)}
              </article>
            ))}
          </PixelBox>
        ))}
      </main>
    </div>
  );
}
