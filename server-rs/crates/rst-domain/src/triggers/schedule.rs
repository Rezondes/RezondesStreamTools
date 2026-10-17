//! Start time of every action of a trigger (template: `schedule` in `server/triggers.ts`). Actions run one after
//! another: the next starts only after delay + duration + after of the previous one; `together` appears at the same
//! time as the previous one. The overlay shows an action paused (delay), plays it (duration) and leaves it standing
//! paused (after).

use crate::triggers::FxAction;

/// Duration of an action without its own value, in seconds
pub const DEFAULT_DURATION: f64 = 4.0;

/// Start of every action in ms
#[must_use]
pub fn schedule(actions: &[FxAction]) -> Vec<u64> {
    let mut next = 0.0_f64;
    let mut previous_start = 0.0_f64;
    actions
        .iter()
        .map(|action| {
            let start = if action.together == Some(true) { previous_start } else { next };
            let seconds =
                action.delay.unwrap_or(0.0) + action.duration.unwrap_or(DEFAULT_DURATION) + action.after.unwrap_or(0.0);
            next = next.max(start + seconds * 1000.0);
            previous_start = start;
            // Values are checked to 0..=3600 s, so the start fits easily
            #[expect(clippy::cast_possible_truncation, clippy::cast_sign_loss, reason = "non-negative and bounded")]
            let millis = start.round() as u64;
            millis
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::triggers::ActionKind;

    fn action(kind: ActionKind) -> FxAction {
        FxAction { kind, ..FxAction::default() }
    }

    #[test]
    fn single_action_starts_at_zero() {
        assert_eq!(schedule(&[action(ActionKind::Media)]), [0]);
    }

    #[test]
    fn actions_follow_each_other_and_together_joins_the_previous() {
        let actions = [
            // appears at 0, plays 1 to 4 s, stands until 6 s
            FxAction { delay: Some(1.0), duration: Some(3.0), after: Some(2.0), ..action(ActionKind::Media) },
            // appears at 6 s
            FxAction { duration: Some(2.0), ..action(ActionKind::Text) },
            // appears with the previous one, runs until 6 + 0.5 + 4
            FxAction { together: Some(true), delay: Some(0.5), ..action(ActionKind::Text) },
            // after the longer of the two: 10.5 s
            FxAction { duration: Some(1.0), ..action(ActionKind::Media) },
        ];
        assert_eq!(schedule(&actions), [0, 6000, 6000, 10_500]);
    }
}
