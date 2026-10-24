// Sounds of the Dogs theme (DESIGN-DOGS.md "Töne", plans/PLAN-TOENE.md): per event the name of its file in sounds/
// (made with earshot, docs/sounds) and the key of its sound field; barks use the voice of the breed
// (barkVoice_<breed>). The files themselves are imported in tones.ts (browser only). Check: sounds.check.ts.

export const BARK_FILES = { klein: "alert-bark-small", mittel: "alert-bark-medium", gross: "alert-bark-big" } as const;
export type BarkVoice = keyof typeof BARK_FILES;

// Per event: the file of the built-in sound and the key of its sound field; a bark takes the file of the voice
export const DOG_SOUNDS = {
  startingLand: { file: "starting-land", field: "soundStartingLand" },
  startingHop: { file: "starting-hop", field: "soundStartingHop" },
  startingChosen: { file: "starting-chosen", field: "soundStartingChosen" },
  startingCard: { file: "starting-card", field: "soundStartingCard" },
  bark: { file: BARK_FILES.klein, field: "soundBark" },
  brbSniff: { file: "brb-sniff", field: "soundBrbSniff" },
  brbSteps: { file: "brb-steps", field: "soundBrbSteps" },
  endingLie: { file: "ending-lie", field: "soundEndingLie" },
  endingLamp: { file: "ending-lamp", field: "soundEndingLamp" },
  endingSnore: { file: "ending-snore", field: "soundEndingSnore" },
  alertRun: { file: "alert-run", field: "soundAlertRun" },
  toyBall: { file: "alert-toy-ball", field: "soundAlertToy" },
  toyKnochen: { file: "alert-toy-bone", field: "soundAlertToy" },
  toyFrisbee: { file: "alert-toy-frisbee", field: "soundAlertToy" },
  toyLeckerli: { file: "alert-toy-treat", field: "soundAlertToy" },
  alertCard: { file: "alert-card", field: "soundAlertCard" },
  alertLeave: { file: "alert-leave", field: "soundAlertLeave" },
  alertRaid: { file: "alert-raid", field: "soundRaid" },
} as const;
export type DogSound = keyof typeof DOG_SOUNDS;
export type SoundFile = (typeof DOG_SOUNDS)[DogSound]["file"] | (typeof BARK_FILES)[BarkVoice];

// The bark voice of a breed from the settings, small when unknown
export function barkVoiceOf(breed: string, values: Readonly<Record<string, unknown>>): BarkVoice {
  const voice = values[`barkVoice_${breed}`];
  return typeof voice === "string" && voice in BARK_FILES ? (voice as BarkVoice) : "klein";
}

// The file of an event; a bark in the voice of the breed
export const soundFile = (event: DogSound, values: Readonly<Record<string, unknown>>, breed = ""): SoundFile =>
  event === "bark" ? BARK_FILES[barkVoiceOf(breed, values)] : DOG_SOUNDS[event].file;

// The files of the given events (all voices for a bark), each once: what a scene loads ahead
export const filesOf = (events: readonly DogSound[]): SoundFile[] =>
  [...new Set(events.flatMap((event): SoundFile[] => (event === "bark" ? Object.values(BARK_FILES) : [DOG_SOUNDS[event].file])))];
