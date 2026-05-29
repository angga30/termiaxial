use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Credential {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub host: Option<String>,
    pub user: Option<String>,
    pub secret: Option<Vec<u8>>,
    pub added_at: String,
    pub workspace_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct VaultStatus {
    pub initialized: bool,
    pub locked: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConnectionOptions {
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: Option<String>,
    pub private_key: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TunnelConfig {
    pub id: String,
    pub name: String,
    pub tunnel_type: TunnelType,
    pub local_port: u16,
    pub remote_host: String,
    pub remote_port: u16,
    pub session_id: String,
    pub credential_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum TunnelType {
    Local,
    Remote,
    Dynamic,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Snippet {
    pub id: String,
    pub name: String,
    pub command: String,
    pub description: String,
    pub tags: Vec<String>,
    pub host_id: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CommandHistoryEntry {
    pub id: String,
    pub session_id: String,
    pub command: String,
    pub timestamp: String,
    pub exit_code: Option<i32>,
}
