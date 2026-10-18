// Built-in sounds of the KOTH theme: a radio chirp (two short beeps and a squelch) when an alert appears, the click of the
// push-to-talk button on fade-out, and the sounds of the fights (shot, explosion, hit, revive). They apply when no own
// file is chosen in the settings; the volume comes from the sound field.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

// fixed: chirp tones, their length and spacing, the squelch after them
const CHIRP = [1200, 1600];
const NOTE = { lengthMs: 70, stepMs: 110, squelch: 180, squelchMs: 160, squelchVolume: 0.3 };

export function playChime(sound: SoundValue) {
  playSound(sound, volume => {
    CHIRP.forEach((frequency, index) => beep(frequency, NOTE.lengthMs, index * NOTE.stepMs, volume, "square"));
    beep(NOTE.squelch, NOTE.squelchMs, CHIRP.length * NOTE.stepMs, volume * NOTE.squelchVolume, "sawtooth");
  });
}

export const playLeave = (sound: SoundValue) => playSound(sound, volume => beep(900, 30, 0, volume, "square"));

// fixed: fight sounds, a dry crack, a deep rumble, a dull thud and a rising two-tone for the revive
export const COMBAT_TONES = {
  shot: (volume: number) => beep(700, 35, 0, volume * 0.5, "square"),
  explosion: (volume: number) => { beep(60, 420, 0, volume, "sawtooth"); beep(95, 240, 50, volume * 0.6, "square"); },
  hit: (volume: number) => beep(120, 140, 0, volume, "triangle"),
  revive: (volume: number) => { beep(440, 140, 0, volume, "sine"); beep(660, 220, 130, volume, "sine"); },
};
