// ASCII-Schrift für Namen ohne Abhängigkeit: die Zeichen der FIGlet-Schrift "Standard" (volle Breite) für
// A bis Z, 0 bis 9 und den Unterstrich, also alles, was in einem Twitch-Login vorkommt. Der Server erzeugt damit
// beim ersten Login das Logo (im Docker-Image gibt es kein figlet). Check: asciiText.check.ts (Vergleich mit figlet).

// fixed: Zeichendaten der Schrift, je Zeichen sechs gleich breite Zeilen
const GLYPHS: Record<string, readonly string[]> = {
  "A": ["     _    ","    / \\   ","   / _ \\  ","  / ___ \\ "," /_/   \\_\\","          "],
  "B": ["  ____  "," | __ ) "," |  _ \\ "," | |_) |"," |____/ ","        "],
  "C": ["   ____ ","  / ___|"," | |    "," | |___ ","  \\____|","        "],
  "D": ["  ____  "," |  _ \\ "," | | | |"," | |_| |"," |____/ ","        "],
  "E": ["  _____ "," | ____|"," |  _|  "," | |___ "," |_____|","        "],
  "F": ["  _____ "," |  ___|"," | |_   "," |  _|  "," |_|    ","        "],
  "G": ["   ____ ","  / ___|"," | |  _ "," | |_| |","  \\____|","        "],
  "H": ["  _   _ "," | | | |"," | |_| |"," |  _  |"," |_| |_|","        "],
  "I": ["  ___ "," |_ _|","  | | ","  | | "," |___|","      "],
  "J": ["      _ ","     | |","  _  | |"," | |_| |","  \\___/ ","        "],
  "K": ["  _  __"," | |/ /"," | ' / "," | . \\ "," |_|\\_\\","       "],
  "L": ["  _     "," | |    "," | |    "," | |___ "," |_____|","        "],
  "M": ["  __  __ "," |  \\/  |"," | |\\/| |"," | |  | |"," |_|  |_|","         "],
  "N": ["  _   _ "," | \\ | |"," |  \\| |"," | |\\  |"," |_| \\_|","        "],
  "O": ["   ___  ","  / _ \\ "," | | | |"," | |_| |","  \\___/ ","        "],
  "P": ["  ____  "," |  _ \\ "," | |_) |"," |  __/ "," |_|    ","        "],
  "Q": ["   ___  ","  / _ \\ "," | | | |"," | |_| |","  \\__\\_\\","        "],
  "R": ["  ____  "," |  _ \\ "," | |_) |"," |  _ < "," |_| \\_\\","        "],
  "S": ["  ____  "," / ___| "," \\___ \\ ","  ___) |"," |____/ ","        "],
  "T": ["  _____ "," |_   _|","   | |  ","   | |  ","   |_|  ","        "],
  "U": ["  _   _ "," | | | |"," | | | |"," | |_| |","  \\___/ ","        "],
  "V": [" __     __"," \\ \\   / /","  \\ \\ / / ","   \\ V /  ","    \\_/   ","          "],
  "W": [" __        __"," \\ \\      / /","  \\ \\ /\\ / / ","   \\ V  V /  ","    \\_/\\_/   ","             "],
  "X": [" __  __"," \\ \\/ /","  \\  / ","  /  \\ "," /_/\\_\\","       "],
  "Y": [" __   __"," \\ \\ / /","  \\ V / ","   | |  ","   |_|  ","        "],
  "Z": ["  _____"," |__  /","   / / ","  / /_ "," /____|","       "],
  "0": ["   ___  ","  / _ \\ "," | | | |"," | |_| |","  \\___/ ","        "],
  "1": ["  _ "," / |"," | |"," | |"," |_|","    "],
  "2": ["  ____  "," |___ \\ ","   __) |","  / __/ "," |_____|","        "],
  "3": ["  _____ "," |___ / ","   |_ \\ ","  ___) |"," |____/ ","        "],
  "4": ["  _  _   "," | || |  "," | || |_ "," |__   _|","    |_|  ","         "],
  "5": ["  ____  "," | ___| "," |___ \\ ","  ___) |"," |____/ ","        "],
  "6": ["   __   ","  / /_  "," | '_ \\ "," | (_) |","  \\___/ ","        "],
  "7": ["  _____ "," |___  |","    / / ","   / /  ","  /_/   ","        "],
  "8": ["   ___  ","  ( _ ) ","  / _ \\ "," | (_) |","  \\___/ ","        "],
  "9": ["   ___  ","  / _ \\ "," | (_) |","  \\__, |","    /_/ ","        "],
  "_": ["        ","        ","        ","        ","  _____ "," |_____|"],
};
const ROWS = 6;

// Name als ASCII-Kunst in Grossbuchstaben; nicht unterstützte Zeichen fallen weg, ohne Zeichen bleibt es leer.
// Wie der Generator im Dashboard: ohne Leerzeichen am Zeilenende, ohne gemeinsamen Einzug und leere Randzeilen.
export function asciiText(name: string): string {
  const glyphs = [...name.toUpperCase()].map(character => GLYPHS[character]).filter(Boolean);
  if (!glyphs.length) return "";
  const rows = Array.from({ length: ROWS }, (_, row) => glyphs.map(glyph => glyph[row]).join("").trimEnd());
  const indent = Math.min(...rows.filter(Boolean).map(row => row.length - row.trimStart().length));
  return rows.map(row => row.slice(indent)).join("\n").replace(/^\n+|\n+$/g, "");
}
