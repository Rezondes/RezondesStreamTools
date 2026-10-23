// Check of offlineHtml.ts: the page data and the code sit safely in the file, only the media files the values use are
// collected, the fonts come inside with only the subsets and families the scene uses, the file name
import assert from "node:assert/strict";
import { fontUrls, inlineFonts, neededFontFaces, offlineFileName, offlineHtml, usedMedia } from "./offlineHtml.ts";
import type { SettingField } from "../core/theme.ts";

const page = { scene: "brb" as const, settings: { theme: "standard", values: { brbNote: "</script><b>gleich</b>" } }, media: {} };
const html = offlineHtml({ page, script: 'console.log("</script>")', style: "b{color:red}</style>", fonts: "@font-face{font-family:A}</style>", title: 'BRB "neo"' });
assert.ok(html.startsWith("<!doctype html>"));
assert.equal(html.match(/<\/script>/g)?.length, 2, "only the two script tags close");
assert.equal(html.match(/<\/style>/g)?.length, 2, "only the two style tags close");
assert.ok(html.includes("\\u003c/script>\\u003cb>gleich"), "values are escaped");
assert.ok(html.includes("<style>@font-face{font-family:A}<\\/style></style>"), "the fonts sit in their own style tag");
assert.ok(html.includes("<title>BRB &quot;neo&quot;</title>"));
assert.ok(!html.includes("<link"), "nothing loads from the internet");
assert.equal(offlineHtml({ page, script: "", style: "", fonts: null, title: "x" }).match(/<style>/g)?.length, 1, "no fonts, no font style");

// A Google Fonts stylesheet: only the latin subsets of the families the text names, their files inlined
const sheet = [
  "/* cyrillic */\n@font-face {\n  font-family: 'Inter';\n  src: url(https://g.example/inter-cy.woff2) format('woff2');\n}",
  "/* latin-ext */\n@font-face {\n  font-family: 'Inter';\n  src: url(https://g.example/inter-ext.woff2) format('woff2');\n}",
  "/* latin */\n@font-face {\n  font-family: 'Inter';\n  src: url(https://g.example/inter.woff2) format('woff2');\n}",
  "/* latin */\n@font-face {\n  font-family: 'VT323';\n  src: url(https://g.example/vt.woff2) format('woff2');\n}",
].join("\n");
const faces = neededFontFaces(sheet, '.x{font-family:"Inter",sans-serif}');
assert.equal(faces.length, 2, "cyrillic and unused families stay out");
assert.deepEqual(fontUrls([...faces, ...faces]), ["https://g.example/inter-ext.woff2", "https://g.example/inter.woff2"]);
const inlined = inlineFonts(faces, { "https://g.example/inter.woff2": "data:font/woff2;base64,AAA" });
assert.ok(inlined.includes("url(data:font/woff2;base64,AAA)"), "a loaded file is inside");
assert.ok(inlined.includes("url(https://g.example/inter-ext.woff2)"), "a missing file keeps its URL");

const fields = [
  { key: "logo", type: "media", default: "", accept: "image", label: "", group: "" },
  { key: "back", type: "media", default: "", accept: "video", label: "", group: "" },
  { key: "chime", type: "sound", default: { file: "", volume: 1 }, label: "", group: "" },
  { key: "title", type: "text", default: "", label: "", group: "" },
] as unknown as SettingField[];
assert.deepEqual(usedMedia(fields, { logo: "logo.png", back: "https://cdn.example/a.mp4", chime: { file: "ding.mp3", volume: 1 }, title: "logo.png" }), ["logo.png", "ding.mp3"]);
assert.deepEqual(usedMedia(fields, { logo: "", back: "", chime: { file: "", volume: 1 } }), []);

assert.equal(offlineFileName("neo", "brb", "html"), "rst-neo-brb.html");
console.log("offlineHtml ok");
