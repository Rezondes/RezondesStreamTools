//! Context access: who may log in (registration, allowlist, admins) and who gets which feature (levels off, beta,
//! all). Pure decisions; storage and the admin API come later (template: `server/access.ts`).

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::identity::values::Login;

/// Features that can be released individually for beta testers or for everyone
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum Feature {
    Alerts,
    Chat,
    Music,
    Fx,
    Triggers,
    Stinger,
    Banners,
    Themes,
    Minimes,
}

impl Feature {
    pub const ALL: [Self; 9] = [
        Self::Alerts,
        Self::Chat,
        Self::Music,
        Self::Fx,
        Self::Triggers,
        Self::Stinger,
        Self::Banners,
        Self::Themes,
        Self::Minimes,
    ];

    #[must_use]
    pub fn parse(value: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|feature| feature.name() == value)
    }

    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::Alerts => "alerts",
            Self::Chat => "chat",
            Self::Music => "music",
            Self::Fx => "fx",
            Self::Triggers => "triggers",
            Self::Stinger => "stinger",
            Self::Banners => "banners",
            Self::Themes => "themes",
            Self::Minimes => "minimes",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum FeatureLevel {
    Off,
    Beta,
    All,
}

impl FeatureLevel {
    fn parse(value: &str) -> Option<Self> {
        match value {
            "off" => Some(Self::Off),
            "beta" => Some(Self::Beta),
            "all" => Some(Self::All),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum Registration {
    /// Only admins and logins on the allowlist
    Allowlist,
    /// Everyone
    Open,
}

/// Unchecked input of the admin form or of an old file; [`AccessPolicy::sanitize`] makes it valid.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct RawAccess {
    pub registration: Option<String>,
    pub allowlist: Vec<String>,
    pub beta: Vec<String>,
    pub features: BTreeMap<String, String>,
}

/// Who may log in and which features are released; always valid, every feature has a level.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct AccessPolicy {
    pub registration: Registration,
    /// May log in while registration is allowlist
    #[ts(type = "Array<string>")]
    pub allowlist: Vec<Login>,
    /// Additionally get features with level beta
    #[ts(type = "Array<string>")]
    pub beta: Vec<Login>,
    /// Every feature has a level
    pub features: BTreeMap<Feature, FeatureLevel>,
}

/// Valid logins in input order, without duplicates
fn logins(values: &[String]) -> Vec<Login> {
    let mut list: Vec<Login> = Vec::new();
    for login in values.iter().filter_map(|value| Login::parse(value.trim()).ok()) {
        if !list.contains(&login) {
            list.push(login);
        }
    }
    list
}

impl AccessPolicy {
    /// Unknown registration modes become allowlist, unknown or missing levels all, invalid logins and unknown
    /// features drop out.
    #[must_use]
    pub fn sanitize(raw: &RawAccess) -> Self {
        let features = Feature::ALL
            .into_iter()
            .map(|feature| {
                let level = raw.features.get(feature.name()).and_then(|value| FeatureLevel::parse(value));
                (feature, level.unwrap_or(FeatureLevel::All))
            })
            .collect();
        Self {
            registration: if raw.registration.as_deref() == Some("open") {
                Registration::Open
            } else {
                Registration::Allowlist
            },
            allowlist: logins(&raw.allowlist),
            beta: logins(&raw.beta),
            features,
        }
    }

    /// Without a saved policy: only the admins on the allowlist, all features for everyone
    #[must_use]
    pub fn initial(admins: &[Login]) -> Self {
        let raw = RawAccess { allowlist: admins.iter().map(ToString::to_string).collect(), ..RawAccess::default() };
        Self::sanitize(&raw)
    }

    #[must_use]
    pub fn can_use(&self, admins: &[Login], login: &Login) -> bool {
        is_admin(admins, login) || self.registration == Registration::Open || self.allowlist.contains(login)
    }

    #[must_use]
    pub fn has_feature(&self, admins: &[Login], login: &Login, feature: Feature) -> bool {
        match self.features.get(&feature).copied().unwrap_or(FeatureLevel::All) {
            FeatureLevel::All => true,
            FeatureLevel::Beta => is_admin(admins, login) || self.beta.contains(login),
            FeatureLevel::Off => false,
        }
    }

    /// For a profile: which features are on
    #[must_use]
    pub fn features(&self, admins: &[Login], login: &Login) -> BTreeMap<Feature, bool> {
        Feature::ALL.into_iter().map(|feature| (feature, self.has_feature(admins, login, feature))).collect()
    }
}

#[must_use]
pub fn is_admin(admins: &[Login], login: &Login) -> bool {
    admins.contains(login)
}

/// Logins from running that lose access when switching from before to after (their runtime stops immediately)
#[must_use]
pub fn revoked_logins(before: &AccessPolicy, after: &AccessPolicy, admins: &[Login], running: &[Login]) -> Vec<Login> {
    running.iter().filter(|login| before.can_use(admins, login) && !after.can_use(admins, login)).cloned().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn login(value: &str) -> Login {
        Login::parse(value).expect("valid login")
    }

    fn raw(registration: Option<&str>, allowlist: &[&str], beta: &[&str], features: &[(&str, &str)]) -> RawAccess {
        let strings = |values: &[&str]| values.iter().map(|value| (*value).to_owned()).collect();
        RawAccess {
            registration: registration.map(str::to_owned),
            allowlist: strings(allowlist),
            beta: strings(beta),
            features: features.iter().map(|(key, value)| ((*key).to_owned(), (*value).to_owned())).collect(),
        }
    }

    fn admins() -> Vec<Login> {
        vec![login("rezondes")]
    }

    fn beta_policy() -> AccessPolicy {
        AccessPolicy::sanitize(&raw(Some("allowlist"), &["Friend1"], &["tester"], &[("music", "beta"), ("fx", "off")]))
    }

    #[test]
    fn allowlist_only_admins_and_listed_logins() {
        let policy = beta_policy();
        assert!(policy.can_use(&admins(), &login("rezondes")));
        assert!(policy.can_use(&admins(), &login("FRIEND1")));
        assert!(!policy.can_use(&admins(), &login("stranger")));
    }

    #[test]
    fn open_registration_lets_everyone_in() {
        let policy = AccessPolicy { registration: Registration::Open, ..beta_policy() };
        assert!(policy.can_use(&admins(), &login("stranger")));
    }

    #[test]
    fn levels_all_beta_off() {
        let policy = beta_policy();
        assert!(policy.has_feature(&admins(), &login("friend1"), Feature::Alerts));
        assert!(!policy.has_feature(&admins(), &login("friend1"), Feature::Music));
        assert!(policy.has_feature(&admins(), &login("tester"), Feature::Music));
        assert!(policy.has_feature(&admins(), &login("rezondes"), Feature::Music));
        assert!(!policy.has_feature(&admins(), &login("rezondes"), Feature::Fx));
        let features = policy.features(&admins(), &login("friend1"));
        assert_eq!(features.len(), 9);
        assert_eq!(features.get(&Feature::Music), Some(&false));
    }

    #[test]
    fn sanitize_gives_safe_defaults_and_lists_without_duplicates() {
        let odd = AccessPolicy::sanitize(&raw(
            Some("anyone"),
            &[" A ", "a", "", "not valid"],
            &[],
            &[("music", "maybe"), ("nothing", "off")],
        ));
        assert_eq!(odd.registration, Registration::Allowlist);
        assert_eq!(odd.allowlist, vec![login("a")]);
        assert_eq!(odd.features.get(&Feature::Music), Some(&FeatureLevel::All));
        assert_eq!(odd.features.len(), 9);
        assert_eq!(odd.features.get(&Feature::Minimes), Some(&FeatureLevel::All));
    }

    #[test]
    fn initial_policy_allows_the_admins_and_everything() {
        let policy = AccessPolicy::initial(&admins());
        assert_eq!(policy.allowlist, admins());
        assert!(policy.has_feature(&admins(), &login("friend"), Feature::Music));
        assert!(is_admin(&admins(), &login("REZONDES")));
        assert!(!is_admin(&admins(), &login("friend")));
    }

    #[test]
    fn revoked_logins_only_running_and_never_admins() {
        let before = AccessPolicy::sanitize(&raw(None, &["friend1", "friend2"], &[], &[]));
        let only_second = AccessPolicy::sanitize(&raw(None, &["friend2"], &[], &[]));
        let running = [login("rezondes"), login("friend1"), login("friend2")];
        assert_eq!(revoked_logins(&before, &only_second, &admins(), &running), vec![login("friend1")]);
        let nobody = AccessPolicy::sanitize(&raw(None, &[], &[], &[]));
        assert!(revoked_logins(&before, &nobody, &admins(), &[login("rezondes")]).is_empty());
        let open = AccessPolicy::sanitize(&raw(Some("open"), &[], &[], &[]));
        assert_eq!(
            revoked_logins(&open, &only_second, &admins(), &[login("stranger"), login("friend2")]),
            vec![login("stranger")]
        );
        assert!(revoked_logins(&before, &before, &admins(), &[login("friend1")]).is_empty());
    }

    #[test]
    fn policy_round_trips_as_json() {
        let policy = beta_policy();
        let json = serde_json::to_string(&policy).expect("serialize");
        assert!(json.contains("\"registration\":\"allowlist\""));
        assert!(json.contains("\"music\":\"beta\""));
        assert_eq!(serde_json::from_str::<AccessPolicy>(&json).expect("deserialize"), policy);
        let raw: RawAccess = serde_json::from_str("{\"allowlist\":[\"Neo\"]}").expect("lenient input");
        assert_eq!(AccessPolicy::sanitize(&raw).allowlist, vec![login("neo")]);
    }
}
