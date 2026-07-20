import {PromptTypes} from "~options/constant/PromptTypes";
import {PROMPT_PLACEHOLDER_LANG, PROMPT_PLACEHOLDER_TEXT} from "~utils";

export const PromptDatas = [
    {
        id: 1012,
        itemType: PromptTypes.DEFAULT,
        imageKey: 'Translate',
        title: '翻译',
        language: '简体中文',
        isSelect: true,
        text: `请将三个引号分隔的文本翻译成${PROMPT_PLACEHOLDER_LANG}，确保翻译地道自然。只输出翻译结果，不要添加其他内容。不要用引号包裹回复。""" ${PROMPT_PLACEHOLDER_TEXT} """`,
    },
    {
        id: 1013,
        itemType: PromptTypes.DEFAULT,
        imageKey: 'Summarize',
        title: '总结',
        language: '简体中文',
        isSelect: true,
        text: `请总结以下段落的核心内容：${PROMPT_PLACEHOLDER_TEXT}。请用${PROMPT_PLACEHOLDER_LANG}回复。`,
    },
    {
        id: 1014,
        itemType: PromptTypes.DEFAULT,
        imageKey: 'Explain',
        title: '解释',
        language: '简体中文',
        isSelect: true,
        text: `请解释以下段落：${PROMPT_PLACEHOLDER_TEXT}。请用${PROMPT_PLACEHOLDER_LANG}回复。`,
    },
    {
        id: 1015,
        itemType: PromptTypes.DEFAULT,
        imageKey: 'Rephrase',
        title: '改写',
        language: '简体中文',
        isSelect: true,
        text: `请改写以下段落，聚焦核心主题：${PROMPT_PLACEHOLDER_TEXT}。请用${PROMPT_PLACEHOLDER_LANG}回复。`,
    },
    {
        id: 1016,
        itemType: PromptTypes.DEFAULT,
        imageKey: 'Gammar_check',
        title: '语法检查',
        language: '简体中文',
        isSelect: true,
        text: `请纠正以下段落的语法错误、拼写错误和事实错误：${PROMPT_PLACEHOLDER_TEXT}。请用${PROMPT_PLACEHOLDER_LANG}回复，聚焦核心主题。`,
    },
];
export const AskPromptId = 100001;
export const AskPromptData = {
    id: AskPromptId,
    itemType: PromptTypes.DEFAULT,
    imageKey: 'ask_ai',
    title: 'AI 提问',
    language: '简体中文',
    isSelect: false,
    text: 'AI 提问',
};

export const PdfPromptDatas = [
    {
        id: 2021,
        itemType: PromptTypes.DEFAULT,
        imageKey: null,
        title: '总结',
        language: '简体中文',
        isSelect: false,
        text: '请用 3-5 句话总结此文件的关键要点和主要内容。',
    },
    {
        id: 2022,
        itemType: PromptTypes.DEFAULT,
        imageKey: null,
        title: '关键要点',
        language: '简体中文',
        isSelect: false,
        text: '请从文件中提取 5 个关键要点。确保关键要点准确捕捉文本中的主要思想、概念和见解，简洁明了，避免冗余。请使用以下格式：\n' +
            '要点 1:\n' +
            '要点 2:\n' +
            '要点 3:\n' +
            '要点 4:\n' +
            '要点 5:',
    },
    {
        id: 2023,
        itemType: PromptTypes.DEFAULT,
        imageKey: null,
        title: '小测验',
        language: '简体中文',
        isSelect: false,
        text: '基于此文件，请生成 5 组测验题目和答案。题目应覆盖文本中的关键信息和重要概念。确保题目和答案简洁易懂。每个题目应有一个正确答案。\n' +
            '请按以下格式提供测验内容：\n' +
            '题目 1: 问题: 答案;\n' +
            '题目 2: 问题: 答案;\n' +
            '题目 3: 问题: 答案;\n' +
            '题目 4: 问题: 答案;\n' +
            '题目 5: 问题: 答案;',
    },
];

export const ImagePromptDatas = [
    {
        id: 3031,
        itemType: PromptTypes.DEFAULT,
        imageKey: null,
        title: '描述',
        language: '简体中文',
        isSelect: false,
        text: '描述这张图片',
    },
    {
        id: 3032,
        itemType: PromptTypes.DEFAULT,
        imageKey: null,
        title: '提取文字',
        language: '简体中文',
        isSelect: false,
        text: '从这张图片中提取文字',
    },
    {
        id: 3033,
        itemType: PromptTypes.DEFAULT,
        imageKey: null,
        title: '提取并翻译',
        language: '简体中文',
        isSelect: false,
        text: '从这张图片中提取文字，然后翻译成简体中文',
    },
];
