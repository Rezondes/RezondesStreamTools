//! ASCII font for names without a dependency: the characters of the `FIGlet` font "Standard" (full width) for A to Z,
//! 0 to 9 and the underscore, i.e. everything a Twitch login can contain. Used for the logo on first login
//! (template: `src/core/asciiText.ts`; the glyph table is the same, generated from it once).

/// Six lines per character, all lines of a character equally wide
const ROWS: usize = 6;

#[allow(clippy::too_many_lines, reason = "glyph table: one line per character")]
const fn glyph(character: char) -> Option<[&'static str; ROWS]> {
    Some(match character {
        '0' | 'O' => [
            r"   ___  ",
            r"  / _ \ ",
            r" | | | |",
            r" | |_| |",
            r"  \___/ ",
            r"        ",
        ],
        '1' => [r"  _ ", r" / |", r" | |", r" | |", r" |_|", r"    "],
        '2' => [
            r"  ____  ",
            r" |___ \ ",
            r"   __) |",
            r"  / __/ ",
            r" |_____|",
            r"        ",
        ],
        '3' => [
            r"  _____ ",
            r" |___ / ",
            r"   |_ \ ",
            r"  ___) |",
            r" |____/ ",
            r"        ",
        ],
        '4' => [
            r"  _  _   ",
            r" | || |  ",
            r" | || |_ ",
            r" |__   _|",
            r"    |_|  ",
            r"         ",
        ],
        '5' => [
            r"  ____  ",
            r" | ___| ",
            r" |___ \ ",
            r"  ___) |",
            r" |____/ ",
            r"        ",
        ],
        '6' => [
            r"   __   ",
            r"  / /_  ",
            r" | '_ \ ",
            r" | (_) |",
            r"  \___/ ",
            r"        ",
        ],
        '7' => [
            r"  _____ ",
            r" |___  |",
            r"    / / ",
            r"   / /  ",
            r"  /_/   ",
            r"        ",
        ],
        '8' => [
            r"   ___  ",
            r"  ( _ ) ",
            r"  / _ \ ",
            r" | (_) |",
            r"  \___/ ",
            r"        ",
        ],
        '9' => [
            r"   ___  ",
            r"  / _ \ ",
            r" | (_) |",
            r"  \__, |",
            r"    /_/ ",
            r"        ",
        ],
        'A' => [
            r"     _    ",
            r"    / \   ",
            r"   / _ \  ",
            r"  / ___ \ ",
            r" /_/   \_\",
            r"          ",
        ],
        'B' => [
            r"  ____  ",
            r" | __ ) ",
            r" |  _ \ ",
            r" | |_) |",
            r" |____/ ",
            r"        ",
        ],
        'C' => [
            r"   ____ ",
            r"  / ___|",
            r" | |    ",
            r" | |___ ",
            r"  \____|",
            r"        ",
        ],
        'D' => [
            r"  ____  ",
            r" |  _ \ ",
            r" | | | |",
            r" | |_| |",
            r" |____/ ",
            r"        ",
        ],
        'E' => [
            r"  _____ ",
            r" | ____|",
            r" |  _|  ",
            r" | |___ ",
            r" |_____|",
            r"        ",
        ],
        'F' => [
            r"  _____ ",
            r" |  ___|",
            r" | |_   ",
            r" |  _|  ",
            r" |_|    ",
            r"        ",
        ],
        'G' => [
            r"   ____ ",
            r"  / ___|",
            r" | |  _ ",
            r" | |_| |",
            r"  \____|",
            r"        ",
        ],
        'H' => [
            r"  _   _ ",
            r" | | | |",
            r" | |_| |",
            r" |  _  |",
            r" |_| |_|",
            r"        ",
        ],
        'I' => [
            r"  ___ ", r" |_ _|", r"  | | ", r"  | | ", r" |___|", r"      ",
        ],
        'J' => [
            r"      _ ",
            r"     | |",
            r"  _  | |",
            r" | |_| |",
            r"  \___/ ",
            r"        ",
        ],
        'K' => [
            r"  _  __", r" | |/ /", r" | ' / ", r" | . \ ", r" |_|\_\", r"       ",
        ],
        'L' => [
            r"  _     ",
            r" | |    ",
            r" | |    ",
            r" | |___ ",
            r" |_____|",
            r"        ",
        ],
        'M' => [
            r"  __  __ ",
            r" |  \/  |",
            r" | |\/| |",
            r" | |  | |",
            r" |_|  |_|",
            r"         ",
        ],
        'N' => [
            r"  _   _ ",
            r" | \ | |",
            r" |  \| |",
            r" | |\  |",
            r" |_| \_|",
            r"        ",
        ],
        'P' => [
            r"  ____  ",
            r" |  _ \ ",
            r" | |_) |",
            r" |  __/ ",
            r" |_|    ",
            r"        ",
        ],
        'Q' => [
            r"   ___  ",
            r"  / _ \ ",
            r" | | | |",
            r" | |_| |",
            r"  \__\_\",
            r"        ",
        ],
        'R' => [
            r"  ____  ",
            r" |  _ \ ",
            r" | |_) |",
            r" |  _ < ",
            r" |_| \_\",
            r"        ",
        ],
        'S' => [
            r"  ____  ",
            r" / ___| ",
            r" \___ \ ",
            r"  ___) |",
            r" |____/ ",
            r"        ",
        ],
        'T' => [
            r"  _____ ",
            r" |_   _|",
            r"   | |  ",
            r"   | |  ",
            r"   |_|  ",
            r"        ",
        ],
        'U' => [
            r"  _   _ ",
            r" | | | |",
            r" | | | |",
            r" | |_| |",
            r"  \___/ ",
            r"        ",
        ],
        'V' => [
            r" __     __",
            r" \ \   / /",
            r"  \ \ / / ",
            r"   \ V /  ",
            r"    \_/   ",
            r"          ",
        ],
        'W' => [
            r" __        __",
            r" \ \      / /",
            r"  \ \ /\ / / ",
            r"   \ V  V /  ",
            r"    \_/\_/   ",
            r"             ",
        ],
        'X' => [
            r" __  __", r" \ \/ /", r"  \  / ", r"  /  \ ", r" /_/\_\", r"       ",
        ],
        'Y' => [
            r" __   __",
            r" \ \ / /",
            r"  \ V / ",
            r"   | |  ",
            r"   |_|  ",
            r"        ",
        ],
        'Z' => [
            r"  _____", r" |__  /", r"   / / ", r"  / /_ ", r" /____|", r"       ",
        ],
        '_' => [
            r"        ",
            r"        ",
            r"        ",
            r"        ",
            r"  _____ ",
            r" |_____|",
        ],
        _ => return None,
    })
}

/// Name as ASCII art in upper case; unsupported characters drop out, without characters it stays empty. Like the
/// generator in the dashboard: no trailing spaces, no common indent and no empty edge lines.
#[must_use]
pub fn ascii_text(name: &str) -> String {
    let glyphs: Vec<[&str; ROWS]> = name
        .chars()
        .flat_map(char::to_uppercase)
        .filter_map(glyph)
        .collect();
    if glyphs.is_empty() {
        return String::new();
    }
    let rows: Vec<String> = (0..ROWS)
        .map(|row| {
            glyphs
                .iter()
                .map(|glyph| glyph[row])
                .collect::<String>()
                .trim_end()
                .to_owned()
        })
        .collect();
    let indent = rows
        .iter()
        .filter(|row| !row.is_empty())
        .map(|row| row.len() - row.trim_start().len())
        .min()
        .unwrap_or(0);
    let lines: Vec<&str> = rows
        .iter()
        .map(|row| row.get(indent..).unwrap_or(""))
        .collect();
    lines.join("\n").trim_matches('\n').to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn logins_become_upper_case_art() {
        let expected = [
            r" _   _   _____    ___",
            r"| \ | | | ____|  / _ \",
            r"|  \| | |  _|   | | | |",
            r"| |\  | | |___  | |_| |",
            r"|_| \_| |_____|  \___/",
        ];
        assert_eq!(ascii_text("neo"), expected.join("\n"));
    }

    #[test]
    fn underscore_keeps_its_last_line() {
        assert!(ascii_text("a_").ends_with("|_____|"));
    }

    #[test]
    fn unsupported_characters_drop_out() {
        assert_eq!(ascii_text("é !"), "");
        assert_eq!(ascii_text("n!"), ascii_text("N"));
    }
}
