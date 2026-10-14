# REZONDES // Stream-Overlays

Browserquellen für OBS im Look des Portfolios (Schwarz, Phosphorgrün, Matrix-Regen, CRT).
React + Vite + TypeScript. Optional ein kleiner Node-Server (Docker) für Twitch-Login und alle Events.

## Start

```bash
npm install
cp .env.example .env.local   # Kanal eintragen
npm run dev                  # http://localhost:5173
```

Die Übersicht unter `http://localhost:5173` listet alle URLs. `[ TEST ]` öffnet die Szene mit Fake-Events (`?demo`).

Ohne Server: `npm run build` erzeugt in `dist/` pro Szene eine eigenständige HTML-Datei
(`starting.html`, `brb.html`, `ending.html`, `alerts.html`, `chat.html`, `cam.html`, `music.html`, `fx.html`, JS und CSS eingebettet).
In OBS bei der Browserquelle "Lokale Datei" anhaken und die Datei wählen.
Parameter gehen dann nur über das URL-Feld statt "Lokale Datei", z.B. `file:///F:/Code/RezondesStream/dist/alerts.html?sound=0`.
Nach Änderungen am Code oder an `.env.local` neu bauen.

## Szenen

| URL | Grösse | Optionen |
|-----|--------|----------|
| `#/starting` | 1920x1080 | `?min=5` oder `?at=20:00`, `?ticker=Text` |
| `#/brb` | 1920x1080 | `?ticker=Text` |
| `#/ending` | 1920x1080 | `?next=Freitag 20 Uhr`, `?ticker=Text` |
| `#/alerts` | 1920x1080 | `?duration=7`, `?scale=0.7`, `?sound=0`, `?volume=0.5` |
| `#/chat` | 500x900 | `?fade=30` (0 = nie), `?max=30` |
| `#/cam` | wie Kamera | `?label=REZONDES` |
| `#/music` | 900x240 | `?art=cover` / `record` / `vinyl` / `none`, `?hide=0` |
| `#/fx` | 1920x1080 | `?zone=main`, `?sound=0`, `?volume=0.5` |

Alle Szenen nehmen `?channel=name` (überschreibt Login bzw. `.env.local`) und `?demo`.
`music` und `fx` brauchen den Overlay-Server (Spotify bzw. Chat-Trigger laufen dort).

## Overlay-Server mit Twitch-Login (Docker)

Der Server liefert die Overlays aus, meldet sich per OAuth bei Twitch an und schickt alle Events live an die Overlays.

1. Auf https://dev.twitch.tv/console/apps eine App anlegen.
   OAuth Redirect URL: `http://localhost:8089/auth/callback`, Client-Typ: Vertraulich.
2. `server.env.example` nach `server.env` kopieren, Client-ID und Client-Secret eintragen.
3. Starten:
   ```bash
   docker compose up -d --build
   ```
4. `http://localhost:8089` öffnen, `[ MIT TWITCH VERBINDEN ]` klicken, bei Twitch zustimmen.
   Der Login liegt im Docker-Volume `tokens` und überlebt Neustarts; der Server erneuert ihn selbst.
5. In OBS die Browserquellen auf `http://localhost:8089/alerts.html`, `.../chat.html` usw. stellen.

Der Port (8089, in `docker-compose.yml` änderbar) ist nur auf diesem Rechner erreichbar (`127.0.0.1`). Client-Secret und Tokens bleiben im Server, nie im Browser.
Ohne Docker: `npm run build`, dann `npm run server` (liest `server.env`).
Läuft der Server, nutzt auch `npm run dev` dessen Login und Events (Proxy auf Port 8089).

| Event | mit Server | ohne Server (anonym) |
|-------|-----------|----------------------|
| Follow | ja | nein |
| Sub, Resub (mit Stufe) | ja | ja (ohne Stufe) |
| Gift-Subs | ja | ja |
| Bits | ja | ja |
| Raid | ja | ja |
| Kanalpunkte | ja | nein |
| Hype Train Start und Ende | ja | nein |

### Spotify (Overlay `music.html`)

1. Auf https://developer.spotify.com/dashboard eine App anlegen, API "Web API".
   Redirect URI: `http://127.0.0.1:8089/spotify/callback` (Spotify erlaubt kein `localhost`).
2. `SPOTIFY_CLIENT_ID` und `SPOTIFY_CLIENT_SECRET` in `server.env` eintragen, `docker compose up -d --build`.
3. Auf der Übersicht `[ MIT SPOTIFY VERBINDEN ]` klicken.

Das Overlay zeigt Titel, Interpret, Album, Fortschritt und das Cover in Phosphorgrün.
Ohne Cover (oder mit `?art=vinyl`) dreht sich eine ASCII-Schallplatte, mit `?art=record` füllt das Cover die ganze Platte und dreht sich mit. Bei Pause oder Stopp klappt es ein (`?hide=0` lässt es stehen).
Der Server fragt Spotify alle 3 Sekunden ab, aber nur solange ein Overlay offen ist.

### Chat-Overlay

Läuft immer anonym über Twitch-IRC. Nachrichten glitchen rein und nach `?fade=` Sekunden wieder raus.
Zeigt Twitch-Emotes sowie die globalen und Kanal-Emotes von 7TV, BetterTTV und FrankerFaceZ (alle 10 Minuten aufgefrischt).
Gelöschte Nachrichten und gebannte Nutzer verschwinden sofort.

## Chat-Trigger (`config/triggers.json`)

Der Server liest den Chat mit. Passt eine Nachricht auf eine Regel, spielt `fx.html` die Aktionen ab.
Datei speichern genügt, der Server lädt sie innerhalb von 2 Sekunden neu. Medien liegen in `config/media/`.

Bequemer im Browser: `http://localhost:8089/#/triggers` (Knopf `[ TRIGGER BEARBEITEN ]` auf der Übersicht).
Dort Regeln anlegen, kopieren, löschen, Aktionen sortieren und Medien hochladen (max. 50 MB, Bild/Video/Audio).
Speichern prüft alle Regeln; bei Fehlern werden sie angezeigt und die Datei bleibt unverändert.

```json
{
  "name": "lizard",
  "enabled": true,
  "when": { "type": "word", "match": "LIZARD" },
  "who": ["everyone"],
  "cooldown": 5,
  "userCooldown": 20,
  "do": [
    { "type": "media", "zone": "main", "image": "lizard.gif", "sound": "lizard.mp3", "volume": 0.8, "duration": 4, "position": "random", "size": 360 }
  ]
}
```

| Feld | Werte |
|------|-------|
| `when.type` | `word` (ganzes Wort), `contains`, `exact` (ganze Nachricht), `command` (Nachricht beginnt damit, z.B. `!lizard`), `regex` |
| `when.caseSensitive` | `true` / `false` (Standard) |
| `who` | `everyone`, `subscriber`, `vip`, `moderator`, `broadcaster`; Mods dürfen auch Sub-/VIP-Regeln, du immer |
| `cooldown`, `userCooldown` | Sekunden, global bzw. pro Zuschauer |
| `do[].type` | `media` (`image` = Bild/GIF/SVG, `video` = MP4/WebM, `sound`) oder `text` (`text` mit `{user}` und `{message}`) |
| `do[].zone` | welches Effekt-Overlay: `fx.html?zone=...`, Standard `main` |
| `do[].position` | `center`, `random` oder `{ "x": 50, "y": 20 }` in Prozent |
| `do[].size`, `duration`, `volume` | Breite in px, Sekunden, 0 bis 1 |
| `do[].delay` | Sekunden, die das Medium schon sichtbar ist, aber angehalten (erstes Bild); Ton startet erst danach |
| `do[].after` | Sekunden, die das Medium nach `duration` angehalten auf dem letzten Bild stehen bleibt, dann glitcht es raus |
| `do[].together` | `true`: erscheint gleichzeitig mit der vorherigen Aktion. Sonst laufen die Aktionen in `do` nacheinander (nächste nach `delay` + `duration` + `after`) |

Mitgeliefert sind `lizard.svg` und `lizard.wav` (selbst erstellt). Eigene Dateien einfach in `config/media/` legen und den Namen eintragen.
Auf der Übersicht gibt es für jede Regel einen Test-Knopf.

## Twitch-Banner

`http://localhost:5173/#/stinger` zeigt Stinger, Profilbanner (1200x480) und Offline-Banner (1920x1080) mit Vorschau.
`[ RENDERN ]` erzeugt `render/profile.gif` bzw. `render/offline.gif` (Endlosschleife, unter 10 MB) und ein Standbild als `.png`.

## Stinger-Übergang

Animation in `src/stinger.ts` (reine Funktion der Zeit). Vorschau mit Zeitleiste: `http://localhost:5173/#/stinger`.
`[ RENDERN ]` schickt jeden Frame an den Dev-Server, ffmpeg baut daraus `render/stinger.webm` (VP9 mit Transparenz).

Einmalig ffmpeg freischalten (npm blockiert den Download sonst):

```bash
npm install-scripts approve ffmpeg-static
npm rebuild ffmpeg-static
```

In OBS: Szenenübergänge, `+`, Stinger, Videodatei `render/stinger.webm`, Übergangspunkt `750` ms.

## OBS-Tipps

- Alerts: "Audio über OBS steuern" aktivieren, dann haben die Pieptöne einen eigenen Mixer-Kanal.
- "Quelle aktualisieren, wenn Szene aktiv wird" aktivieren bei starting/brb/ending, damit Countdown und Einschalt-Animation neu starten.

## Check

`npm run check` testet IRC-Parser und Emotes, die ASCII-Schallplatte und die Trigger-Regeln.
