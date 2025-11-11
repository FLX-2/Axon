import React, { useState } from 'react';
import { Library, GamepadIcon, Wrench, Music, MonitorPlay, FolderGit2, PanelLeftOpen, PanelLeft, Cog, Folder } from 'lucide-react';

interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const mainCategories = [
  { id: null, name: 'Library', icon: Library },
  { id: 'Games', name: 'Games', icon: GamepadIcon },
  { id: 'Utilities', name: 'Utilities', icon: Wrench },
  { id: 'Media', name: 'Media', icon: Music },
  { id: 'Development', name: 'Development', icon: FolderGit2 },
  { id: 'Other', name: 'Other', icon: MonitorPlay },
];

const bottomCategories = [
  { id: 'Folders', name: 'Folders', icon: Folder },
  { id: 'Settings', name: 'Settings', icon: Cog },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedCategory, 
  onSelectCategory,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`${
        isExpanded ? 'w-48' : 'w-16'
      } bg-surfaceSecondary border-r border-border flex flex-col transition-all duration-200 relative z-10`}
    >
      {/* Header with toggle button */}
      <div className={`w-full flex py-3 ${isExpanded ? 'justify-end pr-3' : 'justify-center'}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 flex items-center justify-center hover:bg-buttonHover transition-colors rounded-lg group"
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <PanelLeft className="w-5 h-5 text-iconDefault group-hover:text-iconHover transition-colors" />
          ) : (
            <PanelLeftOpen className="w-5 h-5 text-iconDefault group-hover:text-iconHover transition-colors" />
          )}
        </button>
      </div>

      {/* Scrollable main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-center py-0">
          <div className={`h-px bg-border ${isExpanded ? 'w-20' : 'w-8'}`}></div>
        </div>
        <div className="w-full flex flex-col items-center py-1 space-y-2">
          {mainCategories.map(({ id, name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => onSelectCategory(id)}
              className={`w-[calc(100%-8px)] mx-1 flex items-center px-2 py-2 transition-colors rounded-lg group ${
                isExpanded ? 'justify-start space-x-3' : 'justify-center'
              } ${
                selectedCategory === id
                  ? 'bg-buttonSelected'
                  : 'hover:bg-buttonHover'
              }`}
              title={isExpanded ? undefined : name}
            >
              <Icon className={`w-6 h-9 flex-shrink-0 transition-colors ${
                selectedCategory === id
                  ? 'text-accent'
                  : 'text-iconDefault group-hover:text-iconHover'
              }`} />
              {isExpanded && <span className="text-sm text-textPrimary">{name}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky bottom section */}
      <div className="sticky bottom-0 bg-surfaceSecondary w-full pt-2 space-y-2 pb-4">
        <div className="flex justify-center py-0">
          <div className={`h-px bg-border ${isExpanded ? 'w-20' : 'w-8'}`}></div>
        </div>
        {bottomCategories.map(({ id, name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => onSelectCategory(id)}
            className={`w-[calc(100%-8px)] mx-1 flex items-center px-2 py-2 transition-colors rounded-lg group ${
              isExpanded ? 'justify-start space-x-3' : 'justify-center'
            } ${
              selectedCategory === id
                ? 'bg-buttonSelected'
                : 'hover:bg-buttonHover'
            }`}
            title={isExpanded ? undefined : name}
          >
            <Icon className={`w-6 h-9 flex-shrink-0 transition-colors ${
              selectedCategory === id
                ? 'text-accent'
                : 'text-iconDefault group-hover:text-iconHover'
            }`} />
            {isExpanded && <span className="text-sm text-textPrimary">{name}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};