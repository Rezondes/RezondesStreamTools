# Eigene Themes

Ein Theme bestimmt, wie die Overlays aussehen. Es besteht aus einem Einstellungs-Schema (was der Streamer im Dashboard
einstellen kann) und React-Szenen (wie es aussieht). Das eingebaute Theme `standard` in `src/themes/standard/` ist das
Standard-Theme (neue Streamer starten damit) und die Vorlage: ein eigenständiges Theme mit allen Szenen, Stinger und
Bannern. Jede Szene, die ein Theme nicht selbst mitbringt, kommt vom Standard-Theme.

Themes sind Code im Repo, kein Upload. Ein neues Theme ist ein eigener Ordner und zwei Einträge in Listen.

## Aufbau

```
src/themes/<id>/
  settings.ts        Schema: jedes Feld, das der Streamer einstellen kann, mit Standardwert
  settings.check.ts  Check: gültige Standardwerte, kein unbenutzter Schlüssel
  use<Id>.ts         use<Id>(): die Werte aus dem Kontext mit ihrem Typ (Hooks heissen use*.ts)
  index.tsx          Szenen des Themes (React.lazy) und Import von theme.css
  render.ts          Stinger und Banner als Clips (reine Funktionen der Zeit, stinger.ts, banners.ts)
  theme.css          Aussehen, alles unter .theme-<id>
  scenes/*.tsx       die Szenen (starting, brb, ending, alerts, chat, cam, music, fx), beliebig viele davon
```

## Schritt für Schritt

1. **Ordner anlegen**: `src/themes/standard/` nach `src/themes/<id>/` kopieren. Die id besteht aus Kleinbuchstaben
   und landet in `settings.json` der Streamer; sie bleibt danach gleich.
2. **Schema** in `settings.ts` (Stinger und Banner lesen ihre Werte aus den Gruppen `Stinger` und `Banner`): mit den Bausteinen aus `src/core/fields.ts` (`color`, `text`, `textarea`, `lines`,
   `flag`, `number`, `choice`, `font`, `sound`) jedes Feld beschreiben: Schlüssel, Label, Gruppe, Standardwert, bei
   Zahlen Grenzen und Einheit (`px`, `ms`, `s`, `%`). Die Gruppe wird ein Abschnitt im Formular.
   `ValuesOf<typeof FIELDS>` ergibt den Typ der Werte. `id` und `name` im exportierten `ThemeSchema` setzen.
3. **Werte lesen**: in `use<Id>.ts` (z.B. `useStandard.ts`) `useThemeValues()` aus `src/core/hooks/useSettings.ts` auf den eigenen Typ casten.
   main.tsx löst die Werte vorher gegen das Schema auf, darum ist jeder Schlüssel da und gültig.
4. **Szenen** in `scenes/`: Logik, die mehrere Themes brauchen, steht einmal im Kern und wird nur aufgerufen. Das
   Theme liefert Aussehen und eigene Funktionen, keine eigene Kopie der Regeln und keine Netzwerkzugriffe:

   | Szene | aus dem Kern |
   |---|---|
   | Musik | `core/music`: `useNowPlaying` (was der Player zeigt), `useTrackProgress` (Anteil, Uhrzeit), `useCover`, `<Marquee>` (Lauftext) |
   | Starting, BRB, Ending | `core/screens`: `useStage` (1920x1080 skalieren), `useScreen` (Countdown, Pausenzeit, `?ticker`, `?next`), `shortClock`, `rotating` |
   | Alerts | `useAlerts`; `core/alerts`: `describeAlert` (Texte je Art mit den eigenen Schlüsseln), `alertQuote`, `useAlertSounds` |
   | Chat | `useChat`; `core/chat`: `<MessageParts>` (Text und Emotes), `badgeLabel` |
   | Effekte | `core/fx`: `useFxScene`, `useFxItem` (Phase, Text, Lage), `<FxMedia>` |
   | Befehlsseite | `core/info`: `useInfoPage` |
   | Minimes | `useMinimes` (siehe unten) |

   Platzhalter `{channel}` und `{login}` liefert `channelNames`, Texte füllt `fillTemplate` (beides
   `src/core/template.ts`), eigene Töne spielt `playSound` aus `src/core/sound.ts`. Ein Theme importiert nur aus seinem
   Ordner und aus `src/core` (geprüft).
5. **CSS** in `theme.css`, jede Regel unter `.theme-<id>`, Keyframes mit Präfix `<id>-`. Farben, Zahlen, Schalter (1/0)
   und Schriften aus dem Schema kommen automatisch als CSS-Variablen an (`var(--accent)`, `var(--alertWidth)`).
   Feste Masse nur als Standardwert einer Variable: `padding: var(--card-padding, 16px 20px)`.
6. **Registrieren**: ein Theme erfüllt den Vertrag aus `src/core/theme.ts` an zwei Stellen (ohne Klassen, nur Typen):
   - `ThemeModule` (Daten, ohne React, auch für den Server): in `src/themes/registry.ts` in `THEME_MODULES` als
     `{ schema: <id>Settings, clips: <id>Clips }` eintragen. `clips` liefert Stinger, Profil- und Offline-Banner aus
     `render.ts` (siehe `src/themes/standard/render.ts`). Der erste Eintrag ist das Standard-Theme, bleibt `standard`.
   - `ThemeView` (Szenen): `index.tsx` exportiert `<id>View = { id: <id>Settings.id, scenes: { ... } }`, eingetragen
     in `src/themes/scenes.tsx` in `THEME_VIEWS`.
   `registry.check.ts` prüft, dass jeder Ordner unter `src/themes/` in beiden Listen steht.
7. **Prüfen**: `npm run verify`. Danach im Dashboard unter `[ THEME ]` das Theme wählen und in der Vorschau alle
   Szenen ansehen.

## Theme-eigene Funktionen (Beispiel Minimes)

Manche Funktionen hat nur ein Theme, das sie selbst mitbringt; ihre Szene wird **nicht** vom Standard-Theme geerbt
(`OWN_SCENES` in `src/core/themeRuntime.ts`). Ein Theme ohne die Funktion zeigt dort eine leere Seite, der Server
verarbeitet ihre Chatbefehle dann nicht. Die Logik liegt im Kern, das Theme liefert Aussehen und eigene Animationen.

Minimes (Chatter als Figuren, Szene `minimes`) in einem eigenen Theme:

1. **Felder einbinden**: `...MINIME_FIELDS` aus `src/core/minimeFields.ts` ins Schema. Das schaltet die Funktion für das
   Theme ein (`hasMinimes`) und bringt Befehle, Regeln und Bewegung als Einstellungen mit (Gruppen `MINIME_COMMANDS`,
   `MINIME_RULES`, `MINIME_MOTION`, in `groupScenes` der Szene `minimes` zuordnen). Diese Schlüssel liest der Kern,
   sie gelten im Schema-Check als benutzt.
2. **Szene** `scenes/Minimes.tsx` in `index.tsx` unter `minimes` eintragen. Sie ruft
   `useMinimes({ catalog, reaction, widthPx })` aus `src/core/hooks/useMinimes.ts` und zeigt jedes Minime:
   - `catalog`: eigene Animationen `{ name, durationMs, weight }`, Dauer und Häufigkeit aus eigenen Einstellungen
     (Häufigkeit 0 = nie). `reaction`: Animation, wenn der Chatter schreibt (oder `null`). Beide mit `useMemo`.
   - Jedes Minime hat `login`, `user`, `color` (`null` = eigene Standardfarbe), `action`, `durationMs`, `fromX`/`toX`
     (px) und `facing` (1 rechts, -1 links). Eingebaute Aktionen: `enter`, `exit`, `idle`, `walk`; alle anderen kommen
     aus dem Katalog.
   - Üblich: Klasse `action-<name>` und Dauer als CSS-Variable setzen, `toX` als Position mit einer `transition` der
     Länge `durationMs` nur bei `walk`, Farbe als `--minime` am Element (Laufzeitdaten, kein Literal).
3. **CSS** für jede Aktion, am besten in einer eigenen Datei, die nur die Szene importiert (wie `matrix/minimes.css`).

```ts
const catalog = useMemo(() => [{ name: "wave", durationMs: values.waveMs, weight: values.waveWeight }], [values]);
const actors = useMinimes({ catalog, reaction: null, widthPx: innerWidth });
```

**Typen statt Farben** (Beispiel `suedfrucht`: Früchte): Das Schema bekommt `minimeVariants` (`MinimeVariantSet` aus
`src/core/theme.ts`: Befehl, z.B. `!frucht`, Bezeichnung und je Typ `id`, Name und Standard-Namen im Chat) und bindet
statt `MINIME_FIELDS` die Felder `...MINIME_BASE_FIELDS` und `...minimeVariantFields(set)` ein (Gruppe `MINIME_VARIANTS`).
Der Server vergibt dann Typen statt Farben; jedes Minime trägt `variant` (die id) und `color: null`. Ohne Wahl gibt es
einen zufälligen erlaubten Typ, eine leere Namensliste schaltet einen Typ aus. In `?demo` kommen Minimes ohne Typ
(`variant: null`); die Szene wählt dann selbst einen, z.B. nach `hash(seedOf(login))` aus `src/core/hash.ts`.

## Befehlsseite (Szene info)

Die öffentliche Seite für Zuschauer unter `/s/<login>/` (Szene `info`, keine OBS-Quelle) listet die Chat-Befehle: den
Hilfe-Befehl, die Minimes-Befehle des gewählten Themes und die öffentlichen Trigger. So bekommt ein Theme sie:

1. **Felder einbinden**: `...INFO_FIELDS` aus `src/core/infoFields.ts` ins Schema und die Gruppe `INFO_GROUP` in
   `groupScenes` der Szene `info` zuordnen. Das sind alle sichtbaren Texte der Seite; der Kern liest sie, sie gelten im
   Schema-Check als benutzt. Eigene Felder für das Aussehen (z.B. Hintergrund) kommen in dieselbe Gruppe.
2. **Szene** `scenes/Info.tsx` in `index.tsx` unter `info` eintragen. Sie ruft `useCommands(minimeRules)` aus
   `src/core/hooks/useCommands.ts` (Regeln der Minimes aus den eigenen Werten für die Demo, `null` ohne Minimes) und
   `describeCommands(list, values)`; heraus kommen Abschnitte mit Überschrift und Einträgen (`command`, `text`,
   `details`), die das Theme in seinem Stil zeigt.
3. Die Seite scrollt als normale Seite und hat keine Live-Verbindung: das Wurzelelement malt den Hintergrund selbst
   (z.B. `.theme-<id>.theme-root:has(.<id>-info) { min-height: 100vh; background: ... }`).

## Regeln, die automatisch geprüft werden

`scripts/rules.check.ts` prüft jeden Theme-Ordner (ausser `settings.ts`):

- keine Farbliterale (`#39ff14`, `rgb(...)`, `hsl(...)`), Farben kommen aus dem Schema;
- kein sichtbarer Text im JSX, Texte kommen aus dem Schema;
- in CSS keine `px`/`ms`/`s`-Werte ausserhalb von `var(--name, Standard)`;
- in Szenen keine Zahlen über 1 (ausser Indizes);
- Importe nur aus dem eigenen Ordner und aus `src/core`, nie aus einem anderen Theme, dem Dashboard oder dem Server.

Eine bewusste Ausnahme bekommt einen Kommentar `fixed: <Grund>` auf derselben Zeile oder direkt darüber.

`settings.check.ts` ruft `auditTheme` aus `src/themes/schemaAudit.ts` auf: die Standardwerte bestehen das eigene
Schema, und jeder Schlüssel wird im Theme-Code benutzt (`values.key`, `{ key }`, `"key"` oder `var(--key)`).
`src/themes/registry.check.ts` prüft alle registrierten Themes: eindeutige ids, jedes Feld mit Label und Gruppe.

## Vererbung

Fehlt einem Theme eine Szene, zeigt `/s/<login>/<szene>.html` die Szene des Standard-Themes `standard` mit dessen
Einstellungen. Gleich benannte Schlüssel (z.B. `accent`) übernimmt sie vom gewählten Theme, alle anderen haben die
Standardwerte von `standard`. Ausnahme: Szenen theme-eigener Funktionen (z.B. `minimes`) werden nie geerbt.

## Checkliste

- [ ] id eindeutig, Name lesbar, Gruppen sinnvoll benannt
- [ ] jeder sichtbare und hörbare Wert ist eine Einstellung mit Standardwert
- [ ] Szenen nutzen nur Kern-Hooks und -Bausteine, keine eigene Kopie gemeinsamer Logik, kein `fetch`, `EventSource` oder `WebSocket`
- [ ] CSS komplett unter `.theme-<id>`, Keyframes mit Präfix
- [ ] in `registry.ts` und `scenes.tsx` eingetragen
- [ ] `npm run verify` grün, im Dashboard ausprobiert
