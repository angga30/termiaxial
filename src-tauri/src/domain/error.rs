use serde::Serialize;

#[derive(Debug)]
pub enum TmaxError {
    Vault(String),
    Ssh(String),
    Sftp(String),
    Ai(String),
    Config(String),
    Database(String),
    Io(String),
    Auth(String),
    General(String),
}

impl std::fmt::Display for TmaxError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TmaxError::Vault(s) => write!(f, "Vault error: {}", s),
            TmaxError::Ssh(s) => write!(f, "SSH error: {}", s),
            TmaxError::Sftp(s) => write!(f, "SFTP error: {}", s),
            TmaxError::Ai(s) => write!(f, "AI error: {}", s),
            TmaxError::Config(s) => write!(f, "Config error: {}", s),
            TmaxError::Database(s) => write!(f, "Database error: {}", s),
            TmaxError::Io(s) => write!(f, "IO error: {}", s),
            TmaxError::Auth(s) => write!(f, "Authentication error: {}", s),
            TmaxError::General(s) => write!(f, "{}", s),
        }
    }
}

impl std::error::Error for TmaxError {}

impl Serialize for TmaxError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<rusqlite::Error> for TmaxError {
    fn from(e: rusqlite::Error) -> Self {
        TmaxError::Database(e.to_string())
    }
}

impl From<std::io::Error> for TmaxError {
    fn from(e: std::io::Error) -> Self {
        TmaxError::Io(e.to_string())
    }
}
