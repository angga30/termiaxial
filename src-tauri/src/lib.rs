mod commands;
mod domain;
mod infrastructure;
mod ssh;
mod vault;

use crate::commands::ai::ai_analyze;
use crate::commands::sftp::{
    sftp_download, sftp_get_home_dir, sftp_list_dir, sftp_list_local_dir, sftp_transfer_remote,
    sftp_upload,
};
use crate::commands::ssh::{connect_ssh, disconnect_ssh, resize_pty, write_ssh, SessionManager};
use crate::commands::vault::{
    vault_add_credential, vault_create_workspace, vault_delete_credential, vault_get_metadata, vault_list_credentials,
    vault_list_workspaces, vault_lock, vault_set_metadata, vault_setup, vault_status, vault_unlock,
    vault_update_credential,
};
use crate::vault::{DbManager, VaultState};
use dashmap::DashMap;
use std::sync::RwLock;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SessionManager {
            sessions: DashMap::new(),
        })
        .manage(VaultState(RwLock::new(None)))
        .setup(|app| {
            crate::infrastructure::logging::init();
            let app_data_dir = app.path().app_data_dir()?;
            if !app_data_dir.exists() {
                std::fs::create_dir_all(&app_data_dir)?;
            }
            let db_path = app_data_dir.join("database.sqlite");
            let db_manager = DbManager::new(db_path).map_err(|e| e.to_string())?;

            app.manage(db_manager);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            connect_ssh,
            disconnect_ssh,
            write_ssh,
            resize_pty,
            sftp_list_dir,
            sftp_list_local_dir,
            sftp_get_home_dir,
            sftp_download,
            sftp_upload,
            sftp_transfer_remote,
            vault_add_credential,
            vault_create_workspace,
            vault_delete_credential,
            vault_update_credential,
            vault_list_credentials,
            vault_list_workspaces,
            vault_set_metadata,
            vault_get_metadata,
            vault_status,
            vault_setup,
            vault_unlock,
            vault_lock,
            ai_analyze
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
