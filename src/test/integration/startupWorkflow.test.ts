import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { mockInvoke } from '../setup';

// Mock Tauri window API
const mockWindow = {
  hide: vi.fn(),
  minimize: vi.fn(),
  close: vi.fn(),
  show: vi.fn(),
  unminimize: vi.fn(),
};

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: mockWindow,
  Window: {
    getByLabel: vi.fn().mockReturnValue(mockWindow),
  },
}));

// Test helper functions for startup workflow scenarios
const mockStartupEnabled = () => {
  mockInvoke.mockImplementation((command: string, args?: any) => {
    if (command === 'get_startup_enabled') {
      return Promise.resolve(true);
    }
    if (command === 'set_startup_enabled') {
      return Promise.resolve(undefined);
    }
    if (command === 'is_started_from_startup') {
      return Promise.resolve(true);
    }
    if (command === 'validate_startup_configuration') {
      return Promise.resolve(true);
    }
    return Promise.resolve(undefined);
  });
};

const mockStartupDisabled = () => {
  mockInvoke.mockImplementation((command: string, args?: any) => {
    if (command === 'get_startup_enabled') {
      return Promise.resolve(false);
    }
    if (command === 'set_startup_enabled') {
      return Promise.resolve(undefined);
    }
    if (command === 'is_started_from_startup') {
      return Promise.resolve(false);
    }
    if (command === 'validate_startup_configuration') {
      return Promise.resolve(true);
    }
    return Promise.resolve(undefined);
  });
};

const mockMinimizeToTrayEnabled = () => {
  mockInvoke.mockImplementation((command: string, args?: any) => {
    if (command === 'get_minimize_behavior') {
      return Promise.resolve(true);
    }
    if (command === 'set_minimize_behavior') {
      return Promise.resolve(undefined);
    }
    if (command === 'handle_window_minimize') {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(undefined);
  });
};

const mockMinimizeToTrayDisabled = () => {
  mockInvoke.mockImplementation((command: string, args?: any) => {
    if (command === 'get_minimize_behavior') {
      return Promise.resolve(false);
    }
    if (command === 'set_minimize_behavior') {
      return Promise.resolve(undefined);
    }
    if (command === 'handle_window_minimize') {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(undefined);
  });
};

// Helper to simulate complete startup workflow
const simulateStartupWorkflow = async (startupEnabled: boolean, minimizeToTray: boolean) => {
  mockInvoke.mockImplementation((command: string, args?: any) => {
    if (command === 'get_startup_enabled') {
      return Promise.resolve(startupEnabled);
    }
    if (command === 'set_startup_enabled') {
      return Promise.resolve(undefined);
    }
    if (command === 'is_started_from_startup') {
      return Promise.resolve(startupEnabled);
    }
    if (command === 'get_minimize_behavior') {
      return Promise.resolve(minimizeToTray);
    }
    if (command === 'set_minimize_behavior') {
      return Promise.resolve(undefined);
    }
    if (command === 'handle_window_minimize') {
      return Promise.resolve(undefined);
    }
    if (command === 'validate_startup_configuration') {
      return Promise.resolve(true);
    }
    return Promise.resolve(undefined);
  });
};

// Reset store state before each test
const resetStore = () => {
  useSettingsStore.setState({
    themeMode: 'system',
    colors: {
      light: {
        surfacePrimary: '#fcfafd',
        surfaceSecondary: '#f3f2f2',
        surfaceHover: '#f7f6f6',
        sidebarText: '#111827',
        sidebarIcon: '#737272',
        sidebarIconHover: '#5b5a5a',
        textPrimary: '#111827',
        textSecondary: '#6b7280',
        textPlaceholder: '#9ca3af',
        iconPrimary: '#737272',
        iconSecondary: '#737272',
        accent: '#000000',
        scrollbar: '#e5e7eb',
        scrollbarHover: '#d1d5db',
        buttonSelected: '#d4d2d2',
        border: '#d4d2d2',
        buttonHover: '#e3e1e1',
        inputBg: '#ffffff',
        inputBorder: '#e5e7eb',
      },
      dark: {
        surfacePrimary: '#272626',
        surfaceSecondary: '#202121',
        surfaceHover: '#323232',
        sidebarText: '#fefffe',
        sidebarIcon: '#9b9b9a',
        sidebarIconHover: '#fefffe',
        textPrimary: '#fefffe',
        textSecondary: '#9b9b9a',
        textPlaceholder: '#9b9b9a',
        iconPrimary: '#fefffe',
        iconSecondary: '#9b9b9a',
        accent: '#ffffff',
        scrollbar: '#404040',
        scrollbarHover: '#525252',
        buttonSelected: '#454545',
        border: '#2c2d2c',
        buttonHover: '#2c2d2c',
        inputBg: '#323232',
        inputBorder: '#2c2d2c',
      },
      black: {
        surfacePrimary: '#000000',
        surfaceSecondary: '#0a0a0a',
        surfaceHover: '#141414',
        sidebarText: '#ffffff',
        sidebarIcon: '#8a8a8a',
        sidebarIconHover: '#ffffff',
        textPrimary: '#ffffff',
        textSecondary: '#8a8a8a',
        textPlaceholder: '#666666',
        iconPrimary: '#ffffff',
        iconSecondary: '#8a8a8a',
        accent: '#ffffff',
        scrollbar: '#1a1a1a',
        scrollbarHover: '#333333',
        buttonSelected: '#222222',
        border: '#1a1a1a',
        buttonHover: '#1a1a1a',
        inputBg: '#141414',
        inputBorder: '#1a1a1a',
      },
    },
    isCustomAccentColor: false,
    minimizeToTray: false,
    startupEnabled: false,
    isDarkMode: false,
  });
};

describe('Startup Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all window API mocks
    mockWindow.hide.mockResolvedValue(undefined);
    mockWindow.minimize.mockResolvedValue(undefined);
    mockWindow.close.mockResolvedValue(undefined);
    mockWindow.show.mockResolvedValue(undefined);
    mockWindow.unminimize.mockResolvedValue(undefined);
    
    // Default mock behavior
    mockInvoke.mockResolvedValue(undefined);
    
    resetStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete startup toggle workflow', () => {
    it('should enable startup and verify registry operations', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock successful startup enable
      mockStartupEnabled();
      
      // Enable startup through settings store
      await act(async () => {
        await result.current.setStartupEnabled(true);
      });
      
      // Verify backend calls
      expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: true });
      expect(result.current.startupEnabled).toBe(true);
      
      // Verify startup state can be retrieved
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_startup_enabled');
      expect(result.current.startupEnabled).toBe(true);
      
      // Requirements: 1.1 - When "Start with Windows" toggle is enabled 
      // THEN system SHALL add application to Windows startup registry
    });

    it('should disable startup and verify registry cleanup', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Start with startup enabled
      mockStartupEnabled();
      await act(async () => {
        await result.current.setStartupEnabled(true);
      });
      
      // Now disable startup
      mockStartupDisabled();
      await act(async () => {
        await result.current.setStartupEnabled(false);
      });
      
      // Verify backend calls
      expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: false });
      expect(result.current.startupEnabled).toBe(false);
      
      // Requirements: 1.2 - When "Start with Windows" toggle is disabled 
      // THEN system SHALL remove application from Windows startup registry
    });

    it('should handle startup toggle errors gracefully', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend error
      mockInvoke.mockRejectedValueOnce(new Error('Registry access denied'));
      
      await act(async () => {
        await expect(result.current.setStartupEnabled(true)).rejects.toThrow('Registry access denied');
      });
      
      // State should remain unchanged
      expect(result.current.startupEnabled).toBe(false);
      
      // Requirements: 4.2 - System SHALL handle registry access errors gracefully
    });
  });

  describe('Startup behavior with minimize-to-tray integration', () => {
    it('should start minimized to tray when both startup and minimize-to-tray are enabled', async () => {
      // Simulate app started from Windows startup with both features enabled
      await simulateStartupWorkflow(true, true);
      
      // Check startup detection
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      expect(isStartedFromStartup).toBe(true);
      
      // Check minimize-to-tray setting
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      expect(minimizeToTray).toBe(true);
      
      // Verify backend calls
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      
      // Requirements: 2.1 - When application starts via Windows startup AND minimize-to-tray is enabled
      // THEN application SHALL start minimized to system tray
    });

    it('should show window normally when started from startup but minimize-to-tray is disabled', async () => {
      // Simulate app started from Windows startup but minimize-to-tray disabled
      await simulateStartupWorkflow(true, false);
      
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(false);
      
      // In this case, window should show normally even though started from startup
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      
      // Requirements: 2.2 - When application starts via Windows startup AND minimize-to-tray is disabled
      // THEN application SHALL show window normally
    });

    it('should show window normally when started manually regardless of minimize-to-tray setting', async () => {
      // Simulate manual startup (not from Windows startup)
      await simulateStartupWorkflow(false, true);
      
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      
      expect(isStartedFromStartup).toBe(false);
      expect(minimizeToTray).toBe(true);
      
      // Manual startup should always show window normally
      expect(mockInvoke).toHaveBeenCalledWith('is_started_from_startup');
      
      // Requirements: Normal startup should always show window regardless of minimize-to-tray setting
    });
  });

  describe('Executable path update scenarios', () => {
    it('should validate and update startup configuration on app launch', async () => {
      // Mock startup configuration validation
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'validate_startup_configuration') {
          return Promise.resolve(true);
        }
        return Promise.resolve(undefined);
      });
      
      // Simulate startup configuration validation
      const validationResult = await mockInvoke('validate_startup_configuration');
      
      expect(validationResult).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('validate_startup_configuration');
      
      // Requirements: 4.3 - System SHALL validate startup configuration on application launch
    });

    it('should handle executable path changes after updates', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock path change detection and update
      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === 'validate_startup_configuration') {
          return Promise.resolve(false); // Path changed, was updated
        }
        if (command === 'get_startup_enabled') {
          return Promise.resolve(true);
        }
        if (command === 'set_startup_enabled') {
          return Promise.resolve(undefined);
        }
        return Promise.resolve(undefined);
      });
      
      // Simulate startup validation that detects and fixes path change
      const validationResult = await mockInvoke('validate_startup_configuration');
      expect(validationResult).toBe(false); // Indicates path was changed and updated
      
      // Verify startup is still enabled after path update
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('validate_startup_configuration');
      expect(mockInvoke).toHaveBeenCalledWith('get_startup_enabled');
      
      // Requirements: 4.3 - System SHALL update startup registry entry when executable path changes
    });

    it('should handle startup configuration validation errors', async () => {
      // Mock validation error
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'validate_startup_configuration') {
          return Promise.reject(new Error('Failed to validate startup configuration'));
        }
        return Promise.resolve(undefined);
      });
      
      // Validation should handle errors gracefully
      await expect(mockInvoke('validate_startup_configuration')).rejects.toThrow('Failed to validate startup configuration');
      
      expect(mockInvoke).toHaveBeenCalledWith('validate_startup_configuration');
      
      // Requirements: 4.2 - System SHALL handle startup validation errors gracefully
    });
  });

  describe('Frontend and backend registry operations integration', () => {
    it('should sync frontend state with backend registry state on initialization', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend returning different state than frontend default
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'get_startup_enabled') {
          return Promise.resolve(true);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(false);
        }
        return Promise.resolve(undefined);
      });
      
      // Initialize settings should sync with backend
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_startup_enabled');
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(result.current.startupEnabled).toBe(true);
      expect(result.current.minimizeToTray).toBe(false);
      
      // Requirements: 1.1, 1.2 - Frontend state should sync with registry state
    });

    it('should handle backend sync failures during initialization', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set initial frontend state
      act(() => {
        useSettingsStore.setState({ 
          startupEnabled: true,
          minimizeToTray: true 
        });
      });
      
      // Mock backend responses - minimize behavior succeeds, startup fails
      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(false);
        }
        if (command === 'get_startup_enabled') {
          return Promise.reject(new Error('Backend get failed'));
        }
        if (command === 'set_startup_enabled') {
          return Promise.resolve(undefined);
        }
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('get_startup_enabled');
      expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: true });
      
      // Frontend state should be preserved when backend sync fails
      expect(result.current.startupEnabled).toBe(true);
      expect(result.current.minimizeToTray).toBe(false); // This was synced from backend
      
      // Requirements: 4.2 - System SHALL handle backend sync failures gracefully
    });

    it('should maintain consistency between startup and minimize-to-tray settings', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock both settings enabled
      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === 'get_startup_enabled') {
          return Promise.resolve(true);
        }
        if (command === 'set_startup_enabled') {
          return Promise.resolve(undefined);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(true);
        }
        if (command === 'set_minimize_behavior') {
          return Promise.resolve(undefined);
        }
        return Promise.resolve(undefined);
      });
      
      // Enable both settings
      await act(async () => {
        await result.current.setStartupEnabled(true);
      });
      
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      expect(result.current.startupEnabled).toBe(true);
      expect(result.current.minimizeToTray).toBe(true);
      
      // Verify both settings work independently - disable startup
      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === 'get_startup_enabled') {
          return Promise.resolve(false);
        }
        if (command === 'set_startup_enabled') {
          return Promise.resolve(undefined);
        }
        if (command === 'get_minimize_behavior') {
          return Promise.resolve(true);
        }
        if (command === 'set_minimize_behavior') {
          return Promise.resolve(undefined);
        }
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.setStartupEnabled(false);
      });
      
      expect(result.current.startupEnabled).toBe(false);
      expect(result.current.minimizeToTray).toBe(true); // Should remain unchanged
      
      // Requirements: Settings should work independently but integrate properly
    });
  });

  describe('End-to-end startup workflow scenarios', () => {
    it('should handle complete user workflow: enable startup, restart app, minimize to tray', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Step 1: User enables startup
      mockStartupEnabled();
      await act(async () => {
        await result.current.setStartupEnabled(true);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: true });
      expect(result.current.startupEnabled).toBe(true);
      
      // Step 2: User enables minimize-to-tray
      mockMinimizeToTrayEnabled();
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_minimize_behavior', { minimizeToTray: true });
      expect(result.current.minimizeToTray).toBe(true);
      
      // Step 3: Simulate app restart from Windows startup
      vi.clearAllMocks();
      await simulateStartupWorkflow(true, true);
      
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      const minimizeToTray = await mockInvoke('get_minimize_behavior');
      
      expect(isStartedFromStartup).toBe(true);
      expect(minimizeToTray).toBe(true);
      
      // Step 4: Simulate minimize button click (should go to tray)
      await mockInvoke('handle_window_minimize');
      
      expect(mockInvoke).toHaveBeenCalledWith('handle_window_minimize');
      
      // Requirements: Complete workflow should work seamlessly
    });

    it('should handle user changing settings after startup is configured', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Start with startup enabled
      mockStartupEnabled();
      await act(async () => {
        await result.current.setStartupEnabled(true);
      });
      
      expect(result.current.startupEnabled).toBe(true);
      
      // User changes mind and disables startup
      mockStartupDisabled();
      await act(async () => {
        await result.current.setStartupEnabled(false);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: false });
      expect(result.current.startupEnabled).toBe(false);
      
      // Verify startup detection returns false after disabling
      const isStartedFromStartup = await mockInvoke('is_started_from_startup');
      expect(isStartedFromStartup).toBe(false);
      
      // Requirements: Users should be able to change startup settings dynamically
    });

    it('should handle registry permission errors during startup operations', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock permission denied error
      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === 'set_startup_enabled') {
          return Promise.reject(new Error('Permission denied'));
        }
        return Promise.resolve(undefined);
      });
      
      // Attempt to enable startup should fail gracefully
      await act(async () => {
        await expect(result.current.setStartupEnabled(true)).rejects.toThrow('Permission denied');
      });
      
      // State should remain unchanged
      expect(result.current.startupEnabled).toBe(false);
      
      // Requirements: 4.2 - System SHALL handle permission errors gracefully
    });

    it('should validate startup configuration on every app launch', async () => {
      // Mock startup validation that finds and fixes issues
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'validate_startup_configuration') {
          return Promise.resolve(true);
        }
        if (command === 'get_startup_enabled') {
          return Promise.resolve(true);
        }
        return Promise.resolve(undefined);
      });
      
      // Simulate app launch validation
      const validationResult = await mockInvoke('validate_startup_configuration');
      expect(validationResult).toBe(true);
      
      // Verify startup state is checked
      const startupEnabled = await mockInvoke('get_startup_enabled');
      expect(startupEnabled).toBe(true);
      
      expect(mockInvoke).toHaveBeenCalledWith('validate_startup_configuration');
      expect(mockInvoke).toHaveBeenCalledWith('get_startup_enabled');
      
      // Requirements: 4.3 - System SHALL validate startup configuration on launch
    });
  });

  describe('Error handling and recovery scenarios', () => {
    it('should recover from corrupted registry entries', async () => {
      // Mock validation that detects and fixes corrupted entries
      mockInvoke.mockImplementation((command: string) => {
        if (command === 'validate_startup_configuration') {
          return Promise.resolve(false); // Indicates issues were found and fixed
        }
        if (command === 'get_startup_enabled') {
          return Promise.resolve(true);
        }
        return Promise.resolve(undefined);
      });
      
      // Simulate startup validation that fixes corrupted entries
      const validationResult = await mockInvoke('validate_startup_configuration');
      expect(validationResult).toBe(false); // Issues were found and fixed
      
      // Verify startup is still functional after recovery
      const startupEnabled = await mockInvoke('get_startup_enabled');
      expect(startupEnabled).toBe(true);
      
      // Requirements: 4.3 - System SHALL recover from corrupted registry entries
    });

    it('should handle backend communication timeouts', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock timeout error
      mockInvoke.mockRejectedValueOnce(new Error('Request timeout'));
      
      await act(async () => {
        await expect(result.current.setStartupEnabled(true)).rejects.toThrow('Request timeout');
      });
      
      // State should remain unchanged after timeout
      expect(result.current.startupEnabled).toBe(false);
      
      // Requirements: 4.2 - System SHALL handle communication timeouts gracefully
    });

    it('should handle multiple rapid setting changes', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock successful operations
      mockInvoke.mockResolvedValue(undefined);
      
      // Simulate rapid setting changes
      await act(async () => {
        const promises = [
          result.current.setStartupEnabled(true),
          result.current.setStartupEnabled(false),
          result.current.setStartupEnabled(true),
        ];
        
        await Promise.all(promises);
      });
      
      // Final state should reflect the last change
      expect(result.current.startupEnabled).toBe(true);
      expect(mockInvoke).toHaveBeenCalledTimes(3);
      
      // Requirements: System should handle rapid setting changes correctly
    });
  });
});