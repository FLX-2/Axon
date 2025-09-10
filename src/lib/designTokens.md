# Design Tokens Documentation

This document explains the design token system extracted from the minimize to tray toggle pattern in the Settings component.

## Overview

The design tokens are based on the well-designed minimize to tray toggle, which demonstrates excellent design principles:

- Consistent sizing and spacing
- Clear visual hierarchy
- Proper state management
- Smooth transitions
- Accessible color contrast

## Token Categories

### Heights (`HEIGHTS`)

All interactive elements should use consistent heights:

```tsx
// Standard button height
<button className={HEIGHTS.interactive}>Button</button>

// Toggle switch height
<div className={HEIGHTS.toggle}>Toggle</div>

// Standard icon size
<Icon className={HEIGHTS.icon} />
```

### Spacing (`SPACING`)

Consistent spacing creates visual rhythm:

```tsx
// Section spacing
<div className={SPACING.section}>
  <div>Section 1</div>
  <div>Section 2</div>
</div>

// Item spacing within sections
<div className={SPACING.items}>
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Colors (`COLORS`)

Color usage follows the toggle pattern:

```tsx
// Active state (like enabled toggle)
<div className={COLORS.active}>Active Element</div>

// Neutral state (like disabled toggle)
<div className={COLORS.neutral}>Neutral Element</div>

// Hover states
<button className={`${COLORS.neutral} ${COLORS.hover}`}>
  Hover Button
</button>
```

### Typography (`TYPOGRAPHY`)

Text hierarchy matches the toggle section:

```tsx
// Section headers
<h3 className={TYPOGRAPHY.header}>Section Title</h3>

// Setting labels
<span className={TYPOGRAPHY.label}>Setting Name</span>

// Descriptions
<span className={TYPOGRAPHY.description}>Help text</span>
```

## Pre-composed Patterns

For common UI elements, use the pre-composed patterns:

### Standard Button

```tsx
<button className={PATTERNS.button}>
  <Icon className={HEIGHTS.icon} />
  Button Text
</button>
```

### Toggle Switch

```tsx
<button 
  className={`${PATTERNS.toggle} ${getToggleBackground(isActive)}`}
>
  <span 
    className={`${PATTERNS.toggleIndicator} ${getToggleIndicatorPosition(isActive)}`}
  />
</button>
```

### Setting Item Layout

```tsx
<div className={PATTERNS.settingItem}>
  <div className={PATTERNS.labelWithDescription}>
    <span className={TYPOGRAPHY.label}>Setting Name</span>
    <span className={TYPOGRAPHY.description}>Description</span>
  </div>
  <div>
    {/* Control element */}
  </div>
</div>
```

### Theme Selection Button

```tsx
<button 
  className={`${PATTERNS.themeButton} ${getButtonStateClasses(isSelected)}`}
>
  <Icon className={HEIGHTS.icon} />
  <span className="text-sm">Theme Name</span>
</button>
```

## Helper Functions

### Toggle State Management

```tsx
// Background color based on toggle state
const toggleBg = getToggleBackground(settings.minimizeToTray);

// Indicator position based on toggle state
const indicatorPos = getToggleIndicatorPosition(settings.minimizeToTray);
```

### Button State Management

```tsx
// Button classes based on selection and disabled state
const buttonClasses = getButtonStateClasses(isSelected, isDisabled);
```

## Implementation Guidelines

### 1. Consistency First

Always use the design tokens instead of hardcoded Tailwind classes:

```tsx
// ❌ Don't do this
<button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">

// ✅ Do this
<button className={PATTERNS.button}>
```

### 2. State Management

Use the helper functions for dynamic states:

```tsx
// ❌ Don't do this
<div className={`toggle ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}>

// ✅ Do this
<div className={`${PATTERNS.toggle} ${getToggleBackground(isActive)}`}>
```

### 3. Spacing Hierarchy

Follow the spacing system for visual rhythm:

```tsx
// ❌ Don't mix spacing patterns
<div className="space-y-4">
  <div className="space-y-2">
    <div className="space-y-5">

// ✅ Use consistent spacing
<div className={SPACING.section}>
  <div className={SPACING.items}>
```

### 4. Typography Hierarchy

Maintain consistent text hierarchy:

```tsx
// ❌ Don't use arbitrary text sizes
<h3 className="text-base font-bold">
<span className="text-sm text-gray-600">

// ✅ Use typography tokens
<h3 className={TYPOGRAPHY.header}>
<span className={TYPOGRAPHY.description}>
```

## Migration Strategy

When updating existing components:

1. **Identify Patterns**: Look for elements similar to the toggle
2. **Replace Classes**: Swap hardcoded classes with design tokens
3. **Test States**: Verify all interactive states work correctly
4. **Validate Spacing**: Ensure spacing follows the token system

## Benefits

- **Consistency**: All elements follow the same design language
- **Maintainability**: Changes to design tokens update all components
- **Accessibility**: Consistent focus states and color contrast
- **Developer Experience**: Clear patterns reduce decision fatigue
- **Design System**: Foundation for future component development

## Reference Implementation

The minimize to tray toggle serves as the reference implementation:

```tsx
// Reference pattern from Settings.tsx
<button
  className={`
    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
    ${settings.minimizeToTray ? 'bg-accent' : 'bg-surfaceSecondary'}
  `}
>
  <span
    className={`
      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
      ${settings.minimizeToTray ? 'translate-x-6' : 'translate-x-1'}
    `}
  />
</button>
```

This pattern demonstrates all the key design principles that should be applied throughout the settings panel.