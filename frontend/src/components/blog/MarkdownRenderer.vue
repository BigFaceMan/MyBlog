<template>
  <div class="markdown-body" v-html="html" />
</template>

<script setup lang="ts">
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdownLanguage from "highlight.js/lib/languages/markdown";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import MarkdownIt from "markdown-it";
import { computed } from "vue";
import { createHeadingId, type HeadingIdCounts } from "@/utils/markdownHeadings";

const props = defineProps<{
  content: string;
}>();

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdownLanguage);
hljs.registerLanguage("md", markdownLanguage);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[char] ?? char;
  });

const markdown: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      return `<pre><code class="hljs language-${lang}">${hljs.highlight(code, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
    }

    return `<pre><code class="hljs">${escapeHtml(code)}</code></pre>`;
  }
});

markdown.core.ruler.push("heading_ids", (state) => {
  const counts: HeadingIdCounts = new Map();

  state.tokens.forEach((token, index) => {
    if (token.type !== "heading_open") {
      return;
    }

    const inlineToken = state.tokens[index + 1];
    const text = inlineToken?.type === "inline" ? inlineToken.content : "";

    token.attrSet("id", createHeadingId(text, counts));
  });
});

const html = computed(() => markdown.render(props.content));
</script>

<style scoped>
.markdown-body {
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.9;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  scroll-margin-top: calc(var(--header-height) + 24px);
  margin: 1.7em 0 0.75em;
  line-height: 1.35;
}

.markdown-body :deep(h1) {
  margin-top: 0;
  font-size: 32px;
}

.markdown-body :deep(h2) {
  padding-bottom: 8px;
  font-size: 24px;
  border-bottom: 1px solid var(--border-color);
}

.markdown-body :deep(p) {
  margin: 1em 0;
}

.markdown-body :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.markdown-body :deep(ul) {
  padding-left: 1.4em;
}

.markdown-body :deep(pre) {
  overflow: auto;
  border-radius: 8px;
}

.markdown-body :deep(code:not(pre code)) {
  padding: 2px 6px;
  color: var(--primary-color);
  background: var(--primary-soft);
  border-radius: 5px;
}
</style>
