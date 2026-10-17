// Spotify "Now Playing" of the standard theme: card with cover, overline, title, artist and progress; long
// lines scroll. On pause or stop it fades out (can be switched off). Visibility, progress, cover and
// scrolling text come from the music context of the core (src/core/music). Parameters: ?demo
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import { useStandard } from "../useStandard.ts";

// fixed: percent for the width of the progress bar
const PERCENT = 100;

export default function Music() {
  const values = useStandard();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className="standard-music">
      <div key={shown?.id ?? "idle"} className={`standard-card standard-player${visible ? "" : " leaving"}`}>
        {shown ? <Playing track={shown} at={at} /> : <p className="standard-muted">{values.musicIdle}</p>}
      </div>
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
