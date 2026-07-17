/* ─── Programming Fundamentals Data Types ─── */

export type SupportedLanguage = 'python' | 'cpp' | 'bash';

export type TestCase = {
  id: string;
  description: string;
  input?: string;
  expectedOutput: string;
};

export type ProgrammingConcept = {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  order: number;
  type: 'lesson' | 'challenge';
  markdownContent: string;
  starterCode: string;
  /**
   * Prefills the Run panel's stdin box for lessons whose starterCode calls
   * input(). Challenges feed stdin per test case instead (see TestCase.input).
   */
  sampleInput?: string;
  /** For challenges: test cases the user must pass */
  testCases?: TestCase[];
  /** Hints shown progressively when stuck */
  hints?: string[];
  /** Revealed after completion or on demand */
  solution?: string;
};

export type ProgrammingModule = {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  order: number;
  /** Optional YouTube video id shown at the top of every lesson in the module. */
  videoId?: string;
  concepts: ProgrammingConcept[];
};

export type ProgrammingLanguage = {
  id: string;
  slug: string;
  name: string;
  color: string;
  available: boolean;
  description: { en: string; ar: string };
  /** Optional cover art (raw SVG markup). Falls back to built-in code-window art. */
  coverSvg?: string;
  modules: ProgrammingModule[];
};
