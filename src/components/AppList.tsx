import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AppInfo, AppCategory } from '../types/app';
import { Play, Pin, Clock } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { AppContextMenu } from './AppContextMenu';

interface AppListProps {
  selectedCategory: string | null;
}

const AppGrid: React.FC<{
  apps: AppInfo[];
  isGridView: boolean;
  onPin: (path: string) => void;
  onLaunch: (path: string) => void;
  onMove: (path: string, category: AppCategory) => void;
}> = ({ apps, isGridView, onPin, onLaunch, onMove }) => {
  const [contextMenu, setContextMenu] = useState<{
    app: AppInfo;
    position: { x: number; y: number };
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, app: AppInfo) => {
    e.preventDefault();
    setContextMenu({
      app,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  return (
    <>
      <div className={`
        ${isGridView 
          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' 
          : 'space-y-2'
        }
      `}>
        {apps.map((app) => (
          <div
            key={app.path}
            onContextMenu={(e) => handleContextMenu(e, app)}
            onClick={() => onLaunch(app.path)}
            className={`
              ${isGridView
                ? 'flex flex-col items-center p-4 aspect-[3/4] bg-surfaceSecondary hover:bg-surfaceHover'
                : 'flex items-center w-full px-4 py-2 hover:bg-surfaceHover'
              }
              group
              transition-colors rounded-lg
              relative
            `}
          >
            {isGridView ? (
              <>
                <button
                  className={`
                    absolute top-2 right-2
                    transition-opacity
                    ${app.isPinned 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover:opacity-100'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(app.path);
                  }}
                  title={app.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className={`w-4 h-4 ${app.isPinned ? 'text-accent' : 'text-iconSecondary'}`} />
                </button>
                
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                  {app.icon ? (
                    <img 
                      src={app.icon} 
                      alt={app.name}
                      className="app-icon w-20 h-20 mb-4"
                    />
                  ) : (
                    <div className="w-20 h-20 mb-4 bg-surfaceHover rounded-lg flex items-center justify-center">
                      <Play className="w-8 h-8 text-iconSecondary" />
                    </div>
                  )}
                  <span className="text-sm text-textPrimary">
                    {app.name}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center w-full">
                <div className="flex items-center space-x-3 flex-grow">
                  {app.icon ? (
                    <img 
                      src={app.icon} 
                      alt={app.name}
                      className="app-icon w-8 h-8"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-surfaceHover rounded-lg flex items-center justify-center">
                      <Play className="w-4 h-4 text-iconSecondary" />
                    </div>
                  )}
                  <span className="text-sm text-textPrimary">
                    {app.name}
                  </span>
                </div>
                <button
                  className={`
                    transition-opacity ml-2
                    ${app.isPinned 
                      ? 'opacity-100' 
                      : 'opacity-0 group-hover:opacity-100'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(app.path);
                  }}
                  title={app.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className={`w-4 h-4 ${app.isPinned ? 'text-accent' : 'text-iconSecondary'}`} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {contextMenu && (
        <AppContextMenu
          app={contextMenu.app}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onMove={(category) => {
            onMove(contextMenu.app.path, category as AppCategory);
            setContextMenu(null);
          }}
        />
      )}
    </>
  );
};

export const AppList: React.FC<AppListProps> = ({ selectedCategory }) => {
  const { 
    apps, 
    searchTerm, 
    isGridView, 
    togglePinned,
    updateLastAccessed,
    updateCategory
  } = useAppStore();
  
  const handleLaunch = async (path: string) => {
    try {
      await invoke('launch_app', { path });
      updateLastAccessed(path, new Date().toISOString());
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === null || app.category === selectedCategory)
  );

  const sortedApps = [...filteredApps].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.name.localeCompare(b.name);
  });

  // Get recent apps by checking lastAccessed timestamps
  const recentApps = selectedCategory === null 
    ? filteredApps
        .filter(app => app.lastAccessed)
        .sort((a, b) => {
          const dateA = new Date(a.lastAccessed || '').getTime();
          const dateB = new Date(b.lastAccessed || '').getTime();
          return dateB - dateA;
        })
        .slice(0, 5)
    : [];

  return (
    <div className="p-4">
      {selectedCategory === null && recentApps.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-textSecondary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent
          </h2>
          <AppGrid 
            apps={recentApps}
            isGridView={isGridView}
            onPin={togglePinned}
            onLaunch={handleLaunch}
            onMove={updateCategory}
          />
        </div>
      )}

      <div className="mb-6">
        {!selectedCategory && (
          <h2 className="text-sm font-semibold text-textSecondary mb-3">
            All Apps
          </h2>
        )}
        <AppGrid 
          apps={sortedApps}
          isGridView={isGridView}
          onPin={togglePinned}
          onLaunch={handleLaunch}
          onMove={updateCategory}
        />
      </div>
    </div>
  );
};
