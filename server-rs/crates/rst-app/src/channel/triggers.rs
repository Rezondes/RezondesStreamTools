//! Chat triggers of a running streamer (template: `startTriggers` in `server/triggers.ts`): matching chat lines fire
//! their actions as `fx` events, one after another as planned by `schedule`, with cooldowns for everyone and per
//! viewer. A saved list replaces the rules at once, so no file has to be watched.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;

use rst_domain::chat::line::ChatLine;
use rst_domain::identity::values::StreamerId;
use rst_domain::triggers::cooldowns::Cooldowns;
use rst_domain::triggers::schedule::schedule;
use rst_domain::triggers::{CompiledTrigger, FxEvent, Trigger, allowed, compile};

use crate::events::{Hubs, ServerMessage};

pub struct TriggerRunner {
    id: StreamerId,
    hubs: Arc<Hubs>,
    triggers: Mutex<Vec<CompiledTrigger>>,
    cooldowns: Mutex<Cooldowns>,
    next_id: Arc<AtomicU64>,
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
}

/// Builds the patterns; a faulty stored rule is logged and skipped, the others still run
fn compiled(rules: &[Trigger]) -> Vec<CompiledTrigger> {
    let raw: Vec<_> = rules.iter().filter_map(|rule| serde_json::to_value(rule).ok()).collect();
    let result = compile(&raw);
    for error in &result.errors {
        eprintln!("{error}");
    }
    result.triggers
}

impl TriggerRunner {
    #[must_use]
    pub fn new(id: StreamerId, hubs: Arc<Hubs>, rules: &[Trigger]) -> Self {
        Self {
            id,
            hubs,
            triggers: Mutex::new(compiled(rules)),
            cooldowns: Mutex::default(),
            next_id: Arc::new(AtomicU64::new(1)),
        }
    }

    /// After a save from the editor
    pub fn replace(&self, rules: &[Trigger]) {
        *lock(&self.triggers) = compiled(rules);
    }

    /// A chat line; `now` in ms
    pub fn handle(&self, line: &ChatLine, now: u64) {
        let fired: Vec<Trigger> = {
            let triggers = lock(&self.triggers);
            let mut cooldowns = lock(&self.cooldowns);
            triggers
                .iter()
                .filter(|compiled| compiled.trigger.enabled != Some(false) && compiled.pattern.matches(&line.text))
                .filter(|compiled| allowed(compiled.trigger.who.as_deref(), &line.roles))
                .filter(|compiled| {
                    let trigger = &compiled.trigger;
                    let (cooldown, user_cooldown) =
                        (trigger.cooldown.unwrap_or(0.0), trigger.user_cooldown.unwrap_or(0.0));
                    cooldowns.ready(&trigger.name, cooldown, user_cooldown, &line.login, now)
                })
                .map(|compiled| compiled.trigger.clone())
                .collect()
        };
        for trigger in fired {
            eprintln!("Trigger {} fired by {}", trigger.name, line.user);
            self.run(&trigger, &line.user, &line.text);
        }
    }

    /// Test button of the dashboard: without cooldown; `false` for an unknown name
    pub fn fire(&self, name: &str) -> bool {
        let trigger =
            lock(&self.triggers).iter().find(|compiled| compiled.trigger.name == name).map(|c| c.trigger.clone());
        trigger.inspect(|trigger| self.run(trigger, "Test", &trigger.when.text)).is_some()
    }

    /// Sends every action at its planned start
    fn run(&self, trigger: &Trigger, user: &str, message: &str) {
        for (action, start) in trigger.actions.iter().zip(schedule(&trigger.actions)) {
            let event = FxEvent {
                id: 0,
                zone: action.zone.clone().unwrap_or_else(|| "main".to_owned()),
                action: action.clone(),
                user: user.to_owned(),
                message: message.to_owned(),
            };
            let (hubs, id, next_id) = (Arc::clone(&self.hubs), self.id.clone(), Arc::clone(&self.next_id));
            tokio::spawn(async move {
                tokio::time::sleep(Duration::from_millis(start)).await;
                let event = FxEvent { id: next_id.fetch_add(1, Ordering::SeqCst), ..event };
                hubs.emit(&id, &ServerMessage::Fx { event });
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn neo() -> StreamerId {
        StreamerId::from_bytes([1; 16])
    }

    fn rules(value: &serde_json::Value) -> Vec<Trigger> {
        serde_json::from_value(value.clone()).expect("rules")
    }

    fn line(login: &str, text: &str, roles: &[&str]) -> ChatLine {
        ChatLine {
            login: login.to_owned(),
            user: login.to_owned(),
            text: text.to_owned(),
            roles: roles.iter().map(|role| (*role).to_owned()).collect(),
            ..ChatLine::default()
        }
    }

    #[tokio::test(start_paused = true)]
    async fn matching_lines_fire_in_the_planned_order_with_cooldowns() {
        let hubs = Arc::new(Hubs::default());
        let mut stream = hubs.subscribe(&neo(), false).expect("stream");
        let runner = TriggerRunner::new(
            neo(),
            Arc::clone(&hubs),
            &rules(&json!([
                { "name": "lizard", "when": { "type": "word", "match": "lizard" }, "cooldown": 30, "do": [
                    { "type": "text", "text": "one", "duration": 2 },
                    { "type": "text", "text": "two", "zone": "top" }
                ] },
                { "name": "mods", "when": { "type": "command", "match": "!mod" }, "who": ["moderator"], "do": [{ "type": "text", "text": "m" }] }
            ])),
        );
        runner.handle(&line("smith", "a LIZARD!", &[]), 0);
        runner.handle(&line("smith", "lizard again", &[]), 1000);
        runner.handle(&line("smith", "!mod", &[]), 1000);
        let first = stream.next().await.expect("first");
        assert!(
            first.contains(r#""type":"fx""#) && first.contains(r#""text":"one""#) && first.contains(r#""zone":"main""#)
        );
        let started = tokio::time::Instant::now();
        let second = stream.next().await.expect("second");
        assert!(second.contains(r#""text":"two""#) && second.contains(r#""zone":"top""#), "{second}");
        assert_eq!(started.elapsed(), Duration::from_secs(2));
        // The cooldown blocked the second line, the role the third
        assert!(tokio::time::timeout(Duration::from_secs(60), stream.next()).await.is_err());
        runner.handle(&line("trinity", "!mod now", &["moderator"]), 2000);
        assert!(stream.next().await.expect("mod").contains(r#""text":"m""#));
    }

    #[tokio::test(start_paused = true)]
    async fn fire_ignores_the_cooldown_and_replace_takes_effect() {
        let hubs = Arc::new(Hubs::default());
        let mut stream = hubs.subscribe(&neo(), false).expect("stream");
        let lizard = json!([{ "name": "lizard", "when": { "type": "word", "match": "lizard" }, "cooldown": 300, "do": [{ "type": "text", "text": "x" }] }]);
        let runner = TriggerRunner::new(neo(), Arc::clone(&hubs), &rules(&lizard));
        runner.handle(&line("smith", "lizard", &[]), 0);
        assert!(runner.fire("lizard"));
        assert!(!runner.fire("nothing"));
        assert!(stream.next().await.expect("chat").contains(r#""user":"smith""#));
        let test = stream.next().await.expect("test");
        assert!(test.contains(r#""user":"Test""#) && test.contains(r#""message":"lizard""#));
        runner.replace(&[]);
        assert!(!runner.fire("lizard"));
    }
}
