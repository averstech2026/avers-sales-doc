import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  initPersonalization,
  saveThemeColors,
  type ThemeColors,
} from '../utils/personalization';

interface PersonalizationContextValue {
  themeColors: ThemeColors;
  setThemeColors: (colors: ThemeColors) => void;
}

const PersonalizationContext = createContext<PersonalizationContextValue | null>(null);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => initPersonalization(), []);
  const [themeColors, setThemeColorsState] = useState<ThemeColors>(initial);

  const setThemeColors = useCallback((colors: ThemeColors) => {
    saveThemeColors(colors);
    setThemeColorsState(colors);
  }, []);

  const value = useMemo(
    () => ({
      themeColors,
      setThemeColors,
    }),
    [themeColors, setThemeColors]
  );

  return (
    <PersonalizationContext.Provider value={value}>{children}</PersonalizationContext.Provider>
  );
}

export function usePersonalization(): PersonalizationContextValue {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) {
    throw new Error('usePersonalization must be used within PersonalizationProvider');
  }
  return ctx;
}
