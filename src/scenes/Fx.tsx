// Effekt-Overlay für Chat-Trigger (config/triggers.json), transparent. Empfohlen 1920x1080.
// Parameter: ?zone=main (nur Aktionen mit dieser zone), ?sound=0, ?volume=0.5
// Braucht den Overlay-Server, denn dort laufen die Trigger.
//
// Ablauf pro Effekt: glitcht rein und steht angehalten (delay), spielt ab samt Ton (duration),
// bleibt angehalten auf dem letzten Bild stehen (after) und glitcht dann raus.
import { useEffect, useRef, useState } from "react";
import { connect, type FxAction, type FxEvent, type FxPosition } from "../twitch.ts";
import { num, params } from "../util.ts";

const ZONE = params.get("zone") ?? "main";
const MAX = 8;

// Dateinamen kommen aus config/media/, volle URLs werden so verwendet
const src = (name: string) => (/^https?:\/\//.test(name) ? name : `/media/${encodeURIComponent(name)}`);

function place(p: FxPosition = "center") {
  if (p === "center") return { x: 50, y: 50 };
  if (p === "random") return { x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 };
  return p;
}

const times = (a: FxAction) => ({ delay: (a.delay ?? 0) * 1000, duration: (a.duration ?? 4) * 1000, after: (a.after ?? 0) * 1000 });

type Shown = FxEvent & { x: number; y: number };
type Phase = "pre" | "play" | "post";

export default function Fx() {
  const [shown, setShown] = useState<Shown[]>([]);

  useEffect(() => connect({
    fx: e => {
      if (e.zone !== ZONE) return;
      setShown(list => [...list, { ...e, ...place(e.action.position) }].slice(-MAX));
      const t = times(e.action);
      setTimeout(() => setShown(list => list.filter(s => s.id !== e.id)), t.delay + t.duration + t.after);
    },
  }), []);

  return <div className="fx">{shown.map(s => <Item key={s.id} item={s} />)}</div>;
}

function Item({ item }: { item: Shown }) {
  const a = item.action;
  const t = times(a);
  const [phase, setPhase] = useState<Phase>(t.delay > 0 ? "pre" : "play");
  const img = useRef<HTMLImageElement>(null);
  const still = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const play = setTimeout(() => setPhase("play"), t.delay);
    const stop = setTimeout(() => setPhase("post"), t.delay + t.duration);
    return () => { clearTimeout(play); clearTimeout(stop); };
  }, []);

  // Aktuelles Bild festhalten: ein GIF lässt sich nicht pausieren, also zeigt ein Canvas das Standbild
  const freeze = () => {
    const i = img.current, c = still.current;
    if (!i?.naturalWidth || !c) return;
    c.width = i.naturalWidth;
    c.height = i.naturalHeight;
    c.getContext("2d")!.drawImage(i, 0, 0);
  };

  useEffect(() => {
    if (phase === "post") freeze();
    if (video.current) phase === "play" ? video.current.play().catch(() => {}) : video.current.pause();
    if (phase === "play" && a.sound && params.get("sound") !== "0") {
      const audio = new Audio(src(a.sound));
      audio.volume = Math.min(1, (a.volume ?? 1) * num("volume", 1));
      audio.play().catch(err => console.warn("Sound blockiert:", err));
    }
  }, [phase]);

  // Platzhalter im Text: {user} und {message}
  const text = (a.text ?? "").replaceAll("{user}", item.user).replaceAll("{message}", item.message);
  const playing = phase === "play";
  return (
    <div
      className="fx-item"
      style={{ left: `${item.x}%`, top: `${item.y}%`, width: a.size, "--life": `${t.delay + t.duration + t.after}ms` } as React.CSSProperties}
    >
      {a.image && (
        <>
          {/* Ab dem Abspielen eigene Adresse (?play=id): das GIF lädt neu und beginnt beim ersten Bild */}
          <img
            ref={img}
            src={phase === "pre" ? src(a.image) : `${src(a.image)}${a.image.includes("?") ? "&" : "?"}play=${item.id}`}
            alt=""
            onLoad={phase === "pre" ? freeze : undefined}
            style={{ display: playing ? "block" : "none" }}
          />
          <canvas ref={still} style={{ display: playing ? "none" : "block" }} />
        </>
      )}
      {/* Eigener Ton des Videos nur, wenn kein separater sound angegeben ist */}
      {a.video && <video ref={video} src={src(a.video)} preload="auto" muted={Boolean(a.sound)} playsInline />}
      {text && <div className="fx-text glow glitch" data-text={text}>{text}</div>}
    </div>
  );
}
