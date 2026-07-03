import React, { useState, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';
import type { ExecutionResult } from './PythonExecutor';
import { runCode, isRunnerReady } from './runners';
import type { TestCase } from '../../data/programming/types';

interface CodingEnvironmentProps {
  starterCode: string;
  language?: 'python' | 'cpp' | 'bash';
  testCases?: TestCase[];
  hints?: string[];
  solution?: string;
  onPass?: () => void;
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
  language = 'python',
  testCases,
  hints,
  solution,
  onPass,
}) => {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const isChallenge = testCases && testCases.length > 0;
  const allPassed = testResults?.every((t) => t.passed) ?? false;

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setTestResults(null);
    setOutput('');
    setError(undefined);
    if (!isRunnerReady(language)) setIsLoading(true);
    try {
      const result: ExecutionResult = await runCode(language, code);
      setOutput(result.output);
      setError(result.error);
      setDurationMs(result.durationMs);
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    } finally {
      setIsRunning(false);
      setIsLoading(false);
    }
  }, [code]);

  const handleSubmit = useCallback(async () => {
    if (!testCases?.length) return;
    setIsRunning(true);
    setOutput('');
    setError(undefined);
    setTestResults(null);
    if (!isRunnerReady(language)) setIsLoading(true);

    const results: TestResult[] = [];
    let lastOutput = '';
    try {
      for (const tc of testCases) {
        const result = await runCode(language, code, tc.input);
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
      setOutput(lastOutput);
      setTestResults(results);
      setIsRunning(false);
      setIsLoading(false);
      if (results.every((r) => r.passed)) onPass?.();
    }
  }, [code, testCases, onPass]);

  const handleReset = () => {
    setCode(starterCode);
    setOutput('');
    setError(undefined);
    setTestResults(null);
    setShowSolution(false);
    setRevealedHints(0);
  };

  const clearOutput = () => {
    setOutput('');
    setError(undefined);
    setTestResults(null);
  };

  const revealNextHint = () => {
    if (hints && revealedHints < hints.length) setRevealedHints((h) => h + 1);
  };

  return (
    <div className="flex flex-col h-full" dir="ltr">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0b1019] border border-[#151d2e] rounded-t-lg">
        <div className="flex items-center gap-2">
          {/* File tab */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080c14] border border-[#151d2e]">
            <span className="w-2 h-2 rounded-full bg-[#00a859]" />
            <span className="text-[11px] font-medium text-[#8390ac]">main.py</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[#4d5a73] hover:text-[#8390ac] hover:bg-[#0d1420] transition-colors"
            title="Reset to starter code"
          >
            <RotateCcw size={12} /> Reset
          </button>

          {isChallenge ? (
            <>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[#8390ac] bg-[#0d1420] border border-[#1e2a3d] hover:border-[#2a3a52] transition-colors disabled:opacity-40"
              >
                <Play size={12} /> Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold text-[#0d1117] bg-[#00a859] hover:bg-[#00934e] transition-colors disabled:opacity-40"
              >
                {isRunning ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Submit
              </button>
            </>
          ) : (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold text-[#0d1117] bg-[#00a859] hover:bg-[#00934e] transition-colors disabled:opacity-40"
            >
              {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              {isRunning ? (isLoading ? 'Loading Python...' : 'Running...') : 'Run'}
            </button>
          )}
        </div>
      </div>

      {/* ── Editor ── */}
      <div className="flex-1 min-h-0 overflow-hidden border-x border-[#151d2e]">
        <CodeEditor value={code} onChange={setCode} language={language} minHeight="100%" />
      </div>

      {/* ── Test Results ── */}
      {testResults && (
        <div className="border-x border-t border-[#151d2e] bg-[#0b1019]">
          <div className="px-3 py-2 border-b border-[#151d2e]">
            <div className="flex items-center gap-2">
              {allPassed ? (
                <>
                  <CheckCircle2 size={13} className="text-[#00a859]" />
                  <span className="text-[11px] font-bold text-[#00a859]">All tests passed</span>
                </>
              ) : (
                <>
                  <XCircle size={13} className="text-[#ef4444]" />
                  <span className="text-[11px] font-bold text-[#ef4444]">
                    {testResults.filter((t) => t.passed).length}/{testResults.length} tests passed
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="max-h-36 overflow-y-auto custom-scrollbar">
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
                      <p className="text-[#4d5a73]">
                        Expected: <span className="text-[#00a859]">{tr.expected || '(empty)'}</span>
                      </p>
                      <p className="text-[#4d5a73]">
                        Got: <span className="text-[#ef4444]">{tr.actual || '(empty)'}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Output Panel ── */}
      <div className="h-32 flex-shrink-0 border border-[#151d2e] rounded-b-lg overflow-hidden">
        <OutputPanel output={output} error={error} durationMs={durationMs} isRunning={isRunning} onClear={clearOutput} />
      </div>

      {/* ── Hints & Solution ── */}
      {isChallenge && (hints?.length || solution) && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {hints && hints.length > 0 && revealedHints < hints.length && (
            <button
              onClick={revealNextHint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[#f3a43a] bg-[#1a1608] border border-[#3d2e0a] hover:bg-[#231c0a] transition-colors"
            >
              <Lightbulb size={11} />
              Hint {revealedHints + 1}/{hints.length}
            </button>
          )}
          {solution && (
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[#6e7a94] bg-[#0d1420] border border-[#1e2a3d] hover:border-[#2a3a52] transition-colors"
            >
              <Eye size={11} />
              {showSolution ? 'Hide Solution' : 'Show Solution'}
            </button>
          )}
        </div>
      )}

      {revealedHints > 0 && hints && (
        <div className="mt-2 space-y-1">
          {hints.slice(0, revealedHints).map((hint, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded bg-[#1a1608]/50 border border-[#3d2e0a]/40">
              <ChevronRight size={11} className="text-[#f3a43a] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[#b4bcd0] leading-relaxed">{hint}</p>
            </div>
          ))}
        </div>
      )}

      {showSolution && solution && (
        <div className="mt-2 rounded-lg border border-[#1e2a3d] overflow-hidden">
          <div className="px-3 py-1.5 bg-[#0b1019] border-b border-[#1e2a3d]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5a73]">Solution</span>
          </div>
          <div className="pointer-events-none opacity-85">
            <CodeEditor value={solution} onChange={() => {}} language={language} readOnly />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingEnvironment;
