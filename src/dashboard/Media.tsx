// Medien-Bereich im Dashboard: Dateien des Streamers mit Grösse, Vorschau und den Triggern, die sie nutzen;
// Hochladen (der Server lehnt Uploads über dem Speicherlimit ab) und Löschen mit Rückfrage.
import { useCallback, useEffect, useState } from "react";
import { MEDIA_KIND } from "../core/settings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { deleteMedia, loadMedia, uploadMedia, type MediaList } from "./api.ts";
import { TEXTS } from "./texts.de.ts";

const MEDIA_TEXT = TEXTS.media;
const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;
// Kleine Dateien in KB, sonst MB mit einer Nachkommastelle
const megabytes = (bytes: number) => (bytes < MEGABYTE ? `${Math.ceil(bytes / KILOBYTE)} KB` : `${(bytes / MEGABYTE).toFixed(1)} MB`);

export default function Media({ login }: { login: string }) {
  const [list, setList] = useState<MediaList | null>(null);
  const [note, setNote] = useState("");
  const refresh = useCallback(() => { loadMedia().then(setList).catch(() => setNote(TEXTS.errors["server-error"])); }, []);
  useEffect(refresh, [refresh]);

  const upload = (files: FileList | null) => {
    Array.from(files ?? []).reduce((previous, file) => previous.then(async () => {
      const code = await uploadMedia(file);
      setNote(code ? `${file.name}: ${TEXTS.errors[code]}` : `${MEDIA_TEXT.uploaded} ${file.name}`);
    }), Promise.resolve()).then(refresh).catch(() => setNote(TEXTS.errors["server-error"]));
  };

  const remove = (name: string, usedBy: string[]) => {
    if (!confirm(usedBy.length ? MEDIA_TEXT.confirmUsed(name, usedBy.join(", ")) : MEDIA_TEXT.confirm(name))) return;
    deleteMedia(name)
      .then(code => { setNote(code ? `${name}: ${TEXTS.errors[code]}` : `${MEDIA_TEXT.deleted} ${name}`); refresh(); })
      .catch(() => setNote(TEXTS.errors["server-error"]));
  };

  if (!list) return <p className="muted">{note || TEXTS.loading}</p>;
  const source = (name: string) => `${streamerPath.base(login)}/media/${encodeURIComponent(name)}`;
  return (
    <section className="panel">
      <div className="actions">
        <label className="btn primary">
          {MEDIA_TEXT.upload}
          <input type="file" multiple accept="image/*,video/mp4,video/webm,audio/*" className="visually-hidden" onChange={event => { upload(event.target.files); event.target.value = ""; }} />
        </label>
        <span className="muted">{MEDIA_TEXT.usage(megabytes(list.usedBytes), megabytes(list.limitBytes))}</span>
        <span role="status">{note}</span>
      </div>
      {list.files.length === 0 && <p className="muted">{MEDIA_TEXT.empty}</p>}
      {list.files.length > 0 && (
        <table>
          <thead><tr><th>{MEDIA_TEXT.preview}</th><th>{MEDIA_TEXT.file}</th><th>{MEDIA_TEXT.size}</th><th>{MEDIA_TEXT.usedBy}</th><th /></tr></thead>
          <tbody>
            {list.files.map(file => (
              <tr key={file.name}>
                <td className="media-preview"><Preview name={file.name} src={source(file.name)} /></td>
                <td><code>{file.name}</code></td>
                <td>{megabytes(file.size)}</td>
                <td className={file.usedBy.length ? "" : "muted"}>{file.usedBy.length ? file.usedBy.join(", ") : MEDIA_TEXT.unused}</td>
                <td><button className="btn" onClick={() => remove(file.name, file.usedBy)}>{MEDIA_TEXT.remove}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Preview({ name, src }: { name: string; src: string }) {
  if (MEDIA_KIND.image.test(name)) return <img src={src} alt={name} loading="lazy" />;
  if (MEDIA_KIND.video.test(name)) return <video src={src} muted controls preload="metadata" />;
  return <audio src={src} controls preload="none" />;
}
