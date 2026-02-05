# Development Guide

## 🚀 Quick Start

```bash
# Install dependencies and start development
pnpm dev

# Format code
pnpm format

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check
```

## 🛠 Tools Setup

### Required VS Code Extensions
1. **Prettier** - Code formatting
2. **ESLint** - Code linting  
3. **Tailwind CSS IntelliSense** - Tailwind autocomplete
4. **Error Lens** - Inline error display
5. **Auto Rename Tag** - HTML/JSX tag renaming

### Development Workflow

1. **Code is automatically formatted on save** (Prettier)
2. **ESLint shows errors/warnings inline** 
3. **Tailwind classes are sorted automatically**
4. **TypeScript errors appear instantly**

## 📝 Code Standards

### Formatting
- **Prettier handles all formatting**
- Single quotes, semicolons, 2-space tabs
- Line width: 100 characters
- Tailwind classes are auto-sorted

### Linting Rules
- React hooks dependencies are checked
- Unused variables show warnings
- Console.log shows warnings (use console.warn/error instead)
- TypeScript strict mode enabled

### File Organization
```
src/
  components/       # Reusable UI components
    ui/            # shadcn/ui components
  pages/           # Route components
  hooks/           # Custom React hooks
  lib/             # Utilities and helpers
  services/        # API and business logic
  contexts/        # React contexts
```

## 🎨 Styling Guidelines

### Tailwind CSS
- Use utility classes for styling
- Custom colors available: `brand-pink`, `brand-magenta`, `gray-950`, etc.
- Forms automatically styled with `@tailwindcss/forms`
- Typography enhanced with `@tailwindcss/typography`

### Component Variants
```tsx
// Use clsx for conditional classes
import { clsx } from 'clsx';

const buttonClasses = clsx(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
);
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm format` - Format all code
- `pnpm format:check` - Check if code is formatted
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix auto-fixable ESLint issues
- `pnpm type-check` - Run TypeScript compiler

## 🚨 Before Committing

```bash
# Check everything is good
pnpm format && pnpm lint:fix && pnpm type-check
```

## 💡 Pro Tips

1. **Use Tailwind IntelliSense** - Autocomplete saves tons of time
2. **Enable format on save** - Never think about formatting again
3. **Use the Error Lens extension** - See errors inline instantly
4. **Organize imports** - VS Code will auto-organize on save
5. **Use TypeScript strictly** - Catch errors early

## 🔗 Useful Links

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Lucide Icons](https://lucide.dev/)