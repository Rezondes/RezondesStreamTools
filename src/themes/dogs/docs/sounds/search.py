"""Search dog voices by listening: random parameters, earshot scores each render, the best are mutated (evolution).

score = z of the target description among earshot's 322 descriptions + 3 x forced-choice share against alternatives.
Run: python search.py <kind> [generations] [population]   kinds: bark-small bark-medium bark-big sniff snore whine
Writes out/search-<kind>.json (best parameters and scores) and out/best-<kind>.wav.
"""
import json
import pathlib
import shutil
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter, resample_poly, sosfilt

SR = 48000
OUT = pathlib.Path(__file__).parent / "out"
WORK = OUT / "search"
WORK.mkdir(parents=True, exist_ok=True)


def resonator(x, freq, bandwidth):
    r = np.exp(-np.pi * bandwidth / SR)
    theta = 2 * np.pi * min(freq, SR * 0.45) / SR
    return lfilter([(1 - r * r) * np.sin(theta)], [1, -2 * r * np.cos(theta), r * r], x)


def band(x, low, high):
    high = min(high, SR * 0.45)
    low = min(low, high * 0.8)
    return sosfilt(butter(2, [low / (SR / 2), high / (SR / 2)], "band", output="sos"), x)


def room(x, rng, amount, size):
    """small room: exponentially decaying noise impulse response"""
    if amount <= 0:
        return x
    n = int(size * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (n / 5))
    ir = lfilter(*butter(1, 5000 / (SR / 2)), ir)
    dry = np.concatenate([x, np.zeros(n)])
    wet = np.zeros(len(dry))
    convolved = np.convolve(x, ir)[: len(dry)]
    wet[: len(convolved)] = convolved
    wet /= np.max(np.abs(wet)) + 1e-9
    return dry / (np.max(np.abs(dry)) + 1e-9) + amount * wet


def voiced(p, rng):
    """one voiced call: rough pulse source, pitch contour, formants, noise, saturation, envelope"""
    n = int(p["length"] * SR)
    t = np.linspace(0, 1, n)
    contour = np.interp(t, [0, p["peak_at"], 1], [p["start"], p["rise"], p["fall"]])
    f0 = p["f0"] * contour * (1 + p["vibrato"] * np.sin(2 * np.pi * p["vibrato_hz"] * t * p["length"]))
    jitter = 1 + p["jitter"] * lfilter([1], [1, -0.9], rng.standard_normal(n)) * 0.3
    phase = np.cumsum(f0 * jitter / SR)
    pulse = np.maximum(0, np.sin(2 * np.pi * phase)) ** p["sharp"]
    pulse = pulse - pulse.mean()
    source = pulse + p["sub"] * np.sin(np.pi * phase) + p["noise"] * band(rng.standard_normal(n), p["noise_low"], p["noise_high"])
    tract = resonator(source, p["f1"], p["b1"]) + 0.6 * resonator(source, p["f2"], p["b2"]) + 0.3 * resonator(source, p["f3"], p["b3"])
    tract = np.tanh(p["drive"] * tract / (np.max(np.abs(tract)) + 1e-9))
    attack = np.clip(t * p["length"] / p["attack"], 0, 1)
    release = np.clip((1 - t) / p["release"], 0, 1) ** p["release_curve"]
    y = tract * attack * release
    if p["burst"] > 0:
        m = int(0.015 * SR)
        y[:m] += p["burst"] * band(rng.standard_normal(m), 1200, 8000) * np.linspace(1, 0, m)
    return y


def nasal_noise(p, rng):
    """sniffs: band-limited inhale bursts"""
    parts = []
    for _ in range(int(p["count"])):
        n = int(p["burst_len"] * rng.uniform(0.8, 1.2) * SR)
        b = band(rng.standard_normal(n), p["low"], p["high"]) * np.sin(np.linspace(0, np.pi, n)) ** p["shape"]
        b = resonator(b, p["nose"], p["nose_bw"]) * p["nose_mix"] + b * (1 - p["nose_mix"])
        parts += [b * rng.uniform(0.7, 1), np.zeros(int(p["gap"] * rng.uniform(0.8, 1.2) * SR))]
    return np.concatenate(parts)


def snoring(p, rng):
    n_in = int(p["inhale"] * SR)
    t = np.arange(n_in) / SR
    flutter = 1 - p["flutter_depth"] * (0.5 + 0.5 * np.sin(2 * np.pi * p["flutter_hz"] * t))
    shape = np.sin(np.linspace(0, np.pi, n_in)) ** 1.2
    src = band(rng.standard_normal(n_in), p["low"], p["high"]) + p["voice"] * np.sign(np.sin(2 * np.pi * p["flutter_hz"] * t))
    inhale = resonator(src, p["f1"], p["b1"]) * flutter * shape
    n_out = int(p["exhale"] * SR)
    exhale = band(rng.standard_normal(n_out), 300, 3000) * np.sin(np.linspace(0, np.pi, n_out)) ** 1.6 * p["exhale_gain"]
    inhale /= np.max(np.abs(inhale)) + 1e-9
    return np.concatenate([inhale, np.zeros(int(0.12 * SR)), exhale])


def r(low, high):
    return ("lin", low, high)


SPACES = {
    "bark": {
        "f0": None, "start": r(0.7, 1.1), "rise": r(1.0, 1.7), "fall": r(0.5, 1.0), "peak_at": r(0.1, 0.5),
        "vibrato": r(0, 0.05), "vibrato_hz": r(10, 40), "jitter": r(0, 0.6), "sharp": r(1, 8), "sub": r(0, 1.2),
        "noise": r(0, 1.5), "noise_low": r(300, 2000), "noise_high": r(3000, 12000), "f1": None, "b1": r(80, 500),
        "f2": r(1000, 3000), "b2": r(100, 600), "f3": r(2200, 5000), "b3": r(150, 800), "drive": r(1, 8),
        "length": None, "attack": r(0.004, 0.05), "release": r(0.2, 0.8), "release_curve": r(0.5, 3), "burst": r(0, 1),
        "room": r(0, 0.6), "room_size": r(0.05, 0.4),
    },
    # whine: nasal, breathy, a falling glide; formants stay put (a moving vowel is what makes a meow)
    "whine": {
        "f0": r(650, 1300), "start": r(0.95, 1.15), "rise": r(1.0, 1.15), "fall": r(0.6, 0.9), "peak_at": r(0.05, 0.3),
        "vibrato": r(0.01, 0.08), "vibrato_hz": r(5, 30), "jitter": r(0.05, 0.4), "sharp": r(1, 4), "sub": r(0, 0.2),
        "noise": r(0.3, 1.5), "noise_low": r(500, 2000), "noise_high": r(3000, 7000), "f1": r(250, 600), "b1": r(60, 300),
        "f2": r(1800, 3200), "b2": r(150, 600), "f3": r(3000, 4500), "b3": r(200, 800), "drive": r(1, 3),
        "length": r(0.25, 0.8), "attack": r(0.01, 0.1), "release": r(0.3, 0.9), "release_curve": r(0.5, 2), "burst": r(0, 0.2),
        "room": r(0, 0.5), "room_size": r(0.05, 0.4),
    },
    # sniff: many quick nasal inhales, mid nose resonance, no bright hiss
    "sniff": {
        "count": r(5, 12), "burst_len": r(0.025, 0.07), "gap": r(0.015, 0.07), "low": r(150, 900), "high": r(2500, 6000),
        "shape": r(0.5, 2.5), "nose": r(400, 1600), "nose_bw": r(80, 600), "nose_mix": r(0.4, 0.95),
        "room": r(0, 0.4), "room_size": r(0.05, 0.3),
    },
    # snore: a voiced low rattle on the inhale (soft palate), dull and short of highs
    "snore": {
        "inhale": r(0.7, 1.6), "exhale": r(0.3, 1.2), "flutter_hz": r(25, 70), "flutter_depth": r(0.5, 1), "low": r(40, 150),
        "high": r(400, 1500), "voice": r(0.3, 1.5), "f1": r(150, 600), "b1": r(60, 400), "exhale_gain": r(0, 0.4),
        "room": r(0, 0.4), "room_size": r(0.05, 0.3),
    },
}
SIZES = {"small": (r(480, 950), r(800, 1500), r(0.08, 0.2)), "medium": (r(300, 620), r(600, 1100), r(0.1, 0.26)),
         "big": (r(150, 360), r(380, 800), r(0.14, 0.34))}

TARGETS = {
    "bark": ("a dog barking", ["a person coughing", "a seal barking", "a goose honking", "a snare hit", "a door knock"]),
    "whine": ("a dog whining", ["a cat meowing", "a squeaky door", "a whistle", "a baby crying", "a balloon squeak"]),
    "sniff": ("a dog sniffing", ["crisp hi-hats", "a snare roll", "a person breathing", "a spray can", "wind noise"]),
    "snore": ("a dog snoring while asleep", ["a deep cinematic whoosh", "a fast whoosh", "a person snoring", "an engine idling", "wind noise"]),
}


def space_for(kind):
    base, _, size = kind.partition("-")
    space = dict(SPACES[base])
    if size:
        space["f0"], space["f1"], space["length"] = SIZES[size]
    return base, space


def sample(space, rng):
    return {k: float(rng.uniform(v[1], v[2])) for k, v in space.items()}


def mutate(params, space, rng, strength):
    return {k: float(np.clip(params[k] + rng.normal(0, strength * (v[2] - v[1])), v[1], v[2])) for k, v in space.items()}


def render(base, params, seed):
    rng = np.random.default_rng(seed)
    if base in ("bark", "whine"):
        y = voiced(params, rng)
    elif base == "sniff":
        y = nasal_noise(params, rng)
    else:
        y = snoring(params, rng)
    y = room(y, rng, params["room"], params["room_size"])
    y = np.concatenate([np.zeros(int(0.02 * SR)), y, np.zeros(int(0.1 * SR))])
    return (y / (np.max(np.abs(y)) + 1e-9) * 0.89).astype(np.float32)


def ears():
    """earshot match; without ffmpeg on PATH read WAV files with soundfile instead"""
    import earshot.audio

    if not shutil.which("ffmpeg"):
        def decode_wav(path, sr, ch):
            x, rate = sf.read(path, dtype="float32", always_2d=True)
            if rate != sr:
                x = resample_poly(x, sr, rate, axis=0).astype(np.float32)
            x = x.mean(axis=1) if ch == 1 else (np.repeat(x[:, :1], ch, axis=1) if x.shape[1] == 1 else x[:, :ch])
            return np.ascontiguousarray(x, np.float32)
        earshot.audio._decode = decode_wav
    from earshot.match import match
    return match


def main():
    kind = sys.argv[1]
    generations = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    population = int(sys.argv[3]) if len(sys.argv) > 3 else 40
    base, space = space_for(kind)
    query, alts = TARGETS[base]
    match = ears()
    rng = np.random.default_rng(sum(map(ord, kind)))
    scored = []

    def evaluate(params, label):
        path = WORK / f"{kind}-{label}.wav"
        sf.write(path, render(base, params, 1), SR)
        result = match(str(path), query, alts=alts)
        scored.append({"score": result["z"] + 3 * result["p_vs_alts"], "z": result["z"], "p": result["p_vs_alts"],
                       "verdict": result["verdict"], "closest": [c["term"] for c in result["closest_vocab"][:3]], "params": params})
        path.unlink()

    pool = [sample(space, rng) for _ in range(population)]
    for generation in range(generations):
        for i, params in enumerate(pool):
            evaluate(params, f"{generation}-{i}")
        scored.sort(key=lambda entry: -entry["score"])
        best = scored[0]
        print(f"{kind} gen {generation}: {best['score']:.2f} (z {best['z']:+.2f}, p {best['p']:.2f}, {best['verdict']}, like {best['closest']})", flush=True)
        elite = [entry["params"] for entry in scored[:8]]
        strength = 0.18 * (1 - generation / generations) + 0.04
        pool = [mutate(elite[i % len(elite)], space, rng, strength) for i in range(population - 4)] + [sample(space, rng) for _ in range(4)]

    (OUT / f"search-{kind}.json").write_text(json.dumps(scored[:5], indent=1), encoding="utf-8")
    sf.write(OUT / f"best-{kind}.wav", render(base, scored[0]["params"], 1), SR)


if __name__ == "__main__":
    main()
