# Plan: Theme-Einstellungen neu gestalten (Einfach und Erweitert)

Kern-Plan für die Seite "Theme" im Dashboard (`#/theme`, `src/dashboard/ThemeSettings.tsx`). Der Rust-Anteil (das
Merkmal "einfach" am Feld) steht als Package 51 in [RUST-PLAN.md](../RUST-PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| R51 | Merkmal "einfach" am Feld (Rust) | Ein Feld kann im Rust-Schema als einfach markiert sein, der Server liefert das Merkmal mit. | - |
| 1 | Merkmal "einfach" im TS-Schema und Formular-Logik | TS-Schema und Formular-Logik kennen einfache Felder, Arten-Unterteilung und versteckte Änderungen. | R51 |
| 2 | Neues Layout der Theme-Seite | Die Seite hat eine Bereichs-Navigation, den Umschalter Einfach/Erweitert, eine feste Speichern-Leiste und unterteilte Gruppen. | 1 |
| 3 | Kern-Felder markieren | Die geteilten Felder (Alert-Sounds, Chat-Abzeichen, Befehlsseite, Minimes) haben ihre einfachen Felder markiert. | 1 |
| 4 | Theme-Felder markieren | Jedes Theme hat je Bereich eine kleine, handverlesene Auswahl einfacher Felder, geprüft vom Schema-Audit. | 3 |

Package 2 und 3 können parallel laufen. Jedes Package endet mit grünem `npm run verify` und wird einzeln committet.

## Ausgangslage

Felder je Theme heute:

| Theme | Felder | grösste Gruppen |
|---|---|---|
| standard | 113 | Befehlsseite 29, Alerts 23 |
| matrix | 260 | Alerts 42, Starting/BRB/Ending 35 |
| urlaub | 333 | Alerts 49, Typen: Farben 32, Kulisse 31 |
| plantage | 311 | Alerts 49, Starting/BRB/Ending 34, Plantage 30 |
| koth | 310 | Alerts 48, Befehlsseite 31, Hügel 27 |
| bears | 337 | Alerts 49, Allgemein 40, Welt 37 |

Rund ein Drittel sind Zahlen (Grössen, Zeiten, Animationen), 40 bis 60 sind Farben. Die Seite zeigt je Ansicht
(Dropdown "Allgemein" oder eine Szene) alle Gruppen offen untereinander, jede Gruppe als lange Liste.

## Annahmen

- **Bereiche = heutige Ansichten:** "Allgemein" und die Szenen des Themes (`groupsForView`). Gruppen ohne Szene
  (Stinger, Banner) bekommen den Bereich "Rendern".
- **Einfach ist der Standard** beim ersten Besuch; die Wahl wird im Browser gemerkt (wie der Skin in `skin.ts`).
- **Die Suche durchsucht immer alle Felder**, unabhängig vom Modus, und zeigt Treffer mit ihrem Bereich.
- **Auswahl der einfachen Felder** treffe ich je Theme nach festen Regeln (Package 3 und 4); du prüfst sie im Commit
  und kannst einzelne Felder später umhängen.
- **Kein neues Verhalten der Overlays:** das Merkmal ändert nur das Formular, nie Werte, Prüfung oder Standards.

---

## Package 1: Merkmal "einfach" im TS-Schema und Formular-Logik

**Ziel:** Das TS-Schema kann Felder als einfach markieren, und die Formular-Logik liefert je Bereich und Modus die
sichtbaren Felder, unterteilt nach Art, samt Änderungen und Fehlern, die im gewählten Modus nicht sichtbar sind.

**Abhängigkeiten:** RUST-PLAN Package 51 (erzeugter Typ `SettingField` mit `basic?: boolean`)

**Betroffene Dateien:**
- `src/core/theme.ts` (ändern: `FieldBase` bekommt `basic?: boolean`)
- `src/core/fields.ts` (ändern: Helfer `basic(field)` wie `inScene`)
- `src/core/fields.check.ts` (ändern)
- `src/dashboard/settingsForm.ts` (ändern: neue reine Funktionen)
- `src/dashboard/settingsForm.check.ts` (ändern)

### Kontext

`groupsForView(schema, view)` liefert heute die Gruppen eines Bereichs mit allen Feldern. Für die neue Seite braucht es
dazu den Modus, eine Unterteilung grosser Gruppen nach Art und den Blick auf Änderungen und Fehler, die im Modus
versteckt sind (sonst speichert man Änderungen, die man nicht sieht, oder sucht einen Fehler, der nicht angezeigt wird).

### Acceptance Criteria

- [ ] AC1: `basic(field)` gibt das Feld mit `basic: true` zurück und ändert sonst nichts; Felder ohne Aufruf haben kein
  `basic`.
- [ ] AC2: `groupsForMode(schema, view, "einfach")` liefert nur die einfachen Felder der Gruppen des Bereichs, leere
  Gruppen fallen weg; mit `"erweitert"` ist das Ergebnis gleich `groupsForView`.
- [ ] AC3: `fieldsByKind(fields)` teilt Felder in die Arten Texte (text, textarea, lines), Farben (color), Schrift und
  Auswahl (font, select), Schalter (boolean), Grössen und Zeiten (number), Medien und Sounds (media, sound), in fester
  Reihenfolge; leere Arten fallen weg, die Reihenfolge der Felder innerhalb einer Art bleibt die des Schemas.
- [ ] AC4: `hiddenKeys(schema, view, mode, keys)` liefert von den übergebenen Schlüsseln (geänderte oder fehlerhafte
  Felder) die, die im Bereich und Modus nicht sichtbar sind.
- [ ] AC5: `viewOfField(schema, key)` liefert den Bereich, in dem ein Feld steht (`"general"`, eine Szene oder
  `"render"` für Gruppen ohne Szene).

### Tests (TDD)

Reihenfolge: Test schreiben, rot, minimal implementieren, grün, aufräumen.

1. `fields.check.ts`: `basic` markiert nur (AC1)
   - Gegeben: `basic(color("a", "A", "G", "#000000"))`
   - Erwartet: gleiches Objekt plus `basic: true`; `color(...)` allein hat kein `basic`
2. `settingsForm.check.ts`: einfacher Modus zeigt nur markierte Felder (AC2)
   - Gegeben: Probe-Schema mit Gruppe "G" (Felder a einfach, b nicht) und Gruppe "H" (nur c, nicht einfach)
   - Erwartet: einfach = `[{ group: "G", fields: [a] }]`, erweitert = beide Gruppen mit allen Feldern
3. `settingsForm.check.ts`: Arten in fester Reihenfolge (AC3)
   - Gegeben: Felder number, color, text, boolean, sound gemischt
   - Erwartet: Arten Texte, Farben, Schalter, Grössen und Zeiten, Medien und Sounds; keine leere Art
4. `settingsForm.check.ts`: versteckte Änderungen (AC4)
   - Gegeben: geändert sind a (einfach) und b (nicht einfach), Bereich "general", Modus einfach
   - Erwartet: `["b"]`; im Modus erweitert `[]`; ein Feld aus einer anderen Szene gilt auch als versteckt
5. `settingsForm.check.ts`: Bereich eines Feldes (AC5)
   - Gegeben: Feld in Gruppe ohne `groupScenes`-Eintrag, Feld mit `scene: "brb"`, Feld in Gruppe mit `[]`
   - Erwartet: `"general"`, `"brb"`, `"render"`

Testbefehl: `node src/dashboard/settingsForm.check.ts`, am Ende `npm run verify`

### Umsetzungsschritte

1. Tests 1 bis 5 schreiben, rot.
2. `basic?: boolean` in `FieldBase`, Helfer `basic` in `fields.ts`.
3. `FormMode = "einfach" | "erweitert"`, `groupsForMode`, `fieldsByKind`, `hiddenKeys`, `viewOfField` in
   `settingsForm.ts`, aufbauend auf `groupsForView`.
4. Grün, `npm run verify`.

### Out of Scope

- Die Darstellung (Package 2), das Markieren echter Felder (Package 3 und 4).

---

## Package 2: Neues Layout der Theme-Seite

**Ziel:** Die Theme-Seite zeigt eine Bereichs-Navigation, einen Umschalter Einfach/Erweitert, eine immer sichtbare
Speichern-Leiste und im erweiterten Modus nach Art unterteilte, eingeklappte Gruppen neben der Vorschau.

**Abhängigkeiten:** Package 1

**Betroffene Dateien:**
- `src/dashboard/ThemeSettings.tsx` (ändern: Aufbau, Modus, Navigation)
- `src/dashboard/SettingInput.tsx` (ändern: kompakte Darstellung für Farben im Raster)
- `src/dashboard/settingsMode.ts` (neu: Modus im Browser merken, wie `skin.ts`) und `settingsMode.check.ts` (neu)
- `src/dashboard/texts.de.ts` (ändern: Texte für Modus, Bereiche, Hinweise)
- `src/dashboard/dashboard.css` (ändern; nur Tokens, gilt für alle Skins)

### Kontext

Heute: Theme-Wahl, Dropdown "Vorschau-Szene", Leiste mit Speichern/Verwerfen/Zurücksetzen, darunter Suche und alle
Gruppen offen untereinander, rechts die Vorschau (`ScenePreview`). Bei 30 bis 50 Feldern je Gruppe ist das eine sehr
lange Liste ohne Halt.

Aufbau neu (Desktop):

```
[Theme: Bärenbande (aktiv) v]                       [ Einfach | Erweitert ]
[Speichern] [Verwerfen] [Alles zurücksetzen]   3 ungespeichert          <- bleibt beim Scrollen oben
+--------------+---------------------------------+------------------------+
| Allgemein    | Suche [______________]          |                        |
| Starting     | > Gruppe "Alerts"               |       Vorschau         |
| BRB          |   Texte    (offen)              |   (Szene des           |
| Ending       |   Farben   (Raster)             |    Bereichs)           |
| Alerts     * |   Grössen und Zeiten (zu)       |                        |
| Chat         |   ...                           |                        |
| ...          |                                 |                        |
| Rendern      |                                 |                        |
+--------------+---------------------------------+------------------------+
```

Unter 720px: Navigation als Auswahlfeld über den Gruppen, Vorschau unter den Gruppen (wie heute).

### Acceptance Criteria

- [ ] AC1: Die Navigation zeigt "Allgemein", jede Szene (Szenen, die das Theme nicht hat, mit Hinweis wie heute) und
  "Rendern", wenn es Gruppen ohne Szene gibt. Ein Klick zeigt nur diesen Bereich; bei einer Szene zeigt die Vorschau
  diese Szene. Ein Bereich mit ungespeicherten Änderungen ist in der Navigation markiert.
- [ ] AC2: Der Umschalter Einfach/Erweitert ist eine Segment-Schaltfläche mit zwei Optionen; die Wahl bleibt nach
  Neuladen erhalten (`settingsMode.ts`; kann der Browser nicht speichern, gilt "einfach").
- [ ] AC3: Im Modus Einfach stehen nur die einfachen Felder, Gruppen offen. Hat ein Bereich keine, steht dort
  "In diesem Bereich gibt es nur erweiterte Einstellungen." mit einer Schaltfläche "Erweitert zeigen".
- [ ] AC4: Im Modus Erweitert stehen alle Felder. Eine Gruppe mit mehr als 7 Feldern ist nach Art unterteilt
  (`fieldsByKind`); die Art "Texte" ist offen, die übrigen eingeklappt. Gruppen bis 7 Felder bleiben ungeteilt.
- [ ] AC5: Die Felder der Art "Farben" stehen als Raster kleiner Farbfelder mit Beschriftung darunter (mindestens 3 je
  Zeile auf Desktop); Zurücksetzen bleibt je Feld erreichbar.
- [ ] AC6: Die Speichern-Leiste bleibt beim Scrollen der Felder sichtbar. Gibt es ungespeicherte Änderungen, die im
  aktuellen Bereich oder Modus nicht sichtbar sind, steht dort "davon N nicht sichtbar" mit Link "zeigen", der in den
  Bereich der ersten wechselt und bei Bedarf auf Erweitert schaltet.
- [ ] AC7: Lehnt der Server Werte ab, wechselt die Seite in den Bereich des ersten fehlerhaften Feldes, schaltet bei
  Bedarf auf Erweitert und öffnet dessen Gruppe und Art; die Fehlermeldung steht am Feld wie heute.
- [ ] AC8: Mit Suchtext zeigt die Seite die Treffer aller Bereiche in beiden Modi, je Treffer mit dem Namen seines
  Bereichs; ohne Treffer der Hinweis wie heute.
- [ ] AC9: Alle Skins sehen stimmig aus (nur Tokens, `skin.check.ts` und Regel-Check grün); bei 375px Breite kein
  waagerechtes Scrollen.

### Tests (TDD)

1. `settingsMode.check.ts`: gemerkter Modus (AC2)
   - Gegeben: Speicher mit "erweitert", leerer Speicher, Speicher wirft beim Lesen
   - Erwartet: "erweitert", "einfach", "einfach"
2. Die Logik hinter AC3, AC4, AC6, AC7 und AC8 liegt in `settingsForm.ts` (Package 1) und ist dort geprüft; die Seite
   verbindet sie nur.
3. Manueller Check (AC1, AC3 bis AC9; Darstellung, nicht automatisiert prüfbar): im Browser-Pane mit Demo-Daten für
   jedes Theme die Bereiche durchklicken, Modus wechseln, ein Feld in Erweitert ändern und in Einfach den Hinweis
   prüfen, einen ungültigen Wert speichern, Suche "farbe" eingeben, Breite 375px prüfen; je Skin ein Screenshot.

Testbefehl: `node src/dashboard/settingsMode.check.ts`, am Ende `npm run verify`

### Umsetzungsschritte

1. Test 1 schreiben, rot; `settingsMode.ts` umsetzen, grün.
2. `ThemeSettings.tsx`: Navigation statt Dropdown, Modus-Zustand, Speichern-Leiste als eigener Block.
3. `SettingsGroups`: Modus und Arten, Hinweis für leere Bereiche, Sprung zu versteckten Änderungen und Fehlern.
4. `SettingInput.tsx`: kompakte Farbdarstellung für das Raster.
5. `dashboard.css`: Drei-Spalten-Raster, `position: sticky` für die Leiste, Farbraster, Verhalten unter 720px.
6. Texte in `texts.de.ts`.
7. Manueller Check, `npm run verify`.

### Out of Scope

- Welche Felder einfach sind (Package 3 und 4); bis dahin ist "Einfach" überall leer und zeigt den Hinweis aus AC3.
- Andere Dashboard-Seiten (Trigger, Medien, Rendern).

---

## Package 3: Kern-Felder markieren

**Ziel:** Die Felder, die der Kern für alle Themes liefert, haben ihre einfachen Felder markiert, in TS und Rust gleich.

**Abhängigkeiten:** Package 1 und RUST-PLAN Package 51

**Betroffene Dateien:**
- `src/core/alerts/alerts.ts`, `src/core/chat/chat.ts`, `src/core/infoFields.ts`, `src/core/minimeFields.ts` (ändern)
- `server-rs/crates/rst-domain/src/themes/core_fields.rs`, `info_fields.rs`, `minime_fields.rs` (ändern)
- Fixtures unter `server-rs/crates/rst-domain/tests/fixtures/` (neu erzeugt mit `scripts/dumpSchema.ts`)
- `src/themes/schemaAudit.ts` und `schemaAudit.check.ts` (ändern: Regel für einfache Felder)

### Kontext

Mehrere Gruppen kommen aus dem Kern: Alert-Sounds, Chat-Abzeichen, Befehlsseite (29 bis 31 Felder) und die Minimes
(Befehle, Regeln, Bewegung, Aussehen, Animationen, Typen, Türme). Sie werden einmal im Kern markiert, nicht je Theme.

Regel für einfach: was ein Streamer beim Einrichten typischerweise ändert. Texte, die Zuschauer lesen (Titel,
Befehlswörter), Funktionen an/aus, der Sound je Alert-Art. Nicht einfach: Grössen, Zeiten, Animationswerte, Grenzen.

### Acceptance Criteria

- [ ] AC1: Je Kern-Gruppe sind 1 bis 7 Felder einfach, gemäss Regel oben.
- [ ] AC2: Rust- und TS-Felder sind gleich (Fixture-Vergleich, auch `minime-features.json`).
- [ ] AC3: Das Schema-Audit meldet eine Kern-Gruppe ohne einfaches Feld oder mit mehr als 7.

### Tests (TDD)

1. `schemaAudit.check.ts`: Probe-Schema mit einer Kern-Gruppe ohne einfaches Feld und einer mit 8 einfachen (AC3)
   - Erwartet: zwei Meldungen mit Gruppe und Anzahl
2. Fixture-Vergleich in `rst-domain` (AC2), nach Neuerzeugung der Fixtures
3. `schemaAudit.check.ts` über alle Themes (AC1): keine Meldung für Kern-Gruppen

Testbefehl: `npm run verify`

### Umsetzungsschritte

1. Audit-Test schreiben, rot; Regel in `schemaAudit.ts`, nur für Kern-Gruppen, grün.
2. Felder in TS markieren, gleiche in Rust (`basic(...)`), Fixtures neu erzeugen.
3. `npm run verify`.

### Out of Scope

- Theme-eigene Gruppen (Package 4).

---

## Package 4: Theme-Felder markieren

**Ziel:** Jedes Theme hat in jedem Bereich eine kleine, handverlesene Auswahl einfacher Felder, in TS und Rust gleich.

**Abhängigkeiten:** Package 3

**Betroffene Dateien:**
- `src/themes/<id>/settings.ts` für standard, matrix, urlaub, plantage, koth, bears (ändern)
- `server-rs/crates/rst-domain/src/themes/<id>.rs` (ändern), Fixtures (neu erzeugt)
- `src/themes/schemaAudit.ts` und `schemaAudit.check.ts` (ändern: Regel auf alle Bereiche ausweiten)

### Kontext

Regel je Bereich, damit die Auswahl über alle Themes gleich wirkt:

- **Allgemein:** Kanalname, Schrift, Akzent- und Textfarbe (höchstens 4 Farben), Funktionen an/aus des Themes.
- **Szene:** die Texte der Szene (Titel, Untertitel, Lauftext), die Figur oder das Motiv, das der Streamer wählt,
  höchstens 2 Farben.
- **Alerts:** je Art der Text der Zeile; die Sounds kommen aus dem Kern.
- **Kulisse/Welt (Theme-eigene Gruppen):** die Schalter für Teile der Welt (z. B. Stadt, Brücke), Tageszeit, höchstens
  3 Farben.
- Nie einfach: Zahlen, ausser eine Grösse, die fast jeder anpasst (z. B. Grösse der Figur).

### Acceptance Criteria

- [ ] AC1: Jeder Bereich jedes Themes, der Felder hat, hat im Modus Einfach 1 bis 10 Felder; Allgemein 3 bis 12.
- [ ] AC2: Kein Zahlenfeld ist einfach, ausser es steht in einer Ausnahme-Liste im Audit mit Grund.
- [ ] AC3: Rust- und TS-Felder sind gleich (Fixture-Vergleich).
- [ ] AC4: Manueller Check: je Theme im Modus Einfach alle Bereiche durchsehen; man kann Kanal, Texte, Hauptfarben und
  Figuren einstellen, ohne auf Erweitert zu wechseln.

### Tests (TDD)

1. `schemaAudit.check.ts`: Bereich mit 0 und mit 11 einfachen Feldern, Zahl ohne Ausnahme (AC1, AC2)
   - Erwartet: je eine Meldung mit Theme, Bereich und Anzahl
2. `schemaAudit.check.ts` über alle Themes: keine Meldung (AC1, AC2)
3. Fixture-Vergleich je Theme in `rst-domain` (AC3)

Testbefehl: `npm run verify`

### Umsetzungsschritte

1. Audit-Tests schreiben, rot.
2. Je Theme Felder markieren (TS, dann Rust), Fixtures neu erzeugen, Audit grün.
3. Manueller Check im Browser-Pane, `npm run verify`.

### Out of Scope

- Neue Felder oder geänderte Standards; Umbenennen von Gruppen.
