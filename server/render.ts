// Rendern von Stinger und Bannern pro Streamer: der Browser zeichnet die Frames mit den Einstellungen des Streamers
// und schickt sie als PNG, der Server baut daraus mit ffmpeg WebM (Stinger, mit Alpha) oder GIF (Banner, mit Standbild).
// Hier die reinen Teile: Clips, ffmpeg-Argumente, Grenzen und höchstens ein Render pro Streamer. Die Datei-IO und der
// Aufruf von ffmpeg stehen in server/index.ts. Check: render.check.ts.
import type { Feature } from "./access.ts";

export const CLIPS = {
  stinger: { format: "webm", feature: "stinger" },
  profile: { format: "gif", feature: "banners" },
  offline: { format: "gif", feature: "banners" },
} as const satisfies Record<string, { format: "webm" | "gif"; feature: Feature }>;
export type Clip = keyof typeof CLIPS;

export const isClip = (value: string): value is Clip => Object.hasOwn(CLIPS, value);

export const RENDER_LIMITS = {
  frames: 1200, // 20 s mit 60 fps
  frameBytes: 8 * 1024 * 1024, // ein PNG in 1920x1080
  timeoutMs: 10 * 60_000, // ein abgebrochener Render gibt danach frei
  gifWarnBytes: 10 * 1024 * 1024, // Twitch nimmt keine grösseren Banner-GIFs
};

// Dateien, die ein Clip erzeugt: das Video und bei GIFs ein Standbild aus dem ersten Frame
export const outputNames = (clip: Clip) => (CLIPS[clip].format === "gif" ? [`${clip}.gif`, `${clip}.png`] : [`${clip}.webm`]);

export const isOutputName = (name: string) => (Object.keys(CLIPS) as Clip[]).some(clip => outputNames(clip).includes(name));

// Argumente für ffmpeg: Frames frames/0000.png, 0001.png, ... mit fps nach target
export function ffmpegArgs(format: "gif" | "webm", fps: number, frames: string, target: string): string[] {
  const input = ["-y", "-framerate", String(fps), "-i", `${frames}/%04d.png`];
  if (format === "gif") {
    // Eigene Palette aus allen Frames, nur geänderte Bildbereiche speichern, Endlosschleife
    return [...input, "-filter_complex", "[0:v]split[a][b];[a]palettegen=max_colors=64:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle", "-loop", "0", target];
  }
  // VP9 mit Alpha-Kanal, damit OBS den Stinger durchsichtig abspielt
  return [...input, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "20", "-auto-alt-ref", "0", "-row-mt", "1", target];
}

type Job = { clip: Clip; frames: number; startedAt: number };
export type RenderError = "render-busy" | "render-not-started" | "render-limit" | "too-large";

// Laufende Renders je Login; now ist injiziert, damit der Timeout testbar bleibt
export function createRenderJobs(now: () => number) {
  const jobs = new Map<string, Job>();
  const running = (login: string) => {
    const job = jobs.get(login);
    return job && now() - job.startedAt <= RENDER_LIMITS.timeoutMs ? job : null;
  };
  return {
    start(login: string, clip: Clip): RenderError | null {
      if (running(login)) return "render-busy";
      jobs.set(login, { clip, frames: 0, startedAt: now() });
      return null;
    },
    frame(login: string, index: number, bytes: number): RenderError | null {
      const job = running(login);
      if (!job) return "render-not-started";
      if (!Number.isInteger(index) || index < 0 || index >= RENDER_LIMITS.frames) return "render-limit";
      if (bytes > RENDER_LIMITS.frameBytes) return "too-large";
      job.frames = Math.max(job.frames, index + 1);
      return null;
    },
    finish(login: string, fps: number): { clip: Clip; frames: number; fps: number } | RenderError {
      const job = running(login);
      if (!job) return "render-not-started";
      if (!Number.isInteger(fps) || fps < 1 || fps > 60) return "render-limit";
      jobs.delete(login);
      return { clip: job.clip, frames: job.frames, fps };
    },
    cancel: (login: string) => { jobs.delete(login); },
  };
}
