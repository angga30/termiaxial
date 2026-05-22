use crate::ssh::client::ClientHandler;
use anyhow::Result;
use russh::{client, ChannelId};
use std::sync::Arc;
use std::time::Duration;
use tokio::net::ToSocketAddrs;
use tokio::sync::mpsc;

pub enum SshCommand {
    Write(Vec<u8>),
    Resize(u32, u32),
    Disconnect,
}

pub struct SshSession {
    pub cmd_tx: mpsc::UnboundedSender<SshCommand>,
    pub handle: Arc<client::Handle<ClientHandler>>,
}

impl SshSession {
    pub async fn connect<A: ToSocketAddrs>(
        addr: A,
        user: String,
        password: Option<String>,
        private_key: Option<String>,
    ) -> Result<(
        Self,
        russh::Channel<client::Msg>,
        mpsc::UnboundedReceiver<SshCommand>,
    )> {
        println!("[SSH DEBUG] Connecting to server...");
        let config = client::Config {
            ..Default::default()
        };
        let config = Arc::new(config);
        let handler = ClientHandler;

        let mut handle = client::connect(config, addr, handler).await?;
        println!("[SSH DEBUG] TCP Connection established. Starting authentication...");

        if let Some(pk) = private_key {
            println!(
                "[SSH DEBUG] Authenticating with Public Key for user: {}",
                user
            );
            // Trim the key to avoid whitespace issues
            let trimmed_pk = pk.trim();

            let key = match russh_keys::decode_secret_key(trimmed_pk, None) {
                Ok(k) => k,
                Err(e) => {
                    println!("[SSH DEBUG] Key Decoding Error: {:?}", e);
                    return Err(anyhow::anyhow!("Could not decode private key: {:?}", e));
                }
            };

            // Log key fingerprint for verification
            if let Ok(pubkey) = key.clone_public_key() {
                println!("[SSH DEBUG] Key Fingerprint: {}", pubkey.fingerprint());
            }

            let key_pair = Arc::new(key);

            if !handle.authenticate_publickey(user, key_pair).await? {
                println!("[SSH DEBUG] Public key authentication REJECTED");
                return Err(anyhow::anyhow!("Public key authentication failed"));
            }
        } else if let Some(pass) = password {
            println!(
                "[SSH DEBUG] Authenticating with Password for user: {}",
                user
            );
            if !handle.authenticate_password(user, pass).await? {
                println!("[SSH DEBUG] Password authentication REJECTED");
                return Err(anyhow::anyhow!("Password authentication failed"));
            }
        } else {
            return Err(anyhow::anyhow!("No authentication method provided"));
        }

        println!("[SSH DEBUG] Authentication successful. Opening session channel...");
        let channel = handle.channel_open_session().await?;

        println!("[SSH DEBUG] Requesting PTY (xterm-256color)...");
        channel
            .request_pty(true, "xterm-256color", 80, 24, 0, 0, &[])
            .await?;

        println!("[SSH DEBUG] Requesting Shell...");
        channel.request_shell(true).await?;

        let (cmd_tx, cmd_rx) = mpsc::unbounded_channel::<SshCommand>();
        let handle = Arc::new(handle);

        println!("[SSH DEBUG] SSH Session fully initialized.");
        Ok((
            Self {
                cmd_tx,
                handle: handle.clone(),
            },
            channel,
            cmd_rx,
        ))
    }
}
