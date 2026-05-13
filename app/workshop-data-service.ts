const demoDataStorageKey = "car-dc9-demo-data-v1";
const activeSectionSessionStorageKey = "car-dc9-active-section-v1";

const canUseBrowserStorage = () => typeof window !== "undefined";

const safeParseJson = <T,>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readLocalValue = <T,>(key: string, fallback: T): T => {
  if (!canUseBrowserStorage()) {
    return fallback;
  }

  return safeParseJson(window.localStorage.getItem(key), fallback);
};

const writeLocalValue = (key: string, value: unknown) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Offline persistence must not block the current in-memory workflow.
  }
};

const removeLocalValue = (key: string) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in demo/offline-prep mode.
  }
};

const readSessionValue = <T,>(key: string, fallback: T): T => {
  if (!canUseBrowserStorage()) {
    return fallback;
  }

  return safeParseJson(window.sessionStorage.getItem(key), fallback);
};

const writeSessionValue = (key: string, value: unknown) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session navigation persistence should never block the app.
  }
};

export const workshopDataService = {
  canUseBrowser: canUseBrowserStorage,
  createRecordId: () => Date.now(),
  loadAppData: <T,>(fallback: T) =>
    readLocalValue<Partial<T>>(demoDataStorageKey, fallback as Partial<T>),
  saveAppData: <T,>(data: T) => writeLocalValue(demoDataStorageKey, data),
  clearAppData: () => removeLocalValue(demoDataStorageKey),
  loadActiveSection: <T extends string>(fallback: T) =>
    readSessionValue<T>(activeSectionSessionStorageKey, fallback),
  saveActiveSection: (section: string) =>
    writeSessionValue(activeSectionSessionStorageKey, section),
};
