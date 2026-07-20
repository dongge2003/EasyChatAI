import {BotBase} from "~libs/chatbot/BotBase";
import type {BotCompletionParams, BotConstructorParams, IBot} from "~libs/chatbot/IBot";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {ChatError, ErrorCode} from "~utils/errors";
import {getCustomProviders} from "~libs/chatbot/custom-openai/types";
import {Logger} from "~utils/logger";

/**
 * Base class for custom OpenAI-compatible model providers.
 * Subclasses are generated dynamically via the registry and override
 * static properties _providerConfigId and _modelNameForCompletion.
 */
export class CustomOpenAIBot extends BotBase implements IBot {
    /* --- Static metadata (overridden by generated subclasses) --- */
    static botName = 'Custom Model';
    static logoSrc = '';
    static desc = 'Custom OpenAI-compatible model';
    static requireLogin = false;
    static supportUploadPDF = false;
    static supportUploadImage = false;
    static maxTokenLimit = 128 * 1000;
    static paidModel = false;
    static newModel = false;
    static loginUrl = '';

    /** Provider-config ID set by the registry on each generated subclass. */
    static _providerConfigId = '';
    /** Model name sent in the API request body, set by the registry. */
    static _modelNameForCompletion = '';

    /* --- Instance fields --- */
    model: string;
    supportedUploadTypes: string[] = [];

    constructor(params: BotConstructorParams) {
        super(params);
        const cls = this.constructor as typeof CustomOpenAIBot;
        this.model = cls._modelNameForCompletion;
    }

    /* ========== IBot implementation ========== */

    async completion({prompt, rid, cb, fileRef, file}: BotCompletionParams): Promise<void> {
        const cls = this.constructor as typeof CustomOpenAIBot;
        const providerConfigId = cls._providerConfigId;
        const modelName = cls._modelNameForCompletion;

        if (!providerConfigId) {
            cb(rid, new ConversationResponse({
                message_type: ResponseMessageType.ERROR,
                error: new ChatError(ErrorCode.UNKNOWN_ERROR, 'Custom provider not configured'),
            }));
            return;
        }

        const providers = await getCustomProviders();
        const config = providers.find(p => p.id === providerConfigId);

        if (!config) {
            cb(rid, new ConversationResponse({
                message_type: ResponseMessageType.ERROR,
                error: new ChatError(ErrorCode.UNAUTHORIZED, 'Custom provider config not found. Please check your settings.'),
            }));
            return;
        }

        const baseUrl = config.apiUrl.replace(/\/+$/, '');
        const url = `${baseUrl}/chat/completions`;

        const messages: any[] = [{role: 'user', content: prompt}];

        // If file/image reference is present, try to include it as a multi-modal message
        if (fileRef && file) {
            try {
                const base64Content = await fileToBase64(file);
                const imageMime = file.type.startsWith('image/') ? file.type : 'image/png';
                messages.pop(); // remove the plain text user message
                messages.push({
                    role: 'user',
                    content: [
                        {type: 'text', text: prompt},
                        {
                            type: 'image_url',
                            image_url: {url: `data:${imageMime};base64,${base64Content}`},
                        },
                    ],
                });
            } catch {
                // fallback to text-only
            }
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model: modelName,
                    messages,
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                cb(rid, new ConversationResponse({
                    message_type: ResponseMessageType.ERROR,
                    error: this.mapHttpError(response.status, errorBody),
                }));
                return;
            }

            if (!response.body) {
                cb(rid, new ConversationResponse({
                    message_type: ResponseMessageType.ERROR,
                    error: new ChatError(ErrorCode.NETWORK_ERROR, 'Response body is empty'),
                }));
                return;
            }

            await this.readSSEStream(response.body, cb, rid);
            cb(rid, new ConversationResponse({message_type: ResponseMessageType.DONE}));
        } catch (err: any) {
            Logger.error('CustomOpenAIBot completion error:', err);
            cb(rid, new ConversationResponse({
                message_type: ResponseMessageType.ERROR,
                error: new ChatError(ErrorCode.NETWORK_ERROR, err?.message || 'Network error'),
            }));
        }
    }

    async startAuth(): Promise<boolean> {
        return true; // API-key based, no interactive auth needed
    }

    async startCaptcha(): Promise<boolean> {
        return true; // no CAPTCHA
    }

    async uploadFile(file: File): Promise<string> {
        // For image files, we handle them directly in completion() via base64
        // For other file types, return a placeholder ref or reject
        if (file.type.startsWith('image/')) {
            return `custom-image-${Date.now()}`;
        }
        throw new ChatError(ErrorCode.UPLOAD_FILE_NOT_SUPPORTED, 'File upload not supported for custom models');
    }

    /* ========== Getters ========== */

    getBotName(): string {
        return (this.constructor as typeof CustomOpenAIBot).botName;
    }

    getRequireLogin(): boolean {
        return (this.constructor as typeof CustomOpenAIBot).requireLogin;
    }

    getLogoSrc(): string {
        return (this.constructor as typeof CustomOpenAIBot).logoSrc;
    }

    getLoginUrl(): string {
        return (this.constructor as typeof CustomOpenAIBot).loginUrl;
    }

    getSupportUploadPDF(): boolean {
        return (this.constructor as typeof CustomOpenAIBot).supportUploadPDF;
    }

    getSupportUploadImage(): boolean {
        return (this.constructor as typeof CustomOpenAIBot).supportUploadImage;
    }

    getMaxTokenLimit(): number {
        return (this.constructor as typeof CustomOpenAIBot).maxTokenLimit;
    }

    getPaidModel(): boolean {
        return (this.constructor as typeof CustomOpenAIBot).paidModel;
    }

    getNewModel(): boolean {
        return (this.constructor as typeof CustomOpenAIBot).newModel;
    }

    /* ========== Private helpers ========== */

    private async readSSEStream(
        body: ReadableStream<Uint8Array>,
        cb: (rid: string, m: ConversationResponse) => void,
        rid: string,
    ): Promise<void> {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, {stream: true});
            const lines = buffer.split('\n');
            // Keep the last potentially incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;

                const data = trimmed.slice(5).trim();
                if (data === '[DONE]') return;

                try {
                    const parsed = JSON.parse(data);
                    const choice = parsed.choices?.[0];
                    if (!choice) continue;

                    const delta = choice.delta;
                    const content = delta?.content || '';
                    if (content) {
                        accumulatedContent += content;
                        cb(rid, new ConversationResponse({
                            message_type: ResponseMessageType.GENERATING,
                            message_text: accumulatedContent,
                        }));
                    }

                    // Handle finish reason
                    if (choice.finish_reason) {
                        // Stream is complete, will send DONE after loop
                    }
                } catch {
                    // skip malformed JSON lines
                }
            }
        }
    }

    private mapHttpError(status: number, body: string): ChatError {
        switch (status) {
        case 401:
            return new ChatError(ErrorCode.UNAUTHORIZED, 'Invalid API key or unauthorized access');
        case 403:
            return new ChatError(ErrorCode.MODEL_NO_PERMISSION, 'Access to this model is forbidden');
        case 429:
            return new ChatError(ErrorCode.CONVERSATION_LIMIT, 'Rate limit exceeded. Please try again later.');
        case 500:
        case 502:
        case 503:
            return new ChatError(ErrorCode.MODEL_INTERNAL_ERROR, `Provider returned server error (${status})`);
        default:
            return new ChatError(ErrorCode.UNKNOWN_ERROR, `API error (${status}): ${body.slice(0, 200)}`);
        }
    }
}

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const commaIndex = result.indexOf(',');
            resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
