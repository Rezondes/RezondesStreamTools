// Vollbild-Szenen: Starting Soon, BRB, Ending. Für 1920x1080 gebaut, skaliert auf jede Quellgrösse.
// Parameter: ?min=5 oder ?at=20:00 (Countdown, nur starting), ?next=Freitag 20 Uhr (ending), ?ticker=Text
import { useLayoutEffect, useRef, useState } from "react";
import MatrixRain from "../MatrixRain.tsx";
import { numberParam, params } from "../../../core/params.ts";
import { clock } from "../../../core/overlayTiming.ts";
import { useDecode } from "../../../core/hooks/useDecode.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import type { Line } from "../../../core/typing.ts";
import { useTerminal } from "../../../core/hooks/useTerminal.ts";

// Fünf sichtbare Zeilen, Start nach der Einschalt-Animation, 1,8 bis 3,2 s Pause zwischen den Zeilen
const TERMINAL_TIMING = { visible: 5, startDelayMs: 2600, pauseMinMs: 1800, pauseMaxMs: 3200 };

type Kind = "starting" | "brb" | "ending";

export const LOGO = String.raw`
 ___   ___   ____   ___    _  _   ___    ___   ___
| _ \ | __| |_  /  / _ \  | \| | |   \  | __| / __|
|   / | _|   / /  | (_) | | .' | | |) | | _|  \__ \
|_|_\ |___| /___|  \___/  |_|\_| |___/  |___| |___/`.slice(1);

// Terminal-Zeilen. Text wird einfach getippt; Listen sind Drehbücher mit Vertippern (siehe typing.ts).
const LOG: Record<Kind, Line[]> = {
  starting: [
    "boot sequence initiated",
    "coffee.exe not found ... falling back to monster_white.exe",
    "cracking open a Monster Energy White ... *psst*",
    "loading neural_net.dll ... ok",
    "dotnet build --configuration Stream ... succeeded (0 warnings, 47 suppressed)",
    "connecting to twitch.tv:443 ... ok",
    ["sudo systemclt", { del: 2 }, "tl strat", { del: 3 }, "art stream", { pause: 900 }, " --now", { pause: 600 }, " --pls"],
    "npm install motivation ... 1,284 vulnerabilities found",
    "calibrating webcam ... ok",
    "git blame overlay.tsx ... it was me",
    "estimating start time ... 5 min (programmer minutes)",
    "rubber duck debugging ... duck refuses to comment",
    "warming up keyboard ... ok",
    ["git comit", { del: 4 }, "ommit -m \"fxi", { del: 3 }, "fix\"", { pause: 800 }, { del: 4 }, "final fix v2\"", { pause: 500 }, " && git psuh", { del: 4 }, "push"],
    "fixing 1 bug ... 2 new bugs found",
    "scanning chat for the one ... searching",
    "it works on my machine ... shipping my machine to chat",
    "git pull origin main ... already up to date",
  ],
  brb: [
    "process suspended (pid 1337)",
    "user status: afk",
    "refilling Monster Energy White ... can 3 of ?",
    "ping streamer ... request timed out",
    "retrying in 5s ...",
    "Thread.Sleep(300000); // TODO: remove before stream",
    // vertippt, löscht, vertippt sich wieder, gibt auf und haut auf die Tastatur
    ["echo \"bin gelich", { del: 5 }, "lecih", { del: 3 }, "ich zrü", { del: 3 }, { pause: 600 }, "zurkc", { del: 3 }, { pause: 900 }, { smash: 18 }],
    "keeping chat warm ... ok",
    "rubber duck is now in charge of the stream",
    "garbage collector running ... streamer not collected",
    "streamer.exe is not responding ... [wait] [close]",
    "do not unplug the matrix",
    "while (afk) { chat.entertain(); }",
    "awaiting operator input",
  ],
  ending: [
    "saving session ... ok",
    "flushing chat buffer ... ok",
    "writing highlights to /dev/memory ... ok",
    "git commit -m \"stream done\" ... ok",
    "disposing streamer ... IDisposable not implemented",
    "thanks for watching",
    "closing 47 browser tabs ... 46 remaining",
    ["shutdwon", { del: 4 }, "down -h nwo", { del: 3 }, "now", { pause: 900 }, " --really", { pause: 700 }, { smash: 10 }],
    "stopping services ...",
    "connection closed by remote host",
    "see you in the matrix",
  ],
};

const TITLE: Record<Kind, string> = {
  starting: "STREAM STARTET GLEICH",
  brb: "BIN GLEICH ZURÜCK",
  ending: "STREAM BEENDET",
};

// Countdown-Ziel: ?at=HH:MM (heute, sonst morgen) oder ?min=N ab Laden der Seite
function target() {
  const at = params.get("at")?.match(/^(\d{1,2}):(\d{2})$/);
  if (at) {
    const d = new Date();
    d.setHours(Number(at[1]), Number(at[2]), 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  return Date.now() + numberParam("min", 5) * 60_000;
}

export default function Screen({ kind }: { kind: Kind }) {
  const stage = useStage();
  const [start] = useState(Date.now);
  const [end] = useState(target);
  const now = useNow();
  const title = useDecode(TITLE[kind], 2400, 45);
  const logo = useDecode(LOGO, 1800, 2);

  const left = Math.max(0, (end - now) / 1000);
  const total = (end - start) / 1000;
  const progress = kind === "starting" ? 1 - left / total : 0;
  const ticker = params.get("ticker");

  return (
    <div className="screen-scene">
      <MatrixRain size={20} className="rain dim" />
      <div className="stage" ref={stage}>
        <div className="crt">
          <div className="crt-flash" aria-hidden="true" />
          <header className="crt-bar">
            <span>REZONDES://stream/{kind}</span>
            <span className="blink">● LIVE-FEED</span>
            <span>{new Date(now).toLocaleTimeString("de-DE")}</span>
          </header>

          <pre className="logo">{logo}</pre>
          <h1 className="title glow">{title}<span className="cursor">█</span></h1>

          {kind === "starting" && (
            <div className="status">
              <div className="big">{left > 0 ? `T-${clock(left)}` : "INITIALISIERE ..."}</div>
              <div className="bar">
                [{"█".repeat(Math.round(progress * 40))}{"░".repeat(40 - Math.round(progress * 40))}] {Math.round(progress * 100)}%
              </div>
            </div>
          )}
          {kind === "brb" && (
            <div className="status">
              <div className="big">AFK {clock((now - start) / 1000)}</div>
              <div className="muted">Chat bleibt offen, schreibt ruhig weiter.</div>
            </div>
          )}
          {kind === "ending" && (
            <div className="status">
              <div className="big">DANKE FÜRS ZUSCHAUEN</div>
              {params.get("next") && <div className="muted">Nächster Stream: {params.get("next")}</div>}
            </div>
          )}

          <Terminal lines={LOG[kind]} />
        </div>
        {ticker && (
          <div className="ticker"><span>{`${ticker}   //   `.repeat(6)}</span></div>
        )}
      </div>
    </div>
  );
}

// Tippt Zeilen nacheinander ab (inklusive Vertipper), endlos im Kreis, zeigt die letzten 5.
// Zwischen den Zeilen 1,8 bis 3,2 s Pause, damit es nach jemandem aussieht, der nachdenkt.
function Terminal({ lines }: { lines: Line[] }) {
  const { shown, typing } = useTerminal(lines, TERMINAL_TIMING);

  return (
    <div className="term">
      {shown.map((line, index) => <div key={index} className="muted">root@rezondes:~$ {line}</div>)}
      <div>root@rezondes:~$ {typing}<span className="cursor">█</span></div>
    </div>
  );
}

// Skaliert die 1920x1080-Bühne auf das Fenster bzw. die OBS-Quelle
function useStage() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => ref.current?.style.setProperty("--s", String(Math.min(innerWidth / 1920, innerHeight / 1080)));
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);
  return ref;
}
