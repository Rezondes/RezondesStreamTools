"""Dog voices made in code for the Dogs theme (proposal only): bark, sniff, snore, whine.

A bark is a short voiced burst: a rough glottal pulse train with a fast rise-fall pitch contour, sent through three
formant resonators (vocal tract), plus a breathy noise share and a soft attack burst. Breed sizes differ in pitch and
formants. Run: python voices.py [--listen]  (with --listen earshot describes and matches every voice).
"""
import json
import pathlib
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter, sosfilt

SR = 48000
OUT = pathlib.Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)


def resonator(x, freq, bandwidth):
    """two-pole formant resonator (gain normalised at the centre)"""
    r = np.exp(-np.pi * bandwidth / SR)
    theta = 2 * np.pi * freq / SR
    a = [1, -2 * r * np.cos(theta), r * r]
    b = [(1 - r * r) * np.sin(theta)]
    return lfilter(b, a, x)


def band(x, low, high, order=2):
    sos = butter(order, [low / (SR / 2), high / (SR / 2)], "band", output="sos")
    return sosfilt(sos, x)


def glottal(f0, rng, jitter=0.03, shimmer=0.25, subharmonic=0.35):
    """pulse train following the pitch contour f0 (array), rough: jitter, shimmer and a period-doubling share"""
    n = len(f0)
    phase = np.cumsum(f0 * (1 + jitter * rng.standard_normal(n)) / SR)
    saw = (phase % 1.0) * 2 - 1
    pulse = np.maximum(0, np.sin(2 * np.pi * phase)) ** 3 - 0.25 * saw
    sub = np.sin(np.pi * phase)  # half the pitch: the growly period doubling of a bark
    steps = np.arange(0, n, 240)
    amp = 1 + shimmer * np.interp(np.arange(n), steps, rng.standard_normal(len(steps)))
    return (pulse + subharmonic * sub) * amp


def envelope(n, attack, release_share=0.55):
    t = np.arange(n) / n
    a = np.clip(t / attack, 0, 1) ** 0.5
    d = np.where(t < 1 - release_share, 1.0, np.cos(np.clip((t - (1 - release_share)) / release_share, 0, 1) * np.pi / 2) ** 1.6)
    return a * d


VOICES = {
    # size: base pitch (Hz), formants (Hz) and bandwidths, length of one bark (s)
    "small": {"f0": 620, "formants": [(950, 160), (2100, 220), (3400, 320)], "length": 0.16, "breath": 0.22},
    "medium": {"f0": 420, "formants": [(760, 140), (1650, 200), (2900, 300)], "length": 0.2, "breath": 0.25},
    "big": {"f0": 260, "formants": [(560, 120), (1250, 180), (2500, 280)], "length": 0.26, "breath": 0.3},
}


def bark(size="medium", seed=1, pitch=1.0):
    voice = VOICES[size]
    rng = np.random.default_rng(seed)
    n = int(voice["length"] * SR)
    t = np.linspace(0, 1, n)
    # contour: quick rise to 1.35x at 25 %, then fall to 0.78x: the "w-OO-f" shape
    contour = np.interp(t, [0, 0.25, 0.6, 1], [0.95, 1.35, 1.0, 0.78])
    f0 = voice["f0"] * pitch * contour
    source = glottal(f0, rng)
    breath = band(rng.standard_normal(n), 900, 6000) * voice["breath"]
    excitation = source + breath
    tract = sum(resonator(excitation, f * pitch ** 0.4, bw) * g for (f, bw), g in zip(voice["formants"], [1.0, 0.55, 0.25]))
    y = tract * envelope(n, 0.07)
    burst_n = int(0.012 * SR)
    y[:burst_n] += band(rng.standard_normal(burst_n), 1500, 7000) * np.linspace(1, 0, burst_n) * 0.6 * np.max(np.abs(y))
    tail_n = int(0.06 * SR)
    tail = band(rng.standard_normal(tail_n), 700, 4000) * np.linspace(0.3, 0, tail_n) * np.max(np.abs(y))
    y = np.concatenate([y, tail])
    return y / np.max(np.abs(y)) * 0.9


def woof(size="medium", seed=1, pitch=1.0, double=True):
    """'Wuff': one bark, or two with the second a little lower (the double woof of the alert)"""
    first = bark(size, seed, pitch)
    if not double:
        return first
    second = bark(size, seed + 7, pitch * 0.93) * 0.85
    return np.concatenate([first, np.zeros(int(0.09 * SR)), second])


def sniff(seed=3, count=4):
    """quick nasal inhales: band-limited noise bursts of about 60 ms with short gaps"""
    rng = np.random.default_rng(seed)
    parts = []
    for _ in range(count):
        n = int(rng.uniform(0.05, 0.07) * SR)
        burst = band(rng.standard_normal(n), 2200, 7500) * np.sin(np.linspace(0, np.pi, n)) ** 1.5
        parts += [burst * rng.uniform(0.7, 1.0), np.zeros(int(rng.uniform(0.05, 0.08) * SR))]
    y = np.concatenate(parts)
    return y / np.max(np.abs(y)) * 0.7


def snore(seed=5):
    """one soft breath cycle: a fluttering low inhale (palate at 28 Hz) and a long breathy exhale"""
    rng = np.random.default_rng(seed)
    n_in, n_out = int(1.1 * SR), int(1.4 * SR)
    t = np.arange(n_in) / SR
    flutter = 0.55 + 0.45 * np.sin(2 * np.pi * 28 * t) ** 2
    shape_in = np.sin(np.linspace(0, np.pi, n_in))
    inhale = band(rng.standard_normal(n_in), 90, 900) * flutter * shape_in ** 1.2
    inhale += resonator(glottal(np.full(n_in, 95.0), rng, 0.05, 0.4, 0.6), 420, 200) * shape_in ** 2 * 0.02
    exhale = band(rng.standard_normal(n_out), 300, 3000) * np.sin(np.linspace(0, np.pi, n_out)) ** 1.6 * 0.35
    y = np.concatenate([inhale, np.zeros(int(0.15 * SR)), exhale, np.zeros(int(0.4 * SR))])
    return y / np.max(np.abs(y)) * 0.6


def whine(seed=9, pitch=1.0):
    """a short whine: high voiced tone with a nasal formant, rising then falling with a light vibrato"""
    rng = np.random.default_rng(seed)
    n = int(0.55 * SR)
    t = np.linspace(0, 1, n)
    f0 = 980 * pitch * np.interp(t, [0, 0.35, 1], [0.85, 1.12, 0.9]) * (1 + 0.025 * np.sin(2 * np.pi * 3.3 * t))
    source = glottal(f0, rng, 0.006, 0.08, 0.0)
    y = resonator(source, 1300, 260) + 0.4 * resonator(source, 2700, 400)
    y += band(rng.standard_normal(n), 2000, 6000) * 0.05
    y *= envelope(n, 0.12, 0.45)
    return y / np.max(np.abs(y)) * 0.6


def write(name, y):
    path = OUT / f"{name}.wav"
    sf.write(path, y.astype(np.float32), SR)
    return path


MADE = {
    "bark-small": lambda: woof("small", 1),
    "bark-medium": lambda: woof("medium", 2),
    "bark-big": lambda: woof("big", 3),
    "bark-single": lambda: bark("medium", 4),
    "sniff": sniff,
    "snore": snore,
    "whine": whine,
}

QUERIES = {
    "bark": ("a dog barking", ["a person coughing", "a seal barking", "a goose honking", "a door knock"]),
    "sniff": ("a dog sniffing", ["a person breathing", "wind noise", "a spray can"]),
    "snore": ("a dog snoring while asleep", ["a person snoring", "wind noise", "an engine idling"]),
    "whine": ("a dog whining", ["a squeaky door", "a whistle", "a baby crying"]),
}

if __name__ == "__main__":
    paths = {name: write(name, make()) for name, make in MADE.items()}
    if "--listen" not in sys.argv:
        sys.exit()
    import earshot.audio
    from scipy.signal import resample_poly

    def decode_wav(path, sr, ch):
        """WAV reader without ffmpeg (not installed here): float32, resampled to sr, (n,) or (n, ch)"""
        x, rate = sf.read(path, dtype="float32", always_2d=True)
        if rate != sr:
            x = resample_poly(x, sr, rate, axis=0).astype(np.float32)
        x = x.mean(axis=1) if ch == 1 else (np.repeat(x[:, :1], ch, axis=1) if x.shape[1] == 1 else x[:, :ch])
        return np.ascontiguousarray(x, np.float32)

    earshot.audio._decode = decode_wav
    from earshot.describe import describe
    from earshot.match import match

    report = {}
    for name, path in paths.items():
        query, alts = QUERIES[name.split("-")[0]]
        heard = describe(str(path), top=5)
        fit = match(str(path), query, alts=alts)
        report[name] = {"describe": heard, "match": fit}
        print(f"== {name}")
        print("  ", heard.get("summary", "") if isinstance(heard, dict) else heard)
        print("  ", fit.get("summary", "") if isinstance(fit, dict) else fit)
    (OUT / "voices-report.json").write_text(json.dumps(report, indent=1, default=str), encoding="utf-8")
