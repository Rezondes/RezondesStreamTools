//! Checks before any route (template: `sameOrigin` and `cookies` in `server/http.ts`). Writing requests need an
//! `Origin` equal to `PUBLIC_URL`; unlike the Node server a missing `Origin` is refused too, browsers always send it.

/// Scheme and host of a URL in lower case, without path and trailing slash
#[must_use]
pub fn origin_of(url: &str) -> String {
    let lower = url.trim().to_ascii_lowercase();
    match lower.split_once("://") {
        Some((scheme, rest)) => format!("{scheme}://{}", rest.split('/').next().unwrap_or_default()),
        None => lower,
    }
}

/// Whether the request may go on: reading always, writing only from the own origin
#[must_use]
pub fn same_origin(method: &str, origin: Option<&str>, public_origin: &str) -> bool {
    matches!(method, "GET" | "HEAD") || origin.is_some_and(|origin| origin_of(origin) == public_origin)
}

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

/// Value of a cookie; broken percent encoding stays raw
#[must_use]
pub fn cookie(header: Option<&str>, name: &str) -> Option<String> {
    header?.split(';').find_map(|pair| {
        let (key, value) = pair.trim().split_once('=')?;
        (key == name).then(|| percent_decode(value).unwrap_or_else(|| value.to_owned()))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const HOME: &str = "https://overlays.example.de";

    #[test]
    fn origin_of_urls() {
        assert_eq!(origin_of("https://Overlays.Example.de/"), HOME);
        assert_eq!(origin_of("http://localhost:8089/path?x"), "http://localhost:8089");
    }

    #[test]
    fn origin_reading_always_writing_only_from_home() {
        assert!(same_origin("GET", None, HOME));
        assert!(same_origin("HEAD", Some("https://evil.example"), HOME));
        assert!(same_origin("POST", Some("https://overlays.example.de"), HOME));
        assert!(!same_origin("POST", Some("https://evil.example"), HOME));
        assert!(!same_origin("POST", Some("null"), HOME));
        assert!(!same_origin("DELETE", None, HOME));
        assert!(!same_origin("POST", Some("http://overlays.example.de"), HOME));
    }

    #[test]
    fn cookies_with_equals_signs_and_broken_encoding() {
        let header = Some("sid=a.b=c; theme=%7Bx%7D; broken=%E0%A4");
        assert_eq!(cookie(header, "sid").as_deref(), Some("a.b=c"));
        assert_eq!(cookie(header, "theme").as_deref(), Some("{x}"));
        assert_eq!(cookie(header, "broken").as_deref(), Some("%E0%A4"));
        assert_eq!(cookie(header, "missing"), None);
        assert_eq!(cookie(None, "sid"), None);
    }
}
