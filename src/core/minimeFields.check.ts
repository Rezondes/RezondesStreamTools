// Check for minimeFields.ts: defaults and validation of the minime settings, which schema has minimes.
// Runs with npm test (alone: node src/core/minimeFields.check.ts).
import assert from "node:assert/strict";
import {
  COMBAT_SOUNDS, hasMinimes, MEDIC, MINIME_BASE_FIELDS, MINIME_COMBAT, MINIME_FIELDS, MINIME_HOP, MINIME_HOP_FIELDS, MINIME_TEAMS, minimeAimKey, minimeCombatFields,
  minimeFireKey, MINIME_STACK, minimeStackFields, minimeTeamFields, minimeVariantFields, readMinimeOptions, STACK_LEVEL_KEYS, STACK_NONE, STACK_SOUND,
} from "./minimeFields.ts";
import type { MinimeVariantSet } from "./theme.ts";
import { validateSettings } from "./settings.ts";

// Defaults: without saved values exactly these rules and this movement apply
assert.deepEqual(readMinimeOptions({}), {
  rules: {
    commands: { join: "!join", look: "!color", leave: "!leave" },
    joinRoles: ["everyone"],
    kickRoles: ["moderator", "broadcaster"],
    colorJoins: true,
    max: 30,
    whenFull: "replace",
    idleMinutes: 20,
    colorCooldownS: 10,
    minBrightness: 80,
    useTwitchColor: true,
    chatKeepsAlive: true,
    reactToChat: true,
    clearOffline: true,
    removeOnBan: true,
    variants: null,
  },
  motion: {
    speedPxPerS: 60, marginPx: 60, walkMinPx: 100, walkMaxPx: 600, walkWeight: 40, idleWeight: 40,
    idleMinMs: 2000, idleMaxMs: 6000, enterMs: 1200, exitMs: 900, placement: "random",
  },
});
assert.equal(readMinimeOptions({ minimePlacement: "slots" }).motion.placement, "slots");
// The defaults pass their own schema
const probe = { id: "probe", name: "Probe", fields: MINIME_FIELDS };
const defaults = Object.fromEntries(MINIME_FIELDS.map(field => [field.key, field.default]));
assert.deepEqual(validateSettings(probe, defaults).errors, []);

// Invalid values give the defaults; swapped limits are swapped back
{
  const options = readMinimeOptions({ minimeJoinCommand: "join", minimeColorCommand: "!change color", minimeLeaveCommand: "!café", minimeMax: 999, minimeWalkMin: 700, minimeWalkMax: 100, minimeIdleMinMs: 9000, minimeIdleMaxMs: 3000 });
  assert.deepEqual(options.rules.commands, { join: "!join", look: "!color", leave: "!café" });
  assert.equal(options.rules.max, 30);
  assert.deepEqual([options.motion.walkMinPx, options.motion.walkMaxPx], [100, 700]);
  assert.deepEqual([options.motion.idleMinMs, options.motion.idleMaxMs], [3000, 9000]);
  assert.deepEqual(readMinimeOptions(null), readMinimeOptions({}));
}

// Roles: the chosen minimum role and all above it
assert.deepEqual(readMinimeOptions({ minimeJoinRole: "vip" }).rules.joinRoles, ["vip", "moderator", "broadcaster"]);
assert.deepEqual(readMinimeOptions({ minimeKickRole: "broadcaster" }).rules.kickRoles, ["broadcaster"]);
assert.equal(readMinimeOptions({ minimeWhenFull: "reject" }).rules.whenFull, "reject");

// Only a schema that includes the fields has minimes (the base fields are enough, colors are optional)
assert.equal(hasMinimes(probe), true);
assert.equal(hasMinimes({ id: "basis", name: "Basis", fields: MINIME_BASE_FIELDS }), true);
assert.equal(hasMinimes({ id: "none", name: "None", fields: [] }), false);

// Color themes keep exactly their keys (saved values of the matrix stay valid)
assert.deepEqual(MINIME_FIELDS.map(field => field.key).sort(), [
  "minimeChatKeepsAlive", "minimeClearOffline", "minimeColorCommand", "minimeColorCooldown", "minimeColorJoins", "minimeEnterMs",
  "minimeExitMs", "minimeIdleMaxMs", "minimeIdleMinMs", "minimeIdleMinutes", "minimeIdleWeight", "minimeJoinCommand", "minimeJoinRole",
  "minimeKickRole", "minimeLeaveCommand", "minimeMargin", "minimeMax", "minimeMinBrightness", "minimePlacement", "minimeReactToChat", "minimeRemoveOnBan",
  "minimeSpeed", "minimeUseTwitchColor", "minimeWalkMax", "minimeWalkMin", "minimeWalkWeight", "minimeWhenFull",
]);

// Variant fields: command with the theme's default word, per variant the names in chat (empty = off) in the group "Minimes: Typen"
{
  const set: MinimeVariantSet = { command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango", "mangos"] }, { id: "kiwi", label: "Kiwi", names: ["kiwi", "mango"] }] };
  const fields = minimeVariantFields(set);
  assert.deepEqual(fields.map(field => [field.key, field.default, field.group]), [
    ["minimeVariantCommand", "!frucht", "Minimes: Typen"],
    ["minimeNames_mango", "mango, mangos", "Minimes: Typen"],
    ["minimeNames_kiwi", "kiwi, mango", "Minimes: Typen"],
  ]);
  assert.deepEqual(validateSettings({ id: "probe", name: "Probe", fields }, Object.fromEntries(fields.map(field => [field.key, field.default]))).errors, []);
  // Names normalized and duplicates only at the first variant; an empty list switches the variant off
  const rules = readMinimeOptions({ minimeNames_mango: "Mango,  MANGOS, ", minimeVariantCommand: "!obst" }, set).rules;
  assert.equal(rules.commands.look, "!obst");
  assert.deepEqual(rules.variants, [{ id: "mango", names: ["mango", "mangos"] }, { id: "kiwi", names: ["kiwi"] }]);
  assert.deepEqual(readMinimeOptions({ minimeNames_mango: "" }, set).rules.variants, [{ id: "kiwi", names: ["kiwi", "mango"] }]);
  assert.equal(readMinimeOptions({ minimeVariantCommand: "obst" }, set).rules.commands.look, "!frucht");
}

// Factions: fields per faction (names, shown name, color), only together with variants; a variant name wins
{
  const roles: MinimeVariantSet = { command: "!rolle", label: "Rolle", variants: [{ id: "medic", label: "Medic", names: ["medic", "rot"] }] };
  const teams: MinimeVariantSet = { command: "!team", label: "Fraktion", variants: [{ id: "blau", label: "BLUFOR", names: ["blau"], color: "#3366ff" }, { id: "rot", label: "Rot", names: ["rot", "red"] }] };
  const fields = minimeTeamFields(teams);
  assert.deepEqual(fields.map(field => field.key), [
    "minimeTeamCommand", "infoTeamText", "infoTeams",
    "minimeTeamNames_blau", "minimeTeamLabel_blau", "minimeTeamColor_blau", "minimeTeamNames_rot", "minimeTeamLabel_rot", "minimeTeamColor_rot",
  ]);
  assert.deepEqual([fields[4].default, fields[5].default, fields[8].default, fields[3].group], ["BLUFOR", "#3366ff", "#ffffff", MINIME_TEAMS]);
  const rules = readMinimeOptions({ minimeTeamCommand: "!seite" }, roles, teams).rules;
  assert.equal(rules.commands.team, "!seite");
  assert.deepEqual(rules.teams, [{ id: "blau", names: ["blau"] }, { id: "rot", names: ["red"] }]);
  assert.deepEqual(readMinimeOptions({ minimeTeamNames_blau: "" }, roles, teams).rules.teams, [{ id: "rot", names: ["red"] }]);
  const colorsOnly = readMinimeOptions({}, undefined, teams).rules;
  assert.deepEqual([colorsOnly.teams, colorsOnly.commands.team], [undefined, undefined]);
}

// Fights: opt-in fields per theme, aim and fire durations per role except the medic; hopping as opt-in fields
{
  const roles: MinimeVariantSet = { command: "!rolle", label: "Rolle", variants: [{ id: MEDIC, label: "Medic", names: [] }, { id: "mg", label: "MG", names: [] }] };
  const keys = minimeCombatFields(roles).map(field => field.key);
  assert.ok(keys.includes(minimeAimKey("mg")) && keys.includes(minimeFireKey("mg")));
  assert.ok(!keys.includes(minimeAimKey(MEDIC)) && !keys.includes(minimeFireKey(MEDIC)));
  assert.ok(keys.includes("minimeCombatMax") && keys.includes(COMBAT_SOUNDS.revive));
  assert.ok(!MINIME_FIELDS.some(field => field.group === MINIME_COMBAT || field.group === MINIME_HOP));
  assert.deepEqual(MINIME_HOP_FIELDS.map(field => field.key), ["hopHeight", "hopMs", "hopSquash"]);
}

// Towers: opt-in fields, off by default, levels offer only the variants (level 3 also "keiner"), the theme sets defaults
{
  const bears: MinimeVariantSet = { command: "!baer", label: "Bär", variants: ["eis", "panda", "grizzly"].map(id => ({ id, label: id, names: [] })) };
  const fields = minimeStackFields(bears);
  const field = (key: string) => fields.find(candidate => candidate.key === key);
  assert.equal(field("minimeStack")?.default, false);
  assert.ok(fields.every(candidate => candidate.group === MINIME_STACK));
  const [level1, level2, level3] = STACK_LEVEL_KEYS.map(field);
  assert.ok(level1?.type === "select" && level3?.type === "select");
  assert.deepEqual(level1.options, ["eis", "panda", "grizzly"]);
  assert.deepEqual(level3.options, ["eis", "panda", "grizzly", STACK_NONE]);
  assert.deepEqual([level1.default, level2?.default, level3.default], ["eis", "panda", STACK_NONE]);
  assert.ok(fields.some(candidate => candidate.key === STACK_SOUND && candidate.type === "sound"));
  const own = minimeStackFields(bears, { minimeStack: true, minimeStackLevel3: "grizzly" });
  assert.deepEqual([own[0]?.default, own.find(candidate => candidate.key === "minimeStackLevel3")?.default], [true, "grizzly"]);
  assert.ok(!MINIME_FIELDS.some(candidate => candidate.group === MINIME_STACK));
  // A level type the theme does not have is rejected
  const schema = { id: "t", name: "T", fields: [...MINIME_BASE_FIELDS, ...fields] };
  assert.ok(validateSettings(schema, { minimeStackLevel1: "koala" }).errors.length > 0);
  assert.ok(validateSettings(schema, { minimeStackMax: 99 }).errors.length > 0);
}

// Simple view: the commands, the limit and the switches of the features
const basicKeys = (fields: readonly { key: string; basic?: boolean }[]) => fields.filter(field => field.basic).map(field => field.key);
const probeSet: MinimeVariantSet = { command: "!typ", label: "Typ", variants: [{ id: "a", label: "A", names: [] }] };
assert.deepEqual(basicKeys(MINIME_FIELDS), ["minimeJoinCommand", "minimeLeaveCommand", "minimeMax", "minimeColorCommand"]);
assert.deepEqual(basicKeys(minimeVariantFields(probeSet)), ["minimeVariantCommand"]);
assert.deepEqual(basicKeys(minimeTeamFields(probeSet)), ["minimeTeamCommand"]);
assert.deepEqual(basicKeys(minimeCombatFields(probeSet)), ["minimeCombat"]);
assert.deepEqual(basicKeys(minimeStackFields(probeSet)), ["minimeStack"]);
assert.deepEqual(basicKeys(MINIME_HOP_FIELDS), []);

console.log("minimeFields ok");
