export const THEME_KEY = 'wangs-canteen.theme'
export type ThemePreference = 'system' | 'light' | 'dark'
export function parseTheme(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}
export function resolveTheme(preference: ThemePreference, systemDark: boolean): boolean {
  return preference === 'dark' || (preference === 'system' && systemDark)
}
