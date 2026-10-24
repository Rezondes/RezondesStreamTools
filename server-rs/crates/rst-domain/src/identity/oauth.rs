//! Pending OAuth logins (Twitch, Spotify): random state to value (e.g. the login), valid for a while (template:
//! `server/loginStates.ts`). The callback redeems the state exactly once, so no foreign page can slip in a login.
//! State and time come from outside.

use std::collections::{BTreeMap, HashMap};

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
    /// Place in the order of adding
    order: u64,
    value: V,
    expires_at: i64,
}

/// At most `limit` pending logins, the oldest drop out first: the states by name, their order of adding by number
#[derive(Debug)]
pub struct LoginStates<V> {
    ttl_ms: i64,
    limit: usize,
    open: HashMap<String, Pending<V>>,
    order: BTreeMap<u64, String>,
    next: u64,
}

impl<V> LoginStates<V> {
    #[must_use]
    pub fn new(ttl_ms: i64, limit: usize) -> Self {
        Self { ttl_ms, limit, open: HashMap::new(), order: BTreeMap::new(), next: 0 }
    }

    /// A state added again counts as new
    pub fn add(&mut self, state: &str, value: V, now: i64) {
        if let Some(old) = self.open.remove(state) {
            self.order.remove(&old.order);
        }
        let order = self.next;
        self.next += 1;
        self.order.insert(order, state.to_owned());
        self.open.insert(state.to_owned(), Pending { order, value, expires_at: now + self.ttl_ms });
        // Many login clicks never fill up the memory this way
        while self.open.len() > self.limit {
            let Some((_, oldest)) = self.order.pop_first() else { break };
            self.open.remove(&oldest);
        }
    }

    /// Value for the state; `None` if unknown, already redeemed or expired
    pub fn take(&mut self, state: &str, now: i64) -> Option<V> {
        let pending = self.open.remove(state)?;
        self.order.remove(&pending.order);
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
    fn a_re_added_state_counts_as_new() {
        let mut states = LoginStates::new(600_000, 2);
        states.add("a", "first", NOW);
        states.add("b", "b", NOW);
        states.add("a", "again", NOW);
        states.add("c", "c", NOW);
        assert_eq!(states.take("b", NOW), None);
        assert_eq!(states.take("a", NOW), Some("again"));
        assert_eq!(states.take("c", NOW), Some("c"));
    }

    #[test]
    fn many_states_stay_within_the_limit() {
        let mut states = LoginStates::new(600_000, 1000);
        let names: Vec<String> = (0..5000).map(|index| format!("s{index}")).collect();
        for name in &names {
            states.add(name, name.clone(), NOW);
        }
        assert!(names[..4000].iter().all(|name| states.take(name, NOW).is_none()));
        assert!(names[4000..].iter().all(|name| states.take(name, NOW).as_deref() == Some(name.as_str())));
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
