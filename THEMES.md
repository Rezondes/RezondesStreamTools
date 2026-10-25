# Eigene Themes

Ein Theme bestimmt, wie die Overlays aussehen. Es besteht aus einem Einstellungs-Schema (was der Streamer im Dashboard
einstellen kann) und React-Szenen (wie es aussieht). Das eingebaute Theme `standard` in `src/themes/standard/` ist das
Standard-Theme (neue Streamer starten damit) und die Vorlage: ein eigenständiges Theme mit allen Szenen, Stinger und
Bannern. Ein Theme hat genau die Szenen und Clips, die es selbst mitbringt; nichts kommt von einem anderen Theme
(siehe "Fehlende Szenen").

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

Für PixiJS und GSAP zeigt `standard` das Muster an Starting, BRB und Ending: `aurora.ts` und `digits.ts` rechnen Lage, Farbe und
Rollen als reine Funktionen von Startwert und Zeit (mit Check), `pixi/Aurora.tsx` und `pixi/Dust.tsx` zeichnen sie in
eine `PixiStage` und setzen jede Lage im Ticker aus `clock()` (damit `?t=` Standbilder stimmen), `screen/LightScreen.tsx`
bringt Texte, Countdown (`screen/Countdown.tsx`) und Balken mit `useTimeline` herein. Ein Theme mit PixiJS oder GSAP
steht in `MODULE_THEMES` (`scripts/bundle.ts`).

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
   | Starting, BRB, Ending | `core/screens`: `useStage` (1920x1080 skalieren), `useScreen` (Countdown als Dauer oder bis `countdownAt`, Pausenzeit, Ticker, nächster Stream), `shortClock`, `rotating` |
   | Alerts | `useAlerts(dauer)` (Dauer als Zahl oder je Alert: `alert => ms`, `alertDurationMs` klemmt auf 1 ms bis 30 Minuten); `core/alerts`: `describeAlert` (Texte je Art mit den eigenen Schlüsseln), `alertQuote`, `useAlertSounds`, `raidPack` (ein Lauf je Raider, höchstens `maxOnScreen` gleichzeitig, Dauer aus `endMs`) und `runnersAt` (nur die laufenden) |
   | Chat | `useChat`; `core/chat`: `<MessageParts>` (Text und Emotes), `badgeLabel` |
   | Effekte | `core/fx`: `useFxScene`, `useFxItem` (Phase, Text, Lage), `<FxMedia>` |
   | Befehlsseite | `core/info`: `useInfoPage` |
   | Minimes | `useMinimes` (siehe unten) |
   | Statistik | `useStreamStats` (Stand vom Server, `?demo`: Demo-Werte); `core/stats`: `parseStatLines` (Einstellung `schlüssel\|Text` je Zeile), `describeStats` (Zahlen und Dauer formatiert) |

   Platzhalter `{channel}` und `{login}` liefert `channelNames`, Texte füllt `fillTemplate` (beides
   `src/core/template.ts`), eigene Töne spielt `playSound` aus `src/core/sound.ts`. Eingebauter Ton als Datei: das
   Theme importiert seine OGG-Dateien (`src/themes/<id>/sounds/`), lädt sie beim Start der Szene mit `preloadClips(urls)`
   vor und gibt `playSound` als eingebauten Ton `volume => playClip(url, volume, { voices })`; `voices` ist die Grenze
   gleichzeitiger Stimmen aus den Einstellungen (älteste weicht, Kern-Grenze 32). Ein Theme importiert nur aus seinem
   Ordner und aus `src/core` (geprüft).
5. **CSS** in `theme.css`, jede Regel unter `.theme-<id>`, Keyframes mit Präfix `<id>-`. Farben, Zahlen, Schalter (1/0)
   und Schriften aus dem Schema kommen automatisch als CSS-Variablen an (`var(--accent)`, `var(--alertWidth)`).
   Jeder sichtbare Wert ist ein eigenes Feld, auch Abstände, Faktoren, Winkel und die Farbe einzelner Texte; im CSS
   steht dann nur `var(--feld)`. Diese Feinschliff-Felder stehen als Tabelle in `src/themes/<id>/tuning.ts`
   (`TUNING_FIELDS`, `TUNING_GROUPS`, Gruppen "Feinschliff: ..."); `node scripts/tuning.ts` schreibt daraus die
   Rust-Seite (`server-rs/.../themes/tuning/<id>.rs`), das Theme hängt `tuning::<id>::fields()` an derselben Stelle an
   wie `TUNING_FIELDS` in `settings.ts`. Ein geteilter Wert (Akzentfarbe, Schrift) bekommt je Stelle ein Feld mit
   `inherits(feld, "accent")`: leer übernimmt es den Theme-Wert (`effectiveValues` in `src/core/settings.ts`, das
   Dashboard zeigt "wie ..."), gesetzt gilt der eigene Wert. Das gilt auch für Stinger und Banner.
6. **Registrieren**: ein Theme erfüllt den Vertrag aus `src/core/theme.ts` an zwei Stellen (ohne Klassen, nur Typen):
   - `ThemeModule` (Daten, ohne React, auch für den Server): in `src/themes/registry.ts` in `THEME_MODULES` als
     `{ schema: <id>Settings, clips: <id>Clips, panel: <id>Panel, areas: <id>Areas }` eintragen. `clips` liefert
     Stinger, Profil- und Offline-Banner aus `render.ts` (siehe `src/themes/standard/render.ts`). `areas` (`areas.ts`)
     rechnet aus den Werten die Grösse der OBS-Quellen, damit nichts abgeschnitten wird und keine Quelle grösser als
     nötig ist: Chat, Kamera und Musik füllen ihre Quelle (`{ width, height }`), Alerts werden auf der 1920x1080-Bühne
     gezeichnet und die Quelle zeigt nur ihren Teil (`alertArea` aus `src/core/sceneArea.ts`: Karte plus Platz für
     Effekte). Eine Szene ohne Eintrag bekommt `SCENE_SIZES`. In Alerts-Szenen statt `innerWidth`/`innerHeight` immer
     `sceneFrame()` nehmen. Der erste Eintrag ist das Standard-Theme, bleibt `standard`.
   - `ThemeView` (Szenen): `index.tsx` exportiert `<id>View = { id: <id>Settings.id, scenes: { ... } }`, eingetragen
     in `src/themes/scenes.tsx` in `THEME_VIEWS`.
   `registry.check.ts` prüft, dass jeder Ordner unter `src/themes/` in beiden Listen steht; ein Ordner, der nur
   `docs/` enthält, ist ein geplantes Theme ohne Code und zählt noch nicht.
7. **Prüfen**: `npm run verify`. Danach im Dashboard unter `[ THEME ]` das Theme wählen und in der Vorschau alle
   Szenen ansehen.

## Theme-eigene Funktionen (Beispiel Minimes)

Manche Funktionen hat nur ein Theme, das sie selbst mitbringt (wie jede Szene, siehe "Fehlende Szenen"). Ein Theme
ohne die Funktion zeigt dort eine leere Seite, der Server
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

**Typen statt Farben** (Beispiel `urlaub`: Strandsachen): Das Schema bekommt `minimeVariants` (`MinimeVariantSet` aus
`src/core/theme.ts`: Befehl, z.B. `!typ`, Bezeichnung und je Typ `id`, Name und Standard-Namen im Chat) und bindet
statt `MINIME_FIELDS` die Felder `...MINIME_BASE_FIELDS` und `...minimeVariantFields(set)` ein (Gruppe `MINIME_VARIANTS`).
Der Server vergibt dann Typen statt Farben; jedes Minime trägt `variant` (die id) und `color: null`. Ohne Wahl gibt es
einen zufälligen erlaubten Typ, eine leere Namensliste schaltet einen Typ aus. In `?demo` kommen Minimes ohne Typ
(`variant: null`); die Szene wählt dann selbst einen, z.B. nach `hash(seedOf(login))` aus `src/core/hash.ts`.

**Fraktionen** (nur zusammen mit Typen, die Typen sind dann die Rollen): Das Schema bekommt `minimeTeams` im selben
Format wie `minimeVariants` (je Fraktion `id`, Name, Chat-Namen und Standardfarbe `color`) und bindet
`...minimeTeamFields(set)` ein (Gruppe `MINIME_TEAMS`: Befehl, Texte der Befehlsseite, je Fraktion Namen, Anzeigename,
Farbe). Der Server gibt jedem Minime `team`. Die Szene zeigt die Fraktion mit `shownTeam(actor, enabled, demo)` und zählt
mit `teamCounts` (z.B. wer einen Hügel hält); `enabled` sind die erlaubten Fraktionen aus
`readMinimeOptions(values, variants, teams).rules.teams`. Die Info-Seite übergibt das Set ebenfalls an
`readMinimeOptions`, dann erscheint `!team` in der Befehlsliste.

**Gefechte** (nur mit Typen; die Typen sind die Rollen, eine davon muss `medic` heissen): Das Schema bindet
`...minimeCombatFields(set)` ein (Gruppe `MINIME_COMBAT`: an/aus, Abstand, gleichzeitige Gefechte, Trefferchance,
Liegezeit, Wiederbeleben, Medic-Tempo, Töne, je Rolle Zielen und Schuss). Die Szene übergibt
`useMinimes({ ..., combat: { roles, teams, explosive, sounds } })` (mit `useMemo`): `roles` und `teams` sind die Sets
des Schemas, `explosive` die Rollen, deren Schuss eine Explosion ist, `sounds` die eingebauten Töne je Ereignis
(`shot`, `explosion`, `hit`, `revive`). Der Kern plant die Gefechte und setzt die Aktionen `aim`, `fire`, `down`,
`approach` (bewegt wie `walk`, mit Hüpfen), `revive` und `up`; das Theme zeigt sie über `action-<name>`. Am Minime steht
`combat` (`role`, `variant` = Waffe vom Beginn des Gefechts); die Rolle für die Anzeige liefert
`shownRole(actor, enabled, fallback, demoMedic)` (in `?demo` ist das erste Demo-Minime der Medic). Diese Aktionsnamen
darf der eigene Katalog nicht nutzen (`COMBAT_ACTIONS`, geprüft).

**Türme** (nur mit Typen, `src/core/minimeStack.ts`; bisher nur in `bears`, sie passen zu keinem anderen Theme): Das Schema bindet `...minimeStackFields(set, defaults)` ein (Gruppe
`MINIME_STACK`: an/aus, Abstand, gleichzeitige Türme, Typ je Stufe 1 bis 3 von unten, Stufe 3 auch "keiner", Tempo,
Dauer je Schritt, Abstand beim Absteigen, Turm läuft, Ton beim Aufsteigen); mit `defaults` setzt das Theme seine Standards (z.B. Türme an und
die Typen der Stufen), ohne sie sind Türme aus. Die Szene übergibt `useMinimes({ ..., stack: { variants, sound } })`
(`variants` = Set des Schemas, `sound` = eingebauter Ton beim Aufsteigen, beides stabil). Kein Chatbefehl: Der Kern
startet ab und zu einen Turm, wenn je Stufe ein freies Minime genau dieses Typs da ist (nicht im Gefecht, nicht
erscheinend oder verschwindend), und setzt die Aktionen `gather` (bewegt wie `walk`, mit Hüpfen), `brace` (die Basis
wartet), `climb` (Stufe für Stufe von unten), `stacked`, `stackWalk` (alle Stufen auf derselben Position) und
`dismount` (von oben nach unten, bewegt zur Seite: Stufe 2 und 3 landen auf verschiedenen Seiten); das Theme zeigt sie über `action-<name>`. Am Minime steht `stack.level` (1 = unten),
das Theme rechnet daraus die Höhe der Stufe (eigene Einstellung des Aussehens). Ein Turm bleibt ganz oder löst sich ganz
auf: Geht ein Minime oder wechselt es den Typ, steigen alle anderen sofort ab und sind frei. Chat-Reaktionen und Gefechte lassen
Türme in Ruhe, mit festen Plätzen gehen alle danach auf ihren Platz zurück. In `?demo` bekommen die ersten
Demo-Minimes die Typen der Stufen. Diese Aktionsnamen darf der eigene Katalog nicht nutzen (`STACK_ACTIONS`, geprüft).

**Feste Plätze**: Mit `minimePlacement = slots` (Kern-Feld in jedem Theme mit Minimes, Standard `random`) verteilt der
Kern `minimeMax` Plätze gleichmässig zwischen den Rändern, mit Fraktionen je Fraktion einen eigenen Bereich (Reihenfolge
der Fraktionen von links nach rechts). Neue Minimes bekommen den freien Platz mit dem grössten Abstand zu den belegten
(`slot` am Minime), wer weg ist (z.B. der Medic nach dem Wiederbeleben), geht zurück, Laufen ist aus. Mehr Minimes
als Plätze gibt es nur, wenn `minimeMax` gesenkt wird, während die Szene voll ist; die Überzähligen teilen sich dann
den ersten Platz, bis jemand geht (bewusst kein Rauswurf, das entscheidet der Streamer). Ein Theme, das
das als Standard will, setzt es mit `withDefaults`.

**Eigene Standardwerte für Kern-Felder**: `withDefaults(MINIME_BASE_FIELDS, { minimeWalkWeight: 0 })` aus
`src/core/fields.ts` ändert nur die Standards (z.B. Figuren, die nicht laufen), die Grenzen bleiben. Rust spiegelt das
mit `with_defaults`.

**Hüpfen** (Kern, `src/core/minimeHops.ts`): Das Schema bindet `...MINIME_HOP_FIELDS` ein (Gruppe `MINIME_HOP`:
Sprunghöhe, Dauer eines Sprungs, Stauchen). Die Szene importiert `src/core/minimeHops.css`, legt um den Körper der Figur
ein Element mit der Klasse `minime-hop`, gibt dem Schatten `minime-hop-shadow` und setzt `hopStyle(actor, values.hopMs)`
als Stil. Gehüpft wird bei `walk` und beim `approach` der Gefechte. Hat der Körper eine eigene Grundanimation (z.B.
Atmen), schaltet das Theme sie während `walk` ab.

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

## Grafik- und Animationsmodule (optional)

Für Themes, die mehr brauchen als SVG und CSS, gibt es Module mit Kern-Bausteinen ([plans/PLAN-GRAFIK.md](plans/PLAN-GRAFIK.md)).
Ein Theme, das sie nutzt, steht in `MODULE_THEMES` in `scripts/bundle.ts` (heute Dachdecker und die modernisierten
Themes KOTH, Plantage, Chaos, Bärenbande, Urlaub, Matrix), sonst schlägt `npm run verify` fehl; im Einstiegs-Chunk und
bei Standard bleiben sie verboten.

| Modul | wann | Kern-Baustein |
|---|---|---|
| GSAP | Abläufe mit vielen Schritten, Text Buchstabe für Buchstabe, Linien zeichnen, Bewegung auf Kurven | `useTimeline`, benannte Kurven (`src/core/motion`) |
| Three.js mit react-three-fiber und postprocessing | echte 3D-Welten, Bloom, viele Instanzen | `Stage3D`, `mergedEdges`, `beamTransform`, `chance` (`src/core/three`) |
| Vanilla-Three.js in Clips | Stinger und Banner in 3D | `glClip` (`src/core/three`) |
| PixiJS | sehr viele 2D-Partikel oder Sprites über WebGL | `PixiStage`, `stepParticles` (`src/core/pixi`) |
| Rough.js | Skizzen-Look, handgezeichnete Formen | `roughPath` (`src/core/rough`) |

Farben, Zeiten und Mengen reicht das Theme aus seinen Einstellungen an die Bausteine durch; Geometrie liegt in reinen
`.ts`-Modulen mit Checks. 3D braucht in OBS die Hardware-Beschleunigung der Browserquelle.

Für jedes Theme gleich: die Stinger-Optionen (`stingerFields`, `withStingerOptions` in `src/core/stingerOptions.ts`),
Teilchen-Ausbrüche als reine Funktion der Zeit für Stinger und Banner (`burstAt` in `src/core/motion/burst.ts`) und die
Leistungsstufe (`qualityField` in `src/core/graphicsFields.ts`, Bedeutung in `src/core/three/quality.ts`).

**Referenz-Prototypen:** liegen je Theme in `src/themes/<id>/docs/refs/` (z. B. `starting.html`, `alert.html`). Sie sind
Vorlagen für Look und Ablauf, kein Teil des Builds, und dürfen ihre Module per CDN laden; mit `?t=<Sekunden>` zeigen
sie ein Standbild.

**Fallstricke aus den Prototypen:**
- Eine angehaltene GSAP-Timeline, die mit `?t=` hinter einen Tween springt, ruft dessen `onUpdate` nicht auf. Ausgaben,
  die von einem Tween-Wert abhängen (Fortschrittsbalken, Zähler), setzt der Ticker aus dem Wert.
- Deckkraft unter 1 an einem Element mit `transform-style: preserve-3d` macht es flach, die Rückseite erscheint
  gespiegelt. Ausgeblendet wird ein Elternelement.
- SVG-Gruppen drehen mit `svgOrigin` (Koordinaten im `viewBox`), nicht mit CSS `transform-origin`.
- `-webkit-mask-image` beschneidet `text-shadow` am Rand des Elements; nach einer Aufsprüh-Maske wird die Maske entfernt
  oder das Element bekommt Innenabstand.
- PixiJS 8 startet asynchron (`await app.init`); mit `autoStart: false` zeichnet der Ticker der Szene selbst
  (`app.renderer.render`), damit `?t=`-Standbilder stimmen.

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

## Fehlende Szenen

Ein Theme hat nur die Szenen, die `index.tsx` in seiner `ThemeView` einträgt, und nur die Clips, die `clips` in
`render.ts` liefert (eine Teilmenge von `stinger`, `profile`, `offline`, auch keiner). Nichts wird von einem anderen
Theme geerbt, auch nicht als Platzhalter (`resolveScene` und `sceneNames` in `src/core/themeRuntime.ts`, `clipsFor` in
`src/themes/renderers.ts`). So kann ein Theme Szenen weglassen oder Schritt für Schritt bauen:

- Die Overlay-Seite einer fehlenden Szene ist leer und transparent (in OBS unsichtbar).
- Das Dashboard markiert fehlende Szenen in der Übersicht und in der Vorschau, fehlende Clips beim Rendern mit "In diesem
  Theme nicht verfügbar".
- Der OBS-Import legt trotzdem alle Quellen an; nach einem Theme-Wechsel stimmt die Einrichtung ohne neuen Import.

## Checkliste

- [ ] id eindeutig, Name lesbar, Gruppen sinnvoll benannt
- [ ] jeder sichtbare und hörbare Wert ist eine Einstellung mit Standardwert
- [ ] Szenen nutzen nur Kern-Hooks und -Bausteine, keine eigene Kopie gemeinsamer Logik, kein `fetch`, `EventSource` oder `WebSocket`
- [ ] CSS komplett unter `.theme-<id>`, Keyframes mit Präfix
- [ ] in `registry.ts` und `scenes.tsx` eingetragen
- [ ] eigener Dashboard-Skin in `skin.ts` und `skins.css` (Kontraste gerechnet), Grundsätze in [DESIGN.md](DESIGN.md)
- [ ] `src/themes/<id>/docs/DESIGN-<ID>.md` mit den Designentscheidungen des Themes (Skin und Overlays), in der Tabelle in
  `DESIGN.md` verlinkt; der Plan des Themes liegt daneben als `PLAN-<ID>.md`
- [ ] `npm run verify` grün, im Dashboard ausprobiert
