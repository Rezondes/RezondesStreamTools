"""Built-in sounds of the Kebab theme (PLAN-KEBAB.md package 3), made with the earshot sfx bank (code-made, no
recordings; github.com/Leonxlnx/earshot, MIT). Writes src/themes/kebab/sounds/*.ogg and listen.html next to this file.

    python make.py            run with a Python that has earshot, numpy, scipy, soundfile and pyloudnorm installed

Every sound is a mix of bank takes with fixed seeds, so a run gives the same files; all are matched to the same
loudness and checked for length and peak.
"""
import pathlib

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy.signal import butter, lfilter

from earshot.forge import bank, fx

SR = 48000
HERE = pathlib.Path(__file__).parent
OUT = HERE.parent.parent / "sounds"
TARGET = -20.0  # LUFS of every sound
rng = np.random.default_rng(7)


def take(sid, pitch=None, dur=None, seed=None):
    y, _ = bank.render(sid, seed=seed, dur=dur, pitch=pitch, checks=False)
    return y.mean(axis=1) if y.ndim == 2 else y


def mix(layers, tail=0.2, room=0.12):
    """layers: (seconds, sound id, gain dB, pitch, dur, seed); a short room on the sum"""
    parts = [(int(at * SR), take(sid, pitch, dur, seed) * 10 ** (db / 20)) for at, sid, db, pitch, dur, seed in layers]
    y = np.zeros(max(start + len(part) for start, part in parts) + int(tail * SR))
    for start, part in parts:
        y[start:start + len(part)] += part
    if room:
        wet = np.asarray(fx.reverb(y, np.random.default_rng(3), rt60=0.35, size=0.25, damp=0.6, wet=room, dry=1.0, ir_seed=3), np.float64)
        y = wet.mean(axis=1) if wet.ndim == 2 else wet
    return y


def L(at, sid, db=0.0, pitch=None, dur=None, seed=None):
    return (at, sid, db, pitch, dur, seed)


def sizzle(seconds=2.0):
    """grill: high hiss with fat crackles, crossfaded into a seamless loop"""
    white = rng.standard_normal(int(seconds * SR))
    b, a = butter(2, 2500 / (SR / 2), "high")
    hiss = lfilter(b, a, white) * 0.12
    crackle = np.zeros_like(hiss)
    for _ in range(int(seconds * 40)):
        pop = take("pro_typing_key/crackle", seed=int(rng.integers(1, 60)))
        start = int(rng.uniform(0, seconds - 0.2) * SR)
        crackle[start:start + len(pop)] += pop[: len(crackle) - start] * rng.uniform(0.05, 0.25)
    y = hiss + crackle
    lap = int(0.3 * SR)
    ramp = np.linspace(0, 1, lap)
    head = y[:lap] * ramp + y[-lap:] * (1 - ramp)
    return np.concatenate([head, y[lap:-lap]])


SOUNDS = {
    # cash register: the drawer clacks, then the bell rings
    "register": [L(0, "toggle/latch", -6), L(0.05, "knock/plastic", -8), L(0.12, "fit/bell/small_bell", -2), L(0.12, "pro_notify/ding_2045", -10)],
    # stamp: a dull punch on paper with a short wooden knock
    "stamp": [L(0, "cut_hit/punch", -2, None, 0.3), L(0, "knock/desk", -4), L(0.01, "fit/land.light/fingertip_book", -6)],
    # printer: the bon rattles out of the slot
    "printer": [L(0, "pro_typing_run/tick", -2, None, 1.0), L(0, "pro_typing_run/standard", -10, None, 1.0)],
    # paper tears
    "tear": [L(0, "swipe/paper", -1, None, 0.45), L(0.05, "glitch/crush", -18, None, 0.2)],
    # the knife scrapes over the meat
    "knife": [L(0, "swish/blade", -6), L(0.02, "swipe/cloth", -3)],
    # a soft plop
    "plop": [L(0, "fit/pop/mouth_plop", 0), L(0.02, "pro_pop/bloop", -10)],
    # a paper bag lands
    "bag": [L(0, "whoosh_fast/sleeve", -8), L(0.12, "fit/land.light/fingertip_book", -1), L(0.12, "swipe/paper", -10, None, 0.25)],
}

meter = pyloudnorm.Meter(SR, block_size=0.2)


def trim(y, floor_db=-50.0, fade_s=0.03):
    loud = np.nonzero(np.abs(y) > np.max(np.abs(y)) * 10 ** (floor_db / 20))[0]
    y = y[: loud[-1] + int(fade_s * SR)].copy()
    n = min(len(y), int(fade_s * SR))
    y[-n:] *= np.linspace(1, 0, n)
    return y


def loudness(y):
    return meter.integrated_loudness(np.concatenate([y, np.zeros(max(0, int(0.5 * SR) - len(y)))]))


def finish(y):
    lufs = loudness(y)
    if np.isfinite(lufs):
        y = y * 10 ** ((TARGET - lufs) / 20)
    peak = np.max(np.abs(y))
    if peak > 0.89:  # -1 dBFS
        y = y * 0.89 / peak
    return y.astype(np.float32)


OUT.mkdir(exist_ok=True)
rows = []
for name, layers in [*SOUNDS.items(), ("sizzle", None)]:
    y = finish(sizzle() if layers is None else trim(mix(layers)))
    seconds = len(y) / SR
    lufs = loudness(y)
    assert 0.05 < seconds < 3, f"{name}: {seconds:.2f} s"
    assert np.max(np.abs(y)) <= 0.9, f"{name}: peak"
    assert abs(lufs - TARGET) < 1.0 or np.max(np.abs(y)) >= 0.88, f"{name}: {lufs:.1f} LUFS"
    sf.write(OUT / f"{name}.ogg", y, SR, format="OGG", subtype="VORBIS")
    rows.append(f'<tr><td>{name}</td><td>{seconds:.2f} s</td><td>{lufs:.1f} LUFS</td><td><audio controls src="../../sounds/{name}.ogg"></audio></td></tr>')
    print(f"{name}: {seconds:.2f} s, {lufs:.1f} LUFS")

(HERE / "listen.html").write_text(
    '<!doctype html>\n<html lang="de">\n<head><meta charset="utf-8"><title>Kebab Töne</title>\n'
    '<style>body { font: 16px system-ui; margin: 32px; } td { padding: 6px 14px; }</style></head>\n'
    '<body><h1>Kebab: eingebaute Töne</h1><p>Erzeugt mit make.py (earshot).</p><table>\n' + "\n".join(rows) + "\n</table></body>\n</html>\n",
    encoding="utf-8",
)
