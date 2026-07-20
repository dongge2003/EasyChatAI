import {CustomOpenAIBot} from "~libs/chatbot/custom-openai/CustomOpenAIBot";
import type {CustomProviderConfig} from "~libs/chatbot/custom-openai/types";

/**
 * Cache of dynamically generated custom-model classes.
 * Key format: `${providerConfigId}:${modelName}`
 */
const modelClassCache = new Map<string, typeof CustomOpenAIBot>();

/**
 * Get or create a unique subclass of CustomOpenAIBot for a given
 * provider config + model name combination.
 */
export function getOrCreateCustomModelClass(
    providerConfig: CustomProviderConfig,
    modelName: string,
    logoSrc: string,
): typeof CustomOpenAIBot {
    const key = `${providerConfig.id}:${modelName}`;
    const cached = modelClassCache.get(key);
    if (cached) return cached;

    const displayName = `${providerConfig.name} - ${modelName}`;

    const GeneratedClass = class extends CustomOpenAIBot {
        static _providerConfigId = providerConfig.id;
        static _modelNameForCompletion = modelName;
        static botName = displayName;
        static logoSrc = logoSrc;
        static desc = `自定义 OpenAI 兼容模型 / Custom OpenAI-compatible model via "${providerConfig.name}"`;
        static requireLogin = false;
        static maxTokenLimit = 128 * 1000;
        static supportUploadPDF = false;
        static supportUploadImage = true;
        static paidModel = false;
        static newModel = false;
        static loginUrl = '';
    };

    // Make the generated class name more readable for debugging
    Object.defineProperty(GeneratedClass, 'name', {
        value: `CustomModel_${providerConfig.id.slice(0, 6)}_${modelName.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });

    modelClassCache.set(key, GeneratedClass);
    return GeneratedClass;
}

/**
 * Get all cached custom model classes for a given provider config.
 */
export function getCachedClassesForProvider(providerId: string): typeof CustomOpenAIBot[] {
    const result: typeof CustomOpenAIBot[] = [];
    for (const [key, cls] of modelClassCache.entries()) {
        if (key.startsWith(`${providerId}:`)) {
            result.push(cls);
        }
    }
    return result;
}

/**
 * Remove all cached classes for a given provider config.
 * Used when a provider is deleted or its enabled models change.
 */
export function clearCachedClassesForProvider(providerId: string): void {
    for (const key of modelClassCache.keys()) {
        if (key.startsWith(`${providerId}:`)) {
            modelClassCache.delete(key);
        }
    }
}

/**
 * Clear entire registry cache.
 */
export function clearAllCachedClasses(): void {
    modelClassCache.clear();
}
