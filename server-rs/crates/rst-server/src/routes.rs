//! Routes of the dashboard and the login and who may call them (template: `ROUTES`, `find` and `authorize` in
//! `server/routes.ts`). Every route is a variant of `Route`; `guard` and the handler table in `handlers.rs` match on
//! it exhaustively, so the compiler refuses a route without a guard or without a handler.

use std::collections::BTreeMap;

use rst_domain::access::Feature;
use rst_domain::identity::values::StreamerId;

/// `Public`: without login; `Session`: login from the session cookie and enabled, plus all features; `Admin`: admins
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Guard {
    Public,
    Session(&'static [Feature]),
    Admin,
}

const SESSION: Guard = Guard::Session(&[]);
/// Chat listener, triggers and media belong to the levels triggers and fx
const TRIGGERS: Guard = Guard::Session(&[Feature::Triggers, Feature::Fx]);
const MUSIC: Guard = Guard::Session(&[Feature::Music]);

macro_rules! routes {
    ($($variant:ident => $method:literal $path:literal, $guard:expr;)*) => {
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum Route {
            $($variant,)*
        }

        impl Route {
            pub const ALL: &[Self] = &[$(Self::$variant,)*];

            #[must_use]
            pub const fn method(self) -> &'static str {
                match self {
                    $(Self::$variant => $method,)*
                }
            }

            #[must_use]
            pub const fn path(self) -> &'static str {
                match self {
                    $(Self::$variant => $path,)*
                }
            }

            #[must_use]
            pub const fn guard(self) -> Guard {
                match self {
                    $(Self::$variant => $guard,)*
                }
            }
        }
    };
}

routes! {
    AuthLogin => "GET" "/auth/login", Guard::Public;
    AuthCallback => "GET" "/auth/callback", Guard::Public;
    AuthLogout => "POST" "/auth/logout", Guard::Public;
    // Spotify knows only one callback URL (locally via 127.0.0.1, where the cookie is missing)
    SpotifyCallback => "GET" "/spotify/callback", Guard::Public;
    Me => "GET" "/api/me", SESSION;
    SavePrefs => "POST" "/api/account/prefs", SESSION;
    OverlayKey => "POST" "/api/overlay-key", SESSION;
    TestAlert => "POST" "/api/test", Guard::Session(&[Feature::Alerts]);
    Stats => "GET" "/api/stats", SESSION;
    StatsReset => "POST" "/api/stats/reset", SESSION;
    StatsLive => "POST" "/api/stats/live", SESSION;
    TriggerConfig => "GET" "/api/triggers/config", TRIGGERS;
    SaveTriggerConfig => "POST" "/api/triggers/config", TRIGGERS;
    TriggerList => "GET" "/api/triggers", TRIGGERS;
    FireTrigger => "POST" "/api/trigger", TRIGGERS;
    MediaList => "GET" "/api/media", TRIGGERS;
    UploadMedia => "POST" "/api/media", TRIGGERS;
    DeleteMedia => "DELETE" "/api/media", TRIGGERS;
    SpotifyLogin => "GET" "/spotify/login", MUSIC;
    SpotifyDetails => "GET" "/api/spotify", MUSIC;
    // Disconnecting stays possible even with the feature switched off
    SpotifyLogout => "POST" "/spotify/logout", SESSION;
    TwitchDisconnect => "POST" "/api/twitch/disconnect", SESSION;
    HelpConfig => "GET" "/api/commands", SESSION;
    SaveHelpConfig => "POST" "/api/commands", SESSION;
    Settings => "GET" "/api/settings", Guard::Session(&[Feature::Themes]);
    SaveSettings => "POST" "/api/settings", Guard::Session(&[Feature::Themes]);
    // Rendering: the handler checks the feature per clip
    RenderStart => "POST" "/api/render/start", SESSION;
    RenderFrame => "POST" "/api/render/frame", SESSION;
    RenderDone => "POST" "/api/render/done", SESSION;
    RenderCancel => "POST" "/api/render/cancel", SESSION;
    RenderFiles => "GET" "/api/render/files", SESSION;
    RenderFile => "GET" "/api/render/file", SESSION;
    AdminAccess => "GET" "/api/admin/access", Guard::Admin;
    SaveAdminAccess => "POST" "/api/admin/access", Guard::Admin;
    AdminStreamers => "GET" "/api/admin/streamers", Guard::Admin;
    // New: the audit log, server-wide or with ?login= of one streamer
    AdminAudit => "GET" "/api/admin/audit", Guard::Admin;
    // New: deletes a streamer for good, ?login=
    DeleteStreamer => "DELETE" "/api/admin/streamer", Guard::Admin;
    // New: marks the stream of a streamer live or ended for RST, ?login=
    StreamerLive => "POST" "/api/admin/streamer/live", Guard::Admin;
    // New: server-wide backups, one of them by ?id=
    AdminBackups => "GET" "/api/admin/backups", Guard::Admin;
    CreateBackup => "POST" "/api/admin/backups", Guard::Admin;
    DownloadBackup => "GET" "/api/admin/backup", Guard::Admin;
    DeleteBackup => "DELETE" "/api/admin/backup", Guard::Admin;
    UploadBackup => "POST" "/api/admin/backups/upload", Guard::Admin;
    RestoreBackup => "POST" "/api/admin/backup/restore", Guard::Admin;
    BackupSettings => "GET" "/api/admin/backup-settings", Guard::Admin;
    SaveBackupSettings => "POST" "/api/admin/backup-settings", Guard::Admin;
    // New: the schemas of all themes for the forms
    Themes => "GET" "/api/themes", SESSION;
    // New: the panel designer, part of the banners
    Panels => "GET" "/api/panels", Guard::Session(&[Feature::Banners]);
    SavePanels => "POST" "/api/panels", Guard::Session(&[Feature::Banners]);
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Found {
    Route(Route),
    /// The path is known, but not with this method
    MethodNotAllowed,
}

/// Route for method and path; `None` if the path is no route
#[must_use]
pub fn find(method: &str, path: &str) -> Option<Found> {
    let mut known = Route::ALL.iter().filter(|route| route.path() == path).peekable();
    known.peek()?;
    Some(known.find(|route| route.method() == method).map_or(Found::MethodNotAllowed, |route| Found::Route(*route)))
}

/// Who is asking: `login` from the session (`None` = no valid session) and what the server knows about it
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Visitor {
    pub streamer: Option<StreamerId>,
    pub login: Option<String>,
    pub allowed: bool,
    pub admin: bool,
    pub features: BTreeMap<Feature, bool>,
}

/// Why a call is refused; `Unauthorized` answers 401, the others 403
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Refusal {
    Unauthorized,
    NotAllowed,
    AdminOnly,
    FeatureOff,
}

impl Refusal {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Unauthorized => "unauthorized",
            Self::NotAllowed => "not-allowed",
            Self::AdminOnly => "admin-only",
            Self::FeatureOff => "feature-off",
        }
    }

    #[must_use]
    pub const fn status(self) -> u16 {
        match self {
            Self::Unauthorized => 401,
            _ => 403,
        }
    }
}

/// # Errors
/// The refusal when the visitor may not call a route with this guard.
pub fn authorize(guard: Guard, visitor: &Visitor) -> Result<(), Refusal> {
    let features = match guard {
        Guard::Public => return Ok(()),
        Guard::Session(features) => features,
        Guard::Admin => &[],
    };
    if visitor.login.is_none() {
        return Err(Refusal::Unauthorized);
    }
    if !visitor.allowed {
        return Err(Refusal::NotAllowed);
    }
    if guard == Guard::Admin && !visitor.admin {
        return Err(Refusal::AdminOnly);
    }
    if features.iter().all(|feature| visitor.features.get(feature) == Some(&true)) {
        Ok(())
    } else {
        Err(Refusal::FeatureOff)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn all_on() -> BTreeMap<Feature, bool> {
        Feature::ALL.into_iter().map(|feature| (feature, true)).collect()
    }

    fn streamer() -> Visitor {
        Visitor {
            login: Some("friend".to_owned()),
            allowed: true,
            admin: false,
            features: all_on(),
            ..Visitor::default()
        }
    }

    fn without(feature: Feature) -> Visitor {
        let mut features = all_on();
        features.insert(feature, false);
        Visitor { features, ..streamer() }
    }

    #[test]
    fn find_by_method_and_path() {
        assert_eq!(find("GET", "/api/me"), Some(Found::Route(Route::Me)));
        assert_eq!(find("POST", "/api/triggers/config"), Some(Found::Route(Route::SaveTriggerConfig)));
        assert_eq!(find("GET", "/api/test"), Some(Found::MethodNotAllowed));
        assert_eq!(find("DELETE", "/api/media"), Some(Found::Route(Route::DeleteMedia)));
        assert_eq!(find("PUT", "/api/media"), Some(Found::MethodNotAllowed));
        assert_eq!(find("GET", "/api/admin/streamers"), Some(Found::Route(Route::AdminStreamers)));
        assert_eq!(find("GET", "/alerts.html"), None);
        assert_eq!(find("GET", "/api/triggers/config/x"), None);
        assert_eq!(find("GET", "constructor"), None);
    }

    #[test]
    fn every_method_and_path_once() {
        for (index, route) in Route::ALL.iter().enumerate() {
            let twins = Route::ALL[index + 1..]
                .iter()
                .filter(|other| other.method() == route.method() && other.path() == route.path());
            assert_eq!(twins.count(), 0, "{route:?}");
        }
    }

    #[test]
    fn public_session_admin_and_features() {
        let nobody = Visitor::default();
        assert_eq!(authorize(Route::AuthLogin.guard(), &nobody), Ok(()));
        assert_eq!(authorize(Route::SpotifyCallback.guard(), &nobody), Ok(()));
        assert_eq!(authorize(Route::Me.guard(), &nobody), Err(Refusal::Unauthorized));
        assert_eq!(authorize(Route::Me.guard(), &Visitor { allowed: false, ..streamer() }), Err(Refusal::NotAllowed));
        assert_eq!(authorize(Route::Me.guard(), &streamer()), Ok(()));
        assert_eq!(authorize(Route::OverlayKey.guard(), &nobody), Err(Refusal::Unauthorized));
        assert_eq!(authorize(Route::OverlayKey.guard(), &streamer()), Ok(()));
        assert_eq!(authorize(Route::TestAlert.guard(), &without(Feature::Alerts)), Err(Refusal::FeatureOff));
        assert_eq!(authorize(Route::UploadMedia.guard(), &without(Feature::Fx)), Err(Refusal::FeatureOff));
        assert_eq!(authorize(Route::DeleteMedia.guard(), &without(Feature::Triggers)), Err(Refusal::FeatureOff));
        assert_eq!(authorize(Route::TriggerList.guard(), &without(Feature::Triggers)), Err(Refusal::FeatureOff));
        assert_eq!(authorize(Route::SpotifyLogin.guard(), &without(Feature::Music)), Err(Refusal::FeatureOff));
        let no_features = Visitor { features: BTreeMap::new(), ..streamer() };
        assert_eq!(authorize(Route::SpotifyLogin.guard(), &no_features), Err(Refusal::FeatureOff));
        assert_eq!(authorize(Route::SpotifyLogout.guard(), &no_features), Ok(()));
        assert_eq!(authorize(Route::TwitchDisconnect.guard(), &no_features), Ok(()));
        assert_eq!(authorize(Route::AdminAccess.guard(), &streamer()), Err(Refusal::AdminOnly));
        assert_eq!(authorize(Route::AdminAccess.guard(), &Visitor { admin: true, ..streamer() }), Ok(()));
        assert_eq!((Refusal::Unauthorized.status(), Refusal::FeatureOff.status()), (401, 403));
    }
}
