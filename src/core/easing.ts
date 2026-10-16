// Zahlen für Animationen der Renderer (Stinger, Banner): auf 0..1 begrenzen und Verläufe für Bewegungen. Gleich für
// jedes Theme. Rein; Check: easing.check.ts.

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Langsam anfahren, dann schneller (quadratisch)
export const easeIn = (progress: number) => progress * progress;

// Weich beschleunigen und abbremsen (kubisch)
export const easeInOut = (progress: number) => (progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2);
