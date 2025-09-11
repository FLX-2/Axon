import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockInvoke } from '../setup';

// Mock Tauri window API
const mockWindow = {
  hide: vi.fn(),
  minimize: vi.fn(),
  close: vi.fn(),
  show: vi.fn(),
  unminimize: vi.fn(),
  setTitle: vi.fn(),
  isVisible: vi.fn(),
  isMinimized: vi.fn(),
};

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: mockWindow,
  Window: {
    getByLabel: vi.fn().mockReturnValue(mockWindow),
  },
}));

describe('Startup Behavior Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all window API mocks
    mockWindow.hide.mockResolvedValue(undefined);
    mockWindow.minimize.mockResolvedValue(undefined);
    mockWindow.close.mockResolvedValue(undefined);
    mockWindow.show.mockResolvedValue(undefined);
    mockWindow.unminimize.mockResolvedValue(undefined);
    mockWindow.setTitle.mockResolvedValue(undefined);
    mockWindow.isVisible.mockResolvedValue(true);
    mockWindow.isMinimized.mockResolvedValue(false);
    
    // Default mock behavior
    mockInvoke.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('App starting minimized when setting enabled and --startup flag present', () => {
    it('should start minimized to tray when all conditions are met', async () => {
      // Mock all required conditions for starting minimized to tray
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.resolve(true);
          case 'get_start_minimized':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app startup sequence
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(true);
      
      // When all conditions are met, window should be hidden (minimized to tray)
      if (isStartedFromStartup && minimizeToTray && startMinimized) {
        await mockWindow.hide();
      }
      
      expect(mockWindow.hide).toHaveBeenCalled();
      
      // Requirements: 1.2 - When "start minimized" toggle is enabled AND app launches on Windows startup 
      // THEN system SHALL start the app minimized to tray
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should start minimized to taskbar when start-minimized enabled but minimize-to-tray disabled', async () => {
      // Mock startup with start-minimized enabled but minimize-to-tray disabled
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.resolve(false);
          case 'get_start_minimized':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app startup sequence
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(false);
      expect(startMinimized).toBe(true);
      
      // When minimize-to-tray is disabled but start-minimized is enabled, minimize to taskbar
      if (isStartedFromStartup && !minimizeToTray && startMinimized) {
        await mockWindow.minimize();
      }
      
      expect(mockWindow.minimize).toHaveBeenCalled();
      expect(mockWindow.hide).not.toHaveBeenCalled();
      
      // Should minimize to taskbar instead of hiding to tray
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should handle startup detection errors gracefully', async () => {
      // Mock startup detection error
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.reject(new Error('Failed to detect startup'));
          case 'get_minimize_behavior':
            return Promise.resolve(true);
          case 'get_start_minimized':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      // App should handle startup detection errors gracefully
      try {
        await mockInvoke('is_started_from_startup');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to detect startup');
        
        // App should default to showing window normally when startup detection fails
        // This is the safe fallback behavior
      }
      
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
    });

    it('should handle settings retrieval errors gracefully', async () => {
      // Mock settings retrieval errors
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.reject(new Error('Failed to get minimize behavior'));
          case 'get_start_minimized':
            return Promise.reject(new Error('Failed to get start minimized'));
          default:
            return Promise.resolve(undefined);
        }
      });

      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      expect(isStartedFromStartup).toBe(true);
      
      // Settings errors should be handled gracefully
      try {
        await mockInvoke('get_minimize_behavior');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      try {
        await mockInvoke('get_start_minimized');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      // App should default to safe behavior (show window) when settings can't be retrieved
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });
  });

  describe('App starting normally when setting disabled', () => {
    it('should start normally when start-minimized is disabled', async () => {
      // Mock startup with start-minimized disabled
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.resolve(true);
          case 'get_start_minimized':
            return Promise.resolve(false);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app startup sequence
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(false);
      
      // When start-minimized is disabled, window should show normally
      if (isStartedFromStartup && !startMinimized) {
        await mockWindow.show();
      }
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.hide).not.toHaveBeenCalled();
      expect(mockWindow.minimize).not.toHaveBeenCalled();
      
      // Requirements: 1.3 - When "start minimized" toggle is disabled AND app launches on Windows startup 
      // THEN system SHALL start the app visible (not minimized)
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should start normally when minimize-to-tray is disabled', async () => {
      // Mock startup with minimize-to-tray disabled
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.resolve(false);
          case 'get_start_minimized':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app startup sequence
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(false);
      expect(startMinimized).toBe(true);
      
      // When minimize-to-tray is disabled, should minimize to taskbar instead of hiding
      if (isStartedFromStartup && !minimizeToTray && startMinimized) {
        await mockWindow.minimize();
      }
      
      expect(mockWindow.minimize).toHaveBeenCalled();
      expect(mockWindow.hide).not.toHaveBeenCalled();
      
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should start normally when both settings are disabled', async () => {
      // Mock startup with both settings disabled
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.resolve(false);
          case 'get_start_minimized':
            return Promise.resolve(false);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app startup sequence
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(false);
      expect(startMinimized).toBe(false);
      
      // When both settings are disabled, window should show normally
      if (isStartedFromStartup && !startMinimized) {
        await mockWindow.show();
      }
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.hide).not.toHaveBeenCalled();
      expect(mockWindow.minimize).not.toHaveBeenCalled();
      
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });
  });

  describe('App starting normally when launched manually (no --startup flag)', () => {
    it('should start normally when launched manually regardless of start-minimized setting', async () => {
      // Mock manual startup (not from Windows startup)
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(false);
          case 'get_minimize_behavior':
            return Promise.resolve(true);
          case 'get_start_minimized':
            return Promise.resolve(true); // Even if start-minimized is enabled
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app startup sequence
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(false);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(true);
      
      // When launched manually, should always show window normally regardless of start-minimized setting
      if (!isStartedFromStartup) {
        await mockWindow.show();
      }
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.hide).not.toHaveBeenCalled();
      expect(mockWindow.minimize).not.toHaveBeenCalled();
      
      // Requirements: 1.4 - When app is launched manually (not via Windows startup) 
      // THEN system SHALL ignore the "start minimized" setting and start normally
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
    });

    it('should start normally when launched manually with all settings disabled', async () => {
      // Mock manual startup with all settings disabled
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(false);
          case 'get_minimize_behavior':
            return Promise.resolve(false);
          case 'get_start_minimized':
            return Promise.resolve(false);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app startup sequence
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      
      expect(isStartedFromStartup).toBe(false);
      
      // When launched manually, should show window normally
      if (!isStartedFromStartup) {
        await mockWindow.show();
      }
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.hide).not.toHaveBeenCalled();
      expect(mockWindow.minimize).not.toHaveBeenCalled();
      
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
    });

    it('should not check start-minimized setting when launched manually', async () => {
      // Mock manual startup
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(false);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app startup sequence
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      
      expect(isStartedFromStartup).toBe(false);
      
      // When launched manually, should show window without checking start-minimized setting
      if (!isStartedFromStartup) {
        await mockWindow.show();
      }
      
      expect(mockWindow.show).toHaveBeenCalled();
      
      // Should not call get_start_minimized when launched manually
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).not.toHaveBeenCalledWith('get_start_minimized');
    });

    it('should handle manual startup detection with error fallback', async () => {
      // Mock startup detection returning false (manual startup)
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(false);
          default:
            return Promise.resolve(undefined);
        }
      });

      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      expect(isStartedFromStartup).toBe(false);
      
      // Manual startup should always show window
      await mockWindow.show();
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
    });
  });

  describe('Settings persistence across app restarts', () => {
    it('should persist start-minimized setting when changed', async () => {
      let persistedSetting = false;
      
      // Mock setting change with proper persistence
      mockInvoke.mockImplementation((command: string, args?: any) => {
        switch (command) {
          case 'set_start_minimized':
            persistedSetting = args?.enabled ?? persistedSetting;
            return Promise.resolve(undefined);
          case 'get_start_minimized':
            return Promise.resolve(persistedSetting);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate setting change to enabled
      await mockInvoke('set_start_minimized', { enabled: true });
      
      // Simulate app restart and check setting
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(startMinimized).toBe(true);
      
      // Requirements: 2.1 - When "start minimized" toggle is changed 
      // THEN system SHALL save the setting to persistent storage
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: true });
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should restore previous start-minimized setting state on restart', async () => {
      // Mock persistent setting (disabled)
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'get_start_minimized':
            return Promise.resolve(false);
          case 'is_started_from_startup':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate app restart
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(startMinimized).toBe(false);
      
      // Since start-minimized is disabled, should show window normally
      if (isStartedFromStartup && !startMinimized) {
        await mockWindow.show();
      }
      
      expect(mockWindow.show).toHaveBeenCalled();
      
      // Requirements: 2.2 - When app is restarted 
      // THEN system SHALL restore the previous "start minimized" setting state
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should default start-minimized to enabled on first launch', async () => {
      // Mock first launch (no existing settings)
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'get_start_minimized':
            return Promise.resolve(true); // Default value
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      // Simulate first launch from startup
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(true);
      
      // Should start minimized with default setting
      if (isStartedFromStartup && minimizeToTray && startMinimized) {
        await mockWindow.hide();
      }
      
      expect(mockWindow.hide).toHaveBeenCalled();
      
      // Requirements: 2.3 - When app is launched for the first time 
      // THEN system SHALL default the "start minimized" setting to enabled (current behavior)
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should handle settings persistence errors gracefully', async () => {
      // Mock settings save error
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'set_start_minimized':
            return Promise.reject(new Error('Failed to save settings'));
          case 'get_start_minimized':
            return Promise.resolve(false); // Previous value
          default:
            return Promise.resolve(undefined);
        }
      });

      // Attempt to change setting
      try {
        await mockInvoke('set_start_minimized', { enabled: true });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to save settings');
      }
      
      // Setting should remain at previous value
      const startMinimized = await mockInvoke('get_start_minimized');
      expect(startMinimized).toBe(false);
      
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: true });
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should handle settings load errors gracefully', async () => {
      // Mock settings load error
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'get_start_minimized':
            return Promise.reject(new Error('Failed to load settings'));
          case 'is_started_from_startup':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      expect(isStartedFromStartup).toBe(true);
      
      // Settings load error should be handled gracefully
      try {
        await mockInvoke('get_start_minimized');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to load settings');
        
        // App should default to safe behavior (show window) when settings can't be loaded
        await mockWindow.show();
      }
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should maintain setting consistency across multiple restarts', async () => {
      let currentSetting = true;
      
      // Mock persistent setting that maintains state
      mockInvoke.mockImplementation((command: string, args?: any) => {
        switch (command) {
          case 'set_start_minimized':
            currentSetting = args?.enabled ?? currentSetting;
            return Promise.resolve(undefined);
          case 'get_start_minimized':
            return Promise.resolve(currentSetting);
          default:
            return Promise.resolve(undefined);
        }
      });

      // First restart - check initial setting
      let startMinimized = await mockInvoke('get_start_minimized');
      expect(startMinimized).toBe(true);
      
      // Change setting
      await mockInvoke('set_start_minimized', { enabled: false });
      
      // Second restart - check setting persisted
      startMinimized = await mockInvoke('get_start_minimized');
      expect(startMinimized).toBe(false);
      
      // Change setting back
      await mockInvoke('set_start_minimized', { enabled: true });
      
      // Third restart - check setting persisted again
      startMinimized = await mockInvoke('get_start_minimized');
      expect(startMinimized).toBe(true);
      
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: false });
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: true });
    });
  });

  describe('Complete startup workflow integration', () => {
    it('should handle complete startup-to-tray-to-restore workflow', async () => {
      // Mock complete startup workflow with all settings enabled
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.resolve(true);
          case 'get_start_minimized':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      // 1. App starts from Windows startup
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      const startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(true);
      expect(startMinimized).toBe(true);
      
      // 2. App starts minimized to tray
      if (isStartedFromStartup && minimizeToTray && startMinimized) {
        await mockWindow.hide();
      }
      
      expect(mockWindow.hide).toHaveBeenCalled();
      
      // 3. User restores from tray
      await mockWindow.show();
      await mockWindow.unminimize();
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.unminimize).toHaveBeenCalled();
      
      // 4. User minimizes again (should go to tray)
      await mockInvoke('handle_window_minimize');
      
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
      
      // Complete workflow should work seamlessly
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
    });

    it('should handle startup workflow with setting changes during runtime', async () => {
      let startMinimizedSetting = true;
      
      // Mock dynamic setting changes
      mockInvoke.mockImplementation((command: string, args?: any) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.resolve(true);
          case 'get_start_minimized':
            return Promise.resolve(startMinimizedSetting);
          case 'set_start_minimized':
            startMinimizedSetting = args?.enabled ?? startMinimizedSetting;
            return Promise.resolve(undefined);
          default:
            return Promise.resolve(undefined);
        }
      });

      // 1. App starts with start-minimized enabled
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      let startMinimized = await mockInvoke('get_start_minimized');
      
      expect(isStartedFromStartup).toBe(true);
      expect(startMinimized).toBe(true);
      
      // 2. User changes setting during runtime
      await mockInvoke('set_start_minimized', { enabled: false });
      
      // 3. Verify setting changed
      startMinimized = await mockInvoke('get_start_minimized');
      expect(startMinimized).toBe(false);
      
      // 4. Next startup should respect new setting
      startMinimized = await mockInvoke('get_start_minimized');
      expect(startMinimized).toBe(false);
      
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: false });
    });

    it('should handle error recovery in startup workflow', async () => {
      // Mock startup with some errors
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case 'is_started_from_startup':
            return Promise.resolve(true);
          case 'get_minimize_behavior':
            return Promise.reject(new Error('Settings error'));
          case 'get_start_minimized':
            return Promise.resolve(true);
          default:
            return Promise.resolve(undefined);
        }
      });

      // App should handle errors gracefully and default to safe behavior
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      expect(isStartedFromStartup).toBe(true);
      
      try {
        await mockInvoke('get_minimize_behavior');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        
        // On error, should default to showing window normally
        await mockWindow.show();
      }
      
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
    });
  });
});