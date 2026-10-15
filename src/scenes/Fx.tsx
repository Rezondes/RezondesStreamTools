// Effekt-Overlay für die Chat-Trigger des Streamers (/s/<login>/fx.html), transparent. Empfohlen 1920x1080.
// Parameter: ?zone=main (nur Aktionen mit dieser zone), ?sound=0, ?volume=0.5
// Braucht den Overlay-Server, denn dort laufen die Trigger.
//
// Ablauf pro Effekt: glitcht rein und steht angehalten (delay), spielt ab samt Ton (duration),
// bleibt angehalten auf dem letzten Bild stehen (after) und glitcht dann raus.
import { useEffect, useRef } from "react";
import * as streamerPath from "../core/streamerPath.ts";
import { streamer } from "../core/connection.ts";
import { numberParam, params } from "../core/params.ts";
import { fxLifetime } from "../core/overlayTiming.ts";
import { useFx, useFxPhase, type ShownFx } from "../core/hooks/useFx.ts";

const ZONE = params.get("zone") ?? "main";
const MAX = 8;

// Dateinamen kommen aus dem Medienordner des Streamers (/s/<login>/media/), volle URLs werden so verwendet
const src = (name: string) => (/^https?:\/\//.test(name) || !streamer ? name : `${streamerPath.base(streamer)}/media/${encodeURIComponent(name)}`);

export default function Fx() {
  const shown = useFx(ZONE, MAX);
  return <div className="fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const a = item.action;
  const phase = useFxPhase(a);
  const img = useRef<HTMLImageElement>(null);
  const still = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  // Aktuelles Bild festhalten: ein GIF lässt sich nicht pausieren, also zeigt ein Canvas das Standbild
  const freeze = () => {
    const image = img.current, canvas = still.current;
    if (!image?.naturalWidth || !canvas) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")!.drawImage(image, 0, 0);
  };

  useEffect(() => {
    if (phase === "post") freeze();
    // Abspielen kann der Browser ohne Nutzerklick verweigern; dann bleibt das Standbild stehen
    if (video.current && phase === "play") video.current.play().catch(() => {});
    else if (video.current) video.current.pause();
    if (phase === "play" && a.sound && params.get("sound") !== "0") {
      const audio = new Audio(src(a.sound));
      audio.volume = Math.min(1, (a.volume ?? 1) * numberParam("volume", 1));
      audio.play().catch((error: unknown) => console.warn("Sound blocked:", error));
    }
  }, [phase, a.sound, a.volume]);

  // Platzhalter im Text: {user} und {message}
  const text = (a.text ?? "").replaceAll("{user}", item.user).replaceAll("{message}", item.message);
  const playing = phase === "play";
  return (
    <div
      className="fx-item"
      style={{ left: `${item.x}%`, top: `${item.y}%`, width: a.size, "--life": `${fxLifetime(a)}ms` } as React.CSSProperties}
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
