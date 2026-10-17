//! Shared text fields of the public commands page that every theme with a commands page adds to its schema
//! (template: `INFO_FIELDS` in `src/core/infoFields.ts`). Labels and defaults are the German UI texts.

use crate::settings::field::{SettingField, text, textarea};

pub const INFO_GROUP: &str = "Befehlsseite";

/// The fields in the order of the TypeScript schema
#[must_use]
pub fn info_fields() -> Vec<SettingField> {
    let group = INFO_GROUP;
    vec![
        text("infoTitle", "Titel", group, "Chat-Befehle", None),
        textarea(
            "infoIntro",
            "Einleitung ({channel})",
            group,
            "Das kannst du im Chat von {channel} tippen.",
            Some(500),
        ),
        text("infoEmpty", "Text, wenn es keine Befehle gibt", group, "Gerade gibt es hier keine Befehle.", None),
        text("infoHelpHeading", "Überschrift: Hilfe", group, "Hilfe", None),
        text("infoMinimesHeading", "Überschrift: Minimes", group, "Minimes", None),
        text("infoTriggersHeading", "Überschrift: Trigger", group, "Effekte", None),
        text("infoHelpText", "Hilfe-Befehl: Erklärung", group, "Zeigt die Befehle im Chat.", None),
        text("infoJoinText", "Minimes einklinken: Erklärung", group, "Mit deiner Figur in die Szene einsteigen.", None),
        text(
            "infoJoinColor",
            "Einklinken mit Farbe ({command})",
            group,
            "Mit Farbe: {command} #ff00aa oder {command} 255 0 170",
            None,
        ),
        text(
            "infoJoinVariant",
            "Einklinken mit Typ ({command}, {example})",
            group,
            "Mit Typ: {command} {example}",
            None,
        ),
        text(
            "infoLookColor",
            "Farbe ändern: Erklärung ({command})",
            group,
            "Farbe deiner Figur ändern, z.B. {command} #00ffaa",
            None,
        ),
        text(
            "infoLookVariant",
            "Typ wählen: Erklärung ({command})",
            group,
            "Typ deiner Figur wählen: {command} <Name>",
            None,
        ),
        text("infoVariants", "Liste der Typen ({names})", group, "Zur Wahl: {names}", None),
        text("infoLeaveText", "Verlassen: Erklärung", group, "Deine Figur verlässt die Szene.", None),
        text(
            "infoKick",
            "Rauswerfen ({roles}, {command})",
            group,
            "{roles}: {command} @name wirft eine Figur raus.",
            None,
        ),
        text("infoWhenCommand", "Trigger als Befehl ({match})", group, "Tippe {match}", None),
        text("infoWhenWord", "Trigger als Wort ({match})", group, "Schreib das Wort {match}", None),
        text("infoWhenExact", "Trigger als ganze Nachricht ({match})", group, "Schreib genau {match}", None),
        text("infoWhenContains", "Trigger als Textteil ({match})", group, "Schreib etwas mit {match}", None),
        text("infoWhenRegex", "Trigger mit Muster", group, "Eine besondere Nachricht", None),
        text("infoWho", "Wer darf ({roles})", group, "Für: {roles}", None),
        text("infoRoleEveryone", "Rolle: alle", group, "alle", None),
        text("infoRoleSubscriber", "Rolle: Subs", group, "Subs", None),
        text("infoRoleVip", "Rolle: VIPs", group, "VIPs", None),
        text("infoRoleModerator", "Rolle: Mods", group, "Mods", None),
        text("infoRoleBroadcaster", "Rolle: Streamer", group, "Streamer", None),
        text("infoCooldown", "Abklingzeit für alle ({seconds})", group, "Pause danach: {seconds} s", None),
        text("infoUserCooldown", "Abklingzeit pro Person ({seconds})", group, "Pro Person: {seconds} s", None),
    ]
}
