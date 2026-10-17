// ASCII font for names without a dependency: the characters of the FIGlet font "Standard" (full width) for
// A to Z, 0 to 9 and the underscore, i.e. everything that occurs in a Twitch login. The server uses it to create
// the logo on first login (the Docker image has no figlet). Check: asciiText.check.ts (comparison with figlet).

// fixed: glyph data of the font, six equally wide lines per character
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

// Name as ASCII art in upper case; unsupported characters drop out, without characters it stays empty.
// Like the generator in the dashboard: without trailing spaces, without common indent and empty edge lines.
export function asciiText(name: string): string {
  const glyphs = [...name.toUpperCase()].map(character => GLYPHS[character]).filter(Boolean);
  if (!glyphs.length) return "";
  const rows = Array.from({ length: ROWS }, (_, row) => glyphs.map(glyph => glyph[row]).join("").trimEnd());
  const indent = Math.min(...rows.filter(Boolean).map(row => row.length - row.trimStart().length));
  return rows.map(row => row.slice(indent)).join("\n").replace(/^\n+|\n+$/g, "");
}
