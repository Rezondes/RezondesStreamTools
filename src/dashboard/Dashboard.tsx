// Dashboard under /: without a session only the login with Twitch, afterwards the navigation over the sections that are
// released for the streamer (navigation.ts), section in the hash (#/theme). Account from /api/me, refreshed every 5 seconds;
// results of actions come as toasts, errors (also ?error=<code> after an aborted login) as a dialog with details for
// the admin (notices.ts). The account page opens from the name at the top right, admin from the account page; both stay
// out of the navigation.
// The page never scrolls as a whole (terminal): title and navigation stay fixed, the section below scrolls inside;
// theme and render split it into settings (scroll) and preview (fixed). The look follows the active theme
// (skin.ts, skins.css).
import { useEffect, useState } from "react";
import { isErrorCode } from "../core/errorCodes.ts";
import { params } from "../core/params.ts";
import Admin from "./Admin.tsx";
import { loadAccount, post, type Account } from "./api.ts";
import AccountPage from "./Account.tsx";
import Media from "./Media.tsx";
import { sectionFromHash, visibleSections } from "./navigation.ts";
import Overview from "./Overview.tsx";
import Panels from "./Panels.tsx";
import Render from "./Render.tsx";
import Scenery from "./Scenery.tsx";
import { applySkin, rememberedSkin, skinOf } from "./skin.ts";
import { TEXTS } from "./texts.de.ts";
import ThemeSettings from "./ThemeSettings.tsx";
import NoticeLayer from "./NoticeLayer.tsx";
import { reportError, toast } from "./notices.ts";
import Triggers from "./Triggers.tsx";
import "./dashboard.css";
import "./skins.css";

// Action to the server; afterwards reload the account; the done text comes as a toast, an error as the error dialog
export type Act = (url: string, done?: string) => void;

const REFRESH_MS = 5000;

export default function Dashboard() {
  const [account, setAccount] = useState<Account>(undefined);
  const [version, setVersion] = useState(0);
  const [hash, setHash] = useState(location.hash);

  // An aborted login comes back with ?error=<code>
  useEffect(() => {
    const code = params.get("error") ?? "";
    if (isErrorCode(code)) reportError(TEXTS.errors[code], { Aktion: "Anmeldung", Code: code });
  }, []);

  // Skin of the active theme from the account (the remembered one is set since main.tsx)
  const theme = typeof account === "object" ? account.theme : null;
  useEffect(() => { if (theme) applySkin(theme); }, [theme]);

  useEffect(() => {
    const update = () => setHash(location.hash);
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

  const act: Act = (url, done) => {
    post(url)
      .then(code => {
        if (code) reportError(TEXTS.errors[code], { Aktion: `POST ${url}`, Code: code, Seite: location.hash || "#/" });
        else if (done) toast(done);
        setVersion(value => value + 1);
      })
      .catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: `POST ${url}`, Grund: String(failure), Seite: location.hash || "#/" }));
  };

  return (
    <>
      <Scenery skin={skinOf(theme ?? rememberedSkin())} />
      <main className="dashboard">
        <h1>{TEXTS.title}</h1>
        <Content account={account} hash={hash} act={act} />
        <NoticeLayer />
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
        {visible.filter(id => id !== "account" && id !== "admin").map(id => (
          <a key={id} className={`btn${id === section ? " primary" : ""}`} href={`#/${id}`} aria-current={id === section ? "page" : undefined}>
            {TEXTS.sections[id]}
          </a>
        ))}
        <span className="dashboard-user">
          {TEXTS.signedInAs}{" "}
          <a className="glow dashboard-account" href="#/account" title={TEXTS.toAccount} aria-current={section === "account" || section === "admin" ? "page" : undefined}>{account.login}</a>
          {account.admin && <span className="muted"> {TEXTS.admin}</span>}
          <button className="btn icon danger" aria-label={TEXTS.logout} title={TEXTS.logout} onClick={() => act("/auth/logout")}>
            <span aria-hidden="true">⏻</span>
          </button>
        </span>
      </nav>
      <div className={`dashboard-content${split ? " split" : ""}`}>
        {section === "overview" && <Overview me={account} act={act} />}
        {section === "account" && <AccountPage me={account} act={act} />}
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
