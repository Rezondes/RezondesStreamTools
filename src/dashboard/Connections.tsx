// Verbindungen im Dashboard: Status von Twitch (EventSub) und Spotify mit Verbinden und Trennen.
// Twitch neu verbinden ist eine neue Anmeldung; Spotify erscheint nur, wenn Musik freigegeben und eingerichtet ist.
import type { Act } from "./Dashboard.tsx";
import type { Me } from "./navigation.ts";
import { TEXTS } from "./texts.de.ts";

export default function Connections({ me, act }: { me: Me; act: Act }) {
  const texts = TEXTS.connections;
  return (
    <section className="panel">
      <h2>{texts.twitch}</h2>
      <p role="status">
        {TEXTS.signedInAs} <b className="glow">{me.login}</b>{" "}
        {me.features.alerts && <span className={me.live ? "glow" : "muted"}>{me.live ? texts.eventSubLive : texts.eventSubConnecting}</span>}
      </p>
      <p className="actions">
        <a className="btn" href="/auth/login">{texts.twitchReconnect}</a>
        <button className="btn" onClick={() => { if (confirm(texts.confirmTwitch)) act("/api/twitch/disconnect"); }}>{texts.twitchDisconnect}</button>
      </p>

      <h2>{texts.spotify}</h2>
      {me.spotify === null && <p className="muted">{texts.spotifyOff}</p>}
      {me.spotify === true && (
        <p className="actions" role="status">
          <span className="glow">{texts.spotifyConnected}</span>
          <button className="btn" onClick={() => { if (confirm(texts.confirmSpotify)) act("/spotify/logout"); }}>{texts.spotifyDisconnect}</button>
        </p>
      )}
      {me.spotify === false && (
        <p className="actions">
          <span className="muted">{texts.spotifyDisconnected}</span>
          <a className="btn primary" href="/spotify/login">{texts.spotifyConnect}</a>
        </p>
      )}
    </section>
  );
}
