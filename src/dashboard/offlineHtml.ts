// A scene as a single HTML file for OBS (browser source "local file"): the offline build of the page (vite build
// --mode offline: one script, one stylesheet in dist/offline/) with the scene, its settings and its media files
// inside (window.RST_OFFLINE, src/core/offline.ts). It needs no server, no internet and gets no live data: the fonts
// it uses are inside as data URLs (neededFontFaces, inlineFonts). Pure; check: offlineHtml.check.ts.
import type { OfflinePage } from "../core/offline.ts";
import type { SettingField, SettingValues } from "../core/theme.ts";

type OfflineParts = { page: OfflinePage; script: string; style: string; fonts: string | null; title: string };

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
    fonts ? `<style>${inStyle(fonts)}</style>` : "",
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

// fixed: the subsets of a Google Fonts stylesheet a downloaded scene keeps (German text and names in latin letters)
const FONT_SUBSETS = new Set(["latin", "latin-ext"]);
const familyOf = (face: string) => /font-family:\s*['"]?([^;'"]+)/.exec(face)?.[1] ?? "";
const FONT_URL = /url\(([^)]+)\)/g;

// The @font-face rules of a Google Fonts stylesheet whose family the text names (the stylesheet of the page and the
// values), only the kept subsets; Google writes the subset as a comment before each rule
export function neededFontFaces(css: string, used: string): string[] {
  return [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)]
    .filter(([, subset, face]) => FONT_SUBSETS.has(subset) && used.includes(familyOf(face)))
    .map(([, , face]) => face);
}

// The font files of these rules, each once
export const fontUrls = (faces: readonly string[]) => [...new Set(faces.flatMap(face => [...face.matchAll(FONT_URL)].map(match => match[1])))];

// The rules with their files as data URLs (url -> data URL); a file without one keeps its URL
export const inlineFonts = (faces: readonly string[], files: Record<string, string>) =>
  faces.map(face => face.replace(FONT_URL, (all, url: string) => (files[url] ? `url(${files[url]})` : all))).join("\n");

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
