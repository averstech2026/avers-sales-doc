import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { resolveAuthorName } from '../services/auth';
import {
  syncPersonalizationSettings,
  savePersonalizationSettings,
  type PersonalizationSettings,
} from '../services/personalizationSettings';
import {
  applyThemeColors,
  initPersonalization,
  loadCustomThemePresets,
  loadOrgSettings,
  type OrgSettings,
  type ThemeColors,
  type ThemePreset,
} from '../utils/personalization';

interface PersonalizationContextValue {
  themeColors: ThemeColors;
  orgSettings: OrgSettings;
  customPresets: ThemePreset[];
  loading: boolean;
  saving: boolean;
  error: string;
  setThemeColors: (colors: ThemeColors) => Promise<void>;
  setOrgSettings: (settings: OrgSettings) => Promise<void>;
  setCustomPresets: (presets: ThemePreset[]) => Promise<void>;
  savePersonalization: (patch: {
    theme?: ThemeColors;
    organization?: OrgSettings;
    customPresets?: ThemePreset[];
  }) => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextValue | null>(null);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const { user, firebaseReady } = useAuth();
  const [themeColors, setThemeColorsState] = useState<ThemeColors>(() => initPersonalization());
  const [orgSettings, setOrgSettingsState] = useState<OrgSettings>(() => loadOrgSettings());
  const [customPresets, setCustomPresetsState] = useState<ThemePreset[]>(() =>
    loadCustomThemePresets()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const stateRef = useRef<PersonalizationSettings>({
    theme: themeColors,
    organization: orgSettings,
    customPresets,
  });

  useEffect(() => {
    stateRef.current = {
      theme: themeColors,
      organization: orgSettings,
      customPresets,
    };
  }, [themeColors, orgSettings, customPresets]);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    void (async () => {
      try {
        const synced = await syncPersonalizationSettings({
          uid: user.uid,
          name: resolveAuthorName(user),
        });
        if (cancelled) return;
        applyThemeColors(synced.theme);
        setThemeColorsState(synced.theme);
        setOrgSettingsState(synced.organization);
        setCustomPresetsState(synced.customPresets);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Не удалось загрузить персонализацию из облака'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseReady, user]);

  const persist = useCallback(
    async (patch: {
      theme?: ThemeColors;
      organization?: OrgSettings;
      customPresets?: ThemePreset[];
    }) => {
      const next: PersonalizationSettings = {
        theme: patch.theme ?? stateRef.current.theme,
        organization: patch.organization ?? stateRef.current.organization,
        customPresets: patch.customPresets ?? stateRef.current.customPresets,
      };

      applyThemeColors(next.theme);
      setThemeColorsState(next.theme);
      setOrgSettingsState(next.organization);
      setCustomPresetsState(next.customPresets);
      stateRef.current = next;

      setSaving(true);
      setError('');
      try {
        await savePersonalizationSettings(next, {
          uid: user?.uid,
          name: user ? resolveAuthorName(user) : undefined,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Не удалось сохранить персонализацию в облако';
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  const setThemeColors = useCallback(
    async (colors: ThemeColors) => {
      await persist({ theme: colors });
    },
    [persist]
  );

  const setOrgSettings = useCallback(
    async (settings: OrgSettings) => {
      await persist({ organization: settings });
    },
    [persist]
  );

  const setCustomPresets = useCallback(
    async (presets: ThemePreset[]) => {
      await persist({ customPresets: presets });
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      themeColors,
      orgSettings,
      customPresets,
      loading,
      saving,
      error,
      setThemeColors,
      setOrgSettings,
      setCustomPresets,
      savePersonalization: persist,
    }),
    [
      themeColors,
      orgSettings,
      customPresets,
      loading,
      saving,
      error,
      setThemeColors,
      setOrgSettings,
      setCustomPresets,
      persist,
    ]
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
