// Spotify "Now Playing" of the standard theme: card with cover, overline, title, artist and progress; long
// lines scroll. On a new track the card comes in again (GSAP): the cover tilts in, title and artist fade over. On pause
// or stop it fades out (can be switched off). Visibility, progress, cover and scrolling text come from the music
// context of the core (src/core/music). Parameters: ?demo
import { useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import { useStandard } from "../useStandard.ts";

// fixed: percent for the width of the progress bar
const PERCENT = 100;
// fixed: durations in s, the tilt of the cover in degrees, how far the lines rise in px and their stagger
const ENTER = { card: 0.5, cover: 0.7, tilt: -90, lines: 0.5, rise: 10, stagger: 0.1, linesAt: 0.2 };

export default function Music() {
  const values = useStandard();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className="standard-music">
      <Player key={shown?.id ?? "idle"} track={shown} visible={visible} at={at} />
    </div>
  );
}

function Player({ track, visible, at }: { track: Track | null; visible: boolean; at: number }) {
  const values = useStandard();
  const card = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    timeline.from(card.current, { opacity: 0, y: ENTER.rise, duration: ENTER.card, ease: "power2.out" });
    timeline.from(".standard-cover", { rotateY: ENTER.tilt, opacity: 0, duration: ENTER.cover, ease: "back.out(1.4)" }, 0);
    timeline.from(".standard-track > *", { opacity: 0, y: ENTER.rise, duration: ENTER.lines, ease: "power2.out", stagger: ENTER.stagger }, ENTER.linesAt);
  }, [], card);
  return (
    <div ref={card} className={`standard-card standard-player${visible ? "" : " leaving"}`}>
      {track ? <Playing track={track} at={at} /> : <p className="standard-muted">{values.musicIdle}</p>}
    </div>
  );
}

function Playing({ track, at }: { track: Track; at: number }) {
  const values = useStandard();
  const { part, elapsed, total } = useTrackProgress(track, at);
  const cover = useCover(track.cover);
  const line = (text: string, className: string) => <Marquee text={text} speed={values.musicMarqueeSpeed} enabled={values.musicMarquee} className={className} />;
  return (
    <>
      {values.musicCover && cover.src && <img className="standard-cover" src={cover.src} alt="" onError={cover.onError} />}
      <div className="standard-track">
        <span className="standard-eyebrow">{values.musicLabel}</span>
        {line(track.title, "standard-line")}
        {line(track.artist, "standard-muted")}
        {track.durationMs > 0 && (
          <div className="standard-time">
            <span>{elapsed}</span>
            <div className="standard-progress"><span style={{ width: `${part * PERCENT}%` }} /></div>
            <span>{total}</span>
          </div>
        )}
      </div>
    </>
  );
}
