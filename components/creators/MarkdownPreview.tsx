import React from 'react';
import LessonMarkdown from '../ui/LessonMarkdown';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * Studio preview pane — delegates to the canonical LessonMarkdown renderer
 * so what the creator previews is pixel-identical to what students see.
 */
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className = '' }) => {
  if (!content.trim()) {
    return (
      <div className={`flex items-center justify-center h-full text-[#4d5a73] text-sm italic ${className}`}>
        No content to preview
      </div>
    );
  }

  return (
    <article className={`max-w-2xl mx-auto ${className}`}>
      <LessonMarkdown content={content} />
    </article>
  );
};

export default MarkdownPreview;
