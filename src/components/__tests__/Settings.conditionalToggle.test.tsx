import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from '../Settings';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAppStore } from '../../store/useAppStore';

// Mock the stores
vi.mock('../../store/useSettingsStore');
vi.mock('../../store/useAppStore');

const mockUseSettingsStore = vi.mocked(useSettingsStore);
const mockUseAppStore = vi.mocked(useAppStore);

describe('Settings - Conditional Toggle Enabling Logic', () => {
  const mockSetStartMinimized = vi.fn();
  
  // Helper function to find the Start Minimized toggle
  const getStartMinimizedToggle = (container: HTMLElement) => {
    const startMinimizedLabel = screen.getByText('Start Minimized');
    const settingItem = startMinimizedLabel.closest('.flex.items-center.justify-between');
    return settingItem?.querySelector('button') as HTMLButtonElement;
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock app store
    mockUseAppStore.mockReturnValue({
      isLoading: false,
      refreshApps: vi.fn(),
    } as any);
    
    // Default settings store mock
    mockUseSettingsStore.mockReturnValue({
      themeMode: 'system',
      colors: {
        light: { accent: '#000000' },
        dark: { accent: '#ffffff' },
        black: { accent: '#ffffff' },
      },
      isCustomAccentColor: false,
      minimizeToTray: true,
      startupEnabled: true,
      startMinimized: true,
      setThemeMode: vi.fn(),
      setAccentColor: vi.fn(),
      resetToSystemAccentColor: vi.fn(),
      setMinimizeToTray: vi.fn(),
      setStartupEnabled: vi.fn(),
      setStartMinimized: mockSetStartMinimized,
      initializeSettings: vi.fn(),
    } as any);
  });

  describe('Requirement 3.1: Disable when Start at Windows Startup is disabled', () => {
    it('should disable start minimized toggle when startup is disabled', () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: true,
        startupEnabled: false, // Startup disabled
        startMinimized: true,
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      
      // Should have disabled styling
      expect(startMinimizedToggle).toHaveClass('opacity-70');
      expect(startMinimizedToggle).toHaveClass('cursor-not-allowed');
      expect(startMinimizedToggle).toHaveAttribute('disabled');
    });

    it('should not call setStartMinimized when clicked while startup is disabled', () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: true,
        startupEnabled: false, // Startup disabled
        startMinimized: true,
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      
      fireEvent.click(startMinimizedToggle);
      
      expect(mockSetStartMinimized).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 3.2: Disable when Minimize to Tray is disabled', () => {
    it('should disable start minimized toggle when minimize to tray is disabled', () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: false, // Minimize to tray disabled
        startupEnabled: true,
        startMinimized: true,
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      
      // Should have disabled styling
      expect(startMinimizedToggle).toHaveClass('opacity-70');
      expect(startMinimizedToggle).toHaveClass('cursor-not-allowed');
      expect(startMinimizedToggle).toHaveAttribute('disabled');
    });

    it('should not call setStartMinimized when clicked while minimize to tray is disabled', () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: false, // Minimize to tray disabled
        startupEnabled: true,
        startMinimized: true,
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      
      fireEvent.click(startMinimizedToggle);
      
      expect(mockSetStartMinimized).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 3.3: Enable when both prerequisites are enabled', () => {
    it('should enable start minimized toggle when both startup and minimize to tray are enabled', () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: true, // Both enabled
        startupEnabled: true,
        startMinimized: true,
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      
      // Should NOT have disabled styling
      expect(startMinimizedToggle).not.toHaveClass('opacity-70');
      expect(startMinimizedToggle).not.toHaveClass('cursor-not-allowed');
      expect(startMinimizedToggle).not.toHaveAttribute('disabled');
    });

    it('should call setStartMinimized when clicked while both prerequisites are enabled', async () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: true, // Both enabled
        startupEnabled: true,
        startMinimized: false, // Currently disabled
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      
      fireEvent.click(startMinimizedToggle);
      
      expect(mockSetStartMinimized).toHaveBeenCalledWith(true);
    });
  });

  describe('Disabled state styling consistency', () => {
    it('should apply consistent disabled styling when both prerequisites are disabled', () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: false, // Both disabled
        startupEnabled: false,
        startMinimized: true,
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      
      // Should have disabled styling
      expect(startMinimizedToggle).toHaveClass('opacity-70');
      expect(startMinimizedToggle).toHaveClass('cursor-not-allowed');
      expect(startMinimizedToggle).toHaveClass('bg-surfaceSecondary');
      expect(startMinimizedToggle).toHaveAttribute('disabled');
    });

    it('should show toggle indicator in disabled position when disabled', () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: false, // Disabled
        startupEnabled: true,
        startMinimized: true, // Even though setting is true, should show as disabled
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      const toggleIndicator = startMinimizedToggle.querySelector('span');
      
      // Should be in disabled position (translate-x-1) even though startMinimized is true
      expect(toggleIndicator).toHaveClass('translate-x-1');
      expect(toggleIndicator).not.toHaveClass('translate-x-6');
    });

    it('should show toggle indicator in correct position when enabled and prerequisites met', () => {
      mockUseSettingsStore.mockReturnValue({
        themeMode: 'system',
        colors: {
          light: { accent: '#000000' },
          dark: { accent: '#ffffff' },
          black: { accent: '#ffffff' },
        },
        isCustomAccentColor: false,
        minimizeToTray: true, // Both enabled
        startupEnabled: true,
        startMinimized: true,
        setThemeMode: vi.fn(),
        setAccentColor: vi.fn(),
        resetToSystemAccentColor: vi.fn(),
        setMinimizeToTray: vi.fn(),
        setStartupEnabled: vi.fn(),
        setStartMinimized: mockSetStartMinimized,
        initializeSettings: vi.fn(),
      } as any);

      const { container } = render(<Settings />);
      
      const startMinimizedToggle = getStartMinimizedToggle(container);
      const toggleIndicator = startMinimizedToggle.querySelector('span');
      
      // Should be in enabled position (translate-x-6)
      expect(toggleIndicator).toHaveClass('translate-x-6');
      expect(toggleIndicator).not.toHaveClass('translate-x-1');
    });
  });
});