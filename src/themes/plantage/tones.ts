// Built-in sounds of the Plantage theme: a wooden marimba run when an alert appears, a soft knock on fade-out, and the
// sounds of the mango fights (shot, explosion, juicy hit, revive). They apply when no own file is chosen in the
// settings; the volume comes from the sound field.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

// fixed: melody (G major run upwards), length and spacing of the tones, the wooden knock as a short low tone above it
const MELODY = [392, 494, 587, 784];
const NOTE = { lengthMs: 180, stepMs: 110, knock: 3, knockVolume: 0.4 };

export function playChime(sound: SoundValue) {
  playSound(sound, volume => {
    MELODY.forEach((frequency, index) => {
      beep(frequency, NOTE.lengthMs, index * NOTE.stepMs, volume, "triangle");
      beep(frequency * NOTE.knock, NOTE.lengthMs / 4, index * NOTE.stepMs, volume * NOTE.knockVolume, "sine");
    });
  });
}

export const playLeave = (sound: SoundValue) => playSound(sound, volume => beep(294, 200, 0, volume, "triangle"));

// fixed: fight sounds, a short crack, a deep rumble, a wet plop and a rising two-tone for the revive
export const COMBAT_TONES = {
  shot: (volume: number) => beep(880, 40, 0, volume * 0.5, "square"),
  explosion: (volume: number) => { beep(70, 380, 0, volume, "sawtooth"); beep(110, 220, 40, volume * 0.6, "square"); },
  hit: (volume: number) => { beep(220, 90, 0, volume, "sine"); beep(140, 120, 70, volume * 0.7, "sine"); },
  revive: (volume: number) => { beep(523, 140, 0, volume, "sine"); beep(784, 220, 130, volume, "sine"); },
};
