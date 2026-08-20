import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface LessonMarkdownProps {
  content: string;
  /** Override the inferred direction (e.g. a bilingual preview pane). */
  dir?: 'ltr' | 'rtl';
}

/* ── Math normalisation ──
 * remark-math only understands `$…$` and `$$…$$`. Authored lessons arrive from
 * Word, Overleaf, Docs and LLM exports carrying `\(…\)`, `\[…\]` or a ```math
 * fence instead, which previously fell through to the page as raw backslashes.
 * Rewrite those to dollar delimiters before parsing — but never inside code,
 * where a backslash is just a backslash.
 */
const CODE_CHUNK = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g;

function toDollarDelimiters(text: string): string {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex: string) => `\n\n$$\n${tex.trim()}\n$$\n\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, tex: string) => `$${tex.trim()}$`);
}

function normalizeMath(markdown: string): string {
  // ```math / ```latex fences first — they are code chunks, so they have to
  // become display math before the code-preserving split below sees them.
  const withFences = markdown.replace(
    /```(?:math|latex|katex)[ \t]*\r?\n([\s\S]*?)```/g,
    (_m, tex: string) => `\n\n$$\n${tex.trim()}\n$$\n\n`,
  );

  // split() with a capturing group yields the code chunks at odd indices.
  return withFences
    .split(CODE_CHUNK)
    .map((chunk, i) => (i % 2 === 1 ? chunk : toDollarDelimiters(chunk)))
    .join('');
}

/* ── Latin runs inside Arabic prose ──
 * Arabic security writing is dense with English terminology, and the two
 * scripts need different faces. Relying on font fallback alone would hand the
 * *space* glyph to the Latin face too, which visibly loosens Arabic word
 * spacing — so instead each Latin run is tagged and styled on its own.
 *
 * Consecutive Latin words are captured as ONE run, spaces included. Splitting
 * a phrase into per-word spans would let the bidi algorithm reorder the words
 * right-to-left inside an RTL paragraph.
 */
/** A word may carry inner punctuation (TCP/IP, IPv4, 255.255.255.0, e-mail)
 *  but must start and end on an alphanumeric, so a sentence-ending period
 *  stays with the Arabic sentence rather than being pulled into the run. */
const LATIN_WORD = '[A-Za-z0-9]+(?:[._+\\-/][A-Za-z0-9]+)*';
const LATIN_RUN = new RegExp(`${LATIN_WORD}(?:[ \\t]+${LATIN_WORD})*`, 'g');

/** Subtrees whose text is already typeset by something else. */
const OPAQUE_TAGS = new Set(['code', 'pre', 'math', 'svg', 'annotation', 'style', 'script']);

function isOpaque(node: any): boolean {
  if (OPAQUE_TAGS.has(node.tagName)) return true;
  const cls = node.properties?.className;
  const list = Array.isArray(cls) ? cls : cls ? [cls] : [];
  return list.some((c: unknown) => /^(katex|math)/.test(String(c)));
}

/** rehype plugin — runs after rehype-katex, so rendered math is left alone. */
function rehypeWrapLatinRuns() {
  return (tree: any) => {
    const walk = (node: any) => {
      if (!Array.isArray(node.children)) return;

      const out: any[] = [];
      let changed = false;

      for (const child of node.children) {
        if (child.type === 'element') {
          if (!isOpaque(child)) walk(child);
          out.push(child);
          continue;
        }
        if (child.type !== 'text') {
          out.push(child);
          continue;
        }

        const value: string = child.value;
        const pieces: any[] = [];
        LATIN_RUN.lastIndex = 0;
        let last = 0;
        let match: RegExpExecArray | null;

        while ((match = LATIN_RUN.exec(value)) !== null) {
          if (match.index > last) pieces.push({ type: 'text', value: value.slice(last, match.index) });
          pieces.push({
            type: 'element',
            tagName: 'span',
            properties: { className: ['lat'] },
            children: [{ type: 'text', value: match[0] }],
          });
          last = match.index + match[0].length;
        }

        if (pieces.length === 0) {
          out.push(child);
          continue;
        }

        if (last < value.length) pieces.push({ type: 'text', value: value.slice(last) });
        out.push(...pieces);
        changed = true;
      }

      if (changed) node.children = out;
    };

    walk(tree);
  };
}

/* ── Direction ──
 * A lesson's direction follows its own text, not the UI language: an Arabic
 * module stays RTL for a student browsing in English, and an English module
 * stays LTR for one browsing in Arabic. Code, math and URLs are Latin by
 * nature, so they are stripped before the two scripts are weighed.
 */
const ARABIC_RANGE =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;

function detectDir(markdown: string): 'ltr' | 'rtl' {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ');

  const arabic = (prose.match(ARABIC_RANGE) || []).length;
  if (arabic === 0) return 'ltr';
  const latin = (prose.match(/[A-Za-z]/g) || []).length;

  // Arabic technical prose is dense with English terms, so a fifth of the
  // letters being Arabic already makes it an Arabic lesson.
  return arabic / (arabic + latin) >= 0.2 ? 'rtl' : 'ltr';
}

/**
 * The single, canonical markdown renderer for all lesson prose.
 *
 * Used by the programming lessons, networking lessons, the module viewer,
 * and every Creator Studio preview — so a paragraph, code block, table or
 * equation looks identical everywhere in the Academy. Do not fork this
 * styling into page-local component maps.
 *
 * Callers own their wrapper (padding / max-width / card chrome).
 */
const LessonMarkdown: React.FC<LessonMarkdownProps> = ({ content, dir }) => {
  const source = useMemo(() => normalizeMath(content), [content]);
  const direction = useMemo(() => dir ?? detectDir(content), [dir, content]);
  const isRtl = direction === 'rtl';

  return (
    <div className="lesson-prose" dir={direction} lang={isRtl ? 'ar' : undefined}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={
          isRtl
            ? [[rehypeKatex, { throwOnError: false, strict: false }], rehypeWrapLatinRuns]
            : [[rehypeKatex, { throwOnError: false, strict: false }]]
        }
        components={{
          h1: ({ children }) => (
            <h1
              dir="auto"
              className="text-2xl md:text-3xl font-bold text-[#f3f6ff] mb-6 pb-4 border-b border-[#263248]"
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 dir="auto" className="text-xl font-bold text-[#f3f6ff] mt-10 mb-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 dir="auto" className="text-base font-semibold text-[#f3f6ff] mt-6 mb-3">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p dir="auto" className="text-sm text-[#c4cad6] leading-relaxed mb-4">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#f3f6ff]">{children}</strong>
          ),
          em: ({ children }) => <em className="text-[#9aa5bf]">{children}</em>,
          ul: ({ children }) => <ul className="space-y-2 mb-5 ms-1">{children}</ul>,
          ol: ({ children }) => (
            <ol className="space-y-2 mb-5 ms-1 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li
              dir="auto"
              className="text-sm text-[#c4cad6] leading-relaxed flex items-start gap-2"
            >
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#00a859] flex-shrink-0" />
              <span className="min-w-0">{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              dir="auto"
              className="border-s-2 border-[#00a859]/40 bg-[#121a2a] rounded-e-lg px-4 py-3 my-4 text-sm text-[#9aa5bf] italic"
            >
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code
                  className="block bg-[#0a0f18] rounded-lg p-4 text-[13px] text-[#c4cad6] font-mono overflow-x-auto border border-[#263248] whitespace-pre"
                  dir="ltr"
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-[#1a2332] border border-[#263248] text-[#9fef00] text-[13px] font-mono"
                dir="ltr"
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre dir="ltr" className="mb-5 overflow-hidden rounded-lg">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-5 rounded-lg border border-[#263248]">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#121a2a] border-b border-[#263248]">{children}</thead>
          ),
          th: ({ children }) => (
            <th
              dir="auto"
              className="px-4 py-2.5 text-start text-xs font-semibold text-[#9aa5bf] uppercase tracking-wider"
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              dir="auto"
              className="px-4 py-2.5 text-sm text-[#c4cad6] border-t border-[#263248]/50"
            >
              {children}
            </td>
          ),
          hr: () => <hr className="my-8 border-[#263248]" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#60a5fa] hover:text-[#93bbfd] underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
};

export default LessonMarkdown;
