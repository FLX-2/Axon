# Requirements Document

## Introduction

This feature adds a "start minimized" toggle to the app's settings menu, giving users control over the app's visibility when it launches on Windows startup. Currently, the app automatically starts minimized to tray when launched via Windows startup, but users should have the option to control this behavior. The toggle will work alongside the existing "start on Windows startup" and "minimize to tray" toggles.

## Requirements

### Requirement 1

**User Story:** As a user, I want a "start minimized" toggle in the settings menu, so that I can control whether the app starts minimized to tray or visible when launched on Windows startup.

#### Acceptance Criteria

1. WHEN the settings menu is opened THEN the system SHALL display a "start minimized" toggle alongside existing toggles
2. WHEN the "start minimized" toggle is enabled AND the app launches on Windows startup THEN the system SHALL start the app minimized to tray
3. WHEN the "start minimized" toggle is disabled AND the app launches on Windows startup THEN the system SHALL start the app visible (not minimized)
4. WHEN the app is launched manually (not via Windows startup) THEN the system SHALL ignore the "start minimized" setting and start normally

### Requirement 2

**User Story:** As a user, I want the "start minimized" setting to be persisted, so that my preference is remembered across app restarts.

#### Acceptance Criteria

1. WHEN the "start minimized" toggle is changed THEN the system SHALL save the setting to persistent storage
2. WHEN the app is restarted THEN the system SHALL restore the previous "start minimized" setting state
3. WHEN the app is launched for the first time THEN the system SHALL default the "start minimized" setting to enabled (current behavior)

### Requirement 3

**User Story:** As a user, I want the "start minimized" toggle to be logically related to the startup functionality, so that the interface is intuitive and clear.

#### Acceptance Criteria

1. WHEN the "start on Windows startup" toggle is disabled THEN the system SHALL disable or visually indicate that the "start minimized" toggle is not applicable
2. WHEN the "minimize to tray" toggle is disabled THEN the system SHALL disable or visually indicate that the "start minimized" toggle is not applicable
3. WHEN both prerequisite toggles are enabled THEN the system SHALL enable the "start minimized" toggle for user interaction

### Requirement 4

**User Story:** As a developer, I want the startup behavior logic to be centralized and testable, so that the feature is maintainable and reliable.

#### Acceptance Criteria

1. WHEN the app startup logic is executed THEN the system SHALL check the startup context (manual vs Windows startup)
2. WHEN determining window visibility THEN the system SHALL evaluate the "start minimized" setting only for Windows startup launches
3. WHEN the startup behavior is modified THEN the system SHALL maintain backward compatibility with existing settings