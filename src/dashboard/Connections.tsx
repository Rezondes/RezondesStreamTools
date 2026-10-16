// Verbindungen im Dashboard: Status von Twitch (EventSub) und Spotify mit Verbinden und Trennen, darunter das live
// Ereignis-Protokoll (EventFeed).
// Twitch neu verbinden ist eine neue Anmeldung; Spotify erscheint nur, wenn Musik freigegeben und eingerichtet ist.
// Verbunden zeigt Spotify Konto, laufenden Titel und ob gerade abgefragt wird (alle 5 s neu geladen).
import { useEffect, useState } from "react";
import type { SpotifyDetails } from "../core/types.ts";
import { getJson } from "./api.ts";
import type { Act } from "./Dashboard.tsx";
import EventFeed from "./EventFeed.tsx";
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
        <>
          <SpotifyStatus />
          <p className="actions">
            <a className="btn" href="/spotify/login">{texts.spotifyReconnect}</a>
            <button className="btn" onClick={() => { if (confirm(texts.confirmSpotify)) act("/spotify/logout"); }}>{texts.spotifyDisconnect}</button>
          </p>
        </>
      )}
      {me.spotify === false && (
        <p className="actions">
          <span className="muted">{texts.spotifyDisconnected}</span>
          <a className="btn primary" href="/spotify/login">{texts.spotifyConnect}</a>
        </p>
      )}

      <EventFeed login={me.login} />
    </section>
  );
}

const REFRESH_MS = 5000;

// Konto, laufender Titel und Abfrage-Status; null = noch nicht geladen oder Server nicht erreichbar
function SpotifyStatus() {
  const texts = TEXTS.connections;
  const [details, setDetails] = useState<SpotifyDetails | null>(null);
  useEffect(() => {
    const load = () => { getJson<SpotifyDetails | null>("/api/spotify", null).then(setDetails).catch(() => {}); };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  const track = details?.track;
  return (
    <div role="status">
      <p>
        <span className="glow">{texts.spotifyConnected}</span>{" "}
        {details?.account && <>{texts.spotifyAccount} <b className="glow">{details.account}</b></>}
      </p>
      <p>
        {track ? <>{texts.spotifyTrack(track.playing)} <b>{track.title}</b> {texts.spotifyBy} {track.artist}</> : texts.spotifyNothing}
      </p>
      {details && <p className="muted">{details.polling ? texts.spotifyPolling : texts.spotifyIdle}</p>}
    </div>
  );
}
