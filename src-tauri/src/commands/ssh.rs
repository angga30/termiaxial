use crate::domain::error::TmaxError;
use crate::domain::events::{EventBus, SessionEvent};
use crate::domain::models::ConnectionOptions;
use crate::ssh::{SshCommand, SshSession};
use dashmap::DashMap;
use russh::ChannelMsg;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{ipc::Channel, AppHandle, Emitter, Manager, State};
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
    app: AppHandle,
) -> Result<(), TmaxError> {
    tracing::debug!(
        "IPC Command: connect_ssh id={} to {}",
        session_id,
        options.host
    );
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

    let event_bus = app.state::<EventBus>();
    event_bus.publish(SessionEvent::Connected {
        session_id: session_id.clone(),
        host: options.host.clone(),
    });
    tracing::debug!("Published Connected event for session {}", session_id);

    let sid_for_task = session_id.clone();
    // Keep a weak reference to detect if this session has been replaced
    let handle_for_check = Arc::downgrade(&handle);
    tokio::spawn(async move {
        tracing::debug!("Starting background loop for session {}", sid_for_task);
        loop {
            select! {
                msg = channel.wait() => {
                    match msg {
                        Some(ChannelMsg::Data { data }) => {
                            let data_vec = data.to_vec();
                            if let Some(rec_mgr) = app.try_state::<crate::commands::recording::RecordingManager>() {
                                crate::commands::recording::record_data(rec_mgr.inner(), &sid_for_task, &data_vec);
                            }
                            if let Err(e) = on_data.send(data_vec) {
                                tracing::error!("Channel send error: {}", e);
                                break;
                            }
                        }
                        Some(ChannelMsg::ExtendedData { data, .. }) => {
                            let data_vec = data.to_vec();
                            if let Some(rec_mgr) = app.try_state::<crate::commands::recording::RecordingManager>() {
                                crate::commands::recording::record_data(rec_mgr.inner(), &sid_for_task, &data_vec);
                            }
                            if let Err(e) = on_data.send(data_vec) {
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
                        tracing::info!("Connection closed detected by keep-alive check");
                        break;
                    }
                    tracing::trace!("Keep-alive tick: connection still alive");
                }
            }
        }
        tracing::debug!("Background loop terminated for session {}", sid_for_task);
        if let Some(event_bus) = app.try_state::<EventBus>() {
            event_bus.publish(SessionEvent::Disconnected {
                session_id: sid_for_task.clone(),
                reason: "Connection closed".to_string(),
            });
            tracing::debug!("Published Disconnected event for session {}", sid_for_task);
        }
        if let Some(manager) = app.try_state::<SessionManager>() {
            // Only remove if this specific session (by handle pointer) is still in the map.
            // If connect_ssh was called again for the same session_id, the map already holds
            // a newer session — removing it would orphan the live connection.
            let still_owns = manager
                .sessions
                .get(&sid_for_task)
                .map(|s| {
                    Arc::ptr_eq(
                        &s.handle,
                        &handle_for_check
                            .upgrade()
                            .unwrap_or_else(|| s.handle.clone()),
                    )
                })
                .unwrap_or(false);
            if !still_owns {
                tracing::info!(
                    "Session {} was replaced; skipping cleanup removal",
                    sid_for_task
                );
            } else {
                manager.sessions.remove(&sid_for_task);
                tracing::info!("Session {} cleaned up from session map", sid_for_task);
            }
        }
        let _ = app.emit("ssh-disconnected", &sid_for_task);
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
