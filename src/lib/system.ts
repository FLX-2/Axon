import { invoke } from '@tauri-apps/api';

export async function loadStartMenuApps() {
  const apps = await invoke('get_start_menu_apps');
  return apps;
}

export async function getAppIcon(path: string) {
  const iconData = await invoke('get_app_icon', { path });
  return iconData;
}

export async function getSystemAccentColor() {
  const color = await invoke('get_system_accent_color');
  return color;
}

export async function setStartupLaunch(enable: boolean) {
  await invoke('set_launch_at_startup', { enable });
} 