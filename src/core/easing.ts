// Numbers for animations of the renderers (stinger, banners): clamp to 0..1 and curves for movements. The same for
// every theme. Pure; check: easing.check.ts.

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Start slowly, then faster (quadratic)
export const easeIn = (progress: number) => progress * progress;

// Accelerate and decelerate smoothly (cubic)
export const easeInOut = (progress: number) => (progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2);
