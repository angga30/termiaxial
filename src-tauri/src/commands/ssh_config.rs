use crate::domain::error::TmaxError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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

#[tauri::command]
pub async fn ssh_config_write_credential(
    cred: crate::domain::models::Credential,
) -> Result<(), TmaxError> {
    tracing::info!("Writing credential to SSH config: {}", cred.name);
    write_credential_to_config(&cred)
}
