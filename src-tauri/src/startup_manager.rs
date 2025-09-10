use winreg::enums::*;
use winreg::RegKey;
use std::path::Path;
use std::env;

/// Windows Registry startup management module
/// Handles setting, getting, and validating startup registry entries
pub struct StartupManager;

impl StartupManager {
    /// Registry key path for Windows startup applications
    const STARTUP_REGISTRY_PATH: &'static str = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run";
    
    /// Application name used as registry entry key
    const APP_REGISTRY_KEY: &'static str = "Axon";

    /// Set the startup registry entry for the application
    /// 
    /// # Arguments
    /// * `enabled` - Whether to enable or disable startup
    /// 
    /// # Returns
    /// * `Ok(())` if successful
    /// * `Err(String)` with error description if failed
    pub fn set_startup_enabled(enabled: bool) -> Result<(), String> {
        if enabled {
            Self::enable_startup()
        } else {
            Self::disable_startup()
        }
    }

    /// Get the current startup state from the registry
    /// 
    /// # Returns
    /// * `Ok(true)` if startup is enabled
    /// * `Ok(false)` if startup is disabled
    /// * `Err(String)` with error description if failed to check
    pub fn get_startup_enabled() -> Result<bool, String> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        
        match hkcu.open_subkey(Self::STARTUP_REGISTRY_PATH) {
            Ok(run_key) => {
                match run_key.get_value::<String, _>(Self::APP_REGISTRY_KEY) {
                    Ok(registry_path) => {
                        // Validate that the registry entry points to a valid executable
                        Self::validate_registry_entry(&registry_path)
                    }
                    Err(_) => {
                        // Key doesn't exist, startup is disabled
                        Ok(false)
                    }
                }
            }
            Err(e) => {
                Err(format!("Failed to access registry: {}", e))
            }
        }
    }

    /// Enable startup by creating registry entry
    fn enable_startup() -> Result<(), String> {
        let exe_path = Self::get_current_exe_path()?;
        
        // Add startup flag to the executable path
        let startup_command = format!("{} --startup", exe_path);
        
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        
        // Open or create the Run key
        let run_key = hkcu.create_subkey(Self::STARTUP_REGISTRY_PATH)
            .map_err(|e| format!("Failed to access registry Run key: {}", e))?
            .0;
        
        // Set the registry entry with the current executable path and startup flag
        run_key.set_value(Self::APP_REGISTRY_KEY, &startup_command)
            .map_err(|e| format!("Failed to set registry value: {}", e))?;
        
        Ok(())
    }

    /// Disable startup by removing registry entry
    fn disable_startup() -> Result<(), String> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        
        match hkcu.open_subkey_with_flags(Self::STARTUP_REGISTRY_PATH, KEY_WRITE) {
            Ok(run_key) => {
                // Delete the registry entry if it exists
                match run_key.delete_value(Self::APP_REGISTRY_KEY) {
                    Ok(_) => Ok(()),
                    Err(e) => {
                        // If the key doesn't exist, that's fine - startup is already disabled
                        match e.raw_os_error() {
                            Some(2) => Ok(()), // ERROR_FILE_NOT_FOUND - key doesn't exist
                            _ => Err(format!("Failed to delete registry value: {}", e))
                        }
                    }
                }
            }
            Err(e) => {
                // If the registry key doesn't exist, startup is already disabled
                match e.raw_os_error() {
                    Some(2) => Ok(()), // ERROR_FILE_NOT_FOUND - registry key doesn't exist
                    _ => Err(format!("Failed to access registry: {}", e))
                }
            }
        }
    }

    /// Get the current executable path
    /// 
    /// # Returns
    /// * `Ok(String)` with the full path to the current executable
    /// * `Err(String)` with error description if failed
    pub fn get_current_exe_path() -> Result<String, String> {
        env::current_exe()
            .map_err(|e| format!("Failed to get current executable path: {}", e))?
            .to_string_lossy()
            .to_string()
            .pipe(Ok)
    }

    /// Validate that a registry entry points to a valid executable
    /// 
    /// # Arguments
    /// * `registry_path` - The path stored in the registry (may include command line arguments)
    /// 
    /// # Returns
    /// * `Ok(true)` if the path is valid and points to the current executable
    /// * `Ok(false)` if the path is invalid or points to a different executable
    /// * `Err(String)` with error description if validation failed
    fn validate_registry_entry(registry_path: &str) -> Result<bool, String> {
        // Extract the executable path from the registry entry (remove --startup flag if present)
        let exe_path = if registry_path.contains(" --startup") {
            registry_path.replace(" --startup", "")
        } else {
            registry_path.to_string()
        };
        
        // Remove any surrounding quotes
        let exe_path = exe_path.trim_matches('"');
        
        // Check if the file exists
        if !Path::new(&exe_path).exists() {
            return Ok(false);
        }

        // Get the current executable path for comparison
        let current_exe = Self::get_current_exe_path()?;
        
        // Compare paths (case-insensitive on Windows)
        let registry_path_normalized = exe_path.to_lowercase();
        let current_exe_normalized = current_exe.to_lowercase();
        
        Ok(registry_path_normalized == current_exe_normalized)
    }

    /// Update the startup registry entry if the executable path has changed
    /// This is useful after application updates
    /// 
    /// # Returns
    /// * `Ok(())` if successful or no update needed
    /// * `Err(String)` with error description if failed
    pub fn update_startup_path_if_needed() -> Result<(), String> {
        // First check if startup is currently enabled
        match Self::get_startup_enabled() {
            Ok(true) => {
                // Startup is enabled, check if path needs updating
                let hkcu = RegKey::predef(HKEY_CURRENT_USER);
                let run_key = hkcu.open_subkey(Self::STARTUP_REGISTRY_PATH)
                    .map_err(|e| format!("Failed to access registry: {}", e))?;
                
                if let Ok(registry_command) = run_key.get_value::<String, _>(Self::APP_REGISTRY_KEY) {
                    let current_exe = Self::get_current_exe_path()?;
                    
                    // Extract the executable path from the registry command
                    let registry_exe = if registry_command.contains(" --startup") {
                        registry_command.replace(" --startup", "")
                    } else {
                        registry_command.clone()
                    };
                    
                    // Remove quotes if present
                    let registry_exe = registry_exe.trim_matches('"');
                    
                    // If paths don't match, update the registry entry
                    if registry_exe.to_lowercase() != current_exe.to_lowercase() {
                        // Executable path changed, update the registry entry
                        Self::enable_startup()?;
                    }
                }
                Ok(())
            }
            Ok(false) => {
                // Startup is disabled, no update needed
                Ok(())
            }
            Err(e) => {
                // Error checking startup state
                Err(e)
            }
        }
    }

    /// Validate all startup registry entries and fix any issues
    /// This performs comprehensive validation and cleanup
    /// 
    /// # Returns
    /// * `Ok(())` if validation passed or issues were fixed
    /// * `Err(String)` with error description if validation failed
    pub fn validate_and_fix_startup_entries() -> Result<(), String> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        
        // Try to open the registry key
        let run_key = match hkcu.open_subkey_with_flags(Self::STARTUP_REGISTRY_PATH, KEY_WRITE) {
            Ok(key) => key,
            Err(_) => {
                // Registry key doesn't exist, nothing to validate
                return Ok(());
            }
        };
        
        // Check if our app's entry exists
        match run_key.get_value::<String, _>(Self::APP_REGISTRY_KEY) {
            Ok(registry_command) => {
                // Entry exists, validate it
                let validation_result = Self::validate_registry_entry(&registry_command)?;
                
                if !validation_result {
                    // Invalid startup registry entry detected
                    
                    // Check if startup should be enabled based on current settings
                    // If the entry exists but is invalid, we assume the user wants startup enabled
                    // but the path needs to be updated
                    match Self::get_current_exe_path() {
                        Ok(_current_exe) => {
                            // Fix invalid startup entry with current executable path
                            Self::enable_startup()?;
                        }
                        Err(e) => {
                            // Cannot fix startup entry - failed to get current executable path
                            // Remove the invalid entry since we can't fix it
                            let _ = run_key.delete_value(Self::APP_REGISTRY_KEY);
                            return Err(format!("Removed invalid startup entry - failed to get current executable path: {}", e));
                        }
                    }
                }
            }
            Err(_) => {
                // Entry doesn't exist, nothing to validate
            }
        }
        
        Ok(())
    }

    /// Detect if the executable path has changed since the last startup registration
    /// This is useful for detecting application updates
    /// 
    /// # Returns
    /// * `Ok(true)` if the path has changed
    /// * `Ok(false)` if the path is the same or no startup entry exists
    /// * `Err(String)` with error description if detection failed
    pub fn detect_executable_path_change() -> Result<bool, String> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        
        // Try to get the current registry entry
        match hkcu.open_subkey(Self::STARTUP_REGISTRY_PATH) {
            Ok(run_key) => {
                match run_key.get_value::<String, _>(Self::APP_REGISTRY_KEY) {
                    Ok(registry_command) => {
                        let current_exe = Self::get_current_exe_path()?;
                        
                        // Extract the executable path from the registry command
                        let registry_exe = if registry_command.contains(" --startup") {
                            registry_command.replace(" --startup", "")
                        } else {
                            registry_command.clone()
                        };
                        
                        // Remove quotes if present
                        let registry_exe = registry_exe.trim_matches('"');
                        
                        // Compare paths (case-insensitive on Windows)
                        let paths_different = registry_exe.to_lowercase() != current_exe.to_lowercase();
                        
                        // Paths different indicates executable path change
                        
                        Ok(paths_different)
                    }
                    Err(_) => {
                        // No registry entry exists
                        Ok(false)
                    }
                }
            }
            Err(_) => {
                // Registry key doesn't exist
                Ok(false)
            }
        }
    }

    /// Perform startup validation and maintenance
    /// This should be called during application startup to ensure startup entries are valid
    /// 
    /// # Returns
    /// * `Ok(())` if validation and maintenance completed successfully
    /// * `Err(String)` with error description if maintenance failed
    pub fn perform_startup_maintenance() -> Result<(), String> {
        // Performing startup maintenance...
        
        // First, validate and fix any existing entries
        Self::validate_and_fix_startup_entries()?;
        
        // Then, update the path if needed (this handles the case where startup is enabled
        // but the executable path has changed)
        Self::update_startup_path_if_needed()?;
        
        // Startup maintenance completed successfully
        Ok(())
    }

    /// Check if the current user has permission to modify startup settings
    /// 
    /// # Returns
    /// * `Ok(true)` if user has permission
    /// * `Ok(false)` if user lacks permission
    /// * `Err(String)` with error description if check failed
    pub fn check_startup_permissions() -> Result<bool, String> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        
        // Try to open the Run key with write access
        match hkcu.create_subkey(Self::STARTUP_REGISTRY_PATH) {
            Ok(_) => Ok(true),
            Err(e) => {
                // Check if it's a permission error
                if e.kind() == std::io::ErrorKind::PermissionDenied {
                    Ok(false)
                } else {
                    Err(format!("Failed to check registry permissions: {}", e))
                }
            }
        }
    }

    /// Check if the application was started via Windows startup
    /// 
    /// # Returns
    /// * `true` if the app was started with the --startup flag
    /// * `false` if the app was started normally
    pub fn is_started_from_startup() -> bool {
        let args: Vec<String> = env::args().collect();
        args.contains(&"--startup".to_string())
    }
}

/// Extension trait to add pipe method for better ergonomics
trait Pipe<T> {
    fn pipe<F, U>(self, f: F) -> U
    where
        F: FnOnce(T) -> U;
}

impl<T> Pipe<T> for T {
    fn pipe<F, U>(self, f: F) -> U
    where
        F: FnOnce(T) -> U,
    {
        f(self)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;
    use winreg::enums::*;
    use winreg::RegKey;

    #[test]
    fn test_get_current_exe_path_returns_valid_path() {
        let result = StartupManager::get_current_exe_path();
        
        assert!(result.is_ok(), "Should successfully get current executable path");
        
        let path = result.unwrap();
        assert!(!path.is_empty(), "Path should not be empty");
        assert!(path.ends_with(".exe"), "Path should end with .exe on Windows");
        assert!(std::path::Path::new(&path).exists(), "Executable should exist");
    }

    #[test]
    fn test_check_startup_permissions_returns_true() {
        let result = StartupManager::check_startup_permissions();
        
        assert!(result.is_ok(), "Should successfully check permissions");
        // Most users should have permission to modify HKCU registry
        assert!(result.unwrap(), "Should have permission to modify startup registry");
    }

    #[test]
    fn test_startup_toggle_cycle_integration() {
        // This test performs actual registry operations
        // First, ensure we start with a clean state
        let _ = StartupManager::set_startup_enabled(false);
        
        // Test enabling startup
        let enable_result = StartupManager::set_startup_enabled(true);
        assert!(enable_result.is_ok(), "Should successfully enable startup: {:?}", enable_result);
        
        // Verify it's enabled
        let check_result = StartupManager::get_startup_enabled();
        assert!(check_result.is_ok(), "Should successfully check startup state: {:?}", check_result);
        assert!(check_result.unwrap(), "Startup should be enabled");
        
        // Test disabling startup
        let disable_result = StartupManager::set_startup_enabled(false);
        assert!(disable_result.is_ok(), "Should successfully disable startup: {:?}", disable_result);
        
        // Verify it's disabled
        let check_result = StartupManager::get_startup_enabled();
        assert!(check_result.is_ok(), "Should successfully check startup state: {:?}", check_result);
        assert!(!check_result.unwrap(), "Startup should be disabled");
    }

    #[test]
    fn test_validate_registry_entry_with_current_exe() {
        let current_exe = StartupManager::get_current_exe_path().unwrap();
        
        // Test with exact path
        let result = StartupManager::validate_registry_entry(&current_exe);
        assert!(result.is_ok(), "Should successfully validate registry entry");
        assert!(result.unwrap(), "Current executable path should be valid");
    }

    #[test]
    fn test_validate_registry_entry_with_startup_flag() {
        let current_exe = StartupManager::get_current_exe_path().unwrap();
        let registry_entry_with_flag = format!("{} --startup", current_exe);
        
        let result = StartupManager::validate_registry_entry(&registry_entry_with_flag);
        assert!(result.is_ok(), "Should successfully validate registry entry with flag");
        assert!(result.unwrap(), "Registry entry with startup flag should be valid");
    }

    #[test]
    fn test_validate_registry_entry_with_quotes() {
        let current_exe = StartupManager::get_current_exe_path().unwrap();
        let quoted_path = format!("\"{}\" --startup", current_exe);
        
        let result = StartupManager::validate_registry_entry(&quoted_path);
        assert!(result.is_ok(), "Should successfully validate quoted registry entry");
        assert!(result.unwrap(), "Quoted registry entry should be valid");
    }

    #[test]
    fn test_validate_registry_entry_with_nonexistent_path() {
        let nonexistent_path = "C:\\NonExistent\\Path.exe";
        
        let result = StartupManager::validate_registry_entry(nonexistent_path);
        assert!(result.is_ok(), "Should successfully validate nonexistent path");
        assert!(!result.unwrap(), "Nonexistent path should be invalid");
    }

    #[test]
    fn test_validate_registry_entry_case_insensitive() {
        let current_exe = StartupManager::get_current_exe_path().unwrap();
        let uppercase_path = current_exe.to_uppercase();
        
        let result = StartupManager::validate_registry_entry(&uppercase_path);
        assert!(result.is_ok(), "Should successfully validate uppercase path");
        assert!(result.unwrap(), "Path validation should be case-insensitive");
    }

    #[test]
    fn test_is_started_from_startup_without_flag() {
        // In test environment, should return false since no --startup flag
        let result = StartupManager::is_started_from_startup();
        assert!(!result, "Should return false when not started with --startup flag");
    }

    #[test]
    fn test_update_startup_path_if_needed_no_startup() {
        // Ensure startup is disabled first
        let _ = StartupManager::set_startup_enabled(false);
        
        let result = StartupManager::update_startup_path_if_needed();
        assert!(result.is_ok(), "Should successfully handle case when startup is disabled");
    }

    #[test]
    fn test_detect_executable_path_change_no_registry() {
        // Ensure no registry entry exists
        let _ = StartupManager::set_startup_enabled(false);
        
        let result = StartupManager::detect_executable_path_change();
        assert!(result.is_ok(), "Should successfully detect no path change when no registry entry");
        assert!(!result.unwrap(), "Should return false when no registry entry exists");
    }

    #[test]
    fn test_validate_and_fix_startup_entries_no_entries() {
        // Ensure no registry entries exist
        let _ = StartupManager::set_startup_enabled(false);
        
        let result = StartupManager::validate_and_fix_startup_entries();
        assert!(result.is_ok(), "Should successfully validate when no entries exist");
    }

    #[test]
    fn test_perform_startup_maintenance() {
        let result = StartupManager::perform_startup_maintenance();
        assert!(result.is_ok(), "Startup maintenance should complete successfully");
    }

    #[test]
    fn test_startup_constants() {
        // Test that constants are correctly defined
        assert_eq!(StartupManager::STARTUP_REGISTRY_PATH, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run");
        assert_eq!(StartupManager::APP_REGISTRY_KEY, "Axon");
    }
}