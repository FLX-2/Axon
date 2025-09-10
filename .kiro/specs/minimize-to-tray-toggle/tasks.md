# Implementation Plan

- [x] 1. Extend settings store with minimize to tray preference
  - Add `minimizeToTray` boolean property to SettingsState interface
  - Add `setMinimizeToTray` function to update the preference
  - Update the store's persist configuration to include the new property
  - Set default value to `false` for backward compatibility
  - _Requirements: 1.2, 1.3, 5.1, 5.2_

- [x] 2. Add minimize to tray toggle to Settings UI component
  - Add toggle control in the Application section of Settings component
  - Wire toggle to settings store state and setter function
  - Add descriptive text explaining the toggle behavior
  - Style toggle consistently with existing settings controls
  - _Requirements: 1.1, 1.4_

- [x] 3. Implement Tauri backend commands for minimize behavior
  - Create `set_minimize_behavior` Tauri command to store preference
  - Create `get_minimize_behavior` Tauri command to retrieve preference
  - Add proper error handling for command failures
  - _Requirements: 1.2, 1.3_

- [x] 4. Implement window minimize event handling logic
  - Modify window minimize event handler to check user preference
  - Implement conditional logic: hide to tray if enabled, minimize to taskbar if disabled
  - Ensure close button behavior remains unchanged (always close app)
  - Add error handling for window operations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

- [x] 5. Update system tray behavior for minimize to tray functionality
  - Ensure tray icon is visible when window is minimized to tray
  - Verify existing tray click handlers work for window restoration
  - Test tray context menu restore and quit options
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Add frontend integration with Tauri commands
  - Import and use Tauri invoke functions in settings store
  - Add error handling for backend communication failures
  - Ensure settings sync between frontend and backend on app initialization
  - _Requirements: 1.4, 5.3, 5.4_

- [x] 7. Write unit tests for settings store functionality
  - Test `minimizeToTray` state management
  - Test `setMinizeToTray` function behavior
  - Test settings persistence and loading
  - Test default value handling for new installations
  - _Requirements: 1.2, 1.3, 5.1, 5.2_

- [x] 8. Write integration tests for window behavior
  - Test minimize button behavior with toggle enabled
  - Test minimize button behavior with toggle disabled
  - Test close button always closes app regardless of toggle state
  - Test tray icon restoration functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

- [x] 9. Fix close button behavior to properly terminate application
  - Change close button from `appWindow.hide()` to `appWindow.close()`
  - Update backend window close event handler to use `app_handle().exit(0)` instead of `std::process::exit(0)`
  - Update system tray quit handler to use proper Tauri exit method
  - Update integration tests to reflect correct close button behavior
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 10. Fix compilation errors and simplify tray implementation
  - Remove dynamic tray icon management due to Tauri v1 limitations
  - Keep static tray icon for consistent minimize-to-tray functionality
  - Clean up unused imports and functions
  - Ensure code compiles successfully
  - _Note: Dynamic tray visibility would require Tauri v2 or custom implementation_