# Coding and layout rules

Rules for this project: a TypeScript code base with React overlays and dashboard (Vite) and a Node server without dependencies. They are adapted from the C# rules of OpenVoiceSpeak and keep only what carries over, plus rules specific to TypeScript, React and the overlay domain. Every change follows them; where existing code breaks a rule, the change that touches that code fixes it.

## Purpose and scope

- Every module is found by its name: the file is named after what it exports, the folder after its area.
- The rules apply to every `.ts`, `.tsx` and `.css` file under `src/` and `server/`. Exempt: `node_modules/`, `dist/`, `render/`, `data/` and the media in `config/media/`.
- Every commit passes `npm run verify`: type check, ESLint, all checks with coverage limits, and the build.
- Every commit stays reviewable in 15 to 25 minutes: at most about 400 non-mechanical changed lines.
- Moves and renames are behaviour-neutral and never share a commit with a logic change. A behaviour change is listed in the commit that makes it.
- Persisted files and the wire keep their names, so moves and renames do not change them: JSON keys in `triggers.json`, `settings.json`, `access.json` and the token files, SSE message types (`alert`, `music`, `fx`), URL paths and query parameters stay, and persisted files stay loadable with equal stored values. A new persisted key is optional and gets its default where the file is read.

## Files, modules and folders

1. **One concept per file, file name = what it exports.** A React component file exports one component, named like the file in PascalCase (`Chat.tsx` exports `Chat`); sub-components used only by it may stay in the same file below it. A logic module covers one concept and is named after it in camelCase (`irc.ts`, `emotes.ts`, `typing.ts`).
2. **Exports:** component files default-export their component; every other module uses named exports only. No barrel files (`index.ts` that only re-exports), except one `index.ts` per theme that describes the theme.
3. **Types:** data shapes are `type` aliases; `interface` only where declaration merging is needed. No `I` prefix. No abstraction (an interface, a factory, a generic layer) with a single implementation that no check fakes; a function or a plain object is enough.
4. **Folders by area:** `src/core/` holds logic and hooks without styling, `src/themes/<id>/` holds one theme (components, CSS, settings list), `server/` holds the server. A theme never imports from another theme; core never imports from a theme.
5. **Erasable TypeScript only.** The server runs with Node's type stripping, and shared modules are imported by both sides. So: no `enum`, no `namespace`, no parameter properties, no decorators. Use a union of string literals or an `as const` array instead of an enum. Type-only imports use `import type`. Relative imports name the `.ts` / `.tsx` extension.
6. **No git-ignored folder names.** No source folder is named like a pattern in `.gitignore` (`dist`, `render`, `data`, `node_modules`).
7. **No folder named like a module or a type inside it**, and no module named like its folder (`themes/matrix/matrix.ts` is wrong; `themes/matrix/index.ts` describes the theme).

## Names

8. **Names say exactly what a thing is.** A module, type or component contains only what its name says; one that does more is split. No bag names: no file, type or function ends in `util`, `utils`, `helper`, `helpers`, `manager`, `common` or `misc`, and `service`, `info` and `data` appear only with a subject. Functions are verbs and do not repeat their module's name (`emotes.load`, not `emotes.loadEmotes`, when imported as a namespace). No `Async` suffix: the return type says `Promise`.
9. **Every variable, parameter and callback parameter is a readable word that says what it holds.** Banned in new or changed code: one-letter names (`e`, `t`, `m`, `a`, `s`, `c`, `r`) and abbreviations such as `ctx`, `cfg`, `msg`, `btn`, `res` for anything that is not an HTTP response. Event handler parameters are `event`. Accepted words: `id`, `url`, `json`, `http`, `sse`, `irc`, `ui`, `fps`, and the unit suffixes `Ms`, `Px` (`durationMs`). A discarded parameter is `_`; a loop index names what it counts (`row`, `column`, `frame`). The established React names `ref` and `props` stay allowed.
10. **English identifiers, log lines and error messages.** Code comments and project docs are German, like the rest of the project. User-facing text follows rule 20.
11. **No em dash** (U+2014) anywhere: code, comments, CSS, JSON, docs and commit messages. Use a colon, a comma, parentheses or a new sentence.
12. **Rule modules** are pure modules that decide one domain question: no React, no IO, no clock, no randomness of their own (both are passed in). They are named after the concept they decide (`access.ts`, `triggers.ts` for matching and scheduling, `typing.ts`). One concept, one word: the domain word (trigger, action, zone, alert, scene, theme, setting, streamer) is used in code, settings keys, docs and checks alike.
13. **No tuple results.** A function with several results returns a named object type, also a custom hook (`{ track, progressMs }`, not `[track, progressMs]`). React's own `useState` pair stays.
14. **Every file starts with a comment** that says what it is and how it is used (URL parameters for overlays, the run command for checks). Every export of `src/core/` and `server/` has a comment that states its contract.
15. **Strict compiler settings** carry the naming and safety rules the compiler can check: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitReturns`. `any` is allowed only where untyped JSON from an external API enters (`toAlert`, `toTrack`), marked with a comment and narrowed into a typed object right there. A non-null assertion (`!`) only follows a check in the same expression or reads a ref after mount.

## React and overlays

16. **Themes only present, core only decides.** A scene component gets its data from core hooks (`useAlerts`, `useChat`, `useMusic`, `useFx`, `useTerminal`) and its look from the theme settings; it opens no socket, no `EventSource` and calls no `fetch` of its own. Logic that more than one theme needs lives once in a context of the core (`src/core/music`, `screens`, `alerts`, `chat`, `fx`, `info`: pure rules with a check, hooks and headless building blocks such as `<Marquee>`); a theme calls it and adds only its look and its own features. A theme imports only from its own folder and from `src/core`, never from another theme, the dashboard or the server; the core never imports from themes, dashboard or server.
17. **Hooks** start with `use`, follow the rules of hooks and live in `src/core/hooks/` or in the context folder they belong to (`src/core/music/useNowPlaying.ts`). Every effect cleans up everything it starts: timers, intervals, `requestAnimationFrame`, listeners, sockets, `EventSource`, `AbortController`, object URLs.
18. **State holds sources, not derived values.** What can be computed from props or state is computed in render. Keys are stable ids (alert key, message id); an index is a key only in a list that never reorders while mounted.
19. **Styling through the theme.** Every colour, font, size and timing that a streamer may change is a theme setting and reaches the CSS as a custom property on the scene root (`--accent`, `--font`). A component holds no literal colour. A theme's CSS is scoped under its root class, so two themes never clash.
20. **User-facing text never comes from a literal in core or server code.** Overlay texts (titles, alert lines, terminal lines) are theme settings with defaults; dashboard texts sit in one text module per language. A server answer carries a code, the dashboard shows the text for it.
21. **Animations:** CSS keyframes first. JavaScript animation (canvas, ASCII frames) runs on `requestAnimationFrame` or a fixed-rate interval, is cleaned up (rule 17) and pauses when nothing changes. Renderers for videos and GIFs (stinger, banners) are pure functions of time `t`: no `Math.random`, use the shared `hash`, so every render of the same settings gives the same file.
22. **OBS first:** every overlay has a transparent background unless it is a full-screen scene, survives a source refresh without losing its connection, and reconnects by itself after a server or network drop.
23. **Accessibility in the dashboard:** every input has a visible `label`, every icon button has an `aria-label`, focus is visible, status changes are announced (`role="status"` or `role="alert"`). Decorative overlay parts are `aria-hidden`.

## Server

24. **Node standard library only.** A new dependency needs a written reason in the commit and the user's decision.
25. **Every input is validated where it enters:** request bodies have a size limit, names and paths match an allowlist pattern, JSON is parsed in a `try` and passed through a sanitizer that returns only known keys with valid values.
26. **The server decides every right.** Every dashboard API reads the streamer from the session cookie, never from the request; every feature check (`off`, `beta`, `all`) happens on the server. Public overlay endpoints answer only what an overlay needs: no tokens, no access lists, no other streamer's data.
27. **Secrets never leave the server:** no token, client secret or session key in a log line, an answer, the frontend bundle or a URL. Token files are written with mode `0o600`.
28. **Writes are atomic:** write a temporary file, then rename it over the target, so a crash never leaves half a JSON file.
29. **One runtime per streamer** owns that streamer's connections (EventSub, chat, Spotify, SSE clients) and stops all of them in one `stop`.

## Async and timing

30. **No floating promises.** Every promise is awaited, returned or ends in a `.catch` that logs; a deliberate fire-and-forget says why in a comment.
31. **No busy waiting** and no sleep loops: wait with an awaited timer, react to an event, or poll at a fixed interval that is cleared on stop.
32. **Time and chance are passed in.** Pure logic that depends on the clock takes `now` (as `readSession` does) and logic with randomness takes `random` (as `frames` does), so checks are deterministic. Only runtimes and components read `Date.now()` and `Math.random()`.
33. **Every reconnect has a delay** (never an immediate retry loop) and stops when the owner stops.

## Rust server (`server-rs/`, RUST-PLAN.md)

34. **Layers by crate:** `rst-domain` holds pure rules (no IO, no tokio, no sqlx, no other project crate; checked by `crates/rst-domain/tests/dependencies.rs`), `rst-app` use cases and ports, `rst-infra` adapters, `rst-server` the HTTP server and `main`. One module per bounded context inside each crate.
35. **Parse, don't validate:** values from outside become value objects (`Login`, `MediaName`, ...) at the edge; code behind it only sees valid values.
36. **Edition 2024, `unsafe` forbidden, Clippy pedantic without warnings, no `unwrap`/`expect` outside tests.** Tests sit next to the code (`#[cfg(test)]`) or in `tests/`; a ported module takes over every case of its `*.check.ts`.
37. **Types for the frontend are generated** with `ts-rs` into `src/generated/`, never written by hand.

## Checks

- Every logic module (`.ts`) under `src/` and `server/` has a `<module>.check.ts` next to it, written with `node:assert/strict`. A module without one is listed with its reason in `WITHOUT_CHECK` of `scripts/rules.check.ts`. `npm test` finds every `*.check.ts` by itself.
- Checks are deterministic: fixed `now` and `random`, no network, no real timers, no files outside a temporary folder they delete again.
- Each assertion group starts with a comment that states the behaviour it pins.
- Behaviour that only a browser or OBS can show (animations, sound, layout) is listed as a manual check in the change description.

## Rule checker

`npm run verify` runs everything; the git pre-commit hook (`.githooks/pre-commit`) and the Claude Code hooks (`.claude/settings.json`: ESLint after every edit, `verify` before the agent answers) run it automatically.

| Check | Command | Rules |
|---|---|---|
| Type check | `npm run typecheck` | 15 |
| ESLint (`eslint.config.js`) | `npm run lint` | 3, 4, 5, 8, 9, 15, 17, 21, 30, file and function size |
| Rule script (`scripts/rules.check.ts`) | part of `npm test` | 6, 8 (file names), 11, 14, 16 (network and imports), 20, a check per logic module |
| Checks with coverage limits | `npm test` | checks; lines 90 %, branches 90 %, functions 95 % |
| Build | `vite build` | the overlays still build |
| Rust (`scripts/rust.ts`) | `npm run rust` | 34, 36: `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test` |

`eslint-suppressions.json` is empty: every older finding is fixed and new code gets no exception. Coverage limits only go up. A new rule names its check in the same commit; a rule without a check is a point of the review checklist.

## Review checklist

Every review of new or changed code answers each point for that change, names the file and line for every "no", and either fixes it or records why not.

**Naming (rules 8 to 13)**
- Does every new or renamed module, type and component contain only what its name says?
- Red flag: a bag name, e.g. `streamUtils.ts` or `AlertManager`; name what it holds or decides.
- Red flag: a one-letter or abbreviated name, also a callback parameter, e.g. `items.map(i => i.name)` or `(e) => ...`.
- Red flag: a tuple result from a custom hook or function.
- Red flag: an `enum`, a `namespace` or a parameter property (rule 5).
- Red flag: an em dash anywhere.
- Red flag: user-facing text as a literal in core or server code.

**React (rules 16 to 23)**
- Does a scene open a connection or call `fetch` itself instead of using a core hook?
- Does every effect clean up what it starts?
- Is every changeable look a theme setting that reaches the CSS as a custom property?
- Does a renderer use `Math.random` or the clock instead of `t` and `hash`?

**Errors and security (rules 25 to 28)**
- Is every input validated where it enters, with a size limit?
- Does the server read the streamer from the session and check the feature level for every dashboard call?
- Is no secret logged, answered, bundled or put into a URL?
- Is no error swallowed silently? Every caught error is logged or commented with its reason.

**DRY**
- Does the change copy logic that exists elsewhere (matching, scheduling, access, emote splitting)? Use or extend the one place.
- Does a new alert kind, feature, setting or scene need edits in several lists that must agree? Prefer one table that the rest derives from, and a check that every entry is handled.
- Red flag: the same rule in dashboard and server; put it in a shared pure module.

**DDD**
- Is a domain rule (who may use a feature, when a trigger fires, how actions are scheduled) in a pure rule module, not inside a component or a request handler?
- Does the code use the domain words (trigger, action, zone, alert, scene, theme, setting, streamer)?

**TDD and BDD**
- Were the checks written first and seen failing (state it in the review notes)?
- Is every new rule checked where it lives, as a fast deterministic check?
- Is each manual check (animation, sound, OBS) listed as manual?

**KISS**
- Is this the simplest code that meets the request (no layer, abstraction or option with one user)?
- Are deliberate shortcuts marked with a `ponytail:` comment naming the limit and the upgrade path?
- Red flags: an effect with several captured mutable variables that could be a small state machine, a second source of truth for the same state, mixed time sources in one module.

**SOLID**
- **Single responsibility:** red flags are a file over about 400 lines, a function or component over about 60 lines, and request handling mixed with a domain rule.
- **Open/closed:** how many places change to add one more alert kind, feature, scene, setting or theme?
- **Interface segregation:** does a component or function receive a whole object when it uses one field? Pass the narrow piece.
- **Dependency inversion:** are time, randomness, the network and files passed in rather than read from globals inside pure logic?
