// Check for template.ts: placeholders in texts from the settings. Runs with npm test.
import assert from "node:assert/strict";
import { channelNames, fillTemplate, textBar } from "./template.ts";

// Known placeholders are replaced, also several times and numbers
assert.equal(fillTemplate("{user} cheert {amount} Bits, danke {user}!", { user: "NEO", amount: 100 }), "NEO cheert 100 Bits, danke NEO!");
// Unknown ones stay
assert.equal(fillTemplate("hello {who}", { user: "NEO" }), "hello {who}");
// Inserted values are not replaced again (chat message with "{user}")
assert.equal(fillTemplate("{message}", { message: "{user}", user: "NEO" }), "{user}");

// Text bar: fraction rounded to whole characters, clamped outside 0..1
assert.equal(textBar(0.5, 4, "#", "."), "##..");
assert.equal(textBar(0.3, 10, "█", "░"), "███░░░░░░░");
assert.equal(textBar(-1, 3, "#", "."), "...");
assert.equal(textBar(2, 3, "#", "."), "###");

// Placeholders for channel and login: without a streamer the channel name in lower case
assert.deepEqual(channelNames("REZONDES", "rezondes"), { channel: "REZONDES", login: "rezondes" });
assert.deepEqual(channelNames("Strand", null), { channel: "Strand", login: "strand" });

console.log("template ok");
