use crate::domain::models::{Credential, VaultStatus, Workspace};
use crate::vault::{self, crypto, DbManager, VaultState};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use tauri::State;

#[tauri::command]
pub async fn vault_status(
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<VaultStatus, String> {
    let salt = db.get_metadata("vault_salt").map_err(|e| e.to_string())?;
    let initialized = salt.is_some();
    let locked = state.0.read().unwrap().is_none();

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
) -> Result<(), String> {
    // Generate salt
    let mut salt_bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt_bytes);
    let salt_b64 = base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD_NO_PAD,
        salt_bytes,
    );

    // Derive key

    let key = crypto::derive_key(&password, salt_b64.as_bytes())
        .map_err(|e| format!("KDF Error: {}", e))?;

    // Create verification string
    let verify_plaintext = b"termiaxial_v1_ok";
    let verify_encrypted =
        crypto::encrypt(verify_plaintext, &key).map_err(|e| format!("Encryption Error: {}", e))?;

    let verify_b64 =
        base64::Engine::encode(&base64::engine::general_purpose::STANDARD, verify_encrypted);

    // Save to DB
    db.set_metadata("vault_salt", &salt_b64)
        .map_err(|e| e.to_string())?;
    db.set_metadata("vault_verify", &verify_b64)
        .map_err(|e| e.to_string())?;

    // Store key in memory
    *state.0.write().unwrap() = Some(key);

    Ok(())
}

#[tauri::command]
pub async fn vault_unlock(
    password: String,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), String> {
    let salt_b64 = db
        .get_metadata("vault_salt")
        .map_err(|e| e.to_string())?
        .ok_or("Vault not initialized")?;
    let verify_b64 = db
        .get_metadata("vault_verify")
        .map_err(|e| e.to_string())?
        .ok_or("Vault corrupted")?;

    // Derive key
    let key = crypto::derive_key(&password, salt_b64.as_bytes())
        .map_err(|e| format!("KDF Error: {}", e))?;

    // Verify key
    let verify_encrypted =
        base64::Engine::decode(&base64::engine::general_purpose::STANDARD, verify_b64)
            .map_err(|_| "Invalid verification data")?;

    let verify_decrypted =
        crypto::decrypt(&verify_encrypted, &key).map_err(|_| "Incorrect Master Password")?;

    if verify_decrypted != b"termiaxial_v1_ok" {
        return Err("Verification failed".to_string());
    }

    // Store key in memory
    *state.0.write().unwrap() = Some(key);

    Ok(())
}

#[tauri::command]
pub async fn vault_lock(state: State<'_, VaultState>) -> Result<(), String> {
    *state.0.write().unwrap() = None;
    Ok(())
}

#[tauri::command]
pub async fn vault_add_credential(
    mut cred: Credential,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), String> {
    println!("Backend: Adding credential: {:?}", cred);

    let key_lock = state.0.read().unwrap();
    let key = key_lock.as_ref().ok_or("Vault is locked")?;

    if let Some(secret) = cred.secret {
        let encrypted =
            crypto::encrypt(&secret, key).map_err(|e| format!("Encryption Error: {}", e))?;
        cred.secret = Some(encrypted);
    }

    db.add_credential(&cred).map_err(|e| {
        let err_msg = format!("Database error: {}", e);
        eprintln!("{}", err_msg);
        err_msg
    })
}

#[tauri::command]
pub async fn vault_delete_credential(
    id: String,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), String> {
    println!("Backend: Deleting credential: {}", id);

    // Safety check: ensure vault is unlocked (though delete doesn't need the key)
    if state.0.read().unwrap().is_none() {
        return Err("Vault is locked".to_string());
    }

    db.delete_credential(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn vault_update_credential(
    mut cred: Credential,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), String> {
    println!("Backend: Updating credential: {:?}", cred);

    let key_lock = state.0.read().unwrap();
    let key = key_lock.as_ref().ok_or("Vault is locked")?;

    if let Some(secret) = cred.secret {
        let encrypted =
            crypto::encrypt(&secret, key).map_err(|e| format!("Encryption Error: {}", e))?;
        cred.secret = Some(encrypted);
    }

    db.update_credential(&cred).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn vault_list_credentials(
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<Vec<Credential>, String> {
    println!("Backend: Listing credentials");

    let key_lock = state.0.read().unwrap();
    let key = key_lock.as_ref().ok_or("Vault is locked")?;

    let mut creds = db.list_credentials().map_err(|e| {
        let err_msg = format!("Database error: {}", e);
        eprintln!("{}", err_msg);
        err_msg
    })?;

    for cred in creds.iter_mut() {
        if let Some(encrypted) = cred.secret.take() {
            match crypto::decrypt(&encrypted, key) {
                Ok(decrypted) => {
                    cred.secret = Some(decrypted);
                }
                Err(_) => {
                    eprintln!("Failed to decrypt credential {}", cred.id);
                    // Keep secret as None if decryption fails
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
) -> Result<(), String> {
    db.set_metadata(&key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn vault_get_metadata(
    key: String,
    db: State<'_, DbManager>,
) -> Result<Option<String>, String> {
    db.get_metadata(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn vault_create_workspace(
    workspace: Workspace,
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<(), String> {
    // Safety check: ensure vault is unlocked
    if state.0.read().unwrap().is_none() {
        return Err("Vault is locked".to_string());
    }

    db.create_workspace(&workspace.id, &workspace.name, &workspace.created_at)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn vault_list_workspaces(
    db: State<'_, DbManager>,
    state: State<'_, VaultState>,
) -> Result<Vec<Workspace>, String> {
    // Safety check: ensure vault is unlocked
    if state.0.read().unwrap().is_none() {
        return Err("Vault is locked".to_string());
    }

    let workspaces = db.list_workspaces().map_err(|e| e.to_string())?;
    
    Ok(workspaces.into_iter().map(|(id, name, created_at)| Workspace {
        id,
        name,
        created_at,
    }).collect())
}
