import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SearchBar: React.FC = () => {
  const { searchTerm, setSearchTerm, isGridView, toggleView } = useAppStore();

  return (
    <div className="p-4 border-b border-border bg-surfaceSecondary flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-iconSecondary w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search apps..."
          className="w-full pl-10 pr-4 py-2 bg-inputBg text-textPrimary border border-inputBorder rounded-lg 
                   focus:outline-none focus:border-accent placeholder-textPlaceholder"
        />
      </div>
      <button
        onClick={toggleView}
        className="p-2 hover:bg-buttonHover rounded-lg transition-colors"
        title={isGridView ? "Switch to list view" : "Switch to grid view"}
      >
        {isGridView ? (
          <List className="w-5 h-5 text-iconPrimary hover:text-iconSecondary" />
        ) : (
          <LayoutGrid className="w-5 h-5 text-iconPrimary hover:text-iconSecondary" />
        )}
      </button>
    </div>
  );
};