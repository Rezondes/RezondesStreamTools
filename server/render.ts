// Rendering of stinger and banners per streamer: the browser draws the frames with the streamer's settings
// and sends them as PNG, the server builds WebM (stinger, with alpha) or GIF (banner, with still image) with ffmpeg.
// Here the pure parts: clips, ffmpeg arguments, limits and at most one render per streamer. File IO and the
// ffmpeg call are in server/renderRoutes.ts. Check: render.check.ts.
import type { Feature } from "./access.ts";

export const CLIPS = {
  stinger: { format: "webm", feature: "stinger" },
  profile: { format: "gif", feature: "banners" },
  offline: { format: "gif", feature: "banners" },
} as const satisfies Record<string, { format: "webm" | "gif"; feature: Feature }>;
export type Clip = keyof typeof CLIPS;

export const isClip = (value: string): value is Clip => Object.hasOwn(CLIPS, value);

export const RENDER_LIMITS = {
  frames: 1200, // 20 s at 60 fps
  frameBytes: 8 * 1024 * 1024, // one PNG at 1920x1080
  timeoutMs: 10 * 60_000, // an abandoned render is released afterwards
  gifWarnBytes: 10 * 1024 * 1024, // Twitch does not accept larger banner GIFs
};

// Files a clip produces: the video and for GIFs a still image from the first frame
export const outputNames = (clip: Clip) => (CLIPS[clip].format === "gif" ? [`${clip}.gif`, `${clip}.png`] : [`${clip}.webm`]);

export const isOutputName = (name: string) => (Object.keys(CLIPS) as Clip[]).some(clip => outputNames(clip).includes(name));

// Arguments for ffmpeg: frames frames/0000.png, 0001.png, ... with fps to target
export function ffmpegArgs(format: "gif" | "webm", fps: number, frames: string, target: string): string[] {
  const input = ["-y", "-framerate", String(fps), "-i", `${frames}/%04d.png`];
  if (format === "gif") {
    // Own palette from all frames, store only changed image areas, endless loop
    return [...input, "-filter_complex", "[0:v]split[a][b];[a]palettegen=max_colors=64:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle", "-loop", "0", target];
  }
  // VP9 with alpha channel so OBS plays the stinger transparently
  return [...input, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "20", "-auto-alt-ref", "0", "-row-mt", "1", target];
}

// encoding: ffmpeg is already running; the job stays taken until done()
type Job = { clip: Clip; frames: number; startedAt: number; encoding: boolean };
type RenderError = "render-busy" | "render-not-started" | "render-limit" | "too-large";

// Running renders per login; now is injected so the timeout stays testable
export function createRenderJobs(now: () => number) {
  const jobs = new Map<string, Job>();
  const running = (login: string) => {
    const job = jobs.get(login);
    return job && now() - job.startedAt <= RENDER_LIMITS.timeoutMs ? job : null;
  };
  return {
    start(login: string, clip: Clip): RenderError | null {
      if (running(login)) return "render-busy";
      jobs.set(login, { clip, frames: 0, startedAt: now(), encoding: false });
      return null;
    },
    frame(login: string, index: number, bytes: number): RenderError | null {
      const job = running(login);
      if (!job) return "render-not-started";
      if (job.encoding) return "render-busy";
      if (!Number.isInteger(index) || index < 0 || index >= RENDER_LIMITS.frames) return "render-limit";
      if (bytes > RENDER_LIMITS.frameBytes) return "too-large";
      job.frames = Math.max(job.frames, index + 1);
      return null;
    },
    finish(login: string, fps: number): { clip: Clip; frames: number; fps: number } | RenderError {
      const job = running(login);
      if (!job) return "render-not-started";
      if (job.encoding) return "render-busy";
      if (!Number.isInteger(fps) || fps < 1 || fps > 60) return "render-limit";
      job.encoding = true;
      return { clip: job.clip, frames: job.frames, fps };
    },
    // ffmpeg is finished (or failed): the streamer may render again
    done: (login: string) => { jobs.delete(login); },
    // Cancel only before encoding; false while ffmpeg runs
    cancel(login: string) {
      if (running(login)?.encoding) return false;
      jobs.delete(login);
      return true;
    },
  };
}
