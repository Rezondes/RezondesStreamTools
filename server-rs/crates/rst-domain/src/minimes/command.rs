//! Minime commands in chat (template: `parseCommand`, `parseColor`, `normalizeName` in `src/core/minimes.ts`):
//! join with an optional color or variant (and faction), change the look or the faction, leave, and kick another
//! minime with an allowed role.

use std::sync::LazyLock;

use regex::Regex;

use crate::minimes::rules::{MinimeRules, MinimeVariantRule};

static HEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^#?([0-9a-f]{3}|[0-9a-f]{6})$").expect("valid pattern"));
static RGB_CALL: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$").expect("valid pattern")
});
static RGB_LIST: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})$").expect("valid pattern")
});

/// A command at the start of a chat message
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MinimeCommand {
    Join { color: Option<String>, variant: Option<String>, team: Option<String> },
    Color { color: String },
    Variant { variant: String },
    Team { team: String },
    Leave,
    Kick { login: String },
}

/// Makes a name from chat or the settings comparable: lower case, ä/ö/ü/ß spelled out (the fruit names are
/// German), without spaces and hyphens
#[must_use]
pub fn normalize_name(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .filter(|character| !character.is_whitespace() && *character != '-')
        .flat_map(|character| match character {
            'ä' => vec!['a', 'e'],
            'ö' => vec!['o', 'e'],
            'ü' => vec!['u', 'e'],
            'ß' => vec!['s', 's'],
            other => vec![other],
        })
        .collect()
}

/// Channels 0 to 255 from an input, `None` if not a supported format
fn channels(text: &str) -> Option<[u8; 3]> {
    if let Some(hex) = HEX.captures(text) {
        let digits = &hex[1];
        let full: String = if digits.len() == 3 {
            digits.chars().flat_map(|digit| [digit, digit]).collect()
        } else {
            digits.to_owned()
        };
        let channel = |offset: usize| u8::from_str_radix(&full[offset..offset + 2], 16).ok();
        return Some([channel(0)?, channel(2)?, channel(4)?]);
    }
    let rgb = RGB_CALL.captures(text).or_else(|| RGB_LIST.captures(text))?;
    let channel = |index: usize| rgb[index].parse::<u8>().ok();
    Some([channel(1)?, channel(2)?, channel(3)?])
}

/// Color from chat (`#ff00aa`, `ff00aa`, `#f0a`, `255 0 170`, `255,0,170`, `rgb(255, 0, 170)`) as `#rrggbb`. If the
/// brightest channel is below `min_brightness`, the color is brightened proportionally up to it.
#[must_use]
pub fn parse_color(text: &str, min_brightness: f64) -> Option<String> {
    let values = channels(text.trim())?;
    let brightest = f64::from(values.iter().copied().max().unwrap_or(0));
    let lift = |value: u8| -> u8 {
        let value = f64::from(value);
        let lifted = if brightest >= min_brightness {
            value
        } else if brightest == 0.0 {
            min_brightness
        } else {
            (value * min_brightness / brightest).round()
        };
        #[expect(clippy::cast_possible_truncation, clippy::cast_sign_loss, reason = "clamped to 0..=255")]
        let channel = lifted.clamp(0.0, 255.0) as u8;
        channel
    };
    Some(format!("#{:02x}{:02x}{:02x}", lift(values[0]), lift(values[1]), lift(values[2])))
}

fn has_role(roles: &[String], allowed: &[String]) -> bool {
    allowed.iter().any(|role| role == "everyone")
        || roles.iter().any(|role| role == "broadcaster")
        || roles.iter().any(|role| allowed.contains(role))
}

fn is_login(text: &str) -> bool {
    (1..=25).contains(&text.len())
        && text.bytes().all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'_')
}

/// Variant for a name from chat, `None` if no allowed variant has that name
fn find_variant(text: &str, variants: &[MinimeVariantRule]) -> Option<String> {
    let name = normalize_name(text);
    variants.iter().find(|variant| variant.names.contains(&name)).map(|variant| variant.id.clone())
}

/// Variant and faction from the argument of a join: the argument is cut at every word boundary, the first cut where
/// every non-empty part names exactly one of them wins (variant before faction, so a whole name is a variant first).
/// Nothing fits: neither. Without factions the whole argument names the variant.
fn join_choice(
    argument: &str,
    variants: &[MinimeVariantRule],
    teams: Option<&[MinimeVariantRule]>,
) -> (Option<String>, Option<String>) {
    let Some(teams) = teams else { return (find_variant(argument, variants), None) };
    let words: Vec<&str> = argument.split_whitespace().collect();
    let part = |found: &[MinimeVariantRule], text: &str| -> Option<Option<String>> {
        if text.is_empty() { Some(None) } else { find_variant(text, found).map(Some) }
    };
    for cut in (0..=words.len()).rev() {
        let (first, second) = (words[..cut].join(" "), words[cut..].join(" "));
        for (variant, team) in [(&first, &second), (&second, &first)] {
            if let (Some(variant), Some(team)) = (part(variants, variant), part(teams, team)) {
                return (variant, team);
            }
        }
    }
    (None, None)
}

/// Command at the start of a chat message; `None` for everything else or without an allowed role. Leave with a
/// target (`@name`) kicks another minime if the role may, otherwise it is a normal leave.
#[must_use]
pub fn parse_command(text: &str, badges: &[String], rules: &MinimeRules) -> Option<MinimeCommand> {
    let mut words = text.split_whitespace();
    let command = words.next().unwrap_or_default().to_lowercase();
    let argument = words.collect::<Vec<_>>().join(" ");
    if command == rules.commands.leave.to_lowercase() {
        let target = argument.strip_prefix('@').unwrap_or(&argument).to_lowercase();
        let kick = !argument.is_empty() && is_login(&target) && has_role(badges, &rules.kick_roles);
        return Some(if kick { MinimeCommand::Kick { login: target } } else { MinimeCommand::Leave });
    }
    if !has_role(badges, &rules.join_roles) {
        return None;
    }
    if command == rules.commands.join.to_lowercase() {
        let chosen = |found: Option<String>| if argument.is_empty() { None } else { found };
        return Some(match &rules.variants {
            Some(variants) => {
                let (variant, team) = join_choice(&argument, variants, rules.teams.as_deref());
                MinimeCommand::Join { color: None, variant, team }
            }
            None => MinimeCommand::Join {
                color: chosen(parse_color(&argument, rules.min_brightness)),
                variant: None,
                team: None,
            },
        });
    }
    if let (Some(team), Some(teams)) = (&rules.commands.team, &rules.teams)
        && command == team.to_lowercase()
    {
        return find_variant(&argument, teams).map(|team| MinimeCommand::Team { team });
    }
    if command != rules.commands.look.to_lowercase() {
        return None;
    }
    match &rules.variants {
        Some(variants) => find_variant(&argument, variants).map(|variant| MinimeCommand::Variant { variant }),
        None => parse_color(&argument, rules.min_brightness).map(|color| MinimeCommand::Color { color }),
    }
}

#[cfg(test)]
pub(crate) mod tests {
    use serde_json::json;

    use super::*;
    use crate::minimes::rules::minime_rules;

    pub(crate) fn rules() -> MinimeRules {
        minime_rules(&json!({}), None, None)
    }

    pub(crate) fn variant_rules() -> MinimeRules {
        let mut rules = rules();
        rules.commands.look = "!frucht".to_owned();
        rules.variants = Some(vec![
            MinimeVariantRule { id: "mango".to_owned(), names: vec!["mango".to_owned()] },
            MinimeVariantRule {
                id: "sternfrucht".to_owned(),
                names: vec!["sternfrucht".to_owned(), "karambole".to_owned()],
            },
        ]);
        rules
    }

    /// Roles as variants (one with a name of several words) and two factions
    pub(crate) fn team_rules() -> MinimeRules {
        let rule = |id: &str, names: &[&str]| MinimeVariantRule {
            id: id.to_owned(),
            names: names.iter().map(|name| normalize_name(name)).collect(),
        };
        let mut rules = rules();
        rules.commands.look = "!rolle".to_owned();
        rules.commands.team = Some("!team".to_owned());
        rules.variants = Some(vec![rule("medic", &["medic"]), rule("eis", &["eis am stiel"])]);
        rules.teams = Some(vec![rule("blau", &["blau"]), rule("rot", &["rot"])]);
        rules
    }

    #[allow(clippy::unnecessary_wraps, reason = "compared with the results of parse_command")]
    fn team_join(variant: Option<&str>, team: Option<&str>) -> Option<MinimeCommand> {
        Some(MinimeCommand::Join { color: None, variant: variant.map(str::to_owned), team: team.map(str::to_owned) })
    }

    fn roles(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| (*value).to_owned()).collect()
    }

    #[allow(clippy::unnecessary_wraps, reason = "compared with the results of parse_command")]
    fn join(color: Option<&str>, variant: Option<&str>) -> Option<MinimeCommand> {
        Some(MinimeCommand::Join { color: color.map(str::to_owned), variant: variant.map(str::to_owned), team: None })
    }

    #[test]
    fn colors_in_all_supported_formats() {
        for input in ["#FF00AA", "ff00aa", "#f0a", "255 0 170", "255,0,170", "rgb(255, 0, 170)", " RGB(255,0,170) "] {
            assert_eq!(parse_color(input, 80.0).as_deref(), Some("#ff00aa"), "{input}");
        }
        for input in ["#ff00a", "256 0 0", "#gg0000", "", "purple", "1 2", "rgb(1, 2)", "-1 0 0"] {
            assert_eq!(parse_color(input, 80.0), None, "{input}");
        }
    }

    #[test]
    fn dark_colors_are_brightened_proportionally() {
        assert_eq!(parse_color("#000000", 80.0).as_deref(), Some("#505050"));
        assert_eq!(parse_color("#200010", 80.0).as_deref(), Some("#500028"));
        assert_eq!(parse_color("#ff0000", 80.0).as_deref(), Some("#ff0000"));
        assert_eq!(parse_color("#000000", 0.0).as_deref(), Some("#000000"));
    }

    #[test]
    fn commands_at_the_start_case_insensitive() {
        let rules = rules();
        assert_eq!(parse_command("!join", &[], &rules), join(None, None));
        assert_eq!(parse_command("!JOIN #f0a", &[], &rules), join(Some("#ff00aa"), None));
        assert_eq!(parse_command("!join broken", &[], &rules), join(None, None));
        assert_eq!(
            parse_command("!color 255 0 0", &[], &rules),
            Some(MinimeCommand::Color { color: "#ff0000".to_owned() })
        );
        assert_eq!(parse_command("!color purple", &[], &rules), None);
        assert_eq!(parse_command("!leave", &[], &rules), Some(MinimeCommand::Leave));
        assert_eq!(parse_command("!joinx", &[], &rules), None);
        assert_eq!(parse_command("hello !join", &[], &rules), None);
        let mut ghost = rules.clone();
        ghost.commands.join = "!ghost".to_owned();
        assert_eq!(parse_command("!ghost", &[], &ghost), join(None, None));
    }

    #[test]
    fn roles_for_kicking_and_joining() {
        let rules = rules();
        let kick = Some(MinimeCommand::Kick { login: "neo_42".to_owned() });
        assert_eq!(parse_command("!leave @Neo_42", &roles(&["moderator"]), &rules), kick);
        assert_eq!(parse_command("!leave @Neo_42", &[], &rules), Some(MinimeCommand::Leave));
        assert_eq!(parse_command("!leave @../x", &roles(&["moderator"]), &rules), Some(MinimeCommand::Leave));
        let subs = MinimeRules { join_roles: roles(&["subscriber"]), ..rules.clone() };
        assert_eq!(parse_command("!join", &[], &subs), None);
        assert_eq!(parse_command("!color #fff", &roles(&["vip"]), &subs), None);
        assert_eq!(parse_command("!join", &roles(&["subscriber"]), &subs), join(None, None));
        let vips = MinimeRules { join_roles: roles(&["vip"]), ..rules };
        assert_eq!(parse_command("!join", &roles(&["broadcaster"]), &vips), join(None, None));
    }

    #[test]
    fn names_are_normalized() {
        assert_eq!(normalize_name("Asiatische Birne"), "asiatischebirne");
        assert_eq!(normalize_name("Kaktus-Feige"), "kaktusfeige");
        assert_eq!(normalize_name("Süß"), "suess");
        assert_eq!(normalize_name("  MANGO "), "mango");
    }

    #[test]
    fn variant_mode_commands() {
        let rules = variant_rules();
        assert_eq!(parse_command("!join mango", &[], &rules), join(None, Some("mango")));
        assert_eq!(parse_command("!join", &[], &rules), join(None, None));
        assert_eq!(parse_command("!join xyz", &[], &rules), join(None, None));
        assert_eq!(parse_command("!join #f0a", &[], &rules), join(None, None));
        let star = Some(MinimeCommand::Variant { variant: "sternfrucht".to_owned() });
        assert_eq!(parse_command("!frucht Karambole", &[], &rules), star);
        assert_eq!(parse_command("!frucht xyz", &[], &rules), None);
        assert_eq!(parse_command("!join mango", &[], &self::rules()), join(None, None));
    }

    #[test]
    fn join_reads_role_and_faction_in_any_order() {
        let rules = team_rules();
        assert_eq!(parse_command("!join blau medic", &[], &rules), team_join(Some("medic"), Some("blau")));
        assert_eq!(parse_command("!join medic blau", &[], &rules), team_join(Some("medic"), Some("blau")));
        assert_eq!(parse_command("!join blau", &[], &rules), team_join(None, Some("blau")));
        assert_eq!(parse_command("!join medic", &[], &rules), team_join(Some("medic"), None));
        assert_eq!(parse_command("!join eis am stiel rot", &[], &rules), team_join(Some("eis"), Some("rot")));
        assert_eq!(parse_command("!join rot Eis am Stiel", &[], &rules), team_join(Some("eis"), Some("rot")));
        assert_eq!(parse_command("!join", &[], &rules), team_join(None, None));
        assert_eq!(parse_command("!join gelb medic", &[], &rules), team_join(None, None));
    }

    #[test]
    fn team_command_only_with_factions() {
        let rules = team_rules();
        assert_eq!(parse_command("!team Rot", &[], &rules), Some(MinimeCommand::Team { team: "rot".to_owned() }));
        assert_eq!(parse_command("!team gelb", &[], &rules), None);
        assert_eq!(parse_command("!team rot", &[], &variant_rules()), None);
        let subs = MinimeRules { join_roles: roles(&["subscriber"]), ..rules };
        assert_eq!(parse_command("!team rot", &[], &subs), None);
    }
}
