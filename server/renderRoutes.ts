// HTTP handlers for rendering (stinger, banners): frames arrive as PNG from the dashboard, ffmpeg (FFMPEG, otherwise
// from PATH; in the Docker image via apk) builds the result in DATA/streamers/<login>/render/. The rules (one render
// per streamer, limits, file names, ffmpeg arguments) are in render.ts, with checks.
import { spawn } from "node:child_process";
import { copyFile, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import type { Feature } from "./access.ts";
import { json, readBody, send, serveStatic } from "./http.ts";
import { CLIPS, createRenderJobs, ffmpegArgs, isClip, isOutputName, outputNames, RENDER_LIMITS } from "./render.ts";

type RenderCall = { request: IncomingMessage; response: ServerResponse; url: URL; login: string };
type Job = Exclude<ReturnType<ReturnType<typeof createRenderJobs>["finish"]>, string>;

const FFMPEG = process.env.FFMPEG ?? "ffmpeg";

// renderFolder: render/ folder in the streamer's profile; hasFeature: may the streamer render this clip
export function renderRoutes(renderFolder: (login: string) => string, hasFeature: (login: string, feature: Feature) => boolean) {
  const jobs = createRenderJobs(Date.now);

  return {
    start: async ({ response, url, login }: RenderCall) => {
      const clip = url.searchParams.get("clip") ?? "";
      if (!isClip(clip)) return send(response, 400, "unknown-clip");
      if (!hasFeature(login, CLIPS[clip].feature)) return send(response, 403, "feature-off");
      const busy = jobs.start(login, clip);
      if (busy) return send(response, 409, busy);
      const frames = join(renderFolder(login), "frames");
      await rm(frames, { recursive: true, force: true });
      await mkdir(frames, { recursive: true });
      json(response, { ok: true });
    },
    frame: async ({ request, response, url, login }: RenderCall) => {
      const index = Number(url.searchParams.get("i"));
      const body = await readBody(request, RENDER_LIMITS.frameBytes);
      const error = jobs.frame(login, index, body.length);
      if (error) return send(response, error === "render-limit" || error === "too-large" ? 400 : 409, error);
      await writeFile(join(renderFolder(login), "frames", `${String(index).padStart(4, "0")}.png`), body);
      json(response, { ok: true });
    },
    done: async ({ response, url, login }: RenderCall) => {
      const job = jobs.finish(login, Number(url.searchParams.get("fps")));
      if (typeof job === "string") return send(response, job === "render-limit" ? 400 : 409, job);
      // The job stays taken until ffmpeg is finished: never several ffmpeg runs for one streamer
      try {
        await encode(response, renderFolder(login), login, job);
      } finally {
        jobs.done(login);
      }
    },
    // Cancel before encoding: release the job and delete the frames so far
    cancel: async ({ response, login }: RenderCall) => {
      if (!jobs.cancel(login)) return send(response, 409, "render-busy");
      await rm(join(renderFolder(login), "frames"), { recursive: true, force: true });
      json(response, { ok: true });
    },
    // Finished files of the streamer with size
    files: async ({ response, login }: RenderCall) => {
      const folder = renderFolder(login);
      const names = (await readdir(folder).catch(() => [] as string[])).filter(isOutputName).sort();
      json(response, await Promise.all(names.map(async name => ({ name, size: (await stat(join(folder, name))).size }))));
    },
    file: ({ response, url, login }: RenderCall) => {
      const name = url.searchParams.get("name") ?? "";
      if (!isOutputName(name)) return send(response, 400, "invalid-name");
      response.setHeader("Content-Disposition", `attachment; filename="${name}"`);
      return serveStatic(response, renderFolder(login), `/${name}`, true);
    },
  };
}

// ffmpeg builds the video (and still image) from the frames, afterwards the frames are gone
async function encode(response: ServerResponse, folder: string, login: string, job: Job) {
  const frames = join(folder, "frames");
  const [video, still] = outputNames(job.clip);
  const target = join(folder, video);
  const result = await runFfmpeg(ffmpegArgs(CLIPS[job.clip].format, job.fps, frames, target));
  // Still image from the first frame for places where Twitch shows no animated GIF
  if (result === 0 && still) await copyFile(join(frames, "0000.png"), join(folder, still));
  await rm(frames, { recursive: true, force: true });
  if (result !== 0) return send(response, 500, result === "missing" ? "ffmpeg-missing" : "render-failed");
  const bytes = (await stat(target)).size;
  console.log(`Rendered ${video} for ${login}: ${job.frames} frames, ${bytes} bytes`);
  json(response, { files: outputNames(job.clip), bytes, tooLarge: CLIPS[job.clip].format === "gif" && bytes > RENDER_LIMITS.gifWarnBytes });
}

// Exit code of ffmpeg, "missing" if it does not start
function runFfmpeg(args: string[]): Promise<number | "missing"> {
  return new Promise(done => {
    const child = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "pipe"] });
    let log = "";
    child.stderr.on("data", (chunk: Buffer) => { log = (log + chunk.toString()).slice(-2000); });
    child.on("error", () => done("missing"));
    child.on("close", code => {
      if (code !== 0) console.error(`ffmpeg failed (${code ?? "?"}): ${log}`);
      done(code ?? 1);
    });
  });
}
