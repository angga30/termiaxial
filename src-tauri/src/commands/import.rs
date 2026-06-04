use crate::domain::error::TmaxError;
use crate::domain::models::Credential;
use crate::vault::{crypto, DbManager, VaultState};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SshConfigEntry {
    pub host: String,
    pub host_name: Option<String>,
    pub user: Option<String>,
    pub port: Option<u16>,
    pub identity_file: Option<String>,
    pub proxy_command: Option<String>,
    pub proxy_jump: Option<String>,
    pub forward_agent: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SshKeyInfo {
    pub name: String,
    pub path: String,
    pub public_key_path: Option<String>,
    pub key_type: Option<String>,
    pub fingerprint: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImportSource {
    pub source_type: String,
    pub available: bool,
    pub entry_count: Option<usize>,
    pub error: Option<String>,
}

fn default_ssh_config_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());
    PathBuf::from(home).join(".ssh").join("config")
}

fn default_ssh_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());
    PathBuf::from(home).join(".ssh")
}

pub fn parse_ssh_config(content: &str) -> Vec<SshConfigEntry> {
    let mut entries: Vec<SshConfigEntry> = Vec::new();
    let mut current: Option<SshConfigEntry> = None;

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        let parts: Vec<&str> = line.splitn(2, char::is_whitespace).collect();
        if parts.len() < 2 {
            continue;
        }

        let key = parts[0].to_lowercase();
        let value = parts[1].trim().to_string();

        match key.as_str() {
            "host" => {
                if let Some(entry) = current.take() {
                    entries.push(entry);
                }
                if !value.contains('*') && !value.contains('?') {
                    current = Some(SshConfigEntry {
                        host: value,
                        host_name: None,
                        user: None,
                        port: None,
                        identity_file: None,
                        proxy_command: None,
                        proxy_jump: None,
                        forward_agent: None,
                    });
                }
            }
            "hostname" => {
                if let Some(ref mut entry) = current {
                    entry.host_name = Some(value);
                }
            }
            "user" => {
                if let Some(ref mut entry) = current {
                    entry.user = Some(value);
                }
            }
            "port" => {
                if let Some(ref mut entry) = current {
                    entry.port = value.parse().ok();
                }
            }
            "identityfile" => {
                if let Some(ref mut entry) = current {
                    let expanded = if value.starts_with("~/") {
                        let home = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());
                        value.replacen("~", &home, 1)
                    } else {
                        value
                    };
                    entry.identity_file = Some(expanded);
                }
            }
            "proxycommand" => {
                if let Some(ref mut entry) = current {
                    entry.proxy_command = Some(value);
                }
            }
            "proxyjump" => {
                if let Some(ref mut entry) = current {
                    entry.proxy_jump = Some(value);
                }
            }
            "forwardagent" => {
                if let Some(ref mut entry) = current {
                    entry.forward_agent = match value.to_lowercase().as_str() {
                        "yes" | "true" => Some(true),
                        "no" | "false" => Some(false),
                        _ => None,
                    };
                }
            }
            _ => {}
        }
    }

    if let Some(entry) = current.take() {
        entries.push(entry);
    }

    entries
}

pub fn scan_ssh_keys() -> Vec<SshKeyInfo> {
    let ssh_dir = default_ssh_dir();
    let mut keys = Vec::new();

    if let Ok(entries) = std::fs::read_dir(&ssh_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            if name.ends_with(".pub")
                || name == "config"
                || name == "known_hosts"
                || name == "known_hosts.old"
                || name == "authorized_keys"
                || name.starts_with('.')
                || path.is_dir()
            {
                continue;
            }

            let mut key_info = SshKeyInfo {
                name: name.clone(),
                path: path.to_string_lossy().to_string(),
                public_key_path: None,
                key_type: None,
                fingerprint: None,
            };

            let pub_path = path.with_extension("pub");
            if pub_path.exists() {
                key_info.public_key_path = Some(pub_path.to_string_lossy().to_string());

                if let Ok(pub_content) = std::fs::read_to_string(&pub_path) {
                    let parts: Vec<&str> = pub_content.split_whitespace().collect();
                    if !parts.is_empty() {
                        key_info.key_type = Some(parts[0].to_string());
                    }
                }
            }

            keys.push(key_info);
        }
    }

    keys
}

pub fn detect_import_sources() -> Vec<ImportSource> {
    let mut sources = Vec::new();

    let config_path = default_ssh_config_path();
    if config_path.exists() {
        match std::fs::read_to_string(&config_path) {
            Ok(content) => {
                let entries = parse_ssh_config(&content);
                sources.push(ImportSource {
                    source_type: "ssh_config".to_string(),
                    available: true,
                    entry_count: Some(entries.len()),
                    error: None,
                });
            }
            Err(e) => {
                sources.push(ImportSource {
                    source_type: "ssh_config".to_string(),
                    available: false,
                    entry_count: None,
                    error: Some(e.to_string()),
                });
            }
        }
    } else {
        sources.push(ImportSource {
            source_type: "ssh_config".to_string(),
            available: false,
            entry_count: None,
            error: Some("No ~/.ssh/config found".to_string()),
        });
    }

    let ssh_dir = default_ssh_dir();
    let key_count = if ssh_dir.exists() {
        scan_ssh_keys().len()
    } else {
        0
    };
    sources.push(ImportSource {
        source_type: "ssh_keys".to_string(),
        available: ssh_dir.exists() && key_count > 0,
        entry_count: Some(key_count),
        error: None,
    });

    sources
}

pub fn parse_termius_json(content: &str) -> Result<Vec<SshConfigEntry>, TmaxError> {
    #[derive(Deserialize, Debug)]
    struct TermiusExport {
        #[serde(default)]
        groups: Vec<TermiusGroup>,
        #[serde(default)]
        hosts: Vec<TermiusHost>,
    }

    #[derive(Deserialize, Debug)]
    struct TermiusGroup {
        #[serde(default)]
        id: Option<String>,
        #[serde(default)]
        name: Option<String>,
    }

    #[derive(Deserialize, Debug)]
    struct TermiusHost {
        #[serde(default)]
        id: Option<String>,
        #[serde(default)]
        label: Option<String>,
        #[serde(default)]
        hostname: Option<String>,
        #[serde(default)]
        username: Option<String>,
        #[serde(default)]
        port: Option<u16>,
        #[serde(default)]
        group_id: Option<String>,
    }

    let export: TermiusExport = serde_json::from_str(content)
        .map_err(|e| TmaxError::Config(format!("Invalid Termius JSON: {}", e)))?;

    let entries: Vec<SshConfigEntry> = export
        .hosts
        .into_iter()
        .map(|h| SshConfigEntry {
            host: h.label.unwrap_or_else(|| "unnamed".to_string()),
            host_name: h.hostname,
            user: h.username,
            port: h.port,
            identity_file: None,
            proxy_command: None,
            proxy_jump: None,
            forward_agent: None,
        })
        .collect();

    Ok(entries)
}

#[tauri::command]
pub async fn import_detect_sources() -> Result<Vec<ImportSource>, TmaxError> {
    tracing::info!("Detecting import sources");
    Ok(detect_import_sources())
}

#[tauri::command]
pub async fn import_ssh_config() -> Result<Vec<SshConfigEntry>, TmaxError> {
    tracing::info!("Importing from SSH config");
    let config_path = default_ssh_config_path();
    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| TmaxError::Config(format!("Failed to read SSH config: {}", e)))?;
    let entries = parse_ssh_config(&content);
    tracing::info!("Found {} entries in SSH config", entries.len());
    Ok(entries)
}

#[tauri::command]
pub async fn import_keys() -> Result<Vec<SshKeyInfo>, TmaxError> {
    tracing::info!("Scanning SSH keys");
    let keys = scan_ssh_keys();
    tracing::info!("Found {} SSH keys", keys.len());
    Ok(keys)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImportSelection {
    pub ssh_config_entries: Vec<SshConfigEntry>,
    pub import_keys: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImportResult {
    pub imported: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
}

#[tauri::command]
pub async fn import_selected(
    selection: ImportSelection,
    db: State<'_, DbManager>,
    vault_state: State<'_, VaultState>,
) -> Result<ImportResult, TmaxError> {
    tracing::info!(
        "Starting import of {} SSH config entries",
        selection.ssh_config_entries.len()
    );

    if vault_state.0.read().await.is_none() {
        return Err(TmaxError::Vault("Vault is locked".to_string()));
    }

    let mut imported = 0usize;
    let mut skipped = 0usize;
    let mut errors = Vec::new();
    let key_lock = vault_state.0.read().await;
    let key = key_lock
        .as_ref()
        .ok_or(TmaxError::Vault("Vault is locked".to_string()))?;

    for entry in &selection.ssh_config_entries {
        let host = entry.host_name.as_ref().unwrap_or(&entry.host);
        let user = entry.user.clone().unwrap_or_default();
        let port = entry.port.unwrap_or(22);
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
            host: Some(format!("{}:{}", host, port)),
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
        "Import complete: {} imported, {} skipped",
        imported,
        skipped
    );
    Ok(ImportResult {
        imported,
        skipped,
        errors,
    })
}

#[tauri::command]
pub async fn import_termius(json_content: String) -> Result<Vec<SshConfigEntry>, TmaxError> {
    tracing::info!("Importing from Termius JSON");
    let entries = parse_termius_json(&json_content)?;
    tracing::info!("Found {} entries in Termius export", entries.len());
    Ok(entries)
}
