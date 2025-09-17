import React from 'react';
import { Search, LayoutGrid, List, X, Plus } from 'lucide-react';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';
import { invoke } from '@tauri-apps/api/tauri';

export const SearchBar: React.FC = () => {
  const { searchTerm, setSearchTerm, isGridView, toggleView, refreshApps } = useUnifiedAppStore();

  const handleAddApp = async () => {
    try {
      await invoke('add_custom_app');
      // Refresh the app list after adding
      refreshApps();
    } catch (error) {
      console.error('Failed to add app:', error);
    }
  };

  return (
    <div className="p-3 border-b border-border bg-surfaceSecondary flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-iconSecondary w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search apps..."
          className="w-full pl-10 pr-10 py-2 bg-inputBg text-textPrimary text-sm border border-inputBorder rounded-lg
                    focus:outline-none placeholder-textPlaceholder"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-iconSecondary hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => toggleView()}
          className="p-2.5 hover:bg-buttonHover rounded-lg transition-colors"
          title={isGridView ? "Switch to list view" : "Switch to grid view"}
        >
          {isGridView ? (
            <List className="w-5 h-5 text-iconPrimary hover:text-iconSecondary" />
          ) : (
            <LayoutGrid className="w-5 h-5 text-iconPrimary hover:text-iconSecondary" />
          )}
        </button>
        <div className="w-px h-5 bg-border mx-1"></div>
        <button
          onClick={handleAddApp}
          className="p-2.5 hover:bg-buttonHover rounded-lg transition-colors"
          title="Add custom app"
        >
          <Plus className="w-5 h-5 text-iconPrimary hover:text-iconSecondary" />
        </button>
      </div>
    </div>
  );
};