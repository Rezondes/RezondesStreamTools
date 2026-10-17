// Open SSE connections of a streamer: overlays and dashboard logs (watchers) get the same messages,
// but only overlays count as "someone is watching" (Spotify only polls then).
// A connection that no longer reads is disconnected instead of buffering its messages in the server without limit.
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Minime, ServerMessage, Track } from "../src/core/types.ts";

// fixed: server protection limits against connection and memory floods
export const MAX_STREAMS = 50;
export const MAX_PENDING_BYTES = 1024 * 1024;

export function streamHub(pingMs = 25_000) {
  const overlays = new Set<ServerResponse>();
  const watchers = new Set<ServerResponse>();
  const write = (line: string) => {
    for (const set of [overlays, watchers]) {
      for (const stream of [...set]) {
        // A client that does not read lets writableLength grow: disconnect
        if (stream.writableLength > MAX_PENDING_BYTES) {
          set.delete(stream);
          stream.destroy();
          continue;
        }
        stream.write(line);
      }
    }
  };
  // A comment line keeps the connection open through proxies and OBS
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

// Opens the response as server-sent events and immediately supplies the current track and the minimes
// (minimes: null = feature off, then no message)
export function openStream(response: ServerResponse, track: Track | null, minimes: Minime[] | null) {
  response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  response.write(": connected\n\n");
  response.write(`data: ${JSON.stringify({ type: "music", track })}\n\n`);
  if (minimes) response.write(`data: ${JSON.stringify({ type: "minimes", minimes })}\n\n`);
}
