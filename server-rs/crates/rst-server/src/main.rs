//! Binary `rst`: HTTP server, command line and wiring of all layers.

mod app;
mod cli;
mod clock;
mod config;
mod errors;
mod guard;
mod handlers;
mod routes;
mod static_files;
mod wiring;

use std::net::SocketAddr;
use std::path::Path;
use std::process::ExitCode;
use std::sync::Arc;

use cli::Command;
use config::{ServerConfig, StoreConfig, env};

/// How often the backup schedules are checked
const SCHEDULE_EVERY: std::time::Duration = std::time::Duration::from_secs(60);
const USAGE: &str = "usage: rst [--version] | rst serve | rst import --from <DATA>";

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
        Command::Serve => run(serve()),
        Command::Import { from } => run(import(Path::new(&from))),
    }
}

/// Runs a command on the async runtime; its error ends the process with code 2
fn run(command: impl Future<Output = Result<ExitCode, String>>) -> ExitCode {
    let runtime = match tokio::runtime::Builder::new_multi_thread().enable_all().build() {
        Ok(runtime) => runtime,
        Err(error) => {
            eprintln!("no async runtime: {error}");
            return ExitCode::from(2);
        }
    };
    runtime.block_on(command).unwrap_or_else(|error| {
        eprintln!("{error}");
        ExitCode::from(2)
    })
}

async fn serve() -> Result<ExitCode, String> {
    let config = ServerConfig::from_lookup(&env).map_err(|error| error.to_string())?;
    if config.admins.is_empty() {
        eprintln!("ADMINS is empty: nobody can manage access (see server.env.example)");
    }
    let stores = wiring::open(&config.stores).await?;
    let address = SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = tokio::net::TcpListener::bind(address).await.map_err(|error| format!("{address}: {error}"))?;
    let app = Arc::new(app::App::new(config, stores));
    let running = app.restart_all().await;
    println!("Overlay server on {} ({running} streamers running)", app.config.public_url);
    let scheduled = Arc::clone(&app);
    tokio::spawn(async move {
        loop {
            scheduled.run_schedules().await;
            tokio::time::sleep(SCHEDULE_EVERY).await;
        }
    });
    axum::serve(listener, app::router(app))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await
        .map_err(|error| error.to_string())?;
    Ok(ExitCode::SUCCESS)
}

async fn import(from: &Path) -> Result<ExitCode, String> {
    let config = StoreConfig::from_lookup(&env).map_err(|error| error.to_string())?;
    let report = cli::import::run(&config, from).await.map_err(|error| format!("import failed: {error}"))?;
    for name in &report.imported {
        println!("imported: {name}");
    }
    for problem in &report.problems {
        eprintln!("problem: {problem}");
    }
    Ok(if report.complete() { ExitCode::SUCCESS } else { ExitCode::from(1) })
}
