//! TypeScript type of the resolved values of a theme (`<Id>Values`), written to `src/generated/themes/<id>.ts`
//! from the Rust schema. Replaces `ValuesOf<typeof FIELDS>` of the TypeScript schemas (RUST-PLAN.md package 8).

use std::fmt::Write as _;

use rst_domain::settings::field::FieldKind;
use rst_domain::themes::schema::ThemeSchema;

/// `standard` -> `StandardValues`
#[must_use]
pub fn values_name(id: &str) -> String {
    let mut chars = id.chars();
    let first = chars.next().map(|first| first.to_uppercase().collect::<String>()).unwrap_or_default();
    format!("{first}{}Values", chars.as_str())
}

fn ts_type(kind: &FieldKind) -> &'static str {
    match kind {
        FieldKind::Number { .. } => "number",
        FieldKind::Boolean { .. } => "boolean",
        FieldKind::Lines { .. } => "readonly string[]",
        FieldKind::Sound { .. } => "SoundValue",
        _ => "string",
    }
}

/// The file content (without the generated-file header)
#[must_use]
pub fn values_type(schema: &ThemeSchema) -> String {
    let mut text = String::new();
    if schema.fields.iter().any(|field| matches!(field.kind, FieldKind::Sound { .. })) {
        text.push_str("import type { SoundValue } from \"../SoundValue.ts\";\n\n");
    }
    let _ = writeln!(
        text,
        "/**\n * Resolved settings of the theme \"{}\", one value per field of its schema\n */",
        schema.id
    );
    let _ = writeln!(text, "export type {} = {{", values_name(&schema.id));
    for field in &schema.fields {
        let _ = writeln!(text, "  readonly {}: {};", field.key, ts_type(&field.kind));
    }
    text.push_str("};\n");
    text
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use rst_domain::settings::field::{color, flag, lines, number, sound};

    use super::*;

    #[test]
    fn names_from_ids() {
        assert_eq!(values_name("standard"), "StandardValues");
        assert_eq!(values_name("suedfrucht"), "SuedfruchtValues");
    }

    #[test]
    fn one_readonly_key_per_field_with_its_type() {
        let schema = ThemeSchema {
            id: "probe".to_owned(),
            name: "Probe".to_owned(),
            fields: vec![
                color("accent", "Color", "A", "#000000"),
                number("size", "Size", "A", 1.0, 0.0, 2.0, None, None),
                flag("glow", "Glow", "A", true),
                lines("terminal", "Lines", "A", &[], None),
                sound("beep", "Sound", "A"),
            ],
            group_scenes: BTreeMap::new(),
            minime_variants: None,
        };
        let text = values_type(&schema);
        assert!(text.starts_with("import type { SoundValue } from \"../SoundValue.ts\";"));
        for line in [
            "export type ProbeValues = {",
            "  readonly accent: string;",
            "  readonly size: number;",
            "  readonly glow: boolean;",
            "  readonly terminal: readonly string[];",
            "  readonly beep: SoundValue;",
        ] {
            assert!(text.contains(line), "{line}");
        }
    }
}
