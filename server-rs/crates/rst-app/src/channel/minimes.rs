//! Minimes of a running streamer (template: `server/minimes.ts`): chat lines change the list with the rules of the
//! domain, every visible change goes to the overlays, and the list is stored at most every two seconds. Inactive
//! minimes are removed once a minute; the end of the stream empties the list when the rules say so. Without rules
//! (the theme has no minimes) everything rests and the overlays get an empty list.

use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;

use rst_domain::chat::line::ChatLine;
use rst_domain::identity::values::StreamerId;
use rst_domain::minimes::roster::{Minime, MinimeEvent, MinimeState, apply};
use rst_domain::minimes::rules::MinimeRules;
use rst_domain::minimes::to_minime_event;
use tokio_util::sync::CancellationToken;

use crate::crypto::cipher::random_bytes;
use crate::events::{Hubs, ServerMessage};
use crate::ports::keys::KeyStore;
use crate::ports::records::RecordStore;
use crate::profile::Profile;
use crate::vault::VaultError;

/// Many chat messages result in at most one save in this time
pub const SAVE_DELAY: Duration = Duration::from_secs(2);
/// How often inactive minimes are removed
pub const PRUNE_EVERY: Duration = Duration::from_secs(60);

struct Roster {
    state: MinimeState,
    rules: Option<MinimeRules>,
    save_scheduled: bool,
}

pub struct MinimeRunner<S, K> {
    id: StreamerId,
    hubs: Arc<Hubs>,
    profile: Profile<S, K>,
    now: fn() -> i64,
    roster: Mutex<Roster>,
}

/// A number in `0..1` for assigning variants
fn random() -> f64 {
    #[expect(clippy::cast_precision_loss, reason = "a random fraction, precision does not matter")]
    let fraction = random_bytes::<8>().map_or(0, u64::from_le_bytes) as f64 / u64::MAX as f64;
    fraction.min(0.999_999)
}

impl<S, K> MinimeRunner<S, K>
where
    S: RecordStore + Clone + 'static,
    K: KeyStore + Clone + 'static,
{
    /// Reads the stored list and removes what is inactive since then
    ///
    /// # Errors
    /// `Unreadable` after the streamer was shredded.
    pub async fn load(
        id: StreamerId,
        hubs: Arc<Hubs>,
        profile: Profile<S, K>,
        rules: Option<MinimeRules>,
        now: fn() -> i64,
    ) -> Result<Arc<Self>, VaultError> {
        let state = profile.minimes(&id).await?;
        let runner = Arc::new(Self {
            id,
            hubs,
            profile,
            now,
            roster: Mutex::new(Roster { state, rules, save_scheduled: false }),
        });
        runner.apply(&MinimeEvent::Prune, true);
        Ok(runner)
    }

    fn roster(&self) -> MutexGuard<'_, Roster> {
        self.roster.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// The list for a newly connected overlay
    #[must_use]
    pub fn current(&self) -> Vec<Minime> {
        let roster = self.roster();
        if roster.rules.is_none() { Vec::new() } else { roster.state.roster.iter().map(Minime::from).collect() }
    }

    pub fn handle(self: &Arc<Self>, line: &ChatLine) {
        let event = match &self.roster().rules {
            Some(rules) => to_minime_event(line, rules),
            None => return,
        };
        self.apply(&event, true);
    }

    /// Ban or timeout in chat
    pub fn ban(self: &Arc<Self>, login: &str) {
        self.apply(&MinimeEvent::Ban { login: login.to_owned() }, true);
    }

    /// The stream ended
    pub fn offline(self: &Arc<Self>) {
        let clear = self.roster().rules.as_ref().is_some_and(|rules| rules.clear_offline);
        if clear {
            self.apply(&MinimeEvent::Clear, true);
        }
    }

    /// Changed settings take effect at once; the overlays get the list in any case
    pub fn set_rules(self: &Arc<Self>, rules: Option<MinimeRules>) {
        self.roster().rules = rules;
        self.apply(&MinimeEvent::Prune, false);
        self.hubs.emit(&self.id, &ServerMessage::Minimes { minimes: self.current() });
    }

    /// `announce`: false when the caller sends the list itself afterwards
    fn apply(self: &Arc<Self>, event: &MinimeEvent, announce: bool) {
        let (changed, react, save) = {
            let mut roster = self.roster();
            let Some(rules) = &roster.rules else { return };
            let mut random = random;
            let result = apply(&roster.state, event, (self.now)(), rules, &mut random);
            let modified = result.state != roster.state;
            let save = modified && !roster.save_scheduled;
            if modified {
                roster.state = result.state;
            }
            roster.save_scheduled |= save;
            (result.changed, result.react, save)
        };
        if save {
            let runner = Arc::clone(self);
            tokio::spawn(async move {
                tokio::time::sleep(SAVE_DELAY).await;
                runner.save().await;
            });
        }
        if changed && announce {
            self.hubs.emit(&self.id, &ServerMessage::Minimes { minimes: self.current() });
        }
        if let Some(login) = react {
            self.hubs.emit(&self.id, &ServerMessage::MinimeChat { login });
        }
    }

    /// Stores the list as it is now
    pub async fn save(&self) {
        let state = {
            let mut roster = self.roster();
            roster.save_scheduled = false;
            roster.state.clone()
        };
        if let Err(error) = self.profile.save_minimes(&self.id, &state, (self.now)()).await {
            eprintln!("Saving minimes failed: {error}");
        }
    }

    /// Removes inactive minimes once a minute until `cancel`, then stores the list a last time
    pub async fn prune_until(self: Arc<Self>, cancel: CancellationToken) {
        loop {
            tokio::select! {
                () = cancel.cancelled() => break,
                () = tokio::time::sleep(PRUNE_EVERY) => self.apply(&MinimeEvent::Prune, true),
            }
        }
        self.save().await;
    }
}

#[cfg(test)]
mod tests {
    use rst_domain::minimes::rules::minime_rules;
    use serde_json::json;

    use super::*;
    use crate::testing::{MemoryKeys, MemoryRecords};
    use crate::vault::Vault;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    fn zero() -> i64 {
        0
    }

    fn rules(values: &serde_json::Value) -> MinimeRules {
        minime_rules(values, None)
    }

    fn line(login: &str, text: &str) -> ChatLine {
        ChatLine { login: login.to_owned(), user: login.to_owned(), text: text.to_owned(), ..ChatLine::default() }
    }

    async fn profile() -> Profile<MemoryRecords, MemoryKeys> {
        let keys = MemoryKeys::default();
        keys.create(&neo()).await.expect("key");
        Profile::new(Vault::new(MemoryRecords::default(), keys))
    }

    #[tokio::test(start_paused = true)]
    async fn commands_change_the_list_saves_are_batched_and_survive_a_restart() {
        let (profile, hubs) = (profile().await, Arc::new(Hubs::default()));
        let mut stream = hubs.subscribe(&neo(), false).expect("stream");
        let runner = MinimeRunner::load(neo(), Arc::clone(&hubs), profile.clone(), Some(rules(&json!({}))), zero)
            .await
            .expect("runner");
        runner.handle(&line("smith", "!join"));
        runner.handle(&line("trinity", "!join"));
        let joined = stream.next().await.expect("minimes");
        assert!(joined.contains(r#""type":"minimes""#) && joined.contains("smith"), "{joined}");
        assert!(stream.next().await.expect("second").contains("trinity"));
        // Nothing stored before the delay, both after it
        assert!(profile.minimes(&neo()).await.expect("stored").roster.is_empty());
        tokio::time::sleep(SAVE_DELAY + Duration::from_millis(10)).await;
        assert_eq!(profile.minimes(&neo()).await.expect("stored").roster.len(), 2);
        runner.ban("smith");
        assert!(!stream.next().await.expect("ban").contains("smith"));
        let cancel = CancellationToken::new();
        let pruning = tokio::spawn(Arc::clone(&runner).prune_until(cancel.clone()));
        cancel.cancel();
        pruning.await.expect("pruning ends");
        let again = MinimeRunner::load(neo(), hubs, profile, Some(rules(&json!({}))), zero).await.expect("again");
        let logins: Vec<String> = again.current().into_iter().map(|minime| minime.login).collect();
        assert_eq!(logins, ["trinity"]);
    }

    #[tokio::test(start_paused = true)]
    async fn rule_changes_take_effect_at_once_and_offline_clears() {
        let (profile, hubs) = (profile().await, Arc::new(Hubs::default()));
        let runner = MinimeRunner::load(neo(), Arc::clone(&hubs), profile, None, zero).await.expect("runner");
        runner.handle(&line("smith", "!join"));
        assert!(runner.current().is_empty(), "without rules everything rests");
        let mut stream = hubs.subscribe(&neo(), false).expect("stream");
        runner.set_rules(Some(rules(&json!({ "minimeClearOffline": true }))));
        assert_eq!(stream.next().await.as_deref(), Some(r#"{"type":"minimes","minimes":[]}"#));
        runner.handle(&line("smith", "!join"));
        assert_eq!(runner.current().len(), 1);
        runner.offline();
        assert!(runner.current().is_empty());
    }
}
