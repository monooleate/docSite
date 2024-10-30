import Prism from "prismjs";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-diff.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-yaml.js";
import katex from 'npm:katex';
import * as Marked from "marked";
import { escape as escapeHtml } from "@std/html";
import { mangle } from "marked-mangle";
import GitHubSlugger from "github-slugger";

export { extractYaml as frontMatter } from "@std/front-matter";

export interface MarkdownHeading {
  id: string;
  html: string;
}

// Define the custom token type for the FAQ extension
interface FAQToken extends Marked.Tokens.Generic {
  type: 'faq';
  question: string;
  answer: string;
}

// Define the custom extension for FAQs in TypeScript
const faqExtension: Marked.TokenizerAndRendererExtension = {
  name: 'faq',
  level: 'block', // Set level to "block" (the required type)
  start(src: string) {
    return src.indexOf('::: faq'); // Look for the start of an FAQ block
  },
  tokenizer(src: string) {
    const rule = /^::: faq (.+?)\n([\s\S]+?)\n:::/; // Match ::: faq <question>\n<answer>\n:::
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'faq', // Token type to handle in the renderer
        raw: match[0], // The entire matched content
        question: match[1].trim(), // Extract the question
        answer: match[2].trim(), // Extract the answer
      } as FAQToken;
    }
  },
  renderer(this: Marked.RendererThis, token: Marked.Tokens.Generic) {
    // Check if the token is of type 'faq'
    if (token.type === 'faq') {
      const faqToken = token as FAQToken;
      // Render the question as <summary> and the answer as <p> inside <details>
      return `<details>\n<summary>${faqToken.question}</summary>\n<p>${faqToken.answer}</p>\n</details>`;
    }
    return ''; // Default return if not 'faq' token
  }
};

Marked.marked.use({ extensions: [faqExtension] });
Marked.marked.use(mangle());

const slugger = new GitHubSlugger();
const ADMISSION_REG = /^\[(info|warn|tip)\]:\s/;

class DefaultRenderer extends Marked.Renderer {
  headings: MarkdownHeading[] = [];

  override text(
    token: Marked.Tokens.Text | Marked.Tokens.Escape | Marked.Tokens.Tag,
  ): string {
    if (
      token.type === "text" && "tokens" in token && token.tokens !== undefined
    ) {
      return this.parser.parseInline(token.tokens);
    }

    // Smartypants typography enhancement
    return token.text
      .replaceAll("...", "&#8230;")
      .replaceAll("--", "&#8212;")
      .replaceAll("---", "&#8211;")
      .replaceAll(/(\w)'(\w)/g, "$1&#8217;$2")
      .replaceAll(/s'/g, "s&#8217;")
      .replaceAll("&#39;", "&#8217;")
      .replaceAll(/["](.*?)["]/g, "&#8220;$1&#8221")
      .replaceAll(/&quot;(.*?)&quot;/g, "&#8220;$1&#8221")
      .replaceAll(/['](.*?)[']/g, "&#8216;$1&#8217;");
  }

  override heading({
    tokens,
    depth,
    raw,
  }: Marked.Tokens.Heading): string {
    const slug = slugger.slug(raw);
    const text = this.parser.parseInline(tokens);
    this.headings.push({ id: slug, html: text });
    return `<h${depth} id="${slug}"><a class="md-anchor" tabindex="-1" href="#${slug}">${text}<span aria-hidden="true">#</span></a></h${depth}>`;
  }

  override link({ href, title, tokens }: Marked.Tokens.Link) {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${title}"` : "";
    if (href.startsWith("#")) {
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    }

    return `<a href="${href}"${titleAttr} rel="noopener noreferrer">${text}</a>`;
  }

  override image({ href, text, title }: Marked.Tokens.Image) {
    return `<img src="${href}" alt="${text ?? ""}" title="${title ?? ""}" />`;
  }

  override code({ lang: info, text }: Marked.Tokens.Code): string {
    // format: tsx
    // format: tsx my/file.ts
    // format: tsx "This is my title"
    let lang = "";
    let title = "";
    const match = info?.match(/^([\w_-]+)\s*(.*)?$/);
    if (match) {
      lang = match[1].toLocaleLowerCase();
      title = match[2] ?? "";
    }

    let out = `<div class="fenced-code">`;

    if (title) {
      out += `<div class="fenced-code-header">
        <span class="fenced-code-title lang-${lang}">
          ${title ? escapeHtml(String(title)) : "&nbsp;"}
        </span>
      </div>`;
    }

    // If the language is 'katex', render with KaTeX
    if (lang === 'katex') {
      try {
        const renderedKaTeX = katex.renderToString(text, {
          displayMode: true, 
          throwOnError: false,
          output: 'html', 
          strict: 'ignore', 
          minRuleThickness: 0.06, 
        });
        out += `<span class="katex">${renderedKaTeX}</span>`;
      } catch (_error) {
        out += `<pre><code class="notranslate">${escapeHtml(text)}</code></pre>`; // Fallback for KaTeX error
      }
    } else {
      const grammar = lang && Object.hasOwnProperty.call(Prism.languages, lang)
        ? Prism.languages[lang]
        : undefined;

      if (grammar === undefined) {
        out += `<pre><code class="notranslate">${escapeHtml(text)}</code></pre>`;
      } else {
        const html = Prism.highlight(text, grammar, lang);
        out +=
          `<pre class="highlight highlight-source-${lang} notranslate lang-${lang}"><code>${html}</code></pre>`;
      }
    }

    out += `</div>`;
    return out;
  }

  override blockquote({ text }: Marked.Tokens.Blockquote): string {
    const match = text.match(ADMISSION_REG);
    if (match) {
      const label: Record<string, string> = {
        tip: "Tip",
        warn: "Warning",
        info: "Info",
      };
      const type = match[1];
      text = text.slice(match[0].length);
      const icon = `<svg class="icon"><use href="/icons.svg#${type}" /></svg>`;
      return `<blockquote class="admonition ${type}">\n<span class="admonition-header">${icon}${
        label[type]
      }</span>${Marked.parse(text)}</blockquote>\n`;
    }
    return `<blockquote>\n${Marked.parse(text)}</blockquote>\n`;
  }
}

export interface MarkdownOptions {
  inline?: boolean;
}
export function renderMarkdown(
  input: string,
  opts: MarkdownOptions = {},
): { headings: MarkdownHeading[]; html: string } {
  const renderer = new DefaultRenderer();
  const markedOpts: Marked.MarkedOptions = {
    gfm: true,
    renderer,
  };

  const html = opts.inline
    ? Marked.parseInline(input, markedOpts) as string
    : Marked.parse(input, markedOpts) as string;

  return { headings: renderer.headings, html };
}
