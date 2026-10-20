// Spotify "Now Playing" of the Bärenbande theme: the chosen bear (or the tower) with headphones bops along next to a paper
// card with the cover, or an old suitcase radio, or a plain card without a bear; header, title (long titles scroll),
// artist, album, progress as an outlined bar and an equalizer of outlined bars. On pause or stop the player fades out
// (can be switched off). Visibility, progress, cover and scrolling text come from the music context of the core
// (src/core/music). Parameters: ?demo
import type { CSSProperties } from "react";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import type { BearId } from "../bears.ts";
import type { PoseName } from "../rig.ts";
import Hero from "../Hero.tsx";
import IconShape from "../IconShape.tsx";
import { useBears } from "../useBears.ts";

const POSES: Record<BearId, PoseName> = { eisbaer: "headphones", grizzly: "headphones", panda: "headphones" };

export default function Music() {
  const values = useBears();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className={`bb-music bb-music-${values.musicStyle} bb-facing-${values.facing} ${values.blinkEvery > 0 ? "bb-blinking" : ""}`}>
      <div key={shown?.id ?? "idle"} className={`bb-player${visible ? "" : " leaving"}${shown?.playing ? " playing" : " paused"}`}>
        {values.musicStyle !== "schlicht" && <div className="bb-music-bear"><Hero choice={values.bearMusic} poses={POSES} className="bb-hero" /></div>}
        <div className="bb-music-card bb-card">
          {values.musicStyle === "kofferradio" && <span className="bb-radio-handle" aria-hidden="true" />}
          {shown ? <Playing track={shown} at={at} /> : <Idle />}
        </div>
      </div>
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useBears();
  const { part } = useTrackProgress(track, at);
  const cover = useCover(track.cover);
  return (
    <>
      {cover.src
        ? <img className={`bb-cover cover-${values.coverShape}`} src={cover.src} alt="" onError={cover.onError} />
        : <div className={`bb-cover bb-cover-empty cover-${values.coverShape}`}><IconShape name="herz" /></div>}
      <div className="bb-track">
        <span className="bb-head bb-pill">{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}</span>
        <Marquee text={track.title} speed={values.musicMarqueeSpeed} enabled={values.musicMarquee} className="bb-song" />
        <span className="bb-artist">{track.artist}</span>
        {values.musicAlbum && <span className="bb-album">{track.album}</span>}
        {values.musicProgress && track.durationMs > 0 && <div className="bb-progress-bar" style={{ "--part": part } as CSSProperties}><span /></div>}
      </div>
      {values.equalizer && <Equalizer />}
    </>
  );
}

function Idle() {
  const values = useBears();
  return (
    <>
      <div className={`bb-cover bb-cover-empty cover-${values.coverShape}`}><IconShape name="blatt" /></div>
      <div className="bb-track">
        <b className="bb-song">{values.musicIdleTitle}</b>
        <span className="bb-artist">{values.musicIdleArtist}</span>
      </div>
    </>
  );
}

function Equalizer() {
  const values = useBears();
  return (
    <div className="bb-eq" aria-hidden="true">
      {Array.from({ length: values.equalizerBars }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
    </div>
  );
}
