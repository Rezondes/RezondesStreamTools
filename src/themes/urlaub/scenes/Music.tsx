// Spotify "Now Playing" of the Urlaub theme: beach radio of wood, shell or a plain card, cover round or
// square, header, title (long titles scroll back and forth), artist, album, progress as a wave line and a
// wave equalizer. On pause or stop the player fades out (can be switched off). Visibility, progress, cover and
// scrolling text come from the music context of the core (src/core/music). Parameters: ?demo
import type { Application } from "pixi.js";
import { Graphics } from "pixi.js";
import { type CSSProperties, useRef } from "react";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import type { Track } from "../../../core/types.ts";
import { ICONS } from "../beach.ts";
import { drawEqualizer } from "../pixi/WaveEq.tsx";
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
      {values.equalizer && <Equalizer playing={track.playing} />}
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

const SECOND_MS = 1000; // fixed: seconds in ms

// The wave equalizer in PixiJS; its time runs only while the track plays
function Equalizer({ playing }: { playing: boolean }) {
  const values = useUrlaub();
  const latest = useRef({ values, playing });
  latest.current = { values, playing };
  // bar width, gap and height of the equalizer (settings, px)
  const EQ = { bar: values.eqBar, gap: values.eqGap, height: values.eqHeight };
  const size = { width: values.equalizerBars * (EQ.bar + EQ.gap) - EQ.gap, height: EQ.height };
  const draw = (app: Application) => {
    const bars = app.stage.addChild(new Graphics());
    let seconds = 0;
    const paint = () => {
      if (latest.current.playing) seconds += app.ticker.deltaMS / SECOND_MS;
      const now = latest.current.values;
      drawEqualizer(bars, seconds, now.equalizerBars, { ...EQ, sea: now.sea, foam: now.foam });
    };
    app.ticker.add(paint);
    return () => app.ticker.remove(paint);
  };
  return <PixiStage background={null} size={size} onReady={draw} className="ul-eq" />;
}
