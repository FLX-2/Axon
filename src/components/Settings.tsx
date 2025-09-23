import React from 'react';
import { useUnifiedSettingsStore } from '../store/useUnifiedSettingsStore';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Palette, RotateCcw, MoonStar, RefreshCw, Folder, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { PATTERNS, STATES, TYPOGRAPHY, SPACING, HEIGHTS } from '../lib/designTokens';
import { HotkeyInput } from './HotkeyInput';
import { invoke } from '@tauri-apps/api';
import { useState } from 'react';
import { AppInfo } from '../types/app';

// Hidden Apps Expandable Component
const HiddenAppsExpandable: React.FC<{
  removedApps: string[];
  allApps: AppInfo[];
  onRestoreApp: (path: string) => Promise<void>;
}> = ({ removedApps, allApps, onRestoreApp }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const visibleApps = isExpanded ? removedApps : removedApps.slice(0, visibleCount);
  const hasHiddenApps = removedApps.length > visibleCount && !isExpanded;

  return (
    <div>
      <div className="flex items-start mb-4">
        <div className={PATTERNS.labelWithDescription}>
          <span className={TYPOGRAPHY.label}>Hidden Applications</span>
          <span className={TYPOGRAPHY.description}>
            Apps you've removed from your main list. Click restore to bring them back.
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {visibleApps.map((appPath) => {
          // Find the app info from the full apps list
          const appInfo = allApps.find(app => app.path === appPath) ||
            // If not found in current apps, create a basic info object
            { path: appPath, name: appPath.split('\\').pop()?.split('.')[0] || 'Unknown App' };

          return (
            <div
              key={appPath}
              className="flex items-center justify-start p-3 bg-surfaceSecondary rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-surfaceHover rounded flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-textSecondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-textPrimary block truncate">
                    {appInfo.name}
                  </span>
                  <div className="text-xs text-textSecondary truncate" title={appPath}>
                    {appPath}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRestoreApp(appPath)}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent/80 text-white rounded text-sm transition-colors flex-shrink-0 ml-3"
              >
                <RotateCcw className="w-3 h-3" />
                Restore
              </button>
            </div>
          );
        })}

        {/* Show more/less buttons */}
        {hasHiddenApps && !isExpanded && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 px-3 py-2 bg-surfaceSecondary hover:bg-surfaceHover transition-colors rounded-lg text-sm text-textSecondary"
            >
              <ChevronDown className="w-4 h-4" />
              Show {removedApps.length - visibleCount} more
            </button>
          </div>
        )}

        {isExpanded && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-2 px-3 py-2 bg-surfaceSecondary hover:bg-surfaceHover transition-colors rounded-lg text-sm text-textSecondary"
            >
              <ChevronUp className="w-4 h-4" />
              Show less
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
        {/* Appearance & Personalization */}
        <div className={SPACING.items}>
          <h3 className={PATTERNS.sectionHeader}>
            <Palette className="w-4 h-4" />
            Appearance
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

        {/* Behavior & Startup */}
        <div className={SPACING.items}>
          <h3 className={PATTERNS.sectionHeader}>
            <SettingsIcon className="w-4 h-4" />
            Behavior
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
                <span className={TYPOGRAPHY.label}>Global Hotkey</span>
                <span className={TYPOGRAPHY.description}>
                  Set a keyboard shortcut to show/hide the app from anywhere
                </span>
              </div>
              <div className="w-64">
                <HotkeyInput
                  value={settings.globalHotkey}
                  onChange={(hotkey) => settings.setGlobalHotkey(hotkey)}
                  placeholder="Click to set hotkey..."
                />
              </div>
            </div>
            <div className={PATTERNS.settingItem}>
              <div className={PATTERNS.labelWithDescription}>
                <span className={TYPOGRAPHY.label}>Open Start Menu Folder</span>
                <span className={TYPOGRAPHY.description}>
                  Open the folder where the application shortcuts are stored
                </span>
              </div>
              <button
                onClick={() => invoke('open_startup_folder')}
                className={PATTERNS.button}
              >
                <Folder className="w-4 h-4" />
                Open Folder
              </button>
            </div>
          </div>
        </div>

        {/* App Management */}
        <div className={SPACING.items}>
          <h3 className={PATTERNS.sectionHeader}>
            <RefreshCw className="w-4 h-4" />
            App Management
          </h3>
          <div className={SPACING.items}>
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

            {/* Hidden Applications */}
            {appStore.removedApps.length > 0 && (
              <HiddenAppsExpandable
                removedApps={appStore.removedApps}
                allApps={appStore.apps}
                onRestoreApp={appStore.restoreApp}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
