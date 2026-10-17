//! Arguments for ffmpeg (template: `ffmpegArgs` in `server/render.ts`): always a list for a direct process start,
//! never a shell line.

use crate::render::clips::Format;

/// Frames `<frames>/0000.png`, `0001.png`, ... with `fps` to `target`
#[must_use]
pub fn ffmpeg_args(format: Format, fps: u32, frames: &str, target: &str) -> Vec<String> {
    let mut args =
        vec!["-y".to_owned(), "-framerate".to_owned(), fps.to_string(), "-i".to_owned(), format!("{frames}/%04d.png")];
    let rest: &[&str] = match format {
        // Own palette from all frames, store only changed image areas, endless loop
        Format::Gif => &[
            "-filter_complex",
            "[0:v]split[a][b];[a]palettegen=max_colors=64:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
            "-loop",
            "0",
        ],
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
    args
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gif_with_own_palette_and_endless_loop() {
        let gif = ffmpeg_args(Format::Gif, 12, "frames", "profile.gif");
        assert_eq!(gif[..5], ["-y", "-framerate", "12", "-i", "frames/%04d.png"]);
        assert!(gif.iter().any(|arg| arg.contains("palettegen") && arg.contains("paletteuse")));
        assert_eq!(gif[gif.len() - 3..], ["-loop", "0", "profile.gif"]);
    }

    #[test]
    fn webm_with_alpha() {
        let webm = ffmpeg_args(Format::Webm, 60, "frames", "stinger.webm");
        assert!(webm.iter().any(|arg| arg == "libvpx-vp9"));
        let pix = webm.iter().position(|arg| arg == "-pix_fmt").expect("pix_fmt");
        assert_eq!(webm[pix + 1], "yuva420p");
        assert_eq!(webm.last().map(String::as_str), Some("stinger.webm"));
    }
}
