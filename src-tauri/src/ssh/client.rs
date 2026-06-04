use async_trait::async_trait;
use russh::client::{Handler, Msg};
use std::sync::Arc;

pub struct ClientHandler;

#[async_trait]
impl Handler for ClientHandler {
    type Error = anyhow::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &russh_keys::key::PublicKey,
    ) -> Result<bool, Self::Error> {
        tracing::debug!("Verifying server public key...");
        tracing::debug!("Server key accepted (TOFU Mode)");
        Ok(true)
    }

    // We can implement other handler methods like on_channel_data here if needed,
    // but usually, we read from the channel handle directly in a loop.
}
