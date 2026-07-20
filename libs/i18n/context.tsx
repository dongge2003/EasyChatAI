import React, { createContext, useCallback, useEffect, useState } from "react";
import type { Locale } from "./types";
import en from "./locales/en";
import zh from "./locales/zh";
import { getSavedLocale, saveLocale } from "./storage";

// ============ Interpolation Helper ============
function interpolate(template: string, params?: Record<string, string | number>): string {
    if (!params) return template;
    let result = template;
    for (const [key, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    }
    return result;
}

// ============ Type for translation function ============
export type TFunction = (key: string, params?: Record<string, string | number>) => string;

// ============ All locale data ============
const LOCALE_DATA: Record<Locale, Record<string, any>> = {
    en,
    zh,
};

// ============ Locale fallback key displaying ============
function resolveKey(data: Record<string, any>, key: string): string | undefined {
    // Fast path: key exists as-is (flat key like "header.title")
    if (key in data) {
        const val = data[key];
        return typeof val === "string" ? val : undefined;
    }
    // Fallback: dot-traversal (for potential future nested objects)
    const parts = key.split(".");
    let current: any = data;
    for (const part of parts) {
        if (current == null || typeof current !== "object") return undefined;
        current = current[part];
    }
    return typeof current === "string" ? current : undefined;
}

function createT(locale: Locale): TFunction {
    const data = LOCALE_DATA[locale];
    return (key: string, params?: Record<string, string | number>) => {
        const raw = resolveKey(data, key) || resolveKey(LOCALE_DATA.en, key) || key;
        return interpolate(raw, params);
    };
}

// ============ Context ============
interface ILocaleContext {
  locale: Locale;
  t: TFunction;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<ILocaleContext>({
    locale: "zh",
    t: createT("zh"),
    setLocale: () => {},
});

// ============ Provider ============
export function LocaleProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("zh");

    useEffect(() => {
        getSavedLocale().then((saved) => {
            if (saved) {
                setLocaleState(saved);
            }
        });
    }, []);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        saveLocale(newLocale);
    }, []);

    const t = createT(locale);

    return (
        <LocaleContext.Provider value={{ locale, t, setLocale }}>
            {children}
        </LocaleContext.Provider>
    );
}
