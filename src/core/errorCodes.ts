// Error codes the server sends to dashboard and overlays (response text, ?error= after a login,
// { key, code } when saving settings). The texts for them are in the dashboard (src/dashboard/texts.de.ts),
// checked in src/dashboard/texts.de.check.ts.

// Settings of a theme (src/core/settings.ts)
export const SETTING_ERROR_CODES = ["invalid_type", "invalid_color", "out_of_range", "too_long", "too_many_lines", "unknown_option", "invalid_media"] as const;
export type SettingErrorCode = (typeof SETTING_ERROR_CODES)[number];

// Requests and login (server/index.ts, server/routes.ts, server/http.ts, server/streamer.ts)
const REQUEST_ERROR_CODES = [
  "unauthorized", "not-allowed", "admin-only", "feature-off", "cross-origin", "method-not-allowed", "not-found", "forbidden",
  "login-failed", "account-changed", "spotify-failed", "spotify-not-configured", "not-connected", "not-running", "unavailable",
  "unknown-kind", "unknown-trigger", "invalid-name", "invalid-json", "too-large", "quota-exceeded", "upload-busy", "server-error",
  "unknown-clip", "render-busy", "render-not-started", "render-limit", "render-failed", "ffmpeg-missing",
  "backup-busy", "backup-invalid", "maintenance", "admin-protected", "invalid-login",
] as const;

export const ERROR_CODES = [...SETTING_ERROR_CODES, ...REQUEST_ERROR_CODES] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const isErrorCode = (code: string): code is ErrorCode => (ERROR_CODES as readonly string[]).includes(code);
