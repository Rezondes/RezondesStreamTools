# Plan: Alert-Dauer je Alert und Raid-Rudel im Kern

Heute hat jeder Alert dieselbe Dauer: `useAlerts(durationMs)` in `src/core/hooks/useAlerts.ts` hält jeden Alert gleich
lang und `alertTiming(durationMs)` in `src/core/overlayTiming.ts` rechnet Ausblenden und nächsten Alert daraus. Ein Raid,
bei dem für jeden Raider eine Figur durchs Bild läuft, braucht aber eine Dauer, die mit der Zahl der Raider wächst.
Dieser Plan macht die Dauer je Alert möglich und legt den Zeitplan des Raid-Rudels als reine Regel in den Kern, damit
jedes Theme ihn nutzen kann. Erster Nutzer ist das Theme Dogs.

Kern-Plan nach der Regel in [PLAN.md](../PLAN.md). Einen Rust-Anteil gibt es nicht: die Warteschlange der Alerts lebt
im Overlay, der Server liefert die Zahl der Raider schon heute in `amount` des Alerts.

Testbefehl: `npm test` (einzeln: `node <pfad>.check.ts`), Abschluss jedes Packages: `npm run verify`. Regeln:
[CODING-RULES.md](../CODING-RULES.md), Theme-Aufbau: [THEMES.md](../THEMES.md).

## Überblick

| # | Package | Ziel in einem Satz | Abhängig von |
|---|---------|--------------------|--------------|
| 1 | Dauer je Alert | `useAlerts` nimmt neben einer festen Dauer auch eine Funktion, die je Alert die Dauer liefert. | - |
| 2 | Raid-Rudel | `raidPack` plant für jeden Raider einen Lauf durchs Bild, mit höchstens N Läufen gleichzeitig. | - |

Beide Packages sind unabhängig und können parallel laufen (verschiedene Dateien).

## Annahmen

- **Kein Rust-Anteil** (entschieden 2026-10-21): Die Dauer und das Rudel entstehen im Overlay aus `alert.amount`.
- **Bestehende Themes bleiben gleich:** Wer weiter eine Zahl übergibt, merkt keinen Unterschied (gleiche Zeiten wie
  heute).
- **Alles einstellbar:** Höchstzahl gleichzeitig, Höchstzahl insgesamt, Laufzeit, Streuung und Spuren übergibt das
  Theme aus seinen Einstellungen; der Kern hat keine eigenen Zahlen ausser Schutzgrenzen mit `fixed: <Grund>`.
- **Schutzgrenze:** Die Dauer eines Alerts ist auf höchstens 30 Minuten begrenzt (`fixed: queue must keep moving`),
  damit ein fehlerhafter Wert die Warteschlange nicht blockiert.

---

## Package 1: Dauer je Alert

**Ziel:** `useAlerts` nimmt neben einer festen Dauer auch eine Funktion, die je Alert die Dauer liefert.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `src/core/hooks/useAlerts.ts`: Parameter `duration: number | ((alert: Alert) => number)`
- `src/core/overlayTiming.ts`: `alertDurationMs(duration, alert)` (rein, klemmt auf 1 ms bis 30 Minuten),
  `alertTiming` bleibt
- `src/core/overlayTiming.check.ts`: neue Gruppe
- `THEMES.md`: Zeile Alerts in der Tabelle der Kern-Bausteine ergänzen ("Dauer als Zahl oder je Alert")

### Kontext

`useAlerts` stellt Alerts in eine Warteschlange und setzt je Alert zwei Timer (`leaveAtMs`, `nextAtMs` aus
`alertTiming`). Die Funktion wird nur beim Start eines Alerts aufgerufen; ändert sie sich zwischendurch (neue
Einstellungen), gilt der neue Wert ab dem nächsten Alert. Damit die Timer nicht bei jedem Rendern neu starten, hängt der
Effekt am Alert und an der berechneten Dauer, nicht an der Identität der Funktion.

### Acceptance Criteria

- [ ] AC1: `alertDurationMs(5000, alert)` ergibt 5000; mit `alert => alert.amount * 100` und einem Raid mit `amount: 42`
      ergibt es 4200.
- [ ] AC2: Werte unter 1 werden 1, Werte über 30 Minuten werden 30 Minuten, `NaN` wird 1.
- [ ] AC3: Alle bestehenden Aufrufe mit einer Zahl bleiben unverändert und verhalten sich wie vorher.
- [ ] AC4 (manuell): In einem Theme mit Funktion bleibt ein Raid mit `amount: 100` sichtbar länger als ein Follow.

### Tests (TDD)

1. `src/core/overlayTiming.check.ts > "Dauer je Alert"` (AC1, AC2)
   - Gegeben: feste Zahl, Funktion über `amount`, Werte 0, -5, `NaN`, 3 600 000
   - Erwartet: 5000, 4200, 1, 1, 1, 1 800 000

### Umsetzungsschritte

1. Test schreiben, rot.
2. `alertDurationMs` in `overlayTiming.ts` mit Kommentar zum Vertrag.
3. `useAlerts` auf `duration: number | ((alert: Alert) => number)` umstellen, Dauer beim Start des Alerts berechnen,
   Effekt an Alert und berechnete Dauer hängen.
4. `THEMES.md` ergänzen, `npm run verify`.

### Out of Scope

- Eine Dauer, die sich während eines laufenden Alerts ändert.
- Server-seitige Begrenzung von Raids.

---

## Package 2: Raid-Rudel

**Ziel:** `raidPack` plant für jeden Raider einen Lauf durchs Bild, mit höchstens N Läufen gleichzeitig.

**Abhängigkeiten:** keine

**Betroffene Dateien:**
- `src/core/alerts/raidPack.ts`, `src/core/alerts/raidPack.check.ts` (neu)
- `THEMES.md`: Zeile Alerts ergänzen (`raidPack`, `runnersAt`)

### Kontext

Ein Theme zeigt bei einem Raid für jeden Raider eine Figur, die durchs Bild läuft. Damit die Szene auch bei 1000 Raidern
flüssig bleibt, dürfen höchstens `maxOnScreen` Figuren gleichzeitig laufen; ein grosser Raid dauert dafür länger. Der
Prototyp `src/themes/dogs/docs/refs/px-alert.html` zeigt die Regel: Abstand der Starts `crossMs / maxOnScreen`, jeder
Lauf kürzer als `crossMs`, also nie mehr als `maxOnScreen` gleichzeitig. Gemessen im Prototyp (Laufzeit 2.4 s):

| Raider | gelaufen | höchstens gleichzeitig (Grenze 12) | Dauer des Alerts |
|---|---|---|---|
| 5 | 5 | 5 | 8.2 s |
| 15 | 15 | 11 | 9.8 s |
| 50 | 50 | 12 | 16.8 s |
| 100 | 100 | 12 | 26.8 s |
| 500 | 500 | 12 | 106.8 s |
| 1000 | 1000 | 12 | 206.8 s |

Zufall (Spur, Tempo, Aussehen) kommt aus `hash` (`src/core/hash.ts`) mit einem Startwert, nie aus `Math.random`.

### API

```ts
type RaidPackOptions = { raiders: number; maxDogs: number; maxOnScreen: number; crossMs: number; speedSpread: number; lanes: number; seed: number };
type RaidRunner = { index: number; startMs: number; durationMs: number; lane: number; pick: number }; // pick: 0 bis 1, für das Aussehen
type RaidPack = { runners: RaidRunner[]; gapMs: number; endMs: number };
function raidPack(options: RaidPackOptions): RaidPack;
// nur laufende Läufe, gefunden über das Index-Fenster, nicht über alle
function runnersAt(pack: RaidPack, elapsedMs: number): { runner: RaidRunner; progress: number }[];
```

### Acceptance Criteria

- [ ] AC1: `runners.length` ist `min(raiders, maxDogs)`; bei 0 Raidern ist die Liste leer und `endMs` 0.
- [ ] AC2: Für 5, 15, 50, 100, 500 und 1000 Raider mit `maxOnScreen` 12 laufen zu keinem Zeitpunkt (Raster 2 ms) mehr
      als 12 gleichzeitig; mit `maxOnScreen` 1 und 20 gilt dasselbe für 1 und 20.
- [ ] AC3: Jeder Lauf ist kürzer als `crossMs` und endet spätestens bei `endMs`; Starts steigen streng.
- [ ] AC4: Gleiche Optionen ergeben dieselbe Liste; ein anderer `seed` ändert Spuren, Tempi und `pick`, nicht die
      Starts.
- [ ] AC5: `runnersAt` liefert genau die Läufe mit `startMs < elapsed < startMs + durationMs`, `progress` zwischen 0 und
      1, und prüft dabei höchstens `maxOnScreen + 2` Einträge.

### Tests (TDD)

1. `src/core/alerts/raidPack.check.ts > "Anzahl"` (AC1): 0, 3, 1000 mit `maxDogs` 300
2. `raidPack.check.ts > "Grenze gleichzeitig"` (AC2): die Tabelle oben plus Grenzen 1 und 20
3. `raidPack.check.ts > "Läufe"` (AC3)
4. `raidPack.check.ts > "deterministisch"` (AC4)
5. `raidPack.check.ts > "laufende"` (AC5): Zeitpunkte am Rand jedes Laufs

### Umsetzungsschritte

1. Tests schreiben, rot.
2. `raidPack` und `runnersAt` mit Kommentaren zum Vertrag.
3. `THEMES.md` ergänzen, `npm run verify`.

### Out of Scope

- Wie die Figuren aussehen und wo sie laufen (das Theme).
- Ein Rudel für andere Alert-Arten.
