// Check for render.ts: ffmpeg arguments per format, clips and output names, limits and at most one render per
// streamer. Runs with npm test.
import assert from "node:assert/strict";
import { CLIPS, createRenderJobs, ffmpegArgs, isOutputName, outputNames, RENDER_LIMITS } from "./render.ts";

// GIF: own palette, endless loop; WebM: VP9 with alpha channel
const gif = ffmpegArgs("gif", 12, "frames", "profile.gif");
assert.deepEqual(gif.slice(0, 5), ["-y", "-framerate", "12", "-i", "frames/%04d.png"]);
assert.ok(gif.some(argument => argument.includes("palettegen") && argument.includes("paletteuse")));
assert.deepEqual(gif.slice(-3), ["-loop", "0", "profile.gif"]);
const webm = ffmpegArgs("webm", 60, "frames", "stinger.webm");
assert.ok(webm.includes("libvpx-vp9"));
assert.equal(webm[webm.indexOf("-pix_fmt") + 1], "yuva420p");
assert.equal(webm.at(-1), "stinger.webm");

// Clips: the stinger needs the feature stinger, the banners banners; outputs with a still image for GIFs
assert.equal(CLIPS.stinger.feature, "stinger");
assert.equal(CLIPS.profile.feature, "banners");
assert.deepEqual(outputNames("stinger"), ["stinger.webm"]);
assert.deepEqual(outputNames("offline"), ["offline.gif", "offline.png"]);
assert.ok(isOutputName("profile.png"));
assert.ok(!isOutputName("../tokens.json"));
assert.ok(!isOutputName("stinger.gif"));

// At most one render per streamer; a hanging render is released after the timeout
let now = 1000;
const jobs = createRenderJobs(() => now);
assert.equal(jobs.start("neo", "stinger"), null);
assert.equal(jobs.start("neo", "profile"), "render-busy");
assert.equal(jobs.start("trinity", "profile"), null);
now += RENDER_LIMITS.timeoutMs + 1;
assert.equal(jobs.start("neo", "offline"), null);

// Frames: only with a running render, number and size limited
assert.equal(jobs.frame("morpheus", 0, 100), "render-not-started");
assert.equal(jobs.frame("neo", 0, 100), null);
assert.equal(jobs.frame("neo", 10000, 100), "render-limit");
assert.equal(jobs.frame("neo", -1, 100), "render-limit");
assert.equal(jobs.frame("neo", 1, RENDER_LIMITS.frameBytes + 1), "too-large");

// Finish: returns the streamer's clip; the render stays taken until ffmpeg is finished (done), so a
// streamer does not start several ffmpeg runs at once. Meanwhile no restart, no frames, no cancel
assert.deepEqual(jobs.finish("neo", 10), { clip: "offline", frames: 1, fps: 10 });
assert.equal(jobs.finish("neo", 10), "render-busy");
assert.equal(jobs.start("neo", "stinger"), "render-busy");
assert.equal(jobs.frame("neo", 0, 100), "render-busy");
assert.equal(jobs.cancel("neo"), false);
jobs.done("neo");
assert.equal(jobs.finish("neo", 10), "render-not-started");
assert.equal(jobs.start("neo", "stinger"), null);
// fps only 1 to 60
assert.equal(jobs.finish("neo", 0), "render-limit");
assert.equal(jobs.finish("neo", 61), "render-limit");
assert.equal(jobs.cancel("neo"), true);
assert.equal(jobs.start("neo", "stinger"), null);

console.log("render ok");
