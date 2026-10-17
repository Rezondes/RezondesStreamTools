// Media section in the dashboard: files of the streamer with size, preview and the triggers that use them;
// upload (the server rejects uploads above the storage limit) and delete with confirmation.
import { useCallback, useEffect, useState } from "react";
import { MEDIA_KIND } from "../core/settings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { deleteMedia, loadMedia, type MediaList } from "./api.ts";
import { TEXTS } from "./texts.de.ts";
import UploadButton from "./UploadButton.tsx";

const MEDIA_TEXT = TEXTS.media;
const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;
// Small files in KB, otherwise MB with one decimal place
const megabytes = (bytes: number) => (bytes < MEGABYTE ? `${Math.ceil(bytes / KILOBYTE)} KB` : `${(bytes / MEGABYTE).toFixed(1)} MB`);

export default function Media({ login }: { login: string }) {
  const [list, setList] = useState<MediaList | null>(null);
  const [note, setNote] = useState("");
  const refresh = useCallback(() => { loadMedia().then(setList).catch(() => setNote(TEXTS.errors["server-error"])); }, []);
  useEffect(refresh, [refresh]);

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
        <span className="muted">{MEDIA_TEXT.usage(megabytes(list.usedBytes), megabytes(list.limitBytes))}</span>
        <span role="status">{note}</span>
        <UploadButton label={MEDIA_TEXT.upload} primary onDone={refresh} />
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
