import React, {createContext, useCallback, useEffect, useRef, useState} from "react";
import {getLatestState} from "~utils";
import {Llavav1634b} from "~libs/chatbot/perplexity/Llavav1634b";
import {KimiBot} from "~libs/chatbot/kimi";
import {CopilotBot} from "~libs/chatbot/copilot";
import ChatGPT35Turbo from "~libs/chatbot/openai/ChatGPT35Turbo";
import {Gemma7bIt} from "~libs/chatbot/perplexity/Gemma7bIt";
import {Mistral822b} from "~libs/chatbot/perplexity/Mistral822b";
import {Llama3SonarLarge32KChat} from "~libs/chatbot/perplexity/Llama3SonarLarge32KChat";
import {Storage} from "@plasmohq/storage";
import {Llama3SonarLarge32kOnline} from "~libs/chatbot/perplexity/Llama3SonarLarge32kOnline";
import {Claude3Haiku} from "~libs/chatbot/perplexity/Claude3Haiku";
import {Llama370bInstruct} from "~libs/chatbot/perplexity/Llama370bInstruct";
import  ChatGPT4Turbo from "~libs/chatbot/openai/ChatGPT4Turbo";
import {Logger} from "~utils/logger";
import ChatGPT4O from "~libs/chatbot/openai/ChatGPT4o";
import ArkoseGlobalSingleton from "~libs/chatbot/openai/Arkose";
// Custom OpenAI provider imports
import {CustomOpenAIBot} from "~libs/chatbot/custom-openai/CustomOpenAIBot";
import {getOrCreateCustomModelClass} from "~libs/chatbot/custom-openai/registry";
import {CUSTOM_PROVIDERS_STORAGE_KEY, type CustomProviderConfig} from "~libs/chatbot/custom-openai/types";
import IconOpenAI from "data-base64:~assets/simple-icons_openai.svg";

export type M = (
    typeof ChatGPT35Turbo
    | typeof CopilotBot
    | typeof KimiBot
    | typeof Gemma7bIt
    | typeof Llavav1634b
    | typeof Mistral822b
    | typeof Llama3SonarLarge32KChat
    | typeof Llama370bInstruct
    | typeof Claude3Haiku
    | typeof Llama3SonarLarge32kOnline
    | typeof ChatGPT4Turbo
    | typeof ChatGPT4O
    | typeof CustomOpenAIBot
    )

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

/** Base built-in model lists (without custom providers). */
const BUILTIN_ALL_MODELS: Ms = [Llama3SonarLarge32KChat, Llama3SonarLarge32kOnline, Claude3Haiku, ChatGPT35Turbo, ChatGPT4O, ChatGPT4Turbo, CopilotBot, KimiBot, Llama370bInstruct, Gemma7bIt, Llavav1634b, Mistral822b];

const BUILTIN_CATEGORY_MODELS: CMs = [
    {label: "OpenAI", models: [ChatGPT35Turbo, ChatGPT4Turbo, ChatGPT4O]},
    {label: "Microsoft", models: [CopilotBot]},
    {label: "Moonshot", models: [KimiBot]},
    {label: "Perplexity", models: [Llama3SonarLarge32KChat, Llama3SonarLarge32kOnline, Claude3Haiku, Llama370bInstruct, Gemma7bIt, Llavav1634b, Mistral822b]},
];

/**
 * Check if a model class is a custom (user-defined) OpenAI model.
 */
function isCustomModelClass(m: M): boolean {
    return (
        // instanceof check on prototype chain
        (m as any).prototype instanceof CustomOpenAIBot
        // fallback: check the constructor's base class name chain
        || (m as any)._providerConfigId
    );
}

/**
 * Read custom provider configs from storage and generate dynamic model classes,
 * returning the full combined lists (built-in + custom).
 */
async function buildCombinedModelLists(): Promise<{ allModels: Ms; categoryModels: CMs }> {
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

    const allModels: Ms = [...BUILTIN_ALL_MODELS, ...customModels];
    const categoryModels: CMs = [
        ...BUILTIN_CATEGORY_MODELS,
        ...(customModels.length > 0
            ? [{label: "Custom", models: customModels}]
            : []),
    ];

    return {allModels, categoryModels};
}

export default function ModelManagementProvider({children}) {
    const defaultModels: Ms = [ChatGPT35Turbo, CopilotBot, KimiBot];
    const [currentBots, setCurrentBots] = useState<IModelManagementProvider['currentBots']>(defaultModels);
    const allModels = useRef<Ms>([...BUILTIN_ALL_MODELS]);
    const storage = new Storage();
    const [isLoaded, setIsLoaded] = useState(false);
    const categoryModels = useRef<CMs>([...BUILTIN_CATEGORY_MODELS]);

    /** Reload custom models from storage and rebuild refs. */
    const refreshCustomModels = useCallback(async () => {
        const {allModels: combinedAll, categoryModels: combinedCategory} = await buildCombinedModelLists();

        // Preserve built-in entries, replace custom entries
        allModels.current = combinedAll;
        categoryModels.current = combinedCategory;

        // If currentBots contains a custom model that was removed, filter it out
        setCurrentBots(prev => prev.filter(m => combinedAll.includes(m)));

        Logger.log('Custom models refreshed:', combinedAll.length - BUILTIN_ALL_MODELS.length, 'custom models');
    }, []);

    const handleModelStorge = async () => {
        try {
            // First load custom models
            await refreshCustomModels();

            const value = await storage.get<string[]>("currentModelsKey");

            const arr: Ms = [];

            if (value && value.length) {
                Logger.log('local currentModels:',value);
                value.forEach((ele) => {
                    allModels.current.forEach((item) => {
                        if (item.botName === ele) {
                            arr.push(item);
                        }
                    });
                });

                if (arr.length) {
                    setCurrentBots(arr);
                }else {
                    setCurrentBots(defaultModels);
                }
            }
        }catch (e) {
            // ignore
        }
        finally {
            setIsLoaded(true);
        }
    };

    useEffect(()=>{
        void handleModelStorge();
        // init arkose
        void ArkoseGlobalSingleton.getInstance().loadArkoseScript();
    },[]);

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
        <ModelManagementContext.Provider value={{currentBots, allModels, categoryModels, setCurrentBots: setCurrentBots, saveCurrentBotsKeyLocal}}>
            {isLoaded && children}
        </ModelManagementContext.Provider>
    );
}
