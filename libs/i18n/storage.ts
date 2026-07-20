import { Storage } from "@plasmohq/storage";
import type { Locale } from "./types";

const STORAGE_KEY = "easychatai_locale";

const storage = new Storage();

export async function getSavedLocale(): Promise<Locale | null> {
    return (await storage.get<Locale>(STORAGE_KEY)) || null;
}

export async function saveLocale(locale: Locale): Promise<void> {
    await storage.set(STORAGE_KEY, locale);
}
