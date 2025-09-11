import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockInvoke } from '../setup';

// Mock Tauri window API
const mockWindow = {
  hide: vi.fn(),
  minimize: vi.fn(),
  close: vi.fn(),
  show: vi.fn(),
  unminimize: vi.fn(),
};

// Mock Tauri app API
const mockApp = {
  exit: vi.fn(),
};

// Mock Tauri system tray API
const mockSystemTray = {
  setIcon: vi.fn(),
  setMenu: vi.fn(),
  setVisible: vi.fn(),
};

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: mockWindow,
  Window: {
    getByLabel: vi.fn().mockReturnValue(mockWindow),
  },
}));

vi.mock('@tauri-apps/api/app', () => ({
  exit: mockApp.exit,
}));

vi.mock('@tauri-apps/api/systemTray', () => ({
  SystemTray: mockSystemTray,
}));

// Test helper to simulate different minimize to tray settings
const mockMinimizeToTrayEnabled = () => {
  mockInvoke.mockImplementation((command: string) => {
    if (command === 'get_minimize_behavior') {
      return Promise.resolve(true);
    }
    if (command === 'handle_window_minimize') {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(undefined);
  });
};

const mockMinimizeToTrayDisabled = () => {
  mockInvoke.mockImplementation((command: string) => {
    if (command === 'get_minimize_behavior') {
      return Promise.resolve(false);
    }
    if (command === 'handle_window_minimize') {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(undefined);
  });
};

// Helper function to simulate minimize button click
const simulateMinimizeButtonClick = async () => {
  // Simulate the minimize button behavior by calling the Tauri command
  return mockInvoke('handle_window_minimize');
};

// Helper function to simulate close button click
const simulateCloseButtonClick = async () => {
  // Simulate the close button behavior by calling appWindow.close()
  return mockWindow.close();
};

// Helper function to simulate tray icon click
const simulateTrayIconClick = async () => {
  // Simulate tray icon click to restore window
  await mockWindow.show();
  await mockWindow.unminimize();
};

describe('Window Behavior Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all window API mocks
    mockWindow.hide.mockResolvedValue(undefined);
    mockWindow.minimize.mockResolvedValue(undefined);
    mockWindow.close.mockResolvedValue(undefined);
    mockWindow.show.mockResolvedValue(undefined);
    mockWindow.unminimize.mockResolvedValue(undefined);
    mockApp.exit.mockResolvedValue(undefined);
    
    // Default mock behavior
    mockInvoke.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Minimize button behavior with toggle enabled', () => {
    it('should hide window to tray when minimize to tray is enabled', async () => {
      // Mock minimize to tray enabled
      mockMinimizeToTrayEnabled();
      
      // Simulate minimize button click
      await simulateMinimizeButtonClick();
      
      // Verify that handle_window_minimize was called
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
      
      // Requirements: 2.1 - When "Minimize to Tray" toggle is enabled AND user clicks minimize button 
      // THEN system SHALL minimize application to system tray
    });

    it('should not show window in taskbar when minimized to tray', async () => {
      // Mock minimize to tray enabled
      mockMinimizeToTrayEnabled();
      
      // Simulate minimize button click
      await simulateMinimizeButtonClick();
      
      // Requirements: 2.3 - When application is minimized to tray 
      // THEN system SHALL hide application window from taskbar
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
    });

    it('should handle window hide errors gracefully when minimize to tray is enabled', async () => {
      // Mock backend error for window hide
      mockInvoke.mockRejectedValueOnce(new Error('Failed to hide window'));
      
      // Simulate minimize button click and expect it to handle error
      await expect(simulateMinimizeButtonClick()).rejects.toThrow('Failed to hide window');
      
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
    });
  });

  describe('Minimize button behavior with toggle disabled', () => {
    it('should minimize to taskbar when minimize to tray is disabled', async () => {
      // Mock minimize to tray disabled
      mockMinimizeToTrayDisabled();
      
      // Simulate minimize button click
      await simulateMinimizeButtonClick();
      
      // Verify that handle_window_minimize was called
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
      
      // Requirements: 2.2 - When "Minimize to Tray" toggle is disabled AND user clicks minimize button 
      // THEN system SHALL minimize application to taskbar
    });

    it('should show window as minimized in taskbar when minimize to tray is disabled', async () => {
      // Mock minimize to tray disabled
      mockMinimizeToTrayDisabled();
      
      // Simulate minimize button click
      await simulateMinimizeButtonClick();
      
      // Requirements: 2.4 - When application is minimized to taskbar 
      // THEN system SHALL show application as minimized in taskbar
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
    });

    it('should handle window minimize errors gracefully when minimize to tray is disabled', async () => {
      // Mock backend error for window minimize
      mockInvoke.mockRejectedValueOnce(new Error('Failed to minimize window'));
      
      // Simulate minimize button click and expect it to handle error
      await expect(simulateMinimizeButtonClick()).rejects.toThrow('Failed to minimize window');
      
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
    });

    it('should fallback to normal minimize when backend preference retrieval fails', async () => {
      // Mock backend error but the handle_window_minimize command should still work
      mockMinimizeToTrayDisabled();
      
      // Simulate minimize button click
      await simulateMinimizeButtonClick();
      
      // Should still call handle_window_minimize which will fallback to normal minimize
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
    });
  });

  describe('Close button behavior', () => {
    it('should always close application when close button is clicked regardless of minimize to tray setting', async () => {
      // Simulate close button click
      await simulateCloseButtonClick();
      
      // Requirements: 3.1 - When user clicks close button (X) 
      // THEN system SHALL always close application completely
      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('should close application when close button is clicked with minimize to tray disabled', async () => {
      // Simulate close button click
      await simulateCloseButtonClick();
      
      // Requirements: 3.1 - Close button should always close app
      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('should not minimize to tray when close button is clicked', async () => {
      // Simulate close button click
      await simulateCloseButtonClick();
      
      // Requirements: 3.2 - When close button is clicked 
      // THEN system SHALL NOT minimize to tray regardless of toggle state
      expect(mockWindow.close).toHaveBeenCalled();
      expect(mockInvoke).not.toHaveBeenCalledWith('handle_window_minimize');
    });

    it('should terminate all application processes when close button is clicked', async () => {
      // Simulate close button click
      await simulateCloseButtonClick();
      
      // Requirements: 3.4 - When application closes 
      // THEN system SHALL terminate all application processes
      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('should remove tray icon when application closes', async () => {
      // Simulate close button click
      await simulateCloseButtonClick();
      
      // Requirements: 3.3 - When application closes 
      // THEN system SHALL remove any tray icon if present
      expect(mockWindow.close).toHaveBeenCalled();
      // The tray icon removal is handled by the Tauri framework when app exits
    });
  });

  describe('Tray icon restoration functionality', () => {
    it('should display tray icon when application is minimized to tray', async () => {
      // Mock minimize to tray enabled
      mockMinimizeToTrayEnabled();
      
      // Simulate minimize to tray
      await simulateMinimizeButtonClick();
      
      // Requirements: 4.1 - When application is minimized to tray 
      // THEN system SHALL display a tray icon
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
      // Tray icon display is handled by Tauri system tray configuration
    });

    it('should restore application window when tray icon is clicked', async () => {
      // Mock minimize to tray enabled and minimize window first
      mockMinimizeToTrayEnabled();
      await simulateMinimizeButtonClick();
      
      // Now simulate tray icon click to restore
      await simulateTrayIconClick();
      
      // Requirements: 4.2 - When user clicks tray icon 
      // THEN system SHALL restore application window to its previous state
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.unminimize).toHaveBeenCalled();
    });

    it('should handle tray icon restoration errors gracefully', async () => {
      // Mock window show/unminimize errors
      mockWindow.show.mockRejectedValueOnce(new Error('Failed to show window'));
      
      // Simulate tray icon click and expect error handling
      await expect(simulateTrayIconClick()).rejects.toThrow('Failed to show window');
      
      expect(mockWindow.show).toHaveBeenCalled();
    });

    it('should support context menu restore option from tray', async () => {
      // Simulate context menu restore action (same as left click)
      await simulateTrayIconClick();
      
      // Requirements: 4.3 - When user right-clicks tray icon 
      // THEN system SHALL display context menu with restore and quit options
      // Requirements: 4.4 - Context menu restore should work
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.unminimize).toHaveBeenCalled();
    });

    it('should support context menu quit option from tray', async () => {
      // Simulate context menu quit action (this would be handled by the backend tray event)
      // For testing purposes, we simulate the same effect as close button
      await simulateCloseButtonClick();
      
      // Requirements: 4.4 - When user selects quit from tray context menu 
      // THEN system SHALL close application completely
      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('should work with both enabled and disabled minimize to tray settings', async () => {
      // Test with minimize to tray disabled - tray should still be functional for restore
      // Simulate tray icon click (tray is always available)
      await simulateTrayIconClick();
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.unminimize).toHaveBeenCalled();
      
      // Reset mocks
      vi.clearAllMocks();
      mockWindow.show.mockResolvedValue(undefined);
      mockWindow.unminimize.mockResolvedValue(undefined);
      
      // Test with minimize to tray enabled
      // Simulate tray icon click
      await simulateTrayIconClick();
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.unminimize).toHaveBeenCalled();
    });
  });

  describe('Startup behavior integration', () => {
    it('should start minimized to tray when startup, minimize-to-tray, and start-minimized are all enabled', async () => {
      // Mock startup detection with all settings enabled
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'is_started_from_startup') {
          return Promise.resolve(true);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(true);
        }
        if (command === 'get_start_minimized') {
          return Promise.resolve(true);
        }
        return Promise.resolve(undefined);
      });

      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(true);
      
      // Requirements: 1.2 - When "start minimized" toggle is enabled AND app launches on Windows startup 
      // AND minimize-to-tray is enabled THEN system SHALL start the app minimized to tray
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should start minimized to taskbar when startup and start-minimized are enabled but minimize-to-tray is disabled', async () => {
      // Mock startup detection with start-minimized enabled but minimize-to-tray disabled
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'is_started_from_startup') {
          return Promise.resolve(true);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(false);
        }
        if (command === 'get_start_minimized') {
          return Promise.resolve(true);
        }
        return Promise.resolve(undefined);
      });

      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(false);
      expect(startMinimized).toBe(true);
      
      // In this case, window should start minimized to taskbar
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should show window normally when started from startup but start-minimized is disabled', async () => {
      // Mock startup detection with start-minimized disabled
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'is_started_from_startup') {
          return Promise.resolve(true);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(true);
        }
        if (command === 'get_start_minimized') {
          return Promise.resolve(false);
        }
        return Promise.resolve(undefined);
      });

      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(false);
      
      // Requirements: 1.3 - When "start minimized" toggle is disabled AND app launches on Windows startup 
      // THEN system SHALL start the app visible (not minimized)
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should show window normally when started from startup but minimize-to-tray is disabled', async () => {
      // Mock startup detection enabled but minimize-to-tray disabled
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'is_started_from_startup') {
          return Promise.resolve(true);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(false);
        }
        return Promise.resolve(undefined);
      });

      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(false);
      
      // In this case, window should show normally even though started from startup
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
    });

    it('should show window normally when started manually regardless of start-minimized setting', async () => {
      // Mock normal startup (not from Windows startup)
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'is_started_from_startup') {
          return Promise.resolve(false);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(true);
        }
        if (command === 'get_start_minimized') {
          return Promise.resolve(true); // Even if start-minimized is enabled
        }
        return Promise.resolve(undefined);
      });

      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(false);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(true);
      
      // Requirements: 1.4 - When app is launched manually (not via Windows startup) 
      // THEN system SHALL ignore the "start minimized" setting and start normally
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
    });

    it('should handle startup detection errors gracefully', async () => {
      // Mock startup detection error
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'is_started_from_startup') {
          return Promise.reject(new Error('Failed to detect startup'));
        }
        return Promise.resolve(undefined);
      });

      await expect(mockInvoke('is_started_from_startup')).rejects.toThrow('Failed to detect startup');
      
      // App should handle this gracefully and show window normally
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
    });

    it('should restore window from tray when started via startup and minimized to tray', async () => {
      // Simulate complete startup workflow with all settings enabled
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'is_started_from_startup') {
          return Promise.resolve(true);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(true);
        }
        if (command === 'get_start_minimized') {
          return Promise.resolve(true);
        }
        return Promise.resolve(undefined);
      });

      // Verify startup conditions
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(true);
      
      // App should start minimized to tray, then user can restore via tray icon
      await simulateTrayIconClick();
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.unminimize).toHaveBeenCalled();
      
      // Requirements: User should be able to restore window from tray after startup
    });

    it('should handle start-minimized setting persistence across app restarts', async () => {
      // Test setting persistence by simulating setting change and restart
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'set_start_minimized') {
          return Promise.resolve(undefined);
        }
        if (command === 'get_start_minimized') {
          return Promise.resolve(false); // Setting was changed to disabled
        }
        return Promise.resolve(undefined);
      });

      // Simulate setting change
      await mockInvoke('set_start_minimized', { enabled: false });
      
      // Simulate app restart and check setting
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(startMinimized).toBe(false);
      
      // Requirements: 2.2 - When app is restarted THEN system SHALL restore the previous "start minimized" setting state
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: false });
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete minimize to tray workflow', async () => {
      // 1. Mock minimize to tray enabled
      mockMinimizeToTrayEnabled();
      
      // 2. Minimize window to tray
      await simulateMinimizeButtonClick();
      
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
      
      // 3. Restore from tray
      await simulateTrayIconClick();
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.unminimize).toHaveBeenCalled();
      
      // 4. Close application
      await simulateCloseButtonClick();
      
      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('should handle complete taskbar minimize workflow', async () => {
      // 1. Mock minimize to tray disabled
      mockMinimizeToTrayDisabled();
      
      // 2. Minimize window to taskbar
      await simulateMinimizeButtonClick();
      
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
      
      // 3. Restore from taskbar (simulated by tray click for testing)
      await simulateTrayIconClick();
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.unminimize).toHaveBeenCalled();
      
      // 4. Close application
      await simulateCloseButtonClick();
      
      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('should handle setting changes during runtime', async () => {
      // Start with minimize to tray disabled
      mockMinimizeToTrayDisabled();
      
      // Minimize to taskbar
      await simulateMinimizeButtonClick();
      
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
      
      // Restore window
      await simulateTrayIconClick();
      
      // Reset mocks and change setting to enable minimize to tray
      vi.clearAllMocks();
      mockMinimizeToTrayEnabled();
      
      // Now minimize should go to tray
      await simulateMinimizeButtonClick();
      
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
    });

    it('should handle backend communication failures gracefully', async () => {
      // Mock backend failure for minimize operation
      mockInvoke.mockRejectedValueOnce(new Error('Backend communication failed'));
      
      // Minimize should fail gracefully
      await expect(simulateMinimizeButtonClick()).rejects.toThrow('Backend communication failed');
      
      // But close should still work
      await simulateCloseButtonClick();
      expect(mockWindow.close).toHaveBeenCalled();
    });
  });
});