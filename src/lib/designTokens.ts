/**
 * Design Tokens extracted from the minimize to tray toggle pattern
 * 
 * This file establishes consistent design patterns based on the well-designed
 * minimize to tray toggle component. All UI elements in the settings panel
 * should follow these patterns for visual consistency.
 */

/**
 * Interactive Element Heights
 * Based on the minimize to tray toggle (h-6) and button patterns
 */
export const HEIGHTS = {
  /** Standard height for major interactive elements like buttons */
  interactive: 'h-10',
  /** Height for toggle switches and compact controls */
  toggle: 'h-6',
  /** Standard icon size used throughout the interface */
  icon: 'w-4 h-4',
  /** Larger icon size for section headers */
  iconLarge: 'w-5 h-5',
  /** Color preview size for accent color display */
  colorPreview: 'w-12 h-12',
} as const;

/**
 * Spacing and Layout Patterns
 * Extracted from the minimize to tray toggle section layout
 */
export const SPACING = {
  /** Vertical spacing between major sections */
  section: 'space-y-6',
  /** Vertical spacing between setting items within a section */
  items: 'space-y-3',
  /** Horizontal spacing between inline elements (icons, text) */
  inline: 'gap-2',
  /** Padding for interactive elements */
  buttonPadding: 'px-4 py-2',
  /** Padding for compact buttons */
  buttonPaddingCompact: 'px-3 py-2',
  /** Container padding for the main settings panel */
  container: 'p-4 space-y-8',
} as const;

/**
 * Color Patterns
 * Based on the minimize to tray toggle color usage
 */
export const COLORS = {
  /** Active/selected state background (used in toggle when enabled) */
  active: 'bg-accent',
  /** Neutral background for inactive states */
  neutral: 'bg-surfaceSecondary',
  /** Hover state for interactive elements */
  hover: 'hover:bg-surfaceHover',
  /** Selected state for theme buttons */
  selected: 'bg-buttonSelected',
  /** Text color hierarchy */
  text: {
    primary: 'text-textPrimary',
    secondary: 'text-textSecondary',
  },
  /** Toggle indicator (always white) */
  toggleIndicator: 'bg-white',
} as const;

/**
 * Typography Scale
 * Based on the text hierarchy in the minimize to tray section
 */
export const TYPOGRAPHY = {
  /** Section headers */
  header: 'text-sm font-medium',
  /** Setting labels and button text */
  label: 'text-sm text-textPrimary',
  /** Label text size without color (for buttons with dynamic colors) */
  labelSize: 'text-sm',
  /** Descriptive text and help text */
  description: 'text-xs text-textSecondary',
  /** Main page title */
  title: 'text-lg font-semibold',
} as const;

/**
 * Border Radius Patterns
 * Consistent rounding based on the toggle design
 */
export const BORDER_RADIUS = {
  /** Standard border radius for buttons and containers */
  standard: 'rounded-lg',
  /** Full border radius for toggles and circular elements */
  full: 'rounded-full',
} as const;

/**
 * Transition Patterns
 * Consistent animations based on the toggle behavior
 */
export const TRANSITIONS = {
  /** Standard color transitions for interactive elements */
  colors: 'transition-colors',
  /** Transform transitions for toggle indicators */
  transform: 'transition-transform',
  /** Combined transitions for complex interactions */
  all: 'transition-colors transition-transform',
} as const;

/**
 * State Patterns
 * Consistent state styling based on the toggle implementation
 */
export const STATES = {
  /** Disabled state styling */
  disabled: 'opacity-70 cursor-not-allowed',
  /** Loading state styling */
  loading: 'opacity-70 cursor-not-allowed',
  /** Focus state (for accessibility) */
  focus: 'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
} as const;

/**
 * Layout Patterns
 * Common layout patterns extracted from the minimize to tray section
 */
export const LAYOUTS = {
  /** Setting item layout (label on left, control on right) */
  settingItem: 'flex items-center justify-between',
  /** Label and description column layout */
  labelColumn: 'flex flex-col',
  /** Icon and text inline layout */
  iconText: 'flex items-center gap-2',
  /** Button group layout */
  buttonGroup: 'flex items-center gap-2',
  /** Theme selection grid */
  themeGrid: 'flex space-x-2 flex-wrap gap-2',
} as const;

/**
 * Complete Design Patterns
 * Pre-composed class combinations for common UI patterns
 */
export const PATTERNS = {
  /** Standard button pattern */
  button: `${SPACING.buttonPadding} ${COLORS.neutral} ${COLORS.hover} ${COLORS.text.primary} ${BORDER_RADIUS.standard} ${LAYOUTS.iconText} ${TRANSITIONS.colors} ${HEIGHTS.interactive}`,
  
  /** Compact button pattern */
  buttonCompact: `${SPACING.buttonPaddingCompact} ${COLORS.neutral} ${COLORS.hover} ${COLORS.text.primary} ${BORDER_RADIUS.standard} ${LAYOUTS.iconText} ${TRANSITIONS.colors} ${HEIGHTS.interactive}`,
  
  /** Toggle switch pattern */
  toggle: `relative inline-flex ${HEIGHTS.toggle} w-11 items-center ${BORDER_RADIUS.full} ${TRANSITIONS.colors}`,
  
  /** Toggle indicator pattern */
  toggleIndicator: `inline-block h-4 w-4 transform ${BORDER_RADIUS.full} ${COLORS.toggleIndicator} ${TRANSITIONS.transform}`,
  
  /** Main page title pattern */
  title: `${TYPOGRAPHY.title}`,
  
  /** Section header pattern */
  sectionHeader: `text-base font-semibold ${LAYOUTS.iconText}`,
  
  /** Setting item pattern */
  settingItem: `flex items-start justify-between py-2`,
  
  /** Label with description pattern */
  labelWithDescription: `${LAYOUTS.labelColumn} gap-1`,
  
  /** Theme button pattern (selected state handled separately) */
  themeButton: `${LAYOUTS.iconText} ${SPACING.buttonPaddingCompact} ${BORDER_RADIUS.standard} ${TRANSITIONS.colors}`,
} as const;
