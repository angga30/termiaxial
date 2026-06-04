use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SessionEvent {
    Connected { session_id: String, host: String },
    Disconnected { session_id: String, reason: String },
    Data { session_id: String, data: Vec<u8> },
    Error { session_id: String, error: String },
}

pub struct EventBus {
    sender: broadcast::Sender<SessionEvent>,
}

impl EventBus {
    pub fn new(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);
        Self { sender }
    }

    pub fn publish(&self, event: SessionEvent) {
        let _ = self.sender.send(event);
    }

    pub fn subscribe(&self) -> broadcast::Receiver<SessionEvent> {
        self.sender.subscribe()
    }
}
