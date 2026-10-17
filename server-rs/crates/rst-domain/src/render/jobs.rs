//! Running renders, at most one per streamer (template: `createRenderJobs` and `RENDER_LIMITS` in
//! `server/render.ts`). The browser sends frames, `finish` hands the job to ffmpeg and it stays taken until `done`.
//! Times are milliseconds and passed in, so the timeout stays testable.

use std::collections::HashMap;

use crate::render::clips::Clip;

/// 20 s at 60 fps
pub const MAX_FRAMES: i64 = 1200;
/// One PNG at 1920x1080
pub const MAX_FRAME_BYTES: u64 = 8 * 1024 * 1024;
/// An abandoned render is released afterwards
pub const TIMEOUT_MS: i64 = 10 * 60_000;
/// Twitch does not accept larger banner GIFs
pub const GIF_WARN_BYTES: u64 = 10 * 1024 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RenderError {
    Busy,
    NotStarted,
    Limit,
    TooLarge,
}

impl RenderError {
    /// Error code of the API
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Busy => "render-busy",
            Self::NotStarted => "render-not-started",
            Self::Limit => "render-limit",
            Self::TooLarge => "too-large",
        }
    }
}

/// What ffmpeg gets after `finish`
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Finished {
    pub clip: Clip,
    pub frames: i64,
    pub fps: u32,
}

#[derive(Debug)]
struct Job {
    clip: Clip,
    frames: i64,
    started_at: i64,
    /// ffmpeg is already running
    encoding: bool,
}

#[derive(Debug, Default)]
pub struct RenderJobs {
    jobs: HashMap<String, Job>,
}

impl RenderJobs {
    fn running(&mut self, login: &str, now: i64) -> Option<&mut Job> {
        self.jobs.get_mut(login).filter(|job| now - job.started_at <= TIMEOUT_MS)
    }

    /// # Errors
    /// `Busy` while the streamer already renders.
    pub fn start(&mut self, login: &str, clip: Clip, now: i64) -> Result<(), RenderError> {
        if self.running(login, now).is_some() {
            return Err(RenderError::Busy);
        }
        self.jobs.insert(login.to_owned(), Job { clip, frames: 0, started_at: now, encoding: false });
        Ok(())
    }

    /// # Errors
    /// Without a render, while encoding, for an index outside the limit or a too large frame.
    pub fn frame(&mut self, login: &str, index: i64, bytes: u64, now: i64) -> Result<(), RenderError> {
        let job = self.running(login, now).ok_or(RenderError::NotStarted)?;
        if job.encoding {
            return Err(RenderError::Busy);
        }
        if !(0..MAX_FRAMES).contains(&index) {
            return Err(RenderError::Limit);
        }
        if bytes > MAX_FRAME_BYTES {
            return Err(RenderError::TooLarge);
        }
        job.frames = job.frames.max(index + 1);
        Ok(())
    }

    /// Hands the job to ffmpeg; it stays taken until [`Self::done`]
    ///
    /// # Errors
    /// Without a render, while encoding or for fps outside 1 to 60.
    pub fn finish(&mut self, login: &str, fps: i64, now: i64) -> Result<Finished, RenderError> {
        let job = self.running(login, now).ok_or(RenderError::NotStarted)?;
        if job.encoding {
            return Err(RenderError::Busy);
        }
        let fps = u32::try_from(fps).ok().filter(|fps| (1..=60).contains(fps)).ok_or(RenderError::Limit)?;
        job.encoding = true;
        Ok(Finished { clip: job.clip, frames: job.frames, fps })
    }

    /// The clip of the running render, so every step can check the feature again
    pub fn clip(&mut self, login: &str, now: i64) -> Option<Clip> {
        self.running(login, now).map(|job| job.clip)
    }

    /// ffmpeg is finished (or failed): the streamer may render again
    pub fn done(&mut self, login: &str) {
        self.jobs.remove(login);
    }

    /// Cancels only before encoding; `false` while ffmpeg runs
    pub fn cancel(&mut self, login: &str, now: i64) -> bool {
        if self.running(login, now).is_some_and(|job| job.encoding) {
            return false;
        }
        self.jobs.remove(login);
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_render_per_streamer_released_after_the_timeout() {
        let mut jobs = RenderJobs::default();
        let mut now = 1000;
        assert_eq!(jobs.start("neo", Clip::Stinger, now), Ok(()));
        assert_eq!(jobs.clip("neo", now), Some(Clip::Stinger));
        assert_eq!(jobs.clip("trinity", now), None);
        assert_eq!(jobs.start("neo", Clip::Profile, now), Err(RenderError::Busy));
        assert_eq!(jobs.start("trinity", Clip::Profile, now), Ok(()));
        now += TIMEOUT_MS + 1;
        assert_eq!(jobs.start("neo", Clip::Offline, now), Ok(()));

        assert_eq!(jobs.frame("morpheus", 0, 100, now), Err(RenderError::NotStarted));
        assert_eq!(jobs.frame("neo", 0, 100, now), Ok(()));
        assert_eq!(jobs.frame("neo", 10_000, 100, now), Err(RenderError::Limit));
        assert_eq!(jobs.frame("neo", -1, 100, now), Err(RenderError::Limit));
        assert_eq!(jobs.frame("neo", 1, MAX_FRAME_BYTES + 1, now), Err(RenderError::TooLarge));
    }

    #[test]
    fn encoding_answers_busy_until_done() {
        let mut jobs = RenderJobs::default();
        let now = 0;
        jobs.start("neo", Clip::Offline, now).expect("start");
        jobs.frame("neo", 0, 100, now).expect("frame");
        assert_eq!(jobs.finish("neo", 10, now), Ok(Finished { clip: Clip::Offline, frames: 1, fps: 10 }));
        assert_eq!(jobs.finish("neo", 10, now), Err(RenderError::Busy));
        assert_eq!(jobs.start("neo", Clip::Stinger, now), Err(RenderError::Busy));
        assert_eq!(jobs.frame("neo", 0, 100, now), Err(RenderError::Busy));
        assert!(!jobs.cancel("neo", now));
        jobs.done("neo");
        assert_eq!(jobs.finish("neo", 10, now), Err(RenderError::NotStarted));
        assert_eq!(jobs.start("neo", Clip::Stinger, now), Ok(()));
        assert_eq!(jobs.finish("neo", 0, now), Err(RenderError::Limit));
        assert_eq!(jobs.finish("neo", 61, now), Err(RenderError::Limit));
        assert!(jobs.cancel("neo", now));
        assert_eq!(jobs.start("neo", Clip::Stinger, now), Ok(()));
        assert_eq!(RenderError::Busy.code(), "render-busy");
    }
}
