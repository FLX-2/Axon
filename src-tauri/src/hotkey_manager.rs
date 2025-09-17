use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, GlobalShortcutManager};
use crate::preferences_manager::PreferencesManager;

#[derive(Clone)]
pub struct HotkeyManager {
    app_handle: AppHandle,
    current_hotkey: Arc<Mutex<Option<String>>>,
}

impl HotkeyManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            current_hotkey: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn register_hotkey(&self, hotkey: &str, preferences_manager: &PreferencesManager) -> Result<(), String> {
        // Unregister previous hotkey if exists
        if let Ok(current) = self.current_hotkey.lock() {
            if let Some(old_hotkey) = current.as_ref() {
                if let Err(e) = self.app_handle.global_shortcut_manager().unregister(old_hotkey) {
                    eprintln!("Failed to unregister old hotkey: {}", e);
                }
            }
        }

        // Clone necessary data for the closure
        let app_handle = self.app_handle.clone();
        let preferences_manager = preferences_manager.clone();
        
        // Register new hotkey
        self.app_handle.global_shortcut_manager().register(hotkey, move || {
            let app_handle = app_handle.clone();
            let preferences_manager = preferences_manager.clone();
            
            tauri::async_runtime::spawn(async move {
                if let Err(e) = Self::handle_hotkey_press(app_handle, preferences_manager).await {
                    eprintln!("Error handling hotkey press: {}", e);
                }
            });
        }).map_err(|e| format!("Failed to register hotkey '{}': {}", hotkey, e))?;

        // Update current hotkey
        if let Ok(mut current) = self.current_hotkey.lock() {
            *current = Some(hotkey.to_string());
        }

        Ok(())
    }

    pub fn unregister_current_hotkey(&self) -> Result<(), String> {
        if let Ok(mut current) = self.current_hotkey.lock() {
            if let Some(hotkey) = current.take() {
                self.app_handle.global_shortcut_manager().unregister(&hotkey)
                    .map_err(|e| format!("Failed to unregister hotkey: {}", e))?;
            }
        }
        
        Ok(())
    }

    async fn handle_hotkey_press(app_handle: AppHandle, preferences_manager: PreferencesManager) -> Result<(), String> {
        let main_window = app_handle.get_window("main")
            .ok_or("Main window not found")?;

        let preferences = preferences_manager.get_preferences().await;
        let minimize_to_tray = preferences.behavior.minimize_to_tray;

        if main_window.is_minimized().unwrap_or(false) {
            // Window is minimized to taskbar, restore it
            main_window.unminimize().map_err(|e| format!("Failed to unminimize window: {}", e))?;
            main_window.set_focus().map_err(|e| format!("Failed to focus window: {}", e))?;
        } else if main_window.is_visible().unwrap_or(true) {
            // Window is visible, hide it
            if minimize_to_tray {
                // Hide to tray
                main_window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
            } else {
                // Minimize to taskbar
                main_window.minimize().map_err(|e| format!("Failed to minimize window: {}", e))?;
            }
        } else {
            // Window is hidden (to tray), show it
            main_window.show().map_err(|e| format!("Failed to show window: {}", e))?;
            main_window.set_focus().map_err(|e| format!("Failed to focus window: {}", e))?;
        }

        Ok(())
    }

    pub fn validate_hotkey(hotkey: &str) -> bool {
        // Basic validation for hotkey format
        // Tauri uses accelerator strings like "CmdOrCtrl+Shift+A"
        if hotkey.is_empty() {
            return false;
        }

        // Check for valid modifiers and key combinations
        let parts: Vec<&str> = hotkey.split('+').collect();
        if parts.len() < 2 {
            return false; // Need at least one modifier + one key
        }

        let valid_modifiers = ["Ctrl", "Alt", "Shift", "Super"];
        let mut has_modifier = false;
        let mut has_key = false;

        for (i, part) in parts.iter().enumerate() {
            if i == parts.len() - 1 {
                // Last part should be the key
                if part.len() == 1 || ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", 
                    "Space", "Tab", "Enter", "Escape", "Backspace", "Delete", "Home", "End", "PageUp", "PageDown",
                    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].contains(part) {
                    has_key = true;
                }
            } else {
                // Should be a modifier
                if valid_modifiers.contains(part) {
                    has_modifier = true;
                }
            }
        }

        has_modifier && has_key
    }
}