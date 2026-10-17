//! Binary `rst`: HTTP server, command line and wiring of all layers.

mod cli;
mod config;

use std::path::Path;
use std::process::ExitCode;

use cli::Command;
use config::Config;

const USAGE: &str = "usage: rst [--version] | rst import --from <DATA>";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match cli::parse(&args) {
        Command::Version => {
            println!("rst {}", env!("CARGO_PKG_VERSION"));
            ExitCode::SUCCESS
        }
        Command::Usage => {
            eprintln!("{USAGE}");
            ExitCode::from(2)
        }
        Command::Import { from } => import(Path::new(&from)),
    }
}

fn import(from: &Path) -> ExitCode {
    let config = match Config::from_env() {
        Ok(config) => config,
        Err(error) => {
            eprintln!("{error}");
            return ExitCode::from(2);
        }
    };
    let runtime = match tokio::runtime::Builder::new_current_thread().enable_all().build() {
        Ok(runtime) => runtime,
        Err(error) => {
            eprintln!("no async runtime: {error}");
            return ExitCode::from(2);
        }
    };
    match runtime.block_on(cli::import::run(&config, from)) {
        Ok(report) => {
            for name in &report.imported {
                println!("imported: {name}");
            }
            for problem in &report.problems {
                eprintln!("problem: {problem}");
            }
            if report.complete() { ExitCode::SUCCESS } else { ExitCode::from(1) }
        }
        Err(error) => {
            eprintln!("import failed: {error}");
            ExitCode::from(2)
        }
    }
}
