//! Clips a streamer can render (template: `CLIPS` and `outputNames` in `server/render.ts`): the stinger as `WebM` with
//! alpha, the banners as GIF with a still image.

use crate::access::Feature;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Format {
    Gif,
    Webm,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Clip {
    Stinger,
    Profile,
    Offline,
}

impl Clip {
    pub const ALL: [Self; 3] = [Self::Stinger, Self::Profile, Self::Offline];

    #[must_use]
    pub fn parse(value: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|clip| clip.as_str() == value)
    }

    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Stinger => "stinger",
            Self::Profile => "profile",
            Self::Offline => "offline",
        }
    }

    #[must_use]
    pub const fn format(self) -> Format {
        match self {
            Self::Stinger => Format::Webm,
            Self::Profile | Self::Offline => Format::Gif,
        }
    }

    /// Feature the streamer needs to render the clip
    #[must_use]
    pub const fn feature(self) -> Feature {
        match self {
            Self::Stinger => Feature::Stinger,
            Self::Profile | Self::Offline => Feature::Banners,
        }
    }

    /// Files the clip produces: the video and for GIFs a still image from the first frame
    #[must_use]
    pub const fn output_names(self) -> &'static [&'static str] {
        match self {
            Self::Stinger => &["stinger.webm"],
            Self::Profile => &["profile.gif", "profile.png"],
            Self::Offline => &["offline.gif", "offline.png"],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::media::values::OUTPUT_NAMES;

    #[test]
    fn clips_features_and_outputs() {
        assert_eq!(Clip::Stinger.feature(), Feature::Stinger);
        assert_eq!(Clip::Profile.feature(), Feature::Banners);
        assert_eq!(Clip::Stinger.output_names(), ["stinger.webm"]);
        assert_eq!(Clip::Offline.output_names(), ["offline.gif", "offline.png"]);
        assert_eq!(Clip::parse("profile"), Some(Clip::Profile));
        assert_eq!(Clip::parse("tokens"), None);
    }

    #[test]
    fn output_names_match_the_media_value() {
        let all: Vec<&str> = Clip::ALL.iter().flat_map(|clip| clip.output_names().iter().copied()).collect();
        assert_eq!(all, OUTPUT_NAMES);
    }
}
