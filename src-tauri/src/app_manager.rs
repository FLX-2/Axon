use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use serde::Serialize;
use rayon::prelude::*;
use std::collections::HashSet;
use windows::Win32::UI::Shell::{IShellLinkW, ShellLink};
use windows::Win32::System::Com::{IPersistFile, CoCreateInstance, CLSCTX_INPROC_SERVER, STGM_READ};
use windows::Win32::Storage::FileSystem::WIN32_FIND_DATAW;
use notify::Watcher;
use windows::core::{PCWSTR, ComInterface};

#[derive(Debug, Clone, Serialize, Hash, Eq, PartialEq)]
pub struct AppInfo {
    pub name: String,
    pub path: String,
    pub category: String,
    pub icon: Option<String>,
}

pub struct AppManager {
    apps: Arc<Mutex<HashSet<AppInfo>>>,
}

impl AppManager {
    pub fn new() -> Self {
        Self {
            apps: Arc::new(Mutex::new(HashSet::new())),
        }
    }

    pub fn start_file_watcher(&self) {
        let start_menu = Self::get_start_menu_path();
        let apps = Arc::clone(&self.apps);
        
        std::thread::spawn(move || {
            let (tx, rx) = std::sync::mpsc::channel();
            
            let mut watcher = notify::recommended_watcher(move |res| {
                if let Ok(event) = res {
                    tx.send(event).unwrap_or_else(|e| eprintln!("Failed to send event: {}", e));
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
        let paths = vec![
            std::env::var("ProgramData").map(|p| format!("{}\\Microsoft\\Windows\\Start Menu\\Programs", p)),
            std::env::var("APPDATA").map(|p| format!("{}\\Microsoft\\Windows\\Start Menu\\Programs", p)),
        ];

        let valid_paths: Vec<_> = paths.into_iter()
            .filter_map(Result::ok)
            .collect();

        let apps: HashSet<AppInfo> = valid_paths.par_iter()
            .flat_map(|path| Self::scan_directory(&PathBuf::from(path)).unwrap_or_default())
            .collect();

        Ok(apps.into_iter().collect())
    }

    fn scan_directory(dir: &PathBuf) -> Result<Vec<AppInfo>, String> {
        let mut apps = Vec::new();
        
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                
                if path.is_dir() {
                    if let Ok(mut subdir_apps) = Self::scan_directory(&path) {
                        apps.append(&mut subdir_apps);
                    }
                } else if let Some(ext) = path.extension() {
                    if ext == "lnk" {
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