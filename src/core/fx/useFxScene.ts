// Hooks des Effekt-Kontexts (Chat-Trigger in der Szene fx), gleich für jedes Theme:
// useFxScene: die sichtbaren Effekte der Zone ?zone=<name> (Standard main) mit den Standardwerten aus den Einstellungen.
// useFxItem: Phase (Medium angehalten, läuft, steht), Text mit {user} und {message} und Lage eines Effekts als Style.
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
