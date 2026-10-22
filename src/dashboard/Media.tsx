// Media section in the dashboard: the storage used as a bar with the upload next to it (the server rejects uploads above
// the limit), a filter by kind, the files as tiles with preview, size and the triggers that use them, delete with
// confirmation.
import { useCallback, useEffect, useState } from "react";
import { MEDIA_KIND } from "../core/settings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { deleteMedia, loadMedia, type MediaList } from "./api.ts";
import { reportError, toast } from "./notices.ts";
import { Segmented } from "./PanelFields.tsx";
import { TEXTS } from "./texts.de.ts";
import UploadButton from "./UploadButton.tsx";

const MEDIA_TEXT = TEXTS.media;
type Kind = keyof typeof MEDIA_TEXT.kinds;
const KINDS = (Object.keys(MEDIA_TEXT.kinds) as Kind[]).map(value => ({ value, label: MEDIA_TEXT.kinds[value] }));
// fixed: from this share of the limit the storage bar warns
const FULL = 0.9;
const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;
// Small files in KB, otherwise MB with one decimal place
const megabytes = (bytes: number) => (bytes < MEGABYTE ? `${Math.ceil(bytes / KILOBYTE)} KB` : `${(bytes / MEGABYTE).toFixed(1)} MB`);

export default function Media({ login }: { login: string }) {
  const [list, setList] = useState<MediaList | null>(null);
  const [kind, setKind] = useState<Kind>("all");
  const refresh = useCallback(() => {
    loadMedia().then(setList).catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: "Medien laden", Grund: String(failure) }));
  }, []);
  useEffect(refresh, [refresh]);

  const remove = (name: string, usedBy: string[]) => {
    if (!confirm(usedBy.length ? MEDIA_TEXT.confirmUsed(name, usedBy.join(", ")) : MEDIA_TEXT.confirm(name))) return;
    deleteMedia(name)
      .then(code => {
        if (code) reportError(TEXTS.errors[code], { Aktion: "Datei löschen", Datei: name, Code: code });
        else toast(`${MEDIA_TEXT.deleted} ${name}`);
        refresh();
      })
      .catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: "Datei löschen", Datei: name, Grund: String(failure) }));
  };

  if (!list) return <p className="muted">{TEXTS.loading}</p>;
  const source = (name: string) => `${streamerPath.base(login)}/media/${encodeURIComponent(name)}`;
  const shown = list.files.filter(file => kind === "all" || MEDIA_KIND[kind].test(file.name));
  return (
    <section className="panel media">
      <div className="media-bar">
        <label className="media-usage">
          <span className="muted">{MEDIA_TEXT.usage(megabytes(list.usedBytes), megabytes(list.limitBytes))}</span>
          <meter min={0} max={list.limitBytes} high={list.limitBytes * FULL} value={list.usedBytes} aria-label={MEDIA_TEXT.usageLabel} />
        </label>
        <UploadButton label={MEDIA_TEXT.upload} primary onDone={refresh} />
      </div>
      {list.files.length === 0 ? <p className="muted">{MEDIA_TEXT.empty}</p> : (
        <>
          <Segmented label={MEDIA_TEXT.kind} value={kind} options={KINDS} onChange={setKind} />
          {shown.length === 0 && <p className="muted">{MEDIA_TEXT.noneOfKind}</p>}
          <ul className="media-tiles">
            {shown.map(file => (
              <li key={file.name} className="settings-group media-tile">
                <div className="media-preview"><Preview name={file.name} src={source(file.name)} /></div>
                <code>{file.name}</code>
                <span className="muted">{megabytes(file.size)}</span>
                <span className={file.usedBy.length ? "" : "muted"}>{MEDIA_TEXT.usedBy}: {file.usedBy.length ? file.usedBy.join(", ") : MEDIA_TEXT.unused}</span>
                <button className="btn" onClick={() => remove(file.name, file.usedBy)}>{MEDIA_TEXT.remove}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Preview({ name, src }: { name: string; src: string }) {
  if (MEDIA_KIND.image.test(name)) return <img src={src} alt={name} loading="lazy" />;
  if (MEDIA_KIND.video.test(name)) return <video src={src} muted controls preload="metadata" />;
  return <audio src={src} controls preload="none" />;
}
