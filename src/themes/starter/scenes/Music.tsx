// Spotify "Now Playing" des Starter-Themes: Karte mit Cover, Überzeile, Titel, Interpret und Fortschritt.
// Bei Pause oder Stopp blendet sie aus (abschaltbar). Parameter: ?demo
import { useEffect, useState } from "react";
import type { Track } from "../../../core/types.ts";
import { clock, currentProgress } from "../../../core/overlayTiming.ts";
import { useMusic } from "../../../core/hooks/useMusic.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useStarter } from "../useStarter.ts";

// fixed: Fortschritt viermal pro Sekunde, Zeit in Minuten:Sekunden (clock liefert HH:MM:SS, ab Zeichen 3), Prozent
const PACE = { progressMs: 250, secondMs: 1000, minutesFrom: 3, percent: 100 };

export default function Music() {
  const values = useStarter();
  const { track, last, receivedAt } = useMusic();
  const visible = values.musicHide ? Boolean(track?.playing) : true;
  const shown = track ?? (values.musicHide ? last : null);
  return (
    <div className="starter-music">
      <div key={shown?.id ?? "idle"} className={`starter-card starter-player${visible ? "" : " leaving"}`}>
        {shown ? <Playing track={shown} at={track ? receivedAt : 0} /> : <p className="starter-muted">{values.musicIdle}</p>}
      </div>
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useStarter();
  const now = useNow(PACE.progressMs);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [track.cover]);
  const progress = at ? currentProgress(track, at, now) : track.progressMs;
  const part = track.durationMs ? progress / track.durationMs : 0;
  const time = (ms: number) => clock(ms / PACE.secondMs).slice(PACE.minutesFrom);
  return (
    <>
      {values.musicCover && track.cover && !broken && <img className="starter-cover" src={track.cover} alt="" onError={() => setBroken(true)} />}
      <div className="starter-track">
        <span className="starter-eyebrow">{values.musicLabel}</span>
        <b className="starter-line">{track.title}</b>
        <span className="starter-muted">{track.artist}</span>
        {track.durationMs > 0 && (
          <div className="starter-time">
            <span>{time(progress)}</span>
            <div className="starter-progress"><span style={{ width: `${part * PACE.percent}%` }} /></div>
            <span>{time(track.durationMs)}</span>
          </div>
        )}
      </div>
    </>
  );
}
