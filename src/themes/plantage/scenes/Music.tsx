// Spotify "Now Playing" of the Plantage theme: transistor radio standing on a crate, a mango crate or a plain card,
// cover round or square, header, title (long titles scroll back and forth), artist, album, progress as a vine and a
// mango equalizer. On pause or stop the player fades out (can be switched off). Visibility, progress, cover and
// scrolling text come from the music context of the core (src/core/music). Parameters: ?demo
import type { CSSProperties } from "react";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import { ICONS } from "../field.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { usePlantage } from "../usePlantage.ts";

export default function Music() {
  const values = usePlantage();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className={`pl-music pl-music-${values.musicStyle}`}>
      <div key={shown?.id ?? "idle"} className={`pl-player${visible ? "" : " leaving"}${shown?.playing ? "" : " paused"}`}>
        {shown ? <Playing track={shown} at={at} /> : <Idle />}
      </div>
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = usePlantage();
  const { part } = useTrackProgress(track, at);
  const cover = useCover(track.cover);
  return (
    <>
      {cover.src
        ? <img className={`pl-cover cover-${values.coverShape}`} src={cover.src} alt="" onError={cover.onError} />
        : <div className={`pl-cover pl-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.mango} /></div>}
      <div className="pl-track">
        <span className="pl-head">{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}</span>
        <Marquee text={track.title} speed={values.musicMarqueeSpeed} enabled={values.musicMarquee} className="pl-song" />
        <span className="pl-artist">{track.artist}</span>
        {values.musicAlbum && <span className="pl-album">{track.album}</span>}
        {values.musicProgress && track.durationMs > 0 && <div className="pl-vine" style={{ "--part": part } as CSSProperties}><span /></div>}
      </div>
      {values.equalizer && <Equalizer />}
    </>
  );
}

function Idle() {
  const values = usePlantage();
  return (
    <>
      <div className={`pl-cover pl-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.sonne} /></div>
      <div className="pl-track">
        <b className="pl-song">{values.musicIdleTitle}</b>
        <span className="pl-artist">{values.musicIdleArtist}</span>
      </div>
    </>
  );
}

function Equalizer() {
  const values = usePlantage();
  return (
    <div className="pl-eq" aria-hidden="true">
      {Array.from({ length: values.equalizerBars }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
    </div>
  );
}
