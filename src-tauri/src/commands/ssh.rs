use crate::domain::models::ConnectionOptions;
use crate::ssh::{SshCommand, SshSession};
use anyhow::Result;
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
) -> Result<(), String> {
    println!(
        "[SSH DEBUG] IPC Command: connect_ssh id={} to {}",
        session_id, options.host
    );
    let addr = format!("{}:{}", options.host, options.port);
    let (session, mut channel, mut cmd_rx) =
        SshSession::connect(addr, options.user, options.password, options.private_key)
            .await
            .map_err(|e| {
                println!("[SSH DEBUG] Connection Error: {}", e);
                e.to_string()
            })?;

    let handle = session.handle.clone();
    state.sessions.insert(session_id.clone(), session);
    println!("[SSH DEBUG] Session registered with ID: {}", session_id);

    // Spawn a task to manage the session
    let sid_for_task = session_id.clone();
    tokio::spawn(async move {
        println!(
            "[SSH DEBUG] Starting background loop for session {}",
            sid_for_task
        );
        loop {
            select! {
                // Handle incoming SSH data
                msg = channel.wait() => {
                    match msg {
                        Some(ChannelMsg::Data { data }) => {
                            if let Err(e) = on_data.send(data.to_vec()) {
                                println!("[SSH DEBUG] Channel send error: {}", e);
                                break;
                            }
                        }
                        Some(ChannelMsg::ExtendedData { data, .. }) => {
                            if let Err(e) = on_data.send(data.to_vec()) {
                                println!("[SSH DEBUG] Channel ext-send error: {}", e);
                                break;
                            }
                        }
                        Some(ChannelMsg::Eof) | Some(ChannelMsg::Close { .. }) | None => {
                            println!("[SSH DEBUG] Channel closed or EOF received.");
                            break;
                        }
                        _ => {}
                    }
                }
                // Handle local commands
                cmd = cmd_rx.recv() => {
                    match cmd {
                        Some(SshCommand::Write(data)) => {
                            println!("[SSH DEBUG] Writing {} bytes to SSH", data.len());
                            if let Err(e) = channel.data(data.as_slice()).await {
                                println!("[SSH DEBUG] Write Error: {:?}", e);
                                break;
                            }
                        }
                        Some(SshCommand::Resize(cols, rows)) => {
                            println!("[SSH DEBUG] Resizing PTY to {}x{}", cols, rows);
                            if let Err(e) = channel.window_change(cols, rows, 0, 0).await {
                                println!("[SSH DEBUG] Resize Error: {:?}", e);
                            }
                        }
                        Some(SshCommand::Disconnect) | None => {
                            println!("[SSH DEBUG] Disconnect command received.");
                            break;
                        }
                    }
                }
                // Periodic check
                _ = tokio::time::sleep(std::time::Duration::from_secs(30)) => {
                    if handle.is_closed() {
                        println!("[SSH DEBUG] Connection closed detected by keep-alive loop.");
                        break;
                    }
                }
            }
        }
        println!(
            "[SSH DEBUG] Background loop terminated for session {}",
            sid_for_task
        );
    });

    Ok(())
}

#[tauri::command]
pub async fn disconnect_ssh(
    session_id: String,
    state: State<'_, SessionManager>,
) -> Result<(), String> {
    println!(
        "[SSH DEBUG] IPC Command: disconnect_ssh for session {}",
        session_id
    );
    if let Some((_, session)) = state.sessions.remove(&session_id) {
        let _ = session.cmd_tx.send(SshCommand::Disconnect);
        println!(
            "[SSH DEBUG] Disconnect signal sent to session {}",
            session_id
        );
        Ok(())
    } else {
        Err("Session not found".to_string())
    }
}

#[tauri::command]
pub async fn write_ssh(
    session_id: String,
    data: Vec<u8>,
    state: State<'_, SessionManager>,
) -> Result<(), String> {
    if let Some(session) = state.sessions.get(&session_id) {
        session
            .cmd_tx
            .send(SshCommand::Write(data))
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Session not found".to_string())
    }
}

#[tauri::command]
pub async fn resize_pty(
    session_id: String,
    cols: u32,
    rows: u32,
    state: State<'_, SessionManager>,
) -> Result<(), String> {
    if let Some(session) = state.sessions.get(&session_id) {
        session
            .cmd_tx
            .send(SshCommand::Resize(cols, rows))
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Session not found".to_string())
    }
}
