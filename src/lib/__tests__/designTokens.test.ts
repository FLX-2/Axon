import { describe, it, expect } from 'vitest';
import {
  HEIGHTS,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  BORDER_RADIUS,
  TRANSITIONS,
  STATES,
  LAYOUTS,
  PATTERNS,
  getToggleBackground,
  getToggleIndicatorPosition,
  getButtonStateClasses,
} from '../designTokens';

describe('Design Tokens', () => {
  describe('Token Constants', () => {
    it('should have consistent height tokens', () => {
      expect(HEIGHTS.interactive).toBe('h-10');
      expect(HEIGHTS.toggle).toBe('h-6');
      expect(HEIGHTS.icon).toBe('w-4 h-4');
      expect(HEIGHTS.iconLarge).toBe('w-5 h-5');
      expect(HEIGHTS.colorPreview).toBe('w-12 h-12');
    });

    it('should have consistent spacing tokens', () => {
      expect(SPACING.section).toBe('space-y-6');
      expect(SPACING.items).toBe('space-y-3');
      expect(SPACING.inline).toBe('gap-2');
      expect(SPACING.buttonPadding).toBe('px-4 py-2');
      expect(SPACING.buttonPaddingCompact).toBe('px-3 py-2');
    });

    it('should have consistent color tokens', () => {
      expect(COLORS.active).toBe('bg-accent');
      expect(COLORS.neutral).toBe('bg-surfaceSecondary');
      expect(COLORS.hover).toBe('hover:bg-surfaceHover');
      expect(COLORS.selected).toBe('bg-buttonSelected');
      expect(COLORS.text.primary).toBe('text-textPrimary');
      expect(COLORS.text.secondary).toBe('text-textSecondary');
    });

    it('should have consistent typography tokens', () => {
      expect(TYPOGRAPHY.header).toBe('text-sm font-medium');
      expect(TYPOGRAPHY.label).toBe('text-sm text-textPrimary');
      expect(TYPOGRAPHY.description).toBe('text-xs text-textSecondary');
      expect(TYPOGRAPHY.title).toBe('text-lg font-semibold');
    });

    it('should have consistent border radius tokens', () => {
      expect(BORDER_RADIUS.standard).toBe('rounded-lg');
      expect(BORDER_RADIUS.full).toBe('rounded-full');
    });

    it('should have consistent transition tokens', () => {
      expect(TRANSITIONS.colors).toBe('transition-colors');
      expect(TRANSITIONS.transform).toBe('transition-transform');
      expect(TRANSITIONS.all).toBe('transition-colors transition-transform');
    });

    it('should have consistent state tokens', () => {
      expect(STATES.disabled).toBe('opacity-70 cursor-not-allowed');
      expect(STATES.loading).toBe('opacity-70 cursor-not-allowed');
      expect(STATES.focus).toBe('focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2');
    });

    it('should have consistent layout tokens', () => {
      expect(LAYOUTS.settingItem).toBe('flex items-center justify-between');
      expect(LAYOUTS.labelColumn).toBe('flex flex-col');
      expect(LAYOUTS.iconText).toBe('flex items-center gap-2');
      expect(LAYOUTS.buttonGroup).toBe('flex items-center gap-2');
    });
  });

  describe('Pre-composed Patterns', () => {
    it('should have complete button pattern', () => {
      expect(PATTERNS.button).toContain('px-4 py-2');
      expect(PATTERNS.button).toContain('bg-surfaceSecondary');
      expect(PATTERNS.button).toContain('hover:bg-surfaceHover');
      expect(PATTERNS.button).toContain('rounded-lg');
      expect(PATTERNS.button).toContain('h-10');
    });

    it('should have complete toggle pattern', () => {
      expect(PATTERNS.toggle).toContain('relative inline-flex');
      expect(PATTERNS.toggle).toContain('h-6');
      expect(PATTERNS.toggle).toContain('w-11');
      expect(PATTERNS.toggle).toContain('rounded-full');
    });

    it('should have complete toggle indicator pattern', () => {
      expect(PATTERNS.toggleIndicator).toContain('inline-block');
      expect(PATTERNS.toggleIndicator).toContain('h-4 w-4');
      expect(PATTERNS.toggleIndicator).toContain('rounded-full');
      expect(PATTERNS.toggleIndicator).toContain('bg-white');
    });
  });

  describe('Helper Functions', () => {
    describe('getToggleBackground', () => {
      it('should return active color when toggle is active', () => {
        expect(getToggleBackground(true)).toBe('bg-accent');
      });

      it('should return neutral color when toggle is inactive', () => {
        expect(getToggleBackground(false)).toBe('bg-surfaceSecondary');
      });
    });

    describe('getToggleIndicatorPosition', () => {
      it('should return right position when toggle is active', () => {
        expect(getToggleIndicatorPosition(true)).toBe('translate-x-6');
      });

      it('should return left position when toggle is inactive', () => {
        expect(getToggleIndicatorPosition(false)).toBe('translate-x-1');
      });
    });

    describe('getButtonStateClasses', () => {
      it('should return disabled classes when button is disabled', () => {
        const result = getButtonStateClasses(false, true);
        expect(result).toBe('opacity-70 cursor-not-allowed');
      });

      it('should return selected classes when button is selected', () => {
        const result = getButtonStateClasses(true, false);
        expect(result).toBe('bg-buttonSelected text-textPrimary');
      });

      it('should return hover classes when button is neither selected nor disabled', () => {
        const result = getButtonStateClasses(false, false);
        expect(result).toBe('hover:bg-surfaceHover text-textPrimary');
      });
    });
  });

  describe('Token Consistency', () => {
    it('should use consistent icon sizes across patterns', () => {
      // Verify that icon sizes are consistent
      expect(HEIGHTS.icon).toBe('w-4 h-4');
      expect(HEIGHTS.iconLarge).toBe('w-5 h-5');
    });

    it('should use consistent spacing values', () => {
      // Verify spacing follows a logical scale
      expect(SPACING.inline).toBe('gap-2');
      expect(SPACING.items).toBe('space-y-3');
      expect(SPACING.section).toBe('space-y-6');
    });

    it('should use consistent color naming', () => {
      // Verify color tokens follow semantic naming
      expect(COLORS.active).toContain('accent');
      expect(COLORS.neutral).toContain('surfaceSecondary');
      expect(COLORS.hover).toContain('surfaceHover');
    });
  });
});