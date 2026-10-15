// Dashboard unter /: ohne Sitzung nur die Anmeldung mit Twitch, danach die Navigation über die Bereiche, die für den
// Streamer freigegeben sind (navigation.ts), Bereich im Hash (#/theme). Konto von /api/me, alle 5 Sekunden aufgefrischt;
// ?error=<code> nach einer abgebrochenen Anmeldung und Fehler von Aktionen zeigen den Text zum Code.
import { useEffect, useState } from "react";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { params } from "../core/params.ts";
import Admin from "./Admin.tsx";
import { loadAccount, post, type Account } from "./api.ts";
import Connections from "./Connections.tsx";
import Media from "./Media.tsx";
import { sectionFromHash, visibleSections } from "./navigation.ts";
import Overview from "./Overview.tsx";
import { TEXTS } from "./texts.de.ts";
import ThemeSettings from "./ThemeSettings.tsx";
import Triggers from "./Triggers.tsx";
import "./dashboard.css";

// Aktion an den Server; danach Konto neu laden und einen Fehler anzeigen
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

  useEffect(() => {
    // Neuer Bereich: alte Fehlermeldung ausblenden
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
    <main className="dashboard">
      <h1 className="glow">{TEXTS.title}</h1>
      {error && <p className="error" role="alert">{TEXTS.errors[error]}</p>}
      <Content account={account} hash={hash} act={act} />
    </main>
  );
}

function Content({ account, hash, act }: { account: Account; hash: string; act: Act }) {
  if (account === undefined) return <p className="muted">{TEXTS.loading}</p>;
  if (account === "offline") return <p className="muted">{TEXTS.offline}</p>;
  if (account === "anonymous") return <p>{TEXTS.anonymous} <a className="btn primary" href="/auth/login">{TEXTS.login}</a></p>;
  if (account === "not-allowed") {
    return <p>{TEXTS.errors["not-allowed"]} <button className="btn" onClick={() => act("/auth/logout")}>{TEXTS.logout}</button></p>;
  }

  const visible = visibleSections(account);
  const section = sectionFromHash(hash, visible);
  return (
    <>
      <nav className="dashboard-nav">
        {visible.map(id => (
          <a key={id} className={`btn${id === section ? " primary" : ""}`} href={`#/${id}`} aria-current={id === section ? "page" : undefined}>
            [ {TEXTS.sections[id]} ]
          </a>
        ))}
        <span className="dashboard-user">
          {TEXTS.signedInAs} <b className="glow">{account.login}</b>{account.admin && <span className="muted"> {TEXTS.admin}</span>}{" "}
          <button className="btn" onClick={() => act("/auth/logout")}>{TEXTS.logout}</button>
        </span>
      </nav>
      {section === "overview" && <Overview me={account} act={act} />}
      {section === "connections" && <Connections me={account} act={act} />}
      {section === "theme" && <ThemeSettings me={account} />}
      {section === "triggers" && <Triggers />}
      {section === "media" && <Media login={account.login} />}
      {section === "admin" && <Admin />}
    </>
  );
}
