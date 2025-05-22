// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, Manager, PhysicalSize, Size};
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
use std::fs::OpenOptions;
use std::io::Write;
use image;
use image::ImageEncoder;
use windows::Win32::UI::Shell::ShellExecuteW;
use windows::core::HSTRING;
use windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES;
use windows::Win32::System::Com::{
    CoInitializeEx, COINIT_APARTMENTTHREADED
};
use windows::Win32::Storage::FileSystem::WIN32_FIND_DATAW;
use std::path::PathBuf;
use md5;

mod app_manager;
use app_manager::AppManager;

#[derive(Serialize, Deserialize, Debug)]
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
}

#[tauri::command]
async fn get_start_menu_apps() -> Result<Vec<AppInfo>, String> {
    let mut apps = Vec::new();
    
    // Common Start Menu paths
    let paths = vec![
        std::env::var("ProgramData").unwrap() + "\\Microsoft\\Windows\\Start Menu\\Programs",
        std::env::var("APPDATA").unwrap() + "\\Microsoft\\Windows\\Start Menu\\Programs",
    ];

    for start_menu_path in paths {
        scan_directory(&Path::new(&start_menu_path), &mut apps)?;
    }

    Ok(apps)
}

fn scan_directory(dir: &Path, apps: &mut Vec<AppInfo>) -> Result<(), String> {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            
            if path.is_dir() {
                scan_directory(&path, apps)?;
            } else if let Some(ext) = path.extension() {
                if ext == "lnk" || ext == "exe" || ext == "url" {
                    if let Some(app_info) = create_app_info(&path) {
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
            // If first attempt fails, try with the executable directly
            if path.to_lowercase().ends_with(".lnk") {
                if let Ok(target_path) = resolve_shortcut(path) {
                    return get_app_icon_internal(&target_path);
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
async fn set_launch_at_startup(enable: bool) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey_with_flags(
        "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        KEY_SET_VALUE | KEY_QUERY_VALUE,
    ).map_err(|e| e.to_string())?;

    let app_name = "AppHub";
    let exe_path = std::env::current_exe()
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .into_owned();

    if enable {
        run_key.set_value(app_name, &exe_path)
            .map_err(|e| e.to_string())?;
    } else {
        run_key.delete_value(app_name)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
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

    // Decode base64 and save the image
    let icon_bytes = base64::engine::general_purpose::STANDARD
        .decode(icon_data.split(",").last().unwrap_or(&icon_data))
        .map_err(|e| format!("Failed to decode icon data: {}", e))?;

    // Write the file atomically to prevent any file system watchers from triggering
    let temp_path = icon_path.with_extension("tmp");
    fs::write(&temp_path, &icon_bytes)
        .map_err(|e| format!("Failed to save temporary icon: {}", e))?;
    
    fs::rename(&temp_path, &icon_path)
        .map_err(|e| format!("Failed to save icon: {}", e))?;

    Ok(icon_path.to_string_lossy().into_owned())
}

#[tauri::command]
async fn remove_custom_icon(app_path: String) -> Result<String, String> {
    // Get the app's data directory
    let app_data_dir = tauri::api::path::app_dir(&tauri::Config::default())
        .ok_or_else(|| "Failed to get app directory".to_string())?;
    
    let custom_icons_dir = app_data_dir.join("custom_icons");
    let hash = format!("{:x}", md5::compute(&app_path));
    let icon_path = custom_icons_dir.join(format!("{}.png", hash));

    // Remove the icon file if it exists
    if icon_path.exists() {
        fs::remove_file(&icon_path)
            .map_err(|e| format!("Failed to remove custom icon: {}", e))?;
    }

    // Get the original icon
    get_app_icon_internal(&app_path)
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

fn log_error(error: &str) {
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("app.log")
    {
        if let Err(e) = writeln!(file, "{}: {}", chrono::Local::now(), error) {
            eprintln!("Failed to write to log file: {}", e);
        }
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
        
        let quit = CustomMenuItem::new("quit".to_string(), "Quit");
        let show = CustomMenuItem::new("show".to_string(), "Show");
        let hide = CustomMenuItem::new("hide".to_string(), "Hide");
        
        let tray_menu = SystemTrayMenu::new()
            .add_item(show)
            .add_item(hide)
            .add_item(quit);
        
        let tray = SystemTray::new().with_menu(tray_menu);

        let app = tauri::Builder::default()
            .system_tray(tray)
            .setup(|app| {
                let main_window = app.get_window("main").unwrap();
                
                // Get the current monitor's size
                if let Some(monitor) = main_window.current_monitor().unwrap() {
                    let size = monitor.size();
                    let scale_factor = monitor.scale_factor();
                    
                    // Convert physical pixels to logical pixels
                    let logical_width = size.width as f64 / scale_factor;
                    let logical_height = size.height as f64 / scale_factor;
                    
                    // Calculate window size based on screen resolution
                    // Keep aspect ratio of 1.67 (1500/900)
                    let window_size = match logical_height as u32 {
                        h if h <= 720 => (1000, 600),    // 720p
                        h if h <= 1080 => (1200, 720),   // 1080p
                        h if h <= 1440 => (1500, 900),   // 1440p
                        _ => (1800, 1080),               // 4K and above
                    };
                    
                    main_window.set_size(Size::Physical(PhysicalSize {
                        width: (window_size.0 as f64 * scale_factor) as u32,
                        height: (window_size.1 as f64 * scale_factor) as u32,
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

                // Instead of using on_drag_event, we'll handle it through window events
                window.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::FileDrop(_) => {
                            // Ignore file drop events
                        }
                        _ => {}
                    }
                });

                window.set_decorations(false).unwrap();
                window.set_always_on_top(false).unwrap();
                window.set_skip_taskbar(false).unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();

                let app_manager = AppManager::new();
                app_manager.start_file_watcher();

                log_error("Setup completed successfully");
                Ok(())
            })
            .on_window_event(|event| {
                match event.event() {
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        event.window().hide().unwrap();
                        api.prevent_close();
                    }
                    _ => {}
                }
            })
            .on_system_tray_event(|app, event| {
                match event {
                    tauri::SystemTrayEvent::MenuItemClick { id, .. } => {
                        let window = app.get_window("main").unwrap();
                        match id.as_str() {
                            "quit" => {
                                std::process::exit(0);
                            }
                            "show" => {
                                if let Err(e) = window.show() {
                                    log_error(&format!("Failed to show window: {:?}", e));
                                }
                                if let Err(e) = window.set_focus() {
                                    log_error(&format!("Failed to focus window: {:?}", e));
                                }
                            }
                            "hide" => {
                                if let Err(e) = window.hide() {
                                    log_error(&format!("Failed to hide window: {:?}", e));
                                }
                            }
                            _ => {}
                        }
                    }
                    tauri::SystemTrayEvent::LeftClick { .. } => {
                        let window = app.get_window("main").unwrap();
                        match window.is_visible() {
                            Ok(visible) => {
                                if visible {
                                    if let Err(e) = window.hide() {
                                        log_error(&format!("Failed to hide window: {:?}", e));
                                    }
                                } else {
                                    if let Err(e) = window.show() {
                                        log_error(&format!("Failed to show window: {:?}", e));
                                    }
                                    if let Err(e) = window.set_focus() {
                                        log_error(&format!("Failed to focus window: {:?}", e));
                                    }
                                }
                            }
                            Err(e) => log_error(&format!("Failed to check window visibility: {:?}", e)),
                        }
                    }
                    _ => {}
                }
            })
            .invoke_handler(tauri::generate_handler![
                get_start_menu_apps,
                get_app_icon,
                get_system_accent_color,
                set_launch_at_startup,
                launch_app,
                save_custom_icon,
                remove_custom_icon,
                shell_open,
                load_app_settings,
                save_app_settings
            ]);

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