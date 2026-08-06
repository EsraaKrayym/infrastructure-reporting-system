import AsyncStorage from "@react-native-async-storage/async-storage";

export const PUSH_ENABLED_KEY = "settings:push";
export const LOCATION_ENABLED_KEY = "settings:location";

const toBool = (value: string | null, fallback: boolean): boolean => {
  if (value === null) return fallback;
  return value === "true";
};

export const getPushEnabled = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
  return toBool(raw, true);
};

export const setPushEnabled = async (enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(PUSH_ENABLED_KEY, String(enabled));
};

export const getLocationEnabled = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(LOCATION_ENABLED_KEY);
  return toBool(raw, true);
};

export const setLocationEnabled = async (enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(LOCATION_ENABLED_KEY, String(enabled));
};
