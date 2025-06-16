use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};
use std::collections::HashSet;
use windows::Win32::UI::Shell::{IShellLinkW, ShellLink};
use windows::Win32::System::Com::{IPersistFile, CoCreateInstance, CLSCTX_INPROC_SERVER, STGM_READ};
use windows::Win32::Storage::FileSystem::WIN32_FIND_DATAW;
use notify::Watcher;
use windows::core::{PCWSTR, ComInterface};
use std::time::{Duration, SystemTime};
use std::fs;
use std::io::{Read, Write};
use std::fs::OpenOptions;

// Empty logging function that does nothing - completely eliminates logging
fn log_error(_error: &str) {
    // No logging at all
}

#[derive(Debug, Clone, Serialize, Deserialize, Hash, Eq, PartialEq)]
pub struct AppInfo {
    pub name: String,
    pub path: String,
    pub category: String,
    pub icon: Option<String>,
}

// Cache structure to store app data with timestamp
#[derive(Debug, Serialize, Deserialize)]
struct AppCache {
    apps: Vec<AppInfo>,
    timestamp: u64,  // Unix timestamp for expiration check
}

pub struct AppManager {
    apps: Arc<Mutex<HashSet<AppInfo>>>,
    cache_path: PathBuf,
    cache_ttl: Duration,  // Time-to-live for cache
}

impl AppManager {
    pub fn new() -> Self {
        // Get cache directory
        let cache_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
            .unwrap_or_else(|| PathBuf::from("."));
        
        // Create cache directory if it doesn't exist
        if !cache_dir.exists() {
            let _ = fs::create_dir_all(&cache_dir);
        }
        
        let cache_path = cache_dir.join("apps_cache.json");
        
        Self {
            apps: Arc::new(Mutex::new(HashSet::new())),
            cache_path,
            cache_ttl: Duration::from_secs(3600),  // 1 hour cache TTL
        }
    }
    
    // Read from cache file
    fn read_cache(&self) -> Option<AppCache> {
        match fs::File::open(&self.cache_path) {
            Ok(mut file) => {
                let mut contents = String::new();
                if file.read_to_string(&mut contents).is_ok() {
                    if let Ok(cache) = serde_json::from_str::<AppCache>(&contents) {
                        return Some(cache);
                    }
                }
            }
            Err(_) => {}
        }
        None
    }
    
    // Write to cache file
    fn write_cache(&self, apps: &Vec<AppInfo>) {
        let cache = AppCache {
            apps: apps.clone(),
            timestamp: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        };
        
        if let Ok(contents) = serde_json::to_string(&cache) {
            if let Ok(mut file) = fs::File::create(&self.cache_path) {
                let _ = file.write_all(contents.as_bytes());
            }
        }
    }
    
    // Check if cache is valid
    fn is_cache_valid(&self, cache: &AppCache) -> bool {
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        // Cache is valid if less than TTL has elapsed
        now - cache.timestamp < self.cache_ttl.as_secs()
    }

    pub fn start_file_watcher(&self) {
        let start_menu = Self::get_start_menu_path();
        let apps = Arc::clone(&self.apps);
        
        std::thread::spawn(move || {
            let (tx, rx) = std::sync::mpsc::channel();
            
            let mut watcher = notify::recommended_watcher(move |res| {
                if let Ok(event) = res {
                    let _ = tx.send(event);
                }
            }).unwrap();

            watcher.watch(&start_menu, notify::RecursiveMode::Recursive).unwrap();

            for event in rx {
                match event.kind {
                    notify::EventKind::Create(_) | notify::EventKind::Modify(_) => {
                        // Rescan the directory
                        if let Ok(new_apps) = Self::scan_shortcuts() {
                            let mut apps_lock = apps.lock().unwrap();
                            *apps_lock = new_apps.into_iter().collect();
                        }
                    },
                    _ => {}
                }
            }
        });
    }

    fn get_start_menu_path() -> PathBuf {
        let appdata = std::env::var("APPDATA").unwrap();
        PathBuf::from(appdata)
            .join("Microsoft")
            .join("Windows")
            .join("Start Menu")
    }

    pub fn scan_shortcuts() -> Result<Vec<AppInfo>, String> {
        // Create a temporary instance to access cache
        let manager = Self::new();
        
        // Check cache first
        if let Some(cache) = manager.read_cache() {
            if manager.is_cache_valid(&cache) {
                return Ok(cache.apps);
            }
        }
        
        // Cache invalid or missing, perform fresh scan
        let paths = vec![
            std::env::var("ProgramData").map(|p| format!("{}\\Microsoft\\Windows\\Start Menu\\Programs", p)),
            std::env::var("APPDATA").map(|p| format!("{}\\Microsoft\\Windows\\Start Menu\\Programs", p)),
        ];

        let valid_paths: Vec<_> = paths.into_iter()
            .filter_map(Result::ok)
            .collect();

        log_error(&format!("Scanning {} valid Start Menu paths", valid_paths.len()));
        
        // Process paths sequentially for more reliable results
        let mut all_apps = HashSet::new();
        for path in &valid_paths {
            log_error(&format!("Scanning path: {}", path));
            if let Ok(path_apps) = Self::scan_directory(&PathBuf::from(path)) {
                log_error(&format!("Found {} apps in {}", path_apps.len(), path));
                all_apps.extend(path_apps);
            }
        }
        
        // Convert to vector
        let apps = all_apps;
        log_error(&format!("Total unique apps found: {}", apps.len()));

        let result: Vec<AppInfo> = apps.into_iter().collect();
        
        // Update cache with new results
        manager.write_cache(&result);
        
        Ok(result)
    }

    fn scan_directory(dir: &PathBuf) -> Result<Vec<AppInfo>, String> {
        let mut apps = Vec::new();
        
        // Log directory being scanned
        log_error(&format!("Scanning directory: {}", dir.display()));
        
        // No file count limiter - we want to scan all files
        
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                
                if path.is_dir() {
                    // Skip only Windows system directories by exact match
                    let skip_dirs = [
                        "windows", "system32", "systemapps", "syswow64",
                        "winsxs", "assembly", "microsoft.net"
                    ];
                    
                    let dir_name = path.file_name()
                        .map(|name| name.to_string_lossy().to_lowercase())
                        .unwrap_or_default();
                    
                    if !skip_dirs.iter().any(|&skip| dir_name == skip) {
                        // Recursively scan subdirectory
                        if let Ok(mut subdir_apps) = Self::scan_directory(&path) {
                            apps.append(&mut subdir_apps);
                        }
                    }
                } else if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    // Process both .lnk and .url files
                    if ext_str == "lnk" {
                        // Handle .lnk files using shell link API
                        unsafe {
                            let shell_link: IShellLinkW = CoCreateInstance(
                                &ShellLink,
                                None,
                                CLSCTX_INPROC_SERVER
                            ).map_err(|e| e.to_string())?;

                            let persist_file: IPersistFile = shell_link.cast()
                                .map_err(|e| e.to_string())?;
                            
                            let path_wide: Vec<u16> = path.to_string_lossy()
                                .encode_utf16()
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
                            
                            let target = String::from_utf16_lossy(
                                &target_path[..target_path.iter().position(|&x| x == 0).unwrap_or(260)]
                            );
                            let name = path.file_stem()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .into_owned();
                            
                            let target_path = target.clone(); // Clone before moving
                            apps.push(AppInfo {
                                name,
                                path: target,
                                category: Self::determine_category(&PathBuf::from(&target_path)),
                                icon: None,
                            });
                        }
                    } else if ext_str == "url" {
                        // Handle .url files by parsing the URL file directly
                        log_error(&format!("Processing URL file: {}", path.display()));
                        
                        if let Ok(content) = std::fs::read_to_string(&path) {
                            // Parse the URL file content to find the URL
                            let url = content.lines()
                                .find_map(|line| {
                                    if line.starts_with("URL=") {
                                        Some(line.trim_start_matches("URL=").trim().to_string())
                                    } else {
                                        None
                                    }
                                })
                                .unwrap_or_default();
                            
                            if !url.is_empty() {
                                let name = path.file_stem()
                                    .unwrap_or_default()
                                    .to_string_lossy()
                                    .into_owned();
                                
                                log_error(&format!("Found URL app: {} -> {}", name, url));
                                
                                apps.push(AppInfo {
                                    name,
                                    path: url,
                                    category: "Web".into(),
                                    icon: None,
                                });
                            }
                        }
                    }
                }
            }
        }
        
        Ok(apps)
    }

    fn determine_category(path: &std::path::Path) -> String {
        let path_str = path.to_string_lossy().to_lowercase();
        
        if path_str.contains("\\games\\") 
            || path_str.contains("\\steam\\")
            || path_str.contains("\\epic games\\")
            || path_str.contains("\\riot games\\") {
            "Games".into()
        } else if path_str.contains("\\development\\")
            || path_str.contains("\\visual studio\\")
            || path_str.contains("\\jetbrains\\")
            || path_str.contains("\\git\\") {
            "Development".into()
        } else if path_str.contains("\\media\\")
            || path_str.contains("\\adobe\\")
            || path_str.contains("\\music\\")
            || path_str.contains("\\video\\") {
            "Media".into()
        } else if path_str.contains("\\utilities\\")
            || path_str.contains("\\system tools\\")
            || path_str.contains("\\accessories\\") {
            "Utilities".into()
        } else {
            "Other".into()
        }
    }
}