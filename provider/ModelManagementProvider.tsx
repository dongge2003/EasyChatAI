import React, {createContext, useCallback, useEffect, useRef, useState} from "react";
import {getLatestState} from "~utils";
import {Storage} from "@plasmohq/storage";
import {Logger} from "~utils/logger";
// Custom OpenAI provider imports
import {CustomOpenAIBot} from "~libs/chatbot/custom-openai/CustomOpenAIBot";
import {getOrCreateCustomModelClass} from "~libs/chatbot/custom-openai/registry";
import {CUSTOM_PROVIDERS_STORAGE_KEY, type CustomProviderConfig} from "~libs/chatbot/custom-openai/types";
import IconOpenAI from "data-base64:~assets/simple-icons_openai.svg";

export type M = typeof CustomOpenAIBot;

export type Ms = M[]

export interface CMsItem {
    label: string;
    models: M[];
}
export type CMs = CMsItem[]

interface IModelManagementProvider {
    currentBots: Ms;
    setCurrentBots: React.Dispatch<React.SetStateAction<Ms>>;
    allModels: React.MutableRefObject<Ms>;
    categoryModels: React.MutableRefObject<CMs>;
    saveCurrentBotsKeyLocal: () => void;
}

export const ModelManagementContext = createContext({} as IModelManagementProvider);

/**
 * Read custom provider configs from storage and generate dynamic model classes,
 * returning the full combined lists.
 */
async function buildModelLists(): Promise<{ allModels: Ms; categoryModels: CMs }> {
    const storage = new Storage();
    const providers = (await storage.get<CustomProviderConfig[]>(CUSTOM_PROVIDERS_STORAGE_KEY)) || [];

    const customModels: M[] = [];

    for (const provider of providers) {
        if (!provider.enabledModels?.length) continue;
        for (const modelName of provider.enabledModels) {
            const cls = getOrCreateCustomModelClass(provider, modelName, IconOpenAI);
            customModels.push(cls as unknown as M);
        }
    }

    const categoryModels: CMs = customModels.length > 0
        ? [{label: "Custom Provider", models: customModels}]
        : [];

    return {allModels: customModels, categoryModels};
}

export default function ModelManagementProvider({children}) {
    const defaultModels: Ms = [];
    const [currentBots, setCurrentBots] = useState<Ms>(defaultModels);
    const allModels = useRef<Ms>([]);
    const storage = new Storage();
    const [isLoaded, setIsLoaded] = useState(false);
    const categoryModels = useRef<CMs>([]);

    /** Reload custom models from storage and rebuild refs. */
    const refreshCustomModels = useCallback(async () => {
        const {allModels: combinedAll, categoryModels: combinedCategory} = await buildModelLists();

        allModels.current = combinedAll;
        categoryModels.current = combinedCategory;

        // If currentBots contains a custom model that was removed, filter it out
        setCurrentBots(prev => {
            const filtered = prev.filter(m => combinedAll.includes(m));
            // Fall back to first available model if the selected one was removed
            if (filtered.length === 0 && combinedAll.length > 0) {
                return [combinedAll[0]];
            }
            return filtered;
        });

        Logger.log('Custom models refreshed:', combinedAll.length, 'models');
    }, []);

    const handleModelStorge = async () => {
        try {
            // First load custom models
            await refreshCustomModels();

            const value = await storage.get<string[]>("currentModelsKey");

            const arr: Ms = [];

            if (value && value.length) {
                Logger.log('local currentModels:', value);
                value.forEach((ele) => {
                    allModels.current.forEach((item) => {
                        if (item.botName === ele) {
                            arr.push(item);
                        }
                    });
                });

                if (arr.length) {
                    // Single-model: only use the first resolved model
                    // (handles backward compatibility with old multi-model storage)
                    setCurrentBots([arr[0]]);
                } else {
                    setCurrentBots(defaultModels);
                }
            }
        } catch (e) {
            // ignore
        } finally {
            setIsLoaded(true);
        }
    };

    useEffect(() => {
        void handleModelStorge();
    }, []);

    // Listen for storage changes from other extension contexts (e.g. options page)
    useEffect(() => {
        const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
            if (area === 'local' && changes[CUSTOM_PROVIDERS_STORAGE_KEY]) {
                Logger.log('Custom providers changed in storage, refreshing models...');
                void refreshCustomModels();
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, [refreshCustomModels]);

    const getCurrentModelKey = async () => {
        const cbots: Ms = await getLatestState(setCurrentBots);
        return cbots.map(model => model.botName);
    };

    const saveCurrentBotsKeyLocal = async () => {
        void storage.set("currentModelsKey", await getCurrentModelKey());
        Logger.log('s-get', storage.get("currentModelsKey"));
    };

    return (
        <ModelManagementContext.Provider value={{
            currentBots,
            allModels,
            categoryModels,
            setCurrentBots: setCurrentBots,
            saveCurrentBotsKeyLocal
        }}>
            {isLoaded && children}
        </ModelManagementContext.Provider>
    );
}
