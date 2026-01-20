'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  mobile?: boolean;
}

export default function ThemeToggle({ mobile = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`rounded-full hover:bg-accent transition-colors touch-manipulation ${
        mobile ? 'p-1' : 'p-2'
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className={`${mobile ? 'w-6 h-6' : 'w-5 h-5'} text-foreground`} />
      ) : (
        <Sun className={`${mobile ? 'w-6 h-6' : 'w-5 h-5'} text-foreground`} />
      )}
    </button>
  );
}
