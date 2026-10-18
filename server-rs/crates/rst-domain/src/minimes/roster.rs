//! The list of joined chatters and what an event does to it (only here; the frontend no longer has a copy).
//! Pure: time comes in as `now` (ms), randomness for assigning variants as `random` (0 to below 1). Colors and
//! variants stay remembered when a minime leaves, limited to [`MAX_STORED`] entries each.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::minimes::command::parse_color;
use crate::minimes::rules::{MinimeRules, WhenFull};

/// Memory guard, so the saved state does not grow without limit
pub const MAX_STORED: usize = 2000;

/// A joined chatter; `color`: `#rrggbb` or `None` = default color of the theme, `variant` in themes with variants,
/// `team` in themes with factions
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinimeEntry {
    pub login: String,
    pub user: String,
    pub color: Option<String>,
    pub variant: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub team: Option<String>,
    pub last_seen: i64,
}

/// A minime as the overlays see it (template: `Minime` in `src/core/types.ts`)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Minime {
    pub login: String,
    pub user: String,
    pub color: Option<String>,
    pub variant: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub team: Option<String>,
}

impl From<&MinimeEntry> for Minime {
    fn from(entry: &MinimeEntry) -> Self {
        Self {
            login: entry.login.clone(),
            user: entry.user.clone(),
            color: entry.color.clone(),
            variant: entry.variant.clone(),
            team: entry.team.clone(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredColor {
    pub color: String,
    /// Last used (for the upper limit)
    pub used_at: i64,
    /// Last changed (for the cooldown)
    pub changed_at: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredVariant {
    pub variant: String,
    pub used_at: i64,
    pub changed_at: i64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct MinimeState {
    pub roster: Vec<MinimeEntry>,
    pub colors: BTreeMap<String, StoredColor>,
    pub variants: BTreeMap<String, StoredVariant>,
    /// Remembered factions, in the same shape as the variants
    #[serde(default)]
    pub teams: BTreeMap<String, StoredVariant>,
}

/// Events from chat and from the server. `twitch_color`: name color from the Twitch tag (or none)
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MinimeEvent {
    Join {
        login: String,
        user: String,
        color: Option<String>,
        variant: Option<String>,
        team: Option<String>,
        twitch_color: Option<String>,
    },
    Color {
        login: String,
        user: String,
        color: String,
        twitch_color: Option<String>,
    },
    Variant {
        login: String,
        user: String,
        variant: String,
    },
    Team {
        login: String,
        user: String,
        team: String,
    },
    Leave {
        login: String,
    },
    Kick {
        login: String,
    },
    Chat {
        login: String,
    },
    Ban {
        login: String,
    },
    /// Removes inactive ones, shortens to max, replaces switched-off variants
    Prune,
    Clear,
}

/// `changed`: the visible list changed; `react`: login whose minime should react to chat
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MinimeResult {
    pub state: MinimeState,
    pub changed: bool,
    pub react: Option<String>,
}

fn unchanged(state: MinimeState) -> MinimeResult {
    MinimeResult { state, changed: false, react: None }
}

fn millis(seconds: f64) -> i64 {
    #[expect(clippy::cast_possible_truncation, reason = "settings limit the cooldown to 0..=300 s")]
    let value = (seconds * 1000.0).round() as i64;
    value
}

/// Common shape of remembered colors and variants
trait Remembered: Clone {
    fn value(&self) -> &str;
    fn changed_at(&self) -> i64;
    fn used_at(&self) -> i64;
    fn make(value: &str, used_at: i64, changed_at: i64) -> Self;
}

impl Remembered for StoredColor {
    fn value(&self) -> &str {
        &self.color
    }
    fn changed_at(&self) -> i64 {
        self.changed_at
    }
    fn used_at(&self) -> i64 {
        self.used_at
    }
    fn make(value: &str, used_at: i64, changed_at: i64) -> Self {
        Self { color: value.to_owned(), used_at, changed_at }
    }
}

impl Remembered for StoredVariant {
    fn value(&self) -> &str {
        &self.variant
    }
    fn changed_at(&self) -> i64 {
        self.changed_at
    }
    fn used_at(&self) -> i64 {
        self.used_at
    }
    fn make(value: &str, used_at: i64, changed_at: i64) -> Self {
        Self { variant: value.to_owned(), used_at, changed_at }
    }
}

/// Remembers a new value when the cooldown is over; the longest unused entry drops out above the limit
fn remember<Entry: Remembered>(
    map: &BTreeMap<String, Entry>,
    login: &str,
    value: &str,
    now: i64,
    rules: &MinimeRules,
) -> BTreeMap<String, Entry> {
    let stored = map.get(login);
    let same = stored.is_some_and(|stored| stored.value() == value);
    if let Some(stored) = stored
        && !same
        && now - stored.changed_at() < millis(rules.color_cooldown_s)
    {
        return map.clone();
    }
    let changed_at = if same { stored.map_or(now, Remembered::changed_at) } else { now };
    let mut next = map.clone();
    next.insert(login.to_owned(), Entry::make(value, now, changed_at));
    if next.len() > MAX_STORED
        && let Some(oldest) = next.iter().min_by_key(|(_, entry)| entry.used_at()).map(|(login, _)| login.clone())
    {
        next.remove(&oldest);
    }
    next
}

fn allowed_variants(rules: &MinimeRules) -> Vec<String> {
    rules.variants.iter().flatten().map(|variant| variant.id.clone()).collect()
}

fn allowed_teams(rules: &MinimeRules) -> Vec<String> {
    rules.teams.iter().flatten().map(|team| team.id.clone()).collect()
}

/// Faction of a chatter: chosen and allowed, otherwise remembered and allowed, otherwise the allowed faction with the
/// fewest members in `roster` (the first on a tie; switchable right away). Without factions `None`.
fn resolve_team(
    teams: &BTreeMap<String, StoredVariant>,
    roster: &[MinimeEntry],
    login: &str,
    chosen: Option<&str>,
    now: i64,
    rules: &MinimeRules,
) -> (BTreeMap<String, StoredVariant>, Option<String>) {
    let allowed = allowed_teams(rules);
    if allowed.is_empty() {
        return (teams.clone(), None);
    }
    let mut picked = match chosen {
        Some(chosen) if allowed.iter().any(|id| id == chosen) => remember(teams, login, chosen, now, rules),
        _ => teams.clone(),
    };
    if let Some(stored) = picked.get_mut(login)
        && allowed.contains(&stored.variant)
    {
        stored.used_at = now;
        let team = stored.variant.clone();
        return (picked, Some(team));
    }
    let members =
        |id: &String| roster.iter().filter(|entry| entry.login != login && entry.team.as_ref() == Some(id)).count();
    let team = allowed.iter().min_by_key(|id| members(id)).cloned().unwrap_or_default();
    let free = now - millis(rules.color_cooldown_s);
    picked.insert(login.to_owned(), StoredVariant { variant: team.clone(), used_at: now, changed_at: free });
    (picked, Some(team))
}

/// Variant of a chatter: chosen and allowed, otherwise remembered and allowed, otherwise random allowed (switchable
/// right away). Without allowed variants or in color mode `None`.
fn resolve_variant(
    variants: &BTreeMap<String, StoredVariant>,
    login: &str,
    chosen: Option<&str>,
    now: i64,
    rules: &MinimeRules,
    random: &mut dyn FnMut() -> f64,
) -> (BTreeMap<String, StoredVariant>, Option<String>) {
    let allowed = allowed_variants(rules);
    if allowed.is_empty() {
        return (variants.clone(), None);
    }
    let mut picked = match chosen {
        Some(chosen) if allowed.iter().any(|id| id == chosen) => remember(variants, login, chosen, now, rules),
        _ => variants.clone(),
    };
    if let Some(stored) = picked.get_mut(login)
        && allowed.contains(&stored.variant)
    {
        stored.used_at = now;
        let variant = stored.variant.clone();
        return (picked, Some(variant));
    }
    #[expect(
        clippy::cast_possible_truncation,
        clippy::cast_sign_loss,
        clippy::cast_precision_loss,
        reason = "random is below 1, the index stays below the number of variants"
    )]
    let index = ((random() * allowed.len() as f64).floor() as usize).min(allowed.len() - 1);
    let variant = allowed[index].clone();
    let free = now - millis(rules.color_cooldown_s);
    picked.insert(login.to_owned(), StoredVariant { variant: variant.clone(), used_at: now, changed_at: free });
    (picked, Some(variant))
}

/// List without the longest inactive ones, until at most `max` are left (order stays)
fn trim(roster: &[MinimeEntry], max: usize) -> Vec<MinimeEntry> {
    let mut indices: Vec<usize> = (0..roster.len()).collect();
    indices.sort_by(|first, second| roster[*second].last_seen.cmp(&roster[*first].last_seen));
    let kept: Vec<usize> = indices.into_iter().take(max).collect();
    roster.iter().enumerate().filter(|(index, _)| kept.contains(index)).map(|(_, entry)| entry.clone()).collect()
}

/// The parts of join, color and variant events that decide the look
struct Look<'a> {
    login: &'a str,
    user: &'a str,
    color: Option<&'a str>,
    variant: Option<&'a str>,
    team: Option<&'a str>,
    twitch_color: Option<&'a str>,
    /// A variant event never changes the color
    variant_event: bool,
}

/// Color of a chatter: chosen, otherwise remembered, otherwise Twitch color (if switched on); `None` in variant mode
fn resolve_color(
    state: &MinimeState,
    look: &Look,
    now: i64,
    rules: &MinimeRules,
) -> (BTreeMap<String, StoredColor>, Option<String>) {
    if rules.variants.is_some() || look.variant_event {
        return (state.colors.clone(), None);
    }
    let mut colors = match look.color {
        Some(color) => remember(&state.colors, look.login, color, now, rules),
        None => state.colors.clone(),
    };
    if let Some(stored) = colors.get_mut(look.login) {
        stored.used_at = now;
    }
    let twitch =
        look.twitch_color.filter(|_| rules.use_twitch_color).and_then(|color| parse_color(color, rules.min_brightness));
    let color = colors.get(look.login).map(|stored| stored.color.clone()).or(twitch);
    (colors, color)
}

/// Join (or update color, variant and name of a joined chatter)
fn join(
    state: &MinimeState,
    look: &Look,
    now: i64,
    rules: &MinimeRules,
    random: &mut dyn FnMut() -> f64,
) -> MinimeResult {
    let (colors, color) = resolve_color(state, look, now, rules);
    let (variants, variant) = resolve_variant(&state.variants, look.login, look.variant, now, rules, random);
    let (teams, team) = resolve_team(&state.teams, &state.roster, look.login, look.team, now, rules);
    let minime =
        MinimeEntry { login: look.login.to_owned(), user: look.user.to_owned(), color, variant, team, last_seen: now };
    if let Some(index) = state.roster.iter().position(|entry| entry.login == look.login) {
        let present = &state.roster[index];
        let changed = present.user != minime.user
            || present.color != minime.color
            || present.variant != minime.variant
            || present.team != minime.team;
        let mut roster = state.roster.clone();
        roster[index] = minime;
        return MinimeResult { state: MinimeState { roster, colors, variants, teams }, changed, react: None };
    }
    if state.roster.len() >= rules.max && rules.when_full == WhenFull::Reject {
        return unchanged(MinimeState { roster: state.roster.clone(), colors, variants, teams });
    }
    let mut roster = trim(&state.roster, rules.max.saturating_sub(1));
    roster.push(minime);
    MinimeResult { state: MinimeState { roster, colors, variants, teams }, changed: true, react: None }
}

fn remove(state: &MinimeState, login: &str) -> MinimeResult {
    let roster: Vec<MinimeEntry> = state.roster.iter().filter(|entry| entry.login != login).cloned().collect();
    let changed = roster.len() != state.roster.len();
    MinimeResult { state: MinimeState { roster, ..state.clone() }, changed, react: None }
}

fn chat(state: &MinimeState, login: &str, now: i64, rules: &MinimeRules) -> MinimeResult {
    if !state.roster.iter().any(|entry| entry.login == login) {
        return unchanged(state.clone());
    }
    let mut next = state.clone();
    if rules.chat_keeps_alive {
        for entry in next.roster.iter_mut().filter(|entry| entry.login == login) {
            entry.last_seen = now;
        }
    }
    MinimeResult { state: next, changed: false, react: rules.react_to_chat.then(|| login.to_owned()) }
}

/// Removes inactive ones, shortens to max, and gives everyone an allowed variant and faction
fn prune(state: &MinimeState, now: i64, rules: &MinimeRules, random: &mut dyn FnMut() -> f64) -> MinimeResult {
    #[expect(clippy::cast_possible_truncation, reason = "settings limit idle minutes to 0..=240")]
    let idle_ms = (rules.idle_minutes * 60_000.0).round() as i64;
    let active: Vec<MinimeEntry> = if rules.idle_minutes > 0.0 {
        state.roster.iter().filter(|entry| now - entry.last_seen <= idle_ms).cloned().collect()
    } else {
        state.roster.clone()
    };
    let kept = trim(&active, rules.max);
    let allowed = allowed_variants(rules);
    let mut variants = state.variants.clone();
    let mut roster: Vec<MinimeEntry> = kept
        .iter()
        .map(|entry| {
            let fits = entry.variant.as_ref().map_or(allowed.is_empty(), |variant| allowed.contains(variant));
            if rules.variants.is_none() || fits {
                return entry.clone();
            }
            let (next, variant) = resolve_variant(&variants, &entry.login, None, now, rules, random);
            variants = next;
            MinimeEntry { variant, ..entry.clone() }
        })
        .collect();
    let allowed = allowed_teams(rules);
    let mut teams = state.teams.clone();
    for index in 0..roster.len() {
        if roster[index].team.as_ref().map_or(allowed.is_empty(), |team| allowed.contains(team)) {
            continue;
        }
        let login = roster[index].login.clone();
        let (next, team) = resolve_team(&teams, &roster, &login, None, now, rules);
        teams = next;
        roster[index].team = team;
    }
    let changed = roster.len() != state.roster.len() || roster != kept;
    let state = MinimeState { roster, colors: state.colors.clone(), variants, teams };
    MinimeResult { state, changed, react: None }
}

/// Applies an event to the list
pub fn apply(
    state: &MinimeState,
    event: &MinimeEvent,
    now: i64,
    rules: &MinimeRules,
    random: &mut dyn FnMut() -> f64,
) -> MinimeResult {
    let present = |login: &str| state.roster.iter().any(|entry| entry.login == login);
    match event {
        MinimeEvent::Join { login, user, color, variant, team, twitch_color } => {
            let look = Look {
                login,
                user,
                color: color.as_deref(),
                variant: variant.as_deref(),
                team: team.as_deref(),
                twitch_color: twitch_color.as_deref(),
                variant_event: false,
            };
            join(state, &look, now, rules, random)
        }
        MinimeEvent::Color { login, user, color, twitch_color } => {
            if present(login) || rules.color_joins {
                let twitch_color = twitch_color.as_deref();
                let look = Look {
                    login,
                    user,
                    color: Some(color),
                    variant: None,
                    team: None,
                    twitch_color,
                    variant_event: false,
                };
                return join(state, &look, now, rules, random);
            }
            unchanged(MinimeState { colors: remember(&state.colors, login, color, now, rules), ..state.clone() })
        }
        MinimeEvent::Variant { login, user, variant } => {
            if present(login) || rules.color_joins {
                let look = Look {
                    login,
                    user,
                    color: None,
                    variant: Some(variant),
                    team: None,
                    twitch_color: None,
                    variant_event: true,
                };
                return join(state, &look, now, rules, random);
            }
            unchanged(MinimeState { variants: remember(&state.variants, login, variant, now, rules), ..state.clone() })
        }
        MinimeEvent::Team { login, user, team } => {
            if present(login) || rules.color_joins {
                let look = Look {
                    login,
                    user,
                    color: None,
                    variant: None,
                    team: Some(team),
                    twitch_color: None,
                    variant_event: true,
                };
                return join(state, &look, now, rules, random);
            }
            unchanged(MinimeState { teams: remember(&state.teams, login, team, now, rules), ..state.clone() })
        }
        MinimeEvent::Leave { login } | MinimeEvent::Kick { login } => remove(state, login),
        MinimeEvent::Ban { login } => {
            if rules.remove_on_ban {
                remove(state, login)
            } else {
                unchanged(state.clone())
            }
        }
        MinimeEvent::Chat { login } => chat(state, login, now, rules),
        MinimeEvent::Prune => prune(state, now, rules, random),
        MinimeEvent::Clear => {
            let changed = !state.roster.is_empty();
            MinimeResult { state: MinimeState { roster: Vec::new(), ..state.clone() }, changed, react: None }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::minimes::command::tests::{rules, team_rules, variant_rules};
    use crate::minimes::rules::MinimeVariantRule;

    const MINUTE: i64 = 60_000;

    fn run_with(steps: &[(MinimeEvent, i64)], rules: &MinimeRules, start: MinimeState) -> MinimeState {
        steps.iter().fold(start, |state, (event, now)| apply(&state, event, *now, rules, &mut || 0.0).state)
    }

    fn run(steps: &[(MinimeEvent, i64)], rules: &MinimeRules) -> MinimeState {
        run_with(steps, rules, MinimeState::default())
    }

    fn logins(state: &MinimeState) -> Vec<&str> {
        state.roster.iter().map(|minime| minime.login.as_str()).collect()
    }

    fn join(login: &str, color: Option<&str>, twitch_color: Option<&str>, variant: Option<&str>) -> MinimeEvent {
        MinimeEvent::Join {
            login: login.to_owned(),
            user: login.to_uppercase(),
            color: color.map(str::to_owned),
            variant: variant.map(str::to_owned),
            team: None,
            twitch_color: twitch_color.map(str::to_owned),
        }
    }

    fn plain(login: &str) -> MinimeEvent {
        join(login, None, None, None)
    }

    fn entry(login: &str, color: Option<&str>, variant: Option<&str>, last_seen: i64) -> MinimeEntry {
        MinimeEntry {
            login: login.to_owned(),
            user: login.to_uppercase(),
            color: color.map(str::to_owned),
            variant: variant.map(str::to_owned),
            team: None,
            last_seen,
        }
    }

    #[test]
    fn join_leave_and_come_back_with_the_remembered_color() {
        let rules = rules();
        let first = apply(&MinimeState::default(), &join("neo", Some("#ff00aa"), None, None), 0, &rules, &mut || 0.0);
        assert!(first.changed);
        let left = apply(&first.state, &MinimeEvent::Leave { login: "neo".to_owned() }, 1000, &rules, &mut || 0.0);
        assert!(left.changed);
        assert!(left.state.roster.is_empty());
        let back = apply(&left.state, &plain("neo"), 20_000, &rules, &mut || 0.0);
        assert_eq!(back.state.roster, vec![entry("neo", Some("#ff00aa"), None, 20_000)]);
        assert!(!apply(&back.state, &plain("neo"), 21_000, &rules, &mut || 0.0).changed);
    }

    #[test]
    fn twitch_color_when_switched_on() {
        let rules = rules();
        let dark = [(join("neo", None, Some("#000000"), None), 0)];
        assert_eq!(run(&dark, &rules).roster[0].color.as_deref(), Some("#505050"));
        assert_eq!(run(&dark, &MinimeRules { use_twitch_color: false, ..rules }).roster[0].color, None);
    }

    #[test]
    fn chat_keeps_alive_and_reacts() {
        let rules = rules();
        let state = run(&[(plain("neo"), 0)], &rules);
        let chat = MinimeEvent::Chat { login: "neo".to_owned() };
        let result = apply(&state, &chat, 5000, &rules, &mut || 0.0);
        assert_eq!(
            (result.state.roster[0].last_seen, result.react.as_deref(), result.changed),
            (5000, Some("neo"), false)
        );
        let quiet = MinimeRules { react_to_chat: false, ..rules.clone() };
        assert_eq!(apply(&state, &chat, 5000, &quiet, &mut || 0.0).react, None);
        let frozen = MinimeRules { chat_keeps_alive: false, ..rules.clone() };
        assert_eq!(apply(&state, &chat, 5000, &frozen, &mut || 0.0).state.roster[0].last_seen, 0);
        let stranger = apply(&state, &MinimeEvent::Chat { login: "smith".to_owned() }, 5000, &rules, &mut || 0.0);
        assert_eq!((stranger.state, stranger.react), (state, None));
    }

    #[test]
    fn full_list_replaces_or_rejects() {
        let steps = [(plain("a"), 1), (plain("b"), 2), (plain("c"), 3)];
        assert_eq!(logins(&run(&steps, &MinimeRules { max: 2, ..rules() })), ["b", "c"]);
        assert_eq!(logins(&run(&steps, &MinimeRules { max: 2, when_full: WhenFull::Reject, ..rules() })), ["a", "b"]);
    }

    #[test]
    fn prune_removes_inactive_and_shortens() {
        let steps = [(plain("a"), 0), (plain("b"), 16 * MINUTE), (MinimeEvent::Prune, 21 * MINUTE)];
        assert_eq!(logins(&run(&steps, &rules())), ["b"]);
        assert_eq!(logins(&run(&steps, &MinimeRules { idle_minutes: 0.0, ..rules() })), ["a", "b"]);
        let full = run(&[(plain("a"), 1), (plain("b"), 2), (plain("c"), 3)], &rules());
        assert_eq!(logins(&run_with(&[(MinimeEvent::Prune, 4)], &MinimeRules { max: 1, ..rules() }, full)), ["c"]);
    }

    #[test]
    fn color_cooldown_and_color_joins() {
        let color = |value: &str| MinimeEvent::Color {
            login: "b".to_owned(),
            user: "B".to_owned(),
            color: value.to_owned(),
            twitch_color: None,
        };
        let rules = rules();
        let state = run(&[(plain("b"), 0), (color("#ff0000"), 1000), (color("#00ff00"), 4000)], &rules);
        assert_eq!(state.roster[0].color.as_deref(), Some("#ff0000"));
        let later = run_with(&[(color("#00ff00"), 12_000)], &rules, state);
        assert_eq!(later.roster[0].color.as_deref(), Some("#00ff00"));
        let closed = MinimeRules { color_joins: false, ..rules.clone() };
        let outside = run(&[(color("#0000ff"), 0)], &closed);
        assert!(outside.roster.is_empty());
        assert_eq!(run_with(&[(plain("b"), 1000)], &rules, outside).roster[0].color.as_deref(), Some("#0000ff"));
        assert_eq!(logins(&run(&[(color("#0000ff"), 0)], &rules)), ["b"]);
    }

    #[test]
    fn kick_ban_and_clear() {
        let rules = rules();
        let state = run(&[(plain("a"), 0), (plain("b"), 0)], &rules);
        let kick = MinimeEvent::Kick { login: "a".to_owned() };
        let ban = MinimeEvent::Ban { login: "a".to_owned() };
        assert_eq!(logins(&run_with(&[(kick, 1)], &rules, state.clone())), ["b"]);
        assert_eq!(logins(&run_with(&[(ban.clone(), 1)], &rules, state.clone())), ["b"]);
        let keep = MinimeRules { remove_on_ban: false, ..rules.clone() };
        assert_eq!(logins(&run_with(&[(ban, 1)], &keep, state.clone())), ["a", "b"]);
        let cleared = apply(&state, &MinimeEvent::Clear, 1, &rules, &mut || 0.0);
        assert!(cleared.state.roster.is_empty() && cleared.changed);
        assert!(!apply(&cleared.state, &MinimeEvent::Clear, 2, &rules, &mut || 0.0).changed);
        assert!(!apply(&state, &MinimeEvent::Leave { login: "foreign".to_owned() }, 1, &rules, &mut || 0.0).changed);
    }

    #[test]
    fn color_memory_is_limited() {
        let closed = MinimeRules { color_joins: false, ..rules() };
        let mut state = MinimeState::default();
        for chatter in 0..=MAX_STORED {
            let event = MinimeEvent::Color {
                login: format!("c{chatter}"),
                user: "C".to_owned(),
                color: "#ff0000".to_owned(),
                twitch_color: None,
            };
            let now = i64::try_from(chatter).expect("small number");
            state = apply(&state, &event, now, &closed, &mut || 0.0).state;
        }
        assert_eq!(state.colors.len(), MAX_STORED);
        assert!(!state.colors.contains_key("c0"));
        assert!(state.colors.contains_key(&format!("c{MAX_STORED}")));
    }

    #[test]
    fn variant_mode_join_picks_and_remembers() {
        let rules = variant_rules();
        let start = MinimeState::default();
        let first = apply(&start, &join("neo", None, Some("#ff0000"), None), 0, &rules, &mut || 0.99).state;
        assert_eq!(first.roster[0], entry("neo", None, Some("sternfrucht"), 0));
        let left = apply(&first, &MinimeEvent::Leave { login: "neo".to_owned() }, 1000, &rules, &mut || 0.0).state;
        let back = apply(&left, &plain("neo"), 2000, &rules, &mut || 0.0).state;
        assert_eq!(back.roster[0].variant.as_deref(), Some("sternfrucht"));
        let switch =
            MinimeEvent::Variant { login: "neo".to_owned(), user: "NEO".to_owned(), variant: "mango".to_owned() };
        assert_eq!(apply(&first, &switch, 1000, &rules, &mut || 0.0).state.roster[0].variant.as_deref(), Some("mango"));
    }

    #[test]
    fn variant_cooldown_and_variant_joins() {
        let rules = variant_rules();
        let pick = |variant: &str| MinimeEvent::Variant {
            login: "neo".to_owned(),
            user: "NEO".to_owned(),
            variant: variant.to_owned(),
        };
        let state = run(&[(join("neo", None, None, Some("mango")), 0), (pick("sternfrucht"), 3000)], &rules);
        assert_eq!(state.roster[0].variant.as_deref(), Some("mango"));
        let later = run_with(&[(pick("sternfrucht"), 12_000)], &rules, state);
        assert_eq!(later.roster[0].variant.as_deref(), Some("sternfrucht"));
        let closed = MinimeRules { color_joins: false, ..rules.clone() };
        assert!(run(&[(pick("mango"), 0)], &closed).roster.is_empty());
        assert_eq!(run(&[(pick("mango"), 0), (plain("neo"), 1)], &closed).roster[0].variant.as_deref(), Some("mango"));
    }

    #[test]
    fn switched_off_variant_is_replaced_on_prune() {
        let rules = variant_rules();
        let state = run(&[(join("neo", None, None, Some("mango")), 0)], &rules);
        let star = MinimeVariantRule { id: "sternfrucht".to_owned(), names: vec!["sternfrucht".to_owned()] };
        let only_star = MinimeRules { variants: Some(vec![star]), ..rules };
        let pruned = apply(&state, &MinimeEvent::Prune, 1000, &only_star, &mut || 0.0);
        assert_eq!((pruned.state.roster[0].variant.as_deref(), pruned.changed), (Some("sternfrucht"), true));
        let next = apply(&pruned.state, &plain("trinity"), 1000, &only_star, &mut || 0.0).state;
        assert_eq!(next.roster[1].variant.as_deref(), Some("sternfrucht"));
    }

    fn team_of<'a>(state: &'a MinimeState, login: &str) -> Option<&'a str> {
        state.roster.iter().find(|entry| entry.login == login).and_then(|entry| entry.team.as_deref())
    }

    fn team_join(login: &str, team: Option<&str>) -> MinimeEvent {
        MinimeEvent::Join {
            login: login.to_owned(),
            user: login.to_uppercase(),
            color: None,
            variant: None,
            team: team.map(str::to_owned),
            twitch_color: None,
        }
    }

    #[test]
    fn join_picks_smallest_team() {
        let rules = team_rules();
        let state = run(&[(team_join("neo", Some("blau")), 0), (plain("smith"), 0), (plain("trinity"), 0)], &rules);
        assert_eq!(team_of(&state, "neo"), Some("blau"));
        assert_eq!(team_of(&state, "smith"), Some("rot"));
        // A tie gives the first faction
        assert_eq!(team_of(&state, "trinity"), Some("blau"));
        assert!(state.roster.iter().all(|entry| entry.variant.is_some()));
    }

    #[test]
    fn remembered_team_wins_and_team_changes_wait_for_the_cooldown() {
        let rules = team_rules();
        let team = |login: &str, team: &str| MinimeEvent::Team {
            login: login.to_owned(),
            user: login.to_uppercase(),
            team: team.to_owned(),
        };
        let leave = MinimeEvent::Leave { login: "neo".to_owned() };
        let state =
            run(&[(team_join("neo", Some("rot")), 0), (leave, 1), (plain("smith"), 2), (plain("neo"), 3)], &rules);
        assert_eq!(team_of(&state, "neo"), Some("rot"));
        let changed = run_with(&[(team("neo", "blau"), 4)], &rules, state.clone());
        assert_eq!(team_of(&changed, "neo"), Some("rot"), "cooldown of 10 s");
        let later = run_with(&[(team("neo", "blau"), 20_000)], &rules, state);
        assert_eq!(team_of(&later, "neo"), Some("blau"));
        // The team command joins like the look command
        let joined = run(&[(team("trinity", "rot"), 0)], &rules);
        assert_eq!(team_of(&joined, "trinity"), Some("rot"));
    }

    #[test]
    fn disabled_team_is_reassigned() {
        let mut rules = team_rules();
        let state = run(&[(team_join("neo", Some("rot")), 0)], &rules);
        rules.teams = Some(rules.teams.unwrap_or_default().into_iter().filter(|team| team.id != "rot").collect());
        let pruned = apply(&state, &MinimeEvent::Prune, 1, &rules, &mut || 0.0);
        assert!(pruned.changed);
        assert_eq!(team_of(&pruned.state, "neo"), Some("blau"));
        // Without factions nobody has one
        let plain_state = run(&[(plain("smith"), 0)], &variant_rules());
        assert_eq!(team_of(&plain_state, "smith"), None);
    }
}
