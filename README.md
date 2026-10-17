# RST - Rezondes Stream Tools

Werkzeuge für Streamer: Browserquellen für OBS, ein Dashboard und eine Befehlsseite für Zuschauer, im Look des
gewählten Themes (Standard, Matrix, Südfrucht).
React + Vite + TypeScript. Dazu ein kleiner Node-Server (Docker) für mehrere Streamer: Twitch-Anmeldung und alle Events.

## Start

```bash
npm install
npm run dev                  # http://localhost:5173
```

Das Dashboard unter `/` zeigt ohne Sitzung nur `[ MIT TWITCH ANMELDEN ]`, danach die Bereiche Übersicht, Theme, Trigger,
Medien, Verbindungen und Admin; jeder Bereich erscheint nur, wenn seine Funktion für den Streamer freigegeben ist, Admin nur
für Admins. Die Übersicht listet alle OBS-URLs mit Grösse, `[ KOPIEREN ]` und `[ TEST ]` (Szene mit Fake-Events, `?demo`).
Alle Texte des Dashboards stehen in `src/dashboard/texts.de.ts`, auch die Texte zu den Fehlercodes des Servers.

`npm run build` erzeugt in `dist/` eine HTML-Datei pro Szene (`starting.html`, `alerts.html`, ...), die der Overlay-Server
unter `/s/<login>/` ausliefert. Einen Modus ohne Server gibt es nicht mehr, denn Theme und Einstellungen kommen vom Server.

## Szenen

| URL | Grösse | Optionen pro Quelle |
|-----|--------|----------|
| `#/starting` | 1920x1080 | `?min=5` oder `?at=20:00`, `?ticker=Text` |
| `#/brb` | 1920x1080 | `?ticker=Text` |
| `#/ending` | 1920x1080 | `?next=Freitag 20 Uhr`, `?ticker=Text` |
| `#/alerts` | 1920x1080 | `?sound=0`, `?volume=0.5` |
| `#/chat` | 500x900 | |
| `#/cam` | wie Kamera | |
| `#/music` | 900x240 | |
| `#/fx` | 1920x1080 | `?zone=main`, `?sound=0`, `?volume=0.5` |
| `#/minimes` | 1920x360 | `?demo=<n>` (so viele Demo-Minimes, Standard 5) |
| `#/info` | Seite | öffentliche Befehlsseite für Zuschauer, mit Server unter `/s/<login>/` |

Alles andere (Texte, Farben, Schrift, Dauer, Grösse, Position, Animationen, Töne, Darstellung der Musik, Ausblendzeit
des Chats, Kamera-Label, Countdown-Standard, Ticker) stellt der Streamer im Theme ein, siehe "Themes und Einstellungen".

Mit Server liegt jede Szene unter `/s/<login>/<szene>` (z.B. `http://localhost:8089/s/rezondes/alerts`, mit `.html` geht es auch);
die Übersicht zeigt die fertigen URLs des angemeldeten Streamers. Sie enthalten den geheimen Overlay-Schlüssel (`?key=`),
ohne den eine Szene keine Live-Ereignisse bekommt; neu erzeugen lässt er sich in der Übersicht (danach OBS-Quellen neu
einrichten). Unter `npm run dev` wählt `?s=<login>` den Streamer.
Alle Szenen nehmen `?demo`. Live-Daten (auch der Chat) kommen nur vom Overlay-Server; die Szenen verbinden sich nie
selbst mit dem Twitch-Chat.
Die Befehlsseite `/s/<login>/` zeigt Zuschauern alle Chat-Befehle im Stil des gewählten Themes (Liste als JSON unter
`/s/<login>/commands`); der Hilfe-Befehl (Standard `!befehle`, einstellbar in der Übersicht) antwortet im Chat als
Streamer mit der Kurzliste und dem Link. Dafür braucht die Twitch-Anmeldung den Scope `user:write:chat`.

## Overlay-Server (Docker, mehrere Streamer)

Der Server liefert die Overlays aus, meldet Streamer per Twitch an und schickt ihre Events live an ihre Overlays.
Jeder Streamer meldet sich im Dashboard mit Twitch an und bekommt ein eigenes Profil
(`data/streamers/<login>/`: Twitch-Tokens, Spotify, Trigger, Medien), eine eigene Laufzeit und eigene Overlay-URLs.

1. Auf https://dev.twitch.tv/console/apps eine App anlegen.
   OAuth Redirect URL: `PUBLIC_URL/auth/callback`, lokal `http://localhost:8089/auth/callback`. Client-Typ: Vertraulich.
2. `server.env.example` nach `server.env` kopieren, Client-ID, Client-Secret und `ADMINS` (dein Twitch-Login) eintragen.
3. Starten:
   ```bash
   docker compose up -d --build
   ```
4. `http://localhost:8089` öffnen, `[ MIT TWITCH ANMELDEN ]` klicken, bei Twitch zustimmen.
   Das Profil liegt im Docker-Volume `tokens` und überlebt Neustarts. Der Server prüft die Tokens stündlich und erneuert sie selbst;
   lehnt Twitch den Login ab, endet die Laufzeit des Streamers und er meldet sich neu an.
5. In OBS die Browserquellen auf die URLs aus der Übersicht stellen, z.B. `http://localhost:8089/s/<login>/alerts?key=<schlüssel>`.

Der Port (8089, in `docker-compose.yml` änderbar) ist nur auf diesem Rechner erreichbar (`127.0.0.1`). Client-Secret und Tokens bleiben im Server, nie im Browser.
Für den öffentlichen Betrieb mit eigener Domain siehe "Öffentlicher Betrieb (Caddy, HTTPS)".
Ohne Docker: `npm run build`, dann `npm run server` (liest `server.env`).
Läuft der Server, nutzt auch `npm run dev` dessen Anmeldung und Events (Proxy auf Port 8089 für `/s/`, `/api`, `/auth`, `/spotify`).

### Öffentlicher Betrieb (Caddy, HTTPS)

Auf einem Server (VPS) mit Domain läuft vor dem Overlay-Server Caddy: es holt das Zertifikat automatisch
(Let's Encrypt), leitet HTTP auf HTTPS um und gibt die Live-Events (SSE) ungepuffert weiter (`Caddyfile`).
Der Overlay-Server selbst hat dann keinen offenen Port mehr.

1. DNS: `A`/`AAAA`-Eintrag der Domain auf den Server; Ports 80 und 443 in der Firewall offen.
2. In `server.env` zusätzlich `DOMAIN=overlays.example.de` eintragen (ohne `https://`).
3. Redirect-URLs bei den Apps eintragen:
   - Twitch: `https://<DOMAIN>/auth/callback`
   - Spotify: `https://<DOMAIN>/spotify/callback`
4. Starten:
   ```bash
   docker compose --env-file server.env -f docker-compose.yml -f docker-compose.public.yml up -d --build
   ```
   `PUBLIC_URL` ist dann `https://<DOMAIN>`, das Sitzungs-Cookie `Secure`.

Backup: alle Daten liegen im Volume `tokens` (Profile, Zugang, Sitzungs-Schlüssel), Zertifikate im Volume `caddy_data`.
Sichern, z.B. täglich:

```bash
docker run --rm -v rezondesstream_tokens:/data -v "$PWD":/backup alpine tar czf /backup/tokens-backup.tgz -C /data .
```

Das Archiv enthält Tokens; es gehört an einen geschützten Ort. Zurückspielen mit `tar xzf` in das (leere) Volume.

Update: `git pull`, dann denselben `docker compose ... up -d --build` wie beim Start. Die Daten im Volume bleiben,
offene Overlays verbinden sich nach dem Neustart selbst wieder.

### Zugang und Funktionsstufen

- `ADMINS` (Komma-Liste in `server.env`) dürfen sich immer anmelden und haben jede Funktion, die nicht `off` ist.
- `data/access.json` regelt den Rest; ohne Datei stehen nur die Admins in der Allowlist.
  - `registration`: `allowlist` (nur Logins aus `allowlist` und Admins, für den Beta-Start) oder `open` (jeder Twitch-Login).
  - `beta`: Logins, die zusätzlich Funktionen mit Stufe `beta` bekommen.
  - `features`: pro Funktion `off`, `beta` (nur Beta-Tester und Admins) oder `all`.
    `alerts` (EventSub-Alerts, Test-Alerts), `music` (Spotify), `triggers` und `fx` (Chat-Listener, Trigger, Medien; beide nötig), `chat` (nur im Status), `stinger`, `banners`,
    `themes`, `minimes` (Chatter als Figuren, Szene `minimes`).
- Wer nicht freigeschaltet ist, landet nach der Twitch-Anmeldung wieder auf der Übersicht mit der Meldung "nicht freigeschaltet"; sein Token wird gleich widerrufen.
- Admins ändern das alles im Dashboard unter `[ ADMIN ]` (dahinter `GET` / `POST /api/admin/access`, JSON wie `access.json`).
  Dort steht auch jedes Profil mit Zugang, Twitch-Verbindung, EventSub-Status und letzter Anmeldung (`GET /api/admin/streamers`).
  Verliert jemand den Zugang, stoppt seine Laufzeit sofort; seine Overlays antworten danach mit 404.
  Änderungen wirken sofort: alle Laufzeiten starten neu, die Overlays verbinden sich selbst wieder.

### Adressen

| Pfad | Wer | Zweck |
|------|-----|-------|
| `/s/<login>/<szene>` (auch `.html`) | öffentlich | Overlay-Szene für OBS |
| `/s/<login>/status` | öffentlich | `{ login, live, spotify, features }` |
| `/s/<login>/settings` | öffentlich | gewähltes Theme und seine Einstellungen `{ theme, values }` |
| `/s/<login>/events` | mit `?key=` (Overlay) oder Sitzung (`?log`, Dashboard) | Server-Sent Events (`alert`, `music`, `fx`), 403 ohne gültigen Schlüssel, 404 ohne laufende Laufzeit |
| `/s/<login>/media/<datei>` | öffentlich | Medien des Streamers (ohne Script-Ausführung) |
| `/auth/login`, `/auth/callback`, `POST /auth/logout` | alle | Anmeldung mit Twitch, Abmelden |
| `/api/me`, `POST /api/overlay-key`, `/api/test`, `/api/triggers`, `/api/trigger`, `/api/triggers/config`, `/api/media`, `/spotify/*`, `POST /api/twitch/disconnect` | angemeldet | Dashboard; Login aus dem Sitzungs-Cookie, Funktionsstufe geprüft |
| `/api/admin/access` | Admins | Zugang und Funktionsstufen |
| `/api/admin/streamers` | Admins | Profile mit Status |


### Spotify (Overlay `music.html`)

1. Auf https://developer.spotify.com/dashboard eine App anlegen, API "Web API".
   Redirect URI: lokal `http://127.0.0.1:8089/spotify/callback` (Spotify erlaubt kein `localhost`), öffentlich `PUBLIC_URL/spotify/callback`.
2. `SPOTIFY_CLIENT_ID` und `SPOTIFY_CLIENT_SECRET` in `server.env` eintragen, `docker compose up -d --build`.
3. Jeder Streamer klickt im Dashboard unter Verbindungen `[ MIT SPOTIFY VERBINDEN ]` (Funktion `music`).
   Solange die Spotify-App im Entwicklungsmodus ist, muss jedes Spotify-Konto dort als Nutzer eingetragen sein.

Das Overlay zeigt Titel, Interpret, Album, Fortschritt und das Cover in Phosphorgrün.
Ohne Cover (oder mit der Darstellung `vinyl`) dreht sich eine ASCII-Schallplatte, mit `record` füllt das Cover die ganze Platte und dreht sich mit. Bei Pause oder Stopp klappt es ein (abschaltbar in den Einstellungen).
Der Server fragt Spotify alle 3 Sekunden ab, aber nur solange ein Overlay des Streamers offen ist.

### Chat-Overlay

Läuft immer anonym über Twitch-IRC. Nachrichten glitchen rein und nach der eingestellten Zeit wieder raus.
Zeigt Twitch-Emotes sowie die globalen und Kanal-Emotes von 7TV, BetterTTV und FrankerFaceZ (alle 10 Minuten aufgefrischt).
Gelöschte Nachrichten und gebannte Nutzer verschwinden sofort.

### Themes und Einstellungen

Jeder Streamer wählt ein Theme und stellt dessen Werte ein (Funktionsstufe `themes`). Gespeichert in
`data/streamers/<login>/settings.json` als `{ theme, values: { <theme-id>: { ... } } }`, Werte je Theme getrennt.
`POST /api/settings` mit `{ theme, values }` prüft gegen das Schema des Themes (`src/themes/<id>/settings.ts`)
und speichert nur fehlerfreie Eingaben; sonst kommt eine Liste `{ key, code }` zurück.

Im eingebauten Theme `matrix` ist jeder sichtbare und hörbare Wert eine Einstellung (Farben, Schrift, Logo, Regen,
Texte und Terminal-Zeilen der Szenen, Alert-Texte je Art mit `{user}`, `{amount}`, `{detail}`, `{text}`, Töne je Alert-Art,
Chat, Kamera, Musik, Effekte, Stinger, Banner); die Standardwerte ergeben den bisherigen Look. Terminal-Zeilen können
Vertipper enthalten: `{del 4}` löscht 4 Zeichen, `{pause 900}` wartet 900 ms, `{smash 18}` haut auf die Tastatur.
Der Theme-Code selbst enthält keine festen Farben, Texte oder Masse; das prüft `scripts/rules.check.ts`.

Im Dashboard (Bereich `[ THEME ]`) entsteht das Formular automatisch aus dem Schema, gruppiert und mit
Zurücksetzen je Feld oder für alles. Die Vorschau zeigt die gewählte Szene als `iframe` mit den noch nicht
gespeicherten Werten (`/s/<login>/<szene>?demo&preview`, Werte per `BroadcastChannel` nur von derselben Herkunft, auch in einem eigenen Tab).
Die Theme-Auswahl zeigt ein Theme nur zum Ansehen und Bearbeiten; die Overlays stellt erst `[ ALS AKTIVES THEME SETZEN ]`
um (so lassen sich andere Themes auch während des Streams anschauen). Fehler beim Speichern erscheinen am jeweiligen Feld.

Eingebaut sind `standard` (das Standard-Theme: klarer, moderner Look mit Verlauf, abgerundeten Karten und eigener
Schrift; alle Szenen, Stinger und Banner eigenständig), `matrix` (Terminal-Look) und `suedfrucht`
(Südfrucht: tropischer Strand mit Meer, Wellen, Palmen und Holzschildern; Tageszeit je Szene, Alerts als Postkarte,
Surfbrett oder Flaschenpost, Chat als Luftblasen, Planken oder Muscheln, Rahmen aus Bambus, Holz oder Seil,
Strandradio, Wellen-Stinger, Strand-Banner und hüpfende Frucht-Minimes). Wie man ein eigenes Theme baut, steht in [THEMES.md](THEMES.md).

## Minimes (Szene `minimes`)

Chatter klinken sich per Chatbefehl als kleine Figur ein, die unten im Bild schwebt, hin und her wandert, ihren Namen
über dem Kopf trägt und zufällige Animationen zeigt. Im Theme `matrix` ist das ein Neon-Geist im Kapuzenpulli, ohne
Beine, getragen von einer Düse aus fallenden Glyphen (Backflip, Glitch, Umschauen, Drehen, Schlafen, Blinzeln;
Hüpfer mit Düsen-Boost, wenn der Chatter schreibt). Im Theme `suedfrucht` sind es Cartoon-Früchte mit Gesicht, die
über den Strand hüpfen (Freudensprünge, Pirouette, Wackeln, Sonnenbrille, Umschauen, Schlafen; Saftspritzer, wenn der
Chatter schreibt). Minimes sind eine Funktion des Themes: `standard` hat keine, dort bleibt die Szene leer und der Server
ignoriert die Befehle.

| Befehl (Standard, einstellbar) | Wirkung |
|---|---|
| `!join` oder `!join <farbe>` | einklinken, optional mit Farbe |
| `!color <farbe>` | Farbe ändern; klinkt auch ein (abschaltbar) |
| `!leave` | raus; Mods (Rolle einstellbar) werfen mit `!leave @name` ein fremdes Minime raus |

In `suedfrucht` wählen Chatter statt einer Farbe eine Frucht: `!join` gibt eine zufällige erlaubte Frucht,
`!join mango` eine Mango, `!frucht karambole` wechselt zur Sternfrucht. 16 Früchte (Mango, Sternfrucht, Papaya,
Ananasguave, Nashi-Birne, Birnenmelone, Kaktusfeige, Durian, Zitrone, Ananas, Kokosnuss, Drachenfrucht, Maracuja,
Banane, Litschi, Wassermelone); die Namen im Chat sind je Frucht einstellbar (Gruppe "Minimes: Typen", leer = Frucht
aus), Gross- und Kleinschreibung, Umlaute und Leerzeichen zählen nicht ("Asiatische Birne" = "asiatischebirne").
Farben je Frucht stehen in "Früchte: Farben".

Farben: `#ff00aa`, `ff00aa`, `#f0a`, `255 0 170`, `255,0,170` oder `rgb(255, 0, 170)`. Zu dunkle Farben werden bis zur
eingestellten Mindesthelligkeit aufgehellt; ohne eigene Farbe gilt die Twitch-Namensfarbe (abschaltbar), sonst die
Standardfarbe des Themes. Ungültige Eingaben werden ignoriert, der Server kann nicht im Chat antworten.

Alles Verhalten ist im Theme einstellbar (Gruppen "Minimes: Befehle", "Minimes: Regeln", "Minimes: Bewegung",
im Matrix-Theme dazu "Minimes: Aussehen" und "Minimes: Animationen"): Befehlswörter, wer einklinken und rauswerfen darf,
Höchstzahl und was bei voller Liste passiert, Verschwinden nach Minuten ohne Nachricht, Abklingzeit für Farbwechsel,
Reaktion auf Chat, Leeren bei Streamende (`stream.offline`) und bei Ban oder Timeout, Tempo, Laufweite und Häufigkeiten.
Die Liste und die gemerkten Farben und Früchte stehen in `data/streamers/<login>/minimes.json` (höchstens alle 2 s
geschrieben).

## Chat-Trigger (`triggers.json` im Profil)

Der Server liest den Chat jedes angemeldeten Streamers mit (Funktionen `triggers` und `fx`). Passt eine Nachricht auf eine Regel,
spielt sein `fx.html` die Aktionen ab. Regeln stehen in `data/streamers/<login>/triggers.json`, Medien in `data/streamers/<login>/media/`.
Datei speichern genügt, der Server lädt sie innerhalb von 2 Sekunden neu.

Bequemer im Browser: `http://localhost:8089/#/triggers` (angemeldet, Bereich `[ TRIGGER ]` im Dashboard).
Dort Regeln anlegen, kopieren, löschen, Aktionen sortieren und Medien hochladen (max. 50 MB pro Datei, Bild/Video/Audio).
Der Bereich `[ MEDIEN ]` listet alle Dateien mit Grösse, Vorschau und den Triggern, die sie nutzen; Löschen fragt nach
(`DELETE /api/media?name=`). Alle Medien eines Streamers zusammen dürfen höchstens `MEDIA_LIMIT_MB` belegen (Standard 200),
darüber lehnt der Server Uploads mit `quota-exceeded` ab. Schreibende Anfragen (POST, DELETE) nimmt der Server nur von
der eigenen Herkunft an.
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

Eigene Dateien im Editor hochladen oder in den Medienordner des Profils legen und den Namen eintragen.
Auf der Übersicht gibt es für jede Regel einen Test-Knopf.

## Stinger und Twitch-Banner (Bereich `[ RENDERN ]`)

Der Bereich erscheint mit der Funktion `stinger` oder `banners`. Er zeigt Stinger (1920x1080), Profilbanner (1200x480)
und Offline-Banner (1920x1080) mit Vorschau und Zeitleiste, gezeichnet mit den gespeicherten Einstellungen des
Streamers (Theme `matrix`, Gruppen Stinger und Banner; Animation in `src/themes/matrix/stinger.ts` und `banners.ts`).
`[ RENDERN ]` schickt jeden Frame als PNG an den Server, ffmpeg baut daraus in `DATA/streamers/<login>/render/`:

- `stinger.webm`: VP9 mit Transparenz. In OBS: Szenenübergänge, `+`, Stinger, Videodatei wählen, Übergangspunkt wie im Dashboard angegeben (Standard 750 ms).
- `profile.gif` bzw. `offline.gif` als Endlosschleife und ein Standbild `.png`. Über 10 MB nimmt Twitch kein GIF an; das Dashboard weist darauf hin.

Pro Streamer läuft höchstens ein Render, mit höchstens 1200 Frames zu je 8 MB. ffmpeg steckt im Docker-Image;
ohne Docker muss `ffmpeg` im PATH liegen (oder `FFMPEG=/pfad/zu/ffmpeg`).

## OBS-Tipps

- Alerts: "Audio über OBS steuern" aktivieren, dann haben die Pieptöne einen eigenen Mixer-Kanal.
- "Quelle aktualisieren, wenn Szene aktiv wird" aktivieren bei starting/brb/ending, damit Countdown und Einschalt-Animation neu starten.

## Prüfungen

`npm run verify` prüft alles: Typen, ESLint, Regel-Skript, alle Checks mit Coverage-Grenzen und den Build.
Läuft automatisch vor jedem Commit (`.githooks/pre-commit`, aktiviert durch `npm install`).
Die Regeln selbst stehen in [CODING-RULES.md](CODING-RULES.md).
