# Implementation Plan

- [x] 1. Create backend startup management module





  - Create a new `startup_manager.rs` module in `src-tauri/src/` with Windows Registry operations
  - Implement functions for setting, getting, and validating startup registry entries
  - Add proper error handling for registry access permissions and path validation
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

- [x] 2. Implement Tauri commands for startup management





  - Add `set_startup_enabled` and `get_startup_enabled` Tauri commands in `main.rs`
  - Integrate the startup manager module with the command handlers
  - Add startup preference to the existing `AppSettings` struct and persistence logic
  - _Requirements: 1.1, 2.1, 2.2, 4.1, 4.2_

- [x] 3. Extend settings store with startup functionality





  - Add `startupEnabled` boolean property to the `SettingsState` interface in `useSettingsStore.ts`
  - Implement `setStartupEnabled` async method that calls the Tauri backend
  - Add startup state initialization in the `initializeSettings` method
  - Include startup setting in the Zustand persistence configuration
  - _Requirements: 1.1, 2.1, 2.2, 4.1, 5.1_

- [x] 4. Add startup toggle to Settings UI component





  - Add the startup toggle section to `Settings.tsx` following the existing minimize-to-tray pattern
  - Use consistent styling with design tokens and proper toggle switch implementation
  - Implement error handling with user feedback for failed startup setting changes
  - _Requirements: 1.1, 2.1, 2.2, 5.1, 5.2, 5.3, 5.4_

- [x] 5. Implement startup behavior integration





  - Add logic to detect when the app is started via Windows startup (command line flag detection)
  - Integrate startup detection with minimize-to-tray behavior in the main window initialization
  - Ensure the app starts minimized to tray when both startup and minimize-to-tray are enabled
  - _Requirements: 1.3, 1.4_


- [x] 6. Add executable path validation and updates




  - Implement logic to detect when the executable path has changed (during app updates)
  - Add automatic registry entry updates when the executable path changes
  - Create validation to ensure registry entries point to valid executable locations
  - _Requirements: 4.2, 4.3_

- [x] 7. Create comprehensive unit tests for startup functionality





  - Write unit tests for the startup manager module covering registry operations
  - Create tests for the Tauri commands with mocked registry operations
  - Add frontend tests for the settings store startup methods and error handling
  - Write tests for the Settings component startup toggle interaction
  - _Requirements: 3.1, 3.2, 3.3, 5.3_

- [x] 8. Create integration tests for end-to-end startup workflow






  - Write integration tests that verify the complete startup toggle workflow
  - Test the interaction between frontend toggle and backend registry operations
  - Create tests for startup behavior with minimize-to-tray integration
  - Add tests for executable path update scenarios
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.2, 4.3_