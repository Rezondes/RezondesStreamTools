// Spotify "Now Playing" of the Chaos theme: a note (or a cassette covered in scribbles, or plain) with the cover in a
// sprayed edge, overline on tape, title in marker and artist, zigzag progress and a shaky equalizer; long lines scroll.
// On pause or stop it fades out (can be switched off). Visibility, progress, cover and scrolling text come from the
// music context of the core (src/core/music). Parameters: ?demo
import { type CSSProperties, useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import Note from "../Note.tsx";
import Progress from "../Progress.tsx";
import { useChaos } from "../useChaos.ts";

export default function Music() {
  const values = useChaos();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className={`ch-music ch-music-${values.musicStyle}`}>
      <Note key={shown?.id ?? "idle"} ink="cyan" tape={values.musicStyle !== "schlicht"} className={`ch-player${visible ? "" : " leaving"}`}>
        {values.musicStyle === "kassette" && <span className="ch-reels" aria-hidden="true"><i /><i /></span>}
        {shown ? <Playing track={shown} at={at} /> : <p className="ch-muted">{values.musicIdle}</p>}
      </Note>
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useChaos();
  const { part, elapsed, total } = useTrackProgress(track, at);
  const cover = useCover(track.cover);
  const scope = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    const zigzag = scope.current?.querySelector(".ch-progress-track");
    if (zigzag) timeline.from(zigzag, { drawSVG: "0%", duration: values.zigzagDraw, ease: "power2.out" });
  }, [track.id], scope);
  const line = (text: string, className: string) => <Marquee text={text} speed={values.musicMarqueeSpeed} enabled={values.musicMarquee} className={className} />;
  return (
    <>
      {values.musicCover && cover.src && <img className="ch-cover" src={cover.src} alt="" onError={cover.onError} />}
      <div ref={scope} className="ch-track">
        <span className="ch-chip">{values.musicLabel}</span>
        {line(track.title, "ch-track-title")}
        {line(track.artist, "ch-muted")}
        {values.musicProgress && track.durationMs > 0 && (
          <div className="ch-time">
            <span>{elapsed}</span>
            <Progress share={part} look="zickzack" />
            <span>{total}</span>
          </div>
        )}
        {values.equalizer && (
          <span className="ch-equalizer" aria-hidden="true">
            {Array.from({ length: values.equalizerBars }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
          </span>
        )}
      </div>
    </>
  );
}
