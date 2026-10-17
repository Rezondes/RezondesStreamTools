// Check for streamHub.ts: messages to all streams, limit for open streams, a client that does not read is
// disconnected instead of buffered without limit. Runs with npm test.
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { MAX_PENDING_BYTES, MAX_STREAMS, openStream, streamHub } from "./streamHub.ts";

type Fake = { lines: string[]; writableLength: number; destroyed: boolean; ended: boolean; head?: number };
function fakeStream(): Fake & ServerResponse {
  const fake: Fake = { lines: [], writableLength: 0, destroyed: false, ended: false };
  return Object.assign(fake, {
    write(line: string) { fake.lines.push(line); return true; },
    destroy() { fake.destroyed = true; },
    end() { fake.ended = true; },
    writeHead(status: number) { fake.head = status; },
  }) as unknown as Fake & ServerResponse;
}
const request = () => new EventEmitter() as IncomingMessage;

const hub = streamHub(20);
const overlay = fakeStream();
const watcher = fakeStream();
const overlayRequest = request();
hub.add(overlayRequest, overlay, false);
hub.add(request(), watcher, true);
assert.equal(hub.overlayCount(), 1);

hub.emit({ type: "music", track: null });
assert.deepEqual(overlay.lines, [`data: {"type":"music","track":null}\n\n`]);
assert.deepEqual(watcher.lines, overlay.lines);

// A client that no longer reads: its buffer is above the limit, it is disconnected and gets nothing more
watcher.writableLength = MAX_PENDING_BYTES + 1;
hub.emit({ type: "music", track: null });
assert.equal(watcher.destroyed, true);
assert.equal(watcher.lines.length, 1);
assert.equal(overlay.lines.length, 2);

// Ping keeps the connection open
await new Promise(resolve => setTimeout(resolve, 30));
assert.ok(overlay.lines.includes(": ping\n\n"));

// A closed connection no longer counts
overlayRequest.emit("close");
assert.equal(hub.overlayCount(), 0);

// Limit for open streams
for (let index = 0; index < MAX_STREAMS; index++) hub.add(request(), fakeStream(), false);
assert.equal(hub.full(), true);
hub.close();
assert.equal(hub.overlayCount(), 0);

// Opening immediately sends track and minimes (without the minimes feature no minimes message)
const opened = fakeStream();
openStream(opened, null, []);
assert.equal(opened.head, 200);
assert.equal(opened.lines.length, 3);
const withoutMinimes = fakeStream();
openStream(withoutMinimes, null, null);
assert.equal(withoutMinimes.lines.length, 2);

console.log("streamHub ok");
