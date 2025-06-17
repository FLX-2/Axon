import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAppStore } from '../store/useAppStore';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Palette, RotateCcw, MoonStar, RefreshCw } from 'lucide-react';

// Utility function to determine if a color is dark
const isColorDark = (hexColor: string) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm text-textPrimary">{label}</span>
    <div 
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
        checked ? 'bg-buttonSelected' : 'bg-surfaceSecondary'
      }`}
      onClick={() => onChange(!checked)}
    >
      <div
        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-textPrimary rounded-full shadow transform transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </div>
  </label>
);

export const Settings: React.FC = () => {
  const settings = useSettingsStore();
  const appStore = useAppStore();
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
              className="px-4 py-2 bg-surfaceSecondary hover:bg-surfaceHover text-textPrimary rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset App List
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
