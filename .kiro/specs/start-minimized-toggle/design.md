# Design Document

## Overview

This feature adds a "start minimized" toggle to the app's settings menu, giving users control over whether the app starts minimized to tray when launched via Windows startup. The implementation leverages the existing startup detection mechanism (`--startup` flag) and integrates with the current settings architecture.

## Architecture

The solution follows the existing pattern in the codebase:
- **Frontend**: React component with Zustand state management
- **Backend**: Tauri commands for persistent storage
- **Startup Logic**: Enhanced window initialization based on startup context and user preferences

### Key Components

1. **Settings UI**: New toggle in the existing Settings.tsx component
2. **State Management**: Extension of useSettingsStore with new `startMinimized` property
3. **Backend Storage**: New Tauri command to persist the setting
4. **Window Initialization**: Enhanced logic to respect the setting during startup

## Components and Interfaces

### Frontend State Interface

```typescript
interface SettingsState {
  // ... existing properties
  startMinimized: boolean;
  setStartMinimized: (enabled: boolean) => Promise<void>;
}
```

### Backend Storage Structure

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
struct AppSettings {
    // ... existing fields
    start_minimized: Option<bool>,
}
```

### Tauri Commands

```rust
#[tauri::command]
async fn set_start_minimized(enabled: bool) -> Result<(), String>

#[tauri::command] 
async fn get_start_minimized() -> Result<bool, String>
```

## Data Models

### Settings Storage
- **Location**: Same JSON file as existing app settings
- **Default Value**: `true` (maintains current behavior)
- **Persistence**: Handled by existing `save_app_settings` mechanism

### State Synchronization
- Frontend state syncs with backend on initialization
- Backend state persists across app restarts
- Error handling follows existing patterns in the settings store

## Error Handling

### Frontend Error Handling
- Failed backend calls don't update frontend state
- Error logging to console (consistent with existing patterns)
- Graceful degradation - setting remains in previous state

### Backend Error Handling
- File I/O errors return descriptive error messages
- JSON parsing errors handled gracefully
- Default values provided when settings file doesn't exist

### Startup Logic Error Handling
- If setting cannot be read, default to current behavior (start minimized)
- Window state errors logged but don't prevent app startup

## Testing Strategy

### Unit Tests

1. **Settings Store Tests**
   - Test `setStartMinimized` function
   - Test state synchronization with backend
   - Test error handling for failed backend calls
   - Test initialization with existing and missing settings

2. **Backend Command Tests**
   - Test `set_start_minimized` with valid inputs
   - Test `get_start_minimized` with existing and missing settings
   - Test error cases (file permissions, invalid JSON)

3. **Startup Logic Tests**
   - Test window behavior with different setting combinations
   - Test startup flag detection
   - Test fallback behavior when settings unavailable

### Integration Tests

1. **Settings UI Integration**
   - Test toggle interaction updates backend
   - Test toggle state reflects backend value
   - Test error states in UI

2. **Startup Behavior Integration**
   - Test app starts minimized when setting enabled and `--startup` flag present
   - Test app starts normally when setting disabled
   - Test app starts normally when launched manually (no `--startup` flag)

3. **Settings Persistence Integration**
   - Test setting persists across app restarts
   - Test setting migration from missing to default value

### Visual Consistency Tests
- Test toggle appearance matches existing toggles
- Test toggle positioning and spacing
- Test toggle behavior in different themes

## Implementation Flow

### Phase 1: Backend Storage
1. Add `start_minimized` field to `AppSettings` struct
2. Implement `set_start_minimized` and `get_start_minimized` Tauri commands
3. Update settings loading/saving to handle new field with default value

### Phase 2: Frontend State Management
1. Add `startMinimized` property to settings store
2. Implement `setStartMinimized` function with backend synchronization
3. Update `initializeSettings` to sync the new property

### Phase 3: Settings UI
1. Add toggle component to Settings.tsx
2. Position toggle logically with other startup-related settings
3. Implement conditional enabling based on prerequisite settings

### Phase 4: Startup Logic Integration
1. Enhance window initialization to check startup context
2. Apply minimized state based on setting and startup flag
3. Ensure manual launches ignore the setting

### Phase 5: Testing and Validation
1. Add comprehensive unit tests
2. Add integration tests for startup behavior
3. Test settings persistence and migration
4. Validate UI consistency and accessibility