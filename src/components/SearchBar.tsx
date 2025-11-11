import React from 'react';
import { Search, LayoutGrid, List, X, Plus, FolderPlus } from 'lucide-react';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';
import { useUnifiedFolderStore } from '../store/useUnifiedFolderStore';
import { invoke } from '@tauri-apps/api/tauri';

interface SearchBarProps {
  selectedCategory?: string | null;
}

export const SearchBar: React.FC<SearchBarProps> = ({ selectedCategory }) => {
  const { searchTerm, setSearchTerm, isGridView, toggleView, refreshApps } = useUnifiedAppStore();
  const { addFolder } = useUnifiedFolderStore();

  const handleAddApp = async () => {
    try {
      await invoke('add_custom_app');
      // Refresh the app list after adding
      refreshApps();
    } catch (error) {
      console.error('Failed to add app:', error);
    }
  };

  const handleAddFolder = async () => {
    try {
      await addFolder();
    } catch (error) {
      console.error('Failed to add folder:', error);
    }
  };

  const handleAdd = () => {
    if (selectedCategory === 'Folders') {
      handleAddFolder();
    } else {
      handleAddApp();
    }
  };

  return (
    <div className="p-3 border-b border-border bg-surfaceSecondary flex items-center gap-4 relative z-10">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-iconDefault w-4 h-4" />
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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-iconDefault hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => toggleView()}
          className="p-2.5 hover:bg-buttonHover rounded-lg transition-colors group"
          title={isGridView ? "Switch to list view" : "Switch to grid view"}
        >
          {isGridView ? (
            <List className="w-5 h-5 text-iconDefault group-hover:text-iconHover transition-colors" />
          ) : (
            <LayoutGrid className="w-5 h-5 text-iconDefault group-hover:text-iconHover transition-colors" />
          )}
        </button>
        <div className="w-px h-5 bg-border mx-1"></div>
        <button
          onClick={handleAdd}
          className="p-2.5 hover:bg-buttonHover rounded-lg transition-colors group"
          title={selectedCategory === 'Folders' ? "Add folder" : "Add custom app"}
        >
          {selectedCategory === 'Folders' ? (
            <FolderPlus className="w-5 h-5 text-iconDefault group-hover:text-iconHover transition-colors" />
          ) : (
            <Plus className="w-5 h-5 text-iconDefault group-hover:text-iconHover transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
};