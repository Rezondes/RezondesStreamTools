// Decoding in the matrix theme: start delay and ms per character per text spot (settings decode<Spot>Delay and
// decode<Spot>Char, first header, then name, then line). The speed from the settings divides all times, the random
// characters come from the theme's character set.
import { useDecode } from "../../core/hooks/useDecode.ts";
import type { MatrixValues } from "./settings.ts";
import { useMatrix } from "./useMatrix.ts";

const SPOTS = {
  screenTitle: ["decodeScreenTitleDelay", "decodeScreenTitleChar"], logo: ["decodeLogoDelay", "decodeLogoChar"],
  alertHeader: ["decodeAlertHeaderDelay", "decodeAlertHeaderChar"], alertName: ["decodeAlertNameDelay", "decodeAlertNameChar"],
  alertLine: ["decodeAlertLineDelay", "decodeAlertLineChar"], alertQuote: ["decodeAlertQuoteDelay", "decodeAlertQuoteChar"],
  camLabel: ["decodeCamLabelDelay", "decodeCamLabelChar"], chatUser: ["decodeChatUserDelay", "decodeChatUserChar"],
  musicTitle: ["decodeMusicTitleDelay", "decodeMusicTitleChar"], musicArtist: ["decodeMusicArtistDelay", "decodeMusicArtistChar"],
} as const satisfies Record<string, readonly [keyof MatrixValues, keyof MatrixValues]>;

export function useMatrixDecode(text: string, part: keyof typeof SPOTS) {
  const values = useMatrix();
  const { decodeSpeed, glyphs } = values;
  const [delayKey, charKey] = SPOTS[part];
  const [delayMs, msPerChar] = [values[delayKey], values[charKey]];
  return useDecode(text, delayMs / decodeSpeed, msPerChar / decodeSpeed, glyphs);
}
