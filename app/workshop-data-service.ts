const demoDataStorageKey = "car-dc9-demo-data-v1";
const activeSectionSessionStorageKey = "car-dc9-active-section-v1";

type StorageSaveResult = {
  ok: boolean;
  error?: "quotaExceeded" | "unavailable" | "unknown";
};

type BackupPayload<T> = {
  app: "CAR DC9";
  schema: "car-dc9-localstorage-backup";
  version: number;
  exportedAt: string;
  storageKey: string;
  data: T;
};

type BackupParseResult<T> =
  | {
      ok: true;
      data: T;
      metadata: Omit<BackupPayload<T>, "data">;
    }
  | {
      ok: false;
      error: "invalidJson" | "invalidBackup";
    };

const canUseBrowserStorage = () => typeof window !== "undefined";
const backupSchemaVersion = 1;

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

const getStorageErrorType = (error: unknown): StorageSaveResult["error"] => {
  if (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  ) {
    return "quotaExceeded";
  }

  return "unknown";
};

const writeLocalValue = (key: string, value: unknown): StorageSaveResult => {
  if (!canUseBrowserStorage()) {
    return { ok: false, error: "unavailable" };
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getStorageErrorType(error) };
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

const padDatePart = (value: number) => String(value).padStart(2, "0");

const getBackupTimestamp = (date = new Date()) =>
  [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
  ].join("-");

const getBackupFilename = (date = new Date()) =>
  `car-dc9-backup-${getBackupTimestamp(date)}.json`;

const createBackupPayload = <T,>(data: T, date = new Date()): BackupPayload<T> => ({
  app: "CAR DC9",
  schema: "car-dc9-localstorage-backup",
  version: backupSchemaVersion,
  exportedAt: date.toISOString(),
  storageKey: demoDataStorageKey,
  data,
});

const serializeBackup = <T,>(data: T) =>
  JSON.stringify(createBackupPayload(data), null, 2);

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const parseBackup = <T,>(
  value: string,
  requiredDataKeys: string[],
): BackupParseResult<T> => {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(value);
  } catch {
    return { ok: false, error: "invalidJson" };
  }

  if (!isObjectRecord(parsedValue)) {
    return { ok: false, error: "invalidBackup" };
  }

  const data = parsedValue.data;
  const isValidMetadata =
    parsedValue.app === "CAR DC9" &&
    parsedValue.schema === "car-dc9-localstorage-backup" &&
    parsedValue.storageKey === demoDataStorageKey &&
    typeof parsedValue.version === "number" &&
    typeof parsedValue.exportedAt === "string";

  if (!isValidMetadata || !isObjectRecord(data)) {
    return { ok: false, error: "invalidBackup" };
  }

  const hasRequiredData = requiredDataKeys.every((key) =>
    Object.prototype.hasOwnProperty.call(data, key),
  );

  if (!hasRequiredData) {
    return { ok: false, error: "invalidBackup" };
  }

  return {
    ok: true,
    data: data as T,
    metadata: {
      app: "CAR DC9",
      schema: "car-dc9-localstorage-backup",
      version: Number(parsedValue.version),
      exportedAt: String(parsedValue.exportedAt),
      storageKey: demoDataStorageKey,
    },
  };
};

const downloadTextFile = (
  content: string,
  filename: string,
  mimeType = "application/json",
) => {
  if (!canUseBrowserStorage()) {
    return false;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);

  return true;
};

export const workshopDataService = {
  canUseBrowser: canUseBrowserStorage,
  createRecordId: () => Date.now(),
  storageKey: demoDataStorageKey,
  loadAppData: <T,>(fallback: T) =>
    readLocalValue<Partial<T>>(demoDataStorageKey, fallback as Partial<T>),
  saveAppData: <T,>(data: T) => writeLocalValue(demoDataStorageKey, data),
  createBackupPayload,
  getBackupFilename,
  parseBackup,
  serializeBackup,
  downloadTextFile,
  clearAppData: () => removeLocalValue(demoDataStorageKey),
  loadActiveSection: <T extends string>(fallback: T) =>
    readSessionValue<T>(activeSectionSessionStorageKey, fallback),
  saveActiveSection: (section: string) =>
    writeSessionValue(activeSectionSessionStorageKey, section),
};
