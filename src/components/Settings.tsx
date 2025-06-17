import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAppStore } from '../store/useAppStore';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Palette, RotateCcw, MoonStar, RefreshCw } from 'lucide-react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

export const Settings: React.FC = () => {
  const settings = useSettingsStore();
  const appStore = useAppStore();
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
    <div className="p-4 space-y-8">
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Theme</h3>
          <div className="flex space-x-2 flex-wrap gap-2">
            {[
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'black' as const, icon: MoonStar, label: 'Black' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ].map((option) => {
              const isSelected = themeMode === option.value;
              // Get the actual theme color based on system preference if system is selected
              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
              const effectiveAccentColor = option.value === 'system' && isSelected
                ? mediaQuery.matches ? colors.dark.accent : colors.light.accent
                : activeColors.accent;

              return (
                <button
                  key={option.value}
                  onClick={() => setThemeMode(option.value)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-buttonSelected text-textPrimary'
                      : 'hover:bg-surfaceHover text-textPrimary'
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="text-sm">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Application</h3>
          <div className="space-y-3">
            <button
              onClick={() => appStore.refreshApps()}
              disabled={isRefreshing}
              className={`
                px-4 py-2 bg-surfaceSecondary
                ${!isRefreshing ? 'hover:bg-surfaceHover' : 'opacity-70 cursor-not-allowed'}
                text-textPrimary rounded-lg flex items-center gap-2 transition-colors
              `}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Reset App List'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Accent Color
          </h3>
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-lg"
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
                <div className="px-4 py-2 bg-surfaceSecondary hover:bg-surfaceHover text-textPrimary rounded-lg cursor-pointer transition-colors">
                  Choose Color
                </div>
              </label>
              {isCustomAccentColor && (
                <button
                  onClick={resetToSystemAccentColor}
                  className="px-4 py-2 bg-surfaceSecondary hover:bg-surfaceHover text-textPrimary rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to System Color
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
