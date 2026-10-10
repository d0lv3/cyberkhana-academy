import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Link2,
  Flag,
  Network,
  Eye,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import EnhancedCard from '../ui/EnhancedCard';
import Button from '../ui/EnhancedButton';
import DynamicList from './DynamicList';
import LabFileUploader from './LabFileUploader';
import SimulationBuilder from './SimulationBuilder';
import LabView from '../labs/LabView';
import { NetworkSimulator } from '../network-sim';
import { hasSimulation, type NetworkSimulation } from '../network-sim/types';
import {
  cleanLab,
  isSafeLabUrl,
  labHost,
  labUid,
  newLab,
  newLabFlag,
  newLabLink,
  MAX_LAB_FLAGS as MAX_FLAGS,
  type LabFlag,
  type LabLink,
  type ModuleLab,
} from '../../services/labTypes';
import { pairOf, pickText, type Pair } from '../../services/contentLang';
import { servedLab } from '../../services/moduleLocalize';
import { LocalizedInput, nativeName, useTr, type EditingLanguage } from './module-editor/fields';
import LocalizedMarkdownField from './module-editor/LocalizedMarkdownField';

interface LabEditorProps {
  labs: ModuleLab[];
  onChange: (labs: ModuleLab[]) => void;
  /** Every lesson in the module, so a lab can be placed after one of them. */
  sections: { id: string; label: string }[];
  /** The language the editor is writing in, shared with the other tabs. */
  editing: EditingLanguage;
  /** The lab to open, when the creator was sent here to one in particular. */
  openLabId?: string | null;
}

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#f3a43a]/50 transition-colors placeholder:text-[#7c8aa6]';

const labelCls = 'block text-xs font-semibold text-[#9aa5bf] mb-1.5';

const sectionHeadCls =
  'flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8592ad]';

const amberFocus = 'focus:border-[#f3a43a]/50';

const emptySimulation = (): NetworkSimulation => ({
  id: labUid('sim'),
  nodes: [],
  edges: [],
  steps: [],
});

/* ── One link row ── */
const LinkRow: React.FC<{ link: LabLink; onChange: (l: LabLink) => void; editing: EditingLanguage }> = ({
  link,
  onChange,
  editing,
}) => {
  const tr = useTr();
  const trimmed = link.url.trim();
  const valid = isSafeLabUrl(trimmed);
  const host = labHost(trimmed);

  return (
    <div className="space-y-2">
      <LocalizedInput
        aria-label={tr('Button text', 'نص الزر')}
        value={pairOf(link.label, link.labelAr)}
        onChange={(next) => onChange({ ...link, label: next.en, labelAr: next.ar })}
        editing={editing}
        placeholder={{ en: 'Button text, e.g. Open the room on TryHackMe', ar: 'نص الزر، مثل: افتح الغرفة على TryHackMe' }}
        inputClassName={amberFocus}
      />
      <input
        type="url"
        value={link.url}
        onChange={(e) => onChange({ ...link, url: e.target.value })}
        placeholder="https://tryhackme.com/room/..."
        dir="ltr"
        className={`${inputCls} font-mono text-xs ${
          trimmed && !valid ? 'border-red-500/50' : ''
        }`}
      />
      {trimmed && !valid && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertTriangle size={11} />
          {tr(
            "Needs a full https:// address. Links that aren't http or https are dropped on save.",
            'يلزم عنوان كامل يبدأ بـ https://. تُحذف عند الحفظ الروابط التي ليست http أو https.'
          )}
        </p>
      )}
      {valid && (
        <p className="flex items-center gap-1.5 text-[11px] text-[#7c8aa6]">
          <ExternalLink size={11} className="rtl-flip" />
          <span>
            {tr('Students see', 'يرى الطلاب')}{' '}
            <span className="font-semibold text-[#9aa5bf]" dir="ltr">{host}</span>{' '}
            {tr('under the button', 'تحت الزر')}
          </span>
        </p>
      )}
    </div>
  );
};

/* ── One flag row ── */
const FlagRow: React.FC<{ flag: LabFlag; index: number; onChange: (f: LabFlag) => void; editing: EditingLanguage }> = ({
  flag,
  index,
  onChange,
  editing,
}) => {
  const tr = useTr();
  return (
    <div className="space-y-2">
      {/* Numbered the way students see them, so the two can be matched up. */}
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8592ad]">
        {tr(`Answer ${index + 1}`, `الإجابة ${index + 1}`)}
      </p>
      <LocalizedInput
        aria-label={tr('What to look for', 'المطلوب إيجاده')}
        value={pairOf(flag.label, flag.labelAr)}
        onChange={(next) => onChange({ ...flag, label: next.en, labelAr: next.ar })}
        editing={editing}
        placeholder={{ en: "What to look for, e.g. The resolver's IP address", ar: 'المطلوب إيجاده، مثل: عنوان IP لخادم الأسماء' }}
        inputClassName={amberFocus}
      />
      {/* One answer, whichever language the question was read in. */}
      <input
        type="text"
        value={flag.answer ?? ''}
        onChange={(e) => onChange({ ...flag, answer: e.target.value })}
        placeholder={tr('The expected answer', 'الإجابة المتوقعة')}
        aria-label={tr('The expected answer', 'الإجابة المتوقعة')}
        dir="ltr"
        className={`${inputCls} font-mono text-xs`}
      />
      <LocalizedInput
        aria-label={tr('Hint', 'تلميح')}
        value={pairOf(flag.hint, flag.hintAr)}
        onChange={(next) => onChange({ ...flag, hint: next.en, hintAr: next.ar })}
        editing={editing}
        placeholder={{ en: 'Hint (optional)', ar: 'تلميح (اختياري)' }}
        inputClassName={amberFocus}
      />
      {/* The empty box already suggests the shape of whatever is typed above,
          and says khana{...} when that is a flag. This is for the times that is
          not nudge enough. */}
      <input
        type="text"
        value={flag.placeholder ?? ''}
        onChange={(e) => onChange({ ...flag, placeholder: e.target.value })}
        placeholder={tr(
          'Format shown in the empty box (optional), e.g. 192.168.1.1',
          'الصيغة الظاهرة في الخانة الفارغة (اختياري)، مثل 192.168.1.1'
        )}
        dir="ltr"
        className={`${inputCls} font-mono text-xs`}
      />
      <label className="flex w-fit cursor-pointer items-center gap-2 text-[11px] text-[#8592ad]">
        <input
          type="checkbox"
          checked={!!flag.caseSensitive}
          onChange={(e) => onChange({ ...flag, caseSensitive: e.target.checked })}
          className="h-3.5 w-3.5 accent-[#f3a43a]"
        />
        {tr('Case has to match exactly', 'يجب أن تتطابق حالة الأحرف تمامًا')}
      </label>
    </div>
  );
};

/**
 * The Lab tab of the module editor.
 *
 * Follows the shape the networking editor set for optional simulations: a lab
 * is opt-in, the empty state explains what it is before asking for anything,
 * and turning one off keeps the work until the module is saved.
 *
 * Its texts are written in the language the editor is on, like a lesson's.
 * The addresses, the files and the answers are said once.
 *
 * The right-hand column is not a mock-up of the lab, it is the same LabView
 * students get, running in preview mode. A creator authoring a lab is looking
 * at the real thing.
 */
const LabEditor: React.FC<LabEditorProps> = ({
  labs,
  onChange,
  sections,
  editing,
  openLabId,
}) => {
  const tr = useTr();
  const { lang } = editing;
  const [openId, setOpenId] = useState<string | null>(openLabId ?? labs[0]?.id ?? null);
  const [simLang, setSimLang] = useState<'en' | 'ar'>(lang);

  useEffect(() => {
    if (openLabId) setOpenId(openLabId);
  }, [openLabId]);

  const addLab = () => {
    const lab = newLab();
    /* Named in the module's own language, and only there: an English "Lab" on
       a module written in Arabic is a name nobody chose. */
    const n = labs.length + 1;
    lab.title = '';
    if (editing.languages[0] === 'ar') lab.titleAr = n === 1 ? 'مختبر' : `مختبر ${n}`;
    else lab.title = n === 1 ? 'Lab' : `Lab ${n}`;
    onChange([...labs, lab]);
    setOpenId(lab.id);
  };

  const updateLab = (id: string, patch: Partial<ModuleLab>) =>
    onChange(labs.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const removeLab = (id: string) => onChange(labs.filter((l) => l.id !== id));

  /* ── Nothing here yet ── */
  if (labs.length === 0) {
    return (
      <EnhancedCard padding="xl" className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#263248] bg-[#0f1726]">
          <FlaskConical size={20} className="text-[#f3a43a]" />
        </div>
        <h3 className="mb-2 text-sm font-bold text-[#f3f6ff]">{tr('No lab on this module', 'لا يوجد مختبر في هذه الوحدة')}</h3>
        <p className="mx-auto mb-5 max-w-md text-xs leading-relaxed text-[#8592ad]">
          {tr(
            'A lab is the part students do rather than read. The work itself usually runs somewhere else, a room on another platform, a VM, a CTF box, so a lab here is the brief, the way in, the files they need, and the record that they finished. Network simulations are the exception: those run inside the page.',
            'المختبر هو الجزء الذي ينفّذه الطلاب لا الذي يقرؤونه. يجري العمل غالبًا في مكان آخر، كغرفة على منصة أخرى أو آلة افتراضية أو تحدٍّ، فالمختبر هنا هو وصف المهمة وطريق الدخول والملفات اللازمة وسجل الإنجاز. محاكاة الشبكات استثناء، فهي تعمل داخل الصفحة.'
          )}
        </p>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={addLab}>
          {tr('Add a lab', 'أضف مختبرًا')}
        </Button>
      </EnhancedCard>
    );
  }

  return (
    <div className="space-y-4">
      {labs.map((lab) => {
        const isOpen = openId === lab.id;
        const simOn = !!lab.simulation;
        const completion = lab.completion;
        const flagMode = completion.mode === 'flags';
        const flags = completion.mode === 'flags' ? completion.flags : [];
        const placement = lab.placement;
        const afterLabel = (id: string) => sections.find((s) => s.id === id)?.label ?? tr('a lesson', 'درس');
        const placementLabel =
          placement.at === 'end'
            ? tr('At the end of the module', 'في نهاية الوحدة')
            : tr(`After: ${afterLabel(placement.sectionId)}`, `بعد: ${afterLabel(placement.sectionId)}`);
        const objectives: Pair[] = lab.objectives.map((o, i) => pairOf(o, lab.objectivesAr?.[i]));
        const summary = [
          placementLabel,
          tr(`${lab.links.length} ${lab.links.length === 1 ? 'link' : 'links'}`, `الروابط: ${lab.links.length}`),
          tr(`${lab.files.length} ${lab.files.length === 1 ? 'file' : 'files'}`, `الملفات: ${lab.files.length}`),
          ...(hasSimulation(lab.simulation) ? [tr('simulation', 'محاكاة')] : []),
          ...(flags.length ? [tr(`${flags.length} ${flags.length === 1 ? 'answer' : 'answers'}`, `الإجابات: ${flags.length}`)] : []),
        ];

        return (
          <div
            key={lab.id}
            className="overflow-hidden rounded-xl border border-[#263248] bg-[#0b1019]"
          >
            {/* ── Lab header ── */}
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : lab.id)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-3 text-start"
              >
                <span className="flex-shrink-0 text-[#8592ad]">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} className="rtl-flip" />}
                </span>
                <FlaskConical size={15} className="flex-shrink-0 text-[#f3a43a]" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#f3f6ff]">
                    <bdi>{pickText(pairOf(lab.title, lab.titleAr), lang) || tr('Untitled lab', 'مختبر بلا عنوان')}</bdi>
                  </span>
                  <span className="block truncate text-[11px] text-[#8592ad]">{summary.join(' · ')}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeLab(lab.id)}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#263248] px-3 py-1.5 text-[11px] font-semibold text-[#9aa5bf] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={12} /> {tr('Remove', 'إزالة')}
              </button>
            </div>

            {isOpen && (
              <div className="border-t border-[#263248] p-4">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* ── LEFT: the form ── */}
                  <div className="min-w-0 space-y-5">
                    {/* Identity */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <LocalizedInput
                          label={tr('Lab title', 'عنوان المختبر')}
                          value={pairOf(lab.title, lab.titleAr)}
                          onChange={(next) => updateLab(lab.id, { title: next.en, titleAr: next.ar })}
                          editing={editing}
                          placeholder={{ en: 'e.g. Capture the DNS handshake', ar: 'مثل: التقط مصافحة DNS' }}
                          inputClassName={amberFocus}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>{tr('Minutes', 'الدقائق')}</label>
                        <input
                          type="number"
                          min={5}
                          max={480}
                          value={lab.estimatedMinutes}
                          onChange={(e) =>
                            updateLab(lab.id, {
                              estimatedMinutes: Math.max(1, Number(e.target.value) || 0),
                            })
                          }
                          dir="ltr"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>{tr('Where it appears', 'موضعه في الوحدة')}</label>
                      <select
                        value={
                          lab.placement.at === 'end' ? 'end' : lab.placement.sectionId
                        }
                        onChange={(e) =>
                          updateLab(lab.id, {
                            placement:
                              e.target.value === 'end'
                                ? { at: 'end' }
                                : { at: 'after-section', sectionId: e.target.value },
                          })
                        }
                        className={`${inputCls} cursor-pointer`}
                      >
                        <option value="end">{tr('At the end of the module', 'في نهاية الوحدة')}</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {tr(`After: ${s.label}`, `بعد: ${s.label}`)}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-[11px] text-[#8592ad]">
                        {tr(
                          'Labs are a stop in the course sidebar, so students reach one by working through the module rather than hunting for it.',
                          'المختبر محطة في القائمة الجانبية للوحدة، فيصل إليه الطلاب أثناء تقدّمهم فيها دون أن يبحثوا عنه.'
                        )}
                      </p>
                    </div>

                    <LocalizedInput
                      label={tr('Before you start (optional)', 'قبل أن تبدأ (اختياري)')}
                      value={pairOf(lab.setupNotes, lab.setupNotesAr)}
                      onChange={(next) => updateLab(lab.id, { setupNotes: next.en, setupNotesAr: next.ar })}
                      editing={editing}
                      placeholder={{
                        en: "e.g. You'll need Wireshark and a free TryHackMe account",
                        ar: 'مثل: ستحتاج إلى Wireshark وحساب مجاني على TryHackMe',
                      }}
                      inputClassName={amberFocus}
                    />

                    {/* Objectives */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>
                        <FlaskConical size={12} /> {tr("What they'll do", 'ما سيفعلونه')}
                      </div>
                      <DynamicList<Pair>
                        items={objectives}
                        onChange={(rows) =>
                          updateLab(lab.id, {
                            objectives: rows.map((row) => row.en),
                            objectivesAr: rows.map((row) => row.ar),
                          })
                        }
                        createItem={() => ({ en: '', ar: '' })}
                        addLabel={tr('Add an objective', 'أضف هدفًا')}
                        maxItems={10}
                        renderItem={(item, i, change) => (
                          <LocalizedInput
                            aria-label={tr(`Objective ${i + 1}`, `الهدف ${i + 1}`)}
                            value={item}
                            onChange={change}
                            editing={editing}
                            placeholder={{ en: 'e.g. Filter the capture down to port 53', ar: 'مثل: صفِّ الالتقاط على المنفذ 53' }}
                            inputClassName={amberFocus}
                          />
                        )}
                      />
                      <p className="mt-1.5 text-[11px] text-[#8592ad]">
                        {tr(
                          'Students tick these off as they work. On a lab that is mostly a link out, this is the only thing in the page they touch.',
                          'يؤشّر الطلاب على هذه الأهداف أثناء العمل. وفي مختبر أغلبه رابط خارجي، هي كل ما يتعاملون معه في الصفحة.'
                        )}
                      </p>
                    </div>

                    {/* Brief */}
                    <LocalizedMarkdownField
                      label={tr('The brief', 'وصف المهمة')}
                      value={lab.brief}
                      onChange={(brief) => updateLab(lab.id, { brief })}
                      editing={editing}
                      placeholder={{
                        en: '## The task\n\nSay what to do and what to bring back...',
                        ar: '## المهمة\n\nاشرح المطلوب وما يجب العودة به...',
                      }}
                    />

                    {/* Links */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>
                        <Link2 size={12} /> {tr('Where the lab runs', 'أين يجري المختبر')}
                      </div>
                      <DynamicList<LabLink>
                        items={lab.links}
                        onChange={(links) => updateLab(lab.id, { links })}
                        createItem={newLabLink}
                        addLabel={tr('Add a link', 'أضف رابطًا')}
                        maxItems={6}
                        renderItem={(item, _i, change) => (
                          <LinkRow link={item} onChange={change} editing={editing} />
                        )}
                      />
                      <p className="mt-1.5 text-[11px] text-[#8592ad]">
                        {tr(
                          'The first link becomes the main button. Students always see the host it leads to before they click.',
                          'يصبح الرابط الأول الزر الرئيسي. ويرى الطلاب دائمًا الموقع الذي يقود إليه قبل أن ينقروا.'
                        )}
                      </p>
                    </div>

                    {/* Files */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>{tr('Files students download', 'ملفات ينزّلها الطلاب')}</div>
                      <LabFileUploader
                        value={lab.files}
                        onChange={(files) => updateLab(lab.id, { files })}
                      />
                    </div>

                    {/* Completion */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>
                        <Flag size={12} /> {tr('How it gets marked done', 'كيف يُحتسب منجزًا')}
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => updateLab(lab.id, { completion: { mode: 'self' } })}
                          aria-pressed={!flagMode}
                          className={`rounded-lg border px-3 py-2.5 text-start transition-colors ${
                            !flagMode
                              ? 'border-[#f3a43a]/40 bg-[#f3a43a]/10'
                              : 'border-[#263248] bg-[#0a0f18] hover:border-[#f3a43a]/25'
                          }`}
                        >
                          <span
                            className={`block text-xs font-bold ${
                              !flagMode ? 'text-[#f3a43a]' : 'text-[#d2d7e3]'
                            }`}
                          >
                            {tr('A finish button', 'زر إنهاء')}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-[#8592ad]">
                            {tr('Students say when they are done. Nothing to check.', 'يعلن الطلاب انتهاءهم. لا شيء يُتحقَّق منه.')}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateLab(lab.id, {
                              completion: {
                                mode: 'flags',
                                flags: flags.length ? flags : [newLabFlag()],
                              },
                            })
                          }
                          aria-pressed={flagMode}
                          className={`rounded-lg border px-3 py-2.5 text-start transition-colors ${
                            flagMode
                              ? 'border-[#9fef00]/40 bg-[#9fef00]/10'
                              : 'border-[#263248] bg-[#0a0f18] hover:border-[#9fef00]/25'
                          }`}
                        >
                          <span
                            className={`block text-xs font-bold ${
                              flagMode ? 'text-[#9fef00]' : 'text-[#d2d7e3]'
                            }`}
                          >
                            {tr('Answers to bring back', 'إجابات يعودون بها')}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-[#8592ad]">
                            {tr(
                              'Flags, or answers to questions about what they found. All correct finishes the lab.',
                              'أعلام، أو إجابات عن أسئلة حول ما وجدوه. يكتمل المختبر عند صحتها كلها.'
                            )}
                          </span>
                        </button>
                      </div>

                      {flagMode && (
                        <div className="mt-3">
                          <DynamicList<LabFlag>
                            items={flags}
                            onChange={(next) =>
                              updateLab(lab.id, { completion: { mode: 'flags', flags: next } })
                            }
                            createItem={newLabFlag}
                            addLabel={tr('Add another answer', 'أضف إجابة أخرى')}
                            maxItems={MAX_FLAGS}
                            renderItem={(item, i, change) => (
                              <FlagRow flag={item} index={i} onChange={change} editing={editing} />
                            )}
                          />
                          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#8592ad]">
                            <AlertTriangle size={11} className="mt-0.5 flex-shrink-0 text-[#f3a43a]" />
                            <span>
                              {tr(
                                `Answers stay on the server, which checks each one as it is sent. Students only ever see the hint for the empty box, never the answer. Up to ${MAX_FLAGS} per lab.`,
                                `تبقى الإجابات على الخادم الذي يتحقق من كل واحدة عند إرسالها. لا يرى الطلاب سوى تلميح الخانة الفارغة، ولا يرون الإجابة أبدًا. الحد الأقصى ${MAX_FLAGS} لكل مختبر.`
                              )}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT: exactly what students get ── */}
                  <div className="min-w-0">
                    <EnhancedCard padding="none" className="sticky top-4 overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-[#263248] bg-[#0b1019] px-4 py-3">
                        <Eye size={13} className="text-[#8592ad]" />
                        <span className="text-xs font-bold text-[#8592ad]">
                          {tr('What a learner sees', 'ما يراه المتعلّم')}
                        </span>
                        <span className="ms-auto text-[11px] font-semibold text-[#8592ad]" lang={lang}>
                          {nativeName(lang)}
                        </span>
                      </div>
                      <div
                        className="max-h-[70vh] overflow-y-auto bg-[#0d1117] p-5 custom-scrollbar"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                        <LabView lab={servedLab(cleanLab(lab), editing.languages)} lang={lang} preview />
                      </div>
                    </EnhancedCard>
                  </div>
                </div>

                {/* ── Simulation, full width because the builder needs it ── */}
                <div className="mt-6 border-t border-[#263248] pt-5">
                  {!simOn ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#263248] bg-[#0d1420] px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <Network size={15} className="mt-0.5 flex-shrink-0 text-[#60a5fa]" />
                        <div>
                          <p className="text-xs font-bold text-[#f3f6ff]">
                            {tr('Add a network simulation', 'أضف محاكاة شبكة')}
                          </p>
                          <p className="text-[11px] text-[#8592ad]">
                            {tr(
                              'The one part of a lab that runs here. Use it when the topic is better shown than described, packets moving through a topology, a handshake step by step.',
                              'الجزء الوحيد من المختبر الذي يعمل هنا. استخدمها حين يكون عرض الموضوع أوضح من وصفه، كحركة الحزم في مخطط الشبكة أو مصافحة خطوة بخطوة.'
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Plus size={13} />}
                        onClick={() => updateLab(lab.id, { simulation: emptySimulation() })}
                      >
                        {tr('Add simulation', 'أضف محاكاة')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#263248] bg-[#0b1019] px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Network size={15} className="mt-0.5 flex-shrink-0 text-[#60a5fa]" />
                          <div>
                            <p className="text-xs font-bold text-[#f3f6ff]">
                              {tr('This lab has a simulation', 'في هذا المختبر محاكاة')}
                            </p>
                            <p className="text-[11px] text-[#8592ad]">
                              {tr(
                                'It sits in the lab page, and students can open it full screen.',
                                'تظهر في صفحة المختبر، ويستطيع الطلاب فتحها بملء الشاشة.'
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateLab(lab.id, { simulation: undefined })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] px-3 py-1.5 text-[11px] font-semibold text-[#9aa5bf] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={12} /> {tr('Remove the simulation', 'أزل المحاكاة')}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <SimulationBuilder
                          value={lab.simulation!}
                          onChange={(simulation) => updateLab(lab.id, { simulation })}
                          lang={simLang}
                          onLangChange={setSimLang}
                        />
                        <EnhancedCard padding="none" className="sticky top-4 overflow-hidden">
                          <div className="flex items-center gap-2 border-b border-[#263248] bg-[#0b1019] px-4 py-3">
                            <Eye size={13} className="text-[#8592ad]" />
                            <span className="text-xs font-bold text-[#8592ad]">
                              {tr('Simulation preview', 'معاينة المحاكاة')}
                            </span>
                          </div>
                          <div className="p-4">
                            {lab.simulation!.nodes.length === 0 ? (
                              <div className="flex h-[420px] items-center justify-center text-center text-sm text-[#7c8aa6]">
                                {tr('Add devices and steps to preview the simulation.', 'أضف أجهزة وخطوات لمعاينة المحاكاة.')}
                              </div>
                            ) : (
                              <div className="h-[520px]">
                                <NetworkSimulator
                                  simulation={lab.simulation!}
                                  lang={simLang}
                                  onNodeMove={(id, x, y) =>
                                    updateLab(lab.id, {
                                      simulation: {
                                        ...lab.simulation!,
                                        nodes: lab.simulation!.nodes.map((n) =>
                                          n.id === id ? { ...n, x, y } : n
                                        ),
                                      },
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </EnhancedCard>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addLab}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#263248] bg-[#0d1420] px-3 py-3 text-xs font-semibold text-[#8592ad] transition-all hover:border-[#f3a43a]/40 hover:text-[#f3a43a]"
      >
        <Plus size={14} /> {tr('Add another lab', 'أضف مختبرًا آخر')}
      </button>
    </div>
  );
};

export default LabEditor;
