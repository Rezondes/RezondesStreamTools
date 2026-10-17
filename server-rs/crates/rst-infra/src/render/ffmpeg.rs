//! ffmpeg as a child process (template: `runFfmpeg` in `server/renderRoutes.ts`): arguments as a list, never through
//! a shell, with a time limit. A run over the limit or a dropped future kills the process.

use std::process::Stdio;
use std::time::Duration;

use tokio::io::AsyncReadExt;
use tokio::process::Command;

/// `FFMPEG` names the program, otherwise `ffmpeg` from `PATH`
pub const FFMPEG_VAR: &str = "FFMPEG";
/// Longest render
pub const LIMIT: Duration = Duration::from_mins(5);
/// So much of the end of the ffmpeg log goes to the server log on failure
const LOG_TAIL: usize = 2000;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EncodeError {
    /// The program does not start
    Missing,
    /// Exit code other than 0
    Failed,
    TimedOut,
}

impl EncodeError {
    /// Error code of the API
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Missing => "ffmpeg-missing",
            Self::Failed | Self::TimedOut => "render-failed",
        }
    }
}

#[derive(Debug, Clone)]
pub struct Ffmpeg {
    program: String,
    limit: Duration,
}

impl Ffmpeg {
    #[must_use]
    pub fn new(program: &str, limit: Duration) -> Self {
        Self { program: program.to_owned(), limit }
    }

    #[must_use]
    pub fn from_env() -> Self {
        Self::new(&std::env::var(FFMPEG_VAR).unwrap_or_else(|_| "ffmpeg".to_owned()), LIMIT)
    }

    /// Runs the program with `args` until it ends or the limit is over
    ///
    /// # Errors
    /// `Missing` when it does not start, `Failed` for an exit code other than 0, `TimedOut` after the limit.
    pub async fn run(&self, args: &[String]) -> Result<(), EncodeError> {
        let mut child = Command::new(&self.program)
            .args(args)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .kill_on_drop(true)
            .spawn()
            .map_err(|_| EncodeError::Missing)?;
        let mut stderr = child.stderr.take();
        let finished = async {
            let mut log = Vec::new();
            if let Some(stderr) = stderr.as_mut() {
                // The log only matters on failure; a read error just leaves it shorter
                let _ = stderr.read_to_end(&mut log).await;
            }
            (child.wait().await, log)
        };
        let Ok((status, log)) = tokio::time::timeout(self.limit, finished).await else {
            eprintln!("ffmpeg took longer than {} s and was stopped", self.limit.as_secs());
            return Err(EncodeError::TimedOut);
        };
        match status {
            Ok(status) if status.success() => Ok(()),
            Ok(status) => {
                let text = String::from_utf8_lossy(&log);
                let tail: String = text.chars().rev().take(LOG_TAIL).collect::<Vec<_>>().into_iter().rev().collect();
                eprintln!("ffmpeg failed ({status}): {tail}");
                Err(EncodeError::Failed)
            }
            Err(_) => Err(EncodeError::Failed),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A shell stands in for ffmpeg: the tests only need exit codes and a slow run
    fn shell(script: &str) -> (Ffmpeg, Vec<String>) {
        if cfg!(windows) {
            (Ffmpeg::new("cmd", Duration::from_millis(500)), vec!["/C".to_owned(), script.to_owned()])
        } else {
            (Ffmpeg::new("sh", Duration::from_millis(500)), vec!["-c".to_owned(), script.to_owned()])
        }
    }

    #[tokio::test]
    async fn exit_codes_time_limit_and_a_missing_program() {
        let (ok, args) = shell("exit 0");
        assert_eq!(ok.run(&args).await, Ok(()));
        let (failing, args) = shell("exit 3");
        assert_eq!(failing.run(&args).await, Err(EncodeError::Failed));
        let slow = if cfg!(windows) { "ping -n 6 127.0.0.1" } else { "sleep 5" };
        let (slow_one, args) = shell(slow);
        assert_eq!(slow_one.run(&args).await, Err(EncodeError::TimedOut));
        let missing = Ffmpeg::new("rst-no-such-ffmpeg", LIMIT);
        assert_eq!(missing.run(&[]).await, Err(EncodeError::Missing));
        assert_eq!(EncodeError::Missing.code(), "ffmpeg-missing");
    }
}
