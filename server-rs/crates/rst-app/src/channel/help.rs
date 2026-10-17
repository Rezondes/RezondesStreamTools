//! The help command of a running streamer (template: `server/help.ts`): a chat line with the command gets the list
//! of commands and the link as a reply from the streamer, at most once per cooldown. The own reply comes back in
//! chat and is not processed again. `can_chat` says whether the login may write (`None` = not known yet).

use std::sync::{Mutex, MutexGuard};

use rst_domain::chat::line::ChatLine;
use rst_domain::commands::{CommandList, HelpConfig, HelpGate, help_reply};

use crate::ports::twitch::{ProviderError, Said};

pub struct HelpResponder {
    login: String,
    /// URL of the public commands page
    link: String,
    config: Mutex<HelpConfig>,
    gate: Mutex<HelpGate>,
    can_chat: Mutex<Option<bool>>,
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
}

impl HelpResponder {
    #[must_use]
    pub fn new(login: &str, link: &str, config: HelpConfig) -> Self {
        Self {
            login: login.to_owned(),
            link: link.to_owned(),
            config: Mutex::new(config),
            gate: Mutex::default(),
            can_chat: Mutex::new(None),
        }
    }

    /// After a save from the dashboard
    pub fn set_config(&self, config: HelpConfig) {
        *lock(&self.config) = config;
    }

    #[must_use]
    pub fn can_chat(&self) -> Option<bool> {
        *lock(&self.can_chat)
    }

    pub fn set_can_chat(&self, value: Option<bool>) {
        *lock(&self.can_chat) = value;
    }

    /// Our own reply as it comes back in chat
    #[must_use]
    pub fn is_echo(&self, line: &ChatLine) -> bool {
        lock(&self.gate).is_echo(&self.login, &line.login, &line.text)
    }

    /// Whether the line asks for help now; if so, the cooldown starts. `now` in ms.
    #[must_use]
    pub fn wants_reply(&self, line: &ChatLine, now: i64) -> bool {
        let config = lock(&self.config).clone();
        lock(&self.gate).wants_reply(&config, &line.text, now)
    }

    /// Sends the reply through `say`; whether it went through decides `can_chat`
    ///
    /// # Errors
    /// When `say` fails.
    pub async fn reply<F>(&self, commands: &CommandList, say: impl FnOnce(String) -> F) -> Result<(), ProviderError>
    where
        F: Future<Output = Result<Said, ProviderError>>,
    {
        let template = lock(&self.config).reply.clone();
        let message = help_reply(&template, commands, &self.link);
        lock(&self.gate).sent(&message);
        let said = say(message).await?;
        self.set_can_chat(Some(said == Said::Sent));
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use rst_domain::commands::command_list;

    use super::*;

    fn help() -> HelpConfig {
        HelpConfig {
            enabled: true,
            command: "!befehle".to_owned(),
            reply: "Befehle: {commands} {link}".to_owned(),
            cooldown: 30,
        }
    }

    fn line(login: &str, text: &str) -> ChatLine {
        ChatLine { login: login.to_owned(), user: login.to_owned(), text: text.to_owned(), ..ChatLine::default() }
    }

    #[tokio::test]
    async fn replies_once_per_cooldown_and_ignores_its_echo() {
        let responder = HelpResponder::new("neo", "https://x/s/neo/", help());
        let commands = command_list("neo", Some(&help()), None, &[]);
        assert!(!responder.wants_reply(&line("smith", "hello"), 0));
        assert!(responder.wants_reply(&line("smith", "!Befehle please"), 0));
        assert!(!responder.wants_reply(&line("trinity", "!befehle"), 10_000));
        let mut sent = String::new();
        responder
            .reply(&commands, |message| {
                sent.clone_from(&message);
                async { Ok(Said::Sent) }
            })
            .await
            .expect("reply");
        assert!(sent.starts_with("Befehle: ") && sent.ends_with("https://x/s/neo/"), "{sent}");
        assert_eq!(responder.can_chat(), Some(true));
        assert!(responder.is_echo(&line("neo", &sent)));
        assert!(!responder.is_echo(&line("smith", &sent)));
        assert!(responder.wants_reply(&line("trinity", "!befehle"), 30_000));
    }

    #[tokio::test]
    async fn a_missing_scope_is_remembered_and_the_config_can_change() {
        let responder = HelpResponder::new("neo", "https://x/s/neo/", help());
        let commands = command_list("neo", Some(&help()), None, &[]);
        responder.reply(&commands, |_| async { Ok(Said::MissingScope) }).await.expect("reply");
        assert_eq!(responder.can_chat(), Some(false));
        responder.set_config(HelpConfig { enabled: false, ..help() });
        assert!(!responder.wants_reply(&line("smith", "!befehle"), 0));
    }
}
