use crate::domain::error::TmaxError;
use crate::ssh::client::ClientHandler;
use russh::client::Handle;
use russh_sftp::client::SftpSession;

pub async fn create_sftp_session(handle: &Handle<ClientHandler>) -> Result<SftpSession, TmaxError> {
    let channel = handle
        .channel_open_session()
        .await
        .map_err(|e| TmaxError::Sftp(format!("Failed to open channel: {:?}", e)))?;
    channel
        .request_subsystem(true, "sftp")
        .await
        .map_err(|e| TmaxError::Sftp(format!("Failed to request sftp subsystem: {:?}", e)))?;
    SftpSession::new(channel.into_stream())
        .await
        .map_err(|e| TmaxError::Sftp(format!("Failed to create sftp session: {:?}", e)))
}
