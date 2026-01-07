'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Add transitioning class BEFORE making the change to ensure all elements are ready
    root.classList.add('theme-transitioning');
    
    // Force a synchronous layout calculation to ensure all elements are ready
    // This ensures all elements have the transition styles applied before the change
    root.offsetHeight; // Trigger reflow
    
    // Use requestAnimationFrame to batch the DOM changes in a single frame
    requestAnimationFrame(() => {
      // Apply theme change in the next frame to ensure smooth transition
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      root.style.colorScheme = newTheme;
      
      // Remove transitioning class after transition completes (200ms)
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 200);
    });
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    handleSetTheme(newTheme);
  };

  // Provide default context value even before mount
  const contextValue: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    toggleTheme,
  };

  // Always provide context, even before mount
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a default context if not within provider (for SSR/edge cases)
    return {
      theme: 'light' as Theme,
      setTheme: (theme: Theme) => {
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          if (theme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          root.style.colorScheme = theme;
          localStorage.setItem('theme', theme);
        }
      },
      toggleTheme: () => {
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          const isDark = root.classList.contains('dark');
          if (isDark) {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
            localStorage.setItem('theme', 'light');
          } else {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
            localStorage.setItem('theme', 'dark');
          }
        }
      },
    };
  }
  return context;
}
