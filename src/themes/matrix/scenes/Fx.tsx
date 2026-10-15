// Effekt-Overlay für die Chat-Trigger des Streamers (/s/<login>/fx.html), transparent. Empfohlen 1920x1080.
// Parameter: ?zone=main (nur Aktionen mit dieser zone), ?sound=0, ?volume=0.5
// Braucht den Overlay-Server, denn dort laufen die Trigger. Standarddauer, -grösse, Rand und Animationen
// aus den Einstellungen gelten, wenn eine Aktion sie nicht selbst angibt.
//
// Ablauf pro Effekt: erscheint und steht angehalten (delay), spielt ab samt Ton (duration),
// bleibt angehalten auf dem letzten Bild stehen (after) und verschwindet dann.
import { useEffect, useMemo, useRef } from "react";
import { mediaUrl } from "../../../core/connection.ts";
import { params } from "../../../core/params.ts";
import { playSound } from "../../../core/sound.ts";
import { fillTemplate } from "../../../core/template.ts";
import { fxLifetime } from "../../../core/overlayTiming.ts";
import { useFx, useFxPhase, type ShownFx } from "../../../core/hooks/useFx.ts";
import { useMatrix } from "../useMatrix.ts";

const ZONE = params.get("zone") ?? "main";

export default function Fx() {
  const values = useMatrix();
  const defaults = useMemo(() => ({ duration: values.fxDuration, size: values.fxSize }), [values.fxDuration, values.fxSize]);
  const shown = useFx(ZONE, values.fxMax, defaults, values.fxMargin);
  return <div className="fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useMatrix();
  const action = item.action;
  const phase = useFxPhase(action);
  const image = useRef<HTMLImageElement>(null);
  const still = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  // Aktuelles Bild festhalten: ein GIF lässt sich nicht pausieren, also zeigt ein Canvas das Standbild
  const freeze = () => {
    const source = image.current, canvas = still.current;
    if (!source?.naturalWidth || !canvas) return;
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    canvas.getContext("2d")!.drawImage(source, 0, 0);
  };

  useEffect(() => {
    if (phase === "post") freeze();
    // Abspielen kann der Browser ohne Nutzerklick verweigern; dann bleibt das Standbild stehen
    if (video.current && phase === "play") video.current.play().catch(() => {});
    else if (video.current) video.current.pause();
    if (phase === "play" && action.sound) playSound({ file: action.sound, volume: action.volume ?? 1 }, () => {});
  }, [phase, action.sound, action.volume]);

  const text = fillTemplate(action.text ?? "", { user: item.user, message: item.message });
  const playing = phase === "play";
  return (
    <div
      className={`fx-item in-${values.fxIn} out-${values.fxOut}`}
      style={{ left: `${item.x}%`, top: `${item.y}%`, width: action.size, "--life": `${fxLifetime(action)}ms` } as React.CSSProperties}
    >
      {action.image && (
        <>
          {/* Ab dem Abspielen eigene Adresse (?play=id): das GIF lädt neu und beginnt beim ersten Bild */}
          <img
            ref={image}
            src={phase === "pre" ? mediaUrl(action.image) : `${mediaUrl(action.image)}${action.image.includes("?") ? "&" : "?"}play=${item.id}`}
            alt=""
            onLoad={phase === "pre" ? freeze : undefined}
            style={{ display: playing ? "block" : "none" }}
          />
          <canvas ref={still} style={{ display: playing ? "none" : "block" }} />
        </>
      )}
      {/* Eigener Ton des Videos nur, wenn kein separater sound angegeben ist */}
      {action.video && <video ref={video} src={mediaUrl(action.video)} preload="auto" muted={Boolean(action.sound)} playsInline />}
      {text && <div className="fx-text glow glitch" data-text={text}>{text}</div>}
    </div>
  );
}
