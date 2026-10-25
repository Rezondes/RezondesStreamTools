// Overview in the dashboard, in tabs: Live (status of Twitch, Spotify and the theme, test alerts and triggers to fire,
// the stream statistics), Ereignisse (the live event log, EventFeed.tsx), OBS einrichten (import all scenes first, then
// the single URLs with size, copy and test, also one effects source per further zone of the triggers, the overlay key
// last) and Chat-Befehle (the help command, ChatHelp.tsx) for
// streamers without the trigger section, which has it otherwise. Every URL can be dragged onto the OBS window.
import { type MouseEvent, useEffect, useState } from "react";
import * as streamerPath from "../core/streamerPath.ts";
import { areasOf } from "../core/sceneArea.ts";
import { effectiveSettings } from "../core/settings.ts";
import { OBS_SCENES, type SceneArea } from "../core/theme.ts";
import { sceneNames } from "../core/themeRuntime.ts";
import { DEFAULT_THEME, findModule, findTheme } from "../themes/registry.ts";
import { THEME_SCENES } from "../themes/scenes.tsx";
import { describeStats, type StatKey } from "../core/stats/stats.ts";
import type { AlertKind, StreamStats } from "../core/types.ts";
import type { Trigger } from "../generated/Trigger.ts";
import { getJson } from "./api.ts";
import type { Act } from "./Dashboard.tsx";
import { type Me, visibleSections } from "./navigation.ts";
import ChatHelp from "./ChatHelp.tsx";
import { reportError } from "./notices.ts";
import EventFeed from "./EventFeed.tsx";
import ObsImport from "./ObsImport.tsx";
import OfflineDownloads from "./OfflineDownloads.tsx";
import { dragUrl, fxZones, obsLayout, type ObsSource } from "./obsSetup.ts";
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

type SettingsFile = { values: Record<string, Record<string, unknown>> };

// The size of every OBS source for the saved values of the active theme; the defaults until they are loaded
function useAreas(themeId: string) {
  const schema = findTheme(themeId) ?? findTheme(DEFAULT_THEME)!;
  const [values, setValues] = useState(() => effectiveSettings(schema, {}));
  useEffect(() => {
    getJson<SettingsFile | null>("/api/settings", null)
      .then(file => setValues(effectiveSettings(schema, file?.values[schema.id])))
      .catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: "GET /api/settings", Grund: String(failure) }));
  }, [schema]);
  return areasOf(findModule(schema.id), values);
}

// The further effect zones of the saved triggers (none without the trigger section or before they are loaded)
function useFxZones() {
  const [zones, setZones] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    getJson<{ triggers: Trigger[] } | null>("/api/triggers/config", null)
      .then(config => { if (active) setZones(fxZones(config?.triggers ?? [])); })
      .catch((error: unknown) => console.warn("Loading triggers failed:", error));
    return () => { active = false; };
  }, []);
  return zones;
}

// Setting up OBS: everything at once first (the usual way), then single sources, the key that is in every URL last
function ObsSetup({ me, act }: { me: Me; act: Act }) {
  const base = `${location.origin}${streamerPath.base(me.login)}`;
  const areas = useAreas(me.theme);
  const layout = obsLayout(base, me.login, me.overlayKey, { scenes: TEXTS.scenes, overlayScene: TEXTS.obs.overlayScene }, areas, useFxZones());
  const all = layout.flatMap(scene => scene.sources);
  const sources = new Map(all.filter(source => !source.zone).map(source => [source.scene, source]));
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
              // The source stays in the OBS import (empty until a theme with the scene is active), here only the hint
              if (!available.includes(scene)) {
                return <tr key={scene}><td>{TEXTS.scenes[scene]}</td><td colSpan={3} className="muted">{TEXTS.notInTheme}</td></tr>;
              }
              return <SourceRow key={scene} label={TEXTS.scenes[scene]} source={sources.get(scene)!} size={areas[scene]} />;
            })}
            {available.includes("fx") && all.filter(source => source.zone).map(source => (
              <SourceRow key={source.name} label={TEXT.zoneScene(source.zone!)} source={source} size={areas.fx} />
            ))}
          </tbody>
        </table>
      </section>
      <section className="settings-group section-card">
        <h2>{TEXTS.offlineScenes.title}</h2>
        <OfflineDownloads me={me} />
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

// The count as tiles, with reload, reset and the live state of the stream (as RST knows it, switchable by hand); it
// loads again with every reload of the account (me changes, also after
// the reset) and on the reload button
function Stats({ me, act }: { me: Me; act: Act }) {
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [loads, setLoads] = useState(0);
  useEffect(() => {
    let active = true;
    void getJson<StreamStats | null>("/api/stats", null).then(value => { if (active) setStats(value); });
    return () => { active = false; };
  }, [me, loads]);
  // Live as far as RST knows (stream.online/offline or by hand)
  const live = stats !== null && stats.startedAt !== null && stats.endedAt === null;
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
        <span className={live ? "glow" : "muted"} role="status">{live ? TEXT.streamLive : TEXT.streamOffline}</span>
        <button className="btn" onClick={() => act("/api/stats/live", live ? TEXT.markedOffline : TEXT.markedLive)}>{live ? TEXT.markOffline : TEXT.markLive}</button>
      </p>
      <p className="muted">{TEXT.liveHint}</p>
    </section>
  );
}

// One source in the table: name, URL to drag onto OBS (a click opens nothing), size, copy and test
function SourceRow({ label, source, size }: { label: string; source: ObsSource; size: SceneArea }) {
  return (
    <tr>
      <td>{label}</td>
      <td><a className="obs-drag" href={dragUrl(source)} onClick={event => event.preventDefault()}><code>{source.url}</code></a></td>
      <td>{TEXT.sourceSize(size)}</td>
      <td className="actions">
        <CopyButton text={source.url} />
        <a className="btn" href={`${source.url}&demo`} target="_blank" rel="noreferrer">{TEXT.test}</a>
      </td>
    </tr>
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
