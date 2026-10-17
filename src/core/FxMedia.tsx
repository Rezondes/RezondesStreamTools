// Media of a chat effect for every theme: image/GIF, video and sound matching the phase (useFxPhase).
// Before and after playing, the image stands still: a GIF cannot be paused, so a canvas then shows
// the frozen image. The theme only adds frame, position and text around it.
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
    // The browser may refuse to play without a user click; then the still image stays
    if (video.current && phase === "play") video.current.play().catch(() => {});
    else if (video.current) video.current.pause();
    if (phase === "play" && action.sound) playSound({ file: action.sound, volume: action.volume ?? 1 }, () => {});
  }, [phase, action.sound, action.volume]);

  const playing = phase === "play";
  return (
    <>
      {action.image && (
        <>
          {/* From playback on its own URL (?play=id): the GIF reloads and starts at the first frame */}
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
      {/* The video's own sound only if no separate sound is given */}
      {action.video && <video ref={video} src={mediaUrl(action.video)} preload="auto" muted={Boolean(action.sound)} playsInline />}
    </>
  );
}
