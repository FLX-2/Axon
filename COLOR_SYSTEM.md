# Axon Color System

## Overview
The color system has been reorganized into a logical, nested structure for better maintainability and clarity.

## Structure

### Surfaces (Backgrounds)
- `surface-primary` - Main background
- `surface-secondary` - Cards, sidebar, topbar
- `surface-hover` - Hover state for interactive elements

### Text
- `text-primary` - Main text
- `text-secondary` - Secondary/muted text
- `text-placeholder` - Input placeholders

### Icons
- `icon-default` - Default icon color
- `icon-hover` - Icon hover state

### Interactive Elements
- `interactive-accent` - Accent color (selected states)
- `interactive-border` - Borders and dividers
- `interactive-buttonHover` - Button hover background
- `interactive-buttonSelected` - Selected button background

### Inputs
- `input-background` - Input background
- `input-border` - Input border

### Scrollbar
- `scrollbar-track` - Scrollbar track
- `scrollbar-thumb` - Scrollbar thumb hover

## Usage in Components

### Tailwind Classes
```tsx
// Surfaces
className="bg-surfacePrimary"
className="bg-surfaceSecondary"
className="hover:bg-surfaceHover"

// Text
className="text-textPrimary"
className="text-textSecondary"
className="placeholder-textPlaceholder"

// Icons
className="text-iconDefault"
className="group-hover:text-iconHover"

// Interactive
className="text-accent"
className="border-border"
className="hover:bg-buttonHover"
className="bg-buttonSelected"

// Inputs
className="bg-inputBg"
className="border-inputBorder"

// Scrollbar
className="bg-scrollbar"
className="hover:bg-scrollbarHover"
```

## Benefits
1. **Logical grouping** - Related colors are nested together
2. **Clear naming** - No more confusion about "sidebar" vs "main" colors
3. **Consistent** - All icons use the same color tokens
4. **Maintainable** - Easy to update entire categories at once
5. **Scalable** - Easy to add new color tokens within existing categories
