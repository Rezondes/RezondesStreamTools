// Idle life of the chef as a pure function of the time (DESIGN-KEBAB.md "Figuren"): the knife arm saws around the
// shoulder and pushes along the blade, the hat bobs, the moustache twitches now and then, the eyes blink. Angles in
// degrees, shifts in grid units. Check: life.check.ts.

export type PoseOptions = { sawOn: boolean; sawSpeed: number; sawAngle: number; hatOn: boolean; stacheOn: boolean; blinkEvery: number };
export type ChefPose = { armAngle: number; armShift: { x: number; y: number }; hatAngle: number; stacheAngle: number; blink: boolean };

// fixed: how far the arm pushes along the blade per unit of the saw wave, like the prototype
const PUSH = { x: 5, y: -2 };
// fixed: hat bob (rate and angle), moustache twitch (rate, angle, and how often: only while a slow wave is above its
// threshold), length of a blink in s, like the prototype
const HAT = { rate: 2.6, angle: 1.6 };
const STACHE = { rate: 9, angle: 3, slow: 0.9, above: 0.7 };
const BLINK_S = 0.12;

export function chefPose(time: number, options: PoseOptions): ChefPose {
  const saw = options.sawOn ? Math.sin(time * options.sawSpeed) : 0;
  const twitching = options.stacheOn && Math.sin(time * STACHE.slow) > STACHE.above;
  return {
    armAngle: saw * options.sawAngle,
    armShift: { x: saw * PUSH.x, y: saw * PUSH.y },
    hatAngle: options.hatOn ? Math.sin(time * HAT.rate) * HAT.angle : 0,
    stacheAngle: twitching ? Math.sin(time * STACHE.rate) * STACHE.angle : 0,
    blink: options.blinkEvery > 0 && time % options.blinkEvery < BLINK_S,
  };
}
