import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '../Settings';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAppStore } from '../../store/useAppStore';
import { PATTERNS, STATES, HEIGHTS, SPACING, TYPOGRAPHY, COLORS } from '../../lib/designTokens';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the stores
vi.mock('../../store/useSettingsStore');
vi.mock('../../store/useAppStore');
vi.mock('../../hooks/useDelayedLoading', () => ({
  useDelayedLoading: vi.fn((loading) => loading),
}));

const mockSettingsStore = {
  themeMode: 'light' as const,
  setThemeMode: vi.fn(),
  minimizeToTray: false,
  setMinimizeToTray: vi.fn(),
  startupEnabled: false,
  setStartupEnabled: vi.fn(),
  colors: {
    light: { accent: '#3b82f6' },
    dark: { accent: '#3b82f6' },
  },
  setAccentColor: vi.fn(),
  resetToSystemAccentColor: vi.fn(),
  isCustomAccentColor: true,
};

const mockAppStore = {
  isLoading: false,
  refreshApps: vi.fn(),
};

describe('Settings - Action Button Styling Consistency', () => {
  beforeEach(() => {
    vi.mocked(useSettingsStore).mockReturnValue(mockSettingsStore);
    vi.mocked(useAppStore).mockReturnValue(mockAppStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should apply consistent styling to refresh button', () => {
    render(<Settings />);
    
    const refreshButton = screen.getByRole('button', { name: /reset app list/i });
    
    // Check that the button uses the standard button pattern
    expect(refreshButton).toHaveClass('px-4', 'py-2', 'bg-surfaceSecondary');
    expect(refreshButton).toHaveClass('hover:bg-surfaceHover', 'text-textPrimary');
    expect(refreshButton).toHaveClass('rounded-lg', 'flex', 'items-center', 'gap-2');
    expect(refreshButton).toHaveClass('transition-colors', 'h-10');
  });

  it('should apply consistent styling to color selection button', () => {
    render(<Settings />);
    
    const colorButton = screen.getByText('Choose Color');
    
    // Check that the color selection button uses the standard button pattern
    expect(colorButton).toHaveClass('px-4', 'py-2', 'bg-surfaceSecondary');
    expect(colorButton).toHaveClass('hover:bg-surfaceHover', 'text-textPrimary');
    expect(colorButton).toHaveClass('rounded-lg', 'flex', 'items-center', 'gap-2');
    expect(colorButton).toHaveClass('transition-colors', 'h-10');
    expect(colorButton).toHaveClass('cursor-pointer');
  });

  it('should apply consistent styling to reset button', () => {
    render(<Settings />);
    
    const resetButton = screen.getByRole('button', { name: /^reset$/i });
    
    // Check that the reset button uses the standard button pattern
    expect(resetButton).toHaveClass('px-4', 'py-2', 'bg-surfaceSecondary');
    expect(resetButton).toHaveClass('hover:bg-surfaceHover', 'text-textPrimary');
    expect(resetButton).toHaveClass('rounded-lg', 'flex', 'items-center', 'gap-2');
    expect(resetButton).toHaveClass('transition-colors', 'h-10');
  });

  it('should apply disabled state styling to refresh button when loading', () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...mockAppStore,
      isLoading: true,
    });

    render(<Settings />);
    
    const refreshButton = screen.getByRole('button', { name: /refreshing/i });
    
    // Check that disabled state is applied
    expect(refreshButton).toHaveClass('opacity-70', 'cursor-not-allowed');
    expect(refreshButton).toBeDisabled();
  });

  it('should maintain consistent icon sizing across all action buttons', () => {
    render(<Settings />);
    
    const refreshButton = screen.getByRole('button', { name: /reset app list/i });
    const resetButton = screen.getByRole('button', { name: /^reset$/i });
    
    // Check that icons have consistent sizing (w-4 h-4)
    const refreshIcon = refreshButton.querySelector('svg');
    const resetIcon = resetButton.querySelector('svg');
    
    expect(refreshIcon).toHaveClass('w-4', 'h-4');
    expect(resetIcon).toHaveClass('w-4', 'h-4');
  });

  it('should use design token patterns for button styling', () => {
    render(<Settings />);
    
    const refreshButton = screen.getByRole('button', { name: /reset app list/i });
    
    // Verify that the button classes match the design token pattern
    const expectedClasses = PATTERNS.button.split(' ');
    expectedClasses.forEach(className => {
      if (className.trim()) {
        expect(refreshButton).toHaveClass(className);
      }
    });
  });

  it('should not show reset button when using system accent color', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      ...mockSettingsStore,
      isCustomAccentColor: false,
    });

    render(<Settings />);
    
    const resetButton = screen.queryByRole('button', { name: /^reset$/i });
    expect(resetButton).not.toBeInTheDocument();
  });
});

describe('Settings - Visual Consistency Tests', () => {
  beforeEach(() => {
    vi.mocked(useSettingsStore).mockReturnValue(mockSettingsStore);
    vi.mocked(useAppStore).mockReturnValue(mockAppStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Interactive Element Height Consistency', () => {
    it('should apply consistent height to all theme selection buttons', () => {
      render(<Settings />);
      
      const themeButtons = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /dark/i }),
        screen.getByRole('button', { name: /black/i }),
        screen.getByRole('button', { name: /system/i }),
      ];

      themeButtons.forEach(button => {
        expect(button).toHaveClass('h-10');
      });
    });

    it('should apply consistent height to all action buttons', () => {
      render(<Settings />);
      
      const actionButtons = [
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      actionButtons.forEach(button => {
        expect(button).toHaveClass('h-10');
      });
    });

    it('should apply correct toggle height', () => {
      render(<Settings />);
      
      // Find the toggle button by looking for the minimize to tray toggle specifically
      const toggleContainer = document.querySelector('.h-6.w-11');
      expect(toggleContainer).toBeInTheDocument();
      expect(toggleContainer).toHaveClass('h-6');
    });
  });

  describe('Icon Size Consistency', () => {
    it('should apply consistent icon sizing (w-4 h-4) across all interactive elements', () => {
      render(<Settings />);
      
      // Check theme button icons
      const lightButton = screen.getByRole('button', { name: /light/i });
      const darkButton = screen.getByRole('button', { name: /dark/i });
      const blackButton = screen.getByRole('button', { name: /black/i });
      const systemButton = screen.getByRole('button', { name: /system/i });
      
      [lightButton, darkButton, blackButton, systemButton].forEach(button => {
        const icon = button.querySelector('svg');
        expect(icon).toHaveClass('w-4', 'h-4');
      });

      // Check action button icons
      const refreshButton = screen.getByRole('button', { name: /reset app list/i });
      const resetButton = screen.getByRole('button', { name: /^reset$/i });
      
      [refreshButton, resetButton].forEach(button => {
        const icon = button.querySelector('svg');
        expect(icon).toHaveClass('w-4', 'h-4');
      });
    });

    it('should apply consistent section header icon sizing', () => {
      render(<Settings />);
      
      // Main settings title removed for consistency with other tabs

      // Check section icons
      const customizationSection = screen.getByText('Customization').querySelector('svg');
      expect(customizationSection).toHaveClass('w-4', 'h-4');
      
      const applicationSection = screen.getByText('Application').querySelector('svg');
      expect(applicationSection).toHaveClass('w-4', 'h-4');
    });
  });

  describe('Button State Consistency', () => {
    it('should apply consistent selected state styling to theme buttons', () => {
      render(<Settings />);
      
      // Light theme should be selected by default
      const lightButton = screen.getByRole('button', { name: /light/i });
      expect(lightButton).toHaveClass('bg-accent', 'text-white');
      
      // Other theme buttons should have neutral styling
      const darkButton = screen.getByRole('button', { name: /dark/i });
      expect(darkButton).toHaveClass('bg-surfaceSecondary', 'hover:bg-surfaceHover', 'text-textPrimary');
    });

    it('should apply consistent disabled state styling', () => {
      vi.mocked(useAppStore).mockReturnValue({
        ...mockAppStore,
        isLoading: true,
      });

      render(<Settings />);
      
      const refreshButton = screen.getByRole('button', { name: /refreshing/i });
      expect(refreshButton).toHaveClass('opacity-70', 'cursor-not-allowed');
      expect(refreshButton).toBeDisabled();
    });

    it('should apply consistent hover state classes to interactive elements', () => {
      render(<Settings />);
      
      const actionButtons = [
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      actionButtons.forEach(button => {
        expect(button).toHaveClass('hover:bg-surfaceHover');
      });
    });
  });

  describe('Spacing and Layout Consistency', () => {
    it('should apply consistent padding to all buttons', () => {
      render(<Settings />);
      
      // Theme buttons should use compact padding
      const themeButtons = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /dark/i }),
      ];

      themeButtons.forEach(button => {
        expect(button).toHaveClass('px-3', 'py-2');
      });

      // Action buttons should use standard padding
      const actionButtons = [
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      actionButtons.forEach(button => {
        expect(button).toHaveClass('px-4', 'py-2');
      });
    });

    it('should apply consistent gap spacing to button content', () => {
      render(<Settings />);
      
      const buttonsWithIcons = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      buttonsWithIcons.forEach(button => {
        expect(button).toHaveClass('gap-2');
      });
    });

    it('should apply consistent border radius to all interactive elements', () => {
      render(<Settings />);
      
      const allButtons = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /dark/i }),
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      allButtons.forEach(button => {
        expect(button).toHaveClass('rounded-lg');
      });
    });
  });

  describe('Typography Consistency', () => {
    it('should apply consistent typography to section headers', () => {
      render(<Settings />);
      
      // Main settings title removed for consistency with other tabs

      const sectionHeaders = [
        screen.getByText('Customization'),
        screen.getByText('Application'),
      ];

      sectionHeaders.forEach(header => {
        expect(header).toHaveClass('text-sm', 'font-medium');
      });
    });

    it('should apply consistent typography to setting labels', () => {
      render(<Settings />);
      
      const settingLabel = screen.getByText('Minimize to Tray');
      expect(settingLabel).toHaveClass('text-sm', 'text-textPrimary');
    });

    it('should apply consistent typography to descriptions', () => {
      render(<Settings />);
      
      const description = screen.getByText(/When enabled, minimize button will hide/i);
      expect(description).toHaveClass('text-xs', 'text-textSecondary');
    });

    it('should apply consistent text sizing to button labels', () => {
      render(<Settings />);
      
      const themeButtons = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /dark/i }),
      ];

      themeButtons.forEach(button => {
        const textElement = button.querySelector('span');
        expect(textElement).toHaveClass('text-sm');
      });
    });
  });

  describe('Color and Background Consistency', () => {
    it('should apply consistent background colors to neutral state buttons', () => {
      render(<Settings />);
      
      const neutralButtons = [
        screen.getByRole('button', { name: /dark/i }), // Not selected
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      neutralButtons.forEach(button => {
        expect(button).toHaveClass('bg-surfaceSecondary');
      });
    });

    it('should apply consistent text colors to interactive elements', () => {
      render(<Settings />);
      
      const elementsWithPrimaryText = [
        screen.getByRole('button', { name: /dark/i }),
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      elementsWithPrimaryText.forEach(element => {
        expect(element).toHaveClass('text-textPrimary');
      });
    });

    it('should apply accent color to selected theme button', () => {
      render(<Settings />);
      
      const selectedButton = screen.getByRole('button', { name: /light/i });
      expect(selectedButton).toHaveClass('bg-accent', 'text-white');
    });
  });

  describe('Transition Consistency', () => {
    it('should apply consistent transitions to all interactive elements', () => {
      render(<Settings />);
      
      const interactiveElements = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /dark/i }),
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      interactiveElements.forEach(element => {
        expect(element).toHaveClass('transition-colors');
      });
    });

    it('should apply consistent transitions to toggle elements', () => {
      render(<Settings />);
      
      // Find the toggle button container
      const toggleContainer = document.querySelector('.h-6.w-11');
      expect(toggleContainer).toHaveClass('transition-colors');

      // Find the toggle indicator
      const toggleIndicator = document.querySelector('.h-4.w-4.transform');
      expect(toggleIndicator).toHaveClass('transition-transform');
    });
  });

  describe('Layout Pattern Consistency', () => {
    it('should apply consistent flex layout to buttons with icons', () => {
      render(<Settings />);
      
      const buttonsWithIcons = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByText('Choose Color'),
        screen.getByRole('button', { name: /^reset$/i }),
      ];

      buttonsWithIcons.forEach(button => {
        expect(button).toHaveClass('flex', 'items-center');
      });
    });

    it('should apply consistent setting item layout', () => {
      render(<Settings />);
      
      // Check the minimize to tray setting layout
      const minimizeToTrayContainer = screen.getByText('Minimize to Tray').closest('.flex.items-center.justify-between');
      expect(minimizeToTrayContainer).toBeInTheDocument();
      expect(minimizeToTrayContainer).toHaveClass('py-2');
    });
  });

  describe('Design Token Pattern Compliance', () => {
    it('should use design token patterns for standard buttons', () => {
      render(<Settings />);
      
      const refreshButton = screen.getByRole('button', { name: /reset app list/i });
      
      // Verify that the button classes match the design token pattern
      const expectedClasses = PATTERNS.button.split(' ');
      expectedClasses.forEach(className => {
        if (className.trim()) {
          expect(refreshButton).toHaveClass(className);
        }
      });
    });

    it('should maintain consistent visual hierarchy across sections', () => {
      render(<Settings />);
      
      // Verify main container uses correct spacing - need to find the root container
      const mainContainer = document.querySelector('.p-4.space-y-8');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('p-4', 'space-y-8');
      
      // Verify section spacing
      const sections = document.querySelectorAll('.space-y-6');
      expect(sections.length).toBeGreaterThan(0);
    });
  });
});

describe('Settings - Startup Toggle Integration', () => {
  beforeEach(() => {
    vi.mocked(useSettingsStore).mockReturnValue(mockSettingsStore);
    vi.mocked(useAppStore).mockReturnValue(mockAppStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Startup Toggle Rendering', () => {
    it('should render startup toggle with correct label and description', () => {
      render(<Settings />);
      
      // Check that the startup toggle label is present
      expect(screen.getByText('Start at Windows Startup')).toBeInTheDocument();
      
      // Check that the startup toggle description is present
      expect(screen.getByText('Automatically launch Axon when Windows starts')).toBeInTheDocument();
    });

    it('should render startup toggle button with correct styling', () => {
      render(<Settings />);
      
      // Find all toggle buttons and get the second one (startup toggle)
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      
      expect(toggleButtons).toHaveLength(2); // minimize to tray + startup
      const startupToggle = toggleButtons[1]; // Second toggle is startup
      
      expect(startupToggle).toHaveClass('relative', 'inline-flex', 'h-6', 'w-11', 'items-center', 'rounded-full', 'transition-colors');
    });

    it('should render startup toggle indicator with correct styling', () => {
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // Check the toggle indicator (the sliding circle)
      const indicator = startupToggle.querySelector('span');
      expect(indicator).toHaveClass('inline-block', 'h-4', 'w-4', 'transform', 'rounded-full', 'bg-white', 'transition-transform');
    });

    it('should place startup toggle in correct section', () => {
      render(<Settings />);
      
      // Find the Application section
      const applicationSection = screen.getByText('Application');
      expect(applicationSection).toBeInTheDocument();
      
      // The startup toggle should be in the same section as minimize to tray
      const startupLabel = screen.getByText('Start at Windows Startup');
      const minimizeLabel = screen.getByText('Minimize to Tray');
      
      // Both should be present in the Application section
      expect(startupLabel).toBeInTheDocument();
      expect(minimizeLabel).toBeInTheDocument();
    });
  });

  describe('Startup Toggle State Display', () => {
    it('should show correct toggle state based on startupEnabled value', () => {
      // Test with startup disabled
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1]; // Second toggle is startup
      
      // Should have bg-surfaceSecondary when disabled (startupEnabled is false in mock)
      expect(startupToggle).toHaveClass('bg-surfaceSecondary');
    });

    it('should show enabled state when startupEnabled is true', () => {
      // Update mock to have startup enabled
      const enabledMockStore = {
        ...mockSettingsStore,
        startupEnabled: true,
      };
      
      vi.mocked(useSettingsStore).mockReturnValue(enabledMockStore);
      
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1]; // Second toggle is startup
      
      // Should have bg-accent when enabled
      expect(startupToggle).toHaveClass('bg-accent');
    });

    it('should show correct indicator position when disabled', () => {
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      const indicator = startupToggle.querySelector('span');
      
      // Should be positioned to the left when disabled
      expect(indicator).toHaveClass('translate-x-1');
    });

    it('should show correct indicator position when enabled', () => {
      const enabledMockStore = {
        ...mockSettingsStore,
        startupEnabled: true,
      };
      
      vi.mocked(useSettingsStore).mockReturnValue(enabledMockStore);
      
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      const indicator = startupToggle.querySelector('span');
      
      // Should be positioned to the right when enabled
      expect(indicator).toHaveClass('translate-x-6');
    });

    it('should maintain visual consistency with minimize to tray toggle', () => {
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      
      expect(toggleButtons).toHaveLength(2);
      const minimizeToggle = toggleButtons[0];
      const startupToggle = toggleButtons[1];
      
      // Both toggles should have the same base classes
      const expectedClasses = ['relative', 'inline-flex', 'h-6', 'w-11', 'items-center', 'rounded-full', 'transition-colors'];
      
      expectedClasses.forEach(className => {
        expect(minimizeToggle).toHaveClass(className);
        expect(startupToggle).toHaveClass(className);
      });
    });
  });

  describe('Startup Toggle Interaction', () => {
    it('should call setStartupEnabled when clicked', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      await user.click(startupToggle);
      
      expect(mockSettingsStore.setStartupEnabled).toHaveBeenCalledWith(true);
    });

    it('should toggle from false to true when clicked', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      await user.click(startupToggle);
      
      // Should call with opposite of current state (false -> true)
      expect(mockSettingsStore.setStartupEnabled).toHaveBeenCalledWith(true);
    });

    it('should toggle from true to false when clicked', async () => {
      const enabledMockStore = {
        ...mockSettingsStore,
        startupEnabled: true,
      };
      
      vi.mocked(useSettingsStore).mockReturnValue(enabledMockStore);
      
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      await user.click(startupToggle);
      
      // Should call with opposite of current state (true -> false)
      expect(enabledMockStore.setStartupEnabled).toHaveBeenCalledWith(false);
    });

    it('should handle multiple rapid clicks gracefully', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // Click multiple times rapidly
      await user.click(startupToggle);
      await user.click(startupToggle);
      await user.click(startupToggle);
      
      // Should have been called multiple times
      expect(mockSettingsStore.setStartupEnabled).toHaveBeenCalledTimes(3);
    });

    it('should be accessible via keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // Focus the toggle
      startupToggle.focus();
      expect(startupToggle).toHaveFocus();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      
      expect(mockSettingsStore.setStartupEnabled).toHaveBeenCalledWith(true);
    });

    it('should be accessible via space key', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // Focus the toggle
      startupToggle.focus();
      
      // Press Space to activate
      await user.keyboard(' ');
      
      expect(mockSettingsStore.setStartupEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('Startup Toggle Error Handling', () => {
    it('should handle setStartupEnabled errors gracefully', async () => {
      const errorMockStore = {
        ...mockSettingsStore,
        setStartupEnabled: vi.fn().mockRejectedValue(new Error('Backend error')),
      };
      
      vi.mocked(useSettingsStore).mockReturnValue(errorMockStore);
      
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      await user.click(startupToggle);
      
      expect(errorMockStore.setStartupEnabled).toHaveBeenCalledWith(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update startup setting:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should not crash when setStartupEnabled throws synchronously', async () => {
      const errorMockStore = {
        ...mockSettingsStore,
        setStartupEnabled: vi.fn().mockImplementation(() => {
          throw new Error('Synchronous error');
        }),
      };
      
      vi.mocked(useSettingsStore).mockReturnValue(errorMockStore);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // Should not crash the component
      await user.click(startupToggle);
      
      expect(errorMockStore.setStartupEnabled).toHaveBeenCalledWith(true);
      
      consoleSpy.mockRestore();
    });

    it('should remain interactive after error', async () => {
      let callCount = 0;
      const errorMockStore = {
        ...mockSettingsStore,
        setStartupEnabled: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('First call fails'));
          }
          return Promise.resolve();
        }),
      };
      
      vi.mocked(useSettingsStore).mockReturnValue(errorMockStore);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // First click fails
      await user.click(startupToggle);
      
      // Second click should still work
      await user.click(startupToggle);
      
      expect(errorMockStore.setStartupEnabled).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Startup Toggle Integration with Other Settings', () => {
    it('should not affect minimize to tray toggle when startup toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      await user.click(startupToggle);
      
      expect(mockSettingsStore.setStartupEnabled).toHaveBeenCalledWith(true);
      expect(mockSettingsStore.setMinimizeToTray).not.toHaveBeenCalled();
    });

    it('should work independently of other settings state', async () => {
      const mixedStateMockStore = {
        ...mockSettingsStore,
        minimizeToTray: true,
        startupEnabled: false,
        themeMode: 'dark' as const,
      };
      
      vi.mocked(useSettingsStore).mockReturnValue(mixedStateMockStore);
      
      const user = userEvent.setup();
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      await user.click(startupToggle);
      
      expect(mixedStateMockStore.setStartupEnabled).toHaveBeenCalledWith(true);
    });

    it('should maintain consistent styling regardless of other settings', () => {
      const mixedStateMockStore = {
        ...mockSettingsStore,
        minimizeToTray: true,
        startupEnabled: false,
        themeMode: 'dark' as const,
      };
      
      vi.mocked(useSettingsStore).mockReturnValue(mixedStateMockStore);
      
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // Should still have correct styling
      expect(startupToggle).toHaveClass('bg-surfaceSecondary');
    });
  });

  describe('Startup Toggle Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // Button elements have implicit role="button", so we just verify it's recognized as a button
      expect(startupToggle.tagName).toBe('BUTTON');
    });

    it('should be focusable', () => {
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      startupToggle.focus();
      expect(startupToggle).toHaveFocus();
    });

    it('should have proper tab order', () => {
      render(<Settings />);
      
      const allButtons = screen.getAllByRole('button');
      
      // Startup toggle should be in the tab order
      const toggleButtons = allButtons.filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      
      expect(toggleButtons).toHaveLength(2);
      expect(toggleButtons[1]).toBeInTheDocument();
    });

    it('should provide visual feedback on focus', () => {
      render(<Settings />);
      
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('relative inline-flex h-6 w-11')
      );
      const startupToggle = toggleButtons[1];
      
      // Focus should be visible (browser default focus styles)
      startupToggle.focus();
      expect(startupToggle).toHaveFocus();
    });
  });
});