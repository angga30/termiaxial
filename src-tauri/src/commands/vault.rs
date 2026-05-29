use crate::domain::error::TmaxError;
use crate::domain::models::{Credential, VaultStatus, Workspace};
use crate::vault::{self, crypto, DbManager, VaultState};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use tauri::State;

#[tauri::command]
pub async fn vault_status(
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<VaultStatus, TmaxError> {
    let salt = db.get_metadata("vault_salt")?;
    let initialized = salt.is_some();
    let locked = state.0.read().await.is_none();

    Ok(VaultStatus {
        initialized,
        locked,
    })
}

#[tauri::command]
pub async fn vault_setup(
    password: String,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), TmaxError> {
    let mut salt_bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt_bytes);
    let salt_b64 = base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD_NO_PAD,
        salt_bytes,
    );

    let key = crypto::derive_key(&password, salt_b64.as_bytes())
        .map_err(|e| TmaxError::Vault(format!("KDF Error: {}", e)))?;

    let verify_plaintext = b"termiaxial_v1_ok";
    let verify_encrypted =
        crypto::encrypt(verify_plaintext, &key).map_err(|e| TmaxError::Vault(format!("Encryption Error: {}", e)))?;

    let verify_b64 =
        base64::Engine::encode(&base64::engine::general_purpose::STANDARD, verify_encrypted);

    db.set_metadata("vault_salt", &salt_b64)?;
    db.set_metadata("vault_verify", &verify_b64)?;

    *state.0.write().await = Some(key);

    Ok(())
}

#[tauri::command]
pub async fn vault_unlock(
    password: String,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), TmaxError> {
    let salt_b64 = db
        .get_metadata("vault_salt")?
        .ok_or(TmaxError::Vault("Vault not initialized".to_string()))?;
    let verify_b64 = db
        .get_metadata("vault_verify")?
        .ok_or(TmaxError::Vault("Vault corrupted".to_string()))?;

    let key = crypto::derive_key(&password, salt_b64.as_bytes())
        .map_err(|e| TmaxError::Vault(format!("KDF Error: {}", e)))?;

    let verify_encrypted =
        base64::Engine::decode(&base64::engine::general_purpose::STANDARD, verify_b64)
            .map_err(|_| TmaxError::Vault("Invalid verification data".to_string()))?;

    let verify_decrypted =
        crypto::decrypt(&verify_encrypted, &key).map_err(|_| TmaxError::Auth("Incorrect Master Password".to_string()))?;

    if verify_decrypted != b"termiaxial_v1_ok" {
        return Err(TmaxError::Auth("Verification failed".to_string()));
    }

    *state.0.write().await = Some(key);

    Ok(())
}

#[tauri::command]
pub async fn vault_lock(state: State<'_, VaultState>) -> Result<(), TmaxError> {
    *state.0.write().await = None;
    Ok(())
}

#[tauri::command]
pub async fn vault_add_credential(
    mut cred: Credential,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), TmaxError> {
    tracing::info!("Adding credential: {:?}", cred);

    let key_lock = state.0.read().await;
    let key = key_lock.as_ref().ok_or(TmaxError::Vault("Vault is locked".to_string()))?;

    if let Some(secret) = cred.secret {
        let encrypted =
            crypto::encrypt(&secret, key).map_err(|e| TmaxError::Vault(format!("Encryption Error: {}", e)))?;
        cred.secret = Some(encrypted);
    }

    db.add_credential(&cred).map_err(|e| {
        tracing::error!("Database error: {}", e);
        TmaxError::from(e)
    })
}

#[tauri::command]
pub async fn vault_delete_credential(
    id: String,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), TmaxError> {
    tracing::info!("Deleting credential: {}", id);

    if state.0.read().await.is_none() {
        return Err(TmaxError::Vault("Vault is locked".to_string()));
    }

    db.delete_credential(&id).map_err(TmaxError::from)
}

#[tauri::command]
pub async fn vault_update_credential(
    mut cred: Credential,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), TmaxError> {
    tracing::info!("Updating credential: {:?}", cred);

    let key_lock = state.0.read().await;
    let key = key_lock.as_ref().ok_or(TmaxError::Vault("Vault is locked".to_string()))?;

    if let Some(secret) = cred.secret {
        let encrypted =
            crypto::encrypt(&secret, key).map_err(|e| TmaxError::Vault(format!("Encryption Error: {}", e)))?;
        cred.secret = Some(encrypted);
    }

    db.update_credential(&cred).map_err(TmaxError::from)
}

#[tauri::command]
pub async fn vault_list_credentials(
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<Vec<Credential>, TmaxError> {
    tracing::info!("Listing credentials");

    let key_lock = state.0.read().await;
    let key = key_lock.as_ref().ok_or(TmaxError::Vault("Vault is locked".to_string()))?;

    let mut creds = db.list_credentials().map_err(|e| {
        tracing::error!("Database error: {}", e);
        TmaxError::from(e)
    })?;

    for cred in creds.iter_mut() {
        if let Some(encrypted) = cred.secret.take() {
            match crypto::decrypt(&encrypted, key) {
                Ok(decrypted) => {
                    cred.secret = Some(decrypted);
                }
                Err(_) => {
                    tracing::error!("Failed to decrypt credential {}", cred.id);
                }
            }
        }
    }

    Ok(creds)
}

#[tauri::command]
pub async fn vault_set_metadata(
    key: String,
    value: String,
    db: State<'_, DbManager>,
) -> Result<(), TmaxError> {
    db.set_metadata(&key, &value).map_err(TmaxError::from)
}

#[tauri::command]
pub async fn vault_get_metadata(
    key: String,
    db: State<'_, DbManager>,
) -> Result<Option<String>, TmaxError> {
    db.get_metadata(&key).map_err(TmaxError::from)
}

#[tauri::command]
pub async fn vault_create_workspace(
    workspace: Workspace,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), TmaxError> {
    if state.0.read().await.is_none() {
        return Err(TmaxError::Vault("Vault is locked".to_string()));
    }

    db.create_workspace(&workspace.id, &workspace.name, &workspace.created_at)
        .map_err(TmaxError::from)
}

#[tauri::command]
pub async fn vault_list_workspaces(
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<Vec<Workspace>, TmaxError> {
    if state.0.read().await.is_none() {
        return Err(TmaxError::Vault("Vault is locked".to_string()));
    }

    let workspaces = db.list_workspaces().map_err(TmaxError::from)?;
    
    Ok(workspaces.into_iter().map(|(id, name, created_at)| Workspace {
        id,
        name,
        created_at,
    }).collect())
}
