import AsyncStorage from "@react-native-async-storage/async-storage";

export type PendingReportData = Record<string, unknown>;

export type PendingReport = {
  id: string;
  data: PendingReportData;
};

const STORAGE_KEY = "mobile-app:pendingReports";

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const createId = (): string => {
  // robust genug für Offline-Queue; keine Kollisionen in normalem UI-Flow
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizePendingReports = (value: unknown): PendingReport[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PendingReport => {
    if (typeof item !== "object" || item === null) return false;
    const record = item as Record<string, unknown>;
    return typeof record.id === "string" && typeof record.data === "object" && record.data !== null;
  });
};

export const getPendingReports = async (): Promise<PendingReport[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  const parsed = safeJsonParse(raw);
  return normalizePendingReports(parsed);
};

export const savePendingReport = async (data: PendingReportData): Promise<void> => {
  const pendingReports = await getPendingReports();
  const next: PendingReport = { id: createId(), data };
  const updated = [...pendingReports, next];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const removePendingReport = async (id: string): Promise<void> => {
  const pendingReports = await getPendingReports();
  const updated = pendingReports.filter((item) => item.id !== id);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
