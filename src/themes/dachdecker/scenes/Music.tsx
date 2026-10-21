// Spotify "Now Playing" of the Dachdecker theme (DESIGN-DACHDECKER.md "Musik"): a sturdy building site radio drawn in 2D
// (slate body, terracotta bumpers and roll bar, two speaker grilles, a cyan display with cover, title and artist as
// running text and a small equalizer), the progress as a dimension chain below; or as a blueprint sign, or plain.
// Visibility, progress, cover and running text come from the music context of the core. Parameters: ?demo
import type { CSSProperties } from "react";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import PlanSign from "../plan/PlanSign.tsx";
import Progress from "../plan/Progress.tsx";
import { displayStyle, EQ_BARS, HEIGHT, radioShapes } from "../radio.ts";
import { useDachdecker } from "../useDachdecker.ts";

const SHAPES = radioShapes();

export default function Music() {
  const values = useDachdecker();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  const display = <Display track={shown} />;
  return (
    <div className={`dd-music dd-music-${values.musicStyle}${visible ? "" : " leaving"}`}>
      {values.musicStyle === "radio" && (
        <div className="dd-radio">
          <svg viewBox={`0 0 1 ${HEIGHT}`} aria-hidden="true">
            <path className="dd-radio-handle" d={SHAPES.handle} />
            <path className="dd-radio-body" d={SHAPES.body} />
            {SHAPES.grilles.map(grille => <path key={grille} className="dd-radio-grille" d={grille} />)}
            {SHAPES.bumpers.map(bumper => <path key={bumper} className="dd-radio-bumper" d={bumper} />)}
          </svg>
          <div className="dd-radio-display" style={displayStyle(SHAPES.display)}>{display}</div>
        </div>
      )}
      {values.musicStyle === "schild" && <PlanSign className="dd-music-sign">{display}</PlanSign>}
      {values.musicStyle === "schlicht" && <div className="dd-music-plain">{display}</div>}
      {shown && values.musicProgress && <TrackChain track={shown} at={at} />}
    </div>
  );
}

function Display({ track }: { track: Track | null }) {
  const values = useDachdecker();
  const cover = useCover(track?.cover ?? null);
  if (!track) return <p className="dd-music-idle">{values.musicIdle}</p>;
  const line = (text: string, className: string) => <Marquee text={text} speed={values.musicMarqueeSpeed} enabled className={className} />;
  return (
    <div className="dd-track">
      {values.musicCover && cover.src && <img className="dd-cover" src={cover.src} alt="" onError={cover.onError} />}
      <div className="dd-track-text">
        <span className="dd-music-label">{values.musicLabel}</span>
        {line(track.title, "dd-track-title")}
        {line(track.artist, "dd-track-artist")}
      </div>
      {values.musicEq && (
        <span className="dd-equalizer" aria-hidden="true">
          {Array.from({ length: EQ_BARS }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
        </span>
      )}
    </div>
  );
}

function TrackChain({ track, at }: { track: Track; at: number }) {
  const { part } = useTrackProgress(track, at);
  return track.durationMs > 0 ? <div className="dd-music-progress"><Progress share={part} /></div> : null;
}
