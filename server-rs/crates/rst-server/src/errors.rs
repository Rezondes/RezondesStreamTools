//! Responses: an error code as plain text (like `send` in `server/http.ts`) or JSON without caching (`json`).

use axum::body::Body;
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::Response;
use serde::Serialize;

fn status(code: u16) -> StatusCode {
    StatusCode::from_u16(code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
}

/// Plain text answer, e.g. `404 not-found`
#[must_use]
pub fn text(code: u16, body: &str) -> Response {
    let mut response = Response::new(Body::from(body.to_owned()));
    *response.status_mut() = status(code);
    response.headers_mut().insert(header::CONTENT_TYPE, HeaderValue::from_static("text/plain; charset=utf-8"));
    response
}

/// JSON answer that browsers never cache
#[must_use]
pub fn json(value: &impl Serialize, code: u16) -> Response {
    let Ok(body) = serde_json::to_vec(value) else { return server_error("serializing an answer failed") };
    let mut response = Response::new(Body::from(body));
    *response.status_mut() = status(code);
    let headers = response.headers_mut();
    headers.insert(header::CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response
}

/// 302 to `location` with the given cookies
#[must_use]
pub fn redirect(location: &str, cookies: &[String]) -> Response {
    let mut response = Response::new(Body::empty());
    *response.status_mut() = StatusCode::FOUND;
    let headers = response.headers_mut();
    if let Ok(value) = HeaderValue::from_str(location) {
        headers.insert(header::LOCATION, value);
    }
    for cookie in cookies {
        if let Ok(value) = HeaderValue::from_str(cookie) {
            headers.append(header::SET_COOKIE, value);
        }
    }
    response
}

/// A failure inside the server: logged, the browser only learns `server-error`
#[must_use]
pub fn server_error(message: &str) -> Response {
    eprintln!("Request failed: {message}");
    text(500, "server-error")
}

/// A route whose handler comes with a later package of RUST-PLAN.md
#[must_use]
pub fn pending() -> Response {
    text(501, "not-implemented")
}
