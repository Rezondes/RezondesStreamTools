// Spotify "Now Playing", transparent. Empfohlen 900x240, Box sitzt unten in der Quelle.
// Darstellung (cover, record, vinyl, none), Texte, Equalizer, Platte, Grössen und Animationen kommen aus den
// Einstellungen. Parameter: ?demo
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Track } from "../../../core/types.ts";
import { clock, currentProgress } from "../../../core/overlayTiming.ts";
import { textBar } from "../../../core/template.ts";
import { useMusic } from "../../../core/hooks/useMusic.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { vinyl } from "../../../core/vinyl.ts";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { useMatrix } from "../useMatrix.ts";

// fixed: Platte mit 12 Bildern pro Sekunde (wirkt wie ein Terminal, schont die CPU), Equalizer alle 130 ms, Fortschritt 4-mal pro Sekunde
const PACE = { vinylFrameMs: 1000 / 12, equalizerMs: 130, progressMs: 250 };
// fixed: Zeitanzeige in Minuten:Sekunden (clock liefert HH:MM:SS, ab Zeichen 3)
const TIME = { secondMs: 1000, minutesFrom: 3 };
// fixed: eine volle Umdrehung der Platte im Bogenmass
const TURN = Math.PI * 2;

export default function Music() {
  const values = useMatrix();
  const { track, last, receivedAt } = useMusic();

  // Ausblenden, wenn nichts läuft; der letzte Titel bleibt für die Ausblend-Animation stehen
  const idle: Track = { id: "idle", title: values.musicIdleTitle, artist: values.musicIdleArtist, album: "", cover: null, durationMs: 0, progressMs: 0, playing: false };
  const visible = values.musicHide ? Boolean(track?.playing) : true;
  const shown = track ?? (values.musicHide ? last : idle);
  if (!shown) return null;

  return (
    <div className="music">
      {/* key pro Titel: bei jedem Wechsel wird die Box neu aufgebaut und erscheint neu */}
      <div key={shown.id} className={`music-box in-${values.musicIn} out-${values.musicOut}${visible ? "" : " off"}`}>
        {values.musicArt !== "none" && <Art track={shown} />}
        <Info track={shown} at={track ? receivedAt : 0} />
      </div>
    </div>
  );
}

function Art({ track }: { track: Track }) {
  const values = useMatrix();
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [track.cover]);
  const cover = track.cover && !broken ? track.cover : null;
  if (values.musicArt === "cover" && cover) {
    return (
      <div className="music-cover" key={cover}>
        <img src={cover} alt="" onError={() => setBroken(true)} />
      </div>
    );
  }
  // record: Cover über die ganze Platte, sonst die reine ASCII-Platte
  return <Vinyl playing={track.playing} cover={values.musicArt === "record" ? cover : null} onBroken={() => setBroken(true)} />;
}

// Das Cover dreht mit demselben Winkel wie die Rillen; die runde Maske selbst steht still
function Vinyl({ playing, cover, onBroken }: { playing: boolean; cover: string | null; onBroken: () => void }) {
  const values = useMatrix();
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setAngle(previous => (previous + values.vinylSpeed) % TURN), PACE.vinylFrameMs);
    return () => clearInterval(id);
  }, [playing, values.vinylSpeed]);
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
  const now = useNow(PACE.progressMs);
  const title = useMatrixDecode(track.title, "musicTitle");
  const artist = useMatrixDecode(track.artist, "musicArtist");
  // at = 0: Titel aus dem Gedächtnis (ausgeblendet), dann nicht weiterrechnen
  const progress = at ? currentProgress(track, at, now) : track.progressMs;
  const part = track.durationMs ? progress / track.durationMs : 0;
  const time = (ms: number) => clock(ms / TIME.secondMs).slice(TIME.minutesFrom);

  return (
    <div className="music-info">
      <div className="music-head muted">
        <span>{track.playing ? values.musicHeadPlaying : values.musicHeadPaused}</span>
        {values.equalizer && <Equalizer playing={track.playing} />}
      </div>
      <Marquee className="music-title glow">{title}</Marquee>
      <Marquee className="music-artist">{artist}</Marquee>
      {track.album && <Marquee className="music-album muted">{track.album}</Marquee>}
      {track.durationMs > 0 && (
        <div className="music-progress">
          {time(progress)} [{textBar(part, values.musicBarWidth, values.barFull, values.barEmpty)}] {time(track.durationMs)}
        </div>
      )}
    </div>
  );
}

// Spotify liefert keine Audiodaten mehr, darum ein Zufalls-Equalizer, der nur bei Wiedergabe tanzt
function Equalizer({ playing }: { playing: boolean }) {
  const { equalizerBars, equalizerChars } = useMatrix();
  const [bars, setBars] = useState("");
  useEffect(() => {
    const chars = Array.from(equalizerChars);
    setBars((chars[0] ?? "").repeat(equalizerBars));
    if (!playing) return;
    const id = setInterval(() => setBars(Array.from({ length: equalizerBars }, () => chars[(Math.random() * chars.length) | 0]).join("")), PACE.equalizerMs);
    return () => clearInterval(id);
  }, [playing, equalizerBars, equalizerChars]);
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
