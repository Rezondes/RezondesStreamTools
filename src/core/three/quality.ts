// Performance levels of the 3D stage (plans/PLAN-GRAFIK.md, package 3): what a level means for the renderer and how many
// particles a theme should show. Themes offer the level as a choice setting so weaker PCs can throttle.
export const QUALITIES = ["hoch", "mittel", "niedrig"] as const;
type Quality = (typeof QUALITIES)[number];

type QualitySettings = { pixelRatio: number; bloom: boolean; antialias: boolean; shadows: boolean; particles: number };

const LEVELS: Record<Quality, QualitySettings> = {
  hoch: { pixelRatio: 1, bloom: true, antialias: true, shadows: true, particles: 1 },
  mittel: { pixelRatio: 1, bloom: true, antialias: false, shadows: true, particles: 0.7 },
  niedrig: { pixelRatio: 0.75, bloom: false, antialias: false, shadows: false, particles: 0.4 },
};

// Unknown values (old settings) fall back to the middle level
export const quality = (level: string): QualitySettings => LEVELS[level as Quality] ?? LEVELS.mittel;

// fixed: protection against a white image; a stronger bloom on bright surfaces floods the whole stage
export const MAX_BLOOM = 2;

export const clampBloom = (strength: number) => Math.min(MAX_BLOOM, Math.max(0, strength));

// Number of particles for a level, at least one so loops stay valid
export const particleCount = (wanted: number, level: string) => Math.max(1, Math.round(wanted * quality(level).particles));
