// Spotify "Now Playing" of the Kebab theme (DESIGN-KEBAB.md "Musik"): a small bon with the label, the cover, title and
// artist as running text and the progress as a dashed line that fills in red; or a paper sign, or plain. Visibility,
// progress, cover and running text come from the music context of the core. Parameters: ?demo
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import { useKebab } from "../useKebab.ts";

// fixed: a share in percent
const PERCENT = 100;

export default function Music() {
  const values = useKebab();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  return (
    <div className={`kb-music kb-music-${values.musicStyle}${visible ? "" : " leaving"}`}>
      <div className="kb-music-paper">
        <Display track={shown} />
        {shown && values.musicProgress && <Progress track={shown} at={at} />}
        {values.musicStyle === "bon" && <i className="kb-zigzag" aria-hidden="true" />}
      </div>
    </div>
  );
}

function Display({ track }: { track: Track | null }) {
  const values = useKebab();
  const cover = useCover(track?.cover ?? null);
  if (!track) return <p className="kb-music-idle">{values.musicIdle}</p>;
  const line = (text: string, className: string) => <Marquee text={text} speed={values.musicMarqueeSpeed} enabled className={className} />;
  return (
    <div className="kb-track">
      {values.musicCover && cover.src && <img className="kb-cover" src={cover.src} alt="" onError={cover.onError} />}
      <div className="kb-track-text">
        <span className="kb-music-label">{values.musicLabel}</span>
        {line(track.title, "kb-track-title")}
        {line(track.artist, "kb-track-artist")}
      </div>
    </div>
  );
}

function Progress({ track, at }: { track: Track; at: number }) {
  const { part } = useTrackProgress(track, at);
  return track.durationMs > 0 ? <div className="kb-music-progress"><span style={{ width: `${part * PERCENT}%` }} /></div> : null;
}
