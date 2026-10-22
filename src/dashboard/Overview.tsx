// Overview in the dashboard, in tabs: Live (status of Twitch, Spotify and the theme, test alerts and triggers to fire,
// the stream statistics), Ereignisse (the live event log, EventFeed.tsx), OBS einrichten (import all scenes first, then
// the single URLs with size, copy and test, the overlay key last) and Chat-Befehle (the help command, ChatHelp.tsx) for
// streamers without the trigger section, which has it otherwise. Every URL can be dragged onto the OBS window.
import { type MouseEvent, useEffect, useState } from "react";
import * as streamerPath from "../core/streamerPath.ts";
import { OBS_SCENES, SCENE_SIZES } from "../core/theme.ts";
import { sceneNames } from "../core/themeRuntime.ts";
import { DEFAULT_THEME, findTheme } from "../themes/registry.ts";
import { THEME_SCENES } from "../themes/scenes.tsx";
import { describeStats, type StatKey } from "../core/stats/stats.ts";
import type { AlertKind, StreamStats } from "../core/types.ts";
import { getJson } from "./api.ts";
import type { Act } from "./Dashboard.tsx";
import { type Me, visibleSections } from "./navigation.ts";
import ChatHelp from "./ChatHelp.tsx";
import { reportError } from "./notices.ts";
import EventFeed from "./EventFeed.tsx";
import ObsImport from "./ObsImport.tsx";
import { dragUrl, obsLayout } from "./obsSetup.ts";
import { SubTabs, subTabPanel } from "./SubTabs.tsx";
import { TEXTS } from "./texts.de.ts";

const TEXT = TEXTS.overview;
const TEST_ALERTS: readonly AlertKind[] = ["follow", "sub", "resub", "gift", "cheer", "raid", "redeem", "hype"];
const COPIED_MS = 1500;
const TABS = (["live", "events", "obs", "chat"] as const).map(id => ({ id, label: TEXT.tabs[id] }));

type Tab = (typeof TABS)[number]["id"];
type TriggerInfo = { name: string; enabled: boolean };

export default function Overview({ me, act }: { me: Me; act: Act }) {
  const [tab, setTab] = useState<Tab>("live");
  const tabs = visibleSections(me).includes("triggers") ? TABS.filter(candidate => candidate.id !== "chat") : TABS;
  return (
    <section className="panel overview">
      <SubTabs label={TEXT.tabsLabel} tabs={tabs} current={tab} onChange={setTab} />
      <div className="section-area" {...subTabPanel(tab)}>
        {tab === "live" && <Live me={me} act={act} />}
        {tab === "events" && <section className="settings-group section-card"><EventFeed login={me.login} /></section>}
        {tab === "obs" && <ObsSetup me={me} act={act} />}
        {tab === "chat" && <section className="settings-group section-card"><ChatHelp login={me.login} /></section>}
      </div>
    </section>
  );
}

// What matters while streaming: the connections at a glance, test and fire, the statistics
function Live({ me, act }: { me: Me; act: Act }) {
  const sections = visibleSections(me);
  const theme = findTheme(me.theme) ?? findTheme(DEFAULT_THEME)!;
  const connections = TEXTS.connections;
  const fire = me.features.triggers && me.features.fx;
  return (
    <>
      <p className="overview-status" role="status">
        {me.features.alerts && <span className={me.live ? "glow" : "muted"}>{me.live ? connections.eventSubLive : connections.eventSubConnecting}</span>}
        {me.spotify === true && <span className="glow">{TEXT.spotifyConnected}</span>}
        {me.spotify === false && (
          <span className="muted">{TEXT.spotifyNotConnected}{sections.includes("account") && <> <a href="#/account">{TEXT.connect}</a></>}</span>
        )}
        <span>{TEXT.themeLabel} <b>{theme.name}</b>{sections.includes("theme") && <> <a href="#/theme">{TEXT.changeTheme}</a></>}</span>
      </p>
      <div className="section-cards">
        {(me.features.alerts || fire) && (
          <section className="settings-group section-card">
            <h2>{TEXT.testTitle}</h2>
            {me.features.alerts && (
              <>
                <h3>{TEXT.alertsTitle}</h3>
                <p className="actions">
                  {TEST_ALERTS.map(kind => <button key={kind} className="btn" onClick={() => act(`/api/test?kind=${kind}`, TEXT.testSent(TEXT.alertNames[kind]))}>{TEXT.alertNames[kind]}</button>)}
                </p>
                <p className="muted">{TEXT.testAlerts}</p>
              </>
            )}
            {fire && <TriggerButtons act={act} />}
          </section>
        )}
        {me.features.alerts && <Stats me={me} act={act} />}
      </div>
    </>
  );
}

// Setting up OBS: everything at once first (the usual way), then single sources, the key that is in every URL last
function ObsSetup({ me, act }: { me: Me; act: Act }) {
  const base = `${location.origin}${streamerPath.base(me.login)}`;
  const layout = obsLayout(base, me.login, me.overlayKey, TEXTS.scenes, TEXTS.obs.overlayScene);
  const sources = new Map(layout.flatMap(scene => scene.sources).map(source => [source.scene, source]));
  const available = sceneNames(THEME_SCENES, me.theme);
  return (
    <>
      <section className="settings-group section-card"><ObsImport login={me.login} layout={layout} /></section>
      <section className="settings-group section-card">
        <h2>{TEXT.singleTitle}</h2>
        <p className="muted">{TEXT.obsHint}</p>
        <p className="muted">{TEXT.dragHint}</p>
        <table>
          <thead><tr><th>{TEXT.scene}</th><th>{TEXT.url}</th><th>{TEXT.size}</th><th /></tr></thead>
          <tbody>
            {OBS_SCENES.map(scene => {
              const url = sources.get(scene)!.url;
              // The source stays in the OBS import (empty until a theme with the scene is active), here only the hint
              if (!available.includes(scene)) {
                return <tr key={scene}><td>{TEXTS.scenes[scene]}</td><td colSpan={3} className="muted">{TEXTS.notInTheme}</td></tr>;
              }
              return (
                <tr key={scene}>
                  <td>{TEXTS.scenes[scene]}</td>
                  {/* A click opens nothing, dragging onto OBS creates the source */}
                  <td><a className="obs-drag" href={dragUrl(sources.get(scene)!)} onClick={event => event.preventDefault()}><code>{url}</code></a></td>
                  <td>{SCENE_SIZES[scene].width}x{SCENE_SIZES[scene].height}</td>
                  <td className="actions">
                    <CopyButton text={url} />
                    <a className="btn" href={`${url}&demo`} target="_blank" rel="noreferrer">{TEXT.test}</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="settings-group section-card">
        <h2>{TEXT.keyTitle}</h2>
        <p className="muted">{TEXT.keyHint}</p>
        <p className="actions">
          <button className="btn" onClick={() => { if (confirm(TEXT.rotateConfirm)) act("/api/overlay-key", TEXT.keyRotated); }}>{TEXT.rotateKey}</button>
        </p>
      </section>
    </>
  );
}

const STAT_LINES = (Object.keys(TEXT.statNames) as StatKey[]).map(key => ({ key, label: TEXT.statNames[key] }));

// The count as tiles, with reload and reset; it loads again with every reload of the account (me changes, also after
// the reset) and on the reload button
function Stats({ me, act }: { me: Me; act: Act }) {
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [loads, setLoads] = useState(0);
  useEffect(() => {
    let active = true;
    void getJson<StreamStats | null>("/api/stats", null).then(value => { if (active) setStats(value); });
    return () => { active = false; };
  }, [me, loads]);
  return (
    <section className="settings-group section-card">
      <div className="section-card-head">
        <h2>{TEXT.statsTitle}</h2>
        <button className="btn" onClick={() => setLoads(count => count + 1)} aria-label={TEXT.statsReload} title={TEXT.statsReload}>
          <span aria-hidden="true">{"↻"}</span>
        </button>
      </div>
      {stats && (
        <dl className="stat-tiles">
          {describeStats(stats, STAT_LINES, "de-DE", Date.now()).map(line => <div key={line.key}><dt>{line.label}</dt><dd>{line.value}</dd></div>)}
        </dl>
      )}
      <p className="muted">{TEXT.statsHint}</p>
      <p className="actions">
        <button className="btn" onClick={() => { if (confirm(TEXT.statsResetConfirm)) act("/api/stats/reset", TEXT.statsResetDone); }}>{TEXT.statsReset}</button>
      </p>
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = (event: MouseEvent<HTMLButtonElement>) => {
    // Without clipboard access (http without localhost, permissions) select the URL, Ctrl+C still works
    const code = event.currentTarget.closest("tr")?.querySelector("code");
    navigator.clipboard.writeText(text).then(() => setCopied(true)).catch((failure: unknown) => {
      if (code) getSelection()?.selectAllChildren(code);
      reportError(TEXT.copyFailed, { Aktion: "URL kopieren", Grund: String(failure) });
    });
  };
  return (
    <>
      <button className="btn" onClick={copy}>{copied ? TEXT.copied : TEXT.copy}</button>
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
    <>
      <h3>{TEXT.triggersTitle}</h3>
      {triggers.length === 0 ? <p className="muted">{TEXT.noTriggers}</p> : (
        <p className="actions">
          {triggers.map(trigger => (
            <button key={trigger.name} className="btn" disabled={!trigger.enabled} onClick={() => act(`/api/trigger?name=${encodeURIComponent(trigger.name)}`, TEXT.fired(trigger.name))}>
              {trigger.name}
            </button>
          ))}
        </p>
      )}
    </>
  );
}
