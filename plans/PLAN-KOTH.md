# Plan: Theme "King of the Hill" (KOTH)

Militärisch nach dem Modus King of the Hill aus Arma 3, Arma Reforger und Wardogs: ein Hügel in der Mitte, drei
Fraktionen kämpfen darum. Die Zuschauer sind kleine Soldaten in Rollen (Sturmsoldat, Medic, MG-Schütze,
Scharfschütze, Grenadier), die nicht laufen und nicht hüpfen.

Testbefehl: `npm run verify` (dazu `npm run contract`, wo der Server betroffen ist). Regeln:
[CODING-RULES.md](../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../THEMES.md), Übersicht aller Pläne: [PLAN.md](../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Theme King of the Hill | Das Theme `koth` bringt alle Szenen, Stinger, Banner, Töne und stehende Soldaten-Minimes in drei Fraktionen. | PLAN-MINIMES 10, 11, 12 |

## Annahmen

- **Name und ID** (entschieden 2026-10-18): Anzeigename "King of the Hill", id `koth`.
- **Fraktionen** (entschieden 2026-10-18): Standard BLUFOR (blau), OPFOR (rot),
  INDFOR (grün), Name, Farbe und Chat-Namen je Fraktion einstellbar. Befehl `!join blau medic` (Reihenfolge egal) oder
  `!team rot`. Ohne Angabe die Fraktion mit den wenigsten Mitgliedern.
- **Rollen** (entschieden 2026-10-18): Sturmsoldat (Sturmgewehr), Medic (Sanitätstasche, schiesst nicht), MG-Schütze (LMG),
  Scharfschütze (Gewehr mit Zielfernrohr), Grenadier (Granatwerfer, Treffer als kleine Explosion). Chat-Namen je Rolle einstellbar, eine Rolle mit leerer Namensliste ist aus.
  Die Rolle wählt der Zuschauer per Befehl (`!join medic`, `!rolle sniper`), ohne Angabe eine zufällige erlaubte Rolle
  (entschieden 2026-10-18).
- **Gefechte** (entschieden 2026-10-18: zufällig als Animation, nie per Chatbefehl): geschossen wird nur,
  wenn ein freier Medic aus der Fraktion des Ziels da ist; Medics schiessen nicht und sind nie Ziel; ein Getroffener liegt, bis ein Medic ihn
  wiederbelebt, oder steht nach einer einstellbaren Liegezeit von selbst auf. Kein Blut.
- **Regeln der Gefechte und Fraktionen:** Kern, siehe [PLAN-MINIMES.md](PLAN-MINIMES.md) Packages 10 bis 12.
- **Alles einstellbar** (Gedächtnis): Häufigkeit und Dauer jeder Animation, Gefechtsrate, Liegezeit, Rollen, Farben,
  Texte, Töne. Fest bleiben nur Formen (SVG) und Server-Schutzgrenzen.
- **Kern statt Theme:** Das Theme bindet Fraktionen und Gefechte aus dem Kern ein und liefert nur Aussehen,
  eigene Animationen und Standardwerte; es verweist auf kein anderes Theme.
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/<id>.rs` und `src/themes/<id>/settings.ts`, gleich
  gehalten über die Fixtures.
- **Commit-Grösse:** das Theme-Package liegt deutlich über 400 Zeilen; bewusste Ausnahme, steht in
  der Commit-Beschreibung.
- **Wer auf wen:** nur auf andere Fraktionen; ist nur eine Fraktion da, wird nicht geschossen.
- **Laufen und Hüpfen aus:** feste Plätze am Hügel (Theme-Standards für Kern-Felder, RUST-PLAN 48: `minimePlacement = slots`,
  "Häufigkeit: wandern" 0), Bewegung nur auf der
  Stelle (zielen, nachladen, Deckung, liegen, umschauen). Der Medic kriecht zum Getroffenen, das ist die einzige
  Ortsänderung.
- **Treffer:** Staubwolke, der Soldat fällt hin.

---

## Package 1: Theme King of the Hill

**Ziel:** Das Theme `koth` bringt alle Szenen, Stinger, Banner, Töne und stehende Soldaten-Minimes in drei Fraktionen.

**Abhängigkeiten:** [PLAN-MINIMES.md](PLAN-MINIMES.md) Packages 10 (Fraktionen), 11 (Gefechte) und 12 (feste Plätze)

**Betroffene Dateien:** `src/themes/koth/` (neu), Registry, Scenes, Skin, `server-rs/crates/rst-domain/src/themes/koth.rs`
und Registry, Fixture, `src/generated/themes/koth.ts`, `index.html` (Schrift im Schablonen-Stil), `README.md`.

### Gestaltung je Szene

- **Grundlayout:** Hügel mit Funkmast und Flagge in der Mitte, Sandsäcke, Tarnnetze, Gelände in Oliv und Sand,
  Fraktionsfarben als Akzent; Anzeige, welche Fraktion den Hügel hält: die mit den meisten Minimes (entschieden 2026-10-18),
  bei Gleichstand umkämpft; gezählt mit `teamCounts` aus dem Kern, ohne eigenen Zustand. Die Anzeige gibt es nur
  in der Szene `minimes` (entschieden 2026-10-18); die anderen Szenen zeigen den Hügel als Kulisse.
- **Starting, BRB, Ending:** Einsatzbesprechung mit Lagekarte, Countdown als Einsatzbeginn; Ending als Einsatzbericht.
- **Alerts:** Funkspruch-Karte mit Rufzeichen (Follow = "neuer Rekrut", Sub = "Verstärkung", Raid = "Luftlandung").
- **Chat:** Funkprotokoll mit Zeitstempel.
- **Kamera-Rahmen:** Zielfernrohr- oder Helmkamera-Rahmen mit Markierungen.
- **Musik:** Feldfunkgerät.
- **Stinger:** Rauchgranate und Flaggenwechsel; **Banner:** Hügel mit Flagge und Kanalnamen.
- **Minimes:** kleine Soldaten mit Helm, Uniform in Fraktionsfarbe, Waffe je Rolle; feste Plätze am Hügel, kein Laufen
  und Hüpfen. Eigene Animationen auf der Stelle (zielen, nachladen, Deckung, hinlegen, umschauen, salutieren) plus
  Gefechte (nur zwischen Fraktionen) mit Staubwolke; der Medic kriecht zum Getroffenen.

### Acceptance Criteria

- [ ] AC1: Alle Szenen, Stinger und Banner im Militär-Look; kein fester Wert im Theme-Code.
- [ ] AC2: Minimes wählen Fraktion und Rolle per Befehl, stehen auf festen Plätzen, kämpfen nur zwischen Fraktionen.
- [ ] AC3: Schema in Rust und TS gleich, Formular aus dem Server-Schema; Fraktionen (Name, Farbe, Chat-Namen) einstellbar.
- [ ] AC4: Stinger und Banner rendern deterministisch.

### Tests (TDD)

1. Settings-, Render-, Stinger- und Banner-Checks wie bei jedem Theme, dazu ein Check des Hügel-Halters (meiste Minimes, Gleichstand).
2. Vertragsfall: `!join blau medic` im Chat erscheint als Minime mit Fraktion und Rolle.
3. Manuell: Vorschau aller Szenen, Gefechte mit drei Fraktionen.
