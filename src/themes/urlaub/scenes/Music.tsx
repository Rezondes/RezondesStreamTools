// Spotify "Now Playing" of the Urlaub theme: beach radio of wood, shell or a plain card, cover round or
// square, header, title (long titles scroll back and forth), artist, album, progress as a wave line and a
// wave equalizer. On pause or stop the player fades out (can be switched off). Visibility, progress, cover and
// scrolling text come from the music context of the core (src/core/music). Parameters: ?demo
import type { CSSProperties } from "react";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import { ICONS } from "../beach.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { useUrlaub } from "../useUrlaub.ts";

export default function Music() {
  const values = useUrlaub();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className={`ul-music ul-music-${values.musicStyle}`}>
      <div key={shown?.id ?? "idle"} className={`ul-player${visible ? "" : " leaving"}${shown?.playing ? "" : " paused"}`}>
        {shown ? <Playing track={shown} at={at} /> : <Idle />}
      </div>
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useUrlaub();
  const { part } = useTrackProgress(track, at);
  const cover = useCover(track.cover);
  return (
    <>
      {cover.src
        ? <img className={`ul-cover cover-${values.coverShape}`} src={cover.src} alt="" onError={cover.onError} />
        : <div className={`ul-cover ul-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.sonne} /></div>}
      <div className="ul-track">
        <span className="ul-head">{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}</span>
        <Marquee text={track.title} speed={values.musicMarqueeSpeed} enabled={values.musicMarquee} className="ul-song" />
        <span className="ul-artist">{track.artist}</span>
        {values.musicAlbum && <span className="ul-album">{track.album}</span>}
        {values.musicProgress && track.durationMs > 0 && <div className="ul-wave-progress" style={{ "--part": part } as CSSProperties}><span /></div>}
      </div>
      {values.equalizer && <Equalizer />}
    </>
  );
}

function Idle() {
  const values = useUrlaub();
  return (
    <>
      <div className={`ul-cover ul-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.welle} /></div>
      <div className="ul-track">
        <b className="ul-song">{values.musicIdleTitle}</b>
        <span className="ul-artist">{values.musicIdleArtist}</span>
      </div>
    </>
  );
}

function Equalizer() {
  const values = useUrlaub();
  return (
    <div className="ul-eq" aria-hidden="true">
      {Array.from({ length: values.equalizerBars }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
    </div>
  );
}
