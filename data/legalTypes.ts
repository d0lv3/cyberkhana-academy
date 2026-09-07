/** Shared shape for the rendered legal documents (Terms, Creator Agreement, Privacy). */
export interface LegalSection {
  h: string;
  /** Paragraphs. */
  body?: string[];
  /** Bulleted items rendered after the paragraphs. */
  list?: string[];
  /** Paragraphs rendered after the list. */
  after?: string[];
  /** Renders the section in the warning treatment. */
  emphasis?: boolean;
}

export interface LegalDoc {
  title: string;
  updated: string;
  version: string;
  intro: string;
  /** Optional highlighted panel above the numbered sections. */
  callout?: { heading: string; body: string[] };
  sections: LegalSection[];
}

/** One clause shown in an acceptance dialog before the confirm button. */
export interface LegalKeyPoint {
  title: string;
  text: string;
}
