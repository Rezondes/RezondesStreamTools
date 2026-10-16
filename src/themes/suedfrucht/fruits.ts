// Die Früchte des Südfrucht-Themes (Minime-Typen): id, Name, Standard-Namen im Chat, Form als SVG-Pfade (Text) und
// Lage des Gesichts. Farben kommen aus den Einstellungen (fruit<Id>Main, fruit<Id>Detail, Blatt, Stiel, Umriss).
// Check: fruits.check.ts.
import type { MinimeVariantSet } from "../../core/theme.ts";
import { circle, spikes } from "./beach.ts";

// body = Fruchtfläche (Hauptfarbe, Umriss), detail = Fläche in Detailfarbe, line = Linie in Detailfarbe,
// leaf = Blatt (Blattfarbe), stem = Stiel (Stielfarbe)
type FruitPart = { kind: "body" | "detail" | "line" | "leaf" | "stem"; d: string };
// face: Mitte des Gesichts in der Form (100 x 100) und Grösse (1 = normal)
export type Fruit = { id: string; label: string; names: readonly string[]; parts: readonly FruitPart[]; face: { x: number; y: number; size: number } };

const EGG = "M50 10 C70 10 82 32 81 56 C80 81 66 95 50 95 C34 95 20 81 19 56 C18 32 30 10 50 10 Z";
const ROUND = "M50 13 C76 13 91 33 90 57 C89 82 71 96 50 96 C29 96 11 82 10 57 C9 33 24 13 50 13 Z";

export const FRUITS: readonly Fruit[] = [
  { id: "mango", label: "Mango", names: ["mango", "mangos"], face: { x: 50, y: 58, size: 1 }, parts: [
    { kind: "body", d: "M48 10 C74 8 92 34 86 62 C80 88 50 98 30 86 C12 75 12 44 26 26 C32 17 40 11 48 10 Z" },
    { kind: "detail", d: "M60 16 C78 20 88 38 84 54 C72 46 62 32 60 16 Z" },
    { kind: "stem", d: "M45 12 L44 3 L49 3 L50 11 Z" },
    { kind: "leaf", d: "M49 9 C55 1 67 -1 76 3 C68 11 58 13 49 9 Z" },
  ] },
  { id: "sternfrucht", label: "Sternfrucht", names: ["sternfrucht", "karambole", "starfruit"], face: { x: 50, y: 55, size: 0.85 }, parts: [
    { kind: "body", d: spikes(50, 54, 46, 20, 5) },
    { kind: "line", d: "M50 10 L50 34 M7 40 L30 48 M93 40 L70 48" },
    { kind: "stem", d: "M48 10 L48 2 L52 2 L52 10 Z" },
  ] },
  { id: "papaya", label: "Papaya", names: ["papaya"], face: { x: 50, y: 48, size: 0.85 }, parts: [
    { kind: "body", d: "M50 6 C63 6 71 20 73 38 C77 64 70 92 50 94 C30 92 23 64 27 38 C29 20 37 6 50 6 Z" },
    { kind: "detail", d: "M29 66 C40 74 60 74 71 66 C70 84 62 93 50 93 C38 93 30 84 29 66 Z" },
    { kind: "line", d: "M40 14 C34 34 33 50 35 62 M60 14 C66 34 67 50 65 62" },
    { kind: "stem", d: "M48 7 L48 0 L52 0 L52 7 Z" },
  ] },
  { id: "ananasguave", label: "Ananasguave", names: ["ananasguave", "feijoa", "guave"], face: { x: 50, y: 56, size: 1 }, parts: [
    { kind: "body", d: EGG },
    { kind: "detail", d: "M42 12 L45 3 L50 9 L55 3 L58 12 Z" },
    { kind: "line", d: "M30 30 C28 40 28 50 30 58 M70 30 C72 40 72 50 70 58" },
  ] },
  { id: "nashi", label: "Nashi-Birne", names: ["nashi", "nashibirne", "asiatischebirne", "asianpear"], face: { x: 50, y: 58, size: 1 }, parts: [
    { kind: "body", d: ROUND },
    { kind: "detail", d: `${circle(26, 40, 2)} ${circle(74, 38, 2)} ${circle(30, 72, 2)} ${circle(70, 74, 2)} ${circle(50, 86, 2)} ${circle(38, 26, 2)} ${circle(62, 24, 2)}` },
    { kind: "stem", d: "M48 15 C48 9 50 5 54 2 L57 4 C53 7 52 10 52 15 Z" },
    { kind: "leaf", d: "M55 6 C62 0 72 0 76 4 C70 10 62 10 55 6 Z" },
  ] },
  { id: "pepino", label: "Birnenmelone", names: ["birnenmelone", "pepino"], face: { x: 50, y: 56, size: 1 }, parts: [
    { kind: "body", d: "M50 10 C68 10 80 30 82 54 C84 80 68 95 50 95 C32 95 16 80 18 54 C20 30 32 10 50 10 Z" },
    { kind: "line", d: "M40 13 C30 36 30 70 40 92 M60 13 C70 36 70 70 60 92" },
    { kind: "leaf", d: "M40 12 L44 3 L50 10 L56 3 L60 12 Z" },
  ] },
  { id: "kaktusfeige", label: "Kaktusfeige", names: ["kaktusfeige", "feige", "pricklypear"], face: { x: 50, y: 57, size: 1 }, parts: [
    { kind: "body", d: "M50 10 C70 10 82 30 82 55 C82 80 68 95 50 95 C32 95 18 80 18 55 C18 30 30 10 50 10 Z" },
    { kind: "detail", d: "M37 13 C42 5 58 5 63 13 C56 17 44 17 37 13 Z" },
    { kind: "line", d: "M30 38 L25 35 M70 38 L75 35 M24 62 L19 63 M76 62 L81 63 M38 84 L35 88 M62 84 L65 88 M50 26 L50 21" },
  ] },
  { id: "durian", label: "Durian", names: ["durian", "stinkfrucht"], face: { x: 50, y: 58, size: 0.95 }, parts: [
    { kind: "body", d: spikes(50, 57, 42, 7, 22) },
    { kind: "stem", d: "M47 18 L47 3 L53 3 L53 18 Z" },
  ] },
  { id: "zitrone", label: "Zitrone", names: ["zitrone", "lemon"], face: { x: 50, y: 56, size: 1 }, parts: [
    { kind: "body", d: "M12 55 C12 51 16 49 20 47 C27 27 39 19 50 19 C61 19 73 27 80 47 C84 49 88 51 88 55 C88 59 84 61 80 63 C73 83 61 91 50 91 C39 91 27 83 20 63 C16 61 12 59 12 55 Z" },
    { kind: "leaf", d: "M50 19 C54 9 64 5 72 7 C66 15 58 19 50 19 Z" },
  ] },
  { id: "ananas", label: "Ananas", names: ["ananas", "pineapple"], face: { x: 50, y: 66, size: 0.85 }, parts: [
    { kind: "body", d: "M50 30 C70 30 80 48 80 65 C80 84 66 96 50 96 C34 96 20 84 20 65 C20 48 30 30 50 30 Z" },
    { kind: "line", d: "M28 46 L40 58 M72 46 L60 58 M24 72 L34 82 M76 72 L66 82 M42 36 L50 42 L58 36" },
    { kind: "leaf", d: "M50 32 L36 4 L46 22 L50 0 L54 22 L64 4 Z" },
  ] },
  { id: "kokosnuss", label: "Kokosnuss", names: ["kokosnuss", "kokos", "coconut"], face: { x: 50, y: 62, size: 1 }, parts: [
    { kind: "body", d: ROUND },
    { kind: "detail", d: `${circle(43, 26, 4)} ${circle(57, 26, 4)} ${circle(50, 35, 4)}` },
    { kind: "line", d: "M18 42 L24 44 M82 42 L76 44 M14 62 L20 62 M86 62 L80 62 M28 84 L32 80 M72 84 L68 80" },
  ] },
  { id: "drachenfrucht", label: "Drachenfrucht", names: ["drachenfrucht", "pitaya", "dragonfruit"], face: { x: 50, y: 57, size: 1 }, parts: [
    { kind: "body", d: "M50 13 C74 13 86 34 86 56 C86 80 70 95 50 95 C30 95 14 80 14 56 C14 34 26 13 50 13 Z" },
    { kind: "leaf", d: "M22 40 C12 34 8 26 8 18 C18 22 26 30 28 38 Z M78 40 C88 34 92 26 92 18 C82 22 74 30 72 38 Z M30 82 C20 84 12 82 6 76 C16 72 26 74 32 78 Z M70 82 C80 84 88 82 94 76 C84 72 74 74 68 78 Z M44 15 C42 9 44 3 50 1 C52 7 52 11 50 15 Z" },
  ] },
  { id: "maracuja", label: "Maracuja", names: ["maracuja", "passionsfrucht", "passionfruit"], face: { x: 50, y: 58, size: 1 }, parts: [
    { kind: "body", d: ROUND },
    { kind: "line", d: "M22 36 C28 40 32 38 36 42 M64 30 C68 36 72 34 78 40 M20 70 C26 68 30 72 34 70 M66 82 C70 78 74 80 78 76" },
    { kind: "stem", d: "M48 15 C48 9 46 5 42 2 L45 0 C50 4 52 9 52 15 Z" },
  ] },
  { id: "banane", label: "Banane", names: ["banane", "banana"], face: { x: 60, y: 70, size: 0.75 }, parts: [
    { kind: "body", d: "M16 28 C26 70 58 92 90 80 C95 78 95 72 90 71 C62 76 38 58 28 24 C26 16 16 18 16 28 Z" },
    { kind: "detail", d: "M88 71 C92 72 95 75 94 78 C92 80 90 80 89 79 Z" },
    { kind: "stem", d: "M14 22 L20 20 L24 28 L17 30 Z" },
  ] },
  { id: "litschi", label: "Litschi", names: ["litschi", "lychee"], face: { x: 50, y: 58, size: 1 }, parts: [
    { kind: "body", d: spikes(50, 57, 40, 3, 30) },
    { kind: "stem", d: "M48 18 C48 12 50 8 54 5 L57 7 C53 10 52 13 52 18 Z" },
    { kind: "leaf", d: "M55 8 C62 2 72 2 76 6 C70 12 62 12 55 8 Z" },
  ] },
  { id: "wassermelone", label: "Wassermelone", names: ["wassermelone", "melone", "watermelon"], face: { x: 50, y: 58, size: 1 }, parts: [
    { kind: "body", d: ROUND },
    { kind: "line", d: "M32 17 C22 40 22 72 32 92 M68 17 C78 40 78 72 68 92 M50 13 C44 20 42 26 42 32 M50 13 C56 20 58 26 58 32" },
    { kind: "stem", d: "M48 14 L48 6 L52 6 L52 14 Z" },
  ] },
];

export const FRUIT_IDS = FRUITS.map(fruit => fruit.id);

// Minime-Typen für das Schema: Befehl !frucht, je Frucht id, Name und Namen im Chat
export const FRUIT_SET: MinimeVariantSet = {
  command: "!frucht",
  label: "Frucht",
  variants: FRUITS.map(({ id, label, names }) => ({ id, label, names })),
};

export const findFruit = (id: string) => FRUITS.find(fruit => fruit.id === id) ?? FRUITS[0];
