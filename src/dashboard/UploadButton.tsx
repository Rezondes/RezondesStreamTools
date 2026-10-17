// Upload button for media (media and trigger page): upload files one after another, meanwhile
// "Lade hoch (2/5)", afterwards one line per file with success or error code. The file input stays reachable by
// keyboard (visually-hidden instead of hidden), the focus ring sits on the button (.btn:focus-within).
import { useState } from "react";
import { uploadMedia } from "./api.ts";
import { TEXTS } from "./texts.de.ts";

type Line = { text: string; failed: boolean };

export default function UploadButton({ label, primary = false, onDone }: { label: string; primary?: boolean; onDone: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState("");

  const upload = async (files: File[]) => {
    const done: Line[] = [];
    setLines([]);
    for (const [index, file] of files.entries()) {
      setRunning(TEXTS.upload.running(file.name, index + 1, files.length));
      const code = await uploadMedia(file);
      done.push(code ? { text: `${file.name}: ${TEXTS.errors[code]}`, failed: true } : { text: `${TEXTS.upload.done} ${file.name}`, failed: false });
      setLines([...done]);
    }
    setRunning("");
    onDone();
  };

  return (
    <>
      <label className={`btn${primary ? " primary" : ""}`} aria-disabled={Boolean(running) || undefined}>
        {label}
        <input type="file" multiple accept="image/*,video/mp4,video/webm,audio/*" className="visually-hidden" disabled={Boolean(running)}
          onChange={event => { void upload(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      </label>
      {(running || lines.length > 0) && (
        <ul className="upload-report" role="status">
          {running && <li className="muted">{running}</li>}
          {lines.map(line => <li key={line.text} className={line.failed ? "error" : ""}>{line.text}</li>)}
        </ul>
      )}
    </>
  );
}
