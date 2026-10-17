//! Rules of the media library of a streamer (template: `server/media.ts`): the storage limit on upload, the
//! triggers that use a file and one upload per streamer at a time. Reading and writing files come with the infra.

use std::collections::HashSet;

use crate::triggers::Trigger;

/// Names of the triggers whose actions use the file as image, video or sound
#[must_use]
pub fn triggers_using(triggers: &[Trigger], name: &str) -> Vec<String> {
    triggers
        .iter()
        .filter(|trigger| {
            trigger.actions.iter().any(|action| {
                [&action.image, &action.video, &action.sound].into_iter().any(|file| file.as_deref() == Some(name))
            })
        })
        .map(|trigger| trigger.name.clone())
        .collect()
}

/// `Some("quota-exceeded")` if the upload does not fit the limit; `replaced_bytes`: size of the same-named file
/// being replaced
#[must_use]
pub fn quota_error(used_bytes: u64, upload_bytes: u64, replaced_bytes: u64, limit_bytes: u64) -> Option<&'static str> {
    (used_bytes.saturating_sub(replaced_bytes) + upload_bytes > limit_bytes).then_some("quota-exceeded")
}

/// One upload per streamer at a time: checking the limit and writing are apart, simultaneous uploads would all see
/// the same old state and together exceed the limit
#[derive(Debug, Default)]
pub struct UploadSlots {
    busy: HashSet<String>,
}

impl UploadSlots {
    /// `false` while the streamer already uploads
    pub fn take(&mut self, login: &str) -> bool {
        self.busy.insert(login.to_owned())
    }

    pub fn release(&mut self, login: &str) {
        self.busy.remove(login);
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    const MB: u64 = 1024 * 1024;

    #[test]
    fn quota_counts_the_replaced_file() {
        assert_eq!(quota_error(190 * MB, 20 * MB, 0, 200 * MB), Some("quota-exceeded"));
        assert_eq!(quota_error(190 * MB, 20 * MB, 15 * MB, 200 * MB), None);
        assert_eq!(quota_error(0, 200 * MB, 0, 200 * MB), None);
    }

    #[test]
    fn triggers_that_use_a_file() {
        let triggers: Vec<Trigger> = serde_json::from_value(json!([
            { "name": "lizard", "when": { "type": "word", "match": "LIZARD" }, "do": [{ "type": "media", "image": "lizard.gif", "sound": "lizard.wav" }] },
            { "name": "hype", "when": { "type": "word", "match": "HYPE" }, "do": [{ "type": "text", "text": "HYPE" }, { "type": "media", "video": "lizard.gif" }] },
            { "name": "other", "when": { "type": "word", "match": "X" }, "do": [{ "type": "media", "image": "x.png" }] }
        ]))
        .expect("triggers");
        assert_eq!(triggers_using(&triggers, "lizard.gif"), ["lizard", "hype"]);
        assert_eq!(triggers_using(&triggers, "lizard.wav"), ["lizard"]);
        assert!(triggers_using(&triggers, "nothing.gif").is_empty());
    }

    #[test]
    fn one_upload_per_streamer() {
        let mut slots = UploadSlots::default();
        assert!(slots.take("neo"));
        assert!(!slots.take("neo"));
        assert!(slots.take("trinity"));
        slots.release("neo");
        assert!(slots.take("neo"));
    }
}
