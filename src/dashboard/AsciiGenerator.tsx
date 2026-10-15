// ASCII-Logo-Generator am Feld "ASCII-Logo": Name eingeben, Schrift wählen, Vorschau sehen, übernehmen. Lädt die
// FIGlet-Schriften erst beim Öffnen (eigener Chunk, siehe lazy in SettingInput.tsx).
import { useState } from "react";
import { ASCII_FONTS, asciiLogo, type AsciiFont } from "./asciiLogo.ts";
import { TEXTS } from "./texts.de.ts";

const ASCII_TEXT = TEXTS.ascii;
const NAME_LIMIT = 40;

export default function AsciiGenerator({ maxLength, onApply, onClose }: { maxLength: number; onApply: (art: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [font, setFont] = useState<AsciiFont>("Standard");
  const art = name.trim() ? asciiLogo(name.trim(), font) : "";
  const tooLong = art.length > maxLength;
  return (
    <div className="ascii-generator">
      <div className="actions">
        <label className="setting">{ASCII_TEXT.name}
          <input type="text" value={name} maxLength={NAME_LIMIT} placeholder={ASCII_TEXT.example} autoFocus onChange={event => setName(event.target.value)} />
        </label>
        <label className="setting">{ASCII_TEXT.font}
          <select value={font} onChange={event => setFont(event.target.value as AsciiFont)}>
            {ASCII_FONTS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>
      {art && <pre className="ascii-preview" aria-label={ASCII_TEXT.preview}>{art}</pre>}
      {tooLong && <p className="error" role="alert">{ASCII_TEXT.tooLong}</p>}
      <p className="actions">
        <button type="button" className="btn primary" disabled={!art || tooLong} onClick={() => onApply(art)}>{ASCII_TEXT.apply}</button>
        <button type="button" className="btn" onClick={onClose}>{ASCII_TEXT.close}</button>
      </p>
    </div>
  );
}
