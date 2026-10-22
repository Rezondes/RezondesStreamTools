// Check for notices.ts: toasts come and go, errors wait in a queue until closed and carry copyable details.
// Runs with npm test.
import assert from "node:assert/strict";
import { closeError, currentError, currentToasts, dismissToast, reportError, subscribeNotices, toast } from "./notices.ts";

let calls = 0;
const unsubscribe = subscribeNotices(() => calls++);

// Toasts: appear, a click or the time removes them
toast("Gespeichert");
toast("Ausgelöst", 1);
assert.deepEqual(currentToasts().map(item => item.text), ["Gespeichert", "Ausgelöst"]);
dismissToast(currentToasts()[0].id);
assert.deepEqual(currentToasts().map(item => item.text), ["Ausgelöst"], "a click removes it");
await new Promise(resolve => setTimeout(resolve, 20));
assert.deepEqual(currentToasts(), [], "it goes away after its time");

// Errors: never a toast, one after another until closed, with details for the admin
assert.equal(currentError(), null);
reportError("Server nicht erreichbar", { Aktion: "POST /api/test?kind=follow", Code: "server-error" }, new Date(0));
reportError("Zweiter", {});
assert.deepEqual(currentToasts(), [], "errors never come as a toast");
assert.equal(currentError()?.text, "Server nicht erreichbar");
assert.equal(currentError()?.details, "Fehler: Server nicht erreichbar\nAktion: POST /api/test?kind=follow\nCode: server-error\nZeit: 1970-01-01T00:00:00.000Z");
closeError();
assert.equal(currentError()?.text, "Zweiter", "the next error follows");
closeError();
assert.equal(currentError(), null);

assert.ok(calls >= 8, "listeners hear every change");
unsubscribe();
const before = calls;
toast("still", 1);
assert.equal(calls, before, "no listener after unsubscribing");
await new Promise(resolve => setTimeout(resolve, 20));

console.log("notices ok");
