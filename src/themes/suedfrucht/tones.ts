// Eingebaute Töne des Südfrucht-Themes: kleine Steel-Drum-Melodie beim Erscheinen eines Alerts, ein weicher Ton beim
// Ausblenden. Gelten, wenn in den Einstellungen keine eigene Datei gewählt ist; die Lautstärke kommt aus dem Ton-Feld.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

// fixed: Melodie (C-Dur-Dreiklang aufwärts), Länge und Abstand der Töne, Obertöne für den Steel-Drum-Klang
const MELODY = [523, 659, 784, 1047];
const NOTE = { lengthMs: 320, stepMs: 120, overtone: 2, overtoneVolume: 0.35 };

export function playChime(sound: SoundValue) {
  playSound(sound, volume => {
    MELODY.forEach((frequency, index) => {
      beep(frequency, NOTE.lengthMs, index * NOTE.stepMs, volume, "sine");
      beep(frequency * NOTE.overtone, NOTE.lengthMs / 2, index * NOTE.stepMs, volume * NOTE.overtoneVolume, "triangle");
    });
  });
}

export const playLeave = (sound: SoundValue) => playSound(sound, volume => beep(392, 260, 0, volume, "sine"));
