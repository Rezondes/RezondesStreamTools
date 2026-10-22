// Name of an alert line for the standard alert card: the name rises big and in the gradient, the rest of the line stays
// below it. Lines without the name stay whole. Check: alertName.check.ts.
export function splitName(line: string, user: string): { name: string; rest: string } {
  if (!user || !line.includes(user)) return { name: "", rest: line };
  return { name: user, rest: line.replace(user, "").replace(/\s{2,}/g, " ").trim() };
}
