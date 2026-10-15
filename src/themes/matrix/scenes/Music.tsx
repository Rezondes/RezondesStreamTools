// Spotify "Now Playing", transparent. Empfohlen 900x240, Box sitzt unten in der Quelle.
// Parameter: ?art=cover (Cover, sonst Platte) | record (Platte mit Cover als Etikett) | vinyl (immer Platte) | none,
// ?hide=0 (bei Pause/Stopp sichtbar bleiben), ?demo
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Track } from "../../../core/types.ts";
import { params } from "../../../core/params.ts";
import { clock, currentProgress } from "../../../core/overlayTiming.ts";
import { useDecode } from "../../../core/hooks/useDecode.ts";
import { useMusic } from "../../../core/hooks/useMusic.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { vinyl } from "../../../core/vinyl.ts";

const ART = params.get("art") ?? "cover";
const HIDE = params.get("hide") !== "0";
const IDLE: Track = { id: "idle", title: "KEINE WIEDERGABE", artist: "spotify://offline", album: "", cover: null, durationMs: 0, progressMs: 0, playing: false };

export default function Music() {
  const { track, last, receivedAt: at } = useMusic();

  // Ausblenden, wenn nichts läuft; der letzte Titel bleibt für die Ausblend-Animation stehen
  const visible = HIDE ? Boolean(track?.playing) : true;
  const shown = track ?? (HIDE ? last : IDLE);
  if (!shown) return null;

  return (
    <div className="music">
      {/* key pro Titel: bei jedem Wechsel wird die Box neu aufgebaut und glitcht rein */}
      <div key={shown.id} className={`music-box${visible ? "" : " off"}`}>
        {ART !== "none" && <Art track={shown} />}
        <Info track={shown} at={track ? at : 0} />
      </div>
    </div>
  );
}

function Art({ track }: { track: Track }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [track.cover]);
  const cover = track.cover && !broken ? track.cover : null;
  if (ART === "cover" && cover) {
    return (
      <div className="music-cover" key={cover}>
        <img src={cover} alt="" onError={() => setBroken(true)} />
      </div>
    );
  }
  // record: Cover über die ganze Platte, sonst die reine ASCII-Platte
  return <Vinyl playing={track.playing} cover={ART === "record" ? cover : null} onBroken={() => setBroken(true)} />;
}

// Dreht mit 12 Bildern pro Sekunde, das wirkt wie ein Terminal und schont die CPU.
// Das Cover dreht mit demselben Winkel wie die Rillen; die runde Maske selbst steht still.
function Vinyl({ playing, cover, onBroken }: { playing: boolean; cover: string | null; onBroken: () => void }) {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setAngle(a => (a + 0.16) % (Math.PI * 2)), 1000 / 12);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <div className="music-record">
      {cover && (
        <div className="record-cover" key={cover}>
          <img src={cover} alt="" onError={onBroken} style={{ transform: `translate(-50%, -50%) rotate(${angle}rad)` }} />
        </div>
      )}
      <pre className="music-vinyl glow" aria-hidden="true">{vinyl(angle, 21, Boolean(cover))}</pre>
    </div>
  );
}

function Info({ track, at }: { track: Track; at: number }) {
  const now = useNow(250);
  const title = useDecode(track.title, 350, 30);
  const artist = useDecode(track.artist, 650, 18);
  // at = 0: Titel aus dem Gedächtnis (ausgeblendet), dann nicht weiterrechnen
  const progress = at ? currentProgress(track, at, now) : track.progressMs;
  const part = track.durationMs ? progress / track.durationMs : 0;
  const width = 32;
  const filled = Math.round(part * width);

  return (
    <div className="music-info">
      <div className="music-head muted">
        <span>{`> NOW PLAYING // ${track.playing ? "SPOTIFY" : "PAUSE"}`}</span>
        <Equalizer playing={track.playing} />
      </div>
      <Marquee className="music-title glow">{title}</Marquee>
      <Marquee className="music-artist">{artist}</Marquee>
      {track.album && <Marquee className="music-album muted">{track.album}</Marquee>}
      {track.durationMs > 0 && (
        <div className="music-progress">
          {clock(progress / 1000).slice(3)} [{"█".repeat(filled)}{"░".repeat(width - filled)}] {clock(track.durationMs / 1000).slice(3)}
        </div>
      )}
    </div>
  );
}

// Spotify liefert keine Audiodaten mehr, darum ein Zufalls-Equalizer, der nur bei Wiedergabe tanzt
const BARS = "▁▂▃▄▅▆▇█";
function Equalizer({ playing }: { playing: boolean }) {
  const [bars, setBars] = useState("▁".repeat(12));
  useEffect(() => {
    if (!playing) return setBars("▁".repeat(12));
    const id = setInterval(() => setBars(Array.from({ length: 12 }, () => BARS[(Math.random() * BARS.length) | 0]).join("")), 130);
    return () => clearInterval(id);
  }, [playing]);
  return <span className="music-eq">{bars}</span>;
}

// Zu lange Zeilen laufen langsam hin und her statt abgeschnitten zu werden
function Marquee({ className, children }: { className: string; children: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  useLayoutEffect(() => {
    setOverflow(Math.max(0, inner.current!.scrollWidth - outer.current!.clientWidth));
  }, [children]);
  return (
    <div ref={outer} className={`marquee ${className}`}>
      <span ref={inner} className={overflow ? "scroll" : ""} style={{ "--shift": `-${overflow}px` } as React.CSSProperties}>{children}</span>
    </div>
  );
}
