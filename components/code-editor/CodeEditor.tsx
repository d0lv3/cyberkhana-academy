import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'python' | 'cpp' | 'bash';
  readOnly?: boolean;
  minHeight?: string;
}

/* ── Green-oriented syntax highlighting ──
 *
 * Palette built around CyberKhana's brand green (#00a859)
 * with tonal variations for readability:
 *
 *   Keywords     → #00a859  (brand green — def, if, for, import)
 *   Strings      → #7dd3a8  (soft sage green)
 *   Comments     → #4d5a73  (muted slate)
 *   Numbers      → #5eead4  (teal)
 *   Built-ins    → #34d399  (emerald)
 *   Booleans     → #f3a43a  (gold — the only warm accent)
 *   Types/Class  → #86efac  (light green)
 *   Operators    → #8390ac  (neutral gray)
 *   Variables    → #d2d7e3  (default text)
 */

const syntaxColors = HighlightStyle.define([
  // Keywords: def, class, if, else, for, while, import, from, return, yield, pass, break, continue, with, as, try, except, finally, raise, del, assert, lambda, global, nonlocal
  { tag: tags.keyword,                color: '#00a859', fontWeight: '600' },
  { tag: tags.controlKeyword,         color: '#00a859', fontWeight: '600' },
  { tag: tags.moduleKeyword,          color: '#00a859', fontWeight: '600' },
  { tag: tags.operatorKeyword,        color: '#00a859' },  // and, or, not, in, is

  // Definitions: function/class names at declaration
  { tag: tags.definition(tags.variableName), color: '#5eead4' },
  { tag: tags.definition(tags.propertyName), color: '#5eead4' },

  // Functions: print(), len(), type(), range()
  { tag: tags.function(tags.variableName), color: '#34d399' },
  { tag: tags.standard(tags.variableName), color: '#34d399' },

  // Strings
  { tag: tags.string,                 color: '#7dd3a8' },
  { tag: tags.special(tags.string),   color: '#7dd3a8' },  // f-strings, regex

  // Numbers
  { tag: tags.number,                 color: '#5eead4' },
  { tag: tags.integer,                color: '#5eead4' },
  { tag: tags.float,                  color: '#5eead4' },

  // Booleans and None (the only warm accent)
  { tag: tags.bool,                   color: '#f3a43a' },
  { tag: tags.null,                   color: '#f3a43a' },
  { tag: tags.atom,                   color: '#f3a43a' },  // True, False, None

  // Types / class names
  { tag: tags.typeName,               color: '#86efac' },
  { tag: tags.className,              color: '#86efac' },

  // Comments
  { tag: tags.comment,                color: '#4d5a73', fontStyle: 'italic' },
  { tag: tags.lineComment,            color: '#4d5a73', fontStyle: 'italic' },
  { tag: tags.blockComment,           color: '#4d5a73', fontStyle: 'italic' },
  { tag: tags.docComment,             color: '#546478', fontStyle: 'italic' },

  // Operators and punctuation
  { tag: tags.operator,               color: '#8390ac' },
  { tag: tags.compareOperator,        color: '#8390ac' },
  { tag: tags.arithmeticOperator,     color: '#8390ac' },
  { tag: tags.logicOperator,          color: '#8390ac' },
  { tag: tags.punctuation,            color: '#6e7a94' },
  { tag: tags.bracket,                color: '#6e7a94' },
  { tag: tags.paren,                  color: '#6e7a94' },
  { tag: tags.squareBracket,          color: '#6e7a94' },
  { tag: tags.brace,                  color: '#6e7a94' },
  { tag: tags.separator,              color: '#6e7a94' },
  { tag: tags.derefOperator,          color: '#6e7a94' },  // dot

  // Decorators
  { tag: tags.meta,                   color: '#34d399' },
  { tag: tags.annotation,             color: '#34d399' },

  // Properties / attributes
  { tag: tags.propertyName,           color: '#b4bcd0' },

  // Variables (default)
  { tag: tags.variableName,           color: '#d2d7e3' },

  // Self / special variables
  { tag: tags.self,                   color: '#8390ac', fontStyle: 'italic' },

  // Errors
  { tag: tags.invalid,                color: '#f87171', textDecoration: 'underline wavy' },
]);

/* ── Editor chrome theme ── */

const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#080c14',
    color: '#d2d7e3',
    fontSize: '13.5px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  },
  '.cm-content': {
    caretColor: '#00a859',
    padding: '14px 0',
    lineHeight: '1.6',
  },
  '.cm-cursor': {
    borderLeftColor: '#00a859',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#00a859',
  },
  '.cm-activeLine': {
    backgroundColor: '#0d1420',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#0d1420',
    color: '#4d5a73',
  },
  '.cm-gutters': {
    backgroundColor: '#080c14',
    color: '#2d3748',
    borderRight: '1px solid #151d2e',
  },
  '.cm-gutterElement': {
    padding: '0 12px 0 16px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    minWidth: '32px',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#163b30 !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#163b30 !important',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#163b30',
    outline: '1px solid #00a85940',
    borderRadius: '2px',
  },
  '.cm-nonmatchingBracket': {
    backgroundColor: '#3b1420',
  },
  '.cm-searchMatch': {
    backgroundColor: '#f3a43a22',
    borderRadius: '2px',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#f3a43a40',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#151d2e',
    color: '#4d5a73',
    border: '1px solid #1e2a3d',
    borderRadius: '3px',
    padding: '0 4px',
  },
  '.cm-tooltip': {
    backgroundColor: '#0d1117',
    border: '1px solid #1e2a3d',
    borderRadius: '6px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '4px 8px',
  },
});

const langExtensions = {
  python: [python()],
  cpp: [],
  bash: [],
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'python',
  readOnly = false,
  minHeight = '200px',
}) => {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={[editorTheme, syntaxHighlighting(syntaxColors)]}
      extensions={langExtensions[language] ?? []}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        foldGutter: false,
        highlightSelectionMatches: true,
        indentOnInput: true,
      }}
      style={{ minHeight, fontSize: '13.5px' }}
    />
  );
};

export default CodeEditor;
