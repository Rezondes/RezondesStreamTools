// Spotify "Now Playing" of the Dogs theme (DESIGN-DOGS.md "Musik"): a pixel sign with the cover, the label, title and
// artist as running text and the progress as a track of paws; beside it the streamer's dog with headphones bobbing to
// the beat (musicBob per second). Or only the sign, or plain. Visibility, progress, cover and running text come from
// the music context of the core. Parameters: ?demo
import { useMemo, type CSSProperties } from "react";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import type { Track } from "../../../core/types.ts";
import { BREED_IDS, isBreed } from "../breeds.ts";
import { dogCache } from "../dog.ts";
import { withHeadphones } from "../headphones.ts";
import { dogLookOf } from "../looks.ts";
import { poseAt } from "../poses.ts";
import Pixels from "../ui/Pixels.tsx";
import PixelBox from "../ui/PixelBox.tsx";
import { useDogs } from "../useDogs.ts";

// fixed: paws in the track, a share in percent, the dog at 0.6 of the world pixel size
const TRACK = { paws: 12, percent: 100, dogScale: 0.6 };

export default function Music() {
  const values = useDogs();
  const { shown, visible, at } = useNowPlaying(values.musicHide);
  const sign = (
    <>
      <Display track={shown} />
      {shown && <Progress track={shown} at={at} />}
    </>
  );
  return (
    <div className={`dg-music dg-music-${values.musicStyle}${visible ? "" : " leaving"}`}>
      {values.musicStyle === "hund" && <MusicDog />}
      {values.musicStyle === "schlicht" ? <div className="dg-music-sign">{sign}</div> : <PixelBox className="dg-music-sign">{sign}</PixelBox>}
    </div>
  );
}

function MusicDog() {
  const values = useDogs();
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const image = useMemo(() => {
    const stand = dogCache(dogLookOf(values, breed, values.coat)).pose(poseAt({ time: 0, mode: "stand", fps: values.walkFps, wagSpeed: 0, blinkEvery: 0, pant: values.pant }));
    return withHeadphones(stand, breed, { band: values.ink, cup: values.accent, ink: values.ink }).image;
  }, [values, breed]);
  const bob = values.musicBob > 0 && values.quality !== "niedrig" ? ({ "--dg-bob": `${1 / values.musicBob}s` } as CSSProperties) : undefined;
  return <div className={`dg-music-dog${bob ? " bobbing" : ""}`} style={bob}><Pixels image={image} className="dg-music-dog-image" pixelScale={values.pixelScale * TRACK.dogScale} /></div>;
}

function Display({ track }: { track: Track | null }) {
  const values = useDogs();
  const cover = useCover(track?.cover ?? null);
  if (!track) return <p className="dg-music-idle">{values.musicIdle}</p>;
  const line = (text: string, className: string) => <Marquee text={text} speed={values.musicMarqueeSpeed} enabled className={className} />;
  return (
    <div className="dg-track">
      {values.musicCover && cover.src && <img className="dg-cover" src={cover.src} alt="" onError={cover.onError} />}
      <div className="dg-track-text">
        <span className="dg-caption">{values.musicLabel}</span>
        {line(track.title, "dg-track-title")}
        {line(track.artist, "dg-track-artist")}
      </div>
    </div>
  );
}

function Progress({ track, at }: { track: Track; at: number }) {
  const values = useDogs();
  const { part } = useTrackProgress(track, at);
  if (track.durationMs <= 0) return null;
  if (!values.musicPaws) return <div className="dg-music-bar"><span style={{ width: `${part * TRACK.percent}%` }} /></div>;
  const walked = Math.round(part * TRACK.paws);
  return <div className="dg-music-paws">{Array.from({ length: TRACK.paws }, (_, index) => <i key={index} className={`dg-paw${index < walked ? " on" : ""}`} />)}</div>;
}
