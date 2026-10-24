// The toy of a Dogs alert after the dog drops it (DESIGN-DOGS.md "Alerts", prototype refs/px-alert.html): its height
// above the ground as a closed function of the time since the drop, three hops that lose energy and then rest.
// Check: toy.check.ts.

// fixed: gravity in pixels per s squared; each hop keeps 45 % and then 40 % of the speed, like the prototype
const GRAVITY = 220;
const KEEP = [0.45, 0.4];

// Height in pixels after the drop from dropBounce pixels (0 = on the ground)
export function toyHeight(since: number, dropBounce: number): number {
  if (since <= 0) return dropBounce;
  const fall = Math.sqrt((2 * dropBounce) / GRAVITY);
  if (since < fall) return dropBounce - 0.5 * GRAVITY * since * since;
  let time = since - fall;
  let speed = GRAVITY * fall;
  for (const keep of KEEP) {
    speed *= keep;
    const hop = (2 * speed) / GRAVITY;
    if (time < hop) return Math.max(0, speed * time - 0.5 * GRAVITY * time * time);
    time -= hop;
  }
  return 0;
}
