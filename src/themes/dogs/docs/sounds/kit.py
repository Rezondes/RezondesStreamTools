"""Sound set of the Dogs theme (proposal only): every event as a layered take of earshot bank sounds and the dog
voices found by search.py (out/best-*.wav). Each event is trimmed, matched to the same loudness, written to
out/kit/<event>.wav and .ogg, described by earshot, and gathered on the listening page dogs-sounds.html.
Run (ffmpeg on PATH): python kit.py
"""
import base64
import html
import json
import pathlib
import subprocess

import numpy as np
import pyloudnorm
import soundfile as sf

from earshot.forge import bank, fx, knobs

SR = 48000
HERE = pathlib.Path(__file__).parent
OUT = HERE / "out"
KIT = OUT / "kit"
KIT.mkdir(parents=True, exist_ok=True)
_cache = {}


def take(sound_id, pitch=None, dur=None, seed=None):
    key = (sound_id, pitch, dur, seed)
    if key not in _cache:
        if sound_id.startswith("voice:"):
            y, _ = sf.read(OUT / f"best-{sound_id[6:]}.wav", dtype="float64")
            if pitch:  # pitch as a factor: resample (shorter and higher, like a smaller dog)
                y = np.interp(np.arange(0, len(y), pitch), np.arange(len(y)), y)
        else:
            try:
                y, _ = bank.render(sound_id, seed=seed, dur=dur, pitch=pitch, checks=False)
            except knobs.KnobError:
                y, _ = bank.render(sound_id, seed=(seed or 0) + 5, dur=dur, checks=False)
        _cache[key] = y.mean(axis=1) if y.ndim == 2 else y
    return _cache[key]


def L(at, sound_id, db=0.0, pitch=None, dur=None, seed=None):
    return (at, sound_id, db, pitch, dur, seed)


def mix(layers, room=0.12):
    parts = [(int(at * SR), take(sid, pitch, dur, seed) * 10 ** (db / 20)) for at, sid, db, pitch, dur, seed in layers]
    y = np.zeros(max(s + len(p) for s, p in parts) + int(0.25 * SR))
    for s, p in parts:
        y[s:s + len(p)] += p
    if room:
        wet = fx.reverb(y, np.random.default_rng(3), rt60=0.4, size=0.25, damp=0.6, wet=room, dry=1.0, ir_seed=3)
        y = np.asarray(wet, np.float64)
        y = y.mean(axis=1) if y.ndim == 2 else y
    return y


def paws(count, step, start=0.0, db=-6.0, seed=20):
    """paw patter: alternating soft taps, every second one a little lower"""
    return [L(start + i * step, "pro_tap/soft", db - (i % 2) * 3, None, None, seed + i) for i in range(count)]


def bounces(sound_id, times, db=0.0, pitch=None):
    """a toy hopping: the same hit ever quieter"""
    return [L(at, sound_id, db - i * 6, pitch, None, 30 + i) for i, at in enumerate(times)]


BOUNCE = [0, 0.22, 0.38, 0.49]
EVENTS = {
    # Starting
    "starting/land": ("Hund landet auf dem Kissen (je Rasse höher oder tiefer)", [L(0, "ui_pop/soft", 0), L(0.01, "pro_tap/soft", -6)]),
    "starting/hop": ("Marker hüpft zum nächsten Hund", [L(0, "pro_pop/boop", -2, "E5"), L(0.02, "swish/flick", -16)]),
    "starting/chosen": ("Marker landet auf dem Hund, Herzen platzen", [L(0, "mallet/flourish", -2), L(0.05, "drip/plink", -8), L(0.14, "drip/plink", -10, None, None, 3), L(0.22, "drip/tiny", -12)]),
    "starting/card": ("Karte 'Heute an meiner Seite' fährt ein", [L(0, "swish/soft", -8), L(0.12, "ui_pop/wide", -2), L(0.14, "mallet/celesta", -8, "G5")]),
    # Alerts
    "alert/run": ("Hund rennt herein (Pfoten)", paws(8, 0.075)),
    "alert/toy-ball": ("Ball fällt und hüpft", bounces("drip/bloop", BOUNCE, -1)),
    "alert/toy-bone": ("Knochen fällt und hüpft", bounces("knock/wood", BOUNCE[:3], -1)),
    "alert/toy-frisbee": ("Frisbee landet", [L(0, "swish/zing", -6), L(0.18, "knock/plastic", -1), L(0.3, "knock/plastic", -9)]),
    "alert/toy-treat": ("Leckerli fällt", bounces("knock/desk", BOUNCE[:2], -3)),
    "alert/bark-small": ("Wuff! klein (Mops, Dackel, Corgi)", [L(0, "voice:bark-small", 0), L(0.32, "voice:bark-small", -2, 1.05)]),
    "alert/bark-medium": ("Wuff! mittel (Shiba)", [L(0, "voice:bark-medium", 0), L(0.4, "voice:bark-big", -4)]),
    "alert/bark-big": ("Wuff! gross (Labrador, Dalmatiner)", [L(0, "voice:bark-big", 0), L(0.42, "voice:bark-big", -2, 1.04)]),
    "alert/card": ("Karte springt ein", [L(0, "ui_pop/wide", -1), L(0.03, "mallet/glock", -8, "C6"), L(0.11, "mallet/glock", -10, "G6")]),
    "alert/leave": ("Spielzeug aufheben, hinausrennen", [L(0, "drip/tiny", -6)] + paws(6, 0.065, 0.12, -8) + [L(0.2, "whoosh_fast/tight", -10)]),
    "alert/raid": ("Raid: Rudel trappelt vorbei, Bellen im Chor", paws(24, 0.05, 0, -9) + paws(24, 0.05, 0.025, -12, 60)
                   + [L(0.1, "voice:bark-small", -6), L(0.45, "voice:bark-big", -5), L(0.7, "voice:bark-medium", -7), L(0.95, "voice:bark-small", -8, 1.08)]),
    # BRB
    "brb/sniff": ("Schnüffeln beim Gassi", [L(0, "voice:sniff", 0)]),
    "brb/steps": ("Leise Schritte (optional)", paws(6, 0.16, 0, -10)),
    # Ending
    "ending/lie": ("Hund legt sich ins Körbchen", [L(0, "swipe/velvet", -6), L(0.32, "knock/desk", -12), L(0.34, "pro_tap/soft", -8)]),
    "ending/lamp": ("Lampe wird gedimmt", [L(0, "toggle/off", -4)]),
    "ending/snore": ("Schnarchen (leise, als Schleife)", [L(0, "voice:snore", 0)]),
    # Stinger
    "stinger/in": ("Fläche wischt herein, Pfoten ploppen", [L(0, "swipe/glide", -4)] + [L(0.1 + i * 0.07, "pro_pop/thup", -10 - (i % 3) * 2, None, None, 40 + i) for i in range(8)]),
    "stinger/badge": ("Plakette mit Namen am Schnitt", [L(0, "mallet/up4", -2), L(0.05, "voice:whine", -10)]),
    "stinger/out": ("Fläche rollt weg", [L(0, "whoosh_fast/whip", -3), L(0.1, "ui_pop/fall", -10)]),
    # Minimes
    "minimes/bark": ("Minime bellt", [L(0, "voice:bark-small", 0)]),
    "minimes/sniff": ("Minime schnüffelt", [L(0, "voice:sniff", -2)]),
    "minimes/wag": ("Minime wedelt (Chat)", [L(0, "swish/soft", -8), L(0.12, "swish/soft", -10, None, None, 2)]),
}

TARGET = -20.0  # fixed: loudness of every event for the comparison (LUFS)
meter = pyloudnorm.Meter(SR, block_size=0.2)


def finish(y):
    peak = np.max(np.abs(y)) + 1e-12
    env = np.convolve(np.abs(y) / peak, np.ones(480) / 480, "same")
    last = np.nonzero(env > 10 ** (-48 / 20))[0]
    y = y[: (last[-1] + int(0.05 * SR)) if len(last) else len(y)]
    fade = min(int(0.03 * SR), len(y) // 4)
    y[-fade:] *= np.linspace(1, 0, fade)
    padded = np.concatenate([y, np.zeros(max(0, int(0.5 * SR) - len(y)))])
    y = y * 10 ** ((TARGET - meter.integrated_loudness(padded)) / 20)
    return y * min(1, 0.89 / (np.max(np.abs(y)) + 1e-12))


def main():
    from earshot.describe import describe

    rows = []
    for event, (label, layers) in EVENTS.items():
        y = finish(mix(layers))
        wav = KIT / f"{event.replace('/', '-')}.wav"
        sf.write(wav, y.astype(np.float32), SR)
        ogg = wav.with_suffix(".ogg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-c:a", "libvorbis", "-q:a", "5", str(ogg)], check=True)
        heard = describe(str(wav), top=3)
        rows.append({"event": event, "label": label, "file": ogg.name, "kb": round(ogg.stat().st_size / 1024, 1),
                     "seconds": round(len(y) / SR, 2), "heard": heard["summary"],
                     "layers": [sid + (f" {pitch}" if pitch else "") for _, sid, _, pitch, _, _ in layers]})
        print(event, "|", heard["summary"][:140], flush=True)
    (OUT / "kit.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")
    page(rows)


def page(rows):
    voices_file = OUT / "voices-search.json"
    voices = json.loads(voices_file.read_text(encoding="utf-8")) if voices_file.exists() else {}
    titles = {"starting": "Starting", "alert": "Alerts", "brb": "BRB", "ending": "Ending", "stinger": "Stinger", "minimes": "Minimes"}
    groups = {}
    for row in rows:
        groups.setdefault(row["event"].split("/")[0], []).append(row)
    parts = []
    for group, items in groups.items():
        parts.append(f"<h2>{titles[group]}</h2>")
        for row in items:
            data = base64.b64encode((KIT / row["file"]).read_bytes()).decode()
            parts.append(
                f"<div class='row'><div class='name'>{html.escape(row['label'])}<small>{row['event']} · {row['seconds']} s · {row['kb']} KB</small></div>"
                f"<audio controls preload='none' src='data:audio/ogg;base64,{data}'></audio>"
                f"<div class='meta'><b>Bausteine:</b> {html.escape(', '.join(row['layers']))}<br><b>earshot hört:</b> {html.escape(row['heard'][:260])}</div></div>")
    if voices:
        parts.append("<h2>Hundestimmen (Suche, von earshot bewertet)</h2>")
        for kind, info in voices.items():
            data = base64.b64encode((OUT / f"best-{kind}.ogg").read_bytes()).decode()
            parts.append(f"<div class='row'><div class='name'>{kind}<small>{html.escape(info)}</small></div>"
                         f"<audio controls preload='none' src='data:audio/ogg;base64,{data}'></audio><div></div></div>")
    (HERE / "dogs-sounds.html").write_text(PAGE.replace("<!--rows-->", "\n".join(parts)), encoding="utf-8")


PAGE = """<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Dogs: Töne</title>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;600;700&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:24px 32px;background:#f6ead4;color:#4a3426;font:500 16px 'Pixelify Sans',monospace}
h1{font:700 32px 'Pixelify Sans';margin:0 0 4px} h2{font:600 15px 'Pixelify Sans';letter-spacing:3px;color:#7a5a46;margin:26px 0 8px;text-transform:uppercase}
.intro{max-width:980px;color:#7a5a46}
.row{display:grid;grid-template-columns:330px 300px 1fr;gap:16px;align-items:center;background:#fff6e6;border:3px solid #2e1d14;box-shadow:0 4px 0 rgba(46,29,20,.25);padding:10px 14px;margin:8px 0}
.name{font:600 17px 'Pixelify Sans'} .name small{display:block;font:500 12px monospace;color:#7a5a46;margin-top:3px}
.meta{font:12px/1.4 monospace;color:#4a3426} audio{width:300px}
</style></head><body><h1>Dogs: Töne mit earshot</h1>
<p class="intro">Jeder Ton ist aus der Sound-Bank von earshot 0.4 (in Code erzeugt) und aus Hundestimmen gebaut, die per Suche gefunden und von
earshot angehört wurden. Alle Töne sind auf dieselbe Lautheit (-20 LUFS) gebracht. "earshot hört" ist die Beschreibung, die earshot vom fertigen Ton gibt.</p>
<!--rows-->
</body></html>"""

if __name__ == "__main__":
    main()
