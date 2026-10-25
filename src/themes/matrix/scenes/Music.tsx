// Spotify "Now Playing", transparent. Recommended 900x240, the box sits at the bottom of the source.
// Display (cover, record, vinyl, none), texts, equalizer, record, sizes and animations come from the
// settings. Visibility, progress, cover and scrolling text come from the music context of the core (src/core/music),
// here only the matrix look with record and character equalizer. Parameters: ?demo
import { useEffect, useState } from "react";
import type { Track } from "../../../core/types.ts";
import Marquee from "../../../core/music/Marquee.tsx";
import { useCover } from "../../../core/music/useCover.ts";
import { useNowPlaying } from "../../../core/music/useNowPlaying.ts";
import { useTrackProgress } from "../../../core/music/useTrackProgress.ts";
import { textBar } from "../../../core/template.ts";
import { vinyl } from "../../../core/vinyl.ts";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { useMatrix } from "../useMatrix.ts";

const SECOND_MS = 1000; // fixed: seconds in ms
// fixed: one full turn of the record in radians
const TURN = Math.PI * 2;

export default function Music() {
  const values = useMatrix();
  const playing = useNowPlaying(values.musicHide);
  // Idle state as its own line in the player
  const idle: Track = { id: "idle", title: values.musicIdleTitle, artist: values.musicIdleArtist, album: "", cover: null, durationMs: 0, progressMs: 0, playing: false };
  const shown = playing.shown ?? (values.musicHide ? null : idle);
  if (!shown) return null;
  const visible = playing.visible;

  return (
    <div className="music">
      {/* key per track: on every change the box is rebuilt and appears anew */}
      <div key={shown.id} className={`music-box in-${values.musicIn} out-${values.musicOut}${visible ? "" : " off"}`}>
        {values.musicArt !== "none" && <Art track={shown} />}
        <Info track={shown} at={playing.at} />
      </div>
    </div>
  );
}

function Art({ track }: { track: Track }) {
  const values = useMatrix();
  const cover = useCover(track.cover);
  if (values.musicArt === "cover" && cover.src) {
    return (
      <div className="music-cover" key={cover.src}>
        <img src={cover.src} alt="" onError={cover.onError} />
      </div>
    );
  }
  // record: cover over the whole record, otherwise the plain ASCII record
  return <Vinyl playing={track.playing} cover={values.musicArt === "record" ? cover.src : null} onBroken={cover.onError} />;
}

// The cover turns at the same angle as the grooves; the round mask itself stands still
function Vinyl({ playing, cover, onBroken }: { playing: boolean; cover: string | null; onBroken: () => void }) {
  const values = useMatrix();
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setAngle(previous => (previous + values.vinylSpeed) % TURN), SECOND_MS / Math.max(1, values.musicVinylFps));
    return () => clearInterval(id);
  }, [playing, values.vinylSpeed, values.musicVinylFps]);
  return (
    <div className="music-record">
      {cover && (
        <div className="record-cover" key={cover}>
          <img src={cover} alt="" onError={onBroken} style={{ transform: `translate(-50%, -50%) rotate(${angle}rad)` }} />
        </div>
      )}
      <pre className="music-vinyl glow" aria-hidden="true">{vinyl(angle, values.vinylSize, Boolean(cover))}</pre>
    </div>
  );
}

function Info({ track, at }: { track: Track; at: number }) {
  const values = useMatrix();
  const title = useMatrixDecode(track.title, "musicTitle");
  const artist = useMatrixDecode(track.artist, "musicArtist");
  const { part, elapsed, total } = useTrackProgress(track, at);
  const line = (text: string, className: string) => <Marquee text={text} speed={values.musicMarqueeSpeed} className={className} />;

  return (
    <div className="music-info">
      <div className="music-head muted">
        <span>{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}</span>
        {values.equalizer && <Equalizer playing={track.playing} />}
      </div>
      {line(title, "music-title glow")}
      {line(artist, "music-artist")}
      {track.album && line(track.album, "music-album muted")}
      {track.durationMs > 0 && (
        <div className="music-progress">
          {elapsed} [{textBar(part, values.musicBarWidth, values.barFull, values.barEmpty)}] {total}
        </div>
      )}
    </div>
  );
}

// Spotify no longer provides audio data, so a random equalizer that only dances while playing
function Equalizer({ playing }: { playing: boolean }) {
  const { equalizerBars, equalizerChars, musicEqualizerMs } = useMatrix();
  const [bars, setBars] = useState("");
  useEffect(() => {
    const chars = Array.from(equalizerChars);
    setBars((chars[0] ?? "").repeat(equalizerBars));
    if (!playing) return;
    const id = setInterval(() => setBars(Array.from({ length: equalizerBars }, () => chars[(Math.random() * chars.length) | 0]).join("")), musicEqualizerMs);
    return () => clearInterval(id);
  }, [playing, equalizerBars, equalizerChars, musicEqualizerMs]);
  return <span className="music-eq">{bars}</span>;
}
