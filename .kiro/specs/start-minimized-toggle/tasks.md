# Implementation Plan

- [x] 1. Add backend storage support for start minimized setting





  - Add `start_minimized` field to `AppSettings` struct in main.rs
  - Implement default value handling in settings loading logic
  - _Requirements: 2.1, 2.2_
-

- [x] 2. Implement Tauri commands for start minimized setting




  - Create `set_start_minimized` Tauri command function
  - Create `get_start_minimized` Tauri command function  
  - Add commands to the invoke handler in main.rs
  - _Requirements: 2.1, 2.2_
-

- [x] 3. Extend frontend settings store with start minimized property




  - Add `startMinimized` boolean property to SettingsState interface
  - Add `setStartMinimized` async function to settings store
  - Update `initializeSettings` to sync start minimized setting with backend
  - _Requirements: 2.1, 2.2_
-

- [x] 4. Add start minimized toggle to Settings UI component




  - Add toggle component to Settings.tsx in the Application section
  - Position toggle after "Start at Windows Startup" toggle
  - Implement toggle click handler using `setStartMinimized` function
  - _Requirements: 1.1, 1.2_
-

- [x] 5. Implement conditional toggle enabling logic




  - Add logic to disable toggle when "Start at Windows Startup" is disabled
  - Add logic to disable toggle when "Minimize to Tray" is disabled
  - Update toggle styling to show disabled state appropriately
  - _Requirements: 3.1, 3.2, 3.3_
-

- [x] 6. Enhance window initialization logic for startup behavior




  - Modify window creation logic to check if app was started with `--startup` flag
  - Add logic to read start minimized setting during window initialization
  - Implement conditional window minimization based on setting and startup context
  - _Requirements: 1.3, 1.4, 4.1, 4.2_

- [x] 7. Write unit tests for backend Tauri commands














  - Create tests for `set_start_minimized` command with valid inputs
  - Create tests for `get_start_minimized` command with existing and missing settings
  - Create tests for error handling scenarios (file permissions, invalid JSON)
  - _Requirements: 4.3_


- [x] 8. Write unit tests for frontend settings store







  - Create tests for `setStartMinimized` function behavior
  - Create tests for state synchronization between frontend and backend
  - Create tests for error handling when backend calls fail
  - Create tests for `initializeSettings` with new property
  - _Requirements: 4.3_
-


-

- [x] 9. Write integration tests for startup behavior





  - Create test for app starting minimized when setting enabled and `--startup` flag present
  - Create test for app starting normally when setting disabled
  - Create test for app starting normally when launched manually (no `--startup` flag)

  - Create test for settings persistence across app restarts
  --_Requirements: 1.3, 1.4, 2.2, 4.1, 4.2_


- [x] 10. Write visual consistency tests for Settings UI






  - Create test to verify toggle appearance matches existing toggles
  - Create test to verify toggle positioning and spacing in Settings component
  - Create test to verify toggle behavior in different theme modes
  - Create test to verify disabled state styling
  - _Requirements: 1.1, 3.1, 3.2, 3.3_