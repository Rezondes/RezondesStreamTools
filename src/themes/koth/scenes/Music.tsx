// Spotify "Now Playing" of the KOTH theme: field radio (olive case with dial and antenna), an ammo crate or a plain card,
// cover round or square, header, title (long titles scroll back and forth), artist, album, progress as a frequency bar and
// a signal meter. On pause or stop the player fades out (can be switched off). Visibility, progress, cover and scrolling
// text come from the music context of the core (src/core/music). On a new track the dial runs through the band to the
// frequency of the track (scramble), then the title types in (GSAP, PLAN-KOTH.md package 4). Parameters: ?demo
import { type CSSProperties, useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { dialFrequency } from "../dial.ts";
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

// fixed: the digits the dial runs through and the unit; its times and the typing of the title come from the settings
const DIAL = { chars: "0123456789.", unit: " MHz" };

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useKoth();
  const { part } = useTrackProgress(track, at);
  const cover = useCover(track.cover);
  const scope = useRef<HTMLDivElement>(null);
  const frequency = dialFrequency(track.id) + DIAL.unit;
  useTimeline(timeline => {
    const dial = scope.current?.querySelector(".kh-dial");
    const song = scope.current?.querySelector(".kh-song");
    if (dial) timeline.from(dial, { duration: values.musicDialLength, scrambleText: { text: frequency, chars: DIAL.chars } }, 0);
    if (song) timeline.fromTo(song, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: values.musicTypeLength, ease: `steps(${values.musicTypeSteps})` }, values.musicDialLength);
  }, [track.id, values.musicDialLength, values.musicTypeLength, values.musicTypeSteps], scope);
  return (
    <div ref={scope} className="kh-tuned">
      {cover.src
        ? <img className={`kh-cover cover-${values.coverShape}`} src={cover.src} alt="" onError={cover.onError} />
        : <div className={`kh-cover kh-cover-empty cover-${values.coverShape}`}><ShapeIcon shape={ICONS.funk} /></div>}
      <div className="kh-track">
        <span className="kh-head">{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}<span className="kh-dial">{frequency}</span></span>
        <Marquee text={track.title} speed={values.musicMarqueeSpeed} enabled={values.musicMarquee} className="kh-song" />
        <span className="kh-artist">{track.artist}</span>
        {values.musicAlbum && <span className="kh-album">{track.album}</span>}
        {values.musicProgress && track.durationMs > 0 && <div className="kh-frequency" style={{ "--part": part } as CSSProperties}><span /></div>}
      </div>
      {values.equalizer && <Signal />}
    </div>
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
