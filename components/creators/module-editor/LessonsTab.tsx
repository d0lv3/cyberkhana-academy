import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  Film,
  HelpCircle,
  Info,
  ListTree,
  MousePointerClick,
  Plus,
  Trash2,
} from 'lucide-react';
import EnhancedCard from '../../ui/EnhancedCard';
import LocalizedMarkdownField from './LocalizedMarkdownField';
import MarkdownPreview from '../MarkdownPreview';
import QuizEditor from '../QuizEditor';
import {
  toLocalizedMarkdown,
  type CreatorModuleChapter,
  type CreatorModuleSection,
} from '../../../services/creatorTypes';
import { exactText, isFallback, otherLang, pairOf, pickText, type Lang } from '../../../services/contentLang';
import { lessonState, quizLacks } from '../../../services/moduleLocalize';
import { fieldCls, isBilingual, labelCls, LangTag, LocalizedInput, MissingMark, nativeName, useTr, type EditingLanguage } from './fields';

export interface LessonSelection {
  ci: number;
  si: number;
}

interface LessonsTabProps {
  chapters: CreatorModuleChapter[];
  setChapters: React.Dispatch<React.SetStateAction<CreatorModuleChapter[]>>;
  selected: LessonSelection | null;
  onSelect: (selection: LessonSelection | null) => void;
  editing: EditingLanguage;
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/* A new chapter or lesson starts with no name in either language. The names
   the editor used to put there ("New Section") were English, were saved, and
   reached learners of modules written in Arabic. */
export const newSection = (): CreatorModuleSection => ({
  id: uid('sec'),
  title: '',
  titleAr: '',
  subtitle: '',
  subtitleAr: '',
  videoId: '',
  markdownContent: { en: '', ar: '' },
});

export const newChapter = (): CreatorModuleChapter => ({ id: uid('ch'), title: '', titleAr: '', sections: [newSection()] });

const iconBtn =
  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[#7c8aa6] transition-colors hover:bg-[#182235] hover:text-[#d2d7e3] disabled:opacity-20 disabled:hover:bg-transparent';

/**
 * The Lessons tab of the module editor: the outline on one side, the lesson
 * being written on the other.
 *
 * Everything here is in the language the editor is on (ContentLanguageBar).
 * The outline marks what that language still lacks, and the preview at the
 * bottom is the lesson as a learner reading in that language gets it, with a
 * line saying so wherever they would be shown the other language instead.
 */
const LessonsTab: React.FC<LessonsTabProps> = ({ chapters, setChapters, selected, onSelect, editing }) => {
  const tr = useTr();
  const { lang } = editing;
  const other = otherLang(lang);
  const bilingual = isBilingual(editing);
  const totalLessons = chapters.reduce((sum, c) => sum + c.sections.length, 0);
  const slot = lang === 'ar' ? 'titleAr' : 'title';

  /* ── Structure ── */
  const addChapter = () => {
    setChapters((prev) => [...prev, newChapter()]);
    onSelect({ ci: chapters.length, si: 0 });
  };
  const removeChapter = (ci: number) => {
    setChapters((prev) => prev.filter((_, i) => i !== ci));
    onSelect(null);
  };
  const moveChapter = (ci: number, dir: -1 | 1) => {
    setChapters((prev) => {
      const next = [...prev];
      const t = ci + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[ci], next[t]] = [next[t], next[ci]];
      return next;
    });
    onSelect(null);
  };
  const setChapterName = (ci: number, name: string) =>
    setChapters((prev) => prev.map((c, i) => (i === ci ? { ...c, [slot]: name } : c)));

  const addSection = (ci: number) => {
    setChapters((prev) => prev.map((c, i) => (i === ci ? { ...c, sections: [...c.sections, newSection()] } : c)));
    onSelect({ ci, si: chapters[ci].sections.length });
  };
  const removeSection = (ci: number, si: number) => {
    setChapters((prev) => prev.map((c, i) => (i === ci ? { ...c, sections: c.sections.filter((_, j) => j !== si) } : c)));
    onSelect(null);
  };
  const moveSection = (ci: number, si: number, dir: -1 | 1) => {
    const t = si + dir;
    if (t < 0 || t >= chapters[ci].sections.length) return;
    setChapters((prev) =>
      prev.map((c, i) => {
        if (i !== ci) return c;
        const sections = [...c.sections];
        [sections[si], sections[t]] = [sections[t], sections[si]];
        return { ...c, sections };
      })
    );
    onSelect({ ci, si: t });
  };
  const updateSection = (ci: number, si: number, patch: Partial<CreatorModuleSection>) =>
    setChapters((prev) =>
      prev.map((c, i) => (i === ci ? { ...c, sections: c.sections.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : c))
    );

  const active = selected ? chapters[selected.ci]?.sections[selected.si] : undefined;
  const missingIn = (l: Lang) => (l === 'ar' ? tr('No Arabic', 'بلا عربية') : tr('No English', 'بلا إنجليزية'));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ── Outline ── */}
      <EnhancedCard padding="none" className="self-start overflow-hidden lg:sticky lg:top-4 lg:col-span-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#263248] bg-[#0b1019] px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-[#f3f6ff]">
            <ListTree size={15} className="text-[#f3a43a]" aria-hidden="true" />
            {tr('Chapters and lessons', 'الفصول والدروس')}
          </span>
          <span className="text-xs text-[#8592ad]">
            {tr(
              `${chapters.length} ${chapters.length === 1 ? 'chapter' : 'chapters'}, ${totalLessons} ${totalLessons === 1 ? 'lesson' : 'lessons'}`,
              `الفصول: ${chapters.length}، الدروس: ${totalLessons}`
            )}
          </span>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-3 custom-scrollbar">
          {chapters.map((ch, ci) => {
            const name = pairOf(ch.title, ch.titleAr);
            const nameMissing = bilingual && isFallback(name, lang);
            return (
              <div key={ch.id} className="rounded-lg border border-[#263248] bg-[#0d1117]">
                <div className="flex items-center gap-1.5 border-b border-[#263248] px-2 py-1.5">
                  <span className="w-5 flex-shrink-0 text-center text-[10px] font-bold text-[#8592ad]" aria-hidden="true">
                    {ci + 1}
                  </span>
                  <input
                    value={name[lang]}
                    onChange={(e) => setChapterName(ci, e.target.value)}
                    aria-label={tr(`Name of chapter ${ci + 1}`, `اسم الفصل ${ci + 1}`)}
                    placeholder={exactText(name, other) || tr('Chapter name', 'اسم الفصل')}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    lang={lang}
                    className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-xs font-bold text-[#f3f6ff] placeholder:font-normal placeholder:text-[#7c8aa6] hover:border-[#263248] focus:border-[#00a859]/50 focus:outline-none"
                  />
                  {nameMissing && (
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#f3a43a]"
                      title={missingIn(lang)}
                      role="img"
                      aria-label={missingIn(lang)}
                    />
                  )}
                  <button type="button" onClick={() => moveChapter(ci, -1)} disabled={ci === 0} className={iconBtn} aria-label={tr('Move chapter up', 'انقل الفصل للأعلى')}>
                    <ArrowUp size={12} />
                  </button>
                  <button type="button" onClick={() => moveChapter(ci, 1)} disabled={ci === chapters.length - 1} className={iconBtn} aria-label={tr('Move chapter down', 'انقل الفصل للأسفل')}>
                    <ArrowDown size={12} />
                  </button>
                  <button type="button" onClick={() => removeChapter(ci)} className={`${iconBtn} hover:text-red-400`} aria-label={tr('Delete chapter', 'احذف الفصل')}>
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="space-y-0.5 p-1.5">
                  {ch.sections.map((s, si) => {
                    const isActive = selected?.ci === ci && selected?.si === si;
                    const title = pairOf(s.title, s.titleAr);
                    const own = exactText(title, lang);
                    const borrowed = own ? '' : exactText(title, other);
                    const state = bilingual ? lessonState(s, lang) : 'done';
                    return (
                      <div
                        key={s.id}
                        className={`group flex items-center gap-0.5 rounded-md border transition-colors ${
                          isActive ? 'border-[#00a859]/25 bg-[#00a859]/10' : 'border-transparent hover:bg-[#182235]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelect({ ci, si })}
                          aria-current={isActive ? 'true' : undefined}
                          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/60"
                        >
                          {s.videoId ? (
                            <Film size={12} className="flex-shrink-0 text-[#60a5fa]" aria-hidden="true" />
                          ) : (
                            <FileText size={12} className="flex-shrink-0 text-[#8592ad]" aria-hidden="true" />
                          )}
                          <span
                            className={`min-w-0 flex-1 truncate text-xs ${
                              own
                                ? isActive ? 'font-semibold text-[#f3f6ff]' : 'text-[#c4cad6]'
                                : 'italic text-[#7c8aa6]'
                            }`}
                          >
                            <bdi>{own || borrowed || tr('Untitled lesson', 'درس بلا عنوان')}</bdi>
                          </span>
                          {state === 'none' && (
                            <span className="flex-shrink-0 rounded-full border border-[#f3a43a]/30 bg-[#f3a43a]/10 px-1.5 py-px text-[10px] font-semibold text-[#f3a43a]">
                              {missingIn(lang)}
                            </span>
                          )}
                          {state === 'partial' && (
                            <span className="flex-shrink-0 rounded-full border border-[#f3a43a]/30 px-1.5 py-px text-[10px] font-semibold text-[#f3a43a]">
                              {tr('Partly', 'جزئيًا')}
                            </span>
                          )}
                        </button>
                        <div className="flex flex-shrink-0 items-center pe-1 opacity-60 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <button type="button" onClick={() => moveSection(ci, si, -1)} disabled={si === 0} className={iconBtn} aria-label={tr('Move lesson up', 'انقل الدرس للأعلى')}>
                            <ArrowUp size={11} />
                          </button>
                          <button type="button" onClick={() => moveSection(ci, si, 1)} disabled={si === ch.sections.length - 1} className={iconBtn} aria-label={tr('Move lesson down', 'انقل الدرس للأسفل')}>
                            <ArrowDown size={11} />
                          </button>
                          <button type="button" onClick={() => removeSection(ci, si)} className={`${iconBtn} hover:text-red-400`} aria-label={tr('Delete lesson', 'احذف الدرس')}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => addSection(ci)}
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-[#8592ad] transition-colors hover:text-[#00a859]"
                  >
                    <Plus size={12} /> {tr('Add a lesson', 'أضف درسًا')}
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addChapter}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#263248] bg-[#0d1420] px-3 py-2 text-xs font-medium text-[#8592ad] transition-all hover:border-[#f3a43a]/40 hover:text-[#f3a43a]"
          >
            <Plus size={13} /> {tr('Add a chapter', 'أضف فصلًا')}
          </button>
        </div>
      </EnhancedCard>

      {/* ── The lesson being written ── */}
      <div className="min-w-0 space-y-4 lg:col-span-8">
        {active && selected ? (
          <LessonEditor
            key={active.id}
            section={active}
            editing={editing}
            onChange={(patch) => updateSection(selected.ci, selected.si, patch)}
          />
        ) : (
          <EnhancedCard padding="xl" className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#263248] bg-[#121a2a]">
              <MousePointerClick size={20} className="text-[#7c8aa6]" aria-hidden="true" />
            </div>
            <p className="text-sm text-[#8592ad]">{tr('Choose a lesson to write it.', 'اختر درسًا لتكتبه.')}</p>
          </EnhancedCard>
        )}
      </div>
    </div>
  );
};

/* ── One lesson ── */

const LessonEditor: React.FC<{
  section: CreatorModuleSection;
  editing: EditingLanguage;
  onChange: (patch: Partial<CreatorModuleSection>) => void;
}> = ({ section, editing, onChange }) => {
  const tr = useTr();
  const { lang } = editing;
  const bilingual = isBilingual(editing);
  const body = toLocalizedMarkdown(section.markdownContent);
  const title = pairOf(section.title, section.titleAr);
  const subtitle = pairOf(section.subtitle, section.subtitleAr);
  const quizMissing = bilingual && quizLacks(section.quiz, lang);

  /* What a learner reading in this language is shown. In a module written in
     both, whatever this language lacks comes from the other one. */
  const shown = (pair: { en: string; ar: string }) => (bilingual ? pickText(pair, lang) : exactText(pair, lang));
  const borrowed: string[] = [];
  if (bilingual) {
    if (isFallback(title, lang)) borrowed.push(tr('the title', 'العنوان'));
    if (isFallback(subtitle, lang)) borrowed.push(tr('the subtitle', 'العنوان الفرعي'));
    if (isFallback(body, lang)) borrowed.push(tr('the lesson text', 'نص الدرس'));
  }
  const previewTitle = shown(title);
  const previewSubtitle = shown(subtitle);
  const previewBody = shown(body);

  return (
    <>
      <EnhancedCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={15} className="text-[#00a859]" aria-hidden="true" />
          <h3 className="text-sm font-bold text-[#f3f6ff]">{tr('Lesson', 'الدرس')}</h3>
          {bilingual && <LangTag lang={lang} className="ms-1" />}
        </div>
        <div className="space-y-4">
          <LocalizedInput
            label={tr('Lesson title', 'عنوان الدرس')}
            value={title}
            onChange={(next) => onChange({ title: next.en, titleAr: next.ar })}
            editing={editing}
            required
            placeholder={{ en: 'What a port scan tells you', ar: 'ماذا يخبرك فحص المنافذ' }}
          />
          <LocalizedInput
            label={tr('Subtitle (optional)', 'العنوان الفرعي (اختياري)')}
            value={subtitle}
            onChange={(next) => onChange({ subtitle: next.en, subtitleAr: next.ar })}
            editing={editing}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={`${labelCls} mb-1.5`}>{tr('YouTube video ID (optional)', 'معرّف فيديو يوتيوب (اختياري)')}</label>
              <input
                value={section.videoId || ''}
                onChange={(e) => onChange({ videoId: e.target.value })}
                placeholder="dQw4w9WgXcQ"
                className={`${fieldCls} font-mono`}
                dir="ltr"
              />
            </div>
            {section.videoId && (
              <div>
                <label className={`${labelCls} mb-1.5`}>{tr('Video length in minutes', 'مدة الفيديو بالدقائق')}</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  step={1}
                  value={section.videoMinutes ?? ''}
                  onChange={(e) =>
                    onChange({
                      videoMinutes: e.target.value
                        ? Math.min(180, Math.max(0, Math.round(Number(e.target.value)) || 0)) || undefined
                        : undefined,
                    })
                  }
                  placeholder="12"
                  className={fieldCls}
                  dir="ltr"
                />
              </div>
            )}
          </div>
          {section.videoId && (
            <p className="-mt-2 text-[11px] text-[#8592ad]">
              {tr(
                'Students earn XP for the time they spend watching. Without a length, the video counts as 4 minutes.',
                'يكسب الطلاب نقاط الخبرة عن وقت المشاهدة. إن لم تُحدَّد المدة يُحتسب الفيديو 4 دقائق.'
              )}
            </p>
          )}

          <LocalizedMarkdownField
            label={tr('Lesson text', 'نص الدرس')}
            value={body}
            onChange={(markdownContent) => onChange({ markdownContent })}
            editing={editing}
            placeholder={{ en: '## Heading\n\nExplain the topic here...', ar: '## عنوان الفقرة\n\nاشرح الموضوع هنا...' }}
          />
        </div>
      </EnhancedCard>

      {/* ── Quiz ── */}
      <EnhancedCard padding="lg">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle size={15} className="text-[#9fef00]" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#f3f6ff]">
              {tr('Lesson quiz', 'اختبار الدرس')} <span className="font-normal text-[#8592ad]">{tr('(optional)', '(اختياري)')}</span>
            </h3>
          </div>
          {quizMissing && <MissingMark lang={lang} />}
        </div>
        <p className="mb-4 text-xs leading-relaxed text-[#8592ad]">
          {tr(
            'Questions students answer after this lesson. Each one is either MCQ, whose options are shuffled for every attempt, or a written answer they type out.',
            'أسئلة يجيب عنها الطلاب بعد هذا الدرس. كل سؤال إما اختيار من متعدد تُخلط خياراته في كل محاولة، أو إجابة يكتبها الطالب.'
          )}
          {bilingual && (
            <>
              {' '}
              {tr(
                'Write each question in both languages. The right answer is marked once for both.',
                'اكتب كل سؤال باللغتين. تُحدَّد الإجابة الصحيحة مرة واحدة لهما معًا.'
              )}
            </>
          )}
        </p>
        <QuizEditor value={section.quiz ?? []} onChange={(quiz) => onChange({ quiz })} editing={editing} />
      </EnhancedCard>

      {/* ── What a learner gets ── */}
      <EnhancedCard padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#263248] bg-[#0b1019] px-4 py-3">
          <span className="flex items-center gap-2 text-xs font-bold text-[#8592ad]">
            <Eye size={13} aria-hidden="true" />
            {tr('What a learner sees', 'ما يراه المتعلّم')}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8592ad]">
            {tr('Reading in', 'يقرأ بـ')} <span lang={lang}>{nativeName(lang)}</span>
          </span>
        </div>
        {borrowed.length > 0 ? (
          <p className="flex items-start gap-2 border-b border-[#f3a43a]/20 bg-[#f3a43a]/[0.06] px-4 py-2.5 text-[11px] leading-relaxed text-[#f3a43a]">
            <Info size={13} className="mt-px flex-shrink-0" aria-hidden="true" />
            <span>
              {lang === 'ar'
                ? tr(
                    `Not written in Arabic yet: ${borrowed.join(', ')}. A learner reading in Arabic is shown the English for these.`,
                    `لم يُكتب بالعربية بعد: ${borrowed.join('، ')}. من يقرأ بالعربية يرى النص الإنجليزي بدلًا منها.`
                  )
                : tr(
                    `Not written in English yet: ${borrowed.join(', ')}. A learner reading in English is shown the Arabic for these.`,
                    `لم يُكتب بالإنجليزية بعد: ${borrowed.join('، ')}. من يقرأ بالإنجليزية يرى النص العربي بدلًا منها.`
                  )}
            </span>
          </p>
        ) : (
          bilingual && (
            <p className="flex items-center gap-2 border-b border-[#263248] px-4 py-2 text-[11px] text-[#74dfac]">
              <CheckCircle2 size={13} aria-hidden="true" />
              {lang === 'ar' ? tr('This lesson is fully written in Arabic.', 'هذا الدرس مكتوب بالعربية كاملًا.') : tr('This lesson is fully written in English.', 'هذا الدرس مكتوب بالإنجليزية كاملًا.')}
            </p>
          )
        )}
        {section.videoId && (
          <div className="aspect-video border-b border-[#263248]">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${section.videoId}`}
              title={tr('Lesson video', 'فيديو الدرس')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        <div className="max-h-[460px] overflow-y-auto p-6 custom-scrollbar" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <h4 className="mb-1 text-lg font-bold text-[#f3f6ff]">
            <span dir="auto">{previewTitle || tr('Untitled lesson', 'درس بلا عنوان')}</span>
          </h4>
          {previewSubtitle && (
            <p className="mb-4 text-sm text-[#9aa5bf]">
              <span dir="auto">{previewSubtitle}</span>
            </p>
          )}
          <div className={previewSubtitle ? '' : 'mt-4'}>
            <MarkdownPreview content={previewBody} />
          </div>
        </div>
      </EnhancedCard>
    </>
  );
};

export default LessonsTab;
