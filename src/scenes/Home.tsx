// Übersicht (Dashboard): Anmeldung mit Twitch, Status, Test-Alerts, Trigger und die fertigen OBS-URLs
// des angemeldeten Streamers (/s/<login>/<szene>.html). Daten kommen von /api/me; ?error=<code> zeigt eine
// Meldung zum Code, den der Server nach einer abgebrochenen Anmeldung schickt.
import { useEffect, useState } from "react";
import * as streamerPath from "../core/streamerPath.ts";
import { params } from "../core/params.ts";

type Me = { login: string; admin: boolean; live: boolean; spotify: boolean | null; features: Record<string, boolean> };
type TriggerInfo = { name: string; enabled: boolean };
// undefined = lädt; offline = kein Server erreichbar; anonymous = nicht angemeldet; not-allowed = nicht freigeschaltet
type Account = Me | "offline" | "anonymous" | "not-allowed" | undefined;

const TESTS = ["follow", "sub", "resub", "gift", "cheer", "raid", "redeem", "hype"];
const SCENES = [
  { path: "starting", name: "Starting Soon", size: "1920x1080", options: "?min=5 · ?at=20:00 · ?ticker=Text" },
  { path: "brb", name: "Bin gleich zurück", size: "1920x1080", options: "?ticker=Text" },
  { path: "ending", name: "Stream beendet", size: "1920x1080", options: "?next=Freitag 20 Uhr · ?ticker=Text" },
  { path: "alerts", name: "Alerts", size: "1920x1080", options: "?duration=7 · ?scale=0.7 · ?sound=0 · ?volume=0.5 · ?demo" },
  { path: "chat", name: "Chat", size: "500x900", options: "?fade=30 · ?max=30 · ?demo" },
  { path: "cam", name: "Webcam-Rahmen", size: "640x360", options: "?label=REZONDES" },
  { path: "music", name: "Spotify Now Playing", size: "900x240", options: "?art=cover|record|vinyl|none · ?hide=0 · ?demo" },
  { path: "fx", name: "Chat-Effekte (Trigger)", size: "1920x1080", options: "?zone=main · ?sound=0 · ?volume=0.5" },
];

// Texte zu den Codes des Servers
const ERRORS: Record<string, string> = {
  "not-allowed": "Dein Twitch-Konto ist noch nicht freigeschaltet.",
  "login-failed": "Twitch-Anmeldung abgebrochen oder ungültig. Bitte erneut anmelden.",
  "spotify-failed": "Spotify-Verbindung abgebrochen oder ungültig. Bitte erneut verbinden.",
};

async function loadAccount(): Promise<Account> {
  try {
    const response = await fetch("/api/me");
    if (response.status === 401) return "anonymous";
    if (response.status === 403) return "not-allowed";
    return response.ok ? ((await response.json()) as Me) : "offline";
  } catch {
    // Netzwerkfehler: kein Overlay-Server erreichbar (z.B. npm run dev ohne Server)
    return "offline";
  }
}

const post = (url: string, then: () => void) => {
  fetch(url, { method: "POST" }).then(then).catch((error: unknown) => console.warn("Request failed:", error));
};

export default function Home() {
  const [account, setAccount] = useState<Account>(undefined);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      loadAccount().then(next => { if (active) setAccount(next); }).catch((error: unknown) => console.warn("Status request failed:", error));
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [version]);
  const reload = () => setVersion(value => value + 1);
  const errorCode = params.get("error") ?? "";
  const error = Object.hasOwn(ERRORS, errorCode) ? ERRORS[errorCode] : null;

  return (
    <main className="home">
      <h1 className="glow">REZONDES // STREAM-OVERLAYS</h1>
      {error && <p className="error" role="alert">{error}</p>}
      <Status account={account} onChange={reload} />
      {typeof account === "object" && <Scenes login={account.login} />}
      <p>
        Übergang: <a className="btn" href="#/stinger">[ STINGER VORSCHAU / RENDERN ]</a>
      </p>
    </main>
  );
}

function Status({ account, onChange }: { account: Account; onChange: () => void }) {
  if (account === undefined) return null;
  if (account === "offline") return <p className="muted">Kein Overlay-Server erreichbar. Die Overlays brauchen den Server (Docker oder npm run server).</p>;
  if (account === "anonymous") return <p>Nicht angemeldet. <a className="btn primary" href="/auth/login">[ MIT TWITCH ANMELDEN ]</a></p>;
  if (account === "not-allowed") {
    return <p>{ERRORS["not-allowed"]} <button className="btn" onClick={() => post("/auth/logout", onChange)}>[ ABMELDEN ]</button></p>;
  }
  return (
    <section className="panel">
      <p>
        Angemeldet als <b className="glow">{account.login}</b>{account.admin && <span className="muted"> (Admin)</span>}{" "}
        {account.features.alerts && <span className={account.live ? "" : "muted"} role="status">{account.live ? "● EventSub aktiv" : "○ EventSub verbindet ..."}</span>}{" "}
        <button className="btn" onClick={() => post("/auth/logout", onChange)}>[ ABMELDEN ]</button>{" "}
        <button className="btn" onClick={() => post("/api/twitch/disconnect", onChange)}>[ TWITCH TRENNEN ]</button>
      </p>
      {account.spotify !== null && (
        <p role="status">
          {account.spotify
            ? <>Spotify <span className="glow">● verbunden</span> <button className="btn" onClick={() => post("/spotify/logout", onChange)}>[ SPOTIFY TRENNEN ]</button></>
            : <>Spotify nicht verbunden. <a className="btn primary" href="/spotify/login">[ MIT SPOTIFY VERBINDEN ]</a></>}
        </p>
      )}
      {account.features.alerts && (
        <p className="actions">
          <span className="muted">Test-Alert an alle offenen Overlays:</span>
          {TESTS.map(kind => <button key={kind} className="btn" onClick={() => post(`/api/test?kind=${kind}`, onChange)}>[ {kind.toUpperCase()} ]</button>)}
        </p>
      )}
      {account.features.triggers && account.features.fx && <TriggerButtons />}
    </section>
  );
}

function TriggerButtons() {
  const [triggers, setTriggers] = useState<TriggerInfo[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/triggers")
      .then(response => (response.ok ? (response.json() as Promise<TriggerInfo[]>) : []))
      .then(list => { if (active) setTriggers(list); })
      .catch((error: unknown) => console.warn("Loading triggers failed:", error));
    return () => { active = false; };
  }, []);
  return (
    <p className="actions">
      <a className="btn primary" href="#/triggers">[ TRIGGER BEARBEITEN ]</a>
      <span className="muted">auslösen:</span>
      {triggers.length === 0 && <span className="muted">keine geladen</span>}
      {triggers.map(trigger => (
        <button key={trigger.name} className="btn" disabled={!trigger.enabled}
          onClick={() => post(`/api/trigger?name=${encodeURIComponent(trigger.name)}`, () => {})}>[ {trigger.name.toUpperCase()} ]</button>
      ))}
    </p>
  );
}

// OBS-URLs des Streamers; TEST öffnet die Szene mit Fake-Events (auch unter npm run dev)
function Scenes({ login }: { login: string }) {
  const base = `${location.origin}${streamerPath.base(login)}`;
  return (
    <>
      <p className="muted">In OBS: Quelle hinzufügen → Browser → URL einfügen, Breite/Höhe wie angegeben.</p>
      <table>
        <thead><tr><th>Szene</th><th>URL</th><th>Grösse</th><th>Optionen</th><th /></tr></thead>
        <tbody>
          {SCENES.map(scene => (
            <tr key={scene.path}>
              <td>{scene.name}</td>
              <td><code>{`${base}/${scene.path}.html`}</code></td>
              <td>{scene.size}</td>
              <td className="muted">{scene.options}</td>
              <td><a className="btn" href={`#/${scene.path}?demo&s=${login}`} target="_blank">[ TEST ]</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
