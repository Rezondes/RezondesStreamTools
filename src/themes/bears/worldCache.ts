// Browser cache of the painted world for the dashboard skin (Cache Storage): the canvases of one look are painted once,
// later visits only draw them from the cache; another look (changed settings) paints anew and replaces the old entry.
// Without Cache Storage (insecure origin) it simply paints.
import { seedOf } from "../../core/hash.ts";

const CACHE = "bears-world";

// Draws the canvases of the look from the cache or paints them and stores them; cancelled() stops a paint that is no
// longer wanted (the look changed meanwhile)
export async function paintCached(look: unknown, canvases: readonly HTMLCanvasElement[], paint: () => void, cancelled: () => boolean): Promise<void> {
  if (!("caches" in globalThis)) return paint();
  const key = `/${CACHE}/${seedOf(JSON.stringify(look))}`;
  const cache = await caches.open(CACHE);
  const hits = await Promise.all(canvases.map((_, index) => cache.match(`${key}/${index}`)));
  if (cancelled()) return;
  if (hits.every(hit => hit)) {
    const images = await Promise.all(hits.map(async hit => createImageBitmap(await hit!.blob())));
    if (cancelled()) return;
    canvases.forEach((canvas, index) => {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      context?.drawImage(images[index], 0, 0);
    });
    return;
  }
  paint();
  for (const old of await cache.keys()) if (!new URL(old.url).pathname.startsWith(key)) await cache.delete(old);
  await Promise.all(canvases.map(async (canvas, index) => {
    const blob = await new Promise<Blob | null>(done => canvas.toBlob(done));
    if (blob) await cache.put(`${key}/${index}`, new Response(blob));
  }));
}
