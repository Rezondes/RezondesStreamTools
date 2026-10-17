//! Context render: stinger and banners per streamer. The browser draws the frames with the streamer's settings and
//! sends them as PNG, the server builds a `WebM` or GIF with ffmpeg (template: `server/render.ts`). Here the pure parts:
//! clips, ffmpeg arguments, limits and at most one render per streamer.

pub mod clips;
pub mod ffmpeg;
pub mod jobs;
