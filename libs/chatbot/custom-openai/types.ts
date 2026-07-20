import {Storage} from "@plasmohq/storage";

export const CUSTOM_PROVIDERS_STORAGE_KEY = "customProviders";

export interface CustomProviderConfig {
    id: string;
    name: string;
    apiUrl: string;
    apiKey: string;
    enabledModels: string[];
    fetchedModels?: string[];
}

export async function getCustomProviders(): Promise<CustomProviderConfig[]> {
    const storage = new Storage();
    return (await storage.get<CustomProviderConfig[]>(CUSTOM_PROVIDERS_STORAGE_KEY)) || [];
}

export async function saveCustomProvider(config: CustomProviderConfig): Promise<CustomProviderConfig[]> {
    const providers = await getCustomProviders();
    const index = providers.findIndex(p => p.id === config.id);
    if (index >= 0) {
        providers[index] = config;
    } else {
        providers.push(config);
    }
    const storage = new Storage();
    await storage.set(CUSTOM_PROVIDERS_STORAGE_KEY, providers);
    return providers;
}

export async function deleteCustomProvider(id: string): Promise<CustomProviderConfig[]> {
    const providers = await getCustomProviders();
    const filtered = providers.filter(p => p.id !== id);
    const storage = new Storage();
    await storage.set(CUSTOM_PROVIDERS_STORAGE_KEY, filtered);
    return filtered;
}

export async function fetchAvailableModels(apiUrl: string, apiKey: string): Promise<string[]> {
    const baseUrl = apiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/models`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data?.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => model.id).sort();
    }
    throw new Error('Unexpected response format from API');
}
