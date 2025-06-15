import { appWindow } from '@tauri-apps/api/window';

// Handle system tray events
export default async (event) => {
  if (event.payload.type === 'tray-left-click') {
    // Toggle window visibility
    if (await appWindow.isVisible()) {
      await appWindow.hide();
    } else {
      await appWindow.show();
      await appWindow.setFocus();
    }
  }
};
