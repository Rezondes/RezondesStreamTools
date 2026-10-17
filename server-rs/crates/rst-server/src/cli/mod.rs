//! Commands of the binary `rst`.

pub mod import;

/// What the command line asks for
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Command {
    Version,
    Import { from: String },
    Usage,
}

/// The arguments after the program name
#[must_use]
pub fn parse(args: &[String]) -> Command {
    match args {
        [] => Command::Version,
        [flag] if flag == "--version" => Command::Version,
        [command, flag, from] if command == "import" && flag == "--from" => Command::Import { from: from.clone() },
        _ => Command::Usage,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| (*value).to_owned()).collect()
    }

    #[test]
    fn commands() {
        assert_eq!(parse(&args(&[])), Command::Version);
        assert_eq!(parse(&args(&["--version"])), Command::Version);
        assert_eq!(parse(&args(&["import", "--from", "data"])), Command::Import { from: "data".to_owned() });
        assert_eq!(parse(&args(&["import", "data"])), Command::Usage);
        assert_eq!(parse(&args(&["serve", "--now"])), Command::Usage);
    }
}
