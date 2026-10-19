# Plan: Szenen ohne Vererbung

Heute bekommt ein Theme jede Szene, die es nicht selbst mitbringt, vom Standard-Theme (`resolveScene` in
`src/core/themeRuntime.ts`, Ausnahme `OWN_SCENES` = Minimes), und `clipsFor` gibt einem unbekannten Theme die Clips
des Standard-Themes. Neu: Ein Theme hat genau die Szenen und Clips, die es selbst mitbringt. Was fehlt, ist in OBS eine
leere, transparente Seite und im Dashboard als "In diesem Theme nicht verfügbar" markiert. So kann ein Theme Szenen
bewusst weglassen oder Schritt für Schritt bauen, ohne Platzhalter aus einem anderen Theme.

Kern-Plan nach der Regel in [PLAN.md](../PLAN.md): Die Logik liegt im Kern, Themes liefern nur ihre Szenen. Kein
Rust-Anteil: Der Server kennt die Szenen eines Themes nicht, er liefert Schema und Einstellungen.

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss: `npm run verify`. Regeln:
[CODING-RULES.md](../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../THEMES.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Szenen und Clips ohne Vererbung | Jede Overlay-Seite zeigt nur Szenen des gewählten Themes, fehlende Szenen und Clips sind leer und im Dashboard als nicht verfügbar markiert. | - |

## Annahmen

- **Für alle Themes** (entschieden 2026-10-19). Heute bringen alle eingebauten Themes ihre Szenen selbst mit (Standard
  ohne Minimes, die schon heute nicht erben), Stinger und beide Banner ebenfalls; sichtbar ändert sich für sie nichts.
- **Leere Seite in OBS:** eine fehlende Szene rendert nichts (transparent), wie heute Minimes in einem Theme ohne
  Minimes. Kein Text im Overlay, damit im Stream nichts Fremdes auftaucht.
- **OBS-Import bleibt vollständig:** `obsSetup.ts` legt weiterhin alle Quellen an. Eine Quelle einer fehlenden Szene
  ist leer; nach einem Theme-Wechsel stimmt die Einrichtung sofort, ohne neuen Import.
- **Eine Quelle für "hat die Szene":** die Szenen-Liste der `ThemeView` (`src/themes/scenes.tsx`). Keine zweite Liste
  im Schema.
- **Clips:** `ThemeModule.clips` darf eine Teilmenge von `stinger`, `profile`, `offline` liefern (auch keinen).

---

## Package 1: Szenen und Clips ohne Vererbung

**Ziel:** Jede Overlay-Seite zeigt nur Szenen des gewählten Themes, fehlende Szenen und Clips sind leer und im
Dashboard als nicht verfügbar markiert.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `src/core/themeRuntime.ts`, `src/core/themeRuntime.check.ts` (ändern: `resolveScene` ohne Rückfall, `OWN_SCENES`
  entfällt, neu `sceneNames`)
- `src/main.tsx` (ändern: kein Rückfall-Schema mehr)
- `src/themes/renderers.ts`, `src/themes/renderers.check.ts` (ändern: unbekanntes Theme = keine Clips, Teilmengen erlaubt)
- `src/dashboard/Overview.tsx`, `src/dashboard/ThemeSettings.tsx`, `src/dashboard/ScenePreview.tsx`,
  `src/dashboard/Render.tsx` (ändern: Markierung "nicht verfügbar")
- `src/dashboard/texts.de.ts` (ändern: neuer Text)
- `THEMES.md`, `README.md` (ändern: Abschnitt "Vererbung" ersetzt)

### Kontext

`resolveScene(scenes, themeId, scene, fallbackTheme)` gibt die eigene Szene oder die des Standard-Themes zurück, ausser
für `OWN_SCENES`. `ThemedScene` in `src/main.tsx` wählt danach das Schema (eigenes oder Standard) für Werte und
CSS-Variablen. `clipsFor` in `src/themes/renderers.ts` fällt für unbekannte Themes auf das Standard-Theme zurück,
`renderers.check.ts` verlangt von jedem Theme genau `["stinger", "profile", "offline"]`. Das Dashboard listet alle
`OBS_SCENES` (Übersicht) bzw. `SCENES` (Vorschau-Auswahl in `ThemeSettings.tsx`) ohne Blick auf das Theme.

### Acceptance Criteria

- [ ] AC1: `resolveScene(scenes, themeId, scene)` liefert die Szene des Themes oder `null`; eine Szene eines anderen
  Themes kommt nie zurück, auch nicht für ein unbekanntes Theme.
- [ ] AC2: Eine Overlay-Seite einer Szene, die das gewählte Theme nicht hat, rendert kein Element unter `#root`
  (transparent) und wirft keinen Fehler.
- [ ] AC3: `sceneNames(scenes, themeId)` liefert die Szenen eines Themes in der Reihenfolge von `SCENES`; für ein
  unbekanntes Theme `[]`.
- [ ] AC4: `clipsFor` liefert für ein unbekanntes Theme `[]`; ein Theme darf eine Teilmenge der drei Clips liefern, in
  der Reihenfolge `stinger`, `profile`, `offline`, ohne doppelte Namen.
- [ ] AC5: Übersicht, Vorschau-Auswahl und Render-Seite zeigen fehlende Szenen bzw. Clips mit dem Text "In diesem Theme
  nicht verfügbar" statt URL, Vorschau oder Render-Knopf.
- [ ] AC6: Alle eingebauten Themes zeigen dieselben Szenen und Clips wie vorher (bestehende Checks grün, Standard ohne
  Minimes).
- [ ] AC7: THEMES.md beschreibt: ein Theme hat nur, was es mitbringt; Abschnitt "Vererbung" und der Satz zur Vorlage
  im Einleitungstext sind angepasst; README ebenso.

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, refactoren.

1. `src/core/themeRuntime.check.ts > "no fallback to another theme"` (AC1)
   - Gegeben: `scenes = { a: { chat: A }, b: { chat: B, alerts: C } }`
   - Erwartet: `resolveScene(scenes, "a", "alerts") === null`, `resolveScene(scenes, "x", "chat") === null`,
     `resolveScene(scenes, "a", "chat") === A`, unbekannte Szene `null`
2. `src/core/themeRuntime.check.ts > "scene names of a theme"` (AC3)
   - Gegeben: dieselben `scenes`
   - Erwartet: `sceneNames(scenes, "b")` = `["alerts", "chat"]` (Reihenfolge aus `SCENES`), `sceneNames(scenes, "x")` = `[]`
3. `src/themes/renderers.check.ts > "partial clips"` (AC4, AC6)
   - Gegeben: alle registrierten Themes, dazu `clipsFor("does-not-exist", ...)`
   - Erwartet: Namen jedes Themes sind eine geordnete Teilmenge ohne Doppelte; heutige Themes weiterhin alle drei;
     unbekanntes Theme `[]`
4. `src/dashboard/texts.de.check.ts` (vorhanden): der neue Text ist da und nicht leer.
5. Manuell (AC2, AC5): `?demo` einer Szene, die das Theme nicht hat (Minimes im Standard-Theme): Seite leer, Konsole
   ohne Fehler; Dashboard-Übersicht, Vorschau und Rendern im Standard-Theme zeigen bei Minimes den Hinweis.

Testbefehl: `npm test`, Abschluss `npm run verify`

### Umsetzungsschritte

1. Tests 1 und 2, dann `resolveScene` ohne `fallbackTheme`, `OWN_SCENES` entfernen, `sceneNames` ergänzen.
2. `src/main.tsx`: Schema ist immer das gewählte (`chosen`), kein `defaultSchema`-Rückfall für Szenen; der Standard
   bleibt nur für "keine Einstellungen" (kein Streamer).
3. Test 3, dann `clipsFor` ohne Rückfall.
4. Dashboard: `sceneNames(THEME_SCENES, theme)` in Übersicht und Vorschau, verfügbare Clip-Namen auf der Render-Seite;
   Text `notInTheme` in `texts.de.ts`.
5. THEMES.md (Einleitung; Schritt 1 "kopieren" bleibt als Vorlage; Abschnitt "Vererbung" wird "Fehlende Szenen";
   Abschnitt "Theme-eigene Funktionen" ohne `OWN_SCENES`), README.
6. `npm run verify`, manuelle Checks.

### Out of Scope

- Eine Liste der Szenen im Schema oder auf dem Server.
- Eine Theme-Auswahl, die Themes mit fehlenden Szenen anders anzeigt (kann später kommen).
