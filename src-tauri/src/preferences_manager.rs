use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::SystemTime;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::RwLock;
use image::ImageEncoder;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeSettings {
    pub mode: String, // "light", "dark", "black", "system"
    pub accent_color: Option<String>, // hex color or null
    pub use_custom_accent: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorSettings {
    pub minimize_to_tray: bool,
    pub startup_enabled: bool,
    pub start_minimized: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderSettings {
    pub custom_icons: HashMap<String, String>, // folder_path -> relative_icon_path
    pub custom_folders: Vec<serde_json::Value>, // custom folder list
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub pinned: Vec<String>,
    pub categories: HashMap<String, String>,
    pub custom_icons: HashMap<String, String>, // app_path -> relative_icon_path
    pub last_accessed: HashMap<String, String>, // app_path -> timestamp
    pub view_mode: String, // "grid" or "list"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metadata {
    pub schema_version: u32,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppPreferences {
    pub theme: ThemeSettings,
    pub behavior: BehaviorSettings,
    pub apps: AppSettings,
    pub folders: FolderSettings,
    pub metadata: Metadata,
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: ThemeSettings {
                mode: "system".to_string(),
                accent_color: None,
                use_custom_accent: false,
            },
            behavior: BehaviorSettings {
                minimize_to_tray: false,
                startup_enabled: false,
                start_minimized: true,
            },
            apps: AppSettings {
                pinned: Vec::new(),
                categories: HashMap::new(),
                custom_icons: HashMap::new(),
                last_accessed: HashMap::new(),
                view_mode: "grid".to_string(),
            },
            folders: FolderSettings {
                custom_icons: HashMap::new(),
                custom_folders: Vec::new(),
            },
            metadata: Metadata {
                schema_version: 1,
                last_updated: chrono::Utc::now().to_rfc3339(),
            },
        }
    }
}

#[derive(Clone)]
pub struct PreferencesManager {
    config_dir: PathBuf,
    cache_dir: PathBuf,
    preferences: Arc<RwLock<AppPreferences>>,
    preferences_path: PathBuf,
    backups_dir: PathBuf,
}

impl PreferencesManager {
    pub fn new(app: &AppHandle) -> Result<Self, String> {
        let config_dir = app
            .path_resolver()
            .app_config_dir()
            .ok_or_else(|| "Failed to get config dir".to_string())?;

        let cache_dir = app
            .path_resolver()
            .app_cache_dir()
            .ok_or_else(|| "Failed to get cache dir".to_string())?;

        let custom_icons_dir = cache_dir.join("custom_icons");
        let backups_dir = config_dir.join("backups");
        let preferences_path = config_dir.join("preferences.json");

        // Create directories
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config dir: {}", e))?;
        fs::create_dir_all(&custom_icons_dir)
            .map_err(|e| format!("Failed to create icons dir: {}", e))?;
        fs::create_dir_all(&backups_dir)
            .map_err(|e| format!("Failed to create backups dir: {}", e))?;

        // Load or create preferences
        let preferences = if preferences_path.exists() {
            match Self::load_preferences(&preferences_path) {
                Ok(prefs) => prefs,
                Err(e) => {
                    eprintln!("Failed to load preferences: {}", e);
                    // Try to load from backup
                    match Self::load_from_backup(&backups_dir) {
                        Ok(prefs) => {
                            eprintln!("Loaded from backup");
                            prefs
                        }
                        Err(_) => {
                            eprintln!("Failed to load from backup, using defaults");
                            AppPreferences::default()
                        }
                    }
                }
            }
        } else {
            AppPreferences::default()
        };

        Ok(Self {
            config_dir,
            cache_dir,
            preferences: Arc::new(RwLock::new(preferences)),
            preferences_path,
            backups_dir,
        })
    }

    fn load_preferences(path: &Path) -> Result<AppPreferences, String> {
        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read preferences file: {}", e))?;

        let mut prefs: AppPreferences = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse preferences JSON: {}", e))?;

        // Update last updated timestamp
        prefs.metadata.last_updated = chrono::Utc::now().to_rfc3339();

        Ok(prefs)
    }

    fn load_from_backup(backups_dir: &Path) -> Result<AppPreferences, String> {
        let entries = fs::read_dir(backups_dir)
            .map_err(|e| format!("Failed to read backups dir: {}", e))?;

        let mut latest_backup: Option<PathBuf> = None;
        let mut latest_time: Option<SystemTime> = None;

        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    if latest_time.is_none() || modified > latest_time.unwrap() {
                        latest_time = Some(modified);
                        latest_backup = Some(entry.path());
                    }
                }
            }
        }

        if let Some(backup_path) = latest_backup {
            Self::load_preferences(&backup_path)
        } else {
            Err("No backup files found".to_string())
        }
    }

    pub async fn get_preferences(&self) -> AppPreferences {
        self.preferences.read().await.clone()
    }

    pub async fn update_preferences(&self, updates: serde_json::Value) -> Result<(), String> {
        let mut prefs = self.preferences.write().await;

        // Apply updates to the preferences
        if let Some(theme) = updates.get("theme") {
            if let Some(mode) = theme.get("mode").and_then(|v| v.as_str()) {
                prefs.theme.mode = mode.to_string();
            }
            if let Some(accent_color) = theme.get("accent_color") {
                prefs.theme.accent_color = accent_color.as_str().map(|s| s.to_string());
            }
            if let Some(use_custom) = theme.get("use_custom_accent").and_then(|v| v.as_bool()) {
                prefs.theme.use_custom_accent = use_custom;
            }
        }

        if let Some(behavior) = updates.get("behavior") {
            if let Some(minimize_to_tray) = behavior.get("minimize_to_tray").and_then(|v| v.as_bool()) {
                prefs.behavior.minimize_to_tray = minimize_to_tray;
            }
            if let Some(startup_enabled) = behavior.get("startup_enabled").and_then(|v| v.as_bool()) {
                prefs.behavior.startup_enabled = startup_enabled;
            }
            if let Some(start_minimized) = behavior.get("start_minimized").and_then(|v| v.as_bool()) {
                prefs.behavior.start_minimized = start_minimized;
            }
        }

        // Handle direct behavior updates (for compatibility with old system)
        if let Some(minimize_to_tray) = updates.get("minimize_to_tray").and_then(|v| v.as_bool()) {
            prefs.behavior.minimize_to_tray = minimize_to_tray;
        }
        if let Some(startup_enabled) = updates.get("startup_enabled").and_then(|v| v.as_bool()) {
            prefs.behavior.startup_enabled = startup_enabled;
        }
        if let Some(start_minimized) = updates.get("start_minimized").and_then(|v| v.as_bool()) {
            prefs.behavior.start_minimized = start_minimized;
        }

        if let Some(apps) = updates.get("apps") {
            if let Some(pinned) = apps.get("pinned").and_then(|v| v.as_array()) {
                prefs.apps.pinned = pinned.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect();
            }
            if let Some(view_mode) = apps.get("view_mode").and_then(|v| v.as_str()) {
                prefs.apps.view_mode = view_mode.to_string();
            }
            if let Some(custom_icons) = apps.get("custom_icons").and_then(|v| v.as_object()) {
                prefs.apps.custom_icons = custom_icons.iter()
                    .filter_map(|(k, v)| {
                        v.as_str().map(|s| (k.clone(), s.to_string()))
                    })
                    .collect();
            }
            if let Some(categories) = apps.get("categories").and_then(|v| v.as_object()) {
                prefs.apps.categories = categories.iter()
                    .filter_map(|(k, v)| {
                        v.as_str().map(|s| (k.clone(), s.to_string()))
                    })
                    .collect();
            }
            if let Some(last_accessed) = apps.get("last_accessed").and_then(|v| v.as_object()) {
                prefs.apps.last_accessed = last_accessed.iter()
                    .filter_map(|(k, v)| {
                        v.as_str().map(|s| (k.clone(), s.to_string()))
                    })
                    .collect();
            }

        }

        // Handle folders settings as top-level field
        if let Some(folders) = updates.get("folders").and_then(|v| v.as_object()) {
            if let Some(custom_icons) = folders.get("custom_icons").and_then(|v| v.as_object()) {
                prefs.folders.custom_icons = custom_icons.iter()
                    .filter_map(|(k, v)| {
                        v.as_str().map(|s| (k.clone(), s.to_string()))
                    })
                    .collect();
            }
            if let Some(custom_folders) = folders.get("custom_folders").and_then(|v| v.as_array()) {
                prefs.folders.custom_folders = custom_folders.clone();
            }
        }

        prefs.metadata.last_updated = chrono::Utc::now().to_rfc3339();

        // Save to disk
        self.save_preferences(&prefs).await?;

        Ok(())
    }

    async fn save_preferences(&self, prefs: &AppPreferences) -> Result<(), String> {
        let content = serde_json::to_string_pretty(prefs)
            .map_err(|e| format!("Failed to serialize preferences: {}", e))?;

        // Atomic write: write to temp file first, then rename
        let temp_path = self.preferences_path.with_extension("tmp");
        fs::write(&temp_path, &content)
            .map_err(|e| format!("Failed to write temp file: {}", e))?;

        fs::rename(&temp_path, &self.preferences_path)
            .map_err(|e| format!("Failed to rename temp file: {}", e))?;

        // Create backup
        self.create_backup().await?;

        Ok(())
    }

    async fn create_backup(&self) -> Result<(), String> {
        if !self.preferences_path.exists() {
            return Ok(());
        }

        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!("preferences_{}.json", timestamp);
        let backup_path = self.backups_dir.join(backup_name);

        fs::copy(&self.preferences_path, &backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;

        // Keep only last 5 backups
        self.cleanup_old_backups().await?;

        Ok(())
    }

    async fn cleanup_old_backups(&self) -> Result<(), String> {
        let entries = fs::read_dir(&self.backups_dir)
            .map_err(|e| format!("Failed to read backups dir: {}", e))?;

        let mut backups: Vec<_> = entries.flatten()
            .filter(|entry| entry.path().extension().and_then(|ext| ext.to_str()) == Some("json"))
            .collect();

        // Sort by modification time (newest first)
        backups.sort_by(|a, b| {
            let a_time = a.metadata().and_then(|m| m.modified()).ok();
            let b_time = b.metadata().and_then(|m| m.modified()).ok();
            b_time.cmp(&a_time)
        });

        // Remove old backups (keep only 5)
        for backup in backups.iter().skip(5) {
            if let Err(e) = fs::remove_file(backup.path()) {
                eprintln!("Failed to remove old backup: {}", e);
            }
        }

        Ok(())
    }

    pub async fn save_custom_icon(&self, app_path: String, icon_data: Vec<u8>) -> Result<String, String> {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        use image::imageops::FilterType;
        use base64::{engine::general_purpose::STANDARD, Engine};

        // Create hash of app path for filename
        let mut hasher = DefaultHasher::new();
        app_path.hash(&mut hasher);
        let hash = hasher.finish();
        let filename = format!("{:x}.png", hash);
        let icon_path = self.cache_dir.join("custom_icons").join(&filename);

        // Load and process the image
        let img = image::load_from_memory(&icon_data)
            .map_err(|e| format!("Failed to load image: {}", e))?;

        // Resize to exactly 128x128 with high-quality filtering
        let resized = img.resize_exact(128, 128, FilterType::Lanczos3);

        // Ensure the image is in RGBA8 format
        let rgba_image = if resized.color() == image::ColorType::Rgba8 {
            resized
        } else {
            // Convert to RGBA8 if it's not already
            image::DynamicImage::ImageRgba8(resized.to_rgba8())
        };

        // Save as PNG with optimal compression
        let mut output_buffer = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut output_buffer);

        let encoder = image::codecs::png::PngEncoder::new_with_quality(
            &mut cursor,
            image::codecs::png::CompressionType::Best,
            image::codecs::png::FilterType::Adaptive
        );

        encoder.write_image(
            rgba_image.as_bytes(),
            128,
            128,
            image::ColorType::Rgba8
        ).map_err(|e| e.to_string())?;

        // Write the file atomically
        let temp_path = icon_path.with_extension("tmp");
        fs::write(&temp_path, &output_buffer)
            .map_err(|e| format!("Failed to save temporary icon: {}", e))?;

        fs::rename(&temp_path, &icon_path)
            .map_err(|e| format!("Failed to save icon: {}", e))?;

        // Return the processed image as base64 for immediate UI update
        let base64_result = format!("data:image/png;base64,{}", STANDARD.encode(&output_buffer));
        Ok(base64_result)
    }

    pub async fn save_custom_icon_from_path(&self, app_path: String, temp_file_path: String) -> Result<String, String> {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        use image::imageops::FilterType;

        // Read the file from the temporary path
        let icon_data = fs::read(&temp_file_path)
            .map_err(|e| format!("Failed to read temporary icon file: {}", e))?;

        // Create hash of app path for filename
        let mut hasher = DefaultHasher::new();
        app_path.hash(&mut hasher);
        let hash = hasher.finish();
        let filename = format!("{:x}.png", hash);
        let icon_path = self.cache_dir.join("custom_icons").join(&filename);

        // Load and process the image
        let img = image::load_from_memory(&icon_data)
            .map_err(|e| format!("Failed to load image: {}", e))?;

        // Resize to exactly 128x128 with high-quality filtering
        let resized = img.resize_exact(128, 128, FilterType::Lanczos3);

        // Ensure the image is in RGBA8 format
        let rgba_image = if resized.color() == image::ColorType::Rgba8 {
            resized
        } else {
            // Convert to RGBA8 if it's not already
            image::DynamicImage::ImageRgba8(resized.to_rgba8())
        };

        // Save as PNG with optimal compression
        let mut output_buffer = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut output_buffer);

        let encoder = image::codecs::png::PngEncoder::new_with_quality(
            &mut cursor,
            image::codecs::png::CompressionType::Best,
            image::codecs::png::FilterType::Adaptive
        );

        encoder.write_image(
            rgba_image.as_bytes(),
            128,
            128,
            image::ColorType::Rgba8
        ).map_err(|e| e.to_string())?;

        // Write the file atomically
        let temp_path = icon_path.with_extension("tmp");
        fs::write(&temp_path, &output_buffer)
            .map_err(|e| format!("Failed to save temporary icon: {}", e))?;

        fs::rename(&temp_path, &icon_path)
            .map_err(|e| format!("Failed to save icon: {}", e))?;

        // Clean up the temporary file
        let _ = fs::remove_file(&temp_file_path);

        // Return relative path for storage in preferences
        let relative_path = format!("custom_icons/{}", filename);
        Ok(relative_path)
    }

    pub async fn get_custom_icon_path(&self, relative_path: &str) -> PathBuf {
        self.cache_dir.join(relative_path)
    }

    pub async fn save_custom_folder_icon(&self, folder_path: String, icon_data: Vec<u8>) -> Result<String, String> {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        use image::imageops::FilterType;
        use base64::{engine::general_purpose::STANDARD, Engine};

        // Create hash of folder path for filename
        let mut hasher = DefaultHasher::new();
        folder_path.hash(&mut hasher);
        let hash = hasher.finish();
        let filename = format!("{:x}.png", hash);
        let icon_path = self.cache_dir.join("custom_icons").join(&filename);

        // Load and process the image
        let img = image::load_from_memory(&icon_data)
            .map_err(|e| format!("Failed to load image: {}", e))?;

        // Resize to exactly 128x128 with high-quality filtering
        let resized = img.resize_exact(128, 128, FilterType::Lanczos3);

        // Ensure the image is in RGBA8 format
        let rgba_image = if resized.color() == image::ColorType::Rgba8 {
            resized
        } else {
            // Convert to RGBA8 if it's not already
            image::DynamicImage::ImageRgba8(resized.to_rgba8())
        };

        // Save as PNG with optimal compression
        let mut output_buffer = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut output_buffer);

        let encoder = image::codecs::png::PngEncoder::new_with_quality(
            &mut cursor,
            image::codecs::png::CompressionType::Best,
            image::codecs::png::FilterType::Adaptive
        );

        encoder.write_image(
            rgba_image.as_bytes(),
            128,
            128,
            image::ColorType::Rgba8
        ).map_err(|e| e.to_string())?;

        // Write the file atomically
        let temp_path = icon_path.with_extension("tmp");
        fs::write(&temp_path, &output_buffer)
            .map_err(|e| format!("Failed to save temporary icon: {}", e))?;

        fs::rename(&temp_path, &icon_path)
            .map_err(|e| format!("Failed to save icon: {}", e))?;

        // Return the processed image as base64 for immediate UI update
        let base64_result = format!("data:image/png;base64,{}", STANDARD.encode(&output_buffer));
        Ok(base64_result)
    }

    pub async fn cleanup_old_icons(&self) -> Result<(), String> {
        // Simple cleanup - remove icons not referenced in preferences
        let prefs = self.preferences.read().await;
        let mut referenced_icons: std::collections::HashSet<_> = prefs.apps.custom_icons.values().collect();

        // Also include folder icons in cleanup
        for folder_icon in prefs.folders.custom_icons.values() {
            referenced_icons.insert(folder_icon);
        }

        let icons_dir = self.cache_dir.join("custom_icons");
        if !icons_dir.exists() {
            return Ok(());
        }

        let entries = fs::read_dir(&icons_dir)
            .map_err(|e| format!("Failed to read icons dir: {}", e))?;

        for entry in entries.flatten() {
            if let Some(filename) = entry.file_name().to_str() {
                let relative_path = format!("custom_icons/{}", filename);
                if !referenced_icons.contains(&relative_path) {
                    if let Err(e) = fs::remove_file(entry.path()) {
                        eprintln!("Failed to remove unreferenced icon: {}", e);
                    }
                }
            }
        }

        Ok(())
    }
}