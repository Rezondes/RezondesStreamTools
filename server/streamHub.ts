// Offene SSE-Verbindungen eines Streamers: Overlays und Dashboard-Protokolle (watchers) bekommen dieselben
// Nachrichten, aber nur Overlays zählen als "jemand schaut zu" (Spotify fragt nur dann ab).
// Eine Verbindung, die nicht mehr liest, wird getrennt, statt ihre Nachrichten unbegrenzt im Server zu puffern.
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Minime, ServerMessage, Track } from "../src/core/types.ts";

// fixed: Server-Schutzgrenzen gegen Verbindungs- und Speicherfluten
export const MAX_STREAMS = 50;
export const MAX_PENDING_BYTES = 1024 * 1024;

export function streamHub(pingMs = 25_000) {
  const overlays = new Set<ServerResponse>();
  const watchers = new Set<ServerResponse>();
  const write = (line: string) => {
    for (const set of [overlays, watchers]) {
      for (const stream of [...set]) {
        // Ein Client, der nicht liest, lässt writableLength wachsen: trennen
        if (stream.writableLength > MAX_PENDING_BYTES) {
          set.delete(stream);
          stream.destroy();
          continue;
        }
        stream.write(line);
      }
    }
  };
  // Kommentarzeile hält die Verbindung durch Proxys und OBS offen
  const ping = setInterval(() => write(": ping\n\n"), pingMs);
  return {
    emit: (message: ServerMessage) => write(`data: ${JSON.stringify(message)}\n\n`),
    overlayCount: () => overlays.size,
    full: () => overlays.size + watchers.size >= MAX_STREAMS,
    add(request: IncomingMessage, response: ServerResponse, watcher: boolean) {
      const set = watcher ? watchers : overlays;
      set.add(response);
      request.on("close", () => set.delete(response));
    },
    close() {
      clearInterval(ping);
      for (const stream of [...overlays, ...watchers]) stream.end();
      overlays.clear();
      watchers.clear();
    },
  };
}

// Antwort als Server-Sent Events öffnen und sofort mit dem laufenden Titel und den Minimes versorgen
// (minimes: null = Funktion aus, dann keine Nachricht)
export function openStream(response: ServerResponse, track: Track | null, minimes: Minime[] | null) {
  response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  response.write(": connected\n\n");
  response.write(`data: ${JSON.stringify({ type: "music", track })}\n\n`);
  if (minimes) response.write(`data: ${JSON.stringify({ type: "minimes", minimes })}\n\n`);
}
