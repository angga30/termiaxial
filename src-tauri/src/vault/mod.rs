pub mod crypto;
pub mod db;

pub use crypto::*;
pub use db::*;

use tokio::sync::RwLock;

pub struct VaultState(pub RwLock<Option<crypto::VaultKey>>);
