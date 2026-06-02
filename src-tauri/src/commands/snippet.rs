use crate::domain::error::TmaxError;
use crate::domain::models::Snippet;
use crate::vault::DbManager;
use tauri::State;

#[tauri::command]
pub async fn snippet_add(
    snippet: Snippet,
    db: State<'_, DbManager>,
) -> Result<(), TmaxError> {
    tracing::info!("Adding snippet: {}", snippet.name);
    db.add_snippet(&snippet)?;
    Ok(())
}

#[tauri::command]
pub async fn snippet_list(
    db: State<'_, DbManager>,
) -> Result<Vec<Snippet>, TmaxError> {
    tracing::debug!("Listing snippets");
    Ok(db.list_snippets()?)
}

#[tauri::command]
pub async fn snippet_delete(
    id: String,
    db: State<'_, DbManager>,
) -> Result<(), TmaxError> {
    tracing::info!("Deleting snippet: {}", id);
    db.delete_snippet(&id)?;
    Ok(())
}

#[tauri::command]
pub async fn snippet_update(
    snippet: Snippet,
    db: State<'_, DbManager>,
) -> Result<(), TmaxError> {
    tracing::info!("Updating snippet: {}", snippet.name);
    db.update_snippet(&snippet)?;
    Ok(())
}

#[tauri::command]
pub async fn snippet_search(
    query: String,
    db: State<'_, DbManager>,
) -> Result<Vec<Snippet>, TmaxError> {
    tracing::debug!("Fuzzy searching snippets: {}", query);
    let all = db.list_snippets()?;
    let results = crate::commands::fuzzy::fuzzy_search_snippets(&query, &all);
    Ok(results.into_iter().map(|(_, s)| s.clone()).collect())
}
