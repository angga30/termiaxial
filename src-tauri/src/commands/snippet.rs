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
    tracing::debug!("Searching snippets: {}", query);
    let all = db.list_snippets()?;
    let q = query.to_lowercase();
    let results: Vec<Snippet> = all
        .into_iter()
        .filter(|s| {
            s.name.to_lowercase().contains(&q)
                || s.command.to_lowercase().contains(&q)
                || s.tags.iter().any(|t| t.to_lowercase().contains(&q))
        })
        .collect();
    Ok(results)
}
