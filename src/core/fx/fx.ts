// Context effects (chat triggers, scene fx): which settings the core reads for all themes and which defaults
// an action gets that does not give its own duration or size. Pure; check: fx.check.ts.
import type { FxAction } from "../types.ts";

// Keys in the schema of every theme with effects; count as used in the schema check
export const FX_KEYS = ["fxMax", "fxDuration", "fxSize", "fxMargin"] as const;
export type FxSettings = Record<(typeof FX_KEYS)[number], number>;

// Defaults for actions without their own duration or size
export const fxDefaults = (values: FxSettings): Partial<FxAction> => ({ duration: values.fxDuration, size: values.fxSize });
