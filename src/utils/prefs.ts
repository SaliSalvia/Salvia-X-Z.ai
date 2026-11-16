const PREFIX = 'salix_prefs:';

export const PREF_KEYS = {
  DESKTOP: 'desktop_mode',
  IMMERSIVE: 'immersive',
  PANEL_EXPANDED: 'panel_expanded',
} as const;

export function readPref(key: string, fallback = false): boolean {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(PREFIX + key, String(value));
  } catch {
    // ignore storage errors
  }
}

export function clearAllPrefs(): void {
  try {
    Object.values(PREF_KEYS).forEach((k) => {
      window.localStorage.removeItem(PREFIX + k);
    });
  } catch {
    // ignore storage errors
  }
}
