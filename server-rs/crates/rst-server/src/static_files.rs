//! Static files from `DIST` (template: `serveStatic` in `server/http.ts`): the path is decoded once, broken percent
//! encoding is a 400 (the Node server answered 500), and no part may lead outside the root (403).

use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StaticError {
    BadEncoding,
    Forbidden,
}

impl StaticError {
    #[must_use]
    pub const fn status(self) -> u16 {
        match self {
            Self::BadEncoding => 400,
            Self::Forbidden => 403,
        }
    }

    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::BadEncoding => "bad-request",
            Self::Forbidden => "forbidden",
        }
    }
}

/// Like `decodeURIComponent`: `%XX` must form valid UTF-8
fn percent_decode(value: &str) -> Option<String> {
    let bytes = value.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' {
            decoded.push(u8::from_str_radix(value.get(index + 1..index + 3)?, 16).ok()?);
            index += 3;
        } else {
            decoded.push(bytes[index]);
            index += 1;
        }
    }
    String::from_utf8(decoded).ok()
}

/// The file for a request path under `root`
///
/// # Errors
/// `BadEncoding` for broken percent encoding, `Forbidden` for any part that could leave the root.
pub fn resolve(root: &Path, path: &str) -> Result<PathBuf, StaticError> {
    let decoded = percent_decode(path).ok_or(StaticError::BadEncoding)?;
    let mut file = root.to_owned();
    for part in decoded.split('/').filter(|part| !part.is_empty()) {
        let unsafe_part = part == "." || part == ".." || part.contains(['\\', ':', '\0']);
        if unsafe_part {
            return Err(StaticError::Forbidden);
        }
        file.push(part);
    }
    Ok(file)
}

#[must_use]
pub fn content_type(file: &Path) -> &'static str {
    let extension = file.extension().and_then(|extension| extension.to_str()).unwrap_or_default().to_ascii_lowercase();
    match extension.as_str() {
        "html" => "text/html; charset=utf-8",
        "js" => "text/javascript",
        "css" => "text/css",
        "json" => "application/json",
        "png" => "image/png",
        "svg" => "image/svg+xml",
        "webm" => "video/webm",
        "mp4" => "video/mp4",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "jpg" | "jpeg" => "image/jpeg",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "woff2" => "font/woff2",
        _ => "application/octet-stream",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn paths_stay_inside_the_root() {
        let root = Path::new("dist");
        assert_eq!(resolve(root, "/alerts.html"), Ok(root.join("alerts.html")));
        assert_eq!(resolve(root, "/assets/index%20x.js"), Ok(root.join("assets").join("index x.js")));
        assert_eq!(resolve(root, "/../secret.txt"), Err(StaticError::Forbidden));
        assert_eq!(resolve(root, "/%2e%2e/secret.txt"), Err(StaticError::Forbidden));
        assert_eq!(resolve(root, "/a/..%2F..%2Fsecret"), Err(StaticError::Forbidden));
        assert_eq!(resolve(root, "/..\\secret"), Err(StaticError::Forbidden));
        assert_eq!(resolve(root, "/C:/Windows"), Err(StaticError::Forbidden));
        assert_eq!(resolve(root, "/%E0"), Err(StaticError::BadEncoding));
        assert_eq!(resolve(root, "/%zz"), Err(StaticError::BadEncoding));
        assert_eq!((StaticError::BadEncoding.status(), StaticError::Forbidden.status()), (400, 403));
    }

    #[test]
    fn content_types() {
        assert_eq!(content_type(Path::new("bild.svg")), "image/svg+xml");
        assert_eq!(content_type(Path::new("index.HTML")), "text/html; charset=utf-8");
        assert_eq!(content_type(Path::new("file")), "application/octet-stream");
    }
}
