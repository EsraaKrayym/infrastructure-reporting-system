/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();

  // `useColorScheme()` kann in den Typen null/unspecified enthalten.
  // Wir mappen das robust auf die Keys, die garantiert existieren.
  const themeKey = scheme === "dark" ? "dark" : "light";

  return themeKey === "dark" ? Colors.dark : Colors.light;
}
