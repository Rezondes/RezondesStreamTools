// Overview in the dashboard: the ready OBS URLs of the streamer (/s/<login>/<scene>) with size, copy and
// test (fake events), plus test alerts and triggers to fire when the features are released. Every URL
// can be dragged onto the OBS window; below it the import of all scenes (ObsImport.tsx).
import { type MouseEvent, useEffect, useState } from "react";
import * as streamerPath from "../core/streamerPath.ts";
import { OBS_SCENES, SCENE_SIZES } from "../core/theme.ts";
import type { AlertKind } from "../core/types.ts";
import { getJson } from "./api.ts";
import type { Act } from "./Dashboard.tsx";
import type { Me } from "./navigation.ts";
import ChatHelp from "./ChatHelp.tsx";
import ObsImport from "./ObsImport.tsx";
import { dragUrl, obsLayout } from "./obsSetup.ts";
import { TEXTS } from "./texts.de.ts";

const TEST_ALERTS: readonly AlertKind[] = ["follow", "sub", "resub", "gift", "cheer", "raid", "redeem", "hype"];
const COPIED_MS = 1500;

type TriggerInfo = { name: string; enabled: boolean };

export default function Overview({ me, act }: { me: Me; act: Act }) {
  const base = `${location.origin}${streamerPath.base(me.login)}`;
  const layout = obsLayout(base, me.login, me.overlayKey, TEXTS.scenes, TEXTS.obs.overlayScene);
  const sources = new Map(layout.flatMap(scene => scene.sources).map(source => [source.scene, source]));
  return (
    <section className="panel">
      <p className="muted">{TEXTS.overview.obsHint}</p>
      <p className="muted">{TEXTS.overview.dragHint}</p>
      <p className="actions">
        <span className="muted">{TEXTS.overview.keyHint}</span>
        <button className="btn" onClick={() => { if (confirm(TEXTS.overview.rotateConfirm)) act("/api/overlay-key"); }}>{TEXTS.overview.rotateKey}</button>
      </p>
      <table>
        <thead><tr><th>{TEXTS.overview.scene}</th><th>{TEXTS.overview.url}</th><th>{TEXTS.overview.size}</th><th /></tr></thead>
        <tbody>
          {OBS_SCENES.map(scene => {
            const url = sources.get(scene)!.url;
            return (
              <tr key={scene}>
                <td>{TEXTS.scenes[scene]}</td>
                {/* A click opens nothing, dragging onto OBS creates the source */}
                <td><a className="obs-drag" href={dragUrl(sources.get(scene)!)} onClick={event => event.preventDefault()}><code>{url}</code></a></td>
                <td>{SCENE_SIZES[scene].width}x{SCENE_SIZES[scene].height}</td>
                <td className="actions">
                  <CopyButton text={url} />
                  <a className="btn" href={`${url}&demo`} target="_blank" rel="noreferrer">{TEXTS.overview.test}</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {me.features.alerts && (
        <p className="actions">
          <span className="muted">{TEXTS.overview.testAlerts}</span>
          {TEST_ALERTS.map(kind => <button key={kind} className="btn" onClick={() => act(`/api/test?kind=${kind}`)}>{TEXTS.overview.alertNames[kind]}</button>)}
        </p>
      )}
      {me.features.triggers && me.features.fx && <TriggerButtons act={act} />}
      <ObsImport login={me.login} layout={layout} />
      <ChatHelp login={me.login} />
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = (event: MouseEvent<HTMLButtonElement>) => {
    // Without clipboard access (http without localhost, permissions) select the URL, Ctrl+C still works
    const code = event.currentTarget.closest("tr")?.querySelector("code");
    navigator.clipboard.writeText(text).then(() => { setFailed(false); setCopied(true); }).catch(() => {
      if (code) getSelection()?.selectAllChildren(code);
      setFailed(true);
    });
  };
  return (
    <>
      <button className="btn" onClick={copy}>{copied ? TEXTS.overview.copied : TEXTS.overview.copy}</button>
      {failed && <span role="status" className="muted">{TEXTS.overview.copyFailed}</span>}
    </>
  );
}

function TriggerButtons({ act }: { act: Act }) {
  const [triggers, setTriggers] = useState<TriggerInfo[]>([]);
  useEffect(() => {
    let active = true;
    getJson<TriggerInfo[]>("/api/triggers", [])
      .then(list => { if (active) setTriggers(list); })
      .catch((error: unknown) => console.warn("Loading triggers failed:", error));
    return () => { active = false; };
  }, []);
  return (
    <p className="actions">
      <span className="muted">{TEXTS.overview.fireTriggers}</span>
      {triggers.length === 0 && <span className="muted">{TEXTS.overview.noTriggers}</span>}
      {triggers.map(trigger => (
        <button key={trigger.name} className="btn" disabled={!trigger.enabled} onClick={() => act(`/api/trigger?name=${encodeURIComponent(trigger.name)}`)}>
          {trigger.name}
        </button>
      ))}
    </p>
  );
}
