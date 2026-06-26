import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LessonMarkdownProps {
  content: string;
}

/**
 * The single, canonical markdown renderer for all lesson prose.
 *
 * Used by the programming lessons, networking lessons, the module viewer,
 * and every Creator Studio preview — so a paragraph, code block, or table
 * looks identical everywhere in the Academy. Do not fork this styling into
 * page-local component maps.
 *
 * Callers own their wrapper (padding / max-width / card chrome).
 */
const LessonMarkdown: React.FC<LessonMarkdownProps> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => (
        <h1 className="text-2xl md:text-3xl font-bold text-[#f3f6ff] mb-6 pb-4 border-b border-[#263248]">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-bold text-[#f3f6ff] mt-10 mb-4">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-base font-semibold text-[#f3f6ff] mt-6 mb-3">{children}</h3>
      ),
      p: ({ children }) => (
        <p className="text-sm text-[#c4cad6] leading-relaxed mb-4">{children}</p>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-[#f3f6ff]">{children}</strong>
      ),
      em: ({ children }) => <em className="text-[#9aa5bf]">{children}</em>,
      ul: ({ children }) => <ul className="space-y-2 mb-5 ml-1">{children}</ul>,
      ol: ({ children }) => (
        <ol className="space-y-2 mb-5 ml-1 list-decimal list-inside">{children}</ol>
      ),
      li: ({ children }) => (
        <li className="text-sm text-[#c4cad6] leading-relaxed flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#00a859] flex-shrink-0" />
          <span>{children}</span>
        </li>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-[#00a859]/40 bg-[#121a2a] rounded-r-lg px-4 py-3 my-4 text-sm text-[#9aa5bf] italic">
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
      pre: ({ children }) => <pre className="mb-5 overflow-hidden rounded-lg">{children}</pre>,
      table: ({ children }) => (
        <div className="overflow-x-auto mb-5 rounded-lg border border-[#263248]">
          <table className="w-full text-sm">{children}</table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-[#121a2a] border-b border-[#263248]">{children}</thead>
      ),
      th: ({ children }) => (
        <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9aa5bf] uppercase tracking-wider">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-4 py-2.5 text-sm text-[#c4cad6] border-t border-[#263248]/50">
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
    {content}
  </ReactMarkdown>
);

export default LessonMarkdown;
