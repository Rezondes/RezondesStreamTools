// Running streamer runtimes: exactly one per login. A start waits for files and connections; if someone else starts
// or stops the same login meanwhile (second login, admin saves access, disconnect), the overtaken start is
// discarded instead of leaving behind a second runtime that nobody manages.
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
    // Stop all, including starts that are running right now
    stopAll() {
      for (const login of new Set([...runtimes.keys(), ...generations.keys()])) stop(login);
    },
    // create builds the runtime (null = nothing to start); allowed is checked again afterwards
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
    // The runtime ended itself (login invalid): only remove it if it is still the current one
    ended(login: string, runtime: R) {
      if (runtimes.get(login) === runtime) runtimes.delete(login);
    },
  };
}
