# Murray-Alabaster Glass Morphic Theme - Style Guide

## Overview
I've implemented a sophisticated Murray-Alabaster theme with bold glass morphic UI elements in a minimalistic style for the RedRob AI Recruiter application. The design combines modern glass effects with a clean, professional color palette.

## Color Palette
- **Alabaster**: `#F8F9FA` - Primary background
- **Murray Primary**: `#4A5568` - Secondary text/background
- **Murray Secondary**: `#2D3748` - Primary text
- **Murray Accent**: `#3182CE` - Primary accent/CTA
- **Murray Accent Light**: `#63B3ED` - Secondary accent
- **Murray Accent Dark**: `#2C5282` - Dark accent
- **Glass Background**: `rgba(255, 255, 255, 0.15)`
- **Glass Border**: `rgba(255, 255, 255, 0.25)`

## Typography
- **Primary Font**: Inter (imported via Google Fonts)
- **Heading Font Weight**: 700 (Bold)
- **Body Font Weight**: 400-600
- **Font Scale**: Modular scale with clear hierarchy

## Design Principles

### 1. Glass Morphism
- Subtle background blur effects using `backdrop-filter`
- Layered transparency for depth
- Soft borders with glass-like edges
- Smooth transitions between states

### 2. Minimalism
- Clean, uncluttered layouts
- Generous whitespace (defined spacing variables)
- Clear visual hierarchy
- Purposeful use of color

### 3. Bold Elements
- Strong typographic hierarchy
- Prominent CTAs with gradient backgrounds
- Clear visual indicators for interactive elements
- High contrast for accessibility

## Key CSS Features

### Custom Properties (CSS Variables)
All colors, spacing, and effects are defined as CSS variables for easy theming and consistency.

### Glass Effects Utility Classes
- `.glass`: Light glass effect
- `.glass-heavy`: Heavy glass effect with stronger blur
- `.glass-card`: Interactive glass cards with hover effects

### Spacing System
Consistent spacing scale from `--space-xs` (0.25rem) to `--space-xxl` (3rem)

### Border Radius Scale
- `--radius-sm`: 8px
- `--radius-md`: 16px
- `--radius-lg`: 24px
- `--radius-xl`: 32px

### Shadows
Three-tier shadow system for depth:
- Light: Subtle elevation
- Medium: Interactive elements
- Heavy: Prominent cards/modals

## Component Styling

### Navigation Bar
- Fixed positioning with glass background
- Active state indicators with subtle animations
- Responsive design for mobile

### Hero Section
- Gradient text for emphasis
- Floating card animations
- Stats display with clean typography

### Card Components
- Glass background with subtle borders
- Hover effects with elevation and glow
- Consistent spacing and typography
- Score badges with dynamic colors

### Dashboard
- Multi-column layout with side panel
- Interactive weight sliders
- Top candidate highlight with visual prominence
- Search and filter controls with glass effects

### Form Elements
- Glass-style inputs and buttons
- Clear visual feedback on interaction
- Accessible focus states
- Consistent sizing and spacing

## Interactive Elements

### Hover States
- Subtle elevation (2-4px upward movement)
- Enhanced glass effects
- Smooth transitions (0.3s ease)
- Shadow enhancement

### Button States
- Primary: Gradient background with shimmer effect
- Secondary: Glass background with accent border
- Hover: Enhanced shadow and slight scale
- Disabled: Reduced opacity with clear indication

### Loading States
- Smooth spinner animations
- Clear progress indicators
- Non-intrusive loading messages

## Responsive Design

### Breakpoints
1. **Desktop (1024px+)**: Full layout with side panels
2. **Tablet (768px-1024px)**: Adjusted layouts, simplified grids
3. **Mobile (<768px)**: Single column, stacked elements

### Mobile-First Features
- Flexible grid layouts
- Touch-friendly targets
- Simplified navigation
- Optimized typography scale

## Performance Considerations
- Minimal use of expensive CSS properties
- Optimized animations with `transform` and `opacity`
- Efficient glass effects with `backdrop-filter`
- CSS variable theming for easy updates

## Accessibility
- High contrast text
- Clear focus indicators
- Semantic HTML structure
- Screen reader friendly components
- Color combinations that meet WCAG AA standards

## Browser Support
- Modern browsers with `backdrop-filter` support
- Graceful degradation for older browsers
- Vendor prefixes for critical properties

## Usage Examples

```css
/* Apply glass effect */
.element {
  background: var(--glass-gradient);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

/* Create a glass card */
.card {
  composes: glass-card;
  padding: var(--space-xl);
}

/* Style a primary button */
.btn-primary {
  background: linear-gradient(135deg, var(--murray-accent) 0%, var(--murray-accent-dark) 100%);
  color: white;
  padding: var(--space-lg) var(--space-xxl);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-bold);
}
```

## File Structure
- `src/App.css`: Main theme and global styles
- `src/components/Components.css`: Component-specific styles
- `src/pages/Dashboard.css`: Dashboard page styles
- `src/index.css`: Base styles and font imports

This theme provides a modern, professional foundation for the AI recruiter application while maintaining excellent usability and visual appeal.