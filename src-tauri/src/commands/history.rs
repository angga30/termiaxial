use crate::domain::error::TmaxError;
use crate::domain::models::CommandHistoryEntry;
use crate::vault::DbManager;
use tauri::State;

#[tauri::command]
pub async fn history_record(
    entry: CommandHistoryEntry,
    db: State<'_, DbManager>,
) -> Result<(), TmaxError> {
    tracing::debug!("Recording command: {}", entry.command);
    db.record_command(&entry)?;
    Ok(())
}

#[tauri::command]
pub async fn history_list(
    session_id: Option<String>,
    limit: Option<usize>,
    db: State<'_, DbManager>,
) -> Result<Vec<CommandHistoryEntry>, TmaxError> {
    tracing::debug!("Listing history, session_id={:?}, limit={:?}", session_id, limit);
    Ok(db.list_history(session_id.as_deref(), limit)?)
}

#[tauri::command]
pub async fn history_search(
    query: String,
    limit: Option<usize>,
    db: State<'_, DbManager>,
) -> Result<Vec<CommandHistoryEntry>, TmaxError> {
    tracing::debug!("Searching history: {}", query);
    Ok(db.search_history(&query, limit)?)
}

#[tauri::command]
pub async fn history_clear(
    session_id: Option<String>,
    db: State<'_, DbManager>,
) -> Result<(), TmaxError> {
    tracing::info!("Clearing history, session_id={:?}", session_id);
    db.clear_history(session_id.as_deref())?;
    Ok(())
}
