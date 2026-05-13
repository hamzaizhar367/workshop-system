"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";
import { workshopDataService } from "./workshop-data-service";

type Messages = typeof arMessages;
type Locale = "ar" | "en";

const dictionaries: Record<Locale, Messages> = {
  ar: arMessages,
  en: enMessages,
};

const localeDirections: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

type LanguageContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  isLanguageReady: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getMessage(messages: Messages, key: string) {
  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object" && part in value) {
      return (value as Record<string, unknown>)[part];
    }

    return undefined;
  }, messages);
}

function getStoredLocale() {
  const storedData = workshopDataService.loadAppData<{
    settings?: { defaultLanguage?: Locale };
  }>({});
  const storedLocale = storedData.settings?.defaultLanguage;

  return storedLocale === "en" || storedLocale === "ar" ? storedLocale : "en";
}

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);
  const isLanguageReady = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot,
  );

  const dir = localeDirections[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [dir, locale]);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      locale,
      dir,
      isLanguageReady,
      setLocale: setLocaleState,
      t: (key) => {
        const message = getMessage(dictionaries[locale], key);
        return typeof message === "string" ? message : key;
      },
    };
  }, [dir, isLanguageReady, locale]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
