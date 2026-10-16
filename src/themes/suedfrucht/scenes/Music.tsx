// Spotify "Now Playing" des Südfrucht-Themes: Strandradio aus Holz, Muschel oder schlichte Karte, Cover rund oder
// eckig, Kopfzeile, Titel (lange Titel laufen hin und her), Interpret, Album, Fortschritt als Wellenlinie und ein
// Wellen-Equalizer. Bei Pause oder Stopp blendet der Player aus (abschaltbar). Sichtbarkeit, Fortschritt, Cover und
// Lauftext kommen aus dem Musik-Kontext des Kerns (src/core/music). Parameter: ?demo
import type { CSSProperties } from "react";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import { ICONS } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { useSuedfrucht } from "../useSuedfrucht.ts";

export default function Music() {
  const values = useSuedfrucht();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className={`sf-music sf-music-${values.musicStyle}`}>
      <div key={shown?.id ?? "idle"} className={`sf-player${visible ? "" : " leaving"}${shown?.playing ? "" : " paused"}`}>
        {shown ? <Playing track={shown} at={at} /> : <Idle />}
      </div>
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useSuedfrucht();
  const { part } = useTrackProgress(track, at);
  const cover = useCover(track.cover);
  return (
    <>
      {cover.src
        ? <img className={`sf-cover cover-${values.coverShape}`} src={cover.src} alt="" onError={cover.onError} />
        : <div className={`sf-cover sf-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.sonne} /></div>}
      <div className="sf-track">
        <span className="sf-head">{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}</span>
        <Marquee text={track.title} speed={values.musicMarqueeSpeed} enabled={values.musicMarquee} className="sf-song" />
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

function Equalizer() {
  const values = useSuedfrucht();
  return (
    <div className="sf-eq" aria-hidden="true">
      {Array.from({ length: values.equalizerBars }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
    </div>
  );
}
