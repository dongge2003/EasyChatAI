<div align="center">
<h2>EasyChatAI：一个开源的浏览器侧边栏插件，提供类似 Sider、Monica 和 Merlin 等产品的免费替代方案</h2>

[![GitHub license](https://img.shields.io/badge/license-GPL%203.0-blue)](https://github.com/luyu0279/BrainyAi/blob/main/LICENSE)

[English](README_EN.md) ｜ 简体中文
</div>

<br>

> 📌 **本项目基于 [BrainyAI](https://github.com/luyu0279/BrainyAI) 进行持续开发和维护。**  
> 感谢 [luyu0279](https://github.com/luyu0279) 创建了原始项目。

<br>

## 简介

🧠 **EasyChatAI** 是一个完全免费的 Chrome 浏览器扩展程序。您只需设置好模型，即可通过便捷的侧边栏将大模型能力融入日常工作与生活。EasyChatAI  AI 网页浏览功能。

使用 EasyChatAI 时，无需离开当前页面。您可以用大语言模型进行对话、网页摘要和文件阅读——完全免费。它是 **[Sider AI](https://sider.ai)**、**[Monica](https://monica.im)**、**[Merlin](https://www.getmerlin.in)** 和 **[MaxAI](https://www.maxai.me)** 等产品的免费替代品。🌐

<br>

## 主要特性

### 🔌 自定义模型提供商（最大新特性）

EasyChatAI 最大的独特优势：**支持您添加任意 OpenAI 兼容的 API 提供商**。

- 在选项页中添加 OpenAI 兼容的 API 端点（任何支持 `/v1/chat/completions` 的服务）
- 自动通过 `/v1/models` 接口发现可用模型
- 灵活选择要在侧边栏中使用的模型
- 支持流式 SSE 输出、图片多模态输入

这意味着您可以使用自建的 OpenAI 代理、第三方托管服务、企业内部模型网关等任何兼容 OpenAI API 格式的模型——不受我们内置模型列表的限制。


### 📚 AI 阅读与摘要

- 网页摘要：一键获取当前页面的 AI 摘要
- 文件上传阅读：支持 PDF、图片等文件的分析

### 🎯 智能上下文感知

- 选中任意网页文本，弹出浮动工具栏，快速向 AI 提问
- 自动携带页面上下文，让 AI 理解您正在查看的内容

<br>

## 隐私

EasyChatAI 高度重视用户隐私，我们绝不上传或分享任何敏感数据，包括但不限于：

- 本地 Cookie 信息
- API Key
- 聊天会话数据
- 其他个人信息


<br>
<br>

---

## 开发者指南

### 开始开发

首先，安装必要依赖：

```bash
npm install pnpm -g
```

```bash
pnpm install
```

然后，启动开发服务器：

```bash
pnpm dev
```

打开浏览器并加载相应的开发构建目录（Chrome MV3：`build/chrome-mv3-dev`）。

更多框架说明请[访问 Plasmo 文档](https://docs.plasmo.com/)。

### 生产构建

```bash
pnpm build
```

### 调试信息构建

```bash
pnpm build:staging
```

### 打包发布

```bash
pnpm package
```

<br>
