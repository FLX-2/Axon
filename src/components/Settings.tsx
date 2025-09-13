import React from 'react';
import { useUnifiedSettingsStore } from '../store/useUnifiedSettingsStore';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Palette, RotateCcw, MoonStar, RefreshCw } from 'lucide-react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { PATTERNS, STATES, TYPOGRAPHY, SPACING, HEIGHTS } from '../lib/designTokens';

export const Settings: React.FC = () => {
  const settings = useUnifiedSettingsStore();
  const appStore = useUnifiedAppStore();
  // Show loading animation for at least 800ms for better UX
  const isRefreshing = useDelayedLoading(appStore.isLoading, 800);
  const {
    themeMode,
    setThemeMode,
    colors,
    setAccentColor,
    resetToSystemAccentColor,
    isCustomAccentColor,
  } = settings;

  const activeColors = themeMode === 'dark' ? colors.dark : colors.light;

  return (
    <div className={SPACING.container}>
      <div className={SPACING.section}>
        <div className={SPACING.items}>
          <h3 className={PATTERNS.sectionHeader}>
            <Palette className="w-4 h-4" />
            Customization
          </h3>
          <div className={SPACING.items}>
            <div className={PATTERNS.settingItem}>
              <div className={PATTERNS.labelWithDescription}>
                <span className={TYPOGRAPHY.label}>Theme</span>
                <span className={TYPOGRAPHY.description}>
                  Choose your preferred color scheme for the interface
                </span>
              </div>
              <div className="flex space-x-2 flex-wrap gap-2">
                {[
                  { value: 'light' as const, icon: Sun, label: 'Light' },
                  { value: 'dark' as const, icon: Moon, label: 'Dark' },
                  { value: 'black' as const, icon: MoonStar, label: 'Black' },
                  { value: 'system' as const, icon: Monitor, label: 'System' },
                ].map((option) => {
                  const isSelected = themeMode === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => setThemeMode(option.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors h-10 ${
                        isSelected
                          ? 'bg-accent text-white'
                          : 'bg-surfaceSecondary hover:bg-surfaceHover text-textPrimary'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      <span className={TYPOGRAPHY.labelSize}>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={PATTERNS.settingItem}>
              <div className={PATTERNS.labelWithDescription}>
                <span className={TYPOGRAPHY.label}>Accent Color</span>
                <span className={TYPOGRAPHY.description}>
                  Customize the accent color used throughout the interface
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div 
                  className={`${HEIGHTS.colorPreview} rounded-lg border border-surfaceSecondary`}
                  style={{ backgroundColor: activeColors.accent }}
                />
                <div className="flex items-center gap-2">
                  <label className="relative">
                    <input
                      type="color"
                      value={activeColors.accent}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`${PATTERNS.button} cursor-pointer`}>
                      <Palette className="w-4 h-4" />
                      Choose Color
                    </div>
                  </label>
                  {isCustomAccentColor && (
                    <button
                      onClick={resetToSystemAccentColor}
                      className={PATTERNS.button}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={SPACING.items}>
          <h3 className={PATTERNS.sectionHeader}>
            <SettingsIcon className="w-4 h-4" />
            Application
          </h3>
          <div className={SPACING.items}>
            <div className={PATTERNS.settingItem}>
              <div className={PATTERNS.labelWithDescription}>
                <span className={TYPOGRAPHY.label}>Minimize to Tray</span>
                <span className={TYPOGRAPHY.description}>
                  When enabled, minimizing the app will hide it to system tray instead of taskbar
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await settings.setMinimizeToTray(!settings.minimizeToTray);
                  } catch (error) {
                    console.error('Failed to update minimize to tray setting:', error);
                    // Could add toast notification here in the future
                  }
                }}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.minimizeToTray ? 'bg-accent' : 'bg-surfaceSecondary'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.minimizeToTray ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            <div className={PATTERNS.settingItem}>
              <div className={PATTERNS.labelWithDescription}>
                <span className={TYPOGRAPHY.label}>Start at Windows Startup</span>
                <span className={TYPOGRAPHY.description}>
                  Automatically launch Axon when Windows starts
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await settings.setStartupEnabled(!settings.startupEnabled);
                  } catch (error) {
                    console.error('Failed to update startup setting:', error);
                    // Could add toast notification here in the future
                  }
                }}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.startupEnabled ? 'bg-accent' : 'bg-surfaceSecondary'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.startupEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            <div className={PATTERNS.settingItem}>
              <div className={PATTERNS.labelWithDescription}>
                <span className={TYPOGRAPHY.label}>Start Minimized</span>
                <span className={TYPOGRAPHY.description}>
                  When enabled, app will start minimized on Windows startup
                </span>
              </div>
              <button
                onClick={async () => {
                  // Only allow interaction if startup is enabled
                  if (!settings.startupEnabled) {
                    return;
                  }
                  
                  try {
                    await settings.setStartMinimized(!settings.startMinimized);
                  } catch (error) {
                    console.error('Failed to update start minimized setting:', error);
                    // Could add toast notification here in the future
                  }
                }}
                disabled={!settings.startupEnabled}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${!settings.startupEnabled 
                    ? 'opacity-70 cursor-not-allowed bg-surfaceSecondary' 
                    : settings.startMinimized ? 'bg-accent' : 'bg-surfaceSecondary'
                  }
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.startMinimized && settings.startupEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            <div className={PATTERNS.settingItem}>
              <div className={PATTERNS.labelWithDescription}>
                <span className={TYPOGRAPHY.label}>Reset App List</span>
                <span className={TYPOGRAPHY.description}>
                  Refresh and rebuild the list of available applications
                </span>
              </div>
              <button
                onClick={() => appStore.refreshApps()}
                disabled={isRefreshing}
                className={`${PATTERNS.button} ${isRefreshing ? STATES.disabled : ''}`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Reset App List'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
