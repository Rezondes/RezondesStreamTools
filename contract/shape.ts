// Shape comparison for the contract tests (RUST-PLAN.md package 4): a case checks status and the shape of an answer
// (keys and types), never random values. Extra keys are allowed, so a server may add fields without breaking a case.
// Plus the summary of a run, where cases on the pending list (contract/pending-rust.json) may still fail.
// Check: shape.check.ts.

// "string", "number", "boolean", "null", "object", "array", "any", unions like "string|null", nested objects and
// [shape] for an array whose items all have the first shape
export type Shape = string | readonly Shape[] | { readonly [key: string]: Shape };

const typeOf = (value: unknown) => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value);

// Mismatches as "path: expected ..., got ..."; empty = the value has the shape
export function shapeErrors(shape: Shape, value: unknown, path = "$"): string[] {
  if (typeof shape === "string") {
    const allowed = shape.split("|");
    return allowed.includes("any") || allowed.includes(typeOf(value)) ? [] : [`${path}: expected ${shape}, got ${typeOf(value)}`];
  }
  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) return [`${path}: expected array, got ${typeOf(value)}`];
    return value.flatMap((item, index) => shapeErrors((shape as readonly Shape[])[0] ?? "any", item, `${path}[${index}]`));
  }
  if (typeOf(value) !== "object") return [`${path}: expected object, got ${typeOf(value)}`];
  const record = value as Record<string, unknown>;
  return Object.entries(shape).flatMap(([key, inner]) =>
    key in record ? shapeErrors(inner, record[key], `${path}.${key}`) : [`${path}.${key}: missing`]);
}

export type CaseResult = { name: string; error: string | null };

// failed: not pending and failing; fixed: pending but passing now (remove it from the list); ok = nothing failed
export function summarize(results: readonly CaseResult[], pending: readonly string[]) {
  const isPending = (name: string) => pending.includes(name);
  const failed = results.filter(result => result.error !== null && !isPending(result.name));
  const fixed = results.filter(result => result.error === null && isPending(result.name)).map(result => result.name);
  const unknownPending = pending.filter(name => !results.some(result => result.name === name));
  return { failed, fixed, unknownPending, ok: failed.length === 0 && unknownPending.length === 0 };
}
