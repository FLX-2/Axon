import React, { useState, useEffect, useRef } from 'react';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';
import { AppInfo, AppCategory } from '../types/app';
import { Play, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { AppContextMenu } from './AppContextMenu';
import { InlineEditableText } from './InlineEditableText';
import { useGridColumns } from '../hooks/useGridColumns';

interface AppListProps {
  selectedCategory: string | null;
}

const RecentAppsExpandable: React.FC<{
  apps: AppInfo[];
  isGridView: boolean;
  onPin: (path: string) => void;
  onLaunch: (path: string) => void;
  onMove: (path: string, category: AppCategory) => void;
  onRename: (key: string) => void;
  editingAppKey: string | null;
  onSaveRename: (path: string, newName: string) => Promise<void>;
  onCancelRename: () => void;
}> = ({ apps, isGridView, onPin, onLaunch, onMove, onRename, editingAppKey, onSaveRename, onCancelRename }) => {
  const [contextMenu, setContextMenu] = useState<{
    app: AppInfo;
    position: { x: number; y: number };
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const columns = useGridColumns();

  // Calculate how many apps can fit in one row based on current screen size
  useEffect(() => {
    const calculateVisibleApps = () => {
      // Use the same logic as the main grid to determine how many fit
      if (columns >= 5) {
        setVisibleCount(5); // Can fit all 5
        setIsExpanded(false); // Auto-collapse when all apps fit naturally
      } else {
        setVisibleCount(Math.min(columns, apps.length)); // Show what fits
      }
    };

    calculateVisibleApps();
    window.addEventListener('resize', calculateVisibleApps);
    return () => window.removeEventListener('resize', calculateVisibleApps);
  }, [apps.length, columns]);

  const handleContextMenu = (e: React.MouseEvent, app: AppInfo) => {
    e.preventDefault();
    setContextMenu({
      app,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const visibleApps = isExpanded ? apps : apps.slice(0, visibleCount);
  const hasHiddenApps = apps.length > visibleCount && !isExpanded;

  const AppCard: React.FC<{ app: AppInfo }> = ({ app }) => (
    <div
      onContextMenu={(e) => handleContextMenu(e, app)}
      onClick={() => onLaunch(app.path)}
      className="flex flex-col items-center p-4 aspect-[3/4] bg-surfaceSecondary hover:bg-surfaceHover group transition-colors rounded-lg relative border border-border dark:border-transparent"
    >
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
        {app.icon && app.icon !== 'loading' ? (
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
        <InlineEditableText
          value={app.name}
          onSave={(newName) => onSaveRename(app.path, newName)}
          onCancel={onCancelRename}
          isEditing={editingAppKey === `recent-${apps.indexOf(app)}-${app.path}`}
          className="text-sm text-textPrimary text-center w-full"
          placeholder="Enter app name"
        />
      </div>
    </div>
  );

  // If in list view, just use the regular AppGrid component
  if (!isGridView) {
    return (
      <AppGrid
        apps={apps}
        isGridView={isGridView}
        onPin={onPin}
        onLaunch={onLaunch}
        onMove={onMove}
        onRename={onRename}
        editingAppKey={editingAppKey}
        onSaveRename={onSaveRename}
        onCancelRename={onCancelRename}
      />
    );
  }

  // Grid view: Use expandable functionality
  return (
    <>
      <div>
        {isExpanded ? (
          // Expanded view: Allow wrapping with current grid system
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {visibleApps.map((app) => (
              <AppCard key={app.path} app={app} />
            ))}
          </div>
        ) : (
          // Collapsed view: Single row only
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {visibleApps.map((app) => (
              <AppCard key={app.path} app={app} />
            ))}
          </div>
        )}
        
        {/* Show more/less buttons - always centered below */}
        {hasHiddenApps && !isExpanded && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 px-3 py-2 bg-surfaceSecondary hover:bg-surfaceHover transition-colors rounded-lg text-sm text-textSecondary"
            >
              <ChevronDown className="w-4 h-4" />
              Show {apps.length - visibleCount} more
            </button>
          </div>
        )}
        
        {isExpanded && (
          <div className="flex justify-center mt-4">
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

      {contextMenu && (
        <AppContextMenu
          app={contextMenu.app}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onMove={(category) => {
            onMove(contextMenu.app.path, category as AppCategory);
            setContextMenu(null);
          }}
          onRename={onRename}
          section="recent"
          index={apps.indexOf(contextMenu.app)}
        />
      )}
    </>
  );
};

const AppGrid: React.FC<{
  apps: AppInfo[];
  isGridView: boolean;
  onPin: (path: string) => void;
  onLaunch: (path: string) => void;
  onMove: (path: string, category: AppCategory) => void;
  onRename: (key: string) => void;
  editingAppKey: string | null;
  onSaveRename: (path: string, newName: string) => Promise<void>;
  onCancelRename: () => void;
}> = ({ apps, isGridView, onPin, onLaunch, onMove, onRename, editingAppKey, onSaveRename, onCancelRename }) => {
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
          : 'space-y-1'
        }
      `}>
        {apps.map((app) => (
          <div
            key={app.path}
            onContextMenu={(e) => handleContextMenu(e, app)}
            onClick={() => onLaunch(app.path)}
            className={`
              ${isGridView
                ? 'flex flex-col items-center p-4 aspect-[3/4]'
                : 'flex items-center w-full px-4 py-4'
              }
              bg-surfaceSecondary hover:bg-surfaceHover
              group
              transition-colors rounded-lg
              relative
              border border-border dark:border-transparent
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
                  {app.icon && app.icon !== 'loading' ? (
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
                  <InlineEditableText
                    value={app.name}
                    onSave={(newName) => onSaveRename(app.path, newName)}
                    onCancel={onCancelRename}
                    isEditing={editingAppKey === `all-${apps.indexOf(app)}-${app.path}`}
                    className="text-sm text-textPrimary text-center w-full"
                    placeholder="Enter app name"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center w-full">
                <div className="flex items-center space-x-3 flex-grow">
                  {app.icon && app.icon !== 'loading' ? (
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
                  <InlineEditableText
                    value={app.name}
                    onSave={(newName) => onSaveRename(app.path, newName)}
                    onCancel={onCancelRename}
                    isEditing={editingAppKey === `all-${apps.indexOf(app)}-${app.path}`}
                    className="text-sm text-textPrimary"
                    placeholder="Enter app name"
                  />
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
          onRename={onRename}
          section="all"
          index={apps.indexOf(contextMenu.app)}
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
    updateCategory,
    updateAppName
  } = useUnifiedAppStore();
  const columns = useGridColumns();
  const [editingAppKey, setEditingAppKey] = useState<string | null>(null);
  
  const handleLaunch = async (path: string) => {
    try {
      await invoke('launch_app', { path });
      updateLastAccessed(path, new Date().toISOString());
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  };

  const startRename = (key: string) => {
    setEditingAppKey(key);
  };

  const cancelRename = () => {
    setEditingAppKey(null);
  };

  const saveRename = async (path: string, newName: string) => {
    await updateAppName(path, newName);
    setEditingAppKey(null);
  };

  const createAppKey = (section: string, index: number, appPath: string) => {
    return `${section}-${index}-${appPath}`;
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === null || app.category === selectedCategory)
  );

  const recentApps = filteredApps
    .filter(app => app.lastAccessed)
    .sort((a, b) => new Date(b.lastAccessed!).getTime() - new Date(a.lastAccessed!).getTime())
    .slice(0, 5); // Always get top 5 recent apps

  const allApps = [...filteredApps].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-4">
      {!selectedCategory && recentApps.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-textSecondary mb-3">
            Recent Apps
          </h2>
          <RecentAppsExpandable
            apps={recentApps}
            isGridView={isGridView}
            onPin={togglePinned}
            onLaunch={handleLaunch}
            onMove={updateCategory}
            onRename={startRename}
            editingAppKey={editingAppKey}
            onSaveRename={saveRename}
            onCancelRename={cancelRename}
          />
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-textSecondary mb-3">
          {selectedCategory ? selectedCategory : 'All Apps'}
        </h2>
        <AppGrid
          apps={allApps}
          isGridView={isGridView}
          onPin={togglePinned}
          onLaunch={handleLaunch}
          onMove={updateCategory}
          onRename={startRename}
          editingAppKey={editingAppKey}
          onSaveRename={saveRename}
          onCancelRename={cancelRename}
        />
      </div>
    </div>
  );
};
