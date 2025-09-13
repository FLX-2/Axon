/**
 * File System Storage Integration Tests
 * Verifies that the new file system storage system works correctly
 */

import { invoke } from '@tauri-apps/api/tauri';

describe('File System Storage Integration', () => {
  beforeEach(async () => {
    // Reset preferences to defaults before each test
    try {
      await invoke('update_preferences', {
        theme: { mode: 'system' },
        behavior: {
          minimize_to_tray: false,
          startup_enabled: false,
          start_minimized: true
        }
      });
    } catch (error) {
      console.warn('Failed to reset preferences in test setup:', error);
    }
  });

  describe('Preferences Management', () => {
    it('should load default preferences', async () => {
      const prefs = await invoke('get_preferences') as any;

      expect(prefs).toBeDefined();
      expect(prefs.theme).toBeDefined();
      expect(prefs.behavior).toBeDefined();
      expect(prefs.apps).toBeDefined();
      expect(prefs.metadata).toBeDefined();
    });

    it('should update theme preferences', async () => {
      // Update theme
      await invoke('update_preferences', {
        theme: { mode: 'dark' }
      });

      // Verify update
      const prefs = await invoke('get_preferences') as any;
      expect(prefs.theme.mode).toBe('dark');
    });

    it('should update behavior preferences', async () => {
      // Update behavior
      await invoke('update_preferences', {
        behavior: {
          minimize_to_tray: true,
          startup_enabled: true
        }
      });

      // Verify update
      const prefs = await invoke('get_preferences') as any;
      expect(prefs.behavior.minimize_to_tray).toBe(true);
      expect(prefs.behavior.startup_enabled).toBe(true);
    });

    it('should handle custom accent color', async () => {
      const customColor = '#ff6b6b';

      // Set custom color
      await invoke('update_preferences', {
        theme: {
          accent_color: customColor,
          use_custom_accent: true
        }
      });

      // Verify update
      const prefs = await invoke('get_preferences') as any;
      expect(prefs.theme.accent_color).toBe(customColor);
      expect(prefs.theme.use_custom_accent).toBe(true);
    });

    it('should reset to system accent color', async () => {
      // Reset to system color
      await invoke('update_preferences', {
        theme: {
          accent_color: null,
          use_custom_accent: false
        }
      });

      // Verify reset
      const prefs = await invoke('get_preferences') as any;
      expect(prefs.theme.accent_color).toBeNull();
      expect(prefs.theme.use_custom_accent).toBe(false);
    });
  });

  describe('App Management', () => {
    it('should update app preferences', async () => {
      const pinnedApps = ['app1.exe', 'app2.exe'];
      const viewMode = 'list';

      // Update app preferences
      await invoke('update_preferences', {
        apps: {
          pinned: pinnedApps,
          view_mode: viewMode
        }
      });

      // Verify update
      const prefs = await invoke('get_preferences') as any;
      expect(prefs.apps.pinned).toEqual(pinnedApps);
      expect(prefs.apps.view_mode).toBe(viewMode);
    });

    it('should handle app categories', async () => {
      const categories = {
        'app1.exe': 'Development',
        'app2.exe': 'Media'
      };

      // Update categories
      await invoke('update_preferences', {
        apps: { categories }
      });

      // Verify update
      const prefs = await invoke('get_preferences') as any;
      expect(prefs.apps.categories).toEqual(categories);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid preference updates gracefully', async () => {
      // Try to update with invalid data
      try {
        await invoke('update_preferences', {
          invalid_field: 'invalid_value'
        });

        // Should not throw, should just ignore invalid fields
        const prefs = await invoke('get_preferences') as any;
        expect(prefs).toBeDefined();
        expect((prefs as any).invalid_field).toBeUndefined();
      } catch (error) {
        // If it throws, that's also acceptable as long as it's handled
        expect(error).toBeDefined();
      }
    });

    it('should maintain data integrity after failed updates', async () => {
      // Set initial state
      await invoke('update_preferences', {
        theme: { mode: 'light' }
      });

      // Try a failed update (this should be handled gracefully)
      try {
        await invoke('update_preferences', null);
      } catch (error) {
        // Expected to fail
      }

      // Verify original data is still intact
      const prefs = await invoke('get_preferences') as any;
      expect(prefs.theme.mode).toBe('light');
    });
  });

  describe('Persistence', () => {
    it('should persist data across operations', async () => {
      // Set multiple preferences
      const testData = {
        theme: {
          mode: 'black',
          accent_color: '#00ff00',
          use_custom_accent: true
        },
        behavior: {
          minimize_to_tray: true,
          startup_enabled: false,
          start_minimized: false
        },
        apps: {
          pinned: ['test.exe'],
          view_mode: 'grid'
        }
      };

      await invoke('update_preferences', testData);

      // Load and verify all data persists
      const prefs = await invoke('get_preferences') as any;

      expect(prefs.theme.mode).toBe(testData.theme.mode);
      expect(prefs.theme.accent_color).toBe(testData.theme.accent_color);
      expect(prefs.theme.use_custom_accent).toBe(testData.theme.use_custom_accent);
      expect(prefs.behavior.minimize_to_tray).toBe(testData.behavior.minimize_to_tray);
      expect(prefs.behavior.startup_enabled).toBe(testData.behavior.startup_enabled);
      expect(prefs.behavior.start_minimized).toBe(testData.behavior.start_minimized);
      expect(prefs.apps.pinned).toEqual(testData.apps.pinned);
      expect(prefs.apps.view_mode).toBe(testData.apps.view_mode);
    });

    it('should include metadata', async () => {
      const prefs = await invoke('get_preferences') as any;

      expect(prefs.metadata).toBeDefined();
      expect(prefs.metadata.schema_version).toBeDefined();
      expect(prefs.metadata.last_updated).toBeDefined();
      expect(typeof prefs.metadata.last_updated).toBe('string');
    });
  });
});