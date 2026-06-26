import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Trophy,
  Eye,
  Check,
  CheckCircle2,
  XCircle,
  Play,
  Loader2,
  Edit3,
  MonitorPlay,
  Wand2,
} from 'lucide-react';
import CreatorLayout from '../../components/creators/CreatorLayout';
import BilingualInput from '../../components/creators/BilingualInput';
import MarkdownUploader from '../../components/creators/MarkdownUploader';
import MarkdownPreview from '../../components/creators/MarkdownPreview';
import DynamicList from '../../components/creators/DynamicList';
import EnhancedCard from '../../components/ui/EnhancedCard';
import CodeEditor from '../../components/code-editor/CodeEditor';
import { CodingEnvironment } from '../../components/code-editor';
import { confirmDialog } from '../../components/ui/ConfirmHost';
import { runPython } from '../../components/code-editor/PythonExecutor';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { getCreatorProgrammingPatches, saveProgrammingConcept } from '../../services/creatorDataService';
import {
  makeCreatorMeta,
  statusOf,
  type ContentStatus,
  type CreatorProgrammingConcept,
} from '../../services/creatorTypes';
import type { TestCase } from '../../data/programming/types';

function generateId(): string {
  return `prog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

const langToEditor = (slug?: string): 'python' | 'cpp' | 'bash' =>
  slug === 'c' || slug === 'cpp' ? 'cpp' : slug === 'bash' ? 'bash' : 'python';

type VerifyResult = { id: string; passed: boolean; expected: string; actual: string; description: string };

/* ── Content templates (mirror the structure of the built-in lessons) ── */

const LESSON_MD_TEMPLATE = `# Lesson Title

One sentence that tells the student what they're about to learn and why it matters.

---

## The Concept

Explain the idea in plain language first. Then show it in code:

\`\`\`python
print("Hello, CyberKhana!")
\`\`\`

**Output:**
\`\`\`
Hello, CyberKhana!
\`\`\`

---

## Going Deeper

- Key point one
- Key point two
- A common mistake to avoid

\`\`\`python
# A slightly bigger example
name = "Analyst"
print("Welcome,", name)
\`\`\`

---

## Try It

The editor on the right has starter code. Click **Run** to see the output, then change something and run it again.
`;

const CHALLENGE_MD_TEMPLATE = `# Challenge: Title

Time to apply what you learned!

---

## Instructions

Write a program that prints **exactly** these lines:

\`\`\`
First expected line
Second expected line
\`\`\`

## Rules

- Use the \`print()\` function
- Match the expected output exactly (spelling, spacing, capitalization)

---

When you're ready, click **Submit** to check your answer. If you're stuck, use the **Hint** button below the editor.
`;

const LESSON_STARTER_TEMPLATE = `# Try the example from the lesson
print("Hello, CyberKhana!")
`;

const CHALLENGE_STARTER_TEMPLATE = `# Challenge: read the instructions on the left.
# Write your code below:

`;

const ProgrammingConceptEditor: React.FC = () => {
  const { langSlug, moduleSlug, conceptSlug } = useParams<{
    langSlug: string;
    moduleSlug: string;
    conceptSlug: string;
  }>();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const isEditing = !!conceptSlug && conceptSlug !== 'new';

  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [slug, setSlug] = useState('');
  const [order, setOrder] = useState(100);
  const [type, setType] = useState<'lesson' | 'challenge'>('lesson');
  const [markdownContent, setMarkdownContent] = useState('');
  const [starterCode, setStarterCode] = useState('# Write your code here\n');
  const [solution, setSolution] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verifyResults, setVerifyResults] = useState<VerifyResult[] | null>(null);

  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [previewNonce, setPreviewNonce] = useState(0);

  const editorLang = langToEditor(langSlug);

  // Load existing concept for editing
  useEffect(() => {
    if (isEditing && langSlug && moduleSlug && conceptSlug) {
      const patches = getCreatorProgrammingPatches();
      const patch = patches.find((p) => p.languageSlug === langSlug);
      const concept = patch?.newConcepts[moduleSlug]?.find((c) => c.slug === conceptSlug);
      if (concept) {
        setTitleEn(concept.title.en);
        setTitleAr(concept.title.ar);
        setSlug(concept.slug);
        setOrder(concept.order);
        setType(concept.type);
        setMarkdownContent(concept.markdownContent);
        setStarterCode(concept.starterCode);
        setSolution(concept.solution || '');
        setTestCases(concept.testCases || []);
        setHints(concept.hints || []);
        setStatus(statusOf(concept));
        setCreatedAt(concept.createdAt);
        setAuthorName(concept.authorName);
      }
    }
  }, [isEditing, langSlug, moduleSlug, conceptSlug]);

  // Auto-generate slug
  useEffect(() => {
    if (!isEditing) setSlug(generateSlug(titleEn));
  }, [titleEn, isEditing]);

  // Verification results go stale the moment the solution or tests change
  useEffect(() => {
    setVerifyResults(null);
  }, [solution, testCases]);

  const switchView = (v: 'edit' | 'preview') => {
    if (v === 'preview') setPreviewNonce((n) => n + 1); // remount the env fresh
    setView(v);
  };

  /* ── Templates ── */
  const insertMarkdownTemplate = async () => {
    if (
      markdownContent.trim() &&
      !(await confirmDialog({
        title: 'Replace content?',
        message: 'Your current markdown will be replaced with the template.',
        confirmLabel: 'Replace',
        tone: 'default',
      }))
    ) {
      return;
    }
    setMarkdownContent(type === 'challenge' ? CHALLENGE_MD_TEMPLATE : LESSON_MD_TEMPLATE);
  };

  const insertStarterTemplate = async () => {
    if (
      starterCode.trim() &&
      !(await confirmDialog({
        title: 'Replace starter code?',
        message: 'Your current starter code will be replaced with the scaffold.',
        confirmLabel: 'Replace',
        tone: 'default',
      }))
    ) {
      return;
    }
    setStarterCode(type === 'challenge' ? CHALLENGE_STARTER_TEMPLATE : LESSON_STARTER_TEMPLATE);
  };

  /* ── Verify solution against tests ── */
  const verifySolution = useCallback(async () => {
    if (editorLang !== 'python') {
      toast('error', 'The test runner currently supports Python only.');
      return;
    }
    if (!solution.trim()) {
      toast('error', 'Add solution code to verify against your tests.');
      return;
    }
    if (testCases.length === 0) {
      toast('error', 'Add at least one test case first.');
      return;
    }
    setVerifying(true);
    setVerifyResults(null);
    const results: VerifyResult[] = [];
    try {
      for (const tc of testCases) {
        const r = await runPython(solution, tc.input);
        const actual = (r.output || '').trimEnd();
        const expected = tc.expectedOutput.trimEnd();
        results.push({
          id: tc.id,
          passed: !r.error && actual === expected,
          expected,
          actual: r.error ? r.error.split('\n').slice(-1)[0] : actual,
          description: tc.description || '(no description)',
        });
      }
      setVerifyResults(results);
      const allPass = results.every((r) => r.passed);
      toast(allPass ? 'success' : 'error', allPass ? 'Solution passes all tests.' : 'Solution failed some tests.');
    } catch (err: any) {
      toast('error', err?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  }, [editorLang, solution, testCases, toast]);

  /* ── Save with publish guardrails ── */
  const handleSave = () => {
    let hadWarning = false;
    if (!titleEn.trim()) {
      toast('error', 'An English title is required.');
      return;
    }
    if (!langSlug || !moduleSlug) {
      toast('error', 'Missing language or module context.');
      return;
    }

    if (status === 'published') {
      if (!markdownContent.trim()) {
        toast('error', 'Add lesson content (markdown) before publishing.');
        return;
      }
      if (!starterCode.trim()) {
        toast('error', 'Add starter code before publishing.');
        return;
      }
      if (type === 'challenge' && testCases.length === 0) {
        toast('error', 'A published challenge needs at least one test case.');
        return;
      }
      // Soft warnings — publish proceeds, but the creator is told
      if (type === 'challenge') {
        if (!solution.trim()) {
          hadWarning = true;
          toast('warning', 'Publishing without a solution — students will have nothing to reveal when stuck.');
        } else if (!verifyResults) {
          hadWarning = true;
          toast('warning', 'Solution was not verified against the tests. Consider running "Verify against tests".');
        } else if (!verifyResults.every((r) => r.passed)) {
          hadWarning = true;
          toast('warning', 'Heads up: your solution currently fails some of its own tests.');
        }
      }
    }

    setIsSaving(true);
    const author = authorName || user?.displayName || 'CyberKhana';

    const concept: CreatorProgrammingConcept = {
      id:
        (isEditing &&
          getCreatorProgrammingPatches()
            .find((p) => p.languageSlug === langSlug)
            ?.newConcepts[moduleSlug]?.find((c) => c.slug === conceptSlug)?.id) ||
        generateId(),
      slug: slug || generateSlug(titleEn),
      title: { en: titleEn, ar: titleAr },
      order,
      type,
      markdownContent,
      starterCode,
      ...(type === 'challenge' ? { testCases, hints, solution: solution || undefined } : {}),
      ...(createdAt
        ? {
            isCreatorContent: true as const,
            isPublished: status === 'published',
            status,
            authorName: author,
            createdAt,
            updatedAt: new Date().toISOString(),
          }
        : makeCreatorMeta(status, author)),
    };

    saveProgrammingConcept(langSlug, moduleSlug, concept);
    toast('success', status === 'published' ? 'Concept published.' : 'Concept saved.');
    // Give the creator time to read publish warnings before redirecting
    setTimeout(() => {
      setIsSaving(false);
      navigate('/creators/programming');
    }, hadWarning ? 2500 : 500);
  };

  const tabCls = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
      active ? 'bg-[#1a2332] text-[#f3f6ff] border border-[#263248]' : 'text-[#6e7a94] hover:text-[#d2d7e3]'
    }`;

  return (
    <CreatorLayout
      title={isEditing ? 'Edit Concept' : 'New Concept'}
      subtitle={langSlug && moduleSlug ? `${langSlug} · ${moduleSlug}` : undefined}
      backTo="/creators/programming"
      backLabel="Programming"
      onSave={handleSave}
      isSaving={isSaving}
      status={status}
      onStatusChange={setStatus}
    >
      <ToastContainer />

      {/* ── View tabs ── */}
      <div className="flex items-center gap-1 bg-[#0b1019] border border-[#263248] rounded-xl p-1 w-fit" dir="ltr">
        <button type="button" onClick={() => switchView('edit')} className={tabCls(view === 'edit')}>
          <Edit3 size={13} /> Editor
        </button>
        <button type="button" onClick={() => switchView('preview')} className={tabCls(view === 'preview')}>
          <MonitorPlay size={13} /> Student Preview
        </button>
      </div>

      {view === 'preview' ? (
        /* ═══ STUDENT PREVIEW — the real lesson experience ═══ */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: rendered markdown */}
          <EnhancedCard padding="none" className="overflow-hidden">
            <div className="px-5 py-3 border-b border-[#263248] bg-[#0b1019] flex items-center gap-2">
              {type === 'challenge' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f3a43a]/10 border border-[#f3a43a]/20 text-[#f3a43a]">
                  <Trophy size={10} /> Challenge
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1a2332] border border-[#263248] text-[#9aa5bf]">
                  <BookOpen size={10} /> Lesson
                </span>
              )}
              <span className="text-xs font-bold text-[#f3f6ff] truncate">{titleEn || 'Untitled concept'}</span>
            </div>
            <div className="h-[600px] overflow-y-auto custom-scrollbar p-6 md:p-8">
              {markdownContent.trim() ? (
                <MarkdownPreview content={markdownContent} />
              ) : (
                <p className="text-sm text-[#6e7a94] italic">No markdown content yet — switch to the Editor tab to add some.</p>
              )}
            </div>
          </EnhancedCard>

          {/* Right: the real coding environment */}
          <div className="h-[640px] overflow-y-auto custom-scrollbar">
            <CodingEnvironment
              key={`preview-${previewNonce}`}
              starterCode={starterCode}
              language={editorLang}
              testCases={type === 'challenge' && testCases.length > 0 ? testCases : undefined}
              hints={type === 'challenge' && hints.length > 0 ? hints : undefined}
              solution={type === 'challenge' && solution.trim() ? solution : undefined}
            />
          </div>
        </div>
      ) : (
        /* ═══ EDITOR ═══ */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Form */}
          <div className="space-y-6">
            {/* Metadata */}
            <EnhancedCard padding="lg">
              <h3 className="text-sm font-bold text-[#f3f6ff] mb-4">Concept Details</h3>
              <div className="space-y-4">
                <BilingualInput
                  labelEn="Title (English)"
                  labelAr="العنوان (العربية)"
                  valueEn={titleEn}
                  valueAr={titleAr}
                  onChangeEn={setTitleEn}
                  onChangeAr={setTitleAr}
                  placeholder="e.g. Variables & Data Types"
                  required
                />

                {/* Type — the core choice; it reshapes the whole editor, so
                    it's a pair of prominent option cards rather than a toggle. */}
                <div>
                  <label className="block text-xs font-semibold text-[#9aa5bf] mb-2">Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('lesson')}
                      aria-pressed={type === 'lesson'}
                      className={`relative flex items-start gap-3 rounded-xl border p-3.5 text-start transition-all ${
                        type === 'lesson'
                          ? 'border-[#00a859]/50 bg-[#00a859]/10 ring-1 ring-[#00a859]/30'
                          : 'border-[#263248] bg-[#0a0f18] hover:border-[#354562] hover:bg-[#0e1626]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                          type === 'lesson' ? 'bg-[#00a859]/15 text-[#00a859]' : 'bg-[#121a2a] text-[#6e7a94]'
                        }`}
                      >
                        <BookOpen size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#f3f6ff]">Lesson</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-[#9aa5bf]">
                          Reading material with an interactive sandbox to try code.
                        </span>
                      </span>
                      {type === 'lesson' && <Check size={15} className="absolute top-3 end-3 text-[#00a859]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setType('challenge')}
                      aria-pressed={type === 'challenge'}
                      className={`relative flex items-start gap-3 rounded-xl border p-3.5 text-start transition-all ${
                        type === 'challenge'
                          ? 'border-[#f3a43a]/55 bg-[#f3a43a]/10 ring-1 ring-[#f3a43a]/30'
                          : 'border-[#263248] bg-[#0a0f18] hover:border-[#354562] hover:bg-[#0e1626]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                          type === 'challenge' ? 'bg-[#f3a43a]/15 text-[#f3a43a]' : 'bg-[#121a2a] text-[#6e7a94]'
                        }`}
                      >
                        <Trophy size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#f3f6ff]">Challenge</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-[#9aa5bf]">
                          Graded automatically against hidden test cases.
                        </span>
                      </span>
                      {type === 'challenge' && <Check size={15} className="absolute top-3 end-3 text-[#f3a43a]" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Slug</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] font-mono focus:outline-none focus:border-[#00a859]/50"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">Order</label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </EnhancedCard>

            {/* Markdown */}
            <EnhancedCard padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#f3f6ff]">
                  {type === 'challenge' ? 'Challenge' : 'Lesson'} Content (Markdown)
                </h3>
                <button
                  type="button"
                  onClick={insertMarkdownTemplate}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/25 hover:bg-[#a78bfa]/15 transition-all"
                >
                  <Wand2 size={12} /> {type === 'challenge' ? 'Challenge template' : 'Lesson template'}
                </button>
              </div>
              <MarkdownUploader
                value={markdownContent}
                onChange={setMarkdownContent}
                placeholder={'# Lesson Title\n\nContent here...'}
              />
            </EnhancedCard>

            {/* Starter Code */}
            <EnhancedCard padding="none" className="overflow-hidden">
              <div className="px-4 py-3 border-b border-[#263248] bg-[#0b1019] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6e7a94]">Starter Code</span>
                <button
                  type="button"
                  onClick={insertStarterTemplate}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/25 hover:bg-[#a78bfa]/15 transition-all"
                >
                  <Wand2 size={12} /> Insert scaffold
                </button>
              </div>
              <CodeEditor value={starterCode} onChange={setStarterCode} language={editorLang} minHeight="160px" />
            </EnhancedCard>

            {/* Challenge-specific */}
            {type === 'challenge' && (
              <>
                {/* Solution */}
                <EnhancedCard padding="none" className="overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#263248] bg-[#0b1019] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6e7a94]">Solution Code</span>
                    <button
                      type="button"
                      onClick={verifySolution}
                      disabled={verifying}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#00a859] bg-[#00a859]/10 border border-[#00a859]/25 hover:bg-[#00a859]/15 transition-all disabled:opacity-50"
                    >
                      {verifying ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      {verifying ? 'Running...' : 'Verify against tests'}
                    </button>
                  </div>
                  <CodeEditor value={solution} onChange={setSolution} language={editorLang} minHeight="140px" />
                  {verifyResults && (
                    <div className="border-t border-[#263248] divide-y divide-[#263248]/50">
                      {verifyResults.map((r) => (
                        <div key={r.id} className="flex items-start gap-2.5 px-4 py-2.5" dir="ltr">
                          {r.passed ? (
                            <CheckCircle2 size={13} className="text-[#00a859] mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle size={13} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-[#b4bcd0]">{r.description}</p>
                            {!r.passed && (
                              <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                                <p className="text-[#4d5a73]">
                                  Expected: <span className="text-[#00a859] whitespace-pre-wrap">{r.expected || '(empty)'}</span>
                                </p>
                                <p className="text-[#4d5a73]">
                                  Got: <span className="text-[#ef4444] whitespace-pre-wrap">{r.actual || '(empty)'}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </EnhancedCard>

                {/* Test Cases */}
                <EnhancedCard padding="lg">
                  <DynamicList<TestCase>
                    items={testCases}
                    onChange={setTestCases}
                    label="Test Cases"
                    addLabel="Add Test Case"
                    createItem={() => ({
                      id: `tc-${Date.now()}`,
                      description: '',
                      input: '',
                      expectedOutput: '',
                    })}
                    renderItem={(tc, _, onChange) => (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={tc.description}
                          onChange={(e) => onChange({ ...tc, description: e.target.value })}
                          placeholder="Test case description"
                          className="w-full bg-[#0d1117] border border-[#1e2a3d] rounded px-2.5 py-1.5 text-xs text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50"
                          dir="ltr"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#4d5a73] mb-1">
                              Stdin input (optional)
                            </label>
                            <textarea
                              value={tc.input || ''}
                              onChange={(e) => onChange({ ...tc, input: e.target.value })}
                              placeholder={'one value\nper line'}
                              rows={3}
                              className="w-full bg-[#0d1117] border border-[#1e2a3d] rounded px-2.5 py-1.5 text-xs text-[#d2d7e3] font-mono resize-y focus:outline-none focus:border-[#00a859]/50 custom-scrollbar"
                              spellCheck={false}
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#4d5a73] mb-1">
                              Expected output
                            </label>
                            <textarea
                              value={tc.expectedOutput}
                              onChange={(e) => onChange({ ...tc, expectedOutput: e.target.value })}
                              placeholder={'Exact output,\nline by line'}
                              rows={3}
                              className="w-full bg-[#0d1117] border border-[#1e2a3d] rounded px-2.5 py-1.5 text-xs text-[#d2d7e3] font-mono resize-y focus:outline-none focus:border-[#00a859]/50 custom-scrollbar"
                              spellCheck={false}
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </EnhancedCard>

                {/* Hints */}
                <EnhancedCard padding="lg">
                  <DynamicList<string>
                    items={hints}
                    onChange={setHints}
                    label="Hints"
                    addLabel="Add Hint"
                    createItem={() => ''}
                    renderItem={(hint, _, onChange) => (
                      <input
                        type="text"
                        value={hint}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Hint text..."
                        className="w-full bg-[#0d1117] border border-[#1e2a3d] rounded px-2.5 py-1.5 text-xs text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50"
                        dir="ltr"
                      />
                    )}
                  />
                </EnhancedCard>
              </>
            )}
          </div>

          {/* RIGHT: Preview */}
          <div className="space-y-4">
            <EnhancedCard padding="none" className="overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-[#263248] bg-[#0b1019] flex items-center gap-2">
                <Eye size={13} className="text-[#6e7a94]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#6e7a94]">Content Preview</span>
              </div>
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar p-6">
                <MarkdownPreview content={markdownContent} />
              </div>
            </EnhancedCard>
          </div>
        </div>
      )}
    </CreatorLayout>
  );
};

export default ProgrammingConceptEditor;
