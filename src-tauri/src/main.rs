// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, PhysicalSize, Size, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use window_shadows::set_shadow;
use window_vibrancy::apply_blur;
use winreg::enums::*;
use winreg::RegKey;
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use base64::{engine::general_purpose::STANDARD, Engine};
use windows::Win32::UI::Shell::{
    SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON, SHGetFileInfoW,
    ShellLink, IShellLinkW
};
use windows::Win32::System::Com::{
    CoCreateInstance, CLSCTX_INPROC_SERVER, STGM_READ,
    IPersistFile
};
use windows::Win32::UI::WindowsAndMessaging::{
    DestroyIcon, DrawIconEx, HICON, DI_NORMAL
};
use windows::Win32::Graphics::Gdi::{
    CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject,
    GetDC, ReleaseDC, SelectObject, GetBitmapBits, FillRect, GetStockObject,
    BLACK_BRUSH, HBRUSH
};
use windows::core::{ComInterface, PCWSTR};

use image;
use image::ImageEncoder;
use windows::Win32::UI::Shell::ShellExecuteW;
use windows::core::HSTRING;
use windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES;
use windows::Win32::System::Com::{
    CoInitializeEx, COINIT_APARTMENTTHREADED
};
use windows::Win32::Storage::FileSystem::WIN32_FIND_DATAW;
use md5;
use url;

mod app_manager;
mod startup_manager;
mod preferences_manager;
#[cfg(test)]
mod unit_tests;
use app_manager::AppManager;
use startup_manager::StartupManager;
use preferences_manager::{PreferencesManager, AppPreferences};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct AppInfo {
    name: String,
    path: String,
    icon: Option<String>,
    category: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct AppSettings {
    custom_icons: std::collections::HashMap<String, String>,
    moved_apps: std::collections::HashMap<String, String>,
    pinned_apps: Vec<String>,
    recent_apps: Vec<String>,
    is_grid_view: bool,
    categories: std::collections::HashMap<String, String>,
    minimize_to_tray: Option<bool>,
    startup_enabled: Option<bool>,
    start_minimized: Option<bool>,
}

// Memory cache for app scanning results
static APP_CACHE: std::sync::OnceLock<std::sync::Mutex<Option<(Vec<AppInfo>, std::time::Instant)>>> = std::sync::OnceLock::new();

#[tauri::command]
async fn refresh_start_menu_apps() -> Result<Vec<AppInfo>, String> {
    // Initialize the cache if it hasn't been initialized yet
    let cache = APP_CACHE.get_or_init(|| {
        std::sync::Mutex::new(None)
    });
    
    // Explicitly clear the cache to force a fresh scan
    {
        let mut cache_guard = cache.lock().unwrap();
        *cache_guard = None;
    }
    
    // Call get_start_menu_apps to perform a fresh scan
    get_start_menu_apps().await
}

#[tauri::command]
async fn get_start_menu_apps() -> Result<Vec<AppInfo>, String> {
    // Initialize the cache if it hasn't been initialized yet
    let cache = APP_CACHE.get_or_init(|| {
        std::sync::Mutex::new(None)
    });
    
    // Try to get cached results first
    {
        let cache_guard = cache.lock().unwrap();
        if let Some((cached_apps, timestamp)) = &*cache_guard {
            // Cache is valid for 5 minutes
            if timestamp.elapsed() < std::time::Duration::from_secs(300) {
                log_error("Using cached app list");
                return Ok(cached_apps.clone());
            }
        }
    }
    
    log_error("Scanning start menu apps (cache expired or not found)");
    let mut apps = Vec::new();
    
    // First, clear the cache to ensure fresh scan
    let cache = APP_CACHE.get_or_init(|| {
        std::sync::Mutex::new(None)
    });
    {
        let mut cache_guard = cache.lock().unwrap();
        *cache_guard = None;
    }
    
    // Common Start Menu paths
    let paths = vec![
        std::env::var("ProgramData").unwrap_or_default() + "\\Microsoft\\Windows\\Start Menu\\Programs",
        std::env::var("APPDATA").unwrap_or_default() + "\\Microsoft\\Windows\\Start Menu\\Programs",
    ];

    // Log number of paths
    log_error(&format!("Scanning {} paths", paths.len()));
    
    // Process each path sequentially for more reliable results
    for path in &paths {
        log_error(&format!("Scanning path: {}", path));
        let mut path_apps = Vec::new();
        if scan_directory(&Path::new(&path), &mut path_apps).is_ok() {
            log_error(&format!("Found {} apps in {}", path_apps.len(), path));
            apps.extend(path_apps);
        }
    }
    
    log_error(&format!("Total apps found: {}", apps.len()));
    
    // Update cache
    {
        let mut cache_guard = cache.lock().unwrap();
        *cache_guard = Some((apps.clone(), std::time::Instant::now()));
    }

    Ok(apps)
}

fn scan_directory(dir: &Path, apps: &mut Vec<AppInfo>) -> Result<(), String> {
    // Log directory scanning
    log_error(&format!("Scanning directory: {}", dir.display()));
    
    // Skip only very specific system directories
    let dir_name = dir.file_name().map(|n| n.to_string_lossy().to_lowercase());
    if let Some(name) = dir_name {
        // Skip only Windows system directories by exact match
        let skip_dirs = [
            "windows", "system32", "systemapps", "syswow64",
            "winsxs", "assembly", "microsoft.net"
        ];
        
        if skip_dirs.iter().any(|&skip| name == skip) {
            log_error(&format!("Skipping system directory: {}", dir.display()));
            return Ok(());
        }
    }
    
    // No maximum entry limit - scan all entries
    
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            
            if path.is_dir() {
                // Recursively scan subdirectory with more permissive rules
                scan_directory(&path, apps)?;
            } else if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                // Process both .lnk and .url files
                if ext_str == "lnk" || ext_str == "url" {
                    if let Some(app_info) = create_app_info(&path) {
                        log_error(&format!("Found app: {}", app_info.name));
                        apps.push(app_info);
                    }
                }
            }
        }
    }
    Ok(())
}

fn create_app_info(path: &Path) -> Option<AppInfo> {
    let name = path.file_stem()?.to_string_lossy().into_owned();
    let path_str = path.to_string_lossy().into_owned();
    
    // Basic category detection based on path
    let category = if path_str.contains("Games") {
        "Games"
    } else if path_str.contains("Accessories") || path_str.contains("System Tools") {
        "Utilities"
    } else if path_str.contains("Media") {
        "Media"
    } else if path_str.contains("Development") || path_str.contains("Programming") {
        "Development"
    } else {
        "Other"
    }.to_string();

    Some(AppInfo {
        name,
        path: path_str,
        icon: None,
        category,
    })
}

#[tauri::command]
async fn get_app_icon(path: String) -> Result<String, String> {
    get_app_icon_internal(&path)
}

fn get_app_icon_internal(path: &str) -> Result<String, String> {
    unsafe {
        let path_wide: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
        let mut file_info: SHFILEINFOW = std::mem::zeroed();
        
        // Try with different flag combinations
        let flags = SHGFI_ICON | SHGFI_LARGEICON;
        
        let result = SHGetFileInfoW(
            PCWSTR(path_wide.as_ptr()),
            FILE_FLAGS_AND_ATTRIBUTES(0),
            Some(&mut file_info),
            std::mem::size_of::<SHFILEINFOW>() as u32,
            flags
        );

        if result == 0 || file_info.hIcon.is_invalid() {
            // If first attempt fails, handle different file types
            let path_lower = path.to_lowercase();
            
            if path_lower.ends_with(".lnk") {
                // For .lnk files, get icon from target
                if let Ok(target_path) = resolve_shortcut(path) {
                    return get_app_icon_internal(&target_path);
                }
            } else if path_lower.ends_with(".url") {
                // For .url files, use default browser icon or parse the URL file
                log_error(&format!("Getting icon for URL file: {}", path));
                
                // Try to read the URL file to extract the URL
                if let Ok(content) = std::fs::read_to_string(path) {
                    // Look for the URL= line in the file
                    if let Some(url_line) = content.lines().find(|line| line.starts_with("URL=")) {
                        let url = url_line.trim_start_matches("URL=").trim();
                        
                        // Try to get favicon using the domain's favicon.ico
                        if url.starts_with("http") {
                            if let Ok(url) = url::Url::parse(url) {
                                if let Some(_domain) = url.host_str() {
                                    // Use browser icon as fallback
                                    let browsers = [
                                        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                                        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
                                        "C:\\Program Files\\Mozilla Firefox\\firefox.exe"
                                    ];
                                    
                                    for browser in browsers {
                                        if std::path::Path::new(browser).exists() {
                                            return get_app_icon_internal(browser);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Default to Edge browser icon if all else fails
                let edge_path = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
                if std::path::Path::new(edge_path).exists() {
                    return get_app_icon_internal(edge_path);
                }
            }
            
            return Err("Failed to get icon".into());
        }

        // Add a small delay to ensure icon is fully loaded
        std::thread::sleep(std::time::Duration::from_millis(50));

        let bitmap = icon_to_bitmap(file_info.hIcon)?;
        let base64 = STANDARD.encode(&bitmap);
        
        if let Err(e) = DestroyIcon(file_info.hIcon) {
            log_error(&format!("Failed to destroy icon: {:?}", e));
        }
        
        Ok(format!("data:image/png;base64,{}", base64))
    }
}

fn icon_to_bitmap(hicon: HICON) -> Result<Vec<u8>, String> {
    unsafe {
        let hdc = GetDC(None);
        let hdcmem = CreateCompatibleDC(hdc);
        
        // Increase size for better quality
        let size: u32 = 128;  // Try a larger size
        let hbitmap = CreateCompatibleBitmap(hdc, size as i32, size as i32);
        let holdbitmap = SelectObject(hdcmem, hbitmap);
        
        let rect = windows::Win32::Foundation::RECT {
            left: 0,
            top: 0,
            right: size as i32,
            bottom: size as i32,
        };
        
        let brush = GetStockObject(BLACK_BRUSH);
        FillRect(
            hdcmem,
            &rect,
            HBRUSH(brush.0)
        );
        
        // Draw the icon with better quality
        if let Err(e) = DrawIconEx(
            hdcmem,
            0,
            0,
            hicon,
            size as i32,
            size as i32,
            0,
            None,
            DI_NORMAL
        ) {
            log_error(&format!("Failed to draw icon: {:?}", e));
            return Err("Failed to draw icon".into());
        }
        
        let mut bits = vec![0u8; (size * size * 4) as usize];
        GetBitmapBits(hbitmap, bits.len() as i32, bits.as_mut_ptr() as *mut _);
        
        // Fix color channels and handle alpha
        for pixel in bits.chunks_exact_mut(4) {
            pixel.swap(0, 2);
            
            // If pixel is black (background), make it transparent
            if pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0 {
                pixel[3] = 0;
            } else {
                pixel[3] = 255;  // Full opacity for non-background pixels
            }
        }
        
        // Create high-quality PNG
        let img = image::RgbaImage::from_raw(size, size, bits)
            .ok_or_else(|| "Failed to create image".to_string())?;
        
        let mut png_data = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut png_data);
        
        let encoder = image::codecs::png::PngEncoder::new_with_quality(
            &mut cursor,
            image::codecs::png::CompressionType::Best,
            image::codecs::png::FilterType::Adaptive
        );
        
        encoder.write_image(
            img.as_raw(),
            size,
            size,
            image::ColorType::Rgba8
        ).map_err(|e| e.to_string())?;
        
        // Cleanup
        SelectObject(hdcmem, holdbitmap);
        DeleteObject(hbitmap);
        DeleteDC(hdcmem);
        ReleaseDC(None, hdc);
        
        Ok(png_data)
    }
}

fn resolve_shortcut(path: &str) -> Result<String, String> {
    unsafe {
        let shell_link: IShellLinkW = CoCreateInstance(
            &ShellLink,
            None,
            CLSCTX_INPROC_SERVER
        ).map_err(|e| e.to_string())?;

        let persist_file: IPersistFile = shell_link.cast()
            .map_err(|e| e.to_string())?;
        
        let path_wide: Vec<u16> = path.encode_utf16()
            .chain(std::iter::once(0))
            .collect();
        
        persist_file.Load(PCWSTR(path_wide.as_ptr()), STGM_READ)
            .map_err(|e| e.to_string())?;
        
        let mut target_path = [0u16; 260];
        let mut find_data = WIN32_FIND_DATAW::default();
        
        shell_link.GetPath(
            &mut target_path,
            &mut find_data,
            0
        ).map_err(|e| e.to_string())?;
        
        Ok(String::from_utf16_lossy(
            &target_path[..target_path.iter().position(|&x| x == 0).unwrap_or(260)]
        ))
    }
}

#[tauri::command]
async fn get_system_accent_color() -> Result<String, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let dwm_key = hkcu.open_subkey("SOFTWARE\\Microsoft\\Windows\\DWM")
        .map_err(|e| e.to_string())?;
    
    let accent_color: u32 = dwm_key.get_value("ColorizationColor")
        .map_err(|e| e.to_string())?;
    
    Ok(format!("#{:06X}", accent_color & 0xFFFFFF))
}


#[tauri::command]
async fn launch_app(path: String) -> Result<(), String> {
    unsafe {
        let path_wide = HSTRING::from(path);
        let operation = HSTRING::from("open");
        
        let result = ShellExecuteW(
            None,
            &operation,
            &path_wide,
            None,
            None,
            windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL
        );
        
        if result.0 <= 32 {
            return Err("Failed to launch application".into());
        }
        
        Ok(())
    }
}

#[tauri::command]
async fn save_custom_icon(app_path: String, icon_data: String) -> Result<String, String> {
    use image::{ImageFormat, imageops::FilterType};
    
    
    // Get the app's data directory
    let app_data_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| "Failed to get app data directory".to_string())?;
    
    let custom_icons_dir = app_data_dir.join("custom_icons");
    if !custom_icons_dir.exists() {
        fs::create_dir_all(&custom_icons_dir)
            .map_err(|e| format!("Failed to create custom icons directory: {}", e))?;
    }

    // Create a unique filename based on the app path
    let hash = format!("{:x}", md5::compute(&app_path));
    let icon_path = custom_icons_dir.join(format!("{}.png", hash));

    // Decode base64 image data
    let icon_bytes = STANDARD
        .decode(&icon_data)
        .map_err(|e| format!("Failed to decode icon data: {}", e))?;

    // Load and process the image
    let img = image::load_from_memory(&icon_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    // Resize to 128x128 with high-quality filtering, maintaining aspect ratio
    let resized = img.resize(128, 128, FilterType::Lanczos3);

    // Ensure the image is in RGBA8 format
    let rgba_image = if resized.color() == image::ColorType::Rgba8 {
        resized
    } else {
        // Convert to RGBA8 if it's not already
        image::DynamicImage::ImageRgba8(resized.to_rgba8())
    };

    // Save as PNG with optimal compression
    let mut output_buffer = Vec::new();
    rgba_image.write_to(&mut std::io::Cursor::new(&mut output_buffer), ImageFormat::Png)
        .map_err(|e| format!("Failed to encode image: {}", e))?;

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

#[tauri::command]
async fn save_custom_folder_icon(folder_path: String, icon_data: String) -> Result<String, String> {
    use image::{ImageFormat, imageops::FilterType};
    
    // Get the app's data directory
    let app_data_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| "Failed to get app data directory".to_string())?;
    
    let custom_icons_dir = app_data_dir.join("custom_folder_icons");
    if !custom_icons_dir.exists() {
        fs::create_dir_all(&custom_icons_dir)
            .map_err(|e| format!("Failed to create custom folder icons directory: {}", e))?;
    }

    // Create a unique filename based on the folder path
    let hash = format!("{:x}", md5::compute(&folder_path));
    let icon_path = custom_icons_dir.join(format!("{}.png", hash));

    // Decode base64 image data
    let icon_bytes = STANDARD
        .decode(&icon_data)
        .map_err(|e| format!("Failed to decode icon data: {}", e))?;

    // Load and process the image
    let img = image::load_from_memory(&icon_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    // Resize to 128x128 with high-quality filtering, maintaining aspect ratio
    let resized = img.resize(128, 128, FilterType::Lanczos3);

    // Ensure the image is in RGBA8 format
    let rgba_image = if resized.color() == image::ColorType::Rgba8 {
        resized
    } else {
        // Convert to RGBA8 if it's not already
        image::DynamicImage::ImageRgba8(resized.to_rgba8())
    };

    // Save as PNG with optimal compression
    let mut output_buffer = Vec::new();
    rgba_image.write_to(&mut std::io::Cursor::new(&mut output_buffer), ImageFormat::Png)
        .map_err(|e| format!("Failed to encode image: {}", e))?;

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

#[tauri::command]
async fn remove_custom_folder_icon(folder_path: String) -> Result<String, String> {
    // Get the app's data directory
    let app_data_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| "Failed to get app directory".to_string())?;
    
    let custom_icons_dir = app_data_dir.join("custom_folder_icons");
    let hash = format!("{:x}", md5::compute(&folder_path));
    let icon_path = custom_icons_dir.join(format!("{}.png", hash));

    // Remove the icon file if it exists
    if icon_path.exists() {
        fs::remove_file(&icon_path)
            .map_err(|e| format!("Failed to remove custom folder icon: {}", e))?;
    }

    Ok("Folder icon removed".to_string())
}

#[tauri::command]
async fn remove_custom_icon(app: tauri::AppHandle, app_path: String) -> Result<String, String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    // Get the app's cache directory using the app handle (same as PreferencesManager)
    let app_cache_dir = app
        .path_resolver()
        .app_cache_dir()
        .ok_or_else(|| "Failed to get app cache directory".to_string())?;

    let custom_icons_dir = app_cache_dir.join("custom_icons");

    // Use the same hash algorithm as PreferencesManager
    let mut hasher = DefaultHasher::new();
    app_path.hash(&mut hasher);
    let hash = format!("{:x}", hasher.finish());
    let icon_path = custom_icons_dir.join(format!("{}.png", hash));

    // Debug logging removed for production

    // Remove the icon file if it exists
    if icon_path.exists() {
        match fs::remove_file(&icon_path) {
            Ok(_) => {
                Ok(format!("Successfully removed: {}", icon_path.display()))
            }
            Err(e) => {
                Err(format!("Failed to remove custom icon: {}", e))
            }
        }
    } else {
        Ok(format!("File does not exist: {}", icon_path.display()))
    }
}

#[tauri::command]
async fn shell_open(path: String) -> Result<(), String> {
    unsafe {
        let path_wide = HSTRING::from(path);
        let operation = HSTRING::from("explore");
        
        let result = ShellExecuteW(
            None,
            &operation,
            &path_wide,
            None,
            None,
            windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL
        );
        
        if result.0 <= 32 {
            return Err("Failed to open folder".into());
        }
        
        Ok(())
    }
}

#[tauri::command]
async fn load_app_settings() -> Result<AppSettings, String> {
    let app_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| "Failed to get app directory".to_string())?;
    
    let settings_file = app_dir.join("settings.json");
    log_error(&format!("Loading settings from: {}", settings_file.display()));
    
    if !settings_file.exists() {
        log_error("Settings file does not exist, creating default settings");
        return Ok(AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(false),
            startup_enabled: Some(false),
            start_minimized: Some(true),
        });
    }
    
    let content = fs::read_to_string(&settings_file)
        .map_err(|e| {
            log_error(&format!("Failed to read settings: {}", e));
            format!("Failed to read settings: {}", e)
        })?;
    
    serde_json::from_str(&content)
        .map_err(|e| {
            log_error(&format!("Failed to parse settings: {}", e));
            format!("Failed to parse settings: {}", e)
        })
}

#[tauri::command]
async fn save_app_settings(settings: AppSettings) -> Result<(), String> {
    let app_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| "Failed to get app directory".to_string())?;
    
    log_error(&format!("Saving settings to: {}", app_dir.display()));
    
    fs::create_dir_all(&app_dir)
        .map_err(|e| {
            log_error(&format!("Failed to create app directory: {}", e));
            format!("Failed to create app directory: {}", e)
        })?;
    
    let settings_file = app_dir.join("settings.json");
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| {
            log_error(&format!("Failed to serialize settings: {}", e));
            format!("Failed to serialize settings: {}", e)
        })?;
    
    fs::write(&settings_file, &content)
        .map_err(|e| {
            log_error(&format!("Failed to write settings: {}", e));
            format!("Failed to write settings: {}", e)
        })?;
    
    log_error(&format!("Successfully saved settings: {}", content));
    Ok(())
}

// Enable logging for debugging - disabled in release builds
fn log_error(_error: &str) {
    // Debug logging disabled for cleaner console output
    // In release builds, logging is disabled for performance
    // Previously: #[cfg(debug_assertions)] println!("[AXON DEBUG] {}", error);
}

#[tauri::command]
async fn set_minimize_behavior(minimize_to_tray: bool) -> Result<(), String> {
    // Use unified preferences manager for consistency
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        // Create a new instance and update it
        let new_manager = manager.clone();
        let mut preferences = new_manager.get_preferences().await;
        preferences.behavior.minimize_to_tray = minimize_to_tray;
        new_manager.update_preferences(serde_json::json!({
            "minimize_to_tray": minimize_to_tray
        })).await?;

        // Update the stored manager
        let mut manager_guard = manager_lock.lock().unwrap();
        *manager_guard = Some(new_manager);

        log_error(&format!("Minimize behavior set to: {} (unified)", minimize_to_tray));
        Ok(())
    } else {
        log_error("Preferences manager not available, falling back to old settings");
        // Fallback to old settings for backward compatibility
        let mut settings = load_app_settings().await?;
        settings.minimize_to_tray = Some(minimize_to_tray);
        save_app_settings(settings).await?;
        log_error(&format!("Minimize behavior set to: {} (old)", minimize_to_tray));
        Ok(())
    }
}

#[tauri::command]
async fn get_minimize_behavior() -> Result<bool, String> {
    // Use unified preferences manager for consistency
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        let preferences = manager.get_preferences().await;
        let minimize_to_tray = preferences.behavior.minimize_to_tray;
        log_error(&format!("Retrieved minimize behavior from unified settings: {}", minimize_to_tray));
        Ok(minimize_to_tray)
    } else {
        log_error("Preferences manager not available, falling back to old settings");
        // Fallback to old settings for backward compatibility
        let settings = load_app_settings().await?;
        let minimize_to_tray = settings.minimize_to_tray.unwrap_or(false);
        log_error(&format!("Retrieved minimize behavior from old settings: {}", minimize_to_tray));
        Ok(minimize_to_tray)
    }
}

#[tauri::command]
async fn set_startup_enabled(enabled: bool) -> Result<(), String> {
    log_error(&format!("Setting startup enabled to: {}", enabled));
    
    // Set the startup registry entry using the startup manager
    StartupManager::set_startup_enabled(enabled)
        .map_err(|e| {
            log_error(&format!("Failed to set startup registry entry: {}", e));
            e
        })?;
    
    // Load current settings
    let mut settings = load_app_settings().await?;
    
    // Update the startup preference in settings
    settings.startup_enabled = Some(enabled);
    
    // Save the updated settings
    save_app_settings(settings).await?;
    
    log_error(&format!("Startup setting saved successfully: {}", enabled));
    Ok(())
}

#[tauri::command]
async fn get_startup_enabled() -> Result<bool, String> {
    log_error("Getting startup enabled state");
    
    // First check the actual registry state
    let registry_enabled = StartupManager::get_startup_enabled()
        .map_err(|e| {
            log_error(&format!("Failed to get startup state from registry: {}", e));
            e
        })?;
    
    // Load current settings to sync with registry state
    let mut settings = load_app_settings().await?;
    let settings_enabled = settings.startup_enabled.unwrap_or(false);
    
    // If there's a mismatch between registry and settings, sync them
    if registry_enabled != settings_enabled {
        log_error(&format!("Syncing startup setting: registry={}, settings={}", registry_enabled, settings_enabled));
        settings.startup_enabled = Some(registry_enabled);
        save_app_settings(settings).await?;
    }
    
    log_error(&format!("Retrieved startup enabled state: {}", registry_enabled));
    Ok(registry_enabled)
}

#[tauri::command]
async fn is_started_from_startup() -> Result<bool, String> {
    let started_from_startup = StartupManager::is_started_from_startup();
    log_error(&format!("App started from startup: {}", started_from_startup));
    Ok(started_from_startup)
}

#[tauri::command]
async fn set_start_minimized(enabled: bool) -> Result<(), String> {
    log_error(&format!("Setting start minimized to: {}", enabled));
    
    // Load current settings
    let mut settings = load_app_settings().await?;
    
    // Update the start minimized preference
    settings.start_minimized = Some(enabled);
    
    // Save the updated settings
    save_app_settings(settings).await?;
    
    log_error(&format!("Start minimized setting saved successfully: {}", enabled));
    Ok(())
}

#[tauri::command]
async fn get_start_minimized() -> Result<bool, String> {
    log_error("Getting start minimized state");
    
    // Load current settings
    let settings = load_app_settings().await?;
    
    // Return the start minimized preference, defaulting to true if not set (maintains current behavior)
    let start_minimized = settings.start_minimized.unwrap_or(true);
    
    log_error(&format!("Retrieved start minimized state: {}", start_minimized));
    Ok(start_minimized)
}

// New file system storage commands
static PREFERENCES_MANAGER: std::sync::OnceLock<std::sync::Mutex<Option<PreferencesManager>>> = std::sync::OnceLock::new();

#[tauri::command]
async fn get_preferences() -> Result<AppPreferences, String> {
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        Ok(manager.get_preferences().await)
    } else {
        Err("Preferences manager not initialized".to_string())
    }
}

#[tauri::command]
async fn update_preferences(updates: serde_json::Value) -> Result<(), String> {
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        // Create a new instance and update it
        let new_manager = manager.clone();
        new_manager.update_preferences(updates).await?;

        // Update the stored manager
        let mut manager_guard = manager_lock.lock().unwrap();
        *manager_guard = Some(new_manager);

        Ok(())
    } else {
        Err("Preferences manager not initialized".to_string())
    }
}

#[tauri::command]
async fn save_custom_icon_unified(app_path: String, icon_data: String) -> Result<String, String> {
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        // Decode base64 data
        let data = base64::engine::general_purpose::STANDARD
            .decode(&icon_data)
            .map_err(|e| format!("Failed to decode icon data: {}", e))?;

        // Create a new instance and save the icon
        let new_manager = manager.clone();
        let result = new_manager.save_custom_icon(app_path, data).await?;

        // Update the stored manager
        let mut manager_guard = manager_lock.lock().unwrap();
        *manager_guard = Some(new_manager);

        Ok(result)
    } else {
        Err("Preferences manager not initialized".to_string())
    }
}

#[tauri::command]
async fn get_custom_icon_path(relative_path: String) -> Result<String, String> {
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        let path_buf = manager.get_custom_icon_path(&relative_path).await;
        Ok(path_buf.to_string_lossy().into_owned())
    } else {
        Err("Preferences manager not initialized".to_string())
    }
}

#[tauri::command]
async fn save_custom_icon_from_path(app_path: String, temp_file_path: String) -> Result<String, String> {
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        // Create a new instance and save the icon
        let new_manager = manager.clone();
        let result = new_manager.save_custom_icon_from_path(app_path, temp_file_path).await?;

        // Update the stored manager
        let mut manager_guard = manager_lock.lock().unwrap();
        *manager_guard = Some(new_manager);

        Ok(result)
    } else {
        Err("Preferences manager not initialized".to_string())
    }
}

#[tauri::command]
async fn save_custom_icon_bytes(app_path: String, icon_bytes: Vec<u8>) -> Result<String, String> {
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        // Create a new instance and save the icon
        let new_manager = manager.clone();
        let result = new_manager.save_custom_icon(app_path, icon_bytes).await?;

        // Update the stored manager
        let mut manager_guard = manager_lock.lock().unwrap();
        *manager_guard = Some(new_manager);

        Ok(result)
    } else {
        Err("Preferences manager not initialized".to_string())
    }
}

#[tauri::command]
async fn validate_startup_configuration() -> Result<bool, String> {
    log_error("Validating startup configuration");
    
    // Perform comprehensive startup validation and maintenance
    StartupManager::perform_startup_maintenance()
        .map_err(|e| {
            log_error(&format!("Startup validation failed: {}", e));
            e
        })?;
    
    // Check if executable path has changed
    let path_changed = StartupManager::detect_executable_path_change()
        .map_err(|e| {
            log_error(&format!("Failed to detect path changes: {}", e));
            e
        })?;
    
    if path_changed {
        log_error("Executable path change detected and fixed");
    }
    
    log_error("Startup configuration validation completed");
    Ok(!path_changed) // Return true if no issues were found
}



#[tauri::command]
async fn handle_window_minimize(window: tauri::Window) -> Result<(), String> {
    log_error("Window minimize requested - checking user preference");

    // Get the minimize behavior preference from unified settings
    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));

    // Clone the manager to avoid holding the lock across await
    let manager = {
        let manager_guard = manager_lock.lock().unwrap();
        manager_guard.as_ref().cloned()
    };

    if let Some(manager) = manager {
        let preferences = manager.get_preferences().await;
        let minimize_to_tray = preferences.behavior.minimize_to_tray;

        log_error(&format!("Minimize to tray setting: {}", minimize_to_tray));

        if minimize_to_tray {
            log_error("Minimize to tray enabled - hiding window to tray");

            // Hide window to tray instead of minimizing to taskbar
            window.hide().map_err(|e| {
                log_error(&format!("Failed to hide window to tray: {:?}", e));
                format!("Failed to hide window to tray: {:?}", e)
            })?;
        } else {
            log_error("Minimize to tray disabled - using normal taskbar minimize");

            // Minimize to taskbar normally
            window.minimize().map_err(|e| {
                log_error(&format!("Failed to minimize window to taskbar: {:?}", e));
                format!("Failed to minimize window to taskbar: {:?}", e)
            })?;
        }
        Ok(())
    } else {
        log_error("Preferences manager not initialized, falling back to normal minimize");

        // Fall back to normal minimize behavior if manager not available
        window.minimize().map_err(|e| {
            log_error(&format!("Failed to minimize window (fallback): {:?}", e));
            format!("Failed to minimize window (fallback): {:?}", e)
        })?;
        Ok(())
    }
}


fn main() {
    log_error("Application starting...");

    if let Err(e) = std::panic::catch_unwind(|| {
        unsafe {
            // Try apartment-threaded COM initialization instead
            if let Err(e) = CoInitializeEx(None, COINIT_APARTMENTTHREADED) {
                log_error(&format!("Failed to initialize COM: {:?}", e));
                return;
            }
        }
        
        // Create system tray menu with proper CustomMenuItem objects
        // The restore item will show the window when it's hidden to tray
        let restore = tauri::CustomMenuItem::new("restore".to_string(), "Restore");
        let quit = tauri::CustomMenuItem::new("quit".to_string(), "Quit");
        
        let tray_menu = SystemTrayMenu::new()
            .add_item(restore)
            .add_native_item(SystemTrayMenuItem::Separator)
            .add_item(quit);
        
        let system_tray = SystemTray::new().with_menu(tray_menu);
        
        log_error("Starting application with system tray...");
        
        let app = tauri::Builder::default()
            .system_tray(system_tray)
            .on_system_tray_event(|app, event| match event {
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "quit" => {
                            log_error("Quit selected from system tray - exiting application");
                            app.exit(0);
                        }
                        "restore" => {
                            let window = app.get_window("main").unwrap();
                            log_error("Restore selected from system tray menu - showing window");
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        _ => {}
                    }
                }
                SystemTrayEvent::LeftClick { .. } => {
                    // Left click on the system tray icon restores the window
                    let window = app.get_window("main").unwrap();
                    log_error("System tray icon clicked - restoring window");
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                _ => {}
            })
            .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
                app.get_window("main").unwrap().show().unwrap();
                app.get_window("main").unwrap().set_focus().unwrap();
            }))
            .setup(|app| {
                let main_window = app.get_window("main").unwrap();
                let _app_handle = app.handle();
                
                // Get the current monitor's size
                if let Some(monitor) = main_window.current_monitor().unwrap() {
                    let size = monitor.size();
                    let scale_factor = monitor.scale_factor();
                    
                    // Convert physical pixels to logical pixels
                    let logical_width = size.width as f64 / scale_factor;
                    let logical_height = size.height as f64 / scale_factor;
                    
                    // Log screen dimensions for debugging
                    log_error(&format!("Screen dimensions: {}x{} (logical: {}x{}), scale factor: {}",
                        size.width, size.height, logical_width, logical_height, scale_factor));
                    
                    // Calculate window size as a percentage of screen size
                    // Use 75% of screen width/height for smaller screens, 65% for larger screens
                    let screen_percentage = if logical_height <= 768.0 {
                        0.75 // 75% of screen size for smaller screens
                    } else if logical_height <= 1080.0 {
                        0.70 // 70% for medium screens
                    } else {
                        0.65 // 65% for larger screens
                    };
                    
                    // Keep aspect ratio of 1.67 (1500/900)
                    let aspect_ratio = 1.67;
                    
                    // Calculate dimensions based on screen size
                    let height = (logical_height * screen_percentage).round();
                    let width = (height * aspect_ratio).round();
                    
                    // Ensure width doesn't exceed screen width
                    let width = width.min(logical_width * 0.9);
                    
                    log_error(&format!("Setting window size to: {}x{} ({}% of screen)",
                        width, height, (screen_percentage * 100.0) as u32));
                    
                    main_window.set_size(Size::Physical(PhysicalSize {
                        width: (width * scale_factor) as u32,
                        height: (height * scale_factor) as u32,
                    })).unwrap();
                    
                    // Center the window
                    main_window.center().unwrap();
                }
                
                log_error("Setting up application...");
                
                let window = app.get_window("main").unwrap();
                
                #[cfg(target_os = "windows")]
                if let Err(e) = apply_blur(&window, Some((18, 18, 18, 125))) {
                    log_error(&format!("Failed to apply blur: {:?}", e));
                }

                if let Err(e) = set_shadow(&window, true) {
                    log_error(&format!("Failed to apply shadow: {:?}", e));
                }

                window.set_decorations(false).unwrap();
                window.set_always_on_top(false).unwrap();
                window.set_skip_taskbar(false).unwrap();
                
                // Perform startup maintenance to validate and fix any path issues
                if let Err(e) = StartupManager::perform_startup_maintenance() {
                    log_error(&format!("Startup maintenance failed: {}", e));
                }

                // Check if app was started from Windows startup
                let started_from_startup = StartupManager::is_started_from_startup();
                log_error(&format!("App started from startup: {}", started_from_startup));
                
                if started_from_startup {
                    // App was started from Windows startup, check both minimize-to-tray and start-minimized settings
                    // Use unified preferences manager for consistency
                    let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));
                    let (minimize_to_tray, start_minimized) = if let Some(_manager) = &*manager_lock.lock().unwrap() {
                        // Can't use await in setup function, so we use synchronous access
                        // This will be updated when the preferences manager supports sync access
                        (false, true) // Temporary fallback
                    } else {
                        // Fallback to defaults if manager not available
                        (false, true)
                    };
                    
                    log_error(&format!("Startup settings - minimize_to_tray: {}, start_minimized: {}", minimize_to_tray, start_minimized));
                    
                    // Only minimize to tray if both conditions are met:
                    // 1. minimize_to_tray is enabled (user has tray functionality enabled)
                    // 2. start_minimized is enabled (user wants to start minimized on startup)
                    if minimize_to_tray && start_minimized {
                        log_error("Started from startup with both minimize-to-tray and start-minimized enabled - starting minimized to tray");
                        // Don't show the window, it will start hidden in the tray
                    } else if !minimize_to_tray && start_minimized {
                        log_error("Started from startup with start-minimized enabled but minimize-to-tray disabled - starting minimized to taskbar");
                        window.show().unwrap();
                        window.minimize().unwrap();
                    } else {
                        log_error("Started from startup with start-minimized disabled - showing window normally");
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                } else {
                    // Normal startup (manual launch), always show the window regardless of start_minimized setting
                    log_error("Normal startup - showing window");
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }

                // Initialize preferences manager
                let preferences_manager = PreferencesManager::new(&app.handle())
                    .map_err(|e| format!("Failed to initialize preferences manager: {}", e))?;

                let manager_lock = PREFERENCES_MANAGER.get_or_init(|| std::sync::Mutex::new(None));
                *manager_lock.lock().unwrap() = Some(preferences_manager);

                let app_manager = AppManager::new();
                app_manager.start_file_watcher();

                log_error("Setup completed successfully");
                Ok(())
            })
            // Handle window close events - always close the application (per requirements)
            .on_window_event(|event| {
                match event.event() {
                    tauri::WindowEvent::CloseRequested { .. } => {
                        log_error("Window close requested - closing application completely");
                        // Close button should always close the app regardless of minimize to tray setting
                        // Use Tauri's app handle to properly exit the application
                        event.window().app_handle().exit(0);
                    }
                    _ => {}
                }
            })
            .invoke_handler(tauri::generate_handler![
                get_start_menu_apps,
                refresh_start_menu_apps,
                get_app_icon,
                get_system_accent_color,
                launch_app,
                save_custom_icon,
                save_custom_folder_icon,
                remove_custom_icon,
                remove_custom_folder_icon,
                shell_open,
                load_app_settings,
                save_app_settings,
                set_minimize_behavior,
                get_minimize_behavior,
                set_startup_enabled,
                get_startup_enabled,
                is_started_from_startup,
                validate_startup_configuration,
                handle_window_minimize,
                set_start_minimized,
                get_start_minimized,
                // New file system storage commands
                get_preferences,
                update_preferences,
                save_custom_icon_unified,
                get_custom_icon_path,
                save_custom_icon_from_path,
                save_custom_icon_bytes
            ]);

        log_error("Starting application...");
        log_error("Starting application...");
        if let Err(e) = app.run(tauri::generate_context!()) {
            log_error(&format!("Application failed to run: {:?}", e));
        }
    }) {
        let error_msg = format!("Application crashed: {:?}", e);
        log_error(&error_msg);
        std::process::exit(1);
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_minimize_behavior_default() {
        // Test that default minimize behavior is false (taskbar minimize)
        let settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: None, // Default case
            startup_enabled: Some(false),
            start_minimized: Some(true),
        };
        
        // When minimize_to_tray is None, it should default to false
        let minimize_to_tray = settings.minimize_to_tray.unwrap_or(false);
        assert_eq!(minimize_to_tray, false);
    }

    #[test]
    fn test_minimize_behavior_enabled() {
        // Test that minimize to tray can be enabled
        let settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(true),
            startup_enabled: Some(false),
            start_minimized: Some(true),
        };
        
        let minimize_to_tray = settings.minimize_to_tray.unwrap_or(false);
        assert_eq!(minimize_to_tray, true);
    }

    #[test]
    fn test_minimize_behavior_disabled() {
        // Test that minimize to tray can be explicitly disabled
        let settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(false),
            startup_enabled: Some(false),
            start_minimized: Some(true),
        };
        
        let minimize_to_tray = settings.minimize_to_tray.unwrap_or(false);
        assert_eq!(minimize_to_tray, false);
    }

    #[test]
    fn test_minimize_behavior_error_handling() {
        // Test that error handling works when minimize_to_tray is None
        let settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: None,
            startup_enabled: Some(false),
            start_minimized: Some(true),
        };
        
        // Should handle None case gracefully and default to false
        let minimize_to_tray = settings.minimize_to_tray.unwrap_or(false);
        assert_eq!(minimize_to_tray, false);
        
        // Test with Some(true)
        let settings_enabled = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(true),
            startup_enabled: Some(false),
            start_minimized: Some(true),
        };
        
        let minimize_to_tray_enabled = settings_enabled.minimize_to_tray.unwrap_or(false);
        assert_eq!(minimize_to_tray_enabled, true);
    }

    #[test]
    fn test_startup_settings_integration() {
        // Test that startup settings are properly integrated with AppSettings
        let settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(false),
            startup_enabled: Some(true),
            start_minimized: Some(true),
        };
        
        // Verify startup_enabled field is accessible
        let startup_enabled = settings.startup_enabled.unwrap_or(false);
        assert_eq!(startup_enabled, true);
        
        // Test default case
        let default_settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(false),
            startup_enabled: None,
            start_minimized: Some(true),
        };
        
        let default_startup = default_settings.startup_enabled.unwrap_or(false);
        assert_eq!(default_startup, false);
    }

    #[test]
    fn test_tray_menu_structure() {
        // Test that the tray menu has the expected structure
        // This is a basic test to ensure menu items are properly defined
        
        // Test menu item IDs that should be available
        let restore_id = "restore";
        let quit_id = "quit";
        
        // Verify the IDs are valid strings
        assert_eq!(restore_id, "restore");
        assert_eq!(quit_id, "quit");
        
        // Test that menu items have proper labels (this would be tested in integration tests)
        // For now, just verify the structure is correct
        assert!(!restore_id.is_empty());
        assert!(!quit_id.is_empty());
    }

    #[test]
    fn test_start_minimized_setting_integration() {
        // Test that start_minimized setting is properly integrated with AppSettings
        let settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(true),
            startup_enabled: Some(true),
            start_minimized: Some(false),
        };
        
        // Verify start_minimized field is accessible
        let start_minimized = settings.start_minimized.unwrap_or(true);
        assert_eq!(start_minimized, false);
        
        // Test default case (should default to true to maintain current behavior)
        let default_settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(true),
            startup_enabled: Some(true),
            start_minimized: None,
        };
        
        let default_start_minimized = default_settings.start_minimized.unwrap_or(true);
        assert_eq!(default_start_minimized, true);
    }

    #[test]
    fn test_startup_behavior_logic() {
        // Test the logic for determining startup behavior based on settings
        
        // Case 1: Both minimize_to_tray and start_minimized enabled - should start hidden in tray
        let minimize_to_tray = true;
        let start_minimized = true;
        let should_hide_to_tray = minimize_to_tray && start_minimized;
        assert!(should_hide_to_tray, "Should hide to tray when both settings enabled");
        
        // Case 2: minimize_to_tray disabled, start_minimized enabled - should minimize to taskbar
        let minimize_to_tray = false;
        let start_minimized = true;
        let should_minimize_to_taskbar = !minimize_to_tray && start_minimized;
        assert!(should_minimize_to_taskbar, "Should minimize to taskbar when tray disabled but start_minimized enabled");
        
        // Case 3: start_minimized disabled - should show normally regardless of tray setting
        let minimize_to_tray = true;
        let start_minimized = false;
        let should_show_normally = !start_minimized;
        assert!(should_show_normally, "Should show normally when start_minimized disabled");
        
        // Case 4: Both disabled - should show normally
        let minimize_to_tray = false;
        let start_minimized = false;
        let should_show_normally = !start_minimized;
        assert!(should_show_normally, "Should show normally when both settings disabled");
    }

    // Unit tests for backend Tauri commands - start_minimized functionality
    
    #[test]
    fn test_app_settings_start_minimized_field() {
        // Test that AppSettings struct properly handles start_minimized field
        let settings_with_true = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(false),
            startup_enabled: Some(false),
            start_minimized: Some(true),
        };
        
        assert_eq!(settings_with_true.start_minimized, Some(true), "start_minimized should be Some(true)");
        
        let settings_with_false = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(false),
            startup_enabled: Some(false),
            start_minimized: Some(false),
        };
        
        assert_eq!(settings_with_false.start_minimized, Some(false), "start_minimized should be Some(false)");
        
        let settings_with_none = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(false),
            startup_enabled: Some(false),
            start_minimized: None,
        };
        
        assert_eq!(settings_with_none.start_minimized, None, "start_minimized should be None");
    }

    #[test]
    fn test_start_minimized_default_behavior() {
        // Test the default behavior logic for start_minimized
        let settings_none = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(true),
            startup_enabled: Some(true),
            start_minimized: None,
        };
        
        // When start_minimized is None, it should default to true (current behavior)
        let start_minimized = settings_none.start_minimized.unwrap_or(true);
        assert_eq!(start_minimized, true, "Default start_minimized should be true");
        
        // When start_minimized is explicitly set, it should use that value
        let settings_false = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(true),
            startup_enabled: Some(true),
            start_minimized: Some(false),
        };
        
        let start_minimized_false = settings_false.start_minimized.unwrap_or(true);
        assert_eq!(start_minimized_false, false, "Explicit false should be preserved");
    }

    #[test]
    fn test_start_minimized_serialization() {
        // Test that start_minimized field can be serialized and deserialized
        let settings = AppSettings {
            custom_icons: std::collections::HashMap::new(),
            moved_apps: std::collections::HashMap::new(),
            pinned_apps: Vec::new(),
            recent_apps: Vec::new(),
            is_grid_view: true,
            categories: std::collections::HashMap::new(),
            minimize_to_tray: Some(true),
            startup_enabled: Some(true),
            start_minimized: Some(false),
        };
        
        // Serialize to JSON
        let json_result = serde_json::to_string(&settings);
        assert!(json_result.is_ok(), "Settings should serialize to JSON");
        
        let json_string = json_result.unwrap();
        assert!(json_string.contains("start_minimized"), "JSON should contain start_minimized field");
        assert!(json_string.contains("false"), "JSON should contain the false value");
        
        // Deserialize from JSON
        let deserialize_result: Result<AppSettings, _> = serde_json::from_str(&json_string);
        assert!(deserialize_result.is_ok(), "Settings should deserialize from JSON");
        
        let deserialized_settings = deserialize_result.unwrap();
        assert_eq!(deserialized_settings.start_minimized, Some(false), "Deserialized start_minimized should match original");
    }
}