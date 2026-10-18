# Plan: Theme "Südfrucht-Plantage" (Mangoplantage)

Mangofeld statt Strand: Der Streamer ist der Mangopflücker, die Zuschauer sind Mangos mit Sturmgewehren in Rollen
(Sturmsoldat, Medic, MG-Schütze, Scharfschütze, Grenadier). Die Mangos hüpfen und schiessen sich zufällig
gegenseitig ab, solange ein Medic da ist, der sie wiederbelebt. Kein Strandgefühl, alles dreht sich um
die Plantage.

Testbefehl: `npm run verify` (dazu `npm run contract`, wo der Server betroffen ist). Regeln:
[CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../../../../THEMES.md), Übersicht aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Theme Südfrucht-Plantage | Das Theme `plantage` bringt alle Szenen, Stinger, Banner, Töne und hüpfende Mango-Soldaten im Plantagen-Look. | PLAN-MINIMES 8, 11 |

## Annahmen

- **Name und ID** (entschieden 2026-10-18): Anzeigename "Südfrucht-Plantage", id `plantage`.
- **Rollen** (entschieden 2026-10-18): Sturmsoldat (Sturmgewehr), Medic (Sanitätstasche, schiesst nicht), MG-Schütze (LMG),
  Scharfschütze (Gewehr mit Zielfernrohr), Grenadier (Granatwerfer, Treffer als kleine Explosion). Chat-Namen je Rolle einstellbar, eine Rolle mit leerer Namensliste ist aus.
  Die Rolle wählt der Zuschauer per Befehl (`!join medic`, `!rolle sniper`), ohne Angabe eine zufällige erlaubte Rolle
  (entschieden 2026-10-18).
- **Gefechte** (entschieden 2026-10-18: zufällig als Animation, nie per Chatbefehl): geschossen wird nur,
  wenn ein freier Medic da ist; Medics schiessen nicht und sind nie Ziel; ein Getroffener liegt, bis ein Medic ihn
  wiederbelebt, oder steht nach einer einstellbaren Liegezeit von selbst auf. Kein Blut.
- **Regeln der Gefechte:** Kern, siehe [PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Packages 8 und 11.
- **Alles einstellbar** (Gedächtnis): Häufigkeit und Dauer jeder Animation, Gefechtsrate, Liegezeit, Rollen, Farben,
  Texte, Töne. Fest bleiben nur Formen (SVG) und Server-Schutzgrenzen.
- **Kern statt Theme:** Das Theme bindet Hüpfen und Gefechte aus dem Kern ein und liefert nur Aussehen,
  eigene Animationen und Standardwerte; es verweist auf kein anderes Theme.
- **Schema in Rust und TS:** `server-rs/crates/rst-domain/src/themes/<id>.rs` und `src/themes/<id>/settings.ts`, gleich
  gehalten über die Fixtures.
- **Commit-Grösse:** das Theme-Package liegt deutlich über 400 Zeilen; bewusste Ausnahme, steht in
  der Commit-Beschreibung.
- **Wer auf wen:** jeder gegen jeden (keine Fraktionen).
- **Treffer:** Mangosaft spritzt, die Mango kippt um und bekommt Kreuzchen-Augen; der Medic hüpft hin und belebt sie.

---

## Package 1: Theme Südfrucht-Plantage

**Ziel:** Das Theme `plantage` bringt alle Szenen, Stinger, Banner, Töne und hüpfende Mango-Soldaten im Plantagen-Look.

**Abhängigkeiten:** [PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Packages 8 (Hüpfen) und 11 (Gefechte)

**Betroffene Dateien:** `src/themes/plantage/` (neu, Aufbau wie in THEMES.md), `src/themes/registry.ts`,
`src/themes/scenes.tsx`, `src/dashboard/skin.ts`, `server-rs/crates/rst-domain/src/themes/plantage.rs` und Registry,
Fixture, `src/generated/themes/plantage.ts`, `index.html` (Schriften), `README.md`.

### Gestaltung je Szene

- **Grundlayout:** Mangofeld in Reihen, Mangobäume mit hängenden Mangos, Erdwege, Holzkisten und Leitern; Licht nach
  Tageszeit einstellbar. Kein Strand, kein Meer.
- **Der Streamer** ist der Mangopflücker: Figur mit Hut, Pflückstange und Korb auf Starting, BRB (pflückt) und Ending
  (Korb voll), Name aus `{channel}`.
- **Alerts:** Kisten-Etikett oder Erntezettel, Follow = "frisch gepflückt", Sub = "in die Kiste", Raid = "Erntehelfer".
- **Chat:** Notizen auf Erntezetteln oder Brettern am Baumstamm.
- **Kamera-Rahmen:** Holzkiste mit Plantagen-Stempel oder Blätterrahmen.
- **Musik:** Transistorradio auf einer Kiste.
- **Effekte, Befehlsseite:** im gleichen Stil.
- **Stinger:** eine Mango fällt vom Baum und füllt das Bild; **Banner:** Mangofeld mit Kanalnamen.
- **Minimes:** Mangos mit Gesicht, Helm und Waffe je Rolle (Sturmgewehr, Pistole und Sanitätstasche, LMG,
  Scharfschützengewehr, Granatwerfer); sie hüpfen mit der Hüpf-Bewegung des Kerns. Eigene Animationen (zielen, nachladen, Helm richten, umschauen,
  schlafen) plus Gefechte mit Saftspritzern und Kreuzchen-Augen.

### Acceptance Criteria

- [ ] AC1: Alle Szenen, Stinger und Banner im Plantagen-Look; kein fester Wert im Theme-Code (Regel-Skript).
- [ ] AC2: Minimes wählen Rollen per Befehl (Namen einstellbar), hüpfen und kämpfen nach [PLAN-MINIMES.md](../../../../plans/PLAN-MINIMES.md) Package 11.
- [ ] AC3: Schema in Rust und TS gleich (Fixture), `GET /api/themes` liefert es, das Formular entsteht daraus.
- [ ] AC4: Stinger und Banner rendern deterministisch (Checks mit aufzeichnendem Canvas).

### Tests (TDD)

1. `settings.check.ts`, `render.check.ts`, `stinger.check.ts`, `banners.check.ts`, Formen-Check der Mangos und Waffen.
2. Rust: Schema-Test gegen die Fixture.
3. Manuell: alle Szenen in der Vorschau mit `?demo`, Gefechte mit mehreren Demo-Minimes inklusive Medic.
