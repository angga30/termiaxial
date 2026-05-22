use crate::commands::vault::Credential;
use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbManager {
    pub conn: Mutex<Connection>,
}

impl DbManager {
    pub fn new(path: PathBuf) -> Result<Self> {
        let conn = Connection::open(path)?;
        let manager = Self {
            conn: Mutex::new(conn),
        };
        manager.init_tables()?;
        Ok(manager)
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS credentials (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                host TEXT,
                user TEXT,
                secret BLOB,
                added_at TEXT NOT NULL
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

    pub fn add_credential(&self, cred: &Credential) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO credentials (id, name, type, host, user, secret, added_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                cred.id,
                cred.name,
                cred.r#type,
                cred.host,
                cred.user,
                cred.secret,
                cred.added_at
            ],
        )?;
        Ok(())
    }

    pub fn list_credentials(&self) -> Result<Vec<Credential>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT id, name, type, host, user, secret, added_at FROM credentials")?;
        let cred_iter = stmt.query_map([], |row| {
            Ok(Credential {
                id: row.get(0)?,
                name: row.get(1)?,
                r#type: row.get(2)?,
                host: row.get(3)?,
                user: row.get(4)?,
                secret: row.get(5)?,
                added_at: row.get(6)?,
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
            "UPDATE credentials SET name = ?1, type = ?2, host = ?3, user = ?4, secret = ?5 WHERE id = ?6",
            params![
                cred.name,
                cred.r#type,
                cred.host,
                cred.user,
                cred.secret,
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
}
