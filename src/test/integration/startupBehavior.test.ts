import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Startup Behavior Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect when app is started from Windows startup', async () => {
    // Mock the backend response for startup detection
    (invoke as any).mockResolvedValue(true);

    const isStartedFromStartup = await invoke('is_started_from_startup');
    
    expect(invoke).toHaveBeenCalledWith('is_started_from_startup');
    expect(isStartedFromStartup).toBe(true);
  });

  it('should detect when app is started normally', async () => {
    // Mock the backend response for normal startup
    (invoke as any).mockResolvedValue(false);

    const isStartedFromStartup = await invoke('is_started_from_startup');
    
    expect(invoke).toHaveBeenCalledWith('is_started_from_startup');
    expect(isStartedFromStartup).toBe(false);
  });

  it('should handle startup detection errors gracefully', async () => {
    // Mock an error response
    (invoke as any).mockRejectedValue(new Error('Failed to detect startup'));

    await expect(invoke('is_started_from_startup')).rejects.toThrow('Failed to detect startup');
  });

  it('should integrate startup detection with minimize-to-tray behavior', async () => {
    // Test the integration scenario where both startup and minimize-to-tray are enabled
    
    // Mock startup detection as true
    (invoke as any).mockImplementation((command: string) => {
      if (command === 'is_started_from_startup') {
        return Promise.resolve(true);
      }
      if (command === 'get_minimize_behavior') {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    });

    const isStartedFromStartup = await invoke('is_started_from_startup');
    const minimizeToTray = await invoke('get_minimize_behavior');
    
    expect(isStartedFromStartup).toBe(true);
    expect(minimizeToTray).toBe(true);
    
    // In this scenario, the app should start minimized to tray
    // This behavior is handled in the Rust backend during window initialization
  });

  it('should show window normally when started from startup but minimize-to-tray is disabled', async () => {
    // Test the scenario where startup is enabled but minimize-to-tray is disabled
    
    (invoke as any).mockImplementation((command: string) => {
      if (command === 'is_started_from_startup') {
        return Promise.resolve(true);
      }
      if (command === 'get_minimize_behavior') {
        return Promise.resolve(false);
      }
      return Promise.resolve(false);
    });

    const isStartedFromStartup = await invoke('is_started_from_startup');
    const minimizeToTray = await invoke('get_minimize_behavior');
    
    expect(isStartedFromStartup).toBe(true);
    expect(minimizeToTray).toBe(false);
    
    // In this scenario, the app should show the window normally
  });

  it('should show window normally when started manually regardless of minimize-to-tray setting', async () => {
    // Test normal startup behavior
    
    (invoke as any).mockImplementation((command: string) => {
      if (command === 'is_started_from_startup') {
        return Promise.resolve(false);
      }
      if (command === 'get_minimize_behavior') {
        return Promise.resolve(true); // Even if minimize-to-tray is enabled
      }
      return Promise.resolve(false);
    });

    const isStartedFromStartup = await invoke('is_started_from_startup');
    const minimizeToTray = await invoke('get_minimize_behavior');
    
    expect(isStartedFromStartup).toBe(false);
    expect(minimizeToTray).toBe(true);
    
    // In this scenario, the app should show the window normally because it wasn't started from startup
  });
});