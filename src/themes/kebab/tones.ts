// Built-in sounds of the Kebab theme (PLAN-KEBAB.md package 3): files made with earshot (docs/sounds/make.py), played
// when no own file is chosen in the settings, at the volume of the sound field; ?sound=0 keeps them silent (playSound).
// ponytail: plays the files itself; a core building block for sound files once a second theme ships some.
import { playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";
import bag from "./sounds/bag.ogg";
import knife from "./sounds/knife.ogg";
import plop from "./sounds/plop.ogg";
import printer from "./sounds/printer.ogg";
import register from "./sounds/register.ogg";
import sizzle from "./sounds/sizzle.ogg";
import stamp from "./sounds/stamp.ogg";
import tear from "./sounds/tear.ogg";

const play = (url: string) => (sound: SoundValue) => playSound(sound, volume => {
  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, volume));
  audio.play().catch((error: unknown) => console.warn("Sound blocked:", error));
});

export const playRegister = play(register);
export const playStamp = play(stamp);
export const playPrinter = play(printer);
export const playTear = play(tear);
export const playKnife = play(knife);
export const playSizzle = play(sizzle);
export const playPlop = play(plop);
export const playBag = play(bag);
