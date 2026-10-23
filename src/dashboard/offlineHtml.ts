// A scene as a single HTML file for OBS (browser source "local file"): the offline build of the page (vite build
// --mode offline: one script, one stylesheet in dist/offline/) with the scene, its settings and its media files
// inside (window.RST_OFFLINE, src/core/offline.ts). It needs no server and gets no live data; the fonts come from
// Google Fonts like on the server. Pure; check: offlineHtml.check.ts.
import type { OfflinePage } from "../core/offline.ts";
import type { SettingField, SettingValues } from "../core/theme.ts";

export type OfflineParts = { page: OfflinePage; script: string; style: string; fonts: string | null; title: string };

// Text inside <script> or <style> must not close the tag early
const inScript = (text: string) => text.replaceAll("</script", "<\\/script");
const inStyle = (text: string) => text.replaceAll("</style", "<\\/style");
const attribute = (text: string) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

export function offlineHtml({ page, script, style, fonts, title }: OfflineParts): string {
  // JSON with "<" escaped, so no value can end the script
  const data = JSON.stringify(page).replaceAll("<", "\\u003c");
  return [
    "<!doctype html>",
    '<html lang="de">',
    "<head>",
    '<meta charset="utf-8">',
    `<title>${attribute(title)}</title>`,
    fonts ? `<link href="${attribute(fonts)}" rel="stylesheet">` : "",
    `<style>${inStyle(style)}</style>`,
    `<script>window.RST_OFFLINE = ${data};</script>`,
    "</head>",
    "<body>",
    '<div id="root"></div>',
    `<script type="module">${inScript(script)}</script>`,
    "</body>",
    "</html>",
  ].filter(Boolean).join("\n");
}

// The media files the values use: media fields (a file name) and sounds (an own file); full URLs stay outside
export function usedMedia(fields: readonly SettingField[], values: SettingValues): string[] {
  const names = fields.flatMap(field => {
    const value = values[field.key];
    if (field.type === "media" && typeof value === "string") return [value];
    if (field.type === "sound" && value && typeof value === "object" && "file" in value && typeof value.file === "string") return [value.file];
    return [];
  });
  return [...new Set(names.filter(name => name !== "" && !/^https?:\/\//.test(name)))];
}

// File name of the download, e.g. rst-neo-brb.html
export const offlineFileName = (login: string, scene: string, extension: string) => `rst-${login}-${scene}.${extension}`;
