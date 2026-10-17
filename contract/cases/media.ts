// Contract cases: media upload with storage limit (the run sets MEDIA_LIMIT_MB=1), one upload at a time, list,
// public delivery and delete.
import { expect, expectCode, fail, request, STREAMER, type Case, type Context } from "../client.ts";

const session = STREAMER.login;
const upload = (context: Context, name: string, body: BodyInit) => request(context, `/api/media?name=${encodeURIComponent(name)}`, { method: "POST", session, body });

// An upload whose body stays open until finish() is called
function slowUpload(context: Context) {
  let finish = () => {};
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]));
      finish = () => controller.close();
    },
  });
  const response = request(context, "/api/media?name=slow.png", { method: "POST", session, body, duplex: "half" });
  return { response, finish: () => finish() };
}

// Status of further uploads while the slow one is open; until it reached the server they still pass
async function refusedWhileBusy(context: Context) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const second = await upload(context, "b.png", new Uint8Array(1));
    const text = await second.text();
    if (second.status === 409) return text;
    await new Promise(done => setTimeout(done, 50));
  }
  return null;
}

export const MEDIA_CASES: Case[] = [
  {
    name: "media: upload, list and public delivery",
    async run(context) {
      await expect(await upload(context, "a.png", new Uint8Array(10)), 200, { ok: "boolean", name: "string" });
      const list = { files: [{ name: "string", size: "number", usedBy: ["string"] }], usedBytes: "number", limitBytes: "number" };
      await expect(await request(context, "/api/media", { session }), 200, list);
      await expect(await request(context, `/s/${STREAMER.login}/media/a.png`), 200);
    },
  },
  {
    name: "media: invalid names and uploads over the limit are rejected",
    async run(context) {
      await expectCode(await upload(context, "../a.png", new Uint8Array(1)), 400, "invalid-name");
      await expectCode(await upload(context, "big.png", new Uint8Array(1_100_000)), 413, "quota-exceeded");
    },
  },
  {
    name: "media: a second upload while one runs is 409",
    async run(context) {
      const slow = slowUpload(context);
      const code = await refusedWhileBusy(context);
      slow.finish();
      await expect(await slow.response, 200, { ok: "boolean" });
      if (code !== "upload-busy") fail(`second upload was not refused with upload-busy: ${code}`);
    },
  },
  {
    name: "media: delete, deleting again is 404",
    async run(context) {
      await expect(await request(context, "/api/media?name=a.png", { method: "DELETE", session }), 200, { ok: "boolean" });
      await expectCode(await request(context, "/api/media?name=a.png", { method: "DELETE", session }), 404, "not-found");
    },
  },
];
