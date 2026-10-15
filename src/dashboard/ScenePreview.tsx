// Vorschau einer Szene im Dashboard: das echte Overlay als iframe (/s/<login>/<szene>?demo&preview), skaliert auf
// die verfügbare Breite. Die ungespeicherten Werte gehen per postMessage hinein, sobald die Szene "ready" meldet
// (useSettings in der Overlay-Seite), und bei jeder Änderung erneut.
import { useEffect, useRef, useState } from "react";
import { PREVIEW } from "../core/hooks/useSettings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { SCENE_SIZES, SCENES, type SceneName } from "../core/theme.ts";
import type { PublicSettings } from "../core/types.ts";
import { TEXTS } from "./texts.de.ts";

export default function ScenePreview({ login, settings }: { login: string; settings: PublicSettings }) {
  const [scene, setScene] = useState<SceneName>("alerts");
  const [width, setWidth] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const size = SCENE_SIZES[scene];

  // Werte bei jeder Änderung und auf "ready" der Szene schicken (die Szene kann nach dem Laden noch nicht zuhören)
  useEffect(() => {
    const send = () => frame.current?.contentWindow?.postMessage({ type: PREVIEW.settings, settings }, location.origin);
    const ready = (event: MessageEvent) => {
      const data = event.data as { type?: unknown } | null;
      if (event.origin === location.origin && event.source === frame.current?.contentWindow && data?.type === PREVIEW.ready) send();
    };
    send();
    addEventListener("message", ready);
    return () => removeEventListener("message", ready);
  }, [settings]);

  useEffect(() => {
    const observer = new ResizeObserver(() => setWidth(box.current?.clientWidth ?? 0));
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const scale = width ? Math.min(1, width / size.width) : 0;
  return (
    <div className="scene-preview">
      <label className="setting">
        {TEXTS.theme.previewScene}
        <select value={scene} onChange={event => setScene(event.target.value as SceneName)}>
          {SCENES.map(name => <option key={name} value={name}>{TEXTS.scenes[name]}</option>)}
        </select>
      </label>
      <div ref={box} className="preview-box" style={{ height: size.height * scale }}>
        <iframe
          key={scene}
          ref={frame}
          title={TEXTS.theme.preview}
          src={`${streamerPath.base(login)}/${scene}?demo&preview`}
          width={size.width}
          height={size.height}
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
