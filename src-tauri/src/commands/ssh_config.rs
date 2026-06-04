use crate::domain::error::TmaxError;
use crate::domain::models::Credential;
use crate::vault::{crypto, DbManager, VaultState};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use tauri::State;

const TMAX_MARKER: &str = "# Tmax-managed";

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SshConfigSyncStatus {
    pub config_path: String,
    pub exists: bool,
    pub last_modified: Option<String>,
    pub tmax_entries_count: usize,
}

fn default_ssh_config_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());
    PathBuf::from(home).join(".ssh").join("config")
}

fn read_ssh_config() -> Result<String, TmaxError> {
    let path = default_ssh_config_path();
    if !path.exists() {
        return Ok(String::new());
    }
    std::fs::read_to_string(&path)
        .map_err(|e| TmaxError::Config(format!("Failed to read SSH config: {}", e)))
}

fn write_ssh_config(content: &str) -> Result<(), TmaxError> {
    let path = default_ssh_config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| TmaxError::Config(format!("Failed to create .ssh dir: {}", e)))?;
    }
    std::fs::write(&path, content)
        .map_err(|e| TmaxError::Config(format!("Failed to write SSH config: {}", e)))
}

pub fn write_credential_to_config(
    cred: &crate::domain::models::Credential,
) -> Result<(), TmaxError> {
    let content = read_ssh_config()?;
    let host = cred.host.as_deref().unwrap_or("");
    let user = cred.user.as_deref().unwrap_or("");

    let (hostname, port) = if let Some(idx) = host.rfind(':') {
        let (h, p) = host.split_at(idx);
        (h.to_string(), p[1..].parse::<u16>().ok())
    } else {
        (host.to_string(), None)
    };

    let entry_name = cred.name.clone();
    let mut new_entry = format!("\n{} Host \"{}\"\n", TMAX_MARKER, entry_name);
    if !hostname.is_empty() {
        new_entry.push_str(&format!("    HostName {}\n", hostname));
    }
    if !user.is_empty() {
        new_entry.push_str(&format!("    User {}\n", user));
    }
    if let Some(p) = port {
        if p != 22 {
            new_entry.push_str(&format!("    Port {}\n", p));
        }
    }

    let lines: Vec<&str> = content.lines().collect();
    let mut result = String::new();
    let mut skip = false;

    for line in &lines {
        if line.starts_with(&format!("{} Host ", TMAX_MARKER)) {
            let entry_host = line.split('"').nth(1).unwrap_or("");
            if entry_host == entry_name {
                skip = true;
                continue;
            }
        }
        if skip {
            if line.is_empty()
                || (!line.starts_with("    ")
                    && !line.starts_with('\t')
                    && !line.starts_with(TMAX_MARKER))
            {
                skip = false;
            } else {
                continue;
            }
        }
        result.push_str(line);
        result.push('\n');
    }

    result.push_str(&new_entry);
    write_ssh_config(&result)?;
    tracing::info!("Wrote credential '{}' to SSH config", entry_name);
    Ok(())
}

#[tauri::command]
pub async fn ssh_config_sync_status() -> Result<SshConfigSyncStatus, TmaxError> {
    let path = default_ssh_config_path();
    let exists = path.exists();
    let last_modified = if exists {
        std::fs::metadata(&path)
            .ok()
            .and_then(|m| m.modified().ok())
            .map(|t| format!("{:?}", t))
    } else {
        None
    };

    let content = read_ssh_config()?;
    let tmax_entries_count = content
        .lines()
        .filter(|l| l.starts_with(&format!("{} Host", TMAX_MARKER)))
        .count();

    Ok(SshConfigSyncStatus {
        config_path: path.to_string_lossy().to_string(),
        exists,
        last_modified,
        tmax_entries_count,
    })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConfigChange {
    pub host: String,
    pub host_name: Option<String>,
    pub user: Option<String>,
    pub port: Option<u16>,
    pub change_type: String,
}

#[tauri::command]
pub async fn ssh_config_detect_changes(
    db: State<'_, DbManager>,
) -> Result<Vec<ConfigChange>, TmaxError> {
    tracing::info!("Detecting SSH config changes");

    let config_path = default_ssh_config_path();
    if !config_path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| TmaxError::Config(format!("Failed to read SSH config: {}", e)))?;

    let config_entries = crate::commands::import::parse_ssh_config(&content);

    let vault_creds = db.list_credentials()?;
    let vault_hosts: HashSet<String> = vault_creds.iter().filter_map(|c| c.host.clone()).collect();

    let mut changes = Vec::new();
    for entry in &config_entries {
        let host_key = if let Some(ref hn) = entry.host_name {
            format!("{}:{}", hn, entry.port.unwrap_or(22))
        } else {
            format!("{}:{}", entry.host, entry.port.unwrap_or(22))
        };

        if !vault_hosts.contains(&host_key) {
            changes.push(ConfigChange {
                host: entry.host.clone(),
                host_name: entry.host_name.clone(),
                user: entry.user.clone(),
                port: entry.port,
                change_type: "new".to_string(),
            });
        }
    }

    tracing::info!("Found {} new entries in SSH config", changes.len());
    Ok(changes)
}

#[tauri::command]
pub async fn ssh_config_sync_from_config(
    db: State<'_, DbManager>,
    vault_state: State<'_, VaultState>,
) -> Result<crate::commands::import::ImportResult, TmaxError> {
    tracing::info!("Syncing SSH config changes into vault");

    if vault_state.0.read().await.is_none() {
        return Err(TmaxError::Vault("Vault is locked".to_string()));
    }

    let config_path = default_ssh_config_path();
    if !config_path.exists() {
        return Ok(crate::commands::import::ImportResult {
            imported: 0,
            skipped: 0,
            errors: Vec::new(),
        });
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| TmaxError::Config(format!("Failed to read SSH config: {}", e)))?;

    let config_entries = crate::commands::import::parse_ssh_config(&content);

    let vault_creds = db.list_credentials()?;
    let vault_hosts: HashSet<String> = vault_creds.iter().filter_map(|c| c.host.clone()).collect();

    let key_lock = vault_state.0.read().await;
    let key = key_lock
        .as_ref()
        .ok_or(TmaxError::Vault("Vault is locked".to_string()))?;

    let mut imported = 0usize;
    let mut skipped = 0usize;
    let mut errors = Vec::new();

    for entry in &config_entries {
        let host = entry.host_name.as_ref().unwrap_or(&entry.host);
        let user = entry.user.clone().unwrap_or_default();
        let port = entry.port.unwrap_or(22);
        let host_key = format!("{}:{}", host, port);

        if vault_hosts.contains(&host_key) {
            continue;
        }

        let name = if user.is_empty() {
            entry.host.clone()
        } else {
            format!("{}@{}:{}", user, host, port)
        };

        let secret = if let Some(key_path) = &entry.identity_file {
            Some(key_path.as_bytes().to_vec())
        } else {
            None
        };

        let mut cred = Credential {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            r#type: "ssh".to_string(),
            host: Some(host_key),
            user: Some(user),
            secret,
            added_at: format!(
                "{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
            ),
            workspace_id: None,
        };

        if let Some(secret_bytes) = cred.secret {
            match crypto::encrypt(&secret_bytes, key) {
                Ok(encrypted) => cred.secret = Some(encrypted),
                Err(e) => {
                    errors.push(format!("{}: encryption failed: {}", entry.host, e));
                    skipped += 1;
                    continue;
                }
            }
        }

        match db.add_credential(&cred) {
            Ok(_) => imported += 1,
            Err(e) => {
                errors.push(format!("{}: db error: {}", entry.host, e));
                skipped += 1;
            }
        }
    }

    tracing::info!(
        "Sync from config complete: {} imported, {} skipped",
        imported,
        skipped
    );
    Ok(crate::commands::import::ImportResult {
        imported,
        skipped,
        errors,
    })
}

#[tauri::command]
pub async fn ssh_config_write_credential(
    cred: crate::domain::models::Credential,
) -> Result<(), TmaxError> {
    tracing::info!("Writing credential to SSH config: {}", cred.name);
    write_credential_to_config(&cred)
}
