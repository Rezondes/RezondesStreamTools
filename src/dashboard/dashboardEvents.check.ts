// Check of dashboardEvents.ts: one stream for all listeners, changes reach the right ones, everyone loads after a
// connect, a stream the server closed comes back after a pause, the last listener closes it
import assert from "node:assert/strict";
import { type ChangeSource, changeFeed } from "./dashboardEvents.ts";

const opened: ChangeSource[] = [];
const open = (): ChangeSource => {
  const source: ChangeSource = { onopen: null, onmessage: null, onerror: null, readyState: 1, close: () => { source.readyState = 2; } };
  opened.push(source);
  return source;
};
let retry: (() => void) | null = null;
let cancelled = 0;
const onChange = changeFeed(open, run => { retry = run; return () => { cancelled++; }; });

const heard: string[] = [];
const stopAccount = onChange("account", () => heard.push("account"));
const stopSpotify = onChange("spotify", () => heard.push("spotify"));
assert.equal(opened.length, 1, "one stream for both");

opened[0].onopen?.(new Event("open"));
assert.deepEqual(heard.splice(0), ["account", "spotify"], "everyone loads after a connect");
opened[0].onmessage?.(new MessageEvent("message", { data: JSON.stringify("spotify") }));
opened[0].onmessage?.(new MessageEvent("message", { data: JSON.stringify("backups") }));
assert.deepEqual(heard.splice(0), ["spotify"], "only the listeners of that change");

// A broken connection that EventSource retries itself starts nothing; a closed one comes back after the pause
opened[0].onerror?.(new Event("error"));
assert.equal(retry, null);
opened[0].readyState = 2;
opened[0].onerror?.(new Event("error"));
assert.ok(retry, "a new connect is waiting");
(retry as () => void)();
assert.equal(opened.length, 2, "connected again");

stopAccount();
assert.equal(opened[1].readyState, 1, "still a listener left");
stopSpotify();
assert.equal(opened[1].readyState, 2, "the last listener closes the stream");
assert.equal(cancelled, 1, "and a waiting connect");
onChange("backups", () => {});
assert.equal(opened.length, 3, "a new listener opens it again");

console.log("dashboardEvents ok");
