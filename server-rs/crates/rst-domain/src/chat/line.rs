//! A chat message as the server sees it, source for chat triggers and minimes (template: `handleLine` in
//! `server/chat.ts`): roles from the badges, the Twitch name color and the positions of Twitch emotes.

use crate::chat::irc::{EmoteRange, IrcMessage, emote_ranges};

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ChatLine {
    pub login: String,
    /// Display name, the login without one
    pub user: String,
    pub text: String,
    /// Badge names, e.g. `broadcaster`, `subscriber`
    pub roles: Vec<String>,
    /// Twitch name color, if the chatter chose one
    pub color: Option<String>,
    pub emotes: Vec<EmoteRange>,
}

/// Chat message from a `PRIVMSG`; `None` for every other command
#[must_use]
pub fn to_chat_line(message: &IrcMessage) -> Option<ChatLine> {
    if message.command != "PRIVMSG" {
        return None;
    }
    let login = message.login().to_owned();
    let user = match message.tag("display-name") {
        "" => login.clone(),
        name => name.to_owned(),
    };
    Some(ChatLine {
        user,
        login,
        text: message.param(1).unwrap_or_default().to_owned(),
        // badges=broadcaster/1,subscriber/12 -> broadcaster, subscriber
        roles: message
            .tag("badges")
            .split(',')
            .filter_map(|badge| badge.split('/').next())
            .filter(|role| !role.is_empty())
            .map(str::to_owned)
            .collect(),
        color: Some(message.tag("color")).filter(|color| !color.is_empty()).map(str::to_owned),
        emotes: emote_ranges(message.tag("emotes")),
    })
}

/// Login of a ban or timeout (`CLEARCHAT` with a login), lower case
#[must_use]
pub fn banned_login(message: &IrcMessage) -> Option<String> {
    (message.command == "CLEARCHAT").then(|| message.param(1)).flatten().map(str::to_lowercase)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chat::irc::parse_irc;

    #[test]
    fn roles_color_and_display_name() {
        let message = parse_irc(
            "@badges=broadcaster/1,subscriber/12;color=#FF0000;display-name=Rez :rez!rez@rez.tmi.twitch.tv PRIVMSG #rezondes :!join",
        );
        let line = to_chat_line(&message).expect("line");
        assert_eq!(line.user, "Rez");
        assert_eq!(line.login, "rez");
        assert_eq!(line.text, "!join");
        assert_eq!(line.roles, ["broadcaster", "subscriber"]);
        assert_eq!(line.color.as_deref(), Some("#FF0000"));
        let bare = to_chat_line(&parse_irc(":neo!neo@neo.tmi.twitch.tv PRIVMSG #rezondes :hi")).expect("line");
        assert_eq!((bare.user.as_str(), bare.roles.len(), bare.color), ("neo", 0, None));
        assert_eq!(to_chat_line(&parse_irc("PING :tmi.twitch.tv")), None);
    }

    #[test]
    fn emote_positions() {
        let line =
            to_chat_line(&parse_irc("@emotes=25:0-4,12-16 :neo!neo@neo.tmi.twitch.tv PRIVMSG #r :Kappa hello Kappa"))
                .expect("line");
        let range = |from, to| EmoteRange { id: "25".to_owned(), from, to };
        assert_eq!(line.emotes, [range(0, 4), range(12, 16)]);
    }

    #[test]
    fn bans_and_timeouts() {
        assert_eq!(banned_login(&parse_irc(":tmi.twitch.tv CLEARCHAT #rezondes :Neo")), Some("neo".to_owned()));
        assert_eq!(banned_login(&parse_irc(":tmi.twitch.tv CLEARCHAT #rezondes")), None);
        assert_eq!(banned_login(&parse_irc(":tmi.twitch.tv CLEARMSG #rezondes :x")), None);
    }
}
