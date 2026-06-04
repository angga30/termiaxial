use crate::domain::error::TmaxError;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RecordingInfo {
    pub session_id: String,
    pub output_path: String,
    pub started_at: String,
    pub active: bool,
}

struct RecordingState {
    file: std::fs::File,
    start_time: Instant,
    _width: u16,
    _height: u16,
}

pub struct RecordingManager {
    pub recordings: DashMap<String, Arc<Mutex<RecordingState>>>,
}

impl RecordingManager {
    pub fn new() -> Self {
        Self {
            recordings: DashMap::new(),
        }
    }
}

fn default_recording_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());
    PathBuf::from(home).join("Recordings")
}

#[tauri::command]
pub async fn start_recording(
    session_id: String,
    output_path: Option<String>,
    width: Option<u16>,
    height: Option<u16>,
    recording_mgr: tauri::State<'_, RecordingManager>,
) -> Result<RecordingInfo, TmaxError> {
    let dir = default_recording_dir();
    std::fs::create_dir_all(&dir)
        .map_err(|e| TmaxError::Io(format!("Failed to create recordings dir: {}", e)))?;

    let path = output_path.unwrap_or_else(|| {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        dir.join(format!("session-{}.cast", timestamp))
            .to_string_lossy()
            .to_string()
    });

    tracing::info!("Starting recording for session {} -> {}", session_id, path);

    let w = width.unwrap_or(80);
    let h = height.unwrap_or(24);

    let mut file = std::fs::File::create(&path)
        .map_err(|e| TmaxError::Io(format!("Failed to create recording file: {}", e)))?;

    let header = serde_json::json!({
        "version": 2,
        "width": w,
        "height": h,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    });
    writeln!(file, "{}", header)
        .map_err(|e| TmaxError::Io(format!("Failed to write header: {}", e)))?;

    let state = RecordingState {
        file,
        start_time: Instant::now(),
        _width: w,
        _height: h,
    };

    recording_mgr
        .recordings
        .insert(session_id.clone(), Arc::new(Mutex::new(state)));

    Ok(RecordingInfo {
        session_id: session_id.clone(),
        output_path: path,
        started_at: format!(
            "{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs()
        ),
        active: true,
    })
}

#[tauri::command]
pub async fn stop_recording(
    session_id: String,
    recording_mgr: tauri::State<'_, RecordingManager>,
) -> Result<(), TmaxError> {
    tracing::info!("Stopping recording for session {}", session_id);
    if recording_mgr.recordings.remove(&session_id).is_some() {
        Ok(())
    } else {
        Err(TmaxError::General(
            "No active recording for this session".to_string(),
        ))
    }
}

#[tauri::command]
pub async fn recording_status(
    session_id: String,
    recording_mgr: tauri::State<'_, RecordingManager>,
) -> Result<bool, TmaxError> {
    Ok(recording_mgr.recordings.contains_key(&session_id))
}

pub fn record_data(recording_mgr: &RecordingManager, session_id: &str, data: &[u8]) {
    if let Some(state) = recording_mgr.recordings.get(session_id) {
        if let Ok(mut state) = state.try_lock() {
            let elapsed = state.start_time.elapsed().as_secs_f64();
            let text = String::from_utf8_lossy(data);
            let entry = serde_json::json!([elapsed, "o", text.as_ref()]);
            let _ = writeln!(state.file, "{}", entry);
        }
    }
}
