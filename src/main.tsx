import { createRoot } from "react-dom/client";
import "./style.css";
import Home from "./scenes/Home.tsx";
import Screen from "./scenes/Screen.tsx";
import Alerts from "./scenes/Alerts.tsx";
import Chat from "./scenes/Chat.tsx";
import Cam from "./scenes/Cam.tsx";
import Stinger from "./scenes/Stinger.tsx";
import Music from "./scenes/Music.tsx";
import Fx from "./scenes/Fx.tsx";
import Triggers from "./scenes/Triggers.tsx";

// Hash-Routing (#/alerts), damit der Build ohne Server-Rewrites läuft.
// Parameter werden einmal beim Laden gelesen, darum bei Wechsel neu laden.
addEventListener("hashchange", () => location.reload());

// Route aus dem Hash (#/alerts) oder, im statischen Build, aus dem Dateinamen (alerts.html)
const file = location.pathname.split("/").pop()!.replace(/\.html$/, "");
const path = location.hash.replace(/^#\/?/, "").split("?")[0] || (file === "index" ? "" : file);
const scenes: Record<string, React.ReactNode> = {
  starting: <Screen kind="starting" />,
  brb: <Screen kind="brb" />,
  ending: <Screen kind="ending" />,
  alerts: <Alerts />,
  chat: <Chat />,
  cam: <Cam />,
  music: <Music />,
  fx: <Fx />,
};
// Werkzeuge, keine OBS-Quellen: Stinger-/Banner-Renderer und Trigger-Editor
const tools: Record<string, React.ReactNode> = { stinger: <Stinger />, triggers: <Triggers /> };

document.body.classList.toggle("overlay", path in scenes);
createRoot(document.getElementById("root")!).render(scenes[path] ?? tools[path] ?? <Home />);
