---
name: theme-plan
description: Plant ein neues Overlay-Theme für RezondesStream. Aus Name, Farben, Referenzbildern und Erklärungen entstehen nach gezielten Rückfragen `src/themes/<id>/docs/DESIGN-<ID>.md` und `PLAN-<ID>.md`. Nutzen, wenn jemand ein neues Theme planen, entwerfen oder konzipieren will ("neues Theme", "Theme-Plan", "/theme-plan"). Nicht nutzen, um ein bestehendes Theme umzusetzen oder Code zu schreiben.
argument-hint: "<Name> [Farben] [Pfade zu Referenzbildern] [Erklärungen]"
---

# Neues Theme planen

Ergebnis sind zwei Dokumente und zwei Tabellenzeilen, **kein Code**: `src/themes/<id>/docs/DESIGN-<ID>.md`,
`src/themes/<id>/docs/PLAN-<ID>.md`, ein Eintrag in der Plan-Tabelle von `PLAN.md` und einer in der Theme-Tabelle von
`DESIGN.md`. Nichts implementieren, nichts committen. Die Dokumente sind deutsch, ohne Gedankenstrich (U+2014).

Der Plan muss sich abarbeiten lassen, ohne nochmal nachzudenken. Deshalb erst lesen, dann fragen, dann schreiben.

## 1. Eingabe sammeln

Der Nutzer liefert (in den Argumenten oder im Gespräch):

- **Name** (Pflicht): Anzeigename. Daraus eine id vorschlagen: nur Kleinbuchstaben, kurz, nicht schon als Ordner unter
  `src/themes/` vorhanden. Die id landet in den gespeicherten Einstellungen der Streamer und bleibt danach für immer.
- **Farben** (optional): Hex-Werte oder Beschreibungen. Jede Farbe bekommt später eine Rolle (siehe 4).
- **Referenzbilder** (optional): Pfade oder URLs. Jedes Bild mit dem Read-Werkzeug ansehen, nicht nur den Namen lesen.
- **Erklärungen** (optional): Charakter, Szenen, Figuren, Stimmung, was es nicht sein soll.

Fehlt der Name, nur danach fragen und warten.

## 2. Projekt lesen (immer, vor den Rückfragen)

Vor der ersten Suche im Code `graphify query "<Frage>"` ausführen (Regel aus `CLAUDE.md`), Rohdateien nur für die
Stellen lesen, die der Graph nennt. Pflichtlektüre:

- `THEMES.md`: Aufbau eines Themes, Kern-Bausteine je Szene, automatisch geprüfte Regeln, Checkliste.
- `DESIGN.md`: eine Entscheidung je Achse (Schrift, Farbe, Raum, Abschluss), Kontrastgrenzen, Dashboard-Skin.
- `CODING-RULES.md`: Regeln 16 bis 21 (Theme zeigt nur, Kern entscheidet; alles ist eine Einstellung; Clips sind
  reine Funktionen der Zeit), Commit-Grösse, Checks.
- `PLAN.md`, Abschnitt "Weitere Pläne": Regeln für Theme-Pläne und die Tabelle.
- Ein vorhandenes Theme als Vorlage für Form und Tiefe der Dokumente, am besten das jüngste
  (`src/themes/*/docs/DESIGN-*.md` und `PLAN-*.md`). Nur die Form übernehmen, nie im neuen Dokument darauf verweisen.
- Was der Kern schon kann: `src/core/` (Szenen-Bausteine, Minimes mit Typen, Fraktionen, Gefechten, Türmen, Hüpfen,
  festen Plätzen, Befehlsseite), damit der Plan vorhandene Bausteine nutzt statt neue zu erfinden.
- Schema-Spiegel in Rust: `server-rs/crates/rst-domain/src/themes/<id>.rs`, `themes/mod.rs`, `themes/registry.rs`,
  Fixture `server-rs/crates/rst-domain/tests/fixtures/<id>.json`, erzeugt `src/generated/themes/<id>.ts`
  (`npm run gen:types`).
- Geladene Schriften in `index.html` (Google Fonts).

Pfade, Funktionsnamen und Befehle im Plan müssen echt sein. Was nicht zu finden ist, wird eine Rückfrage.

## 3. Referenzbilder auswerten

Je Bild festhalten: was zu sehen ist, Bildsprache (Kontur ja/nein und Stärke, flach oder schattiert, wie viele
Schattentöne, Verläufe, Textur, Perspektive, Proportionen), wiederkehrende Formen, Stimmung.

**Farben messen, nicht schätzen.** Pillow liegt in den Benutzer-site-packages (`python -I` und `python -s` blenden es
aus); Skript im Scratchpad ablegen, nicht im Bildordner, und mit `python <skript> <bild>` laufen lassen:

```python
import sys
from PIL import Image
image = Image.open(sys.argv[1]).convert("RGB")
image.thumbnail((400, 400))
palette = image.quantize(colors=12).convert("RGB").getcolors(400 * 400)
for count, (red, green, blue) in sorted(palette, reverse=True):
    print(f"#{red:02x}{green:02x}{blue:02x}  {count}")
```

**Machbarkeit prüfen und offen sagen.** Themes zeichnen alles als SVG-Pfade im Code, gefärbt über Einstellungen
(`DESIGN.md`, "Formen statt Bilder"). Das trägt flache Grafik mit Kontur und wenigen Schattentönen gut. Es trägt
schlecht: detaillierte Illustrationen mit vielen Schattierungen, gemalte Figuren, Gesichter im Anime-Stil, Haare mit
Strähnen und Glanz. Aus einem flachen Bild lässt sich weder durch Nachzeichnen der Konturen noch durch ein Rig eine
bewegliche Figur in dieser Qualität gewinnen; dafür braucht es Zeichnungen in getrennten Ebenen (verdeckte Teile
mitgemalt) und ein Werkzeug wie den Live2D Cubism Editor, also Handarbeit ausserhalb des Codes. Wenn die Referenzen
in diese Richtung gehen, das vor dem Plan als Frage stellen (siehe 4), nicht stillschweigend vereinfachen.

**Kontraste rechnen**, nicht schätzen (Grenzen aus `DESIGN.md`: Text auf Fläche mindestens 4.5:1, Signatur gegen ihre
Fläche 3:1, Schrift auf der Signatur 4.5:1):

```python
def luminance(hex_color):
    channels = [int(hex_color.lstrip("#")[index:index + 2], 16) / 255 for index in (0, 2, 4)]
    linear = [value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4 for value in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]

def contrast(first, second):
    brighter, darker = sorted((luminance(first), luminance(second)), reverse=True)
    return (brighter + 0.05) / (darker + 0.05)
```

Eine Farbe, die ihre Grenze nicht schafft, wird heller oder dunkler vorgeschlagen, nicht trotzdem eingeplant.

## 4. Rückfragen

Alle Fragen gebündelt in **einer** Nachricht, nummeriert, nach Themen geordnet. Zu jeder Frage einen begründeten
Vorschlag mitgeben ("Ich würde X nehmen, weil ... Passt das?"), damit der Nutzer nur bestätigen muss. Nur fragen, was
den Plan ändert und sich nicht aus Code oder Eingabe beantworten lässt. Danach auf die Antwort warten; offene Punkte
in einer zweiten Runde klären. Keine Stilfragen, die für das Ergebnis egal sind.

Katalog (nur die offenen Punkte fragen):

1. **Name und id:** Anzeigename, vorgeschlagene id, Charakter in einem Satz.
2. **Treue zu den Referenzen:** Wie genau sollen die Bilder getroffen werden (Proportionen, Kontur, Detail)? Welche
   Vereinfachung ist in Ordnung? Gibt es die Bilder in Ebenen (PSD) oder als Vektor? Dürfen Bilder als Ganzes
   eingebunden werden (dann ist dort die Farbe nicht einstellbar)? Bei Figuren: welche Bewegung wird wirklich gebraucht
   (still, Blinzeln, Winken, Laufen)?
3. **Szenen und Clips:** welche Szenen (`starting`, `brb`, `ending`, `alerts`, `chat`, `cam`, `music`, `fx`, `info`,
   `minimes`) und Clips (`stinger`, `profile`, `offline`); fehlende bleiben leer, nichts wird geerbt. Je Szene der
   Inhalt und die Varianten zur Auswahl.
4. **Farben:** Zuordnung zu Rollen (Signatur für das, was man finden muss; zweiter Akzent; Text hell, dunkel,
   gedämpft; Flächen; Welt). Gemessene Farben aus den Bildern und Kontrastprobleme mit Gegenvorschlag nennen.
5. **Schrift:** höchstens zwei Familien, wo der Kontrast liegt; neue Google-Schriften werden in `index.html` geladen.
6. **Bewegung:** Auftritte, Grundanimationen, Einschalten der Vollbild-Szenen, wie lebendig insgesamt.
7. **Minimes:** ja oder nein; Farben oder Typen; Fraktionen, Gefechte, Türme, Hüpfen, feste Plätze (alles aus dem
   Kern); eigene Animationen und Reaktion auf Chat.
8. **Neue Funktionen:** Braucht das Theme etwas, das der Kern nicht kann? Dann wird das ein Kern-Plan in `plans/` und
   der Rust-Anteil ein Package in `RUST-PLAN.md`; der Theme-Plan verweist nur darauf (Regel aus `PLAN.md`).
9. **Töne:** eingebaute Töne (synthetisch über Web Audio) ja oder nein, Klangcharakter.
10. **Dashboard-Skin:** Szenerie hinter dem Dashboard ja oder nein, was darauf zu sehen ist.
11. **Texte:** Standardtexte und Sprüche je Szene, Sprache, Startwert beim ersten Login (`personalize`).
12. **Vorlage:** Ist das Theme einem bestehenden Werk nachempfunden (Serie, Spiel, Marke)? Dann eigene Namen und Formen
    und die Vorlage nirgends nennen (Dokumente, Code, Commits, Oberfläche).
13. **Referenzbilder ablegen:** ins Repo unter `src/themes/<id>/docs/refs/` kopieren (Vorschlag) oder nur den Pfad
    nennen.
14. **Package-Schnitt:** Vorschlag aus 6 mit Begründung; Packages über etwa 400 Zeilen nur als bewusste Ausnahme.
15. **Docs vor Code:** Liegt in `src/themes/<id>/` nur `docs/`, ist `src/themes/registry.check.ts` rot (jeder Ordner
    muss registriert sein), also `npm run verify` bis Package 1. Trotzdem dort ablegen (Vorschlag, wie bisher) oder
    Package 1 sofort anschliessen?

## 5. DESIGN-<ID>.md schreiben

Pfad `src/themes/<id>/docs/DESIGN-<ID>.md`, id in Grossbuchstaben im Dateinamen. Links zum Root brauchen
`../../../../`. Jede Entscheidung mit kurzem Warum, wo es nicht offensichtlich ist. Aufbau:

```markdown
# Design: <Name>

Charakter: <ein Satz>. Grundsätze für alle Themes: [DESIGN.md](../../../../DESIGN.md). Plan des Themes:
[PLAN-<ID>.md](PLAN-<ID>.md).

## Bildsprache
<Kontur, Flächen, Schattentöne, Verläufe, Textur, Perspektive, Proportionen; je Ebene (Figuren, Welt), wenn es
mehrere gibt. So genau, dass zwei Leute dasselbe zeichnen würden.>

## Figuren
<nur wenn es welche gibt: je Figur Wesen, Farben, Proportionen, Posen, Teile und Bewegung>

## Overlays
- **Farben (Standards in `settings.ts`):** jede Farbe mit Rolle und Hex-Wert; Zwischentöne per `color-mix`.
- **Kontraste (gerechnet):** jedes Paar mit Verhältnis.
- **Schrift:** Familien, Gewichte, wo der Kontrast liegt.
- **Flächen:** Karten, Schilder, Pillen, Schatten (eine Trennsprache).
- **Bewegung:** Auftritte, Grundanimationen, Einschalten.
- **Szenen:** je Szene Aufbau, Varianten, Standardwahl.
- **Minimes:** Typen oder Farben, Animationen, Reaktion.
- **Stinger:** Ablauf und was am Übergangspunkt alles deckt.
- **Banner:** Profil und Offline.

## Dashboard-Skin (`data-skin="<id>"`)
- **Schrift**, **Farbe** (Signatur, Hervorhebung, Fokus, Fehler, jeweils mit Kontrast), **Raum**, **Abschluss**,
  **Szenerie**.

## Im Code
`.theme-<id>`, Klassen `<präfix>-*`, Keyframes `<id>-*`, Dateien in `src/themes/<id>/`.
```

Referenzbilder werden in der Bildsprache genannt, mit dem, was aus ihnen genau übernommen wird.

## 6. PLAN-<ID>.md schreiben

Pfad `src/themes/<id>/docs/PLAN-<ID>.md`. Form wie die Plan-Packages (Ziel, Abhängigkeiten, betroffene Dateien,
Kontext, Acceptance Criteria, Tests nach TDD, Umsetzungsschritte, Out of Scope), dazu die Projektteile:

```markdown
# Plan: Theme "<Name>"

<Zwei bis drei Sätze: was das Theme ist.> Gestaltung: [DESIGN-<ID>.md](DESIGN-<ID>.md).

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`.
Regeln: [CODING-RULES.md](../../../../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../../../../THEMES.md), Übersicht
aller Pläne: [PLAN.md](../../../../PLAN.md).

## Überblick
| # | Package | Ziel in einem Satz | Abhängig von |

<Was parallel laufen kann und warum.>

## Annahmen
- **<Thema>** (entschieden <Datum>): <Entscheidung aus den Rückfragen>
```

**Schnitt der Packages** (Vorschlag, an das Theme anpassen):

1. **Bildsprache-Probe mit Abnahme** (immer zuerst, wenn das Theme Figuren oder eine gezeichnete Welt hat): eine
   Schlüsselszene oder Figur in der geplanten Technik, gerendert neben den Referenzbildern. Der Nutzer nimmt sie ab,
   bevor weitere Packages beginnen. Ohne Abnahme kein Weiterbauen.
2. **Grundlage und Vollbild-Szenen:** Schema in TS und Rust, Registrierung, Dashboard-Skin, Starting, BRB, Ending.
3. **Overlays:** Alerts, Chat, Kamera, Musik, Effekte, Befehlsseite.
4. **Stinger und Banner.**
5. **Minimes** (wenn gewünscht), danach je weiterem Kern-Feature ein Package.

Jedes Package enthält zusätzlich:

- **Gestaltung:** was je Szene zu sehen ist (aus der DESIGN-Datei konkretisiert).
- **Einstellungen:** Tabelle Gruppe zu Schlüsseln mit Standardwerten. Alles ist eine Einstellung, auch Verhalten
  (Texte, Farben, Grössen, Zeiten, Häufigkeiten, An/Aus, Befehle, Grenzen); fest im Code nur Formen und
  Server-Schutzgrenzen, markiert mit `fixed: <Grund>`.
- **Betroffene Dateien:** echte Pfade, inklusive Rust-Schema, Fixture, erzeugter Typen, `registry.ts`, `scenes.tsx`,
  `src/dashboard/skin.ts`, `skins.css`, `Scenery.tsx`, `index.html`, `README.md` und `DESIGN.md`, wo betroffen.
- **Tests:** konkrete `*.check.ts` mit Gegeben und Erwartet (Formen, Schema, Clips deterministisch).
- **Manuelle Checks:** Optik und Bewegung in der Vorschau `http://localhost:5173/<szene>.html?demo&preview`
  (Viewport 1600x900), mit Vergleich zu den Referenzbildern. Nach jedem Package mit sichtbarer Arbeit: Bilder zeigen
  und auf das OK warten.

Regeln für den Inhalt:

- Ein Theme importiert nur aus seinem Ordner und aus `src/core`. Der Plan verweist nie auf ein anderes Theme oder
  einen anderen Theme-Plan, nur auf Kern-Pläne und `RUST-PLAN.md`.
- Neue Funktionen liegen im Kern; ihr Plan ist ein Kern-Plan, ihr Rust-Anteil ein Package in `RUST-PLAN.md`.
- Commit je Package, nur nach Freigabe durch den Nutzer; Ausnahmen von der Commit-Grösse stehen im Plan.

## 7. Eintragen und abschliessen

- `PLAN.md`, Tabelle unter "Weitere Pläne": `| [src/themes/<id>/docs/PLAN-<ID>.md](src/themes/<id>/docs/PLAN-<ID>.md) | Theme <Name> |`
- `DESIGN.md`, Theme-Tabelle: `| \`<id>\` | [DESIGN-<ID>.md](src/themes/<id>/docs/DESIGN-<ID>.md) | <Charakter> (geplant) |`
  (Package 2 entfernt "(geplant)").
- Referenzbilder nach `docs/refs/` kopieren, wenn so entschieden, und in der DESIGN-Datei relativ verlinken.
- Prüfen: kein Gedankenstrich (`grep -nP '\x{2014}'` über die neuen Dateien), alle Links und Pfade existieren oder sind
  als neu markiert, kein Name einer Vorlage, kein Verweis auf ein anderes Theme.
- Dem Nutzer kurz sagen, welche Dateien entstanden sind und was Package 1 als Erstes zeigt. Nicht committen; fragen,
  ob er die Docs selbst committet oder ob committet werden soll.
