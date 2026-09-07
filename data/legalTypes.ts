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

/**
 * A legal document in both languages.
 *
 * The English is the governing version — every one of these documents says so
 * in its own Language section, and the Arabic repeats it. So when the two drift,
 * the Arabic is what is wrong, and the fix is to re-translate rather than to
 * reconcile. Keep the `sections` arrays the same length and in the same order:
 * the page numbers them by index, so a section added to one and not the other
 * silently renumbers the translation.
 */
export interface BilingualDoc {
  en: LegalDoc;
  ar: LegalDoc;
}

export interface BilingualKeyPoints {
  en: LegalKeyPoint[];
  ar: LegalKeyPoint[];
}
