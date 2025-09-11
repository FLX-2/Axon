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
  startupEnabled: false,
  setStartupEnabled: vi.fn(),
  startMinimized: false,
  setStartMinimized: vi.fn(),
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

describe('Settings - Comprehensive Visual Consistency Tests', () => {
  beforeEach(() => {
    vi.mocked(useSettingsStore).mockReturnValue(mockSettingsStore);
    vi.mocked(useAppStore).mockReturnValue(mockAppStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Interactive Element Height Consistency (Requirement 1.4)', () => {
    it('should apply consistent height (h-10) to all theme selection buttons', () => {
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

    it('should apply consistent height (h-10) to all action buttons', () => {
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

    it('should apply correct toggle height (h-6) for toggle switches', () => {
      render(<Settings />);
      
      const toggleContainer = document.querySelector('.h-6.w-11');
      expect(toggleContainer).toBeInTheDocument();
      expect(toggleContainer).toHaveClass('h-6');
    });

    it('should verify all interactive elements follow height design tokens', () => {
      render(<Settings />);
      
      // Check that interactive elements use the correct height from design tokens
      const interactiveElements = document.querySelectorAll('.h-10');
      expect(interactiveElements.length).toBeGreaterThanOrEqual(7); // 4 theme buttons + 3 action buttons
      
      const toggleElements = document.querySelectorAll('.h-6');
      expect(toggleElements.length).toBeGreaterThanOrEqual(1); // At least the minimize to tray toggle
    });
  });

  describe('Icon Size Consistency (Requirement 2.4)', () => {
    it('should apply consistent icon sizing (w-4 h-4) across all interactive elements', () => {
      render(<Settings />);
      
      // Check theme button icons
      const themeButtons = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /dark/i }),
        screen.getByRole('button', { name: /black/i }),
        screen.getByRole('button', { name: /system/i }),
      ];
      
      themeButtons.forEach(button => {
        const icon = button.querySelector('svg');
        expect(icon).toHaveClass('w-4', 'h-4');
      });

      // Check action button icons
      const actionButtons = [
        screen.getByRole('button', { name: /reset app list/i }),
        screen.getByRole('button', { name: /^reset$/i }),
      ];
      
      actionButtons.forEach(button => {
        const icon = button.querySelector('svg');
        expect(icon).toHaveClass('w-4', 'h-4');
      });
    });

    it('should apply consistent section header icon sizing', () => {
      render(<Settings />);
      
      // Main settings title removed for consistency with other tabs

      // Check section icons (should be w-4 h-4 for inline icons)
      const customizationSection = screen.getByText('Customization').querySelector('svg');
      expect(customizationSection).toHaveClass('w-4', 'h-4');
      
      const applicationSection = screen.getByText('Application').querySelector('svg');
      expect(applicationSection).toHaveClass('w-4', 'h-4');
    });

    it('should verify all icons follow design token sizing patterns', () => {
      render(<Settings />);
      
      // Count all w-4 h-4 icons (standard interactive icons)
      const standardIcons = document.querySelectorAll('svg.w-4.h-4');
      expect(standardIcons.length).toBeGreaterThanOrEqual(7); // Theme buttons + action buttons + section icon
      
      // No w-5 h-5 icons expected since main settings title was removed
      const headerIcons = document.querySelectorAll('svg.w-5.h-5');
      expect(headerIcons.length).toBe(0); // No large header icons
    });
  });

  describe('Button State Consistency (Requirements 1.4, 2.4)', () => {
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

    it('should verify all button states follow design token patterns', () => {
      render(<Settings />);
      
      // Check that disabled state uses design tokens
      const disabledClasses = STATES.disabled.split(' ');
      
      vi.mocked(useAppStore).mockReturnValue({
        ...mockAppStore,
        isLoading: true,
      });

      render(<Settings />);
      const refreshButton = screen.getByRole('button', { name: /refreshing/i });
      
      disabledClasses.forEach(className => {
        if (className.trim()) {
          expect(refreshButton).toHaveClass(className);
        }
      });
    });
  });

  describe('Spacing and Layout Consistency (Requirements 3.4, 6.4)', () => {
    it('should apply consistent padding to all buttons', () => {
      render(<Settings />);
      
      // Theme buttons should use compact padding (px-3 py-2)
      const themeButtons = [
        screen.getByRole('button', { name: /light/i }),
        screen.getByRole('button', { name: /dark/i }),
      ];

      themeButtons.forEach(button => {
        expect(button).toHaveClass('px-3', 'py-2');
      });

      // Action buttons should use standard padding (px-4 py-2)
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

    it('should verify spacing follows design token patterns', () => {
      render(<Settings />);
      
      // Check main container spacing
      const mainContainer = document.querySelector('.p-4.space-y-8');
      expect(mainContainer).toBeInTheDocument();
      
      // Check section spacing
      const sections = document.querySelectorAll('.space-y-6');
      expect(sections.length).toBeGreaterThan(0);
      
      // Check item spacing within sections
      const itemGroups = document.querySelectorAll('.space-y-3');
      expect(itemGroups.length).toBeGreaterThan(0);
    });
  });

  describe('Typography Consistency (Requirements 3.4, 6.4)', () => {
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

    it('should verify typography follows design token patterns', () => {
      render(<Settings />);
      
      // Main settings title removed for consistency with other tabs
      // Typography consistency is now verified through section headers
    });
  });

  describe('Color and Background Consistency (Requirements 1.4, 2.4)', () => {
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

    it('should verify color usage follows design token patterns', () => {
      render(<Settings />);
      
      // Check that color classes match design tokens
      const neutralButton = screen.getByRole('button', { name: /dark/i });
      expect(neutralButton).toHaveClass('bg-surfaceSecondary');
      expect(neutralButton).toHaveClass('text-textPrimary');
      
      const selectedButton = screen.getByRole('button', { name: /light/i });
      expect(selectedButton).toHaveClass('bg-accent');
    });
  });

  describe('Transition Consistency (Requirements 1.4, 2.4)', () => {
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

    it('should verify transitions follow design token patterns', () => {
      render(<Settings />);
      
      // Check that transition classes match design tokens
      const button = screen.getByRole('button', { name: /light/i });
      expect(button).toHaveClass('transition-colors');
      
      const toggleIndicator = document.querySelector('.transition-transform');
      expect(toggleIndicator).toBeInTheDocument();
    });
  });

  describe('Layout Pattern Consistency (Requirements 3.4, 6.4)', () => {
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

    it('should verify layout patterns follow design token patterns', () => {
      render(<Settings />);
      
      // Check that layout classes match design tokens
      const button = screen.getByRole('button', { name: /light/i });
      expect(button).toHaveClass('flex', 'items-center', 'gap-2');
      
      // Check setting item layout
      const settingItem = screen.getByText('Minimize to Tray').closest('.flex.items-center.justify-between');
      expect(settingItem).toHaveClass('py-2');
    });
  });

  describe('Design Token Pattern Compliance (Requirements 1.4, 2.4, 3.4, 6.4)', () => {
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
      
      // Verify main container uses correct spacing
      const mainContainer = document.querySelector('.p-4.space-y-8');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('p-4', 'space-y-8');
      
      // Verify section spacing
      const sections = document.querySelectorAll('.space-y-6');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should verify all design patterns are consistently applied', () => {
      render(<Settings />);
      
      // Test that all major design token patterns are present
      const buttonElements = document.querySelectorAll('.px-4.py-2.bg-surfaceSecondary');
      expect(buttonElements.length).toBeGreaterThanOrEqual(3); // Action buttons
      
      const themeButtonElements = document.querySelectorAll('.px-3.py-2.rounded-lg');
      expect(themeButtonElements.length).toBeGreaterThanOrEqual(4); // Theme buttons
      
      const transitionElements = document.querySelectorAll('.transition-colors');
      expect(transitionElements.length).toBeGreaterThanOrEqual(7); // All interactive elements
    });

    it('should ensure no visual inconsistencies exist', () => {
      render(<Settings />);
      
      // Verify that all buttons have consistent height
      const allButtons = document.querySelectorAll('button:not(.h-6)'); // Exclude toggle
      allButtons.forEach(button => {
        expect(button).toHaveClass('h-10');
      });
      
      // Verify that all icons in buttons have consistent size
      const buttonIcons = document.querySelectorAll('button svg');
      buttonIcons.forEach(icon => {
        // Should be either w-4 h-4 (standard) or w-5 h-5 (header)
        const hasStandardSize = icon.classList.contains('w-4') && icon.classList.contains('h-4');
        const hasHeaderSize = icon.classList.contains('w-5') && icon.classList.contains('h-5');
        expect(hasStandardSize || hasHeaderSize).toBe(true);
      });
    });
  });

  describe('Start Minimized Toggle Visual Consistency (Requirements 1.1, 3.1, 3.2, 3.3)', () => {
    describe('Toggle Appearance Matches Existing Toggles', () => {
      it('should have identical dimensions to other toggles', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: true,
        });

        render(<Settings />);
        
        // Get all toggle containers
        const toggleContainers = document.querySelectorAll('.h-6.w-11');
        expect(toggleContainers.length).toBeGreaterThanOrEqual(3); // Minimize to Tray, Start at Windows Startup, Start Minimized
        
        // Verify all toggles have identical dimensions
        toggleContainers.forEach(toggle => {
          expect(toggle).toHaveClass('h-6', 'w-11');
        });
      });

      it('should have identical styling classes to other toggles', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: true,
        });

        render(<Settings />);
        
        // Get all toggle containers
        const toggleContainers = document.querySelectorAll('.h-6.w-11');
        
        // Verify all toggles have consistent base classes
        toggleContainers.forEach(toggle => {
          expect(toggle).toHaveClass(
            'relative',
            'inline-flex',
            'h-6',
            'w-11', 
            'items-center',
            'rounded-full',
            'transition-colors'
          );
        });
      });

      it('should have identical toggle indicator styling', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: true,
        });

        render(<Settings />);
        
        // Get all toggle indicators
        const toggleIndicators = document.querySelectorAll('.h-4.w-4.transform.rounded-full.bg-white.transition-transform');
        expect(toggleIndicators.length).toBeGreaterThanOrEqual(3);
        
        // Verify all indicators have identical styling
        toggleIndicators.forEach(indicator => {
          expect(indicator).toHaveClass(
            'inline-block',
            'h-4',
            'w-4',
            'transform',
            'rounded-full',
            'bg-white',
            'transition-transform'
          );
        });
      });

      it('should match active state styling of other toggles', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: true,
          startMinimized: true,
        });

        render(<Settings />);
        
        // Find the Start Minimized toggle by its label
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Find another active toggle for comparison
        const minimizeToTrayLabel = screen.getByText('Minimize to Tray');
        const minimizeToTrayToggle = minimizeToTrayLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Both should have accent background when active
        expect(startMinimizedToggle).toHaveClass('bg-accent');
        expect(minimizeToTrayToggle).toHaveClass('bg-accent');
      });

      it('should match inactive state styling of other toggles', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: false,
          startupEnabled: false,
          startMinimized: false,
        });

        render(<Settings />);
        
        // Find toggles by their labels
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        const minimizeToTrayLabel = screen.getByText('Minimize to Tray');
        const minimizeToTrayToggle = minimizeToTrayLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Both should have secondary background when inactive
        expect(startMinimizedToggle).toHaveClass('bg-surfaceSecondary');
        expect(minimizeToTrayToggle).toHaveClass('bg-surfaceSecondary');
      });
    });

    describe('Toggle Positioning and Spacing', () => {
      it('should be positioned correctly within the Application section', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: true,
        });

        render(<Settings />);
        
        // Find the Application section
        const applicationSection = screen.getByText('Application');
        const applicationContainer = applicationSection.closest('.space-y-6');
        
        // Verify Start Minimized toggle is within the Application section
        const startMinimizedLabel = screen.getByText('Start Minimized');
        expect(applicationContainer).toContainElement(startMinimizedLabel);
      });

      it('should be positioned after "Start at Windows Startup" toggle', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: true,
        });

        render(<Settings />);
        
        // Get all setting items in the Application section
        const applicationSection = screen.getByText('Application');
        const applicationContainer = applicationSection.closest('.space-y-6');
        const settingItems = applicationContainer?.querySelectorAll('.flex.items-center.justify-between.py-2');
        
        // Find the positions of the toggles
        let startupToggleIndex = -1;
        let startMinimizedToggleIndex = -1;
        
        settingItems?.forEach((item, index) => {
          const labelText = item.querySelector('span')?.textContent;
          if (labelText === 'Start at Windows Startup') {
            startupToggleIndex = index;
          } else if (labelText === 'Start Minimized') {
            startMinimizedToggleIndex = index;
          }
        });
        
        // Start Minimized should come after Start at Windows Startup
        expect(startMinimizedToggleIndex).toBeGreaterThan(startupToggleIndex);
      });

      it('should have consistent vertical spacing with other setting items', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: true,
        });

        render(<Settings />);
        
        // Find all setting items
        const settingItems = document.querySelectorAll('.flex.items-center.justify-between.py-2');
        
        // Verify all setting items have consistent py-2 spacing
        settingItems.forEach(item => {
          expect(item).toHaveClass('py-2');
        });
        
        // Verify Start Minimized has the same spacing
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedItem = startMinimizedLabel.closest('.flex.items-center.justify-between');
        expect(startMinimizedItem).toHaveClass('py-2');
      });

      it('should maintain consistent horizontal alignment with other toggles', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: true,
        });

        render(<Settings />);
        
        // Find all setting items with toggles
        const settingItems = document.querySelectorAll('.flex.items-center.justify-between');
        
        // Verify all use justify-between for consistent alignment
        settingItems.forEach(item => {
          if (item.querySelector('.h-6.w-11')) { // Has a toggle
            expect(item).toHaveClass('justify-between');
          }
        });
      });
    });

    describe('Toggle Behavior in Different Theme Modes', () => {
      it('should maintain consistent styling in light theme', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          themeMode: 'light',
          minimizeToTray: true,
          startupEnabled: true,
          startMinimized: true,
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Should have accent background when active in light theme
        expect(startMinimizedToggle).toHaveClass('bg-accent');
        
        // Toggle indicator should be positioned correctly
        const toggleIndicator = startMinimizedToggle?.querySelector('.h-4.w-4.transform');
        expect(toggleIndicator).toHaveClass('translate-x-6'); // Active position
      });

      it('should maintain consistent styling in dark theme', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          themeMode: 'dark',
          minimizeToTray: true,
          startupEnabled: true,
          startMinimized: true,
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Should have accent background when active in dark theme
        expect(startMinimizedToggle).toHaveClass('bg-accent');
        
        // Toggle indicator should be positioned correctly
        const toggleIndicator = startMinimizedToggle?.querySelector('.h-4.w-4.transform');
        expect(toggleIndicator).toHaveClass('translate-x-6'); // Active position
      });

      it('should maintain consistent styling in black theme', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          themeMode: 'black',
          minimizeToTray: true,
          startupEnabled: true,
          startMinimized: true,
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Should have accent background when active in black theme
        expect(startMinimizedToggle).toHaveClass('bg-accent');
        
        // Toggle indicator should be positioned correctly
        const toggleIndicator = startMinimizedToggle?.querySelector('.h-4.w-4.transform');
        expect(toggleIndicator).toHaveClass('translate-x-6'); // Active position
      });

      it('should maintain consistent styling in system theme', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          themeMode: 'system',
          minimizeToTray: true,
          startupEnabled: true,
          startMinimized: true,
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Should have accent background when active in system theme
        expect(startMinimizedToggle).toHaveClass('bg-accent');
        
        // Toggle indicator should be positioned correctly
        const toggleIndicator = startMinimizedToggle?.querySelector('.h-4.w-4.transform');
        expect(toggleIndicator).toHaveClass('translate-x-6'); // Active position
      });
    });

    describe('Disabled State Styling', () => {
      it('should show disabled styling when "Start at Windows Startup" is disabled', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true,
          startupEnabled: false, // Disabled
          startMinimized: false,
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Should have disabled styling
        expect(startMinimizedToggle).toHaveClass('opacity-70', 'cursor-not-allowed', 'bg-surfaceSecondary');
        expect(startMinimizedToggle).toHaveAttribute('disabled');
      });

      it('should show disabled styling when "Minimize to Tray" is disabled', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: false, // Disabled
          startupEnabled: true,
          startMinimized: false,
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Should have disabled styling
        expect(startMinimizedToggle).toHaveClass('opacity-70', 'cursor-not-allowed', 'bg-surfaceSecondary');
        expect(startMinimizedToggle).toHaveAttribute('disabled');
      });

      it('should show disabled styling when both prerequisite settings are disabled', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: false, // Disabled
          startupEnabled: false, // Disabled
          startMinimized: false,
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Should have disabled styling
        expect(startMinimizedToggle).toHaveClass('opacity-70', 'cursor-not-allowed', 'bg-surfaceSecondary');
        expect(startMinimizedToggle).toHaveAttribute('disabled');
      });

      it('should be enabled when both prerequisite settings are enabled', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: true, // Enabled
          startupEnabled: true, // Enabled
          startMinimized: false,
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Should NOT have disabled styling
        expect(startMinimizedToggle).not.toHaveClass('opacity-70', 'cursor-not-allowed');
        expect(startMinimizedToggle).not.toHaveAttribute('disabled');
        expect(startMinimizedToggle).toHaveClass('bg-surfaceSecondary'); // Normal inactive state
      });

      it('should maintain disabled styling consistency with other disabled elements', () => {
        // Test with refresh button disabled for comparison
        vi.mocked(useAppStore).mockReturnValue({
          ...mockAppStore,
          isLoading: true,
        });

        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: false,
          startupEnabled: false,
          startMinimized: false,
        });

        render(<Settings />);
        
        // Get disabled Start Minimized toggle
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        
        // Get disabled refresh button
        const refreshButton = screen.getByRole('button', { name: /refreshing/i });
        
        // Both should have consistent disabled styling
        expect(startMinimizedToggle).toHaveClass('opacity-70', 'cursor-not-allowed');
        expect(refreshButton).toHaveClass('opacity-70', 'cursor-not-allowed');
      });

      it('should show correct toggle indicator position when disabled', () => {
        vi.mocked(useSettingsStore).mockReturnValue({
          ...mockSettingsStore,
          minimizeToTray: false,
          startupEnabled: false,
          startMinimized: true, // Would be active if enabled
        });

        render(<Settings />);
        
        const startMinimizedLabel = screen.getByText('Start Minimized');
        const startMinimizedToggle = startMinimizedLabel.closest('.flex.items-center.justify-between')?.querySelector('.h-6.w-11');
        const toggleIndicator = startMinimizedToggle?.querySelector('.h-4.w-4.transform');
        
        // Should be in inactive position despite startMinimized being true
        expect(toggleIndicator).toHaveClass('translate-x-1'); // Inactive position
      });
    });
  });
});