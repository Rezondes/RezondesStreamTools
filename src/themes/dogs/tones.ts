// Built-in sounds of the Dogs theme in the browser (sounds.ts): the OGG files as URLs (Vite import, in the offline
// build embedded), played at the volume of their field through playClip under the limit soundMaxVoices; an own file of
// the streamer in the field plays instead (playSound). ?sound=0 keeps everything silent.
import { playClip, playSound, preloadClips } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";
import { DOG_SOUNDS, filesOf, soundFile, type DogSound, type SoundFile } from "./sounds.ts";
import alertCard from "./sounds/alert-card.ogg";
import alertLeave from "./sounds/alert-leave.ogg";
import alertRaid from "./sounds/alert-raid.ogg";
import alertRun from "./sounds/alert-run.ogg";
import toyBall from "./sounds/alert-toy-ball.ogg";
import toyBone from "./sounds/alert-toy-bone.ogg";
import toyFrisbee from "./sounds/alert-toy-frisbee.ogg";
import toyTreat from "./sounds/alert-toy-treat.ogg";
import barkBig from "./sounds/alert-bark-big.ogg";
import barkMedium from "./sounds/alert-bark-medium.ogg";
import barkSmall from "./sounds/alert-bark-small.ogg";
import brbSniff from "./sounds/brb-sniff.ogg";
import brbSteps from "./sounds/brb-steps.ogg";
import endingLamp from "./sounds/ending-lamp.ogg";
import endingLie from "./sounds/ending-lie.ogg";
import endingSnore from "./sounds/ending-snore.ogg";
import startingCard from "./sounds/starting-card.ogg";
import startingChosen from "./sounds/starting-chosen.ogg";
import startingHop from "./sounds/starting-hop.ogg";
import startingLand from "./sounds/starting-land.ogg";

const URLS: Record<SoundFile, string> = {
  "alert-bark-small": barkSmall, "alert-bark-medium": barkMedium, "alert-bark-big": barkBig,
  "starting-land": startingLand, "starting-hop": startingHop, "starting-chosen": startingChosen, "starting-card": startingCard,
  "alert-run": alertRun, "alert-toy-ball": toyBall, "alert-toy-bone": toyBone, "alert-toy-frisbee": toyFrisbee, "alert-toy-treat": toyTreat,
  "alert-card": alertCard, "alert-leave": alertLeave, "alert-raid": alertRaid,
  "brb-sniff": brbSniff, "brb-steps": brbSteps, "ending-lie": endingLie, "ending-lamp": endingLamp, "ending-snore": endingSnore,
};

type SoundValues = Readonly<Record<string, unknown>> & { soundMaxVoices: number };

// Plays an event at the volume of its field (or the own file there); breed picks the bark voice
export function playDogSound(event: DogSound, values: SoundValues, breed = "") {
  const url = URLS[soundFile(event, values, breed)];
  playSound(values[DOG_SOUNDS[event].field] as SoundValue, volume => playClip(url, volume, { voices: values.soundMaxVoices }));
}

// Loads the built-in files of the given events ahead, at the start of a scene
export const preloadDogSounds = (events: readonly DogSound[]) => preloadClips(filesOf(events).map(file => URLS[file]));
