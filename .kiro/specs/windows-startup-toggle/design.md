# Design Document

## Overview

The Windows startup toggle feature will integrate seamlessly with the existing Axon application architecture, following the established patterns for settings management. The implementation will use Windows Registry manipulation through Rust's `winreg` crate (already included in dependencies) to manage startup entries, with proper error handling and user feedback.

The feature will consist of:
- Frontend toggle component in the Settings panel
- Zustand store integration for state management
- Tauri backend commands for Windows Registry operations
- Persistent storage of the startup preference
- Integration with existing minimize-to-tray functionality

## Architecture

### Frontend Architecture
The startup toggle will follow the same pattern as the existing minimize-to-tray toggle:
- React component in `Settings.tsx` with consistent styling using design tokens
- State management through `useSettingsStore` with Zustand persistence
- Async operations with proper error handling and user feedback
- Visual consistency with existing toggle components

### Backend Architecture
The backend will implement Tauri commands following the established pattern:
- `set_startup_enabled(enabled: bool)` - Manages Windows Registry entries
- `get_startup_enabled()` - Retrieves current startup state from Registry
- Registry operations using the existing `winreg` crate
- Integration with the existing app settings persistence system

### Windows Registry Integration
The implementation will use the Windows Registry `Run` key for startup management:
- Registry path: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
- Entry name: `Axon` (matching the app's product name)
- Entry value: Full path to the executable with optional startup flags

## Components and Interfaces

### Frontend Components

#### Settings Component Extension
```typescript
// Addition to existing Settings.tsx
<div className={PATTERNS.settingItem}>
  <div className={PATTERNS.labelWithDescription}>
    <span className={TYPOGRAPHY.label}>Start at Windows Startup</span>
    <span className={TYPOGRAPHY.description}>
      Automatically launch Axon when Windows starts
    </span>
  </div>
  <button
    onClick={async () => {
      try {
        await settings.setStartupEnabled(!settings.startupEnabled);
      } catch (error) {
        console.error('Failed to update startup setting:', error);
        // Error handling with user feedback
      }
    }}
    className={`toggle-button ${settings.startupEnabled ? 'enabled' : 'disabled'}`}
  >
    {/* Toggle switch implementation */}
  </button>
</div>
```

#### Settings Store Extension
```typescript
interface SettingsState {
  // ... existing properties
  startupEnabled: boolean;
  setStartupEnabled: (enabled: boolean) => Promise<void>;
  // ... existing methods
}
```

### Backend Components

#### Tauri Commands
```rust
#[tauri::command]
async fn set_startup_enabled(enabled: bool) -> Result<(), String> {
    // Registry manipulation logic
}

#[tauri::command]
async fn get_startup_enabled() -> Result<bool, String> {
    // Registry reading logic
}
```

#### Registry Management Module
```rust
mod startup_manager {
    use winreg::RegKey;
    use winreg::enums::*;
    
    pub fn set_startup_registry_entry(enabled: bool, exe_path: &str) -> Result<(), Box<dyn std::error::Error>>;
    pub fn get_startup_registry_entry() -> Result<bool, Box<dyn std::error::Error>>;
    pub fn get_current_exe_path() -> Result<String, Box<dyn std::error::Error>>;
}
```

## Data Models

### Settings State Extension
```typescript
interface SettingsState {
  startupEnabled: boolean;        // Current startup toggle state
  setStartupEnabled: (enabled: boolean) => Promise<void>;  // Async setter with backend sync
}
```

### Backend Settings Structure
```rust
#[derive(Serialize, Deserialize, Clone)]
struct AppSettings {
    minimize_to_tray: bool,
    startup_enabled: bool,    // New field for startup preference
    // ... other existing settings
}
```

### Registry Entry Structure
- **Registry Key**: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
- **Entry Name**: `"Axon"`
- **Entry Value**: `"C:\path\to\axon.exe --startup"` (with optional startup flag)

## Error Handling

### Frontend Error Handling
```typescript
try {
  await settings.setStartupEnabled(!settings.startupEnabled);
} catch (error) {
  console.error('Failed to update startup setting:', error);
  // Revert toggle state
  // Show user-friendly error message
  // Could integrate with future toast notification system
}
```

### Backend Error Scenarios
1. **Registry Access Denied**: Handle insufficient permissions gracefully
2. **Registry Key Not Found**: Create the Run key if it doesn't exist
3. **Invalid Executable Path**: Validate and handle path resolution errors
4. **Corrupted Registry Entry**: Detect and repair malformed entries

### Error Recovery Strategies
- **Permission Issues**: Provide clear error messages about administrator rights
- **Path Changes**: Automatically update registry entry when executable path changes
- **Registry Corruption**: Attempt to recreate entries with current executable path
- **State Synchronization**: Regularly sync frontend state with actual registry state

## Testing Strategy

### Unit Tests
```typescript
// Frontend tests
describe('Startup Toggle', () => {
  test('should toggle startup state correctly');
  test('should handle backend errors gracefully');
  test('should persist state across app restarts');
  test('should sync with backend on initialization');
});
```

```rust
// Backend tests
#[cfg(test)]
mod tests {
    #[test]
    fn test_set_startup_registry_entry();
    
    #[test]
    fn test_get_startup_registry_entry();
    
    #[test]
    fn test_handle_registry_permissions();
    
    #[test]
    fn test_executable_path_resolution();
}
```

### Integration Tests
```typescript
// Integration tests for full workflow
describe('Startup Integration', () => {
  test('should enable startup and verify registry entry');
  test('should disable startup and remove registry entry');
  test('should handle app updates correctly');
  test('should work with minimize-to-tray feature');
});
```

### Manual Testing Scenarios
1. **Enable startup toggle** → Verify registry entry creation → Restart Windows → Confirm app starts
2. **Disable startup toggle** → Verify registry entry removal → Restart Windows → Confirm app doesn't start
3. **Update application** → Verify startup still works with new executable path
4. **Test with minimize-to-tray enabled** → Verify app starts minimized to tray on Windows startup
5. **Test permission scenarios** → Test behavior with limited user accounts

### Cross-Windows Version Testing
- **Windows 10**: Verify registry operations work correctly
- **Windows 11**: Ensure compatibility with latest Windows version
- **Different User Account Types**: Test with standard and administrator accounts

## Implementation Considerations

### Startup Behavior Integration
When the app starts via Windows startup and minimize-to-tray is enabled:
```rust
// In main.rs startup logic
if started_from_windows_startup && minimize_to_tray_enabled {
    // Start minimized to tray instead of showing window
    window.hide()?;
}
```

### Executable Path Management
The registry entry must always point to the current executable location:
```rust
fn update_startup_path_if_needed() -> Result<(), String> {
    let current_path = get_current_exe_path()?;
    let registry_path = get_startup_registry_path()?;
    
    if current_path != registry_path {
        set_startup_registry_entry(true, &current_path)?;
    }
    Ok(())
}
```

### Performance Considerations
- Registry operations are fast but should be async to avoid blocking UI
- Cache startup state to minimize registry reads
- Batch registry operations when possible

### Security Considerations
- Validate executable paths to prevent injection attacks
- Use proper Windows API error handling
- Ensure registry operations are atomic where possible
- Handle edge cases like executable being moved or deleted

This design ensures the Windows startup toggle integrates seamlessly with the existing Axon architecture while providing robust, reliable functionality across different Windows environments.