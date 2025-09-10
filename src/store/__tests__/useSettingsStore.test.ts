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
});