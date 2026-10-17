//! Generated TypeScript types (`src/generated/`) always match the Rust code (RUST-PLAN.md, package 2).
//! `npm run gen:types` rewrites them (ignored test `write_generated_files`).

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

const HEADER: &str = "// Generated from server-rs (rst-app/src/api), do not edit by hand: npm run gen:types\n";
/// Files in `src/generated/` that do not come from the export
const KEEP: [&str; 1] = ["README.md"];

fn generated_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../src/generated")
}

/// All files of a directory tree: relative path with `/` -> content
fn read_tree(root: &Path) -> BTreeMap<String, String> {
    fn walk(root: &Path, dir: &Path, files: &mut BTreeMap<String, String>) {
        let Ok(entries) = fs::read_dir(dir) else { return };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                walk(root, &path, files);
            } else if let Ok(text) = fs::read_to_string(&path) {
                let relative = path.strip_prefix(root).map_or_else(|_| path.clone(), Path::to_path_buf);
                files.insert(
                    relative.to_string_lossy().replace('\\', "/"),
                    text.replace("\r\n", "\n"),
                );
            }
        }
    }
    let mut files = BTreeMap::new();
    walk(root, root, &mut files);
    files
}

/// Fresh export with header, as it must be in `src/generated/`
fn expected() -> BTreeMap<String, String> {
    let dir = std::env::temp_dir().join(format!("rst-export-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    rst_app::api::export_all(&rst_app::api::export_config(&dir)).expect("export");
    let files = read_tree(&dir)
        .into_iter()
        .map(|(name, text)| (name, format!("{HEADER}{text}")))
        .collect();
    let _ = fs::remove_dir_all(&dir);
    files
}

fn actual() -> BTreeMap<String, String> {
    read_tree(&generated_dir())
        .into_iter()
        .filter(|(name, _)| !KEEP.contains(&name.as_str()))
        .collect()
}

/// Differences as a readable list; empty = everything current
fn differences(expected: &BTreeMap<String, String>, actual: &BTreeMap<String, String>) -> Vec<String> {
    let mut problems = Vec::new();
    for (name, text) in expected {
        match actual.get(name) {
            None => problems.push(format!("missing: {name}")),
            Some(found) if found != text => problems.push(format!("stale: {name}")),
            Some(_) => {}
        }
    }
    problems.extend(
        actual
            .keys()
            .filter(|name| !expected.contains_key(*name))
            .map(|name| format!("extra: {name}")),
    );
    problems
}

#[test]
fn generated_files_are_current() {
    let problems = differences(&expected(), &actual());
    assert!(
        problems.is_empty(),
        "src/generated/ does not match the Rust code ({problems:?}), run npm run gen:types"
    );
}

#[test]
fn reports_missing_stale_and_extra_files() {
    let expected = BTreeMap::from([
        ("Ping.ts".to_string(), "a".to_string()),
        ("New.ts".to_string(), "b".to_string()),
    ]);
    let actual = BTreeMap::from([
        ("Ping.ts".to_string(), "old".to_string()),
        ("Old.ts".to_string(), "c".to_string()),
    ]);
    assert_eq!(
        differences(&expected, &actual),
        ["missing: New.ts", "stale: Ping.ts", "extra: Old.ts"]
    );
}

#[test]
fn every_file_has_the_header() {
    assert!(expected().values().all(|text| text.starts_with(HEADER)));
}

#[test]
#[ignore = "rewrites src/generated/, only via npm run gen:types"]
fn write_generated_files() {
    let dir = generated_dir();
    for name in actual().keys() {
        fs::remove_file(dir.join(name)).expect("delete old file");
    }
    for (name, text) in expected() {
        let path = dir.join(&name);
        fs::create_dir_all(path.parent().expect("folder")).expect("create folder");
        fs::write(path, text).expect("write");
    }
}
