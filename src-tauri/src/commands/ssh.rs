use crate::domain::error::TmaxError;
use crate::domain::models::ConnectionOptions;
use crate::ssh::{SshCommand, SshSession};
use dashmap::DashMap;
use russh::ChannelMsg;
use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};
use tokio::select;
use uuid::Uuid;

pub struct SessionManager {
    pub sessions: DashMap<String, SshSession>,
}

#[tauri::command]
pub async fn connect_ssh(
    session_id: String,
    options: ConnectionOptions,
    on_data: Channel<Vec<u8>>,
    state: State<'_, SessionManager>,
) -> Result<(), TmaxError> {
    tracing::debug!("IPC Command: connect_ssh id={} to {}", session_id, options.host);
    let addr = format!("{}:{}", options.host, options.port);
    let (session, mut channel, mut cmd_rx) =
        SshSession::connect(addr, options.user, options.password, options.private_key)
            .await
            .map_err(|e| {
                tracing::error!("Connection error: {}", e);
                TmaxError::Ssh(e.to_string())
            })?;

    let handle = session.handle.clone();
    state.sessions.insert(session_id.clone(), session);
    tracing::info!("Session registered with ID: {}", session_id);

    let sid_for_task = session_id.clone();
    tokio::spawn(async move {
        tracing::debug!("Starting background loop for session {}", sid_for_task);
        loop {
            select! {
                msg = channel.wait() => {
                    match msg {
                        Some(ChannelMsg::Data { data }) => {
                            if let Err(e) = on_data.send(data.to_vec()) {
                                tracing::error!("Channel send error: {}", e);
                                break;
                            }
                        }
                        Some(ChannelMsg::ExtendedData { data, .. }) => {
                            if let Err(e) = on_data.send(data.to_vec()) {
                                tracing::error!("Channel ext-send error: {}", e);
                                break;
                            }
                        }
                        Some(ChannelMsg::Eof) | Some(ChannelMsg::Close { .. }) | None => {
                            tracing::debug!("Channel closed or EOF received");
                            break;
                        }
                        _ => {}
                    }
                }
                cmd = cmd_rx.recv() => {
                    match cmd {
                        Some(SshCommand::Write(data)) => {
                            tracing::debug!("Writing {} bytes to SSH", data.len());
                            if let Err(e) = channel.data(data.as_slice()).await {
                                tracing::error!("Write error: {:?}", e);
                                break;
                            }
                        }
                        Some(SshCommand::Resize(cols, rows)) => {
                            tracing::debug!("Resizing PTY to {}x{}", cols, rows);
                            if let Err(e) = channel.window_change(cols, rows, 0, 0).await {
                                tracing::error!("Resize error: {:?}", e);
                            }
                        }
                        Some(SshCommand::Disconnect) | None => {
                            tracing::debug!("Disconnect command received");
                            break;
                        }
                    }
                }
                _ = tokio::time::sleep(std::time::Duration::from_secs(30)) => {
                    if handle.is_closed() {
                        tracing::debug!("Connection closed detected by keep-alive loop");
                        break;
                    }
                }
            }
        }
        tracing::debug!("Background loop terminated for session {}", sid_for_task);
    });

    Ok(())
}

#[tauri::command]
pub async fn disconnect_ssh(
    session_id: String,
    state: State<'_, SessionManager>,
) -> Result<(), TmaxError> {
    tracing::debug!("IPC Command: disconnect_ssh for session {}", session_id);
    if let Some((_, session)) = state.sessions.remove(&session_id) {
        let _ = session.cmd_tx.send(SshCommand::Disconnect);
    tracing::debug!("Disconnect signal sent to session {}", session_id);
        Ok(())
    } else {
        Err(TmaxError::Ssh("Session not found".to_string()))
    }
}

#[tauri::command]
pub async fn write_ssh(
    session_id: String,
    data: Vec<u8>,
    state: State<'_, SessionManager>,
) -> Result<(), TmaxError> {
    if let Some(session) = state.sessions.get(&session_id) {
        session
            .cmd_tx
            .send(SshCommand::Write(data))
            .map_err(|e| TmaxError::Ssh(e.to_string()))?;
        Ok(())
    } else {
        Err(TmaxError::Ssh("Session not found".to_string()))
    }
}

#[tauri::command]
pub async fn resize_pty(
    session_id: String,
    cols: u32,
    rows: u32,
    state: State<'_, SessionManager>,
) -> Result<(), TmaxError> {
    if let Some(session) = state.sessions.get(&session_id) {
        session
            .cmd_tx
            .send(SshCommand::Resize(cols, rows))
            .map_err(|e| TmaxError::Ssh(e.to_string()))?;
        Ok(())
    } else {
        Err(TmaxError::Ssh("Session not found".to_string()))
    }
}
