// Check for worldCache.ts: the first visit paints and stores, the next one only draws from the cache, another look paints
// anew and drops the old entry, a cancelled paint draws nothing, without Cache Storage it paints. Fake caches, canvases
// and createImageBitmap stand in for the browser. Runs with npm test.
import assert from "node:assert/strict";
import { paintCached } from "./worldCache.ts";

const entries = new Map<string, Response>();
const store = {
  match: (url: string) => Promise.resolve(entries.get(url)?.clone()),
  put: (url: string, response: Response) => { entries.set(url, response); return Promise.resolve(); },
  keys: () => Promise.resolve([...entries.keys()].map(url => ({ url: `http://localhost${url}` }))),
  delete: (request: { url: string }) => Promise.resolve(entries.delete(new URL(request.url).pathname)),
};
const drawn: unknown[] = [];
const canvas = (name: string) => ({
  width: 4, height: 2,
  getContext: () => ({ clearRect: () => {}, drawImage: (image: unknown) => { drawn.push(image); } }),
  toBlob: (done: (blob: Blob) => void) => done(new Blob([name])),
}) as unknown as HTMLCanvasElement;
const canvases = [canvas("sky"), canvas("land")];
const globals = globalThis as unknown as Record<string, unknown>;
globals.createImageBitmap = (blob: Blob) => blob.text();

let paints = 0;
const paint = () => { paints++; };
const never = () => false;

// Without Cache Storage it paints every time
await paintCached({ look: 1 }, canvases, paint, never);
assert.equal(paints, 1);

globals.caches = { open: () => Promise.resolve(store) };
await paintCached({ look: 1 }, canvases, paint, never);
assert.equal(paints, 2);
assert.equal(entries.size, 2);
assert.deepEqual(drawn, []);

// The same look again: drawn from the cache, not painted
await paintCached({ look: 1 }, canvases, paint, never);
assert.equal(paints, 2);
assert.deepEqual(drawn, ["sky", "land"]);

// Another look paints and replaces the old entries
await paintCached({ look: 2 }, canvases, paint, never);
assert.equal(paints, 3);
assert.equal(entries.size, 2);

// Cancelled while the cache answers: nothing is painted or drawn
drawn.length = 0;
await paintCached({ look: 2 }, canvases, paint, () => true);
await paintCached({ look: 3 }, canvases, paint, () => true);
assert.equal(paints, 3);
assert.deepEqual(drawn, []);

// Cancelled while the images load: nothing is drawn
let asked = 0;
await paintCached({ look: 2 }, canvases, paint, () => ++asked > 1);
assert.deepEqual(drawn, []);

console.log("bears worldCache ok");
