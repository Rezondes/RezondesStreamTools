// Account page in the dashboard: the profile in RST (login, role, since when, last login, active theme, the released
// features), the connections to Twitch (EventSub status) and Spotify with connect and disconnect, and the settings of
// RST itself (for now only how the dashboard looks). Reconnecting Twitch is a new login; Spotify only appears when
// music is released and set up. When connected, Spotify shows account, current track and whether it is polling right
// now (reloaded every 5 s). The live event log is a tab of the overview (EventFeed).
import { useEffect, useState } from "react";
import type { SpotifyDetails } from "../core/types.ts";
import type { Feature } from "../generated/Feature.ts";
import { DEFAULT_THEME, findTheme } from "../themes/registry.ts";
import { getJson } from "./api.ts";
import type { Act } from "./Dashboard.tsx";
import { type Me, visibleSections } from "./navigation.ts";
import { TEXTS } from "./texts.de.ts";

const TEXT = TEXTS.account;
const FEATURES = Object.keys(TEXTS.adminArea.featureNames) as Feature[];

export default function Account({ me, act }: { me: Me; act: Act }) {
  return (
    <section className="panel account">
      <div className="section-cards">
        <Profile me={me} />
        <section className="settings-group section-card">
          <h2>{TEXT.connections}</h2>
          <Connections me={me} act={act} />
        </section>
      </div>
      <section className="settings-group section-card">
        <h2>{TEXT.settings}</h2>
        <dl className="account-facts">
          <div><dt>{TEXT.look}</dt><dd>{TEXT.lookValue}</dd></div>
        </dl>
        <p className="muted">{TEXT.settingsHint}</p>
        {me.admin && <p className="actions"><a className="btn" href="#/admin">{TEXTS.sections.admin}</a></p>}
      </section>
    </section>
  );
}

// Who is logged in and what RST knows about the account
function Profile({ me }: { me: Me }) {
  const theme = findTheme(me.theme) ?? findTheme(DEFAULT_THEME)!;
  const date = (ms: number | null) => (ms ? TEXT.date(ms) : TEXT.unknown);
  return (
    <section className="settings-group section-card">
      <h2>{TEXT.profile}</h2>
      <dl className="account-facts">
        <div><dt>{TEXT.login}</dt><dd><b className="glow">{me.login}</b></dd></div>
        <div><dt>{TEXT.role}</dt><dd>{me.admin ? TEXT.roles.admin : TEXT.roles.streamer}</dd></div>
        <div><dt>{TEXT.since}</dt><dd>{date(me.createdAt)}</dd></div>
        <div><dt>{TEXT.lastLogin}</dt><dd>{date(me.lastLogin)}</dd></div>
        <div>
          <dt>{TEXT.theme}</dt>
          <dd>{theme.name}{visibleSections(me).includes("theme") && <> <a href="#/theme">{TEXT.changeTheme}</a></>}</dd>
        </div>
      </dl>
      <h3>{TEXT.features}</h3>
      <ul className="account-features">
        {FEATURES.map(feature => (
          <li key={feature} className={me.features[feature] ? "" : "muted"}>
            <span aria-hidden="true">{me.features[feature] ? "✓" : "–"}</span> {TEXTS.adminArea.featureNames[feature]}
            {!me.features[feature] && <span className="visually-hidden"> ({TEXT.featureOff})</span>}
          </li>
        ))}
      </ul>
      <p className="muted">{TEXT.featuresHint}</p>
    </section>
  );
}

// Twitch and Spotify, each with its state and how to connect or disconnect
function Connections({ me, act }: { me: Me; act: Act }) {
  const texts = TEXTS.connections;
  return (
    <>
      <h3>{texts.twitch}</h3>
      <p role="status">
        {TEXTS.signedInAs} <b className="glow">{me.login}</b>{" "}
        {me.features.alerts && <span className={me.live ? "glow" : "muted"}>{me.live ? texts.eventSubLive : texts.eventSubConnecting}</span>}
      </p>
      <p className="actions">
        <a className="btn" href="/auth/login">{texts.twitchReconnect}</a>
        <button className="btn" onClick={() => { if (confirm(texts.confirmTwitch)) act("/api/twitch/disconnect", texts.twitchDisconnected); }}>{texts.twitchDisconnect}</button>
      </p>

      <h3>{texts.spotify}</h3>
      {me.spotify === null && <p className="muted">{texts.spotifyOff}</p>}
      {me.spotify === true && (
        <>
          <SpotifyStatus />
          <p className="actions">
            <a className="btn" href="/spotify/login">{texts.spotifyReconnect}</a>
            <button className="btn" onClick={() => { if (confirm(texts.confirmSpotify)) act("/spotify/logout", texts.spotifyLoggedOut); }}>{texts.spotifyDisconnect}</button>
          </p>
        </>
      )}
      {me.spotify === false && (
        <p className="actions">
          <span className="muted">{texts.spotifyDisconnected}</span>
          <a className="btn primary" href="/spotify/login">{texts.spotifyConnect}</a>
        </p>
      )}
    </>
  );
}

const REFRESH_MS = 5000;

// Account, current track and polling status; null = not loaded yet or server unreachable
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
