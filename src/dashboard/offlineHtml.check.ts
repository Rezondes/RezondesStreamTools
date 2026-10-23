// Check of offlineHtml.ts: the page data and the code sit safely in the file, only the media files the values use are
// collected, the file name
import assert from "node:assert/strict";
import { offlineFileName, offlineHtml, usedMedia } from "./offlineHtml.ts";
import type { SettingField } from "../core/theme.ts";

const page = { scene: "brb" as const, settings: { theme: "standard", values: { brbNote: "</script><b>gleich</b>" } }, media: {} };
const html = offlineHtml({ page, script: 'console.log("</script>")', style: "b{color:red}</style>", fonts: "https://fonts.example/css?a=1&b=2", title: 'BRB "neo"' });
assert.ok(html.startsWith("<!doctype html>"));
assert.equal(html.match(/<\/script>/g)?.length, 2, "only the two script tags close");
assert.equal(html.match(/<\/style>/g)?.length, 1, "only the style tag closes");
assert.ok(html.includes("\\u003c/script>\\u003cb>gleich"), "values are escaped");
assert.ok(html.includes('href="https://fonts.example/css?a=1&amp;b=2"'));
assert.ok(html.includes("<title>BRB &quot;neo&quot;</title>"));
assert.ok(!offlineHtml({ page, script: "", style: "", fonts: null, title: "x" }).includes("<link"), "no fonts, no link");

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
