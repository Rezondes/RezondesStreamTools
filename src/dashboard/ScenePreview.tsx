// Vorschau einer Szene im Dashboard: das echte Overlay als iframe (/s/<login>/<szene>?demo&preview), skaliert auf
// die verfügbare Breite, und dieselbe Adresse in einem eigenen Tab. Die ungespeicherten Werte gehen über den
// BroadcastChannel an alle Vorschauen, bei jeder Änderung und wenn eine Szene "ready" meldet (useSettings).
import { useEffect, useRef, useState } from "react";
import { PREVIEW } from "../core/hooks/useSettings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { SCENE_SIZES, type SceneName } from "../core/theme.ts";
import type { PublicSettings } from "../core/types.ts";
import { TEXTS } from "./texts.de.ts";

export default function ScenePreview({ login, scene, settings }: { login: string; scene: SceneName; settings: PublicSettings }) {
  const [width, setWidth] = useState(0);
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

  useEffect(() => {
    const observer = new ResizeObserver(() => setWidth(box.current?.clientWidth ?? 0));
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const scale = width ? Math.min(1, width / size.width) : 0;
  const src = `${streamerPath.base(login)}/${scene}?demo&preview`;
  return (
    <div className="scene-preview">
      <p className="actions">
        <a className="btn" href={src} target="_blank" rel="noreferrer">{TEXTS.theme.openTab}</a>
        <span className="muted">{TEXTS.theme.openTabHint}</span>
      </p>
      <div ref={box} className="preview-box" style={{ height: size.height * scale }}>
        <iframe
          key={scene}
          title={TEXTS.theme.preview}
          src={src}
          width={size.width}
          height={size.height}
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
