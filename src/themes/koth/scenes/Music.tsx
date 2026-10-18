// Spotify "Now Playing" of the KOTH theme: field radio (olive case with dial and antenna), an ammo crate or a plain card,
// cover round or square, header, title (long titles scroll back and forth), artist, album, progress as a frequency bar and
// a signal meter. On pause or stop the player fades out (can be switched off). Visibility, progress, cover and scrolling
// text come from the music context of the core (src/core/music). Parameters: ?demo
import type { CSSProperties } from "react";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import { ICONS } from "../hill.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { useKoth } from "../useKoth.ts";

export default function Music() {
  const values = useKoth();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className={`kh-music kh-music-${values.musicStyle}`}>
      <div key={shown?.id ?? "idle"} className={`kh-player${visible ? "" : " leaving"}${shown?.playing ? "" : " paused"}`}>
        {shown ? <Playing track={shown} at={at} /> : <Idle />}
      </div>
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useKoth();
  const { part } = useTrackProgress(track, at);
  const cover = useCover(track.cover);
  return (
    <>
      {cover.src
        ? <img className={`kh-cover cover-${values.coverShape}`} src={cover.src} alt="" onError={cover.onError} />
        : <div className={`kh-cover kh-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.funk} /></div>}
      <div className="kh-track">
        <span className="kh-head">{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}</span>
        <Marquee text={track.title} speed={values.musicMarqueeSpeed} enabled={values.musicMarquee} className="kh-song" />
        <span className="kh-artist">{track.artist}</span>
        {values.musicAlbum && <span className="kh-album">{track.album}</span>}
        {values.musicProgress && track.durationMs > 0 && <div className="kh-frequency" style={{ "--part": part } as CSSProperties}><span /></div>}
      </div>
      {values.equalizer && <Signal />}
    </>
  );
}

function Idle() {
  const values = useKoth();
  return (
    <>
      <div className={`kh-cover kh-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.funk} /></div>
      <div className="kh-track">
        <b className="kh-song">{values.musicIdleTitle}</b>
        <span className="kh-artist">{values.musicIdleArtist}</span>
      </div>
    </>
  );
}

function Signal() {
  const values = useKoth();
  return (
    <div className="kh-eq" aria-hidden="true">
      {Array.from({ length: values.equalizerBars }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
    </div>
  );
}
