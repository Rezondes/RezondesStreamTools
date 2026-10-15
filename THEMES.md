# Eigene Themes

Ein Theme bestimmt, wie die Overlays aussehen. Es besteht aus einem Einstellungs-Schema (was der Streamer im Dashboard
einstellen kann) und React-Szenen (wie es aussieht). Das eingebaute Theme `matrix` ist das Standard-Theme; jede Szene,
die ein Theme nicht selbst mitbringt, kommt von dort. Das Theme `starter` in `src/themes/starter/` ist die kleinste
Vorlage: nur Alerts und Chat, alles andere erbt es.

Themes sind Code im Repo, kein Upload. Ein neues Theme ist ein eigener Ordner und zwei Einträge in Listen.

## Aufbau

```
src/themes/<id>/
  settings.ts        Schema: jedes Feld, das der Streamer einstellen kann, mit Standardwert
  settings.check.ts  Check: gültige Standardwerte, kein unbenutzter Schlüssel
  values.ts          useXyz(): die Werte aus dem Kontext mit ihrem Typ
  index.tsx          Szenen des Themes (React.lazy) und Import von theme.css
  theme.css          Aussehen, alles unter .theme-<id>
  scenes/*.tsx       die Szenen (starting, brb, ending, alerts, chat, cam, music, fx), beliebig viele davon
```

## Schritt für Schritt

1. **Ordner anlegen**: `src/themes/starter/` nach `src/themes/<id>/` kopieren. Die id besteht aus Kleinbuchstaben
   und landet in `settings.json` der Streamer; sie bleibt danach gleich.
2. **Schema** in `settings.ts`: mit den Bausteinen aus `src/core/fields.ts` (`color`, `text`, `textarea`, `lines`,
   `flag`, `number`, `choice`, `font`, `sound`) jedes Feld beschreiben: Schlüssel, Label, Gruppe, Standardwert, bei
   Zahlen Grenzen und Einheit (`px`, `ms`, `s`, `%`). Die Gruppe wird ein Abschnitt im Formular.
   `ValuesOf<typeof FIELDS>` ergibt den Typ der Werte. `id` und `name` im exportierten `ThemeSchema` setzen.
3. **Werte lesen**: in `values.ts` `useThemeValues()` aus `src/core/hooks/useSettings.ts` auf den eigenen Typ casten.
   main.tsx löst die Werte vorher gegen das Schema auf, darum ist jeder Schlüssel da und gültig.
4. **Szenen** in `scenes/`: nur die Kern-Hooks aus `src/core/hooks/` nutzen (`useAlerts`, `useChat`, `useMusic`,
   `useFx`, `useTerminal`, `useDecode`, `useNow`), keine eigenen Netzwerkzugriffe. Texte mit Platzhaltern füllt
   `fillTemplate` aus `src/core/template.ts`, Töne spielt `playSound` aus `src/core/sound.ts`.
5. **CSS** in `theme.css`, jede Regel unter `.theme-<id>`, Keyframes mit Präfix `<id>-`. Farben, Zahlen, Schalter (1/0)
   und Schriften aus dem Schema kommen automatisch als CSS-Variablen an (`var(--accent)`, `var(--alertWidth)`).
   Feste Masse nur als Standardwert einer Variable: `padding: var(--card-padding, 16px 20px)`.
6. **Registrieren**:
   - `src/themes/registry.ts`: das Schema in `THEMES` eintragen (der erste Eintrag ist das Standard-Theme, bleibt `matrix`).
   - `src/themes/scenes.tsx`: die Szenen aus `index.tsx` in `THEME_SCENES` unter der id eintragen.
7. **Prüfen**: `npm run verify`. Danach im Dashboard unter `[ THEME ]` das Theme wählen und in der Vorschau alle
   Szenen ansehen.

## Regeln, die automatisch geprüft werden

`scripts/rules.check.ts` prüft jeden Theme-Ordner (ausser `settings.ts`):

- keine Farbliterale (`#39ff14`, `rgb(...)`, `hsl(...)`), Farben kommen aus dem Schema;
- kein sichtbarer Text im JSX, Texte kommen aus dem Schema;
- in CSS keine `px`/`ms`/`s`-Werte ausserhalb von `var(--name, Standard)`;
- in Szenen keine Zahlen über 1 (ausser Indizes).

Eine bewusste Ausnahme bekommt einen Kommentar `fixed: <Grund>` auf derselben Zeile oder direkt darüber.

`settings.check.ts` ruft `auditTheme` aus `src/themes/schemaAudit.ts` auf: die Standardwerte bestehen das eigene
Schema, und jeder Schlüssel wird im Theme-Code benutzt (`values.key`, `{ key }`, `"key"` oder `var(--key)`).
`src/themes/registry.check.ts` prüft alle registrierten Themes: eindeutige ids, jedes Feld mit Label und Gruppe.

## Vererbung

Fehlt einem Theme eine Szene, zeigt `/s/<login>/<szene>.html` die Szene des Standard-Themes `matrix` mit dessen
Einstellungen. Gleich benannte Schlüssel (z.B. `accent`) übernimmt sie vom gewählten Theme, alle anderen haben die
Standardwerte von `matrix`.

## Checkliste

- [ ] id eindeutig, Name lesbar, Gruppen sinnvoll benannt
- [ ] jeder sichtbare und hörbare Wert ist eine Einstellung mit Standardwert
- [ ] Szenen nutzen nur Kern-Hooks, kein `fetch`, `EventSource` oder `WebSocket`
- [ ] CSS komplett unter `.theme-<id>`, Keyframes mit Präfix
- [ ] in `registry.ts` und `scenes.tsx` eingetragen
- [ ] `npm run verify` grün, im Dashboard ausprobiert
