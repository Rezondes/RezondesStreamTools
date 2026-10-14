// Übersicht aller Overlays mit fertigen URLs für OBS, plus Twitch-Login wenn der Server läuft
import { useEffect, useState } from "react";
import { serverStatus, type ServerStatus } from "../twitch.ts";

type TriggerInfo = { name: string; enabled: boolean };

const TESTS = ["follow", "sub", "resub", "gift", "cheer", "raid", "redeem", "hype"];
const SCENES = [
  { path: "starting", name: "Starting Soon", size: "1920x1080", opts: "?min=5 · ?at=20:00 · ?ticker=Text" },
  { path: "brb", name: "Bin gleich zurück", size: "1920x1080", opts: "?ticker=Text" },
  { path: "ending", name: "Stream beendet", size: "1920x1080", opts: "?next=Freitag 20 Uhr · ?ticker=Text" },
  { path: "alerts", name: "Alerts", size: "1920x1080", opts: "?duration=7 · ?scale=0.7 · ?sound=0 · ?volume=0.5 · ?demo" },
  { path: "chat", name: "Chat", size: "500x900", opts: "?fade=30 · ?max=30 · ?demo" },
  { path: "cam", name: "Webcam-Rahmen", size: "640x360", opts: "?label=REZONDES" },
  { path: "music", name: "Spotify Now Playing", size: "900x240", opts: "?art=cover|record|vinyl|none · ?hide=0 · ?demo" },
  { path: "fx", name: "Chat-Effekte (Trigger)", size: "1920x1080", opts: "?zone=main · ?sound=0 · ?volume=0.5" },
];

export default function Home() {
  const base = location.href.split("#")[0];
  return (
    <main className="home">
      <h1 className="glow">REZONDES // STREAM-OVERLAYS</h1>
      <Server />
      <p className="muted">In OBS: Quelle hinzufügen → Browser → URL einfügen, Breite/Höhe wie angegeben.</p>
      <table>
        <thead><tr><th>Szene</th><th>URL</th><th>Grösse</th><th>Optionen</th><th /></tr></thead>
        <tbody>
          {SCENES.map(s => (
            <tr key={s.path}>
              <td>{s.name}</td>
              <td><code>{`${base}#/${s.path}`}</code></td>
              <td>{s.size}</td>
              <td className="muted">{s.opts}</td>
              <td><a className="btn" href={`#/${s.path}?demo`} target="_blank">[ TEST ]</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Übergang: <a className="btn" href="#/stinger">[ STINGER VORSCHAU / RENDERN ]</a>
      </p>
    </main>
  );
}

function Server() {
  const [status, setStatus] = useState<ServerStatus | null | undefined>(undefined);
  const [triggers, setTriggers] = useState<TriggerInfo[]>([]);
  const refresh = () => serverStatus().then(s => {
    setStatus(s);
    if (s) fetch("/api/triggers").then(r => r.json()).then(setTriggers).catch(() => {});
  });
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  if (status === undefined) return null;
  if (status === null) {
    return <p className="muted">Kein Overlay-Server erreichbar: Alerts kommen anonym aus dem Chat (ohne Follows, Kanalpunkte, Hype Train).</p>;
  }
  const post = (url: string) => fetch(url, { method: "POST" }).then(refresh);
  return (
    <section className="panel">
      {status.login ? (
        <p>
          Verbunden als <b className="glow">{status.login}</b>{" "}
          <span className={status.live ? "" : "muted"}>{status.live ? "● EventSub aktiv" : "○ EventSub verbindet ..."}</span>{" "}
          <button className="btn" onClick={() => post("/auth/logout")}>[ TRENNEN ]</button>
        </p>
      ) : (
        <p>Nicht mit Twitch verbunden. <a className="btn primary" href="/auth/login">[ MIT TWITCH VERBINDEN ]</a></p>
      )}
      {status.spotify !== null && (
        <p>
          {status.spotify
            ? <>Spotify <span className="glow">● verbunden</span> <button className="btn" onClick={() => post("/spotify/logout")}>[ SPOTIFY TRENNEN ]</button></>
            : <>Spotify nicht verbunden. <a className="btn primary" href="/spotify/login">[ MIT SPOTIFY VERBINDEN ]</a></>}
        </p>
      )}
      <p className="actions">
        <span className="muted">Test-Alert an alle offenen Overlays:</span>
        {TESTS.map(k => <button key={k} className="btn" onClick={() => post(`/api/test?kind=${k}`)}>[ {k.toUpperCase()} ]</button>)}
      </p>
      <p className="actions">
        <a className="btn primary" href="#/triggers">[ TRIGGER BEARBEITEN ]</a>
        <span className="muted">auslösen:</span>
        {triggers.length === 0 && <span className="muted">keine geladen</span>}
        {triggers.map(t => (
          <button key={t.name} className="btn" disabled={!t.enabled} onClick={() => post(`/api/trigger?name=${encodeURIComponent(t.name)}`)}>[ {t.name.toUpperCase()} ]</button>
        ))}
      </p>
    </section>
  );
}
