import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  ChevronRight,
  Loader2,
  Keyboard,
  Copy,
  Check,
} from 'lucide-react';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';
import ResizeHandle from '../ui/ResizeHandle';
import { copyText } from '../ui/copyText';
import type { ExecutionResult } from './PythonExecutor';
import { runCode, isRunnerReady, warmUpRunner, type RunnerLanguage, type LoadProgress } from './runners';
import type { TestCase } from '../../data/programming/types';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { codeDraftKey, readCodeDraft, writeCodeDraft, clearCodeDraft } from '../../services/codeDrafts';
import { confirmDialog } from '../ui/ConfirmHost';

interface CodingEnvironmentProps {
  starterCode: string;
  /** Stable lesson identity; creator previews deliberately do not save drafts. */
  draftId?: string;
  language?: RunnerLanguage;
  /** Prefills the stdin box for lessons that read input(). */
  sampleInput?: string;
  testCases?: TestCase[];
  hints?: string[];
  solution?: string;
  /** Every test passed. Given what the code printed for each test, in the
   *  tests' order, which the server compares before recording a challenge. */
  onPass?: (outputs: string[]) => void;
}

/** Does this snippet read from stdin? Decides whether to offer the input box. */
function readsInput(code: string, language: string): boolean {
  if (language === 'python') return /(^|[^\w.])input\s*\(/m.test(code);
  if (language === 'c' || language === 'cpp') return /\b(cin|getline|scanf|gets|fgets)\b/.test(code);
  return /\bread\b|\$\(cat\)/.test(code);
}

const FILE_NAMES: Record<string, string> = {
  python: 'main.py',
  c: 'main.c',
  cpp: 'main.cpp',
  bash: 'main.sh',
};

/* Said only on the first Run of a session, while the runtime is fetched.
   C and C++ fetch a compiler, which is the longest of these by far. */
const LOADING_LABEL: Record<string, string> = {
  python: 'Loading Python...',
  c: 'Loading compiler...',
  cpp: 'Loading compiler...',
  bash: 'Loading...',
};

/* ── Resizable panels ──
 *
 * The editor takes whatever space the panels below it leave, so giving the
 * output a height is all that is needed to make the split draggable: pull the
 * handle up and the output grows while the editor gives way.
 *
 * Heights are remembered across lessons. The lesson page remounts this
 * component for every concept (key={concept.id}), so without storing them a
 * student who wants a tall output pane would have to drag it open again on
 * every single page. */
const PANEL_MIN_PX = 56;
const PANEL_MAX_FRACTION = 0.7;
const DEFAULTS = { output: 128, tests: 144, stdin: 64 };

type PanelName = keyof typeof DEFAULTS;

const storageKey = (panel: PanelName) => `ck.editorPanel.${panel}`;

function usePanelHeight(panel: PanelName) {
  const [height, setHeight] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey(panel)));
      return Number.isFinite(saved) && saved >= PANEL_MIN_PX ? saved : DEFAULTS[panel];
    } catch {
      // Private browsing and blocked site data both throw here; the default is fine.
      return DEFAULTS[panel];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(panel), String(height));
    } catch {
      /* Not being able to remember the size is not worth interrupting anyone over. */
    }
  }, [panel, height]);

  return [height, setHeight] as const;
}

type TestResult = {
  id: string;
  passed: boolean;
  expected: string;
  actual: string;
  description: string;
};

const CodingEnvironment: React.FC<CodingEnvironmentProps> = ({
  starterCode,
  draftId,
  language = 'python',
  sampleInput,
  testCases,
  hints,
  solution,
  onPass,
}) => {
  const { t, isArabic } = useLang();
  const { user } = useAuth();
  const draftKey = user && draftId ? codeDraftKey(user._id, draftId) : null;
  const [restoredDraft] = useState(() => readCodeDraft(draftKey));
  const [code, setCode] = useState(restoredDraft?.code ?? starterCode);
  const [stdin, setStdin] = useState(restoredDraft?.stdin ?? sampleInput ?? '');
  const [draftSaved, setDraftSaved] = useState<boolean | null>(restoredDraft ? true : null);

  const changeCode = (next: string) => {
    if (draftKey) setDraftSaved(writeCodeDraft(draftKey, { code: next, stdin }));
    setCode(next);
  };
  const changeStdin = (next: string) => {
    if (draftKey) setDraftSaved(writeCodeDraft(draftKey, { code, stdin: next }));
    setStdin(next);
  };
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [compilerProgress, setCompilerProgress] = useState<LoadProgress | null>(null);
  const activeRun = useRef<AbortController | null>(null);
  useEffect(() => () => activeRun.current?.abort(), []);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionCopied, setSolutionCopied] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const [outputHeight, setOutputHeight] = usePanelHeight('output');
  const [testsHeight, setTestsHeight] = usePanelHeight('tests');
  const [stdinHeight, setStdinHeight] = usePanelHeight('stdin');

  /* Fetch the runtime while the lesson is being read, so the first Run does
     not wait on it. Skipped when the browser asks to save data: then it is
     fetched on the first Run, as before. */
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!saveData) warmUpRunner(language);
  }, [language]);

  const isChallenge = testCases && testCases.length > 0;
  const allPassed = testResults?.every((t) => t.passed) ?? false;

  /* Capped at a fraction of the workspace so a panel can never swallow the
     editor whole; the editor keeps its own min-height as a second guard. */
  const resizer = useCallback(
    (setHeight: (fn: (h: number) => number) => void) => (deltaY: number) => {
      const max = Math.max(PANEL_MIN_PX, (shellRef.current?.clientHeight ?? 0) * PANEL_MAX_FRACTION);
      setHeight((h) => Math.min(max, Math.max(PANEL_MIN_PX, h + deltaY)));
    },
    []
  );

  const handleRun = useCallback(async () => {
    const controller = new AbortController();
    activeRun.current = controller;
    setCompilerProgress(null);
    setIsRunning(true);
    setTestResults(null);
    setOutput('');
    setError(undefined);
    if (!isRunnerReady(language)) setIsLoading(true);
    try {
      // Only feed stdin when the code actually reads it, so an unused box
      // can't change how a snippet behaves.
      const result: ExecutionResult = await runCode(
        language,
        code,
        readsInput(code, language) ? stdin : undefined,
        { signal: controller.signal, onProgress: (progress) => {
          if (activeRun.current !== controller) return;
          setCompilerProgress(progress);
          setIsLoading(progress.phase === 'downloading' || progress.phase === 'starting');
        } }
      );
      if (activeRun.current !== controller) return;
      setOutput(result.output);
      setError(result.error);
      setDurationMs(result.durationMs);
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    } finally {
      if (activeRun.current === controller) {
        if (controller.signal.aborted) setError(isArabic ? 'أُلغي التشغيل. الكود ما زال موجودًا، ويمكنك التشغيل مجددًا.' : 'Run cancelled. Your code is still here; run again to retry.');
        activeRun.current = null;
        setIsRunning(false);
        setIsLoading(false);
      }
    }
  }, [code, language, stdin, isArabic]);

  const handleSubmit = useCallback(async () => {
    if (!testCases?.length) return;
    const controller = new AbortController();
    activeRun.current = controller;
    setCompilerProgress(null);
    setIsRunning(true);
    setOutput('');
    setError(undefined);
    setTestResults(null);
    if (!isRunnerReady(language)) setIsLoading(true);

    const results: TestResult[] = [];
    const outputs: string[] = [];
    let lastOutput = '';
    try {
      for (const tc of testCases) {
        controller.signal.throwIfAborted();
        const result = await runCode(language, code, tc.input, {
          signal: controller.signal, onProgress: (progress) => {
            if (activeRun.current !== controller) return;
            setCompilerProgress(progress);
            setIsLoading(progress.phase === 'downloading' || progress.phase === 'starting');
          },
        });
        outputs.push(result.output);
        const actual = result.output.trimEnd();
        const expected = tc.expectedOutput.trimEnd();
        lastOutput = result.output;
        results.push({ id: tc.id, passed: actual === expected, expected, actual, description: tc.description });
        if (result.error) {
          setError(result.error);
          setDurationMs(result.durationMs);
          for (const remaining of testCases.slice(results.length)) {
            results.push({ id: remaining.id, passed: false, expected: remaining.expectedOutput.trimEnd(), actual: '(error)', description: remaining.description });
          }
          break;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    } finally {
      if (activeRun.current !== controller) return;
      setOutput(lastOutput);
      setTestResults(controller.signal.aborted ? null : results);
      setIsRunning(false);
      setIsLoading(false);
      if (controller.signal.aborted) setError(isArabic ? 'أُلغي التشغيل. الكود ما زال موجودًا، ويمكنك التشغيل مجددًا.' : 'Run cancelled. Your code is still here; run again to retry.');
      else if (results.length === testCases.length && results.every((r) => r.passed)) onPass?.(outputs);
      activeRun.current = null;
    }
  }, [code, language, testCases, onPass, isArabic]);

  const handleReset = async () => {
    if ((code !== starterCode || stdin !== (sampleInput ?? '')) && !(await confirmDialog({
      title: isArabic ? 'إعادة ضبط الكود؟' : 'Reset your code?',
      message: isArabic ? 'سيُستبدل عملك بالكود الأولي لهذا الدرس.' : 'This replaces your work with this lesson’s starter code.',
      confirmLabel: isArabic ? 'إعادة الضبط' : 'Reset code',
      cancelLabel: isArabic ? 'احتفظ بعملي' : 'Keep my work',
    }))) return;
    clearCodeDraft(draftKey);
    setDraftSaved(null);
    setCode(starterCode);
    setStdin(sampleInput ?? '');
    setOutput('');
    setError(undefined);
    setTestResults(null);
    setShowSolution(false);
    setRevealedHints(0);
  };

  const copySolution = async () => {
    if (!solution || !(await copyText(solution))) return;
    setSolutionCopied(true);
    window.setTimeout(() => setSolutionCopied(false), 1600);
  };

  const clearOutput = () => {
    setOutput('');
    setError(undefined);
    setTestResults(null);
  };

  const revealNextHint = () => {
    if (hints && revealedHints < hints.length) setRevealedHints((h) => h + 1);
  };

  const showStdin = readsInput(code, language) && !isChallenge;

  return (
    <div ref={shellRef} className="flex flex-col h-full" dir="ltr">

      {/* ── Toolbar ── */}
      <div className="coding-toolbar flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0b1019] border border-[#151d2e] rounded-t-lg">
        <div className="flex items-center gap-2">
          {/* File tab */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080c14] border border-[#151d2e]">
            <span className="w-2 h-2 rounded-full bg-[#00a859]" />
            <span className="text-[11px] font-medium text-[#8390ac]">
              {FILE_NAMES[language] ?? 'main.txt'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isRunning && (language === 'c' || language === 'cpp') && (
            <button type="button" onClick={() => activeRun.current?.abort()}
              className="rounded px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/10">
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
          )}
          <button
            onClick={() => void handleReset()}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[#7c8aa6] hover:text-[#8390ac] hover:bg-[#0d1420] transition-colors"
            title={t('lab.resetTitle')}
          >
            <RotateCcw size={12} /> {t('lab.reset')}
          </button>

          {isChallenge ? (
            <>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[#8390ac] bg-[#0d1420] border border-[#1e2a3d] hover:border-[#2a3a52] transition-colors disabled:opacity-40"
              >
                <Play size={12} /> {t('lab.run')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold text-[#0d1117] bg-[#00a859] hover:bg-[#00934e] transition-colors disabled:opacity-40"
              >
                {isRunning ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {t('lab.submit')}
              </button>
            </>
          ) : (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold text-[#0d1117] bg-[#00a859] hover:bg-[#00934e] transition-colors disabled:opacity-40"
            >
              {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              {isRunning ? (isLoading ? LOADING_LABEL[language] ?? t('common.loading') : t('lab.running')) : t('lab.run')}
            </button>
          )}
        </div>
      </div>

      {isRunning && compilerProgress && compilerProgress.phase !== 'ready' && (
        <div role="status" className="flex-shrink-0 border-x border-[#151d2e] bg-[#0b1019] px-3 py-3">
          <p className="text-xs text-[#9aa5bf]" dir={isArabic ? 'rtl' : 'ltr'}>
            {compilerProgress.phase === 'downloading'
              ? isArabic ? 'تنزيل ملفات المترجم، يلزم ذلك عند التشغيل الأول…' : 'Downloading compiler files for the first run…'
              : compilerProgress.phase === 'starting'
                ? isArabic ? 'جارٍ بدء المترجم…' : 'Starting the compiler…'
                : isArabic ? 'جارٍ ترجمة الكود…' : 'Compiling your code…'}
          </p>
          {compilerProgress.phase === 'downloading' && typeof compilerProgress.fraction === 'number' && (
            <div className="mt-2 flex items-center gap-2">
              <progress aria-label={isArabic ? 'تنزيل ملفات المترجم' : 'Compiler download'} max={1} value={compilerProgress.fraction} className="h-2 flex-1 accent-[#00a859]" />
              <span className="text-xs tabular-nums text-[#9aa5bf]">{Math.round(compilerProgress.fraction * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {draftSaved !== null && (
        <p role="status" dir={isArabic ? 'rtl' : 'ltr'} className={`flex-shrink-0 border-x border-[#151d2e] px-3 py-1.5 text-[11px] ${draftSaved ? 'text-[#8592ad]' : 'text-[#f3a43a]'}`}>
          {draftSaved
            ? isArabic ? 'الكود محفوظ على هذا الجهاز' : 'Code saved on this device'
            : isArabic ? 'تعذّر حفظ الكود في هذا المتصفح. انسخ عملك قبل المغادرة.' : 'This browser couldn’t save your code. Copy your work before leaving.'}
        </p>
      )}

      {/* ── Editor ──
           height="100%" rather than a min-height: it is what gives CodeMirror a
           scroller of its own, so long files scroll here instead of running off
           the bottom of a clipped box. */}
      <div className="flex-1 min-h-[6rem] overflow-hidden border-x border-[#151d2e]">
        <CodeEditor value={code} onChange={changeCode} language={language} height="100%" />
      </div>

      {/* ── Input (stdin) — only for code that reads it. Challenges feed their
           own input per test case, so this is for the Run button on lessons. ── */}
      {showStdin && (
        <>
          <ResizeHandle
            label={t('lab.inputPanel')}
            onResize={resizer(setStdinHeight)}
            onReset={() => setStdinHeight(DEFAULTS.stdin)}
          />
          <div className="flex-shrink-0 border-x border-[#151d2e] bg-[#0b1019]">
            <label
              htmlFor="stdin-box"
              className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-[#8390ac]"
            >
              <Keyboard size={12} className="text-[#7c8aa6]" />
              {t('lab.input')}
              <span className="text-[#7c8aa6]">{t('lab.inputHint')}</span>
            </label>
            <textarea
              id="stdin-box"
              value={stdin}
              onChange={(e) => changeStdin(e.target.value)}
              spellCheck={false}
              dir="ltr"
              style={{ height: stdinHeight }}
              placeholder={t('lab.inputPlaceholder')}
              className="w-full resize-none bg-[#080c14] px-3 py-2 font-mono text-xs text-[#d2d7e3] placeholder:text-[#7c8aa6] focus:outline-none custom-scrollbar"
            />
          </div>
        </>
      )}

      {/* ── Test Results ── */}
      {testResults && (
        <>
          <ResizeHandle
            label={t('lab.testsPanel')}
            onResize={resizer(setTestsHeight)}
            onReset={() => setTestsHeight(DEFAULTS.tests)}
          />
          <div className="flex-shrink-0 border-x border-[#151d2e] bg-[#0b1019]">
            <div className="px-3 py-2 border-b border-[#151d2e]">
              <div className="flex items-center gap-2">
                {allPassed ? (
                  <>
                    <CheckCircle2 size={13} className="text-[#00a859]" />
                    <span className="text-[11px] font-bold text-[#00a859]">{t('lab.allTestsPassed')}</span>
                  </>
                ) : (
                  <>
                    <XCircle size={13} className="text-[#ef4444]" />
                    <span className="text-[11px] font-bold text-[#ef4444]">
                      {testResults.filter((r) => r.passed).length}/{testResults.length} {t('lab.testsPassed')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div style={{ height: testsHeight }} className="overflow-y-auto custom-scrollbar">
              {testResults.map((tr) => (
                <div
                  key={tr.id}
                  className={`flex items-start gap-2.5 px-3 py-2 border-b border-[#151d2e]/60 ${
                    tr.passed ? '' : 'bg-[#1a0a0a]/20'
                  }`}
                >
                  {tr.passed ? (
                    <CheckCircle2 size={12} className="text-[#00a859] mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={12} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#b4bcd0]">{tr.description}</p>
                    {!tr.passed && (
                      <div className="mt-1.5 space-y-0.5 text-[10px] font-mono">
                        <p className="text-[#7c8aa6]">
                          {t('lab.expected')}: <span className="text-[#00a859]">{tr.expected || t('lab.emptyValue')}</span>
                        </p>
                        <p className="text-[#7c8aa6]">
                          {t('lab.got')}: <span className="text-[#ef4444]">{tr.actual || t('lab.emptyValue')}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Output Panel ── */}
      <ResizeHandle
        label={t('lab.outputPanel')}
        onResize={resizer(setOutputHeight)}
        onReset={() => setOutputHeight(DEFAULTS.output)}
      />
      <div
        style={{ height: outputHeight }}
        className="flex-shrink-0 border border-[#151d2e] rounded-b-lg overflow-hidden"
      >
        <OutputPanel output={output} error={error} durationMs={durationMs} isRunning={isRunning} onClear={clearOutput} />
      </div>

      {/* ── Hints & Solution ── */}
      {isChallenge && (hints?.length || solution) && (
        <div className="flex items-center gap-2 mt-3 flex-wrap flex-shrink-0">
          {hints && hints.length > 0 && revealedHints < hints.length && (
            <button
              onClick={revealNextHint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[#f3a43a] bg-[#1a1608] border border-[#3d2e0a] hover:bg-[#231c0a] transition-colors"
            >
              <Lightbulb size={11} />
              {t('lab.hint')} {revealedHints + 1}/{hints.length}
            </button>
          )}
          {solution && (
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[#8592ad] bg-[#0d1420] border border-[#1e2a3d] hover:border-[#2a3a52] transition-colors"
            >
              <Eye size={11} />
              {showSolution ? t('lab.hideSolution') : t('lab.showSolution')}
            </button>
          )}
        </div>
      )}

      {revealedHints > 0 && hints && (
        <div className="mt-2 space-y-1 flex-shrink-0">
          {hints.slice(0, revealedHints).map((hint, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded bg-[#1a1608]/50 border border-[#3d2e0a]/40">
              <ChevronRight size={11} className="text-[#f3a43a] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[#b4bcd0] leading-relaxed">{hint}</p>
            </div>
          ))}
        </div>
      )}

      {showSolution && solution && (
        <div className="mt-2 rounded-lg border border-[#1e2a3d] overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0b1019] border-b border-[#1e2a3d]">
            <span className={`text-[10px] font-bold text-[#7c8aa6] ${isArabic ? '' : 'uppercase tracking-wider'}`}>{t('lab.solution')}</span>
            <button
              type="button"
              onClick={copySolution}
              aria-label={solutionCopied ? t('lab.copied') : t('lab.copySolution')}
              className={`inline-flex items-center gap-1 rounded border px-2 py-1 touch:min-h-tap touch:px-3 text-[11px] font-medium transition-colors ${
                solutionCopied
                  ? 'border-[#00a859]/45 bg-[#00a859]/15 text-[#00a859]'
                  : 'border-[#1e2a3d] bg-[#0d1420] text-[#8592ad] hover:border-[#2a3a52] hover:text-[#d2d7e3]'
              }`}
            >
              {solutionCopied ? <Check size={11} /> : <Copy size={11} />}
              {solutionCopied ? t('lab.copied') : t('lab.copy')}
            </button>
          </div>
          {/* Read-only, but still a thing to select from and copy out of. */}
          <div className="opacity-85">
            <CodeEditor value={solution} onChange={() => {}} language={language} readOnly />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingEnvironment;
