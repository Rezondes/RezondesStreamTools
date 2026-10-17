// Hooks of the effects context (chat triggers in the scene fx), the same for every theme:
// useFxScene: the visible effects of the zone ?zone=<name> (default main) with the defaults from the settings.
// useFxItem: phase (media paused, running, standing), text with {user} and {message} and position of an effect as style.
import { useMemo, type CSSProperties } from "react";
import { useFx, useFxPhase, type ShownFx } from "../hooks/useFx.ts";
import { fxDefaults, type FxSettings } from "./fx.ts";
import { fxLifetime } from "../overlayTiming.ts";
import { params } from "../params.ts";
import { fillTemplate } from "../template.ts";

const ZONE = params.get("zone") ?? "main";

export function useFxScene(values: FxSettings) {
  const defaults = useMemo(() => fxDefaults(values), [values]);
  return useFx(ZONE, values.fxMax, defaults, values.fxMargin);
}

export function useFxItem(item: ShownFx) {
  const action = item.action;
  return {
    phase: useFxPhase(action),
    text: fillTemplate(action.text ?? "", { user: item.user, message: item.message }),
    style: { left: `${item.x}%`, top: `${item.y}%`, width: action.size, "--life": `${fxLifetime(action)}ms` } as CSSProperties,
  };
}
