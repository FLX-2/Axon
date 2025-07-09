import React, { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { AppList } from './components/AppList';
import { Settings } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { Folders } from './components/Folders';
import { ThemeProvider } from './components/ThemeProvider';
import { useAppStore } from './store/useAppStore';
import { useSettingsStore } from './store/useSettingsStore';
import { Titlebar } from './components/Titlebar';
import { LoadingScreen } from './components/LoadingScreen';
import { useDelayedLoading } from './hooks/useDelayedLoading';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { loadApps, isLoading } = useAppStore();
  const { initializeSettings } = useSettingsStore();
  // Show loading screen for at least 1.2 seconds for better UX
  const showLoading = useDelayedLoading(isLoading, 1200);

  useEffect(() => {
    loadApps();
    initializeSettings();
  }, []);

  return (
    <ThemeProvider>
      <div
        className="h-screen flex flex-col fixed inset-0 overflow-hidden bg-surfacePrimary text-textPrimary"
        onContextMenu={(e) => e.preventDefault()}
      >
        {showLoading && <LoadingScreen />}
        <Titlebar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <SearchBar />
            <div className="flex-1 overflow-y-auto">
              {selectedCategory === 'Settings' ? (
                <Settings />
              ) : selectedCategory === 'Folders' ? (
                <Folders />
              ) : (
                <AppList selectedCategory={selectedCategory} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;