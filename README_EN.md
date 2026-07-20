<div align="center">
<h2>EasyChatAI: a free and open-source browser sidebar plugin that offers a cost-free alternative to products like Sider, Monica, and Merlin.</h2>

[![GitHub license](https://img.shields.io/badge/license-GPL%203.0-blue)](https://github.com/luyu0279/BrainyAi/blob/main/LICENSE)

English ｜ [简体中文](README.md)
</div>

<br>

> 📌 **This project is a continued fork of [BrainyAI](https://github.com/luyu0279/BrainyAI).**  
> Thanks to [luyu0279](https://github.com/luyu0279) for creating the original project.

<br>

## Introduction

🧠 **EasyChatAI** is a completely free Chrome browser extension. Just set up your models, and you can bring the power of large language models into your daily workflow through a convenient sidebar. EasyChatAI offers AI chat, AI search, AI reading, and AI web browsing.

With EasyChatAI, you never need to leave your current page. Use large language models for conversation, web page summaries, and file reading — all completely free. It's a free alternative to **[Sider AI](https://sider.ai)**, **[Monica](https://monica.im)**, **[Merlin](https://www.getmerlin.in)**, and **[MaxAI](https://www.maxai.me)**. 🌐

<br>

## Key Features

### 🔌 Custom Model Providers (Biggest New Feature)

EasyChatAI's standout advantage: **bring your own OpenAI-compatible API provider**.

- Add any OpenAI-compatible API endpoint (any service supporting `/v1/chat/completions`)
- Auto-discovers available models via the `/v1/models` endpoint
- Select exactly which models you want available in the sidebar
- Supports SSE streaming and multi-modal image input

This means you can use self-hosted OpenAI proxies, third-party hosting services, corporate model gateways — any API that speaks the OpenAI protocol. You are not limited to our built-in model list.

### 📚 AI Reading & Summaries

- **Page summaries**: one-click AI summary of the current page
- **File upload**: analyze PDFs, images, and other documents

### 🎯 Smart Context Awareness

- Select any text on a page to get a floating toolbar for quick AI queries
- Automatically includes page context so the AI understands what you're looking at

<br>

## Privacy

At EasyChatAI, we prioritize user privacy and never upload or share any sensitive data, including:

- Local cookie information
- API Keys
- Chat session data
- Other personal information

<br>
<br>

---

## For Developers

### Getting Started

First, install the dependencies:

```bash
npm install pnpm -g
```

```bash
pnpm install
```

Then, start the development server:

```bash
pnpm dev
```

Open your browser and load the appropriate development build (Chrome MV3: `build/chrome-mv3-dev`).

For further guidance, [visit Plasmo Documentation](https://docs.plasmo.com/).

### Production Build

```bash
pnpm build
```

### Debug Build

```bash
pnpm build:staging
```

### Package for Store

```bash
pnpm package
```

<br>
</content>
