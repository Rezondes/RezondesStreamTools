# Plan: Stream-Statistik im Kern

Der Server sieht jedes Ereignis eines Streams (Alerts über EventSub, Chatzeilen über IRC), zählt aber nichts. Neu zählt
er je Stream, was passiert ist (Follows, Abos, verschenkte Abos, Raids, Bits, Kanalpunkte, Hype Train, Chatzeilen,
Chatter), und schickt den Stand an die Overlays. Jedes Theme kann ihn zeigen; erster Nutzer ist das
Abnahmeprotokoll im Ending des Themes Dachdecker.

Kern-Plan nach der Regel in [PLAN.md](../PLAN.md). Der Rust-Anteil ist Package 52 in [RUST-PLAN.md](../RUST-PLAN.md);
dieser Plan beschreibt den TypeScript-Teil und verweist darauf.

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`, dazu
`npm run contract`. Regeln: [CODING-RULES.md](../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../THEMES.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Server zählt | Der Server zählt je Stream und schickt den Stand als SSE-Nachricht `stats` (RUST-PLAN Package 52). | - |
| 2 | Overlays lesen | Szenen lesen den Stand über einen Kern-Hook und formatieren Zeilen aus einer Einstellung, mit Demo-Werten. | 1 |

## Annahmen

- **Echte Zahlen im Kern** (entschieden 2026-10-21): Die Zählung liegt im Server, nicht im Theme; jedes Theme kann sie
  nutzen.
- **Was gezählt wird:** `follows`, `subs` (neue Abos und Resubs), `giftedSubs` (Summe verschenkter Abos), `raids`,
  `raiders` (Summe der Zuschauer aus Raids), `bits`, `redeems`, `hypeLevel` (höchstes erreichtes Level),
  `chatMessages`, `chatters` (verschiedene Chatter), `startedAt` (Beginn der Zählung, Millisekunden).
- **Nur manuell zurücksetzen** (entschieden 2026-10-21): Die Zählung läuft weiter, bis der Streamer sie im Dashboard
  zurücksetzt; weder Streamstart noch Streamende noch ein Neustart des Servers setzen sie zurück. `startedAt` ist der
  Zeitpunkt des letzten Zurücksetzens (vor dem ersten Zurücksetzen: das erste gezählte Ereignis).
- **Gespeichert** (entschieden 2026-10-21): Der Stand liegt verschlüsselt im Vault des Streamers (eigener Eintrag
  `stats` im Profil, wie die Minimes) und wird nach einem Ereignis höchstens alle 2 Sekunden gespeichert; beim Start der
  Laufzeit wird er geladen. Die Logins der Chatter liegen nur in diesem verschlüsselten Eintrag (für die Zahl
  verschiedener Chatter über einen Neustart hinweg) und werden nie ausgeliefert, nur ihre Anzahl. Löschen des Streamers
  löscht den Eintrag mit (Crypto-Shredding wie alle Profildaten).
- **Nachrichten an die Overlays:** neue `ServerMessage` `stats`, beim Verbinden sofort, danach bei jeder Änderung,
  höchstens alle 2 Sekunden (`fixed: Schutz des SSE-Streams bei vollem Chat`).
- **Zeilen sind Einstellungen:** Welche Zahlen ein Theme zeigt, in welcher Reihenfolge und mit welchem Text, steht in
  einer `lines`-Einstellung des Themes im Format `schlüssel|Text`; der Kern formatiert nur.

---

## Package 1: Server zählt

**Ziel:** Der Server zählt je Stream und schickt den Stand als SSE-Nachricht `stats`.

**Abhängigkeiten:** keine

Umgesetzt als [RUST-PLAN.md](../RUST-PLAN.md) Package 52 (Domäne, Laufzeit, Speichern im Vault, SSE, Zurücksetzen,
erzeugter Typ `src/generated/StreamStats.ts`). Hier ist nichts weiter zu tun; Package 2 beginnt erst, wenn Package 52 grün ist.

---

## Package 2: Overlays lesen

**Ziel:** Szenen lesen den Stand über einen Kern-Hook und formatieren Zeilen aus einer Einstellung, mit Demo-Werten.

**Abhängigkeiten:** Package 1 (RUST-PLAN Package 52)

**Betroffene Dateien:**
- `src/core/types.ts` (ändern: `StreamStats` aus `src/generated/StreamStats.ts` weitergeben, `ServerMessage` um `stats`)
- `src/core/connection.ts` (ändern: Handler `stats` in `events()`)
- `src/core/hooks/useStreamStats.ts` (neu): aktueller Stand oder `null`; in `?demo` die Demo-Werte
- `src/core/demo.ts` (ändern: `demoStats`)
- `src/core/stats/stats.ts`, `src/core/stats/stats.check.ts` (neu): `parseStatLines(text)` und
  `describeStats(stats, lines, locale, now)`
- `src/dashboard/Overview.tsx`, `src/dashboard/api.ts`, `src/dashboard/texts.de.ts` (ändern: Knopf "Statistik
  zurücksetzen" mit Aufruf von `POST /api/stats/reset`)
- `THEMES.md` (ändern: Tabelle der Kern-Bausteine um "Statistik: `useStreamStats`, `describeStats`")

### Kontext

`events()` in `src/core/connection.ts` verteilt jede SSE-Nachricht nach `type` an Handler; Hooks wie `useAlerts`
abonnieren sie. Der Server schickt beim Verbinden heute Musik und Minimes sofort
(`server-rs/crates/rst-server/src/handlers/events.rs`); Package 52 ergänzt `stats`.

### Acceptance Criteria

- [ ] AC1: `useStreamStats()` liefert nach der ersten `stats`-Nachricht den Stand und aktualisiert bei jeder weiteren;
      ohne Verbindung `null`; in `?demo` `demoStats`.
- [ ] AC2: `parseStatLines("follows|Neue Dachdecker\nbits|Bits")` ergibt zwei Zeilen in dieser Reihenfolge; unbekannte
      Schlüssel und leere Zeilen werden übersprungen; ohne `|` ist der Text der Schlüssel selbst.
- [ ] AC3: `describeStats(stats, lines, "de-DE", now)` formatiert Zahlen mit Tausenderpunkt (`1.284`) und für den
      Schlüssel `duration` die Zeit seit `startedAt` (`3:42 h`).
- [ ] AC4: Der Knopf im Dashboard setzt die Zählung zurück; danach zeigen offene Overlays 0.

### Tests (TDD)

1. `src/core/stats/stats.check.ts > "Zeilen lesen"` (AC2)
2. `stats.check.ts > "Zahlen und Dauer formatieren"` (AC3), mit fester Uhr als Parameter
3. Manuell (AC1, AC4): Overlay offen lassen, Test-Alert im Dashboard auslösen, Zahl steigt; zurücksetzen, Zahl 0.

### Umsetzungsschritte

1. Tests 1 und 2, rot; `stats.ts`, grün.
2. Typen, `connection.ts`, `useStreamStats.ts`, `demo.ts`.
3. Dashboard-Knopf und Text.
4. `npm run verify`, `npm run contract`.

### Out of Scope

- Verlauf früherer Zählungen; Anzeige in einem Theme (Theme-Pläne).
