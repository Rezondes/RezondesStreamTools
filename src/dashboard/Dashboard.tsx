// Dashboard under /: without a session only the login with Twitch, afterwards the navigation over the sections that are
// released for the streamer (navigation.ts), section in the hash (#/theme). Account from /api/me, refreshed every 5 seconds;
// ?error=<code> after an aborted login and errors of actions show the text for the code.
// The page never scrolls as a whole (terminal): title and navigation stay fixed, the section below scrolls inside;
// theme and render split it into settings (scroll) and preview (fixed). The look follows the active theme
// (skin.ts, skins.css).
import { useEffect, useState } from "react";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { params } from "../core/params.ts";
import Admin from "./Admin.tsx";
import { loadAccount, post, type Account } from "./api.ts";
import Connections from "./Connections.tsx";
import Media from "./Media.tsx";
import { sectionFromHash, visibleSections } from "./navigation.ts";
import Overview from "./Overview.tsx";
import Panels from "./Panels.tsx";
import Render from "./Render.tsx";
import Scenery from "./Scenery.tsx";
import { applySkin, rememberedSkin, skinOf } from "./skin.ts";
import { TEXTS } from "./texts.de.ts";
import ThemeSettings from "./ThemeSettings.tsx";
import Triggers from "./Triggers.tsx";
import "./dashboard.css";
import "./skins.css";

// Action to the server; afterwards reload the account and show an error
export type Act = (url: string) => void;

const REFRESH_MS = 5000;

export default function Dashboard() {
  const [account, setAccount] = useState<Account>(undefined);
  const [version, setVersion] = useState(0);
  const [hash, setHash] = useState(location.hash);
  const [error, setError] = useState<ErrorCode | null>(() => {
    const code = params.get("error") ?? "";
    return isErrorCode(code) ? code : null;
  });

  // Skin of the active theme from the account (the remembered one is set since main.tsx)
  const theme = typeof account === "object" ? account.theme : null;
  useEffect(() => { if (theme) applySkin(theme); }, [theme]);

  useEffect(() => {
    // New section: hide the old error message
    const update = () => { setHash(location.hash); setError(null); };
    addEventListener("hashchange", update);
    return () => removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      loadAccount().then(next => { if (active) setAccount(next); }).catch((failure: unknown) => console.warn("Status request failed:", failure));
    };
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => { active = false; clearInterval(timer); };
  }, [version]);

  const act: Act = url => {
    post(url)
      .then(code => { setError(code); setVersion(value => value + 1); })
      .catch((failure: unknown) => console.warn("Request failed:", failure));
  };

  return (
    <>
      <Scenery skin={skinOf(theme ?? rememberedSkin())} />
      <main className="dashboard">
        <h1>{TEXTS.title}</h1>
        {error && <p className="error" role="alert">{TEXTS.errors[error]}</p>}
        <Content account={account} hash={hash} act={act} />
      </main>
    </>
  );
}

function Content({ account, hash, act }: { account: Account; hash: string; act: Act }) {
  if (account === undefined) return <p className="muted">{TEXTS.loading}</p>;
  if (account === "offline") return <p className="muted">{TEXTS.offline}</p>;
  if (account === "anonymous") return <p className="panel login">{TEXTS.anonymous} <a className="btn primary" href="/auth/login">{TEXTS.login}</a></p>;
  if (account === "not-allowed") {
    return <p className="panel login">{TEXTS.errors["not-allowed"]} <button className="btn" onClick={() => act("/auth/logout")}>{TEXTS.logout}</button></p>;
  }

  const visible = visibleSections(account);
  const section = sectionFromHash(hash, visible);
  const split = section === "theme" || section === "render" || section === "panels";
  return (
    <>
      <nav className="dashboard-nav">
        {visible.map(id => (
          <a key={id} className={`btn${id === section ? " primary" : ""}`} href={`#/${id}`} aria-current={id === section ? "page" : undefined}>
            {TEXTS.sections[id]}
          </a>
        ))}
        <span className="dashboard-user">
          {TEXTS.signedInAs} <b className="glow">{account.login}</b>{account.admin && <span className="muted"> {TEXTS.admin}</span>}{" "}
          <button className="btn" onClick={() => act("/auth/logout")}>{TEXTS.logout}</button>
        </span>
      </nav>
      <div className={`dashboard-content${split ? " split" : ""}`}>
        {section === "overview" && <Overview me={account} act={act} />}
        {section === "connections" && <Connections me={account} act={act} />}
        {section === "theme" && <ThemeSettings me={account} />}
        {section === "triggers" && <Triggers me={account} />}
        {section === "media" && <Media login={account.login} />}
        {section === "render" && <Render me={account} />}
        {section === "panels" && <Panels me={account} />}
        {section === "admin" && <Admin />}
      </div>
    </>
  );
}
