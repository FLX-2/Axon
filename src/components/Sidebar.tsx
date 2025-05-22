import React, { useState } from 'react';
import { Library, GamepadIcon, Wrench, Music, MonitorPlay, FolderGit2, ChevronRight, Cog, Folder } from 'lucide-react';

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
      } bg-surfaceSecondary border-r border-border flex flex-col items-center py-4 relative transition-all duration-200`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          absolute -right-3 top-6
          w-6 h-6
          flex items-center justify-center
          bg-buttonHover
          border border-border
          rounded-full
          hover:bg-surfaceHover
          transition-all duration-200
          ${isExpanded ? 'rotate-180' : ''}
        `}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronRight className="w-4 h-4 text-iconPrimary" />
      </button>

      <div className="flex-1 w-full flex flex-col items-center space-y-2">
        {mainCategories.map(({ id, name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => onSelectCategory(id)}
            className={`w-[calc(100%-8px)] mx-1 flex items-center px-2 py-2 transition-colors rounded-lg ${
              isExpanded ? 'justify-start space-x-3' : 'justify-center'
            } ${
              selectedCategory === id
                ? 'bg-buttonSelected'
                : 'hover:bg-buttonHover'
            }`}
            title={isExpanded ? undefined : name}
          >
            <Icon className={`w-6 h-9 flex-shrink-0 ${
              selectedCategory === id 
                ? 'text-accent' 
                : 'text-sidebarIcon hover:text-sidebarIconHover'
            }`} />
            {isExpanded && <span className="text-sm text-sidebarText">{name}</span>}
          </button>
        ))}
      </div>

      <div className="w-full pt-4 mt-4 border-t border-border space-y-2">
        {bottomCategories.map(({ id, name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => onSelectCategory(id)}
            className={`w-[calc(100%-8px)] mx-1 flex items-center px-2 py-2 transition-colors rounded-lg ${
              isExpanded ? 'justify-start space-x-3' : 'justify-center'
            } ${
              selectedCategory === id
                ? 'bg-buttonSelected'
                : 'hover:bg-buttonHover'
            }`}
            title={isExpanded ? undefined : name}
          >
            <Icon className={`w-6 h-9 flex-shrink-0 ${
              selectedCategory === id 
                ? 'text-accent' 
                : 'text-sidebarIcon hover:text-sidebarIconHover'
            }`} />
            {isExpanded && <span className="text-sm text-sidebarText">{name}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};