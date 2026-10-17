// Check für render.ts: ffmpeg-Argumente je Format, Clips und Ausgabenamen, Grenzen und höchstens ein Render pro
// Streamer. Läuft mit npm test.
import assert from "node:assert/strict";
import { CLIPS, createRenderJobs, ffmpegArgs, isOutputName, outputNames, RENDER_LIMITS } from "./render.ts";

// GIF: eigene Palette, Endlosschleife; WebM: VP9 mit Alpha-Kanal
const gif = ffmpegArgs("gif", 12, "frames", "profile.gif");
assert.deepEqual(gif.slice(0, 5), ["-y", "-framerate", "12", "-i", "frames/%04d.png"]);
assert.ok(gif.some(argument => argument.includes("palettegen") && argument.includes("paletteuse")));
assert.deepEqual(gif.slice(-3), ["-loop", "0", "profile.gif"]);
const webm = ffmpegArgs("webm", 60, "frames", "stinger.webm");
assert.ok(webm.includes("libvpx-vp9"));
assert.equal(webm[webm.indexOf("-pix_fmt") + 1], "yuva420p");
assert.equal(webm.at(-1), "stinger.webm");

// Clips: Stinger braucht die Funktion stinger, die Banner banners; Ausgaben mit Standbild für GIFs
assert.equal(CLIPS.stinger.feature, "stinger");
assert.equal(CLIPS.profile.feature, "banners");
assert.deepEqual(outputNames("stinger"), ["stinger.webm"]);
assert.deepEqual(outputNames("offline"), ["offline.gif", "offline.png"]);
assert.ok(isOutputName("profile.png"));
assert.ok(!isOutputName("../tokens.json"));
assert.ok(!isOutputName("stinger.gif"));

// Höchstens ein Render pro Streamer; ein hängender Render gibt nach dem Timeout frei
let now = 1000;
const jobs = createRenderJobs(() => now);
assert.equal(jobs.start("neo", "stinger"), null);
assert.equal(jobs.start("neo", "profile"), "render-busy");
assert.equal(jobs.start("trinity", "profile"), null);
now += RENDER_LIMITS.timeoutMs + 1;
assert.equal(jobs.start("neo", "offline"), null);

// Frames: nur mit laufendem Render, Nummer und Grösse begrenzt
assert.equal(jobs.frame("morpheus", 0, 100), "render-not-started");
assert.equal(jobs.frame("neo", 0, 100), null);
assert.equal(jobs.frame("neo", 10000, 100), "render-limit");
assert.equal(jobs.frame("neo", -1, 100), "render-limit");
assert.equal(jobs.frame("neo", 1, RENDER_LIMITS.frameBytes + 1), "too-large");

// Fertigstellen: liefert den Clip des Streamers; der Render bleibt belegt, bis ffmpeg fertig ist (done), damit ein
// Streamer nicht mehrere ffmpeg gleichzeitig startet. Währenddessen kein Neustart, keine Frames, kein Abbruch
assert.deepEqual(jobs.finish("neo", 10), { clip: "offline", frames: 1, fps: 10 });
assert.equal(jobs.finish("neo", 10), "render-busy");
assert.equal(jobs.start("neo", "stinger"), "render-busy");
assert.equal(jobs.frame("neo", 0, 100), "render-busy");
assert.equal(jobs.cancel("neo"), false);
jobs.done("neo");
assert.equal(jobs.finish("neo", 10), "render-not-started");
assert.equal(jobs.start("neo", "stinger"), null);
// fps nur 1 bis 60
assert.equal(jobs.finish("neo", 0), "render-limit");
assert.equal(jobs.finish("neo", 61), "render-limit");
assert.equal(jobs.cancel("neo"), true);
assert.equal(jobs.start("neo", "stinger"), null);

console.log("render ok");
