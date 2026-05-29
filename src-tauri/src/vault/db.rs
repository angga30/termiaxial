use crate::domain::models::Credential;
use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbManager {
    pub conn: Mutex<Connection>, // std::sync::Mutex required: rusqlite::Connection is !Send, so tokio::sync::Mutex won't compile
}

impl DbManager {
    pub fn new(path: PathBuf) -> Result<Self> {
        let conn = Connection::open(path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        let manager = Self {
            conn: Mutex::new(conn),
        };
        manager.init_tables()?;
        manager.run_migrations()?;
        Ok(manager)
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS credentials (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                host TEXT,
                user TEXT,
                secret BLOB,
                added_at TEXT NOT NULL,
                workspace_id TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS vault_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )?;

        Ok(())
    }

    fn run_migrations(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS _migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )",
            [],
        )?;

        let current_version: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM _migrations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let migrations: Vec<(i32, &str)> = vec![
            (1, "ALTER TABLE credentials ADD COLUMN workspace_id TEXT"),
        ];

        for (version, sql) in migrations {
            if version > current_version {
                conn.execute(sql, [])?;
                conn.execute(
                    "INSERT INTO _migrations (version, applied_at) VALUES (?1, datetime('now'))",
                    params![version],
                )?;
                tracing::info!("Applied migration v{}", version);
            }
        }

        Ok(())
    }

    pub fn add_credential(&self, cred: &Credential) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO credentials (id, name, type, host, user, secret, added_at, workspace_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                cred.id,
                cred.name,
                cred.r#type,
                cred.host,
                cred.user,
                cred.secret,
                cred.added_at,
                cred.workspace_id
            ],
        )?;
        Ok(())
    }

    pub fn list_credentials(&self) -> Result<Vec<Credential>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT id, name, type, host, user, secret, added_at, workspace_id FROM credentials")?;
        let cred_iter = stmt.query_map([], |row| {
            Ok(Credential {
                id: row.get(0)?,
                name: row.get(1)?,
                r#type: row.get(2)?,
                host: row.get(3)?,
                user: row.get(4)?,
                secret: row.get(5)?,
                added_at: row.get(6)?,
                workspace_id: row.get(7)?,
            })
        })?;

        let mut results = Vec::new();
        for cred in cred_iter {
            results.push(cred?);
        }
        Ok(results)
    }

    pub fn delete_credential(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM credentials WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn update_credential(&self, cred: &Credential) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE credentials SET name = ?1, type = ?2, host = ?3, user = ?4, secret = ?5, workspace_id = ?6 WHERE id = ?7",
            params![
                cred.name,
                cred.r#type,
                cred.host,
                cred.user,
                cred.secret,
                cred.workspace_id,
                cred.id
            ],
        )?;
        Ok(())
    }

    pub fn set_metadata(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO vault_metadata (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_metadata(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM vault_metadata WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;

        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn create_workspace(&self, id: &str, name: &str, created_at: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO workspaces (id, name, created_at) VALUES (?1, ?2, ?3)",
            params![id, name, created_at],
        )?;
        Ok(())
    }

    pub fn list_workspaces(&self) -> Result<Vec<(String, String, String)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, created_at FROM workspaces")?;
        let ws_iter = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })?;

        let mut results = Vec::new();
        for ws in ws_iter {
            results.push(ws?);
        }
        Ok(results)
    }
}
