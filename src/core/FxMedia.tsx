// Medien eines Chat-Effekts für jedes Theme: Bild/GIF, Video und Ton passend zur Phase (useFxPhase).
// Vor und nach dem Abspielen steht das Bild still: ein GIF lässt sich nicht pausieren, darum zeigt dann ein Canvas
// das festgehaltene Bild. Das Theme legt nur Rahmen, Position und Text drumherum.
import { useEffect, useRef } from "react";
import { mediaUrl } from "./connection.ts";
import type { ShownFx } from "./hooks/useFx.ts";
import type { FxPhase } from "./overlayTiming.ts";
import { playSound } from "./sound.ts";

export default function FxMedia({ item, phase }: { item: ShownFx; phase: FxPhase }) {
  const action = item.action;
  const image = useRef<HTMLImageElement>(null);
  const still = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

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

  const playing = phase === "play";
  return (
    <>
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
    </>
  );
}
