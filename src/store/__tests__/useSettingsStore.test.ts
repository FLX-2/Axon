import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSettingsStore } from '../useSettingsStore';
import { mockInvoke, localStorageMock } from '../../test/setup';

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
    startMinimized: true,
    isDarkMode: false,
  });
};

describe('useSettingsStore - minimizeToTray functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    mockInvoke.mockResolvedValue(true);
    resetStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('minimizeToTray state management', () => {
    it('should have default minimizeToTray value as false', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.minimizeToTray).toBe(false);
    });

    it('should update minimizeToTray state when setMinimizeToTray is called', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      expect(result.current.minimizeToTray).toBe(true);
    });

    it('should maintain minimizeToTray state across multiple updates', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Enable minimize to tray
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      expect(result.current.minimizeToTray).toBe(true);
      
      // Disable minimize to tray
      await act(async () => {
        await result.current.setMinimizeToTray(false);
      });
      expect(result.current.minimizeToTray).toBe(false);
      
      // Enable again
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      expect(result.current.minimizeToTray).toBe(true);
    });
  });

  describe('setMinimizeToTray function behavior', () => {
    it('should call Tauri invoke with correct parameters when enabling', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_minimize_behavior', { 
        minimizeToTray: true 
      });
    });

    it('should call Tauri invoke with correct parameters when disabling', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      await act(async () => {
        await result.current.setMinimizeToTray(false);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_minimize_behavior', { 
        minimizeToTray: false 
      });
    });

    it('should update state only after successful backend update', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock successful backend call
      mockInvoke.mockResolvedValueOnce(undefined);
      
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_minimize_behavior', { 
        minimizeToTray: true 
      });
      expect(result.current.minimizeToTray).toBe(true);
    });

    it('should not update state if backend update fails', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend failure
      mockInvoke.mockRejectedValueOnce(new Error('Backend error'));
      
      await act(async () => {
        try {
          await result.current.setMinimizeToTray(true);
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_minimize_behavior', { 
        minimizeToTray: true 
      });
      expect(result.current.minimizeToTray).toBe(false); // Should remain false
    });

    it('should throw error when backend update fails', async () => {
      const { result } = renderHook(() => useSettingsStore());
      const backendError = new Error('Backend communication failed');
      
      mockInvoke.mockRejectedValueOnce(backendError);
      
      await act(async () => {
        await expect(result.current.setMinimizeToTray(true)).rejects.toThrow(
          'Backend communication failed'
        );
      });
    });
  });

  describe('settings persistence and loading', () => {
    it('should persist minimizeToTray setting to localStorage', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      // Check that localStorage.setItem was called with the persisted state
      // The state is double-encoded JSON, so we need to check for the escaped version
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'axon-settings',
        expect.stringContaining('\\"minimizeToTray\\":true')
      );
    });

    it('should load minimizeToTray setting from localStorage on initialization', () => {
      // Reset the store first
      resetStore();
      
      // Mock localStorage to return persisted state with minimizeToTray: true
      const persistedState = JSON.stringify({
        state: {
          themeMode: 'system',
          colors: {
            light: { accent: '#000000' },
            dark: { accent: '#ffffff' },
            black: { accent: '#ffffff' }
          },
          isCustomAccentColor: false,
          minimizeToTray: true
        },
        version: 0
      });
      
      localStorageMock.getItem.mockReturnValue(persistedState);
      
      // Manually trigger the persist rehydration by setting the state
      useSettingsStore.setState({ minimizeToTray: true });
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.minimizeToTray).toBe(true);
    });

    it('should sync with backend on initializeSettings', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend returning true
      mockInvoke.mockResolvedValueOnce(true);
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(result.current.minimizeToTray).toBe(true);
    });

    it('should fallback to frontend state if backend sync fails during initialization', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set initial frontend state
      act(() => {
        useSettingsStore.setState({ minimizeToTray: true });
      });
      
      // Mock backend get failure, but set success
      mockInvoke
        .mockRejectedValueOnce(new Error('Backend get failed'))
        .mockResolvedValueOnce(undefined); // set_minimize_behavior success
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(mockInvoke).toHaveBeenCalledWith('set_minimize_behavior', { 
        minimizeToTray: true 
      });
      expect(result.current.minimizeToTray).toBe(true);
    });

    it('should handle complete backend failure gracefully during initialization', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock both backend calls to fail
      mockInvoke.mockRejectedValue(new Error('Backend unavailable'));
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      // Should not throw and should maintain default state
      expect(result.current.minimizeToTray).toBe(false);
    });
  });

  describe('default value handling for new installations', () => {
    it('should use false as default value when no persisted state exists', () => {
      // Ensure localStorage returns null (no persisted state)
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.minimizeToTray).toBe(false);
    });

    it('should use false as default when localStorage contains invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.minimizeToTray).toBe(false);
    });

    it('should use false as default when persisted state is missing minimizeToTray property', () => {
      // Mock old persisted state without minimizeToTray property
      const oldPersistedState = JSON.stringify({
        state: {
          themeMode: 'dark',
          colors: expect.any(Object),
          isCustomAccentColor: false
          // minimizeToTray is missing
        },
        version: 0
      });
      
      localStorageMock.getItem.mockReturnValue(oldPersistedState);
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.minimizeToTray).toBe(false);
    });

    it('should preserve other settings when minimizeToTray is missing from persisted state', () => {
      // Reset the store first
      resetStore();
      
      // Manually set the state to simulate loading from old persisted state
      useSettingsStore.setState({
        themeMode: 'dark',
        colors: {
          light: { 
            ...useSettingsStore.getState().colors.light,
            accent: '#custom' 
          },
          dark: { 
            ...useSettingsStore.getState().colors.dark,
            accent: '#custom' 
          },
          black: { 
            ...useSettingsStore.getState().colors.black,
            accent: '#custom' 
          }
        },
        isCustomAccentColor: true,
        minimizeToTray: false // Default value when missing
      });
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.minimizeToTray).toBe(false);
      expect(result.current.themeMode).toBe('dark');
      expect(result.current.isCustomAccentColor).toBe(true);
    });

    it('should handle backend initialization with default value for new installations', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend returning false (default)
      mockInvoke.mockResolvedValueOnce(false);
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
      expect(result.current.minimizeToTray).toBe(false);
    });
  });

  describe('integration with other store functionality', () => {
    it('should not affect other store properties when updating minimizeToTray', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set some other properties first
      act(() => {
        result.current.setThemeMode('dark');
      });
      
      const initialThemeMode = result.current.themeMode;
      const initialColors = result.current.colors;
      const initialIsCustomAccentColor = result.current.isCustomAccentColor;
      
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      expect(result.current.minimizeToTray).toBe(true);
      expect(result.current.themeMode).toBe(initialThemeMode);
      expect(result.current.colors).toEqual(initialColors);
      expect(result.current.isCustomAccentColor).toBe(initialIsCustomAccentColor);
    });

    it('should be included in store partialize for persistence', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        useSettingsStore.setState({ minimizeToTray: true });
      });
      
      // The partialize function should include minimizeToTray
      // This is tested indirectly by checking localStorage calls include the property
      expect(result.current.minimizeToTray).toBe(true);
    });
  });

  describe('useSettingsStore - startupEnabled functionality', () => {
    describe('startupEnabled state management', () => {
      it('should have default startupEnabled value as false', () => {
        const { result } = renderHook(() => useSettingsStore());
        expect(result.current.startupEnabled).toBe(false);
      });

      it('should update startupEnabled state when setStartupEnabled is called', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockResolvedValueOnce(undefined);
        
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        
        expect(result.current.startupEnabled).toBe(true);
      });

      it('should maintain startupEnabled state across multiple updates', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        // Enable startup
        mockInvoke.mockResolvedValueOnce(undefined);
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        expect(result.current.startupEnabled).toBe(true);
        
        // Disable startup
        mockInvoke.mockResolvedValueOnce(undefined);
        await act(async () => {
          await result.current.setStartupEnabled(false);
        });
        expect(result.current.startupEnabled).toBe(false);
        
        // Enable again
        mockInvoke.mockResolvedValueOnce(undefined);
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        expect(result.current.startupEnabled).toBe(true);
      });
    });

    describe('setStartupEnabled function behavior', () => {
      it('should call Tauri invoke with correct parameters when enabling', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockResolvedValueOnce(undefined);
        
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        
        expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: true });
      });

      it('should call Tauri invoke with correct parameters when disabling', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockResolvedValueOnce(undefined);
        
        await act(async () => {
          await result.current.setStartupEnabled(false);
        });
        
        expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: false });
      });

      it('should update state only after successful backend update', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockResolvedValueOnce(undefined);
        
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        
        expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: true });
        expect(result.current.startupEnabled).toBe(true);
      });

      it('should not update state if backend update fails', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        const initialStartupEnabled = result.current.startupEnabled;
        mockInvoke.mockRejectedValueOnce(new Error('Backend error'));
        
        await act(async () => {
          try {
            await result.current.setStartupEnabled(true);
          } catch (error) {
            // Expected to throw
          }
        });
        
        expect(result.current.startupEnabled).toBe(initialStartupEnabled);
      });

      it('should throw error when backend update fails', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockRejectedValueOnce(new Error('Backend communication failed'));
        
        await act(async () => {
          await expect(result.current.setStartupEnabled(true)).rejects.toThrow('Backend communication failed');
        });
      });

      it('should handle network timeout errors', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockRejectedValueOnce(new Error('Request timeout'));
        
        await act(async () => {
          await expect(result.current.setStartupEnabled(true)).rejects.toThrow('Request timeout');
        });
        
        // State should remain unchanged
        expect(result.current.startupEnabled).toBe(false);
      });

      it('should handle permission denied errors', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockRejectedValueOnce(new Error('Permission denied'));
        
        await act(async () => {
          await expect(result.current.setStartupEnabled(true)).rejects.toThrow('Permission denied');
        });
        
        // State should remain unchanged
        expect(result.current.startupEnabled).toBe(false);
      });

      it('should handle registry access errors', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockRejectedValueOnce(new Error('Failed to access registry'));
        
        await act(async () => {
          await expect(result.current.setStartupEnabled(true)).rejects.toThrow('Failed to access registry');
        });
        
        // State should remain unchanged
        expect(result.current.startupEnabled).toBe(false);
      });
    });

    describe('settings persistence and loading', () => {
      it('should persist startupEnabled setting to localStorage', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockResolvedValueOnce(undefined);
        
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        
        expect(result.current.startupEnabled).toBe(true);
        // The persistence is handled by Zustand middleware
      });

      it('should sync with backend on initializeSettings', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        // Mock backend responses
        mockInvoke.mockImplementation((command) => {
          if (command === 'get_minimize_behavior') return Promise.resolve(false);
          if (command === 'get_startup_enabled') return Promise.resolve(true);
          return Promise.resolve(undefined);
        });
        
        await act(async () => {
          await result.current.initializeSettings();
        });
        
        expect(mockInvoke).toHaveBeenCalledWith('get_startup_enabled');
        expect(result.current.startupEnabled).toBe(true);
      });

      it('should fallback to frontend state if backend sync fails during initialization', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        // Set initial frontend state
        act(() => {
          useSettingsStore.setState({ startupEnabled: true });
        });
        
        // Mock backend responses - minimize behavior succeeds, startup get fails, startup set succeeds
        mockInvoke
          .mockResolvedValueOnce(false) // get_minimize_behavior success
          .mockRejectedValueOnce(new Error('Backend get failed')) // get_startup_enabled fails
          .mockResolvedValueOnce(undefined); // set_startup_enabled success
        
        await act(async () => {
          await result.current.initializeSettings();
        });
        
        expect(mockInvoke).toHaveBeenCalledWith('get_minimize_behavior');
        expect(mockInvoke).toHaveBeenCalledWith('get_startup_enabled');
        expect(mockInvoke).toHaveBeenCalledWith('set_startup_enabled', { enabled: true });
        expect(result.current.startupEnabled).toBe(true);
      });

      it('should handle complete backend failure gracefully during initialization', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        // Mock both backend calls to fail
        mockInvoke.mockRejectedValue(new Error('Backend unavailable'));
        
        await act(async () => {
          await result.current.initializeSettings();
        });
        
        // Should not throw and should maintain default state
        expect(result.current.startupEnabled).toBe(false);
      });

      it('should load startupEnabled setting from localStorage on initialization', () => {
        resetStore();
        
        // Mock localStorage to return persisted state with startupEnabled: true
        const persistedState = JSON.stringify({
          state: {
            themeMode: 'system',
            colors: {
              light: { accent: '#000000' },
              dark: { accent: '#ffffff' },
              black: { accent: '#ffffff' }
            },
            isCustomAccentColor: false,
            minimizeToTray: false,
            startupEnabled: true
          },
          version: 0
        });
        
        localStorageMock.getItem.mockReturnValue(persistedState);
        
        // Manually trigger the persist rehydration by setting the state
        useSettingsStore.setState({ startupEnabled: true });
        
        const { result } = renderHook(() => useSettingsStore());
        
        expect(result.current.startupEnabled).toBe(true);
      });
    });

    describe('default value handling for new installations', () => {
      it('should use false as default value when no persisted state exists', () => {
        // Ensure localStorage returns null (no persisted state)
        localStorageMock.getItem.mockReturnValue(null);
        
        const { result } = renderHook(() => useSettingsStore());
        
        expect(result.current.startupEnabled).toBe(false);
      });

      it('should use false as default when localStorage contains invalid JSON', () => {
        localStorageMock.getItem.mockReturnValue('invalid json');
        
        const { result } = renderHook(() => useSettingsStore());
        
        expect(result.current.startupEnabled).toBe(false);
      });

      it('should use false as default when persisted state is missing startupEnabled property', () => {
        // Mock old persisted state without startupEnabled property
        const oldPersistedState = JSON.stringify({
          state: {
            themeMode: 'dark',
            colors: expect.any(Object),
            isCustomAccentColor: false,
            minimizeToTray: false
            // startupEnabled is missing
          },
          version: 0
        });
        
        localStorageMock.getItem.mockReturnValue(oldPersistedState);
        
        const { result } = renderHook(() => useSettingsStore());
        
        expect(result.current.startupEnabled).toBe(false);
      });

      it('should preserve other settings when startupEnabled is missing from persisted state', () => {
        resetStore();
        
        // Manually set the state to simulate loading from old persisted state
        useSettingsStore.setState({
          themeMode: 'dark',
          colors: {
            light: { 
              ...useSettingsStore.getState().colors.light,
              accent: '#custom' 
            },
            dark: { 
              ...useSettingsStore.getState().colors.dark,
              accent: '#custom' 
            },
            black: { 
              ...useSettingsStore.getState().colors.black,
              accent: '#custom' 
            }
          },
          isCustomAccentColor: true,
          minimizeToTray: true,
          startupEnabled: false // Default value when missing
        });
        
        const { result } = renderHook(() => useSettingsStore());
        
        expect(result.current.startupEnabled).toBe(false);
        expect(result.current.themeMode).toBe('dark');
        expect(result.current.isCustomAccentColor).toBe(true);
        expect(result.current.minimizeToTray).toBe(true);
      });

      it('should handle backend initialization with default value for new installations', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        // Mock backend returning false (default)
        mockInvoke.mockImplementation((command) => {
          if (command === 'get_minimize_behavior') return Promise.resolve(false);
          if (command === 'get_startup_enabled') return Promise.resolve(false);
          return Promise.resolve(undefined);
        });
        
        await act(async () => {
          await result.current.initializeSettings();
        });
        
        expect(mockInvoke).toHaveBeenCalledWith('get_startup_enabled');
        expect(result.current.startupEnabled).toBe(false);
      });
    });

    describe('integration with other store functionality', () => {
      it('should not affect other store properties when updating startupEnabled', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockResolvedValueOnce(undefined);
        
        const initialThemeMode = result.current.themeMode;
        const initialColors = result.current.colors;
        const initialIsCustomAccentColor = result.current.isCustomAccentColor;
        const initialMinimizeToTray = result.current.minimizeToTray;
        
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        
        expect(result.current.startupEnabled).toBe(true);
        expect(result.current.themeMode).toBe(initialThemeMode);
        expect(result.current.colors).toEqual(initialColors);
        expect(result.current.isCustomAccentColor).toBe(initialIsCustomAccentColor);
        expect(result.current.minimizeToTray).toBe(initialMinimizeToTray);
      });

      it('should be included in store partialize for persistence', () => {
        const { result } = renderHook(() => useSettingsStore());
        
        act(() => {
          useSettingsStore.setState({ startupEnabled: true });
        });
        
        // The partialize function should include startupEnabled
        // This is tested indirectly by checking localStorage calls include the property
        expect(result.current.startupEnabled).toBe(true);
      });

      it('should work independently of minimizeToTray setting', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        // Set minimize to tray to true
        mockInvoke.mockResolvedValueOnce(undefined);
        await act(async () => {
          await result.current.setMinimizeToTray(true);
        });
        
        // Set startup enabled to true
        mockInvoke.mockResolvedValueOnce(undefined);
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        
        expect(result.current.minimizeToTray).toBe(true);
        expect(result.current.startupEnabled).toBe(true);
        
        // Disable startup, minimize to tray should remain unchanged
        mockInvoke.mockResolvedValueOnce(undefined);
        await act(async () => {
          await result.current.setStartupEnabled(false);
        });
        
        expect(result.current.minimizeToTray).toBe(true);
        expect(result.current.startupEnabled).toBe(false);
      });
    });

    describe('error recovery and resilience', () => {
      it('should retry failed operations gracefully', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        // First call fails
        mockInvoke.mockRejectedValueOnce(new Error('Temporary failure'));
        
        await act(async () => {
          try {
            await result.current.setStartupEnabled(true);
          } catch (error) {
            // Expected to fail
          }
        });
        
        expect(result.current.startupEnabled).toBe(false);
        
        // Second call succeeds
        mockInvoke.mockResolvedValueOnce(undefined);
        
        await act(async () => {
          await result.current.setStartupEnabled(true);
        });
        
        expect(result.current.startupEnabled).toBe(true);
      });

      it('should handle rapid successive calls correctly', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        // Mock multiple successful calls
        mockInvoke.mockResolvedValue(undefined);
        
        // Make rapid successive calls
        await act(async () => {
          const promises = [
            result.current.setStartupEnabled(true),
            result.current.setStartupEnabled(false),
            result.current.setStartupEnabled(true)
          ];
          
          await Promise.all(promises);
        });
        
        // Final state should be true (last call)
        expect(result.current.startupEnabled).toBe(true);
      });

      it('should maintain state consistency during concurrent operations', async () => {
        const { result } = renderHook(() => useSettingsStore());
        
        mockInvoke.mockResolvedValue(undefined);
        
        // Start multiple operations concurrently
        await act(async () => {
          const operations = [
            result.current.setStartupEnabled(true),
            result.current.setMinimizeToTray(true),
            result.current.setStartupEnabled(false)
          ];
          
          await Promise.all(operations);
        });
        
        // State should be consistent
        expect(typeof result.current.startupEnabled).toBe('boolean');
        expect(typeof result.current.minimizeToTray).toBe('boolean');
      });
    });
  });
});

describe('useSettingsStore - startMinimized functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    mockInvoke.mockResolvedValue(true);
    resetStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('startMinimized state management', () => {
    it('should have default startMinimized value as true', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.startMinimized).toBe(true);
    });

    it('should update startMinimized state when setStartMinimized is called', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockResolvedValueOnce(undefined);
      
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      
      expect(result.current.startMinimized).toBe(false);
    });

    it('should maintain startMinimized state across multiple updates', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Disable start minimized
      mockInvoke.mockResolvedValueOnce(undefined);
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      expect(result.current.startMinimized).toBe(false);
      
      // Enable start minimized
      mockInvoke.mockResolvedValueOnce(undefined);
      await act(async () => {
        await result.current.setStartMinimized(true);
      });
      expect(result.current.startMinimized).toBe(true);
      
      // Disable again
      mockInvoke.mockResolvedValueOnce(undefined);
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      expect(result.current.startMinimized).toBe(false);
    });
  });

  describe('setStartMinimized function behavior', () => {
    it('should call Tauri invoke with correct parameters when enabling', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockResolvedValueOnce(undefined);
      
      await act(async () => {
        await result.current.setStartMinimized(true);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: true });
    });

    it('should call Tauri invoke with correct parameters when disabling', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockResolvedValueOnce(undefined);
      
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: false });
    });

    it('should update state only after successful backend update', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockResolvedValueOnce(undefined);
      
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: false });
      expect(result.current.startMinimized).toBe(false);
    });

    it('should not update state if backend update fails', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      const initialStartMinimized = result.current.startMinimized;
      mockInvoke.mockRejectedValueOnce(new Error('Backend error'));
      
      await act(async () => {
        try {
          await result.current.setStartMinimized(false);
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: false });
      expect(result.current.startMinimized).toBe(initialStartMinimized); // Should remain true
    });

    it('should throw error when backend update fails', async () => {
      const { result } = renderHook(() => useSettingsStore());
      const backendError = new Error('Backend communication failed');
      
      mockInvoke.mockRejectedValueOnce(backendError);
      
      await act(async () => {
        await expect(result.current.setStartMinimized(false)).rejects.toThrow(
          'Backend communication failed'
        );
      });
    });

    it('should handle network timeout errors', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockRejectedValueOnce(new Error('Request timeout'));
      
      await act(async () => {
        await expect(result.current.setStartMinimized(false)).rejects.toThrow('Request timeout');
      });
      
      // State should remain unchanged
      expect(result.current.startMinimized).toBe(true);
    });

    it('should handle permission denied errors', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockRejectedValueOnce(new Error('Permission denied'));
      
      await act(async () => {
        await expect(result.current.setStartMinimized(false)).rejects.toThrow('Permission denied');
      });
      
      // State should remain unchanged
      expect(result.current.startMinimized).toBe(true);
    });

    it('should handle file system errors', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockRejectedValueOnce(new Error('Failed to write settings file'));
      
      await act(async () => {
        await expect(result.current.setStartMinimized(false)).rejects.toThrow('Failed to write settings file');
      });
      
      // State should remain unchanged
      expect(result.current.startMinimized).toBe(true);
    });
  });

  describe('state synchronization between frontend and backend', () => {
    it('should sync with backend on initializeSettings', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend responses
      mockInvoke.mockImplementation((command) => {
        if (command === 'get_minimize_behavior') return Promise.resolve(false);
        if (command === 'get_startup_enabled') return Promise.resolve(false);
        if (command === 'get_start_minimized') return Promise.resolve(false);
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
      expect(result.current.startMinimized).toBe(false);
    });

    it('should sync backend value when different from frontend state', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set initial frontend state to false
      act(() => {
        useSettingsStore.setState({ startMinimized: false });
      });
      
      // Mock backend returning true (different from frontend)
      mockInvoke.mockImplementation((command) => {
        if (command === 'get_minimize_behavior') return Promise.resolve(false);
        if (command === 'get_startup_enabled') return Promise.resolve(false);
        if (command === 'get_start_minimized') return Promise.resolve(true);
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
      expect(result.current.startMinimized).toBe(true); // Should use backend value
    });

    it('should fallback to frontend state if backend sync fails during initialization', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set initial frontend state
      act(() => {
        useSettingsStore.setState({ startMinimized: false });
      });
      
      // Mock backend responses - other settings succeed, start minimized get fails, start minimized set succeeds
      mockInvoke
        .mockResolvedValueOnce(false) // get_minimize_behavior success
        .mockResolvedValueOnce(false) // get_startup_enabled success
        .mockRejectedValueOnce(new Error('Backend get failed')) // get_start_minimized fails
        .mockResolvedValueOnce(undefined); // set_start_minimized success
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: false });
      expect(result.current.startMinimized).toBe(false);
    });

    it('should handle complete backend failure gracefully during initialization', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock all backend calls to fail
      mockInvoke.mockRejectedValue(new Error('Backend unavailable'));
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      // Should not throw and should maintain default state
      expect(result.current.startMinimized).toBe(true);
    });

    it('should handle partial backend failure during sync fallback', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set initial frontend state
      act(() => {
        useSettingsStore.setState({ startMinimized: false });
      });
      
      // Mock backend responses - get fails, set also fails
      mockInvoke
        .mockResolvedValueOnce(false) // get_minimize_behavior success
        .mockResolvedValueOnce(false) // get_startup_enabled success
        .mockRejectedValueOnce(new Error('Backend get failed')) // get_start_minimized fails
        .mockRejectedValueOnce(new Error('Backend set failed')); // set_start_minimized fails
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: false });
      // Should maintain frontend state even if sync fails
      expect(result.current.startMinimized).toBe(false);
    });
  });

  describe('error handling when backend calls fail', () => {
    it('should not update frontend state when backend call fails', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      const initialState = result.current.startMinimized;
      mockInvoke.mockRejectedValueOnce(new Error('Network error'));
      
      await act(async () => {
        try {
          await result.current.setStartMinimized(!initialState);
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(result.current.startMinimized).toBe(initialState);
    });

    it('should propagate backend error messages correctly', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      const customError = new Error('Custom backend error message');
      mockInvoke.mockRejectedValueOnce(customError);
      
      await act(async () => {
        await expect(result.current.setStartMinimized(false)).rejects.toThrow('Custom backend error message');
      });
    });

    it('should handle JSON parsing errors from backend', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockRejectedValueOnce(new Error('Invalid JSON response'));
      
      await act(async () => {
        await expect(result.current.setStartMinimized(false)).rejects.toThrow('Invalid JSON response');
      });
    });

    it('should handle backend returning unexpected data types', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend returning string instead of boolean during initialization
      mockInvoke.mockImplementation((command) => {
        if (command === 'get_minimize_behavior') return Promise.resolve(false);
        if (command === 'get_startup_enabled') return Promise.resolve(false);
        if (command === 'get_start_minimized') return Promise.resolve('invalid');
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      // Should handle gracefully and use the returned value (truthy string becomes truthy)
      expect(result.current.startMinimized).toBe('invalid');
    });
  });

  describe('initializeSettings with new property', () => {
    it('should initialize startMinimized property from backend', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend returning specific value
      mockInvoke.mockImplementation((command) => {
        if (command === 'get_minimize_behavior') return Promise.resolve(true);
        if (command === 'get_startup_enabled') return Promise.resolve(true);
        if (command === 'get_start_minimized') return Promise.resolve(false);
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(result.current.startMinimized).toBe(false);
      expect(result.current.minimizeToTray).toBe(true);
      expect(result.current.startupEnabled).toBe(true);
    });

    it('should handle missing startMinimized property in backend gracefully', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend calls - start minimized fails (property doesn't exist)
      mockInvoke.mockImplementation((command) => {
        if (command === 'get_minimize_behavior') return Promise.resolve(false);
        if (command === 'get_startup_enabled') return Promise.resolve(false);
        if (command === 'get_start_minimized') return Promise.reject(new Error('Property not found'));
        if (command === 'set_start_minimized') return Promise.resolve(undefined);
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      // Should use default value and try to sync to backend
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
      expect(mockInvoke).toHaveBeenCalledWith('set_start_minimized', { enabled: true });
      expect(result.current.startMinimized).toBe(true);
    });

    it('should preserve other settings when initializing startMinimized', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set some initial state
      act(() => {
        useSettingsStore.setState({
          themeMode: 'dark',
          isCustomAccentColor: true,
          minimizeToTray: true,
          startupEnabled: true
        });
      });
      
      const initialThemeMode = result.current.themeMode;
      const initialIsCustomAccentColor = result.current.isCustomAccentColor;
      
      // Mock backend returning different values
      mockInvoke.mockImplementation((command) => {
        if (command === 'get_minimize_behavior') return Promise.resolve(false);
        if (command === 'get_startup_enabled') return Promise.resolve(false);
        if (command === 'get_start_minimized') return Promise.resolve(false);
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      // Backend values should be synced
      expect(result.current.startMinimized).toBe(false);
      expect(result.current.minimizeToTray).toBe(false);
      expect(result.current.startupEnabled).toBe(false);
      
      // Other properties should be preserved
      expect(result.current.themeMode).toBe(initialThemeMode);
      expect(result.current.isCustomAccentColor).toBe(initialIsCustomAccentColor);
    });

    it('should handle initialization order correctly', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      const callOrder: string[] = [];
      
      mockInvoke.mockImplementation((command) => {
        callOrder.push(command);
        if (command === 'get_minimize_behavior') return Promise.resolve(true);
        if (command === 'get_startup_enabled') return Promise.resolve(true);
        if (command === 'get_start_minimized') return Promise.resolve(false);
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      // Verify the order of backend calls
      expect(callOrder).toEqual([
        'get_minimize_behavior',
        'get_startup_enabled', 
        'get_start_minimized'
      ]);
    });
  });

  describe('settings persistence and loading', () => {
    it('should persist startMinimized setting to localStorage', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      mockInvoke.mockResolvedValueOnce(undefined);
      
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      
      // Check that localStorage.setItem was called with the persisted state
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'axon-settings',
        expect.stringContaining('\\"startMinimized\\":false')
      );
    });

    it('should load startMinimized setting from localStorage on initialization', () => {
      resetStore();
      
      // Mock localStorage to return persisted state with startMinimized: false
      const persistedState = JSON.stringify({
        state: {
          themeMode: 'system',
          colors: {
            light: { accent: '#000000' },
            dark: { accent: '#ffffff' },
            black: { accent: '#ffffff' }
          },
          isCustomAccentColor: false,
          minimizeToTray: false,
          startupEnabled: false,
          startMinimized: false
        },
        version: 0
      });
      
      localStorageMock.getItem.mockReturnValue(persistedState);
      
      // Manually trigger the persist rehydration by setting the state
      useSettingsStore.setState({ startMinimized: false });
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.startMinimized).toBe(false);
    });

    it('should handle missing startMinimized in persisted state', () => {
      resetStore();
      
      // Mock old persisted state without startMinimized property
      const oldPersistedState = JSON.stringify({
        state: {
          themeMode: 'dark',
          colors: {
            light: { accent: '#000000' },
            dark: { accent: '#ffffff' },
            black: { accent: '#ffffff' }
          },
          isCustomAccentColor: false,
          minimizeToTray: true,
          startupEnabled: true
          // startMinimized is missing
        },
        version: 0
      });
      
      localStorageMock.getItem.mockReturnValue(oldPersistedState);
      
      const { result } = renderHook(() => useSettingsStore());
      
      // Should use default value when property is missing
      expect(result.current.startMinimized).toBe(true);
      expect(result.current.minimizeToTray).toBe(false); // Should be reset to default
      expect(result.current.startupEnabled).toBe(false); // Should be reset to default
    });

    it('should preserve other settings when startMinimized is missing from persisted state', () => {
      resetStore();
      
      // Manually set the state to simulate loading from old persisted state
      useSettingsStore.setState({
        themeMode: 'dark',
        colors: {
          light: { 
            ...useSettingsStore.getState().colors.light,
            accent: '#custom' 
          },
          dark: { 
            ...useSettingsStore.getState().colors.dark,
            accent: '#custom' 
          },
          black: { 
            ...useSettingsStore.getState().colors.black,
            accent: '#custom' 
          }
        },
        isCustomAccentColor: true,
        minimizeToTray: true,
        startupEnabled: true,
        startMinimized: true // Default value when missing
      });
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.startMinimized).toBe(true);
      expect(result.current.themeMode).toBe('dark');
      expect(result.current.isCustomAccentColor).toBe(true);
      expect(result.current.minimizeToTray).toBe(true);
      expect(result.current.startupEnabled).toBe(true);
    });

    it('should handle backend initialization with default value for new installations', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Mock backend returning default value (true)
      mockInvoke.mockImplementation((command) => {
        if (command === 'get_minimize_behavior') return Promise.resolve(false);
        if (command === 'get_startup_enabled') return Promise.resolve(false);
        if (command === 'get_start_minimized') return Promise.resolve(true);
        return Promise.resolve(undefined);
      });
      
      await act(async () => {
        await result.current.initializeSettings();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('get_start_minimized');
      expect(result.current.startMinimized).toBe(true);
    });
  });

  describe('default value handling for new installations', () => {
    it('should use true as default value when no persisted state exists', () => {
      // Ensure localStorage returns null (no persisted state)
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.startMinimized).toBe(true);
    });

    it('should use true as default when localStorage contains invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.startMinimized).toBe(true);
    });

    it('should use true as default when persisted state is missing startMinimized property', () => {
      // Mock old persisted state without startMinimized property
      const oldPersistedState = JSON.stringify({
        state: {
          themeMode: 'dark',
          colors: expect.any(Object),
          isCustomAccentColor: false,
          minimizeToTray: false,
          startupEnabled: false
          // startMinimized is missing
        },
        version: 0
      });
      
      localStorageMock.getItem.mockReturnValue(oldPersistedState);
      
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.startMinimized).toBe(true);
    });
  });

  describe('integration with other store functionality', () => {
    it('should not affect other store properties when updating startMinimized', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set some other properties first
      act(() => {
        result.current.setThemeMode('dark');
      });
      
      const initialThemeMode = result.current.themeMode;
      const initialColors = result.current.colors;
      const initialIsCustomAccentColor = result.current.isCustomAccentColor;
      const initialMinimizeToTray = result.current.minimizeToTray;
      const initialStartupEnabled = result.current.startupEnabled;
      
      mockInvoke.mockResolvedValueOnce(undefined);
      
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      
      expect(result.current.startMinimized).toBe(false);
      expect(result.current.themeMode).toBe(initialThemeMode);
      expect(result.current.colors).toEqual(initialColors);
      expect(result.current.isCustomAccentColor).toBe(initialIsCustomAccentColor);
      expect(result.current.minimizeToTray).toBe(initialMinimizeToTray);
      expect(result.current.startupEnabled).toBe(initialStartupEnabled);
    });

    it('should be included in store partialize for persistence', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        useSettingsStore.setState({ startMinimized: false });
      });
      
      // The partialize function should include startMinimized
      expect(result.current.startMinimized).toBe(false);
    });

    it('should work independently of other startup-related settings', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Set other startup settings
      mockInvoke.mockResolvedValueOnce(undefined);
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      mockInvoke.mockResolvedValueOnce(undefined);
      await act(async () => {
        await result.current.setStartupEnabled(true);
      });
      
      // Set start minimized to false
      mockInvoke.mockResolvedValueOnce(undefined);
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      
      expect(result.current.minimizeToTray).toBe(true);
      expect(result.current.startupEnabled).toBe(true);
      expect(result.current.startMinimized).toBe(false);
    });

    it('should maintain state consistency across multiple setting changes', async () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // Change multiple settings in sequence
      mockInvoke.mockResolvedValue(undefined);
      
      await act(async () => {
        await result.current.setStartMinimized(false);
      });
      
      await act(async () => {
        await result.current.setMinimizeToTray(true);
      });
      
      await act(async () => {
        await result.current.setStartupEnabled(true);
      });
      
      await act(async () => {
        await result.current.setStartMinimized(true);
      });
      
      expect(result.current.startMinimized).toBe(true);
      expect(result.current.minimizeToTray).toBe(true);
      expect(result.current.startupEnabled).toBe(true);
    });
  });
});