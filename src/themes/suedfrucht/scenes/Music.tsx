// Spotify "Now Playing" des Südfrucht-Themes: Strandradio aus Holz, Muschel oder schlichte Karte, Cover rund oder
// eckig, Kopfzeile, Titel (lange Titel laufen hin und her), Interpret, Album, Fortschritt als Wellenlinie und ein
// Wellen-Equalizer. Bei Pause oder Stopp blendet der Player aus (abschaltbar). Parameter: ?demo
import { useEffect, useState, type CSSProperties } from "react";
import { useMusic } from "../../../core/hooks/useMusic.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { useOverflow } from "../../../core/hooks/useOverflow.ts";
import { currentProgress, marqueeSeconds } from "../../../core/overlayTiming.ts";
import type { Track } from "../../../core/types.ts";
import { ICONS } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { useSuedfrucht } from "../useSuedfrucht.ts";

// fixed: Fortschritt viermal pro Sekunde
const PROGRESS_MS = 250;

export default function Music() {
  const values = useSuedfrucht();
  const { track, last, receivedAt } = useMusic();
  const visible = values.musicHide ? Boolean(track?.playing) : true;
  const shown = track ?? (values.musicHide ? last : null);
  return (
    <div className={`sf-music sf-music-${values.musicStyle}`}>
      <div key={shown?.id ?? "idle"} className={`sf-player${visible ? "" : " leaving"}${shown?.playing ? "" : " paused"}`}>
        {shown ? <Playing track={shown} at={track ? receivedAt : 0} /> : <Idle />}
      </div>
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useSuedfrucht();
  const now = useNow(PROGRESS_MS);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [track.cover]);
  const progress = at ? currentProgress(track, at, now) : track.progressMs;
  const part = track.durationMs ? progress / track.durationMs : 0;
  return (
    <>
      {track.cover && !broken
        ? <img className={`sf-cover cover-${values.coverShape}`} src={track.cover} alt="" onError={() => setBroken(true)} />
        : <div className={`sf-cover sf-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.sonne} /></div>}
      <div className="sf-track">
        <span className="sf-head">{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}</span>
        <Title text={track.title} />
        <span className="sf-artist">{track.artist}</span>
        {values.musicAlbum && <span className="sf-album">{track.album}</span>}
        {values.musicProgress && track.durationMs > 0 && <div className="sf-wave-progress" style={{ "--part": part } as CSSProperties}><span /></div>}
      </div>
      {values.equalizer && <Equalizer />}
    </>
  );
}

function Idle() {
  const values = useSuedfrucht();
  return (
    <>
      <div className={`sf-cover sf-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.welle} /></div>
      <div className="sf-track">
        <b className="sf-song">{values.musicIdleTitle}</b>
        <span className="sf-artist">{values.musicIdleArtist}</span>
      </div>
    </>
  );
}

// Titel; ist er länger als der Platz, läuft er hin und her (wenn eingeschaltet)
function Title({ text }: { text: string }) {
  const values = useSuedfrucht();
  const { outer, inner, overflow } = useOverflow<HTMLElement, HTMLSpanElement>(text);
  const moving = values.musicMarquee && overflow > 0;
  const style = { "--shift": `-${overflow}px`, "--marquee-time": `${marqueeSeconds(overflow, values.musicMarqueeSpeed)}s` } as CSSProperties;
  return (
    <b ref={outer} className={`sf-song${moving ? " marquee" : ""}`} style={style}>
      <span ref={inner}>{text}</span>
    </b>
  );
}

function Equalizer() {
  const values = useSuedfrucht();
  return (
    <div className="sf-eq" aria-hidden="true">
      {Array.from({ length: values.equalizerBars }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
    </div>
  );
}
