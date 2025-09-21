// Utility functions for common operations
// Reduces code duplication and improves maintainability

use crate::preferences_manager::PreferencesManager;
use std::sync::Mutex;
use once_cell::sync::OnceCell;

// Global preferences manager instance
pub static PREFERENCES_MANAGER: OnceCell<Mutex<Option<PreferencesManager>>> = OnceCell::new();

/// Get a reference to the preferences manager
pub fn get_preferences_manager() -> Result<PreferencesManager, String> {
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| Mutex::new(None));

    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    manager.ok_or_else(|| "Preferences manager not initialized".to_string())
}

/// Set the preferences manager instance
pub fn set_preferences_manager(manager: PreferencesManager) {
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| Mutex::new(None));
    *manager_lock.lock().unwrap() = Some(manager);
}

/// Update preferences with error handling
pub async fn update_preferences_with_fallback<F, Fut>(
    updates: serde_json::Value,
    _operation: F,
    fallback_operation: F,
) -> Result<(), String>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    match get_preferences_manager() {
        Ok(manager) => {
            let new_manager = manager.clone();
            match new_manager.update_preferences(updates).await {
                Ok(_) => {
                    // Update the stored manager
                    set_preferences_manager(new_manager);
                    Ok(())
                }
                Err(e) => {
                    eprintln!("Failed to update preferences: {}", e);
                    // Execute fallback operation
                    fallback_operation().await;
                    Err(e)
                }
            }
        }
        Err(e) => {
            eprintln!("Preferences manager not available: {}", e);
            // Execute fallback operation
            fallback_operation().await;
            Err(e)
        }
    }
}

/// Optimized string matching for categorization
pub fn contains_keyword_case_insensitive(text: &str, keyword: &str) -> bool {
    text.to_lowercase().contains(&keyword.to_lowercase())
}

/// Batch process items with error handling
pub async fn process_batch_with_error_handling<T, F, Fut, E>(
    items: Vec<T>,
    batch_size: usize,
    processor: F,
) -> Result<(), E>
where
    T: Clone,
    F: Fn(Vec<T>) -> Fut,
    Fut: std::future::Future<Output = Result<(), E>>,
    E: std::fmt::Display,
{
    for chunk in items.chunks(batch_size) {
        processor(chunk.to_vec()).await?;
    }
    Ok(())
}