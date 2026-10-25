// Spotify "Now Playing" of the Plantage theme: transistor radio standing on a crate, a mango crate or a plain card,
// cover round or square, header, title (long titles scroll back and forth), artist, album, progress as a vine and a
// mango equalizer. On pause or stop the player fades out (can be switched off). Visibility, progress, cover and
// scrolling text come from the music context of the core (src/core/music). The mango equalizer is PixiJS, the vine grows
// on a new track with GSAP (PLAN-PLANTAGE.md package 4). Parameters: ?demo
import type { Application } from "pixi.js";
import { Graphics } from "pixi.js";
import { type CSSProperties, useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { drawMangoEq } from "../pixi/MangoEq.tsx";
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
  const scope = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    const vine = scope.current?.querySelector(".pl-vine");
    if (vine) timeline.fromTo(vine, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: values.vineGrow, ease: "power2.out" });
  }, [track.id, values.vineGrow], scope);
  return (
    <div ref={scope} className="pl-tuned">
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
      {values.equalizer && <Equalizer playing={track.playing} />}
    </div>
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

const SECOND_MS = 1000; // fixed: seconds in ms

// The mango equalizer in PixiJS; its time runs only while the track plays
function Equalizer({ playing }: { playing: boolean }) {
  const values = usePlantage();
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
      drawMangoEq(bars, seconds, now.equalizerBars, { ...EQ, leaf: now.leaf, leafDark: now.leafDark, mango: now.mango });
    };
    app.ticker.add(paint);
    return () => app.ticker.remove(paint);
  };
  return <PixiStage background={null} size={size} onReady={draw} className="pl-eq" />;
}
