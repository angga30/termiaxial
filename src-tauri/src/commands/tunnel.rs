use crate::domain::error::TmaxError;
use crate::domain::models::TunnelConfig;
use crate::commands::ssh::SessionManager;
use dashmap::DashMap;
use russh::ChannelMsg;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TunnelInfo {
    pub id: String,
    pub name: String,
    pub tunnel_type: String,
    pub local_port: u16,
    pub remote_host: String,
    pub remote_port: u16,
    pub session_id: String,
    pub active: bool,
}

struct TunnelState {
    info: TunnelInfo,
    cancel: tokio::sync::watch::Sender<bool>,
}

pub struct TunnelManager {
    pub tunnels: DashMap<String, Arc<Mutex<TunnelState>>>,
}

impl TunnelManager {
    pub fn new() -> Self {
        Self {
            tunnels: DashMap::new(),
        }
    }
}

async fn forward_connection(
    mut channel: russh::Channel<russh::client::Msg>,
    mut tcp_stream: tokio::net::TcpStream,
) {
    let mut tcp_buf = [0u8; 8192];
    loop {
        tokio::select! {
            msg = channel.wait() => {
                match msg {
                    Some(ChannelMsg::Data { data }) => {
                        if tcp_stream.write_all(&data).await.is_err() {
                            break;
                        }
                    }
                    Some(ChannelMsg::Eof) | Some(ChannelMsg::Close { .. }) | None => break,
                    _ => {}
                }
            }
            result = tcp_stream.read(&mut tcp_buf) => {
                match result {
                    Ok(0) => break,
                    Ok(n) => {
                        if channel.data(&tcp_buf[..n]).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
        }
    }
}

use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tauri::command]
pub async fn create_tunnel(
    config: TunnelConfig,
    state: State<'_, SessionManager>,
    tunnel_mgr: State<'_, TunnelManager>,
) -> Result<TunnelInfo, TmaxError> {
    let session_id = config.session_id.clone();
    let tunnel_id = config.id.clone();

    tracing::info!(
        "Creating local tunnel: localhost:{} -> {}:{} on session {}",
        config.local_port, config.remote_host, config.remote_port, session_id
    );

    let session = state
        .sessions
        .get(&session_id)
        .ok_or_else(|| TmaxError::Ssh("Session not found".to_string()))?;

    let handle = session.handle.clone();

    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", config.local_port))
        .await
        .map_err(|e| {
            TmaxError::Ssh(format!("Failed to bind local port {}: {}", config.local_port, e))
        })?;

    let actual_local_port = listener
        .local_addr()
        .map_err(|e| TmaxError::Ssh(format!("Failed to get local addr: {}", e)))?
        .port();

    let (cancel_tx, mut cancel_rx) = tokio::sync::watch::channel(false);

    let info = TunnelInfo {
        id: tunnel_id.clone(),
        name: config.name.clone(),
        tunnel_type: "local".to_string(),
        local_port: actual_local_port,
        remote_host: config.remote_host.clone(),
        remote_port: config.remote_port,
        session_id: session_id.clone(),
        active: true,
    };

    let remote_host = config.remote_host.clone();
    let remote_port = config.remote_port;
    let tid = tunnel_id.clone();

    tokio::spawn(async move {
        loop {
            tokio::select! {
                accept_result = listener.accept() => {
                    match accept_result {
                        Ok((tcp_stream, _addr)) => {
                            tracing::debug!("Tunnel {}: new connection", tid);
                            match handle
                                .channel_open_direct_tcpip(
                                    &remote_host,
                                    remote_port as u32,
                                    "127.0.0.1",
                                    actual_local_port as u32,
                                )
                                .await
                            {
                                Ok(channel) => {
                                    tokio::spawn(forward_connection(channel, tcp_stream));
                                }
                                Err(e) => {
                                    tracing::error!(
                                        "Tunnel {}: failed to open direct-tcpip: {:?}",
                                        tid, e
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            tracing::error!("Tunnel {}: accept error: {}", tid, e);
                        }
                    }
                }
                _ = cancel_rx.changed() => {
                    if *cancel_rx.borrow() {
                        tracing::info!("Tunnel {}: cancelled", tid);
                        break;
                    }
                }
            }
        }
    });

    let tunnel_state = TunnelState {
        info: info.clone(),
        cancel: cancel_tx,
    };
    tunnel_mgr
        .tunnels
        .insert(tunnel_id, Arc::new(Mutex::new(tunnel_state)));

    tracing::info!(
        "Local tunnel created: localhost:{} -> {}:{}",
        actual_local_port,
        config.remote_host,
        config.remote_port
    );
    Ok(info)
}

#[tauri::command]
pub async fn close_tunnel(
    tunnel_id: String,
    tunnel_mgr: State<'_, TunnelManager>,
) -> Result<(), TmaxError> {
    tracing::info!("Closing tunnel: {}", tunnel_id);
    if let Some((_, state)) = tunnel_mgr.tunnels.remove(&tunnel_id) {
        let state = state.lock().await;
        let _ = state.cancel.send(true);
        Ok(())
    } else {
        Err(TmaxError::Ssh("Tunnel not found".to_string()))
    }
}

#[tauri::command]
pub async fn list_tunnels(
    tunnel_mgr: State<'_, TunnelManager>,
) -> Result<Vec<TunnelInfo>, TmaxError> {
    let mut result = Vec::new();
    for entry in tunnel_mgr.tunnels.iter() {
        let state = entry.value().lock().await;
        result.push(state.info.clone());
    }
    Ok(result)
}
