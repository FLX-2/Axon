import { render, screen } from '@testing-library/react';
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