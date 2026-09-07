'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type Appearance = 'day' | 'night';
type Recipe = 'ocean' | 'walnut';

interface ThemeContextValue {
  appearance: Appearance;
  toggleAppearance: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [appearance, setAppearance] = useState<Appearance>('day');
  const recipe: Recipe = pathname.startsWith('/docs') ? 'walnut' : 'ocean';

  const value = useMemo<ThemeContextValue>(() => ({
    appearance,
    toggleAppearance: () => setAppearance((current) => current === 'day' ? 'night' : 'day'),
  }), [appearance]);

  return (
    <ThemeContext.Provider value={value}>
      <div className="theme-boundary" data-recipe={recipe} data-appearance={appearance}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useThemeBoundary() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeBoundary must be used within ThemeBoundary');
  }

  return context;
}
