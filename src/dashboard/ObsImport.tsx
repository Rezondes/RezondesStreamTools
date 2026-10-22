// "Import into OBS" on the overview: download the scene collection as a file or create it directly via obs-websocket 5.
// The browser on this PC connects to ws://localhost, the overlay server is not
// involved; the password is stored nowhere. Dragging single URLs is in the table (Overview.tsx).
import { useState } from "react";
import { reportError, toast } from "./notices.ts";
import { obsAuth, obsRequests, sceneCollection, type ObsScene } from "./obsSetup.ts";
import { TEXTS } from "./texts.de.ts";

const OBS_TEXT = TEXTS.obs;
const DEFAULT_PORT = 4455;
// Close code of obs-websocket for a wrong password
const AUTH_FAILED = 4009;

type ObsMessage =
  | { op: 0; d: { authentication?: { salt: string; challenge: string } } }
  | { op: 2; d: unknown }
  | { op: 7; d: { requestId: string; requestStatus: { result: boolean; comment?: string; code: number }; responseData?: unknown } };

class ObsError extends Error {}

export default function ObsImport({ login, layout }: { login: string; layout: ObsScene[] }) {
  const [port, setPort] = useState(DEFAULT_PORT);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const download = () => {
    const collection = sceneCollection(OBS_TEXT.collection(login), layout, () => crypto.randomUUID());
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" }));
    link.download = `obs-${login}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const connect = () => {
    setBusy(true);
    setStatus(OBS_TEXT.connecting);
    importViaWebSocket(port, password, layout)
      .then(count => toast(OBS_TEXT.done(count)))
      .catch((error: unknown) => reportError(error instanceof ObsError ? error.message : OBS_TEXT.unreachable, { Aktion: "OBS-Import über WebSocket", Port: String(port), Grund: String(error) }))
      .finally(() => { setBusy(false); setStatus(""); });
  };

  return (
    <section className="obs-import">
      <h2>{OBS_TEXT.title}</h2>
      <p className="muted">{OBS_TEXT.intro}</p>
      <h3>{OBS_TEXT.fileTitle}</h3>
      <p className="actions"><button className="btn" onClick={download}>{OBS_TEXT.file}</button></p>
      <p className="muted">{OBS_TEXT.fileHint}</p>
      <h3>{OBS_TEXT.socketTitle}</h3>
      <form className="actions" onSubmit={event => { event.preventDefault(); connect(); }}>
        <label className="setting">{OBS_TEXT.port}
          <input type="number" min={1} max={65535} value={port} onChange={event => setPort(Number(event.target.value))} />
        </label>
        <label className="setting">{OBS_TEXT.password}
          <input type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} />
        </label>
        <button className="btn" disabled={busy}>{OBS_TEXT.socket}</button>
        <span role="status">{status}</span>
      </form>
      <p className="muted">{OBS_TEXT.socketHint}</p>
    </section>
  );
}

// Connect, authenticate, read existing scenes and sources, then send the requests one after another; returns the number
async function importViaWebSocket(port: number, password: string, layout: ObsScene[]) {
  const socket = new WebSocket(`ws://localhost:${port}`);
  const pending = new Map<string, { resolve: (data: unknown) => void; reject: (error: Error) => void }>();
  let nextId = 0;
  const call = (requestType: string, requestData: Record<string, unknown> = {}) => new Promise<unknown>((resolve, reject) => {
    const requestId = String(++nextId);
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData } }));
  });

  await new Promise<void>((resolve, reject) => {
    socket.onclose = event => reject(new ObsError(event.code === AUTH_FAILED ? OBS_TEXT.auth : OBS_TEXT.unreachable));
    socket.onmessage = event => {
      const message = JSON.parse(String(event.data)) as ObsMessage;
      if (message.op === 0) {
        const challenge = message.d.authentication;
        const identify = (authentication?: string) => socket.send(JSON.stringify({ op: 1, d: { rpcVersion: 1, authentication } }));
        if (!challenge) return identify();
        obsAuth(password, challenge.salt, challenge.challenge).then(identify).catch(reject);
      }
      if (message.op === 2) resolve();
      if (message.op === 7) {
        const { requestId, requestStatus, responseData } = message.d;
        const request = pending.get(requestId);
        pending.delete(requestId);
        if (requestStatus.result) request?.resolve(responseData);
        else request?.reject(new ObsError(OBS_TEXT.failed(requestStatus.comment ?? String(requestStatus.code))));
      }
    };
  });
  socket.onclose = () => pending.forEach(request => request.reject(new ObsError(OBS_TEXT.unreachable)));

  try {
    const { scenes } = (await call("GetSceneList")) as { scenes: { sceneName: string }[] };
    const { inputs } = (await call("GetInputList")) as { inputs: { inputName: string }[] };
    const requests = obsRequests(layout, scenes.map(scene => scene.sceneName), inputs.map(input => input.inputName));
    for (const request of requests) {
      const answer = (await call(request.requestType, request.requestData)) as { sceneItemId?: number } | null;
      if (request.place) await placeItem(call, request.requestData.inputName as string, request.place, answer?.sceneItemId);
    }
    return requests.length;
  } finally {
    socket.close();
  }
}

type Call = (requestType: string, requestData?: Record<string, unknown>) => Promise<unknown>;

// Puts the item of a source where it belongs on the canvas: a new one always, an existing one only while it still sits
// at 0, 0 (where it was before the source got smaller), so a source the streamer moved stays where it is
async function placeItem(call: Call, sourceName: string, place: { sceneName: string; x: number; y: number }, created: number | undefined) {
  const { sceneName, x, y } = place;
  let sceneItemId = created;
  if (sceneItemId === undefined) {
    ({ sceneItemId } = (await call("GetSceneItemId", { sceneName, sourceName })) as { sceneItemId: number });
    const { sceneItemTransform } = (await call("GetSceneItemTransform", { sceneName, sceneItemId })) as { sceneItemTransform: { positionX: number; positionY: number } };
    if (sceneItemTransform.positionX !== 0 || sceneItemTransform.positionY !== 0) return;
  }
  await call("SetSceneItemTransform", { sceneName, sceneItemId, sceneItemTransform: { positionX: x, positionY: y } });
}
