//! The domain layer stays free of IO and of the other project crates (RUST-PLAN.md, package 1).

const MANIFEST: &str = include_str!("../Cargo.toml");
const FORBIDDEN: [&str; 5] = ["tokio", "sqlx", "axum", "reqwest", "rst-"];

/// Dependency names from the `[dependencies]` section of the manifest.
fn dependencies(manifest: &str) -> Vec<&str> {
    let mut in_dependencies = false;
    let mut names = Vec::new();
    for line in manifest.lines().map(str::trim) {
        if line.starts_with('[') {
            in_dependencies = line == "[dependencies]";
        } else if in_dependencies && !line.is_empty() && !line.starts_with('#') {
            names.push(line.split(['=', '.']).next().unwrap_or("").trim());
        }
    }
    names
}

#[test]
fn domain_has_no_io_dependencies() {
    let forbidden: Vec<&str> = dependencies(MANIFEST)
        .into_iter()
        .filter(|name| FORBIDDEN.iter().any(|bad| name.starts_with(bad)))
        .collect();
    assert!(
        forbidden.is_empty(),
        "rst-domain must not depend on: {forbidden:?}"
    );
}

#[test]
fn reads_dependency_names() {
    let manifest = "[package]\nname = \"x\"\n[dependencies]\nserde = \"1\"\ntokio.workspace = true\n[dev-dependencies]\nsqlx = \"1\"";
    assert_eq!(dependencies(manifest), ["serde", "tokio"]);
}
