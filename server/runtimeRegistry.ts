// Laufende Streamer-Laufzeiten: genau eine pro Login. Ein Start wartet auf Dateien und Verbindungen; startet oder
// stoppt währenddessen jemand anderes denselben Login (zweite Anmeldung, Admin speichert Zugänge, Trennen), wird
// der überholte Start verworfen statt eine zweite, nirgends verwaltete Laufzeit zu hinterlassen.
type Runtime = { stop: () => void };

export function runtimeRegistry<R extends Runtime>() {
  const runtimes = new Map<string, R>();
  const generations = new Map<string, number>();
  const bump = (login: string) => {
    const next = (generations.get(login) ?? 0) + 1;
    generations.set(login, next);
    return next;
  };

  function stop(login: string) {
    bump(login);
    runtimes.get(login)?.stop();
    runtimes.delete(login);
  }

  return {
    get: (login: string) => runtimes.get(login),
    logins: () => [...runtimes.keys()],
    count: () => runtimes.size,
    stop,
    // Alle stoppen, auch Starts, die gerade laufen
    stopAll() {
      for (const login of new Set([...runtimes.keys(), ...generations.keys()])) stop(login);
    },
    // create baut die Laufzeit (null = nichts zu starten); allowed wird danach erneut geprüft
    async start(login: string, create: () => Promise<R | null>, allowed: () => boolean): Promise<R | null> {
      stop(login);
      const mine = generations.get(login);
      const runtime = await create();
      if (!runtime) return null;
      if (generations.get(login) !== mine || !allowed()) {
        runtime.stop();
        return null;
      }
      runtimes.set(login, runtime);
      return runtime;
    },
    // Laufzeit hat sich selbst beendet (Login ungültig): nur austragen, wenn sie noch die aktuelle ist
    ended(login: string, runtime: R) {
      if (runtimes.get(login) === runtime) runtimes.delete(login);
    },
  };
}
