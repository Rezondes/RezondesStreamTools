// Fake for Twitch and Spotify (RUST-PLAN.md package 3): a local HTTP server that the contract tests put in place of
// the real services via the variables from env (providers.ts). No real account, no network to the outside.
//   Twitch OAuth  /oauth2/token|validate|revoke   code "code-<login>-<id>" yields tokens for that user
//                 /oauth2/authorize                sends the browser straight back to redirect_uri with the code of
//                                                  DEMO_USER (the demo login of scripts/demo.ts)
//   Helix         /helix/users|eventsub/subscriptions|chat/messages
//   Spotify       /spotify-accounts/api/token, /spotify-api/me, /spotify-api/me/player/currently-playing
//   WebSocket     /eventsub (sends session_welcome), /irc
//   Control       POST /control/eventsub (JSON to all EventSub clients), /control/irc (lines to all IRC clients),
//                 /control/spotify (set token answer, account, current track)
// WebSocket handshake and frames are hand-written (text, ping, close only), so no npm dependency is needed.
// Check: fakeProviders.check.ts.
import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo, Socket } from "node:net";

type User = { login: string; id: string };
type SpotifyState = { token: Record<string, unknown> | null; account: string; playing: Record<string, unknown> | null };

export type FakeProviders = {
  url: string;
  // The environment for the server under test (providerUrls)
  env: Record<string, string>;
  revoked: Set<string>;
  subscriptions: unknown[];
  chatMessages: unknown[];
  // Lines that IRC clients sent (PASS, NICK, JOIN ...)
  ircReceived: string[];
  stop(): Promise<void>;
};

type State = Omit<FakeProviders, "url" | "env" | "stop"> & {
  tokens: Map<string, User>;
  refreshes: Map<string, User>;
  issued: number;
  spotify: SpotifyState;
  sockets: { eventsub: Set<Socket>; irc: Set<Socket> };
};

// The account the authorize page logs in without asking (npm run demo)
export const DEMO_USER: User = { login: "demo", id: "1000" };

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const SPOTIFY_TOKEN = { access_token: "spotify-access", refresh_token: "spotify-refresh", expires_in: 3600 };

export async function startFakeProviders(port = 0): Promise<FakeProviders> {
  const state: State = {
    revoked: new Set(), subscriptions: [], chatMessages: [], ircReceived: [], tokens: new Map(), refreshes: new Map(), issued: 0,
    spotify: { token: SPOTIFY_TOKEN, account: "Fake Spotify", playing: null },
    sockets: { eventsub: new Set(), irc: new Set() },
  };
  const server = createServer((request, response) => {
    void readBody(request).then(body => route(state, request, response, body));
  });
  server.on("upgrade", (request: IncomingMessage, socket: Socket) => upgrade(state, request, socket));
  await new Promise<void>(done => server.listen(port, "127.0.0.1", done));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const ws = url.replace("http:", "ws:");
  return {
    url,
    env: {
      TWITCH_ID_URL: `${url}/oauth2`, TWITCH_API_URL: `${url}/helix`, TWITCH_EVENTSUB_URL: `${ws}/eventsub`, TWITCH_IRC_URL: `${ws}/irc`,
      SPOTIFY_ACCOUNTS_URL: `${url}/spotify-accounts`, SPOTIFY_API_URL: `${url}/spotify-api`,
    },
    revoked: state.revoked, subscriptions: state.subscriptions, chatMessages: state.chatMessages, ircReceived: state.ircReceived,
    stop: () => new Promise(done => {
      for (const socket of [...state.sockets.eventsub, ...state.sockets.irc]) socket.destroy();
      server.closeAllConnections();
      server.close(() => done());
    }),
  };
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise(done => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => done(Buffer.concat(chunks).toString("utf8")));
  });
}

function send(response: ServerResponse, status: number, body?: unknown) {
  response.writeHead(status, body === undefined ? {} : { "Content-Type": "application/json" });
  response.end(body === undefined ? undefined : JSON.stringify(body));
}

// The user of the token from "Authorization: Bearer|OAuth <token>"; revoked tokens do not count
function bearer(state: State, request: IncomingMessage): User | null {
  const token = /^(?:Bearer|OAuth) (.+)$/.exec(request.headers.authorization ?? "")?.[1] ?? "";
  return state.revoked.has(token) ? null : state.tokens.get(token) ?? null;
}

function route(state: State, request: IncomingMessage, response: ServerResponse, body: string) {
  const path = new URL(request.url ?? "/", "http://fake").pathname;
  const key = `${request.method} ${path}`;
  if (path.startsWith("/oauth2/")) return twitchAuth(state, key, request, response, body);
  if (path.startsWith("/helix/")) return helix(state, key, request, response, body);
  if (path.startsWith("/spotify-")) return spotify(state, key, request, response);
  if (path.startsWith("/control/")) return control(state, key, response, body);
  send(response, 404);
}

function issue(state: State, user: User) {
  const access = `access-${user.login}-${user.id}-${++state.issued}`;
  const refresh = `refresh-${user.login}-${user.id}`;
  state.tokens.set(access, user);
  state.refreshes.set(refresh, user);
  return { access_token: access, refresh_token: refresh, expires_in: 14_400 };
}

function tokenUser(state: State, form: URLSearchParams): User | undefined {
  if (form.get("grant_type") === "refresh_token") return state.refreshes.get(form.get("refresh_token") ?? "");
  const code = /^code-([a-z0-9_]{1,25})-(\d{1,20})$/.exec(form.get("code") ?? "");
  return code ? { login: code[1], id: code[2] } : undefined;
}

function twitchAuth(state: State, key: string, request: IncomingMessage, response: ServerResponse, body: string) {
  const form = new URLSearchParams(body);
  if (key === "POST /oauth2/token") {
    const user = tokenUser(state, form);
    return user ? send(response, 200, issue(state, user)) : send(response, 400, { message: "Invalid authorization code" });
  }
  if (key === "GET /oauth2/validate") {
    const user = bearer(state, request);
    if (!user) return send(response, 401, { message: "invalid access token" });
    return send(response, 200, { client_id: "fake", login: user.login, user_id: user.id, expires_in: 14_400, scopes: ["user:write:chat"] });
  }
  if (key === "GET /oauth2/authorize") {
    const query = new URL(request.url ?? "/", "http://fake").searchParams;
    const back = new URL(query.get("redirect_uri") ?? "");
    back.searchParams.set("code", `code-${DEMO_USER.login}-${DEMO_USER.id}`);
    back.searchParams.set("state", query.get("state") ?? "");
    response.writeHead(302, { Location: back.toString() });
    return response.end();
  }
  if (key === "POST /oauth2/revoke") {
    state.revoked.add(form.get("token") ?? "");
    return send(response, 200);
  }
  send(response, 404);
}

function helix(state: State, key: string, request: IncomingMessage, response: ServerResponse, body: string) {
  const user = bearer(state, request);
  if (!user) return send(response, 401, { message: "Invalid OAuth token" });
  if (key === "GET /helix/users") return send(response, 200, { data: [{ id: user.id, login: user.login, display_name: user.login }] });
  if (key === "POST /helix/eventsub/subscriptions") {
    state.subscriptions.push(JSON.parse(body) as unknown);
    return send(response, 202, { data: [] });
  }
  if (key === "POST /helix/chat/messages") {
    state.chatMessages.push(JSON.parse(body) as unknown);
    return send(response, 200, { data: [{ is_sent: true }] });
  }
  send(response, 404);
}

function spotify(state: State, key: string, request: IncomingMessage, response: ServerResponse) {
  const { token, account, playing } = state.spotify;
  if (key === "POST /spotify-accounts/api/token") return token ? send(response, 200, token) : send(response, 400, { error: "invalid_grant" });
  if (!token || request.headers.authorization !== `Bearer ${String(token.access_token)}`) return send(response, 401);
  if (key === "GET /spotify-api/me") return send(response, 200, { id: "fake", display_name: account });
  if (key === "GET /spotify-api/me/player/currently-playing") return playing ? send(response, 200, playing) : send(response, 204);
  send(response, 404);
}

function control(state: State, key: string, response: ServerResponse, body: string) {
  if (key === "POST /control/eventsub") {
    for (const socket of state.sockets.eventsub) socket.write(frame(body));
  } else if (key === "POST /control/irc") {
    const lines = body.split(/\r?\n/).filter(Boolean).map(line => `${line}\r\n`).join("");
    for (const socket of state.sockets.irc) socket.write(frame(lines));
  } else if (key === "POST /control/spotify") {
    Object.assign(state.spotify, JSON.parse(body) as Partial<SpotifyState>);
  } else {
    return send(response, 404);
  }
  send(response, 204);
}

function upgrade(state: State, request: IncomingMessage, socket: Socket) {
  const path = new URL(request.url ?? "/", "http://fake").pathname;
  const key = request.headers["sec-websocket-key"];
  const kind = path === "/eventsub" ? "eventsub" : path === "/irc" ? "irc" : null;
  if (!kind || typeof key !== "string") {
    socket.destroy();
    return;
  }
  const accept = createHash("sha1").update(key + WS_GUID).digest("base64");
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  state.sockets[kind].add(socket);
  socket.on("close", () => state.sockets[kind].delete(socket));
  socket.on("error", () => socket.destroy());
  readFrames(socket, text => {
    if (kind === "irc") state.ircReceived.push(...text.split(/\r?\n/).filter(Boolean));
  });
  if (kind === "eventsub") {
    const welcome = { metadata: { message_type: "session_welcome" }, payload: { session: { id: `session-${Date.now()}`, keepalive_timeout_seconds: 600 } } };
    socket.write(frame(JSON.stringify(welcome)));
  }
}

// Server frame: unmasked, FIN set. opcode 1 = text, 8 = close, 10 = pong
export function frame(text: string | Buffer, opcode = 1): Buffer {
  const payload = typeof text === "string" ? Buffer.from(text, "utf8") : text;
  const length = payload.length;
  if (length < 126) return Buffer.concat([Buffer.from([0x80 | opcode, length]), payload]);
  if (length < 65_536) return Buffer.concat([Buffer.from([0x80 | opcode, 126, length >> 8, length & 0xff]), payload]);
  const big = Buffer.alloc(8);
  big.writeBigUInt64BE(BigInt(length));
  return Buffer.concat([Buffer.from([0x80 | opcode, 127]), big, payload]);
}

// Reads client frames (always masked). Text goes to onText, ping gets a pong, close is answered
function readFrames(socket: Socket, onText: (text: string) => void) {
  let buffer = Buffer.alloc(0);
  socket.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    for (let next = parseFrame(buffer); next; next = parseFrame(buffer)) {
      buffer = buffer.subarray(next.size);
      if (next.opcode === 1) onText(next.payload.toString("utf8"));
      if (next.opcode === 9) socket.write(frame(next.payload, 10));
      if (next.opcode === 8) socket.end(frame(Buffer.alloc(0), 8));
    }
  });
}

// A complete frame at the start of buffer, or null while bytes are missing
export function parseFrame(buffer: Buffer): { opcode: number; payload: Buffer; size: number } | null {
  if (buffer.length < 2) return null;
  let length = buffer[1] & 0x7f;
  let offset = 2;
  if (length === 126) {
    if (buffer.length < 4) return null;
    length = buffer.readUInt16BE(2);
    offset = 4;
  } else if (length === 127) {
    if (buffer.length < 10) return null;
    length = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }
  const mask = (buffer[1] & 0x80) !== 0 ? buffer.subarray(offset, offset + 4) : null;
  if (mask) offset += 4;
  if (buffer.length < offset + length) return null;
  const payload = Buffer.from(buffer.subarray(offset, offset + length));
  if (mask) for (let index = 0; index < payload.length; index++) payload[index] ^= mask[index % 4];
  return { opcode: buffer[0] & 0x0f, payload, size: offset + length };
}
