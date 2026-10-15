// Eingebaute Töne der Matrix-Alerts: kleiner Modem-Gruss beim Öffnen, tiefer Ton beim Ausblenden.
// Gelten, wenn in den Einstellungen keine eigene Datei gewählt ist; die Lautstärke kommt aus dem Ton-Feld.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

export function playOpen(sound: SoundValue) {
  playSound(sound, volume => {
    [880, 1320, 660, 1760].forEach((frequency, index) => beep(frequency, 90, index * 85, volume));
    beep(2640, 40, 900, volume);
  });
}

export const playLeave = (sound: SoundValue) => playSound(sound, volume => beep(440, 120, 0, volume));
