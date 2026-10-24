// Minimes of the Dogs theme (DESIGN-DOGS.md "Minimes"), transparent, recommended 1920x360 at the bottom edge of the
// picture: joined chatters as small pixel dogs on a strip of grass, the breed chosen with !rasse (without a choice one
// from the login), the coat from the login, the name on a small pill above. Besides walking and standing they bark,
// sniff with dust, lie down and sleep with a rising "Z" (minimes.ts); on chat they wag fast. Who is in and what
// everyone does comes from useMinimes. Built-in sounds per action (?sound=0 keeps them silent). Parameters: ?demo
import { useEffect, useMemo, useState } from "react";
import { hash, seedOf } from "../../../core/hash.ts";
import { useMinimes } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, shownVariant, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { BREED_IDS, isBreed } from "../breeds.ts";
import { dogCache } from "../dog.ts";
import { dogLookOf } from "../looks.ts";
import { DOG_SET, MINIME_REACTION, minimeCatalog, minimePose, minimeReaction } from "../minimes.ts";
import { spriteImage, SPRITES } from "../props.ts";
import { raidLookOf } from "../raidLooks.ts";
import type { DogSound } from "../sounds.ts";
import { playDogSound } from "../tones.ts";
import Pixels from "../ui/Pixels.tsx";
import { useDogs } from "../useDogs.ts";
import { sceneClock } from "../useFrame.ts";
import { usePose } from "../usePose.ts";
import "../minimes.css";

const SOUND_OF: Readonly<Record<string, DogSound>> = { bark: "minimeBark", sniff: "minimeSniff", [MINIME_REACTION]: "minimeWag" };

export default function Minimes() {
  const values = useDogs();
  // Width of the scene once on load (OBS source), it stays afterwards
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo(() => minimeCatalog(values), [values]);
  const reaction = useMemo(() => minimeReaction(values), [values]);
  const actors = useMinimes({ catalog, reaction, widthPx });
  const enabled = useMemo(() => readMinimeOptions(values, DOG_SET).rules.variants?.map(variant => variant.id) ?? [], [values]);
  return (
    <div className="dg-minimes" aria-hidden="true">
      {values.minimeGrass && <div className="dg-minime-grass" />}
      {actors.map(actor => <Figure key={actor.login} actor={actor} enabled={enabled} />)}
    </div>
  );
}

// One dog with its name: the core moves the box (walking), the dog looks the way it walks (--facing)
function Figure({ actor, enabled }: { actor: MinimeActor; enabled: readonly string[] }) {
  const values = useDogs();
  const [clock] = useState(sceneClock);
  // Without a chosen breed one of the allowed ones from the login, always the same; the coat from the login as well
  const breed = [shownVariant(actor, enabled, "", true)].find(isBreed) ?? BREED_IDS[0];
  const coat = raidLookOf(hash(seedOf(actor.login.toLowerCase())), [breed]).coat;
  const cache = useMemo(() => dogCache(dogLookOf(values, breed, coat)), [values, breed, coat]);
  const zzz = useMemo(() => spriteImage(SPRITES.zz, { o: values.cream }), [values.cream]);
  const pose = minimePose(actor.action, values);
  const image = usePose(cache, pose, clock, values.quality === "niedrig");
  const run = actorRun(actor);
  const sound = SOUND_OF[actor.action];
  useEffect(() => { if (sound) playDogSound(sound, values); }, [run, sound]); // eslint-disable-line react-hooks/exhaustive-deps -- once per action, not per settings change
  return (
    <div className={`dg-minime action-${actor.action}`} style={actorStyle(actor)}>
      {values.minimeNameTag && <span className="dg-minime-name">{actor.user}</span>}
      <div className="dg-minime-flip">
        <Pixels image={image} className="dg-minime-dog" pixelScale={values.minimeScale} />
        {pose.dust && <i key={run} className="dg-minime-dust" />}
        {pose.zzz && <Pixels image={zzz} className="dg-minime-zzz" pixelScale={values.minimeScale} />}
      </div>
    </div>
  );
}
