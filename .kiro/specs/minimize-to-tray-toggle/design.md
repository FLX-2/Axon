# Design Document

## Overview

This feature adds a user-configurable toggle in the settings panel that controls whether the application minimizes to the system tray or taskbar when the minimize button is clicked. The implementation leverages the existing Tauri system tray functionality and extends the current settings store to persist the user's preference.

## Architecture

The solution follows the existing application architecture pattern:

- **Frontend (React/TypeScript)**: Settings UI component with toggle control
- **State Management (Zustand)**: Extended settings store to manage minimize preference
- **Backend (Rust/Tauri)**: Window event handlers and system tray management
- **Persistence**: Local storage for settings persistence

## Components and Interfaces

### Frontend Components

#### Settings Component Extension
- **Location**: `src/components/Settings.tsx`
- **Changes**: Add "Minimize to Tray" toggle in the Application section
- **UI Elements**:
  - Toggle switch with label "Minimize to Tray"
  - Descriptive text explaining the behavior
  - Consistent styling with existing settings

#### Settings Store Extension
- **Location**: `src/store/useSettingsStore.ts`
- **New State Properties**:
  ```typescript
  interface SettingsState {
    // ... existing properties
    minimizeToTray: boolean;
    setMinimizeToTray: (enabled: boolean) => void;
  }
  ```
- **Persistence**: Integrated with existing Zustand persist middleware
- **Default Value**: `false` (normal taskbar minimize behavior)

### Backend Components

#### Window Event Handlers
- **Location**: `src-tauri/src/main.rs`
- **New Tauri Commands**:
  ```rust
  #[tauri::command]
  async fn set_minimize_behavior(minimize_to_tray: bool) -> Result<(), String>
  
  #[tauri::command] 
  async fn get_minimize_behavior() -> Result<bool, String>
  ```

#### Window Event Management
- **Window Close Event**: Always close application (no change to existing behavior)
- **Window Minimize Event**: Check user preference and either:
  - Hide window to tray if `minimizeToTray` is `true`
  - Minimize to taskbar if `minimizeToTray` is `false`

### System Tray Integration

#### Existing Tray Functionality
The application already has system tray support with:
- Tray icon configuration in `tauri.conf.json`
- Menu items for Show/Hide and Quit
- Left-click and menu-click handlers

#### Enhanced Tray Behavior
- **Conditional Tray Icon**: Show tray icon only when window is minimized to tray
- **Restore Functionality**: Existing click handlers already support window restoration
- **Context Menu**: Existing menu structure supports the required functionality

## Data Models

### Settings Data Structure
```typescript
interface MinimizeSettings {
  minimizeToTray: boolean;
}
```

### Persistence Schema
The setting will be stored in the existing settings persistence layer:
```json
{
  "themeMode": "system",
  "colors": { ... },
  "isCustomAccentColor": false,
  "minimizeToTray": false
}
```

## Error Handling

### Frontend Error Handling
- **Toggle State Sync**: Ensure UI toggle reflects actual backend state
- **Persistence Failures**: Graceful degradation if localStorage fails
- **Default Behavior**: Fall back to taskbar minimize if preference cannot be determined

### Backend Error Handling
- **Window State Errors**: Log errors but don't crash application
- **Tray Icon Failures**: Fall back to taskbar minimize if tray operations fail
- **Command Failures**: Return appropriate error messages to frontend

## Testing Strategy

### Unit Tests
- **Settings Store**: Test toggle state management and persistence
- **Settings Component**: Test UI toggle behavior and state updates

### Integration Tests
- **Window Behavior**: Test minimize button behavior with different toggle states
- **Tray Functionality**: Test tray icon visibility and restoration
- **Settings Persistence**: Test setting persistence across app restarts

### Manual Testing Scenarios
1. **Default Behavior**: New installation should minimize to taskbar
2. **Toggle Enable**: Enabling toggle should immediately change minimize behavior
3. **Toggle Disable**: Disabling toggle should revert to taskbar minimize
4. **Close Button**: Close button should always close app regardless of toggle
5. **Tray Restoration**: Clicking tray icon should restore window
6. **Settings Persistence**: Toggle state should persist across app restarts

## Implementation Flow

### Phase 1: Settings Store Extension
1. Add `minimizeToTray` property to settings store
2. Add setter function with persistence
3. Update initialization to load saved preference

### Phase 2: UI Component Updates
1. Add toggle control to Settings component
2. Wire toggle to settings store
3. Add descriptive text and styling

### Phase 3: Backend Integration
1. Add Tauri commands for minimize behavior management
2. Implement window event handlers
3. Update minimize logic based on user preference

### Phase 4: Window Event Handling
1. Intercept minimize events
2. Check user preference
3. Execute appropriate minimize behavior (tray vs taskbar)

### Phase 5: Testing and Refinement
1. Test all minimize scenarios
2. Verify settings persistence
3. Ensure tray icon behavior is correct
4. Test close button behavior remains unchanged

## Technical Considerations

### Tauri Window Management
- Use existing `window.hide()` for tray minimize
- Use existing `window.minimize()` for taskbar minimize
- Leverage existing tray icon and menu structure

### State Synchronization
- Settings store manages preference state
- Backend queries frontend for current preference
- No additional state synchronization needed

### Performance Impact
- Minimal performance impact
- Single boolean check on minimize events
- No continuous polling or background processes

### Cross-Platform Compatibility
- Implementation focuses on Windows (current platform)
- Tauri system tray APIs are cross-platform compatible
- Future platform support can reuse same architecture

## Security Considerations

- No additional security risks introduced
- Settings stored in standard application data directory
- No network communication or external dependencies
- Follows existing application security patterns