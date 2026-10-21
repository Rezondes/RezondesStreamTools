//! Arguments for ffmpeg (template: `ffmpegArgs` in `server/render.ts`): always a list for a direct process start,
//! never a shell line.

use crate::render::clips::Format;

/// Frames `<frames>/0000.png`, `0001.png`, ... with `fps` to the `WebM` `target`; a PNG clip needs no ffmpeg (None)
#[must_use]
pub fn ffmpeg_args(format: Format, fps: u32, frames: &str, target: &str) -> Option<Vec<String>> {
    let mut args =
        vec!["-y".to_owned(), "-framerate".to_owned(), fps.to_string(), "-i".to_owned(), format!("{frames}/%04d.png")];
    let rest: &[&str] = match format {
        Format::Png => return None,
        // VP9 with alpha channel so OBS plays the stinger transparently
        Format::Webm => &[
            "-c:v",
            "libvpx-vp9",
            "-pix_fmt",
            "yuva420p",
            "-b:v",
            "0",
            "-crf",
            "20",
            "-auto-alt-ref",
            "0",
            "-row-mt",
            "1",
        ],
    };
    args.extend(rest.iter().map(|arg| (*arg).to_owned()));
    args.push(target.to_owned());
    Some(args)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn png_needs_no_ffmpeg() {
        assert_eq!(ffmpeg_args(Format::Png, 1, "frames", "profile.png"), None);
    }

    #[test]
    fn webm_with_alpha() {
        let webm = ffmpeg_args(Format::Webm, 60, "frames", "stinger.webm").expect("webm args");
        assert_eq!(webm[..5], ["-y", "-framerate", "60", "-i", "frames/%04d.png"]);
        assert!(webm.iter().any(|arg| arg == "libvpx-vp9"));
        let pix = webm.iter().position(|arg| arg == "-pix_fmt").expect("pix_fmt");
        assert_eq!(webm[pix + 1], "yuva420p");
        assert_eq!(webm.last().map(String::as_str), Some("stinger.webm"));
    }
}
