// Preview of a scene in the dashboard: the real overlay as iframe (/s/<login>/<scene>?demo&preview), scaled to
// the available space, and the same URL in its own tab. The unsaved values go via the
// BroadcastChannel to all previews, on every change and when a scene reports "ready" (useSettings).
import { useEffect, useRef, useState } from "react";
import { PREVIEW } from "../core/hooks/useSettings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { SCENE_SIZES, type SceneName } from "../core/theme.ts";
import type { PublicSettings } from "../core/types.ts";
import { TEXTS } from "./texts.de.ts";

type Props = { login: string; overlayKey: string; scene: SceneName; settings: PublicSettings; available: boolean };

export default function ScenePreview({ login, overlayKey, scene, settings, available }: Props) {
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const box = useRef<HTMLDivElement>(null);
  const size = SCENE_SIZES[scene];

  // One channel for the whole lifetime; latest holds the current values for scenes that report "ready" later
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

  // The box has the aspect ratio of the scene and shrinks into the space (CSS); the scene fits width and height
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
        {/* Scene the theme does not bring: only the hint (the overlay page would stay empty); the box stays for the observer */}
        {!available && <p className="muted">{TEXTS.notInTheme}</p>}
        {available && <iframe
          key={scene}
          title={TEXTS.theme.preview}
          src={src}
          width={size.width}
          height={size.height}
          style={{ left: (room.width - size.width * scale) / 2, transform: `scale(${scale})` }}
        />}
      </div>
    </div>
  );
}
