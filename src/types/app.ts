export type AppCategory = 'Games' | 'Utilities' | 'Media' | 'Development' | 'Other' | string;

export interface AppInfo {
  name: string;
  path: string;
  icon?: string | null;
  customIcon?: string;
  category: AppCategory;
  lastAccessed?: string;  // ISO string format
  isPinned?: boolean;
}