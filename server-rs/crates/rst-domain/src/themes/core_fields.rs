//! Shared fields that the core reads for the themes that use them: one sound per alert kind plus the fade-out sound
//! (template: `alertSoundFields` in `src/core/alerts/alerts.ts`) and the badge texts of the chat (template:
//! `badgeFields` in `src/core/chat/chat.ts`). Labels are the German UI texts.

use crate::settings::field::{SettingField, sound, text};

/// Sounds per alert kind for themes with built-in sounds (empty = the theme's built-in sound), plus fade-out
#[must_use]
pub fn alert_sound_fields(group: &str) -> Vec<SettingField> {
    vec![
        sound("soundFollow", "Ton Follow (leer = eingebaut)", group),
        sound("soundSub", "Ton Sub", group),
        sound("soundResub", "Ton Resub", group),
        sound("soundGift", "Ton Gift", group),
        sound("soundRaid", "Ton Raid", group),
        sound("soundCheer", "Ton Bits", group),
        sound("soundRedeem", "Ton Kanalpunkte", group),
        sound("soundHype", "Ton Hype Train", group),
        sound("soundLeave", "Ton beim Ausblenden", group),
    ]
}

/// Texts of the badges HOST, MOD, VIP and SUB, for themes that label badges
#[must_use]
pub fn badge_fields(group: &str) -> Vec<SettingField> {
    vec![
        text("badgeHost", "Badge Streamer", group, "HOST", Some(20)),
        text("badgeMod", "Badge Moderator", group, "MOD", Some(20)),
        text("badgeVip", "Badge VIP", group, "VIP", Some(20)),
        text("badgeSub", "Badge Abonnent", group, "SUB", Some(20)),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_sound_per_alert_kind_and_fade_out() {
        let keys: Vec<String> = alert_sound_fields("Alerts").into_iter().map(|field| field.key).collect();
        assert_eq!(keys.len(), 9);
        assert_eq!(keys.last().map(String::as_str), Some("soundLeave"));
    }

    #[test]
    fn badge_texts_default_to_the_abbreviation() {
        let fields = badge_fields("Chat");
        assert_eq!(fields.len(), 4);
        assert!(fields.iter().all(|field| field.group == "Chat"));
    }
}
