// A renderable clip of a theme (stinger, profile or offline banner) for the render section in the dashboard.
// draw is a pure function of time; group names the settings group of the schema that controls the clip.
export type ClipName = "stinger" | "profile" | "offline";

export type RenderClip = {
  name: ClipName;
  feature: "stinger" | "banners";
  width: number;
  height: number;
  fps: number;
  duration: number; // seconds
  cut: number | null; // transition point in seconds, only for the stinger
  group: string;
  font: string; // CSS font to preload, e.g. '24px "Inter"'
  draw: (context: CanvasRenderingContext2D, time: number) => void;
};
