//! Test helper: compares a Rust theme with the JSON fixture of its TypeScript schema (`scripts/dumpSchema.ts`),
//! field by field, so a difference names the field. Numbers are compared as floats (TypeScript writes 10, Rust 10.0).

use serde_json::{Map, Number, Value};

use crate::identity::values::Login;
use crate::settings::field::SettingField;
use crate::themes::registry::Theme;

/// Logins the fixture holds personalize samples for
const SAMPLE_LOGINS: [&str; 3] = ["neo", "rezondes", "neo_42"];

fn normalize(value: Value) -> Value {
    match value {
        Value::Number(number) => number.as_f64().and_then(Number::from_f64).map_or(Value::Null, Value::Number),
        Value::Array(items) => Value::Array(items.into_iter().map(normalize).collect()),
        Value::Object(map) => Value::Object(map.into_iter().map(|(key, value)| (key, normalize(value))).collect()),
        other => other,
    }
}

fn samples(theme: &Theme) -> Value {
    let samples: Map<String, Value> = SAMPLE_LOGINS
        .iter()
        .map(|login| {
            let values = (theme.personalize)(&Login::parse(login).expect("valid login"));
            ((*login).to_owned(), serde_json::to_value(values).expect("serialize personalize"))
        })
        .collect();
    Value::Object(samples)
}

fn take_fields(value: &mut Value) -> Vec<Value> {
    value.get_mut("fields").map(Value::take).and_then(|fields| fields.as_array().cloned()).unwrap_or_default()
}

pub fn assert_same_as_fixture(theme: &Theme, fixture: &str) {
    let mut expected = normalize(serde_json::from_str(fixture).expect("fixture is JSON"));
    let mut actual = normalize(serde_json::to_value(&theme.schema).expect("serialize schema"));
    actual["personalize"] = normalize(samples(theme));
    let (expected_fields, actual_fields) = (take_fields(&mut expected), take_fields(&mut actual));
    for (index, (want, got)) in expected_fields.iter().zip(&actual_fields).enumerate() {
        assert_eq!(got, want, "field {index} ({})", want["key"]);
    }
    assert_eq!(actual_fields.len(), expected_fields.len(), "number of fields");
    assert_eq!(actual, expected, "schema without fields");
}

/// Compares generated fields with the `fields` of a fixture entry (`minime-features.json`), field by field
pub fn assert_same_fields(fields: &[SettingField], fixture: &Value) {
    let actual = normalize(serde_json::to_value(fields).expect("serialize fields"));
    let expected = normalize(fixture.clone());
    let (actual, expected) =
        (actual.as_array().cloned().unwrap_or_default(), expected.as_array().cloned().unwrap_or_default());
    for (index, (want, got)) in expected.iter().zip(&actual).enumerate() {
        assert_eq!(got, want, "field {index} ({})", want["key"]);
    }
    assert_eq!(actual.len(), expected.len(), "number of fields");
}
