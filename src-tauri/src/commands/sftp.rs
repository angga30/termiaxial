use crate::commands::ssh::SessionManager;
use crate::domain::error::TmaxError;
use crate::ssh::create_sftp_session;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[derive(Serialize, Deserialize, Debug)]
pub struct SftpEntry {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: u64,
}

use std::time::UNIX_EPOCH;

use tauri::{AppHandle, Emitter, Manager, State};

#[tauri::command]
pub async fn sftp_get_home_dir(app: AppHandle) -> Result<String, TmaxError> {
    tracing::debug!("Fetching local home directory");
    match app.path().home_dir() {
        Ok(path) => {
            let path_str = path.to_string_lossy().to_string();
            tracing::debug!("Local home directory: {}", path_str);
            Ok(path_str)
        }
        Err(e) => {
            tracing::error!("Failed to get home directory: {:?}", e);
            Err(TmaxError::Io("Could not find home directory".to_string()))
        }
    }
}

#[tauri::command]
pub async fn sftp_list_local_dir(path: String) -> Result<Vec<SftpEntry>, TmaxError> {
    tracing::debug!("Listing local directory: {}", path);
    let entries = std::fs::read_dir(&path).map_err(|e| {
        tracing::error!("Local read_dir error: {:?}", e);
        TmaxError::Io(e.to_string())
    })?;
    let mut result = Vec::new();

    for entry in entries {
        if let Ok(entry) = entry {
            let meta = entry.metadata().map_err(|e| TmaxError::Io(e.to_string()))?;
            let name = entry.file_name().to_string_lossy().to_string();
            let modified = meta
                .modified()
                .map(|t| t.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs())
                .unwrap_or(0);

            result.push(SftpEntry {
                name,
                is_dir: meta.is_dir(),
                size: meta.len(),
                modified,
            });
        }
    }

    tracing::debug!("Local directory listed: {} items", result.len());

    result.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(result)
}

#[tauri::command]
pub async fn sftp_list_dir(
    session_id: String,
    path: String,
    state: State<'_, SessionManager>,
) -> Result<Vec<SftpEntry>, TmaxError> {
    tracing::debug!(
        "Listing remote directory: {} for session {}",
        path,
        session_id
    );
    let path = if path.is_empty() { "/" } else { &path };
    if let Some(session) = state.sessions.get(&session_id) {
        tracing::debug!("Opening new channel for SFTP subsystem");
        let sftp = create_sftp_session(&session.handle).await?;

        tracing::debug!("Reading remote directory contents");
        let entries = sftp.read_dir(path).await.map_err(|e| {
            tracing::error!("Failed to read remote dir: {:?}", e);
            TmaxError::Sftp(format!("Failed to read dir: {:?}", e))
        })?;

        let mut result = Vec::new();
        for entry in entries {
            let name = entry.file_name().to_string();
            let is_dir = entry.file_type().is_dir();
            let attrs = entry.metadata();

            result.push(SftpEntry {
                name,
                is_dir,
                size: attrs.size.unwrap_or(0),
                modified: attrs.mtime.unwrap_or(0) as u64,
            });
        }

        tracing::debug!("Remote directory listed: {} items", result.len());
        Ok(result)
    } else {
        tracing::error!("Session not found: {}", session_id);
        Err(TmaxError::Sftp("Session not found".to_string()))
    }
}

#[derive(Serialize, Clone)]
pub struct ProgressPayload {
    pub session_id: String,
    pub filename: String,
    pub bytes: u64,
    pub total: u64,
}

#[tauri::command]
pub async fn sftp_download(
    app: AppHandle,
    session_id: String,
    remote_path: String,
    local_path: String,
    state: State<'_, SessionManager>,
) -> Result<(), TmaxError> {
    if let Some(session) = state.sessions.get(&session_id) {
        let sftp = create_sftp_session(&session.handle).await?;

        let mut remote_file = sftp
            .open(&remote_path)
            .await
            .map_err(|e| TmaxError::Sftp(format!("Failed to open remote file: {:?}", e)))?;

        let metadata = remote_file
            .metadata()
            .await
            .map_err(|e| TmaxError::Sftp(e.to_string()))?;
        let total_size = metadata.size.unwrap_or(0);
        let filename = Path::new(&remote_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let mut local_file = tokio::fs::File::create(local_path)
            .await
            .map_err(|e| TmaxError::Io(format!("Failed to create local file: {:?}", e)))?;

        let mut buffer = vec![0u8; 64 * 1024];
        let mut downloaded = 0u64;
        let mut last_emit = 0u64;

        loop {
            let n = remote_file
                .read(&mut buffer)
                .await
                .map_err(|e| TmaxError::Sftp(format!("Read error: {:?}", e)))?;
            if n == 0 {
                break;
            }
            local_file
                .write_all(&buffer[..n])
                .await
                .map_err(|e| TmaxError::Io(format!("Write error: {:?}", e)))?;

            downloaded += n as u64;

            if downloaded - last_emit > 1024 * 1024 || downloaded == total_size {
                let _ = app.emit(
                    "sftp-progress",
                    ProgressPayload {
                        session_id: session_id.clone(),
                        filename: filename.clone(),
                        bytes: downloaded,
                        total: total_size,
                    },
                );
                last_emit = downloaded;
            }
        }

        Ok(())
    } else {
        Err(TmaxError::Sftp("Session not found".to_string()))
    }
}

#[tauri::command]
pub async fn sftp_upload(
    app: AppHandle,
    session_id: String,
    local_path: String,
    remote_path: String,
    state: State<'_, SessionManager>,
) -> Result<(), TmaxError> {
    if let Some(session) = state.sessions.get(&session_id) {
        let sftp = create_sftp_session(&session.handle).await?;

        let mut local_file = tokio::fs::File::open(&local_path)
            .await
            .map_err(|e| TmaxError::Io(format!("Failed to open local file: {:?}", e)))?;

        let metadata = local_file
            .metadata()
            .await
            .map_err(|e| TmaxError::Io(e.to_string()))?;
        let total_size = metadata.len();
        let filename = Path::new(&local_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let mut remote_file = sftp
            .create(&remote_path)
            .await
            .map_err(|e| TmaxError::Sftp(format!("Failed to create remote file: {:?}", e)))?;

        let mut buffer = vec![0u8; 64 * 1024];
        let mut uploaded = 0u64;
        let mut last_emit = 0u64;

        loop {
            let n = local_file
                .read(&mut buffer)
                .await
                .map_err(|e| TmaxError::Io(format!("Read error: {:?}", e)))?;
            if n == 0 {
                break;
            }
            remote_file
                .write_all(&buffer[..n])
                .await
                .map_err(|e| TmaxError::Sftp(format!("Write error: {:?}", e)))?;

            uploaded += n as u64;

            if uploaded - last_emit > 1024 * 1024 || uploaded == total_size {
                let _ = app.emit(
                    "sftp-progress",
                    ProgressPayload {
                        session_id: session_id.clone(),
                        filename: filename.clone(),
                        bytes: uploaded,
                        total: total_size,
                    },
                );
                last_emit = uploaded;
            }
        }

        Ok(())
    } else {
        Err(TmaxError::Sftp("Session not found".to_string()))
    }
}

#[tauri::command]
pub async fn sftp_transfer_remote(
    app: AppHandle,
    src_session_id: String,
    src_path: String,
    dest_session_id: String,
    dest_path: String,
    state: State<'_, SessionManager>,
) -> Result<(), TmaxError> {
    let src_handle = state
        .sessions
        .get(&src_session_id)
        .ok_or(TmaxError::Sftp("Source session not found".to_string()))?
        .handle
        .clone();

    let dest_handle = state
        .sessions
        .get(&dest_session_id)
        .ok_or(TmaxError::Sftp("Destination session not found".to_string()))?
        .handle
        .clone();

    let src_sftp = create_sftp_session(&src_handle).await?;
    let mut src_file = src_sftp
        .open(&src_path)
        .await
        .map_err(|e| TmaxError::Sftp(format!("Failed to open src file: {:?}", e)))?;

    let metadata = src_file
        .metadata()
        .await
        .map_err(|e| TmaxError::Sftp(e.to_string()))?;
    let total_size = metadata.size.unwrap_or(0);
    let filename = Path::new(&src_path)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let dest_sftp = create_sftp_session(&dest_handle).await?;
    let mut dest_file = dest_sftp
        .create(&dest_path)
        .await
        .map_err(|e| TmaxError::Sftp(format!("Failed to create dest file: {:?}", e)))?;

    let mut buffer = vec![0u8; 64 * 1024];
    let mut transferred = 0u64;
    let mut last_emit = 0u64;

    loop {
        let n = src_file
            .read(&mut buffer)
            .await
            .map_err(|e| TmaxError::Sftp(format!("Read error: {:?}", e)))?;
        if n == 0 {
            break;
        }
        dest_file
            .write_all(&buffer[..n])
            .await
            .map_err(|e| TmaxError::Sftp(format!("Write error: {:?}", e)))?;

        transferred += n as u64;

        if transferred - last_emit > 1024 * 1024 || transferred == total_size {
            let _ = app.emit(
                "sftp-progress",
                ProgressPayload {
                    session_id: src_session_id.clone(),
                    filename: filename.clone(),
                    bytes: transferred,
                    total: total_size,
                },
            );
            last_emit = transferred;
        }
    }

    Ok(())
}
