// Vorschau einer Szene im Dashboard: das echte Overlay als iframe (/s/<login>/<szene>?demo&preview), skaliert auf
// den verfügbaren Platz, und dieselbe Adresse in einem eigenen Tab. Die ungespeicherten Werte gehen über den
// BroadcastChannel an alle Vorschauen, bei jeder Änderung und wenn eine Szene "ready" meldet (useSettings).
import { useEffect, useRef, useState } from "react";
import { PREVIEW } from "../core/hooks/useSettings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { SCENE_SIZES, type SceneName } from "../core/theme.ts";
import type { PublicSettings } from "../core/types.ts";
import { TEXTS } from "./texts.de.ts";

export default function ScenePreview({ login, overlayKey, scene, settings }: { login: string; overlayKey: string; scene: SceneName; settings: PublicSettings }) {
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const box = useRef<HTMLDivElement>(null);
  const size = SCENE_SIZES[scene];

  // Ein Kanal für die ganze Lebenszeit; latest hält die aktuellen Werte für Szenen, die erst später "ready" melden
  const channel = useRef<BroadcastChannel | null>(null);
  const latest = useRef(settings);
  useEffect(() => {
    const open = new BroadcastChannel(PREVIEW.channel);
    open.onmessage = (event: MessageEvent) => {
      if ((event.data as { type?: unknown } | null)?.type === PREVIEW.ready) open.postMessage({ type: PREVIEW.settings, settings: latest.current });
    };
    channel.current = open;
    return () => open.close();
  }, []);
  useEffect(() => {
    latest.current = settings;
    channel.current?.postMessage({ type: PREVIEW.settings, settings });
  }, [settings]);

  // Die Box hat das Seitenverhältnis der Szene und schrumpft in den Platz (CSS); die Szene passt in Breite und Höhe
  useEffect(() => {
    const observer = new ResizeObserver(() => setRoom({ width: box.current?.clientWidth ?? 0, height: box.current?.clientHeight ?? 0 }));
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const scale = room.width && room.height ? Math.min(1, room.width / size.width, room.height / size.height) : 0;
  const src = `${streamerPath.base(login)}/${scene}?demo&preview&key=${encodeURIComponent(overlayKey)}`;
  return (
    <div className="scene-preview">
      <p className="actions">
        <a className="btn" href={src} target="_blank" rel="noreferrer">{TEXTS.theme.openTab}</a>
        <span className="muted">{TEXTS.theme.openTabHint}</span>
      </p>
      <div ref={box} className="preview-box" style={{ aspectRatio: `${size.width} / ${size.height}`, maxWidth: size.width }}>
        <iframe
          key={scene}
          title={TEXTS.theme.preview}
          src={src}
          width={size.width}
          height={size.height}
          style={{ left: (room.width - size.width * scale) / 2, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
