//! Pending OAuth logins (Twitch, Spotify): random state to value (e.g. the login), valid for a while (template:
//! `server/loginStates.ts`). The callback redeems the state exactly once, so no foreign page can slip in a login.
//! State and time come from outside.

use std::collections::VecDeque;

use subtle::ConstantTimeEq;

/// The callback belongs to the browser that started the login: the state is also in its cookie `oauth_state`.
/// Otherwise an attacker could slip in their own callback link (login CSRF). Compared in constant time.
#[must_use]
pub fn same_browser(cookie_state: Option<&str>, query_state: &str) -> bool {
    cookie_state.is_some_and(|cookie| {
        !cookie.is_empty() && !query_state.is_empty() && bool::from(cookie.as_bytes().ct_eq(query_state.as_bytes()))
    })
}

#[derive(Debug)]
struct Pending<V> {
    state: String,
    value: V,
    expires_at: i64,
}

/// At most `limit` pending logins, the oldest drop out first
// ponytail: linear search over at most `limit` entries, a map when the limit grows large
#[derive(Debug)]
pub struct LoginStates<V> {
    ttl_ms: i64,
    limit: usize,
    open: VecDeque<Pending<V>>,
}

impl<V> LoginStates<V> {
    #[must_use]
    pub const fn new(ttl_ms: i64, limit: usize) -> Self {
        Self { ttl_ms, limit, open: VecDeque::new() }
    }

    pub fn add(&mut self, state: &str, value: V, now: i64) {
        self.open.retain(|pending| pending.state != state);
        self.open.push_back(Pending { state: state.to_owned(), value, expires_at: now + self.ttl_ms });
        // Many login clicks never fill up the memory this way
        while self.open.len() > self.limit {
            self.open.pop_front();
        }
    }

    /// Value for the state; `None` if unknown, already redeemed or expired
    pub fn take(&mut self, state: &str, now: i64) -> Option<V> {
        let index = self.open.iter().position(|pending| pending.state == state)?;
        let pending = self.open.remove(index)?;
        (pending.expires_at > now).then_some(pending.value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const NOW: i64 = 1_800_000_000_000;

    #[test]
    fn a_state_returns_its_value_once_and_expires() {
        let mut states = LoginStates::new(600_000, 3);
        states.add("a", "rezondes", NOW);
        assert_eq!(states.take("a", NOW + 1000), Some("rezondes"));
        assert_eq!(states.take("a", NOW + 1000), None);
        assert_eq!(states.take("", NOW), None);
        assert_eq!(states.take("foreign", NOW), None);
        states.add("b", "friend", NOW);
        assert_eq!(states.take("b", NOW + 600_000), None);
    }

    #[test]
    fn above_the_limit_the_oldest_drop_out() {
        let mut states = LoginStates::new(600_000, 3);
        for state in ["c", "d", "e", "f"] {
            states.add(state, state, NOW);
        }
        assert_eq!(states.take("c", NOW), None);
        assert_eq!(states.take("f", NOW), Some("f"));
        assert_eq!(states.take("d", NOW), Some("d"));
    }

    #[test]
    fn callback_only_in_the_starting_browser() {
        assert!(same_browser(Some("abc123"), "abc123"));
        assert!(!same_browser(None, "abc123"));
        assert!(!same_browser(Some("abc124"), "abc123"));
        assert!(!same_browser(Some("abc"), "abc123"));
        assert!(!same_browser(Some(""), ""));
    }
}
