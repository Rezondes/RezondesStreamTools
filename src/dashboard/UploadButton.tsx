// Upload button for media (media and trigger page): upload files one after another, meanwhile
// "Lade hoch (2/5)", per file a toast when it arrived or the error dialog when not. The file input stays reachable by
// keyboard (visually-hidden instead of hidden), the focus ring sits on the button (.btn:focus-within).
import { useState } from "react";
import { uploadMedia } from "./api.ts";
import { reportError, toast } from "./notices.ts";
import { TEXTS } from "./texts.de.ts";

export default function UploadButton({ label, primary = false, onDone }: { label: string; primary?: boolean; onDone: () => void }) {
  const [running, setRunning] = useState("");

  const upload = async (files: File[]) => {
    for (const [index, file] of files.entries()) {
      setRunning(TEXTS.upload.running(file.name, index + 1, files.length));
      const code = await uploadMedia(file);
      if (code) reportError(TEXTS.errors[code], { Aktion: "Datei hochladen", Datei: file.name, Typ: file.type, Bytes: String(file.size), Code: code });
      else toast(`${TEXTS.upload.done} ${file.name}`);
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
      {running && <span className="muted" role="status">{running}</span>}
    </>
  );
}
