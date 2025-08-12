/**
 * Apex AI Platform - Universal Design System
 *
 * This style guide ensures consistent, professional styling across all pages
 * Based on the perfected CRM page design patterns - our new universal theme
 */

export const styleGuide = {
  // Brand Colors - Professional Gray Theme with Emerald Accents
  colors: {
    primary: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    accent: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981', // Emerald for accents only
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    background: {
      primary: '#111827', // Main dark background
      secondary: '#1f2937', // Card backgrounds
      tertiary: '#374151', // Hover states
      overlay: 'rgba(17, 24, 39, 0.95)', // Modal overlays
      glass: 'rgba(17, 24, 39, 0.5)', // Glass morphism
    },
    text: {
      primary: '#ffffff', // Main headings
      secondary: '#e5e7eb', // Body text
      tertiary: '#d1d5db', // Supporting text
      muted: '#9ca3af', // Placeholder text
      subtle: '#6b7280', // Disabled text
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },

  // Component Styles - Based on CRM Page Perfection
  components: {
    // Page container
    pageContainer: 'min-h-screen bg-gray-900 p-6',
    pageWrapper: 'max-w-7xl mx-auto',

    // Headers
    pageHeader: {
      container: 'bg-gradient-to-r from-gray-950 to-gray-900 shadow-lg',
      title: 'text-xl font-semibold text-white font-sans tracking-wide',
      subtitle: 'text-sm text-gray-400',
    },

    // Cards - CRM Style
    card: {
      base: 'bg-gray-900/50 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm',
      hover: 'hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-200',
      header: 'border-b border-gray-800/30 p-4',
      content: 'p-4',
      tile: 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600 transition-all cursor-pointer',
    },

    // Buttons - CRM Refined
    button: {
      primary:
        'bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200',
      secondary:
        'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 transition-all duration-200',
      outline:
        'border border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white text-xs transition-all',
      ghost: 'hover:bg-gray-800/30 text-gray-300 hover:text-white transition-all duration-200',
      danger: 'bg-red-600 hover:bg-red-700 text-white transition-all duration-200',
      filter: 'bg-gray-700 hover:bg-gray-600 text-white h-6 px-2 text-xs',
    },

    // Inputs - CRM Style
    input: {
      base: 'bg-gray-800/50 border border-gray-700/50 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-0 transition-all duration-200',
      search: 'pl-8 h-8 text-xs bg-gray-800/50 border-gray-700/50',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      disabled: 'bg-gray-800 text-gray-500 cursor-not-allowed',
    },

    // Badges
    badge: {
      default: 'bg-gray-800 text-gray-300 border border-gray-700',
      success: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
      warning: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
      error: 'bg-red-600/20 text-red-400 border-red-600/30',
      info: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    },

    // Stats cards
    statsCard: {
      container: 'bg-gray-800/50 border-gray-700',
      header: 'flex flex-row items-center justify-between pb-2',
      title: 'text-sm font-medium text-gray-300',
      value: 'text-2xl font-bold text-white',
      subtitle: 'text-xs text-gray-400 mt-1',
      icon: {
        wrapper: 'h-4 w-4 text-gray-300',
        background: {
          emerald: 'bg-emerald-500/20',
          blue: 'bg-blue-500/20',
          purple: 'bg-purple-500/20',
          yellow: 'bg-yellow-500/20',
          red: 'bg-red-500/20',
        },
      },
    },

    // Tables - CRM Enhanced
    table: {
      container: 'overflow-x-auto bg-gray-900/50 rounded-lg border border-gray-700',
      base: 'w-full',
      header:
        'sticky top-0 z-10 bg-gradient-to-r from-gray-800/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-700',
      headerCell: 'px-4 py-4 text-left font-medium text-gray-200 text-sm',
      row: 'transition-all text-xs hover:bg-gray-800/30 border-b border-gray-800/30',
      cell: 'px-4 py-3 text-gray-200 text-xs',
      rowSpacing: 'border-separate border-spacing-y-1',
    },

    // Modals/Dialogs
    dialog: {
      content: 'bg-gray-900 border-gray-800 text-white',
      header: 'border-b border-gray-800',
      footer: 'border-t border-gray-800 bg-gray-900/50',
    },

    // Charts
    chart: {
      container: 'bg-gray-900 border-gray-800',
      tooltip: {
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
      },
      colors: {
        primary: '#8b5cf6',
        secondary: '#10b981',
        tertiary: '#3b82f6',
        quaternary: '#f59e0b',
      },
    },

    // Navigation - CRM Style
    navigation: {
      item: 'flex items-center rounded-xl text-sm font-medium group relative overflow-hidden transition-all duration-300 ease-out',
      active:
        'bg-gradient-to-r from-gray-700/30 to-gray-800/30 text-white shadow-lg border border-gray-600/40',
      inactive:
        'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow-md hover:border-gray-600/50 border border-transparent',
    },

    // Dropdowns - CRM Enhanced
    dropdown: {
      content: 'bg-gray-900/95 border-gray-700/50 shadow-2xl backdrop-blur-sm',
      item: 'text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200',
      trigger:
        'border border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white text-xs transition-all',
    },

    // Notifications - CRM Enhanced
    notification: {
      container: 'w-96 p-0 bg-gray-900/95 border-gray-700/50 shadow-2xl backdrop-blur-sm',
      header: 'p-4 border-b border-gray-800/30',
      item: 'p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-gray-800/30 hover:border-gray-600/50',
      unread: 'bg-gray-800/20 border-gray-700/30',
      read: 'bg-transparent border-gray-800/30',
    },

    // Filters - CRM Style
    filter: {
      sidebar:
        'bg-gray-900/50 rounded-lg border border-gray-700 h-[calc(100vh-140px)] overflow-y-auto',
      label: 'text-gray-200 text-sm',
      section: 'space-y-4 p-4',
    },
  },

  // Animations
  animations: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
  },

  // Spacing
  spacing: {
    page: 'space-y-6',
    section: 'space-y-8',
    card: 'space-y-6',
    compact: 'p-4',
    form: 'space-y-4',
    tight: 'space-y-2',
  },

  // Typography - CRM Professional Style
  typography: {
    h1: 'text-xl font-semibold text-white font-sans tracking-wide', // Page headers
    h2: 'text-lg font-semibold text-white', // Section headers
    h3: 'text-base font-medium text-white', // Card headers
    h4: 'text-sm font-medium text-white', // Sub-headers
    h5: 'text-sm font-medium text-gray-200', // Labels
    body: 'text-sm text-gray-200', // Body text
    small: 'text-xs text-gray-400', // Small text
    muted: 'text-xs text-gray-500', // Muted text
    label: 'text-sm font-medium text-gray-200', // Form labels
    tableCell: 'text-xs text-gray-200', // Table content
  },

  // Gradients
  gradients: {
    primary: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
    dark: 'bg-gradient-to-br from-gray-950 via-black to-gray-950',
    card: 'bg-gradient-to-br from-gray-900 to-gray-800',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    danger: 'bg-gradient-to-r from-red-500 to-red-600',
  },

  // Shadows
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    inner: 'shadow-inner',
    emerald: 'shadow-emerald-600/20',
  },

  // Borders
  borders: {
    radius: {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },

  // Layout
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-8 sm:py-12',
    grid: {
      cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
      cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    },
  },

  // Utility Classes
  utils: {
    centerFlex: 'flex items-center justify-center',
    betweenFlex: 'flex items-center justify-between',
    glass: 'backdrop-blur-sm bg-gray-900/50',
    glow: {
      emerald: 'shadow-lg shadow-emerald-600/20',
      gray: 'shadow-lg shadow-gray-600/20',
    },
  },
};

// Helper function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Common component combinations
export const commonStyles = {
  primaryButton: cn(styleGuide.components.button.primary, 'rounded-lg px-4 py-2 font-medium'),
  secondaryButton: cn(styleGuide.components.button.secondary, 'rounded-lg px-4 py-2 font-medium'),
  statsCard: cn(styleGuide.components.statsCard.container, 'rounded-lg'),
  pageTitle: cn(styleGuide.typography.h1, 'mb-2'),
  cardTitle: cn(styleGuide.typography.h3, 'mb-1'),
};

// Preset component combinations - CRM Universal Theme
export const presets = {
  // Headers
  pageHeader: cn(styleGuide.typography.h1, 'mb-2'),
  sectionHeader: cn(styleGuide.typography.h2, 'mb-4'),
  cardTitle: cn(styleGuide.typography.h3, 'mb-2'),

  // Buttons
  primaryButton: styleGuide.components.button.primary,
  secondaryButton: styleGuide.components.button.secondary,
  outlineButton: styleGuide.components.button.outline,
  filterButton: styleGuide.components.button.filter,

  // Inputs
  formInput: styleGuide.components.input.base,
  searchInput: styleGuide.components.input.search,

  // Cards
  dataCard: styleGuide.components.card.base,
  tileCard: styleGuide.components.card.tile,

  // Tables
  dataTable: styleGuide.components.table.container,
  tableHeader: styleGuide.components.table.header,
  tableRow: styleGuide.components.table.row,

  // Navigation
  navItem: styleGuide.components.navigation.item,
  navActive: styleGuide.components.navigation.active,

  // Dropdowns
  dropdown: styleGuide.components.dropdown.content,
  dropdownTrigger: styleGuide.components.dropdown.trigger,

  // Notifications
  notificationPanel: styleGuide.components.notification.container,
  notificationItem: styleGuide.components.notification.item,

  // Filters
  filterSidebar: styleGuide.components.filter.sidebar,
  filterLabel: styleGuide.components.filter.label,

  // Badges
  successBadge: styleGuide.components.badge.success,
  errorBadge: styleGuide.components.badge.error,

  // Layout
  pageContainer: cn(styleGuide.components.pageContainer),
};
