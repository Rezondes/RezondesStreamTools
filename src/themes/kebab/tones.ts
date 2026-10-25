// Built-in sounds of the Kebab theme (PLAN-KEBAB.md package 3): files made with earshot (docs/sounds/make.py), played
// when no own file is chosen in the settings, at the volume of the sound field; ?sound=0 keeps them silent (playSound).
// ponytail: plays the files itself; a core building block for sound files once a second theme ships some.
import { playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";
import bag from "./sounds/bag.ogg";
import printer from "./sounds/printer.ogg";
import register from "./sounds/register.ogg";
import stamp from "./sounds/stamp.ogg";
import tear from "./sounds/tear.ogg";

// A sound file at a volume (the built-in sound the core calls, e.g. for the climb of a tower)
const tone = (url: string) => (volume: number) => {
  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, volume));
  audio.play().catch((error: unknown) => console.warn("Sound blocked:", error));
};
const play = (url: string) => (sound: SoundValue) => playSound(sound, tone(url));

export const playRegister = play(register);
export const playStamp = play(stamp);
export const playPrinter = play(printer);
export const playTear = play(tear);
export const playBag = play(bag);
