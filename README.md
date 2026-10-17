# RST - Rezondes Stream Tools

Werkzeuge für Streamer: Browserquellen für OBS, ein Dashboard und eine Befehlsseite für Zuschauer, im Look des
gewählten Themes (Standard, Matrix, Südfrucht).
Oberfläche mit React + Vite + TypeScript, dazu ein Server in Rust (`server-rs/`, Docker) für mehrere Streamer:
Twitch-Anmeldung, alle Events, verschlüsselte Profile und Backups.

## Start

```bash
npm install
npm run dev                  # http://localhost:5173
```

Das Dashboard unter `/` zeigt ohne Sitzung nur `[ MIT TWITCH ANMELDEN ]`, danach die Bereiche Übersicht, Theme, Trigger,
Medien, Verbindungen und Admin; jeder Bereich erscheint nur, wenn seine Funktion für den Streamer freigegeben ist, Admin nur
für Admins. Die Übersicht listet alle OBS-URLs mit Grösse, `[ KOPIEREN ]` und `[ TEST ]` (Szene mit Fake-Events, `?demo`).
Alle Texte des Dashboards stehen in `src/dashboard/texts.de.ts`, auch die Texte zu den Fehlercodes des Servers.

`npm run build` erzeugt in `dist/` eine HTML-Datei pro Szene (`starting.html`, `alerts.html`, ...), die der Server
unter `/s/<login>/` ausliefert. Einen Modus ohne Server gibt es nicht, denn Theme, Einstellungen und alle Live-Daten
kommen vom Server.

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

Jede Szene liegt unter `/s/<login>/<szene>` (z.B. `http://localhost:8089/s/rezondes/alerts`, mit `.html` geht es auch);
die Übersicht zeigt die fertigen URLs des angemeldeten Streamers. Sie enthalten den geheimen Overlay-Schlüssel (`?key=`),
ohne den eine Szene keine Live-Ereignisse bekommt; neu erzeugen lässt er sich in der Übersicht (danach OBS-Quellen neu
einrichten). Unter `npm run dev` wählt `?s=<login>` den Streamer.
Alle Szenen nehmen `?demo`. Live-Daten (auch der Chat) kommen nur vom Server; die Szenen verbinden sich nie
selbst mit dem Twitch-Chat.
Die Befehlsseite `/s/<login>/` zeigt Zuschauern alle Chat-Befehle im Stil des gewählten Themes (Liste als JSON unter
`/s/<login>/commands`); der Hilfe-Befehl (Standard `!befehle`, einstellbar in der Übersicht) antwortet im Chat als
Streamer mit der Kurzliste und dem Link. Dafür braucht die Twitch-Anmeldung den Scope `user:write:chat`.

## Server (Docker, mehrere Streamer)

Der Server liefert die Overlays aus, meldet Streamer per Twitch an, liest ihren Chat mit und schickt ihre Events live an
ihre Overlays. Jeder Streamer meldet sich im Dashboard mit Twitch an und bekommt ein eigenes Profil (Twitch- und
Spotify-Tokens, Einstellungen, Trigger, Medien, Minimes), eine eigene Laufzeit und eigene Overlay-URLs.

1. Auf https://dev.twitch.tv/console/apps eine App anlegen.
   OAuth Redirect URL: `PUBLIC_URL/auth/callback`, lokal `http://localhost:8089/auth/callback`. Client-Typ: Vertraulich.
2. `server.env.example` nach `server.env` kopieren, Client-ID, Client-Secret und `ADMINS` (dein Twitch-Login) eintragen.
3. Einen Hauptschlüssel erzeugen und als `RST_MASTER_KEY` in `server.env` eintragen:
   ```bash
   openssl rand -base64 32
   ```
   Eine Kopie davon gehört an einen sicheren Ort ausserhalb des Servers (siehe "Schlüssel und Verschlüsselung").
4. Starten:
   ```bash
   docker compose up -d --build
   ```
5. `http://localhost:8089` öffnen, `[ MIT TWITCH ANMELDEN ]` klicken, bei Twitch zustimmen.
   Die Daten liegen im Docker-Volume `tokens`, die Schlüssel im Volume `keys`; beide überleben Neustarts. Der Server prüft
   die Tokens stündlich und erneuert sie selbst; lehnt Twitch den Login ab, endet die Laufzeit des Streamers und er meldet
   sich neu an.
6. In OBS die Browserquellen auf die URLs aus der Übersicht stellen, z.B. `http://localhost:8089/s/<login>/alerts?key=<schlüssel>`.

Der Port (8089, in `docker-compose.yml` änderbar) ist nur auf diesem Rechner erreichbar (`127.0.0.1`). Client-Secret und Tokens bleiben im Server, nie im Browser.
Für den öffentlichen Betrieb mit eigener Domain siehe "Öffentlicher Betrieb (Caddy, HTTPS)".
Ohne Docker (Rust mit `rustup` und ffmpeg installiert): `npm run build`, dann `npm run server` (baut den Server und startet
`rst serve` mit den Werten aus `server.env`).
Läuft der Server, nutzt auch `npm run dev` dessen Anmeldung und Events (Proxy auf Port 8089 für `/s/`, `/api`, `/auth`, `/spotify`).

### Schlüssel und Verschlüsselung

- Jeder Streamer hat einen eigenen Datenschlüssel. Damit sind seine Tokens, Einstellungen, Trigger, Minimes, Medien und
  Render-Ergebnisse verschlüsselt; die Datenbank (`data.db`) und der Dateiordner sehen nur Chiffrat. Logins und
  Twitch-IDs stehen nirgends im Klartext, gesucht wird über HMAC-Werte.
- Die Datenschlüssel liegen im Schlüsselspeicher (`keys.db`, im Container `/keys/keys.db`), selbst verschlüsselt mit dem
  Hauptschlüssel `RST_MASTER_KEY`. Der Schlüsselspeicher liegt in einem eigenen Volume, damit eine Kopie der Daten
  nie die Schlüssel enthält.
- **Schlüsselverlust:** Ohne `RST_MASTER_KEY` und den Schlüsselspeicher sind alle Daten verloren, auch in jedem Backup.
  Es gibt keinen Weg zurück. Den Hauptschlüssel daher getrennt vom Server aufbewahren (Passwortmanager) und die
  Schlüssel-Backups (siehe unten) mitsichern.
- Ein Streamer, den ein Admin löscht, verliert seinen Datenschlüssel sofort. Alte Backups enthalten seine Daten danach nur
  noch als unlesbares Chiffrat und stellen ihn nicht wieder her.

### Umstieg vom alten Node-Server

Der alte Server legte die Profile unter `DATA/streamers/<login>/` ab (im selben Volume `tokens`). `rst import` übernimmt
sie verschlüsselt in Datenbank, Schlüsselspeicher und Dateiordner und meldet, was übernommen wurde:

```bash
docker compose run --rm overlays rst import --from /data
```

Trigger mit regulären Ausdrücken, die Rückverweise oder Lookarounds nutzen, laufen im neuen Server nicht mehr; der
Import nennt sie. Nach einem erfolgreichen Import können die alten Ordner unter `/data/streamers` gelöscht werden.

### Öffentlicher Betrieb (Caddy, HTTPS)

Auf einem Server (VPS) mit Domain läuft vor dem Server Caddy: es holt das Zertifikat automatisch
(Let's Encrypt), leitet HTTP auf HTTPS um und gibt die Live-Events (SSE) ungepuffert weiter (`Caddyfile`).
Der Server selbst hat dann keinen offenen Port mehr.

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

Update: `git pull`, dann denselben `docker compose ... up -d --build` wie beim Start. Die Daten in den Volumes bleiben,
offene Overlays verbinden sich nach dem Neustart selbst wieder.

### Backups

Admins verwalten Backups im Dashboard unter `[ ADMIN ]`:

- **Erstellen:** ein Backup ist ein ZIP mit allen Tabellen der Datenbank (Chiffrat bleibt Chiffrat), allen verschlüsselten
  Dateien und einem Manifest mit Prüfsummen. Es enthält keine Sitzungen und nie Schlüssel. Es entsteht im Hintergrund,
  immer nur eines zugleich, und liegt in `RST_BACKUPS` (Standard `/data/backups`).
- **Herunterladen, Hochladen, Löschen:** ein hochgeladenes Archiv zählt erst, wenn Manifest, Prüfsummen und alle Einträge
  passen; fremde oder manipulierte Archive lehnt der Server ab (`backup-invalid`).
- **Wiederherstellen:** stoppt alle Laufzeiten (Overlays antworten solange mit 503), ersetzt die Daten in einer
  Transaktion und startet die Laufzeiten neu. Streamer, deren Datenschlüssel fehlt (gelöscht), werden übersprungen und
  gemeldet.
- **Zeitplan:** automatische Backups sind standardmässig aus; einstellbar sind Abstand in Stunden und wie viele automatische
  Backups bleiben. Manuelle Backups löscht der Zeitplan nie.
- **Schlüssel-Backups:** einmal täglich legt der Server eine Kopie des Schlüsselspeichers in `RST_KEY_BACKUPS`
  (Docker: `/keys/backups`) ab und löscht Kopien nach 30 Tagen. Diese Grenze ist fest.

Jede Aktion steht im Audit-Log. Zum Wiederherstellen auf einem neuen Rechner braucht es das Backup, eine passende Kopie
des Schlüsselspeichers und denselben `RST_MASTER_KEY`. Zertifikate liegen im Volume `caddy_data`.

### Zugang und Funktionsstufen

- `ADMINS` (Komma-Liste in `server.env`) dürfen sich immer anmelden und haben jede Funktion, die nicht `off` ist.
- Den Rest regeln Admins im Dashboard unter `[ ADMIN ]` (gespeichert verschlüsselt auf dem Server); ohne Einstellung
  stehen nur die Admins in der Allowlist.
  - `registration`: `allowlist` (nur Logins aus `allowlist` und Admins, für den Beta-Start) oder `open` (jeder Twitch-Login).
  - `beta`: Logins, die zusätzlich Funktionen mit Stufe `beta` bekommen.
  - `features`: pro Funktion `off`, `beta` (nur Beta-Tester und Admins) oder `all`.
    `alerts` (EventSub-Alerts, Test-Alerts), `music` (Spotify), `triggers` und `fx` (Trigger und Medien; beide nötig),
    `chat` (Chat-Overlay), `stinger`, `banners`, `themes`, `minimes` (Chatter als Figuren, Szene `minimes`).
- Wer nicht freigeschaltet ist, landet nach der Twitch-Anmeldung wieder auf der Übersicht mit der Meldung "nicht freigeschaltet"; sein Token wird gleich widerrufen.
- Dort steht auch jedes Profil mit Zugang, Twitch-Verbindung, EventSub-Status und letzter Anmeldung; Admins können ein
  Profil endgültig löschen (Admins aus `ADMINS` ausgenommen).
  Verliert jemand den Zugang, stoppt seine Laufzeit sofort und seine Sitzungen enden; seine Overlays antworten danach mit 404.
  Änderungen wirken sofort: alle Laufzeiten starten neu, die Overlays verbinden sich selbst wieder.

### Adressen

| Pfad | Wer | Zweck |
|------|-----|-------|
| `/s/<login>/<szene>` (auch `.html`) | öffentlich | Overlay-Szene für OBS |
| `/s/<login>/status` | öffentlich | `{ login, live, spotify, features, channelId }` |
| `/s/<login>/settings` | öffentlich | gewähltes Theme und seine Einstellungen `{ theme, values }` |
| `/s/<login>/commands` | öffentlich | Chat-Befehle für die Befehlsseite |
| `/s/<login>/events` | mit `?key=` (Overlay) oder Sitzung (`?log`, Dashboard) | Server-Sent Events (`alert`, `music`, `fx`, `settings`, `minimes`, `minimeChat`, `chat`, `remove`), 403 ohne gültigen Schlüssel, 404 ohne laufende Laufzeit |
| `/s/<login>/media/<datei>` | öffentlich | Medien des Streamers (ohne Script-Ausführung) |
| `/auth/login`, `/auth/callback`, `POST /auth/logout` | alle | Anmeldung mit Twitch, Abmelden |
| `/api/me`, `POST /api/overlay-key`, `/api/test`, `/api/triggers`, `/api/trigger`, `/api/triggers/config`, `/api/media`, `/api/settings`, `/api/themes`, `/api/commands`, `/api/render/*`, `/spotify/*`, `POST /api/twitch/disconnect` | angemeldet | Dashboard; Login aus dem Sitzungs-Cookie, Funktionsstufe geprüft |
| `/api/admin/access`, `/api/admin/streamers`, `/api/admin/streamer?login=`, `/api/admin/audit` | Admins | Zugang, Profile, Löschen, Audit-Log |
| `/api/admin/backups`, `/api/admin/backup?id=`, `/api/admin/backups/upload`, `/api/admin/backup/restore?id=`, `/api/admin/backup-settings` | Admins | Backups und Zeitplan |

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

Der Server liest den Chat jedes Streamers anonym mit und schickt Nachrichten, gelöschte Nachrichten und Bans als Events.
Nachrichten glitchen rein und nach der eingestellten Zeit wieder raus. Zeigt Twitch-Emotes sowie die globalen und
Kanal-Emotes von 7TV, BetterTTV und FrankerFaceZ (im Browser geladen, alle 10 Minuten aufgefrischt).
Gelöschte Nachrichten und gebannte Nutzer verschwinden sofort.

### Themes und Einstellungen

Jeder Streamer wählt ein Theme und stellt dessen Werte ein (Funktionsstufe `themes`); Werte je Theme getrennt,
verschlüsselt im Profil. Regeln, Grenzen und Standardwerte der Felder kommen vom Server (`GET /api/themes`,
`server-rs/crates/rst-domain/src/themes`); `POST /api/settings` mit `{ theme, values }` prüft dagegen und speichert nur
fehlerfreie Eingaben, sonst kommt eine Liste `{ key, code }` zurück. Die Typen für die Oberfläche erzeugt
`npm run gen:types` nach `src/generated/`.

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
Die Liste und die gemerkten Farben und Früchte speichert der Server verschlüsselt im Profil (höchstens alle 2 s).

## Chat-Trigger

Der Server liest den Chat jedes angemeldeten Streamers mit (Funktionen `triggers` und `fx`). Passt eine Nachricht auf eine Regel,
spielt sein `fx.html` die Aktionen ab. Regeln und Medien liegen verschlüsselt im Profil.

Regeln bearbeitet man im Browser: `http://localhost:8089/#/triggers` (angemeldet, Bereich `[ TRIGGER ]` im Dashboard).
Dort Regeln anlegen, kopieren, löschen, Aktionen sortieren und Medien hochladen (max. 50 MB pro Datei, Bild/Video/Audio).
Der Bereich `[ MEDIEN ]` listet alle Dateien mit Grösse, Vorschau und den Triggern, die sie nutzen; Löschen fragt nach
(`DELETE /api/media?name=`). Alle Medien eines Streamers zusammen dürfen höchstens `MEDIA_LIMIT_MB` belegen (Standard 200),
darüber lehnt der Server Uploads mit `quota-exceeded` ab. Schreibende Anfragen (POST, DELETE) nimmt der Server nur von
der eigenen Herkunft an.
Speichern prüft alle Regeln; bei Fehlern werden sie angezeigt und nichts ändert sich. Gespeicherte Regeln gelten sofort.

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
| `when.type` | `word` (ganzes Wort), `contains`, `exact` (ganze Nachricht), `command` (Nachricht beginnt damit, z.B. `!lizard`), `regex` (ohne Rückverweise und Lookarounds) |
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

Auf der Übersicht gibt es für jede Regel einen Test-Knopf.

## Stinger und Twitch-Banner (Bereich `[ RENDERN ]`)

Der Bereich erscheint mit der Funktion `stinger` oder `banners`. Er zeigt Stinger (1920x1080), Profilbanner (1200x480)
und Offline-Banner (1920x1080) mit Vorschau und Zeitleiste, gezeichnet mit den gespeicherten Einstellungen des
Streamers (Theme `matrix`, Gruppen Stinger und Banner; Animation in `src/themes/matrix/stinger.ts` und `banners.ts`).
`[ RENDERN ]` schickt jeden Frame als PNG an den Server; die Frames liegen nur bis zum Ende des Renders unverschlüsselt in
einem temporären Ordner, ffmpeg baut daraus (höchstens 5 Minuten), das Ergebnis speichert der Server verschlüsselt:

- `stinger.webm`: VP9 mit Transparenz. In OBS: Szenenübergänge, `+`, Stinger, Videodatei wählen, Übergangspunkt wie im Dashboard angegeben (Standard 750 ms).
- `profile.gif` bzw. `offline.gif` als Endlosschleife und ein Standbild `.png`. Über 10 MB nimmt Twitch kein GIF an; das Dashboard weist darauf hin.

Pro Streamer läuft höchstens ein Render, mit höchstens 1200 Frames zu je 8 MB. ffmpeg steckt im Docker-Image;
ohne Docker muss `ffmpeg` im PATH liegen (oder `FFMPEG=/pfad/zu/ffmpeg`).

## OBS-Tipps

- Alerts: "Audio über OBS steuern" aktivieren, dann haben die Pieptöne einen eigenen Mixer-Kanal.
- "Quelle aktualisieren, wenn Szene aktiv wird" aktivieren bei starting/brb/ending, damit Countdown und Einschalt-Animation neu starten.

## Prüfungen

`npm run verify` prüft alles: Typen, ESLint, Regel-Skript, alle Checks mit Coverage-Grenzen, den Build und den
Rust-Server (`cargo fmt`, `clippy` ohne Warnungen, Tests). Läuft automatisch vor jedem Commit (`.githooks/pre-commit`,
aktiviert durch `npm install`). `npm run contract` startet den Server gegen nachgebaute Twitch- und Spotify-Dienste und
prüft alle Adressen (`contract/`). Die Regeln selbst stehen in [CODING-RULES.md](CODING-RULES.md).
