//! Cooldowns of chat triggers for everyone (trigger name) and per viewer (name and login), template: the
//! cooldowns in `server/triggers.ts`. Entries remember until when they block; expired entries are removed once a
//! minute, so many different viewers cannot grow the table without limit.

use std::collections::HashMap;

/// How often expired entries are removed, in ms
const PRUNE_EVERY_MS: u64 = 60_000;

#[derive(Debug, Default)]
pub struct Cooldowns {
    /// Key -> time in ms until which it blocks
    until: HashMap<String, u64>,
    next_prune: u64,
}

fn millis(seconds: f64) -> u64 {
    // Cooldowns are checked to finite values before; negative values count as none
    #[expect(clippy::cast_possible_truncation, clippy::cast_sign_loss, reason = "clamped to non-negative")]
    let value = (seconds.max(0.0) * 1000.0).round() as u64;
    value
}

impl Cooldowns {
    /// Whether the trigger may fire for this viewer now; if so, both cooldowns start.
    /// `cooldown` and `user_cooldown` in seconds, `now` in ms.
    pub fn ready(&mut self, name: &str, cooldown: f64, user_cooldown: f64, login: &str, now: u64) -> bool {
        self.prune(now);
        let user_key = format!("{name}:{login}");
        let blocked = |key: &str| self.until.get(key).is_some_and(|until| now < *until);
        if blocked(name) || blocked(&user_key) {
            return false;
        }
        if cooldown > 0.0 {
            self.until.insert(name.to_owned(), now + millis(cooldown));
        }
        if user_cooldown > 0.0 {
            self.until.insert(user_key, now + millis(user_cooldown));
        }
        true
    }

    fn prune(&mut self, now: u64) {
        if now >= self.next_prune {
            self.until.retain(|_, until| *until > now);
            self.next_prune = now + PRUNE_EVERY_MS;
        }
    }

    /// Number of remembered entries
    #[must_use]
    pub fn len(&self) -> usize {
        self.until.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.until.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cooldown_for_everyone_and_per_viewer() {
        let mut cooldowns = Cooldowns::default();
        assert!(cooldowns.ready("lizard", 10.0, 60.0, "neo", 0));
        assert!(!cooldowns.ready("lizard", 10.0, 60.0, "trinity", 5_000));
        assert!(cooldowns.ready("lizard", 10.0, 60.0, "trinity", 10_000));
        assert!(!cooldowns.ready("lizard", 10.0, 60.0, "neo", 30_000));
        assert!(cooldowns.ready("lizard", 10.0, 60.0, "neo", 60_000));
        assert!(cooldowns.ready("other", 10.0, 60.0, "neo", 60_000));
    }

    #[test]
    fn without_cooldowns_nothing_is_remembered() {
        let mut cooldowns = Cooldowns::default();
        assert!(cooldowns.ready("lizard", 0.0, 0.0, "neo", 0));
        assert!(cooldowns.ready("lizard", 0.0, 0.0, "neo", 0));
        assert!(cooldowns.is_empty());
    }

    #[test]
    fn prunes_expired() {
        let mut cooldowns = Cooldowns::default();
        for viewer in 0..10_000 {
            assert!(cooldowns.ready("lizard", 0.0, 30.0, &format!("viewer{viewer}"), 1_000));
        }
        assert_eq!(cooldowns.len(), 10_000);
        assert!(cooldowns.ready("lizard", 0.0, 0.0, "neo", 10_000_000));
        assert!(cooldowns.is_empty());
    }
}
