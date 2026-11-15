use axum::{
    extract::State,
    http::Uri,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use nas_app_core::prepare_socket;
use serde_json::json;
use std::{
    env,
    path::{Path, PathBuf},
};
use tokio::net::UnixListener;

#[derive(Clone)]
struct AppState {
    ui_dir: PathBuf,
}

async fn health() -> impl IntoResponse {
    Json(json!({"status":"ok","version":env!("CARGO_PKG_VERSION")}))
}

fn ui_dir() -> Result<PathBuf, String> {
    resolve_ui_dir(env::var_os("NAS_UI_DIR").map(PathBuf::from), || {
        env::current_exe().map_err(|error| error.to_string())
    })
}

fn resolve_ui_dir(
    configured: Option<PathBuf>,
    executable: impl FnOnce() -> Result<PathBuf, String>,
) -> Result<PathBuf, String> {
    if let Some(path) = configured {
        return Ok(path);
    }
    let executable = executable()?;
    let binary_dir = executable.parent().ok_or("Invalid executable path")?;
    let packaged = binary_dir
        .parent()
        .ok_or("Invalid executable path")?
        .join("dist");
    if packaged.join("index.html").is_file() {
        Ok(packaged)
    } else {
        Ok(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../dist/axum"))
    }
}

async fn static_file(State(state): State<AppState>, uri: Uri) -> Response {
    nas_app_core::serve_static(&state.ui_dir, uri.path()).await
}

/// Resolves on Ctrl+C or SIGTERM. The handler is registered on call, before the first poll, so no
/// signal is lost in between.
fn shutdown() -> impl std::future::Future<Output = ()> {
    let mut terminate = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        .expect("SIGTERM handler");
    async move {
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {},
            _ = terminate.recv() => {},
        }
    }
}

fn listen_path(
    args: impl IntoIterator<Item = std::ffi::OsString>,
    mut listen: Option<std::ffi::OsString>,
) -> Result<PathBuf, String> {
    let mut args = args.into_iter();
    while let Some(arg) = args.next() {
        if arg == "--listen" {
            listen = Some(args.next().ok_or("--listen requires a socket path")?);
        } else {
            return Err(format!("Unrecognized argument: {}", arg.to_string_lossy()));
        }
    }
    let path = PathBuf::from(listen.ok_or("Provide --listen or NAS_APP_SOCKET")?);
    if path.as_os_str().is_empty() {
        return Err("Empty socket path".to_owned());
    }
    Ok(path)
}

/// Serves the UI and `/health` on the socket until `stop` resolves, then removes the socket.
async fn serve(
    path: &Path,
    state: AppState,
    stop: impl std::future::Future<Output = ()> + Send + 'static,
) -> Result<(), Box<dyn std::error::Error>> {
    if !state.ui_dir.join("index.html").is_file() {
        return Err(format!("Frontend not found: {}", state.ui_dir.display()).into());
    }
    prepare_socket(path).await?;
    let listener = UnixListener::bind(path)?;
    let app = Router::new()
        .route("/health", get(health))
        .fallback(get(static_file))
        .with_state(state);
    println!("nas-security-center listening on {}", path.display());
    let result = axum::serve(nas_app_core::LauncherOnly::new(listener), app)
        .with_graceful_shutdown(stop)
        .await;
    if let Err(error) = tokio::fs::remove_file(path).await {
        eprintln!("unable to remove the socket ({error})");
    }
    result?;
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = listen_path(env::args_os().skip(1), env::var_os("NAS_APP_SOCKET"))
        .map_err(|error| -> Box<dyn std::error::Error> { error.into() })?;
    serve(&path, AppState { ui_dir: ui_dir()? }, shutdown()).await
}

#[cfg(test)]
#[path = "../tests/unit/axum/main.rs"]
mod tests;
