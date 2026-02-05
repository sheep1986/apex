# Trinity Labs AI - Design System & Brand Guidelines

## Overview

Trinity Labs AI is a sophisticated calling platform with a dark, professional aesthetic that emphasizes clarity, efficiency, and modern design principles. The design system is built around glassmorphism effects, emerald accent colors, and smooth interactions that create a premium enterprise experience.

## Brand Identity

### Core Values
- **Professional Excellence**: Clean, sophisticated interface design
- **Cutting-Edge Technology**: Modern glassmorphism and blur effects
- **User Efficiency**: Streamlined workflows and intuitive interactions
- **Enterprise Trust**: Dark theme with professional typography

### Design Philosophy
The Trinity Labs AI design system follows principles of:
- **Clarity over decoration**: Clean, functional interfaces
- **Consistency**: Unified patterns across all components
- **Accessibility**: High contrast and readable typography
- **Performance**: Smooth 60fps animations and transitions

## Color Palette

### Primary Colors
```css
/* Background Colors */
--trinity-bg-primary: #111111;           /* Primary dark background */
--trinity-bg-secondary: #1a1a1a;         /* Secondary dark background */
--trinity-bg-tertiary: rgb(26, 26, 26);  /* Tertiary background (gray-900) */

/* Surface Colors */
--trinity-surface-gradient: linear-gradient(135deg, #111111 0%, #1a1a1a 100%);
--trinity-glass: rgba(255, 255, 255, 0.02);
--trinity-surface-elevated: rgba(55, 65, 81, 0.3);  /* hover states */
--trinity-surface-pressed: rgba(55, 65, 81, 0.5);   /* active states */
```

### Accent Colors
```css
/* Emerald Theme */
--trinity-accent-primary: #10b981;       /* Emerald-500 */
--trinity-accent-light: #34d399;         /* Emerald-400 */
--trinity-accent-dark: #059669;          /* Emerald-600 */
--trinity-accent-subtle: rgba(16, 185, 129, 0.1);  /* Backgrounds */
--trinity-accent-border: rgba(16, 185, 129, 0.3);  /* Borders */

/* Secondary Accents */
--trinity-blue-accent: #3b82f6;          /* Blue-500 for variety */
--trinity-purple-accent: #8b5cf6;        /* Purple-500 for variety */
```

### Status Colors
```css
/* Status Indicators */
--trinity-status-new: #6b7280;           /* Gray-500 */
--trinity-status-contacted: #3b82f6;     /* Blue-500 */
--trinity-status-interested: #f59e0b;    /* Amber-500 */
--trinity-status-qualified: #10b981;     /* Emerald-500 */
--trinity-status-converted: #22c55e;     /* Green-500 */
--trinity-status-unqualified: #ef4444;   /* Red-500 */
```

### Text Colors
```css
/* Typography Colors */
--trinity-text-primary: #ffffff;         /* Primary white text */
--trinity-text-secondary: rgba(255, 255, 255, 0.7);  /* Secondary text */
--trinity-text-tertiary: rgba(255, 255, 255, 0.5);   /* Muted text */
--trinity-text-disabled: rgba(255, 255, 255, 0.3);   /* Disabled text */
```

### Border & Divider Colors
```css
/* Borders */
--trinity-border-primary: rgba(255, 255, 255, 0.1);
--trinity-border-secondary: rgba(255, 255, 255, 0.05);
--trinity-border-accent: rgba(16, 185, 129, 0.3);
```

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

### Font Scale
```css
/* Headings */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }     /* 24px */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }  /* 20px */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* 18px */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }    /* 16px */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* 14px */
.text-xs { font-size: 0.75rem; line-height: 1rem; }     /* 12px */

/* Micro Text */
.text-10px { font-size: 10px; line-height: 1.2; }       /* 10px */
```

### Font Weights
```css
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

## Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(to right, #059669, #10b981);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: linear-gradient(to right, #047857, #059669);
  transform: translateY(-1px);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(55, 65, 81, 0.8);
  color: white;
}
```

### Cards
```css
.card {
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(55, 65, 81, 0.5);
  border-radius: 0.75rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  background: rgba(55, 65, 81, 0.5);
  border-color: rgba(55, 65, 81, 1);
  transform: translateY(-2px);
}
```

### Tables
```css
.table-header {
  background: rgb(26, 26, 26);
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-row {
  border-bottom: 1px solid rgba(55, 65, 81, 0.3);
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: rgba(55, 65, 81, 0.3);
}
```

### Badges
```css
.badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Status Badges */
.badge-qualified {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-interested {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
```

### Form Controls

#### Input Fields
```css
.input {
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(55, 65, 81, 0.5);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  color: white;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  outline: none;
}
```

#### Dropdowns
```css
.dropdown {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
}

.dropdown-item {
  padding: 0.375rem 0.625rem;
  font-size: 0.625rem;
  color: #e2e8f0;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: #374151;
  color: #10b981;
  transform: translateX(2px);
}
```

## Layout System

### Grid & Spacing
```css
/* Standard spacing scale */
.space-1 { gap: 0.25rem; }    /* 4px */
.space-2 { gap: 0.5rem; }     /* 8px */
.space-3 { gap: 0.75rem; }    /* 12px */
.space-4 { gap: 1rem; }       /* 16px */
.space-6 { gap: 1.5rem; }     /* 24px */
.space-8 { gap: 2rem; }       /* 32px */

/* Padding scale */
.p-2 { padding: 0.5rem; }     /* 8px */
.p-3 { padding: 0.75rem; }    /* 12px */
.p-4 { padding: 1rem; }       /* 16px */
.p-6 { padding: 1.5rem; }     /* 24px */
```

### Breakpoints
```css
/* Mobile First Responsive Design */
.sm   { min-width: 640px; }   /* Small devices */
.md   { min-width: 768px; }   /* Medium devices */
.lg   { min-width: 1024px; }  /* Large devices */
.xl   { min-width: 1280px; }  /* Extra large devices */
.2xl  { min-width: 1536px; }  /* 2X large devices */
```

## Animations & Transitions

### Standard Timing Functions
```css
/* Easing curves */
.ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }

/* Duration scale */
.duration-150 { transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }
.duration-300 { transition-duration: 300ms; }
.duration-500 { transition-duration: 500ms; }
```

### Common Animations
```css
/* Hover effects */
.hover-lift {
  transition: transform 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Scale effects */
.hover-scale {
  transition: transform 0.2s ease;
}
.hover-scale:hover {
  transform: scale(1.05);
}

/* Fade effects */
.fade-in {
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}
```

## Icon System

### Icon Library
- **Primary**: Lucide React icons
- **Size Scale**: 
  - `w-3 h-3` (12px) - Small UI elements
  - `w-4 h-4` (16px) - Standard buttons and labels
  - `w-5 h-5` (20px) - Prominent buttons
  - `w-6 h-6` (24px) - Headers and important actions

### Icon Colors
```css
.icon-primary { color: #ffffff; }              /* White */
.icon-secondary { color: rgba(255, 255, 255, 0.7); }  /* Gray */
.icon-accent { color: #10b981; }               /* Emerald */
.icon-muted { color: rgba(255, 255, 255, 0.5); }      /* Muted */
```

## Glassmorphism Effects

### Background Blur
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-strong {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

## Interactive States

### Hover States
```css
/* Button hover */
button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Table row hover */
.table-row:hover {
  background: rgba(55, 65, 81, 0.3);
}

/* Card hover */
.card:hover {
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
}
```

### Active States
```css
/* Button active */
button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Input focus */
input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
```

### Loading States
```css
.loading {
  opacity: 0.7;
  pointer-events: none;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## Accessibility Guidelines

### Contrast Ratios
- **Text on dark backgrounds**: Minimum 4.5:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio
- **Focus indicators**: Visible and high contrast

### Focus Management
```css
.focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
.focus\:outline-none:focus {
  outline: none;
}
```

### Screen Reader Support
- All interactive elements have proper ARIA labels
- Tables include proper headers and captions
- Form controls have associated labels

## Performance Guidelines

### Animation Performance
- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly for complex animations

### Optimization
```css
/* Hardware acceleration */
.accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* Efficient transitions */
.efficient-transition {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
```

## Usage Examples

### CRM Table Header
```jsx
<th className="px-4 py-3 text-left whitespace-nowrap transition-all duration-300 ease-out relative bg-gray-900 cursor-move hover:bg-gray-800/50">
  <div className="flex items-center justify-between relative z-10">
    <div className="flex items-center group">
      <Grid3X3 className="w-3.5 h-3.5 mr-2 text-gray-500 group-hover:text-emerald-400 transition-all duration-300" />
      <span className="text-sm font-semibold text-white">Column Title</span>
    </div>
  </div>
</th>
```

### Status Badge
```jsx
<Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-xs py-0.5 px-2">
  <CheckCircle className="w-2.5 h-2.5 mr-1" />
  Qualified
</Badge>
```

### Action Button
```jsx
<Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs transition-all hover:scale-105">
  <Plus className="w-4 h-4 mr-2" />
  Create Lead
</Button>
```

## Brand Voice & Messaging

### Tone
- **Professional**: Clear, direct communication
- **Confident**: Assertive without being aggressive
- **Helpful**: Supportive and solution-oriented
- **Modern**: Contemporary language and terminology

### Messaging Hierarchy
1. **Primary**: Action-oriented calls to action
2. **Secondary**: Descriptive and informational text
3. **Tertiary**: Supporting details and metadata

## Implementation Notes

### CSS Custom Properties
Always use CSS custom properties for colors to maintain consistency and enable theming:

```css
:root {
  --trinity-accent: #10b981;
  --trinity-bg: #111111;
  --trinity-text: #ffffff;
}
```

### Component Naming
Follow BEM methodology for CSS classes:
```css
.trinity-button { }
.trinity-button--primary { }
.trinity-button--secondary { }
.trinity-button__icon { }
```

### Responsive Design
Mobile-first approach with progressive enhancement:
```css
/* Mobile default */
.component { }

/* Tablet and up */
@media (min-width: 768px) { }

/* Desktop and up */
@media (min-width: 1024px) { }
```

---

*This design system serves as the foundation for all Trinity Labs AI interfaces, ensuring consistency, accessibility, and professional excellence across the platform.*