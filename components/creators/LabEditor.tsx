import React, { useState } from 'react';
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
import BilingualMarkdown from './BilingualMarkdown';
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
  type LabFlag,
  type LabLink,
  type ModuleLab,
} from '../../services/labTypes';

interface LabEditorProps {
  labs: ModuleLab[];
  onChange: (labs: ModuleLab[]) => void;
  /** Every section in the module, so a lab can be placed after one of them. */
  sections: { id: string; label: string }[];
  /** The language tab shared with the rest of the editor. */
  lang: 'en' | 'ar';
  onLangChange: (lang: 'en' | 'ar') => void;
}

const inputCls =
  'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#f3a43a]/50 transition-colors placeholder:text-[#7c8aa6]';

const labelCls = 'block text-xs font-semibold text-[#9aa5bf] mb-1.5';

const sectionHeadCls =
  'flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8592ad]';

const emptySimulation = (): NetworkSimulation => ({
  id: labUid('sim'),
  nodes: [],
  edges: [],
  steps: [],
});

/* ── One link row ── */
const LinkRow: React.FC<{ link: LabLink; onChange: (l: LabLink) => void }> = ({
  link,
  onChange,
}) => {
  const trimmed = link.url.trim();
  const valid = isSafeLabUrl(trimmed);
  const host = labHost(trimmed);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={link.label}
        onChange={(e) => onChange({ ...link, label: e.target.value })}
        placeholder="Button text, e.g. Open the room on TryHackMe"
        className={inputCls}
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
          <AlertTriangle size={11} /> Needs a full https:// address. Links that aren&apos;t http or
          https are dropped on save.
        </p>
      )}
      {valid && (
        <p className="flex items-center gap-1.5 text-[11px] text-[#7c8aa6]" dir="ltr">
          <ExternalLink size={11} className="rtl-flip" />
          Students see <span className="font-semibold text-[#9aa5bf]">{host}</span> under the button
        </p>
      )}
    </div>
  );
};

/* ── One flag row ── */
const FlagRow: React.FC<{ flag: LabFlag; onChange: (f: LabFlag) => void }> = ({
  flag,
  onChange,
}) => (
  <div className="space-y-2">
    <input
      type="text"
      value={flag.label}
      onChange={(e) => onChange({ ...flag, label: e.target.value })}
      placeholder="What to look for, e.g. The resolver's IP address"
      className={inputCls}
    />
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <input
        type="text"
        value={flag.answer}
        onChange={(e) => onChange({ ...flag, answer: e.target.value })}
        placeholder="The expected answer"
        dir="ltr"
        className={`${inputCls} font-mono text-xs`}
      />
      <input
        type="text"
        value={flag.hint ?? ''}
        onChange={(e) => onChange({ ...flag, hint: e.target.value })}
        placeholder="Hint (optional)"
        className={inputCls}
      />
    </div>
    <label className="flex w-fit cursor-pointer items-center gap-2 text-[11px] text-[#8592ad]">
      <input
        type="checkbox"
        checked={!!flag.caseSensitive}
        onChange={(e) => onChange({ ...flag, caseSensitive: e.target.checked })}
        className="h-3.5 w-3.5 accent-[#f3a43a]"
      />
      Case has to match exactly
    </label>
  </div>
);

/**
 * The Lab tab of the module editor.
 *
 * Follows the shape the networking editor set for optional simulations: a lab
 * is opt-in, the empty state explains what it is before asking for anything,
 * and turning one off keeps the work until the module is saved.
 *
 * The right-hand column is not a mock-up of the lab, it is the same LabView
 * students get, running in preview mode. A creator authoring a lab is looking
 * at the real thing.
 */
const LabEditor: React.FC<LabEditorProps> = ({
  labs,
  onChange,
  sections,
  lang,
  onLangChange,
}) => {
  const [openId, setOpenId] = useState<string | null>(labs[0]?.id ?? null);
  const [simLang, setSimLang] = useState<'en' | 'ar'>('en');

  const addLab = () => {
    const lab = newLab();
    lab.title = labs.length === 0 ? 'Lab' : `Lab ${labs.length + 1}`;
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
        <h3 className="mb-2 text-sm font-bold text-[#f3f6ff]">No lab on this module</h3>
        <p className="mx-auto mb-5 max-w-md text-xs leading-relaxed text-[#8592ad]">
          A lab is the part students do rather than read. The work itself usually runs somewhere
          else, a room on another platform, a VM, a CTF box, so a lab here is the brief, the way in,
          the files they need, and the record that they finished. Network simulations are the
          exception: those run inside the page.
        </p>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={addLab}>
          Add a lab
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
        const placementLabel =
          placement.at === 'end'
            ? 'At the end of the module'
            : `After: ${sections.find((s) => s.id === placement.sectionId)?.label ?? 'a section'}`;

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
                className="flex min-w-0 flex-1 items-center gap-3 text-start"
              >
                <span className="flex-shrink-0 text-[#8592ad]">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} className="rtl-flip" />}
                </span>
                <FlaskConical size={15} className="flex-shrink-0 text-[#f3a43a]" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#f3f6ff]">
                    {lab.title || 'Untitled lab'}
                  </span>
                  <span className="block truncate text-[11px] text-[#8592ad]">
                    {placementLabel}
                    {' · '}
                    {lab.links.length} link{lab.links.length === 1 ? '' : 's'}
                    {' · '}
                    {lab.files.length} file{lab.files.length === 1 ? '' : 's'}
                    {hasSimulation(lab.simulation) ? ' · simulation' : ''}
                    {flags.length ? ` · ${flags.length} flag${flags.length === 1 ? '' : 's'}` : ''}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeLab(lab.id)}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#263248] px-3 py-1.5 text-[11px] font-semibold text-[#9aa5bf] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>

            {isOpen && (
              <div className="border-t border-[#263248] p-4">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* ── LEFT: the form ── */}
                  <div className="space-y-5">
                    {/* Identity */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Lab title</label>
                        <input
                          type="text"
                          value={lab.title}
                          onChange={(e) => updateLab(lab.id, { title: e.target.value })}
                          placeholder="e.g. Capture the DNS handshake"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Minutes</label>
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
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Where it appears</label>
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
                        <option value="end">At the end of the module</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            After: {s.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-[11px] text-[#8592ad]">
                        Labs are a stop in the course sidebar, so students reach one by working
                        through the module rather than hunting for it.
                      </p>
                    </div>

                    <div>
                      <label className={labelCls}>Before you start (optional)</label>
                      <input
                        type="text"
                        value={lab.setupNotes ?? ''}
                        onChange={(e) => updateLab(lab.id, { setupNotes: e.target.value })}
                        placeholder="e.g. You'll need Wireshark and a free TryHackMe account"
                        className={inputCls}
                      />
                    </div>

                    {/* Objectives */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>
                        <FlaskConical size={12} /> What they&apos;ll do
                      </div>
                      <DynamicList<string>
                        items={lab.objectives}
                        onChange={(objectives) => updateLab(lab.id, { objectives })}
                        createItem={() => ''}
                        addLabel="Add an objective"
                        maxItems={10}
                        renderItem={(item, _i, change) => (
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => change(e.target.value)}
                            placeholder="e.g. Filter the capture down to port 53"
                            className={inputCls}
                          />
                        )}
                      />
                      <p className="mt-1.5 text-[11px] text-[#8592ad]">
                        Students tick these off as they work. On a lab that is mostly a link out,
                        this is the only thing in the page they touch.
                      </p>
                    </div>

                    {/* Brief */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>The brief</div>
                      <BilingualMarkdown
                        value={lab.brief}
                        onChange={(brief) => updateLab(lab.id, { brief })}
                        lang={lang}
                        onLangChange={onLangChange}
                      />
                    </div>

                    {/* Links */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>
                        <Link2 size={12} /> Where the lab runs
                      </div>
                      <DynamicList<LabLink>
                        items={lab.links}
                        onChange={(links) => updateLab(lab.id, { links })}
                        createItem={newLabLink}
                        addLabel="Add a link"
                        maxItems={6}
                        renderItem={(item, _i, change) => (
                          <LinkRow link={item} onChange={change} />
                        )}
                      />
                      <p className="mt-1.5 text-[11px] text-[#8592ad]">
                        The first link becomes the main button. Students always see the host it
                        leads to before they click.
                      </p>
                    </div>

                    {/* Files */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>Files students download</div>
                      <LabFileUploader
                        value={lab.files}
                        onChange={(files) => updateLab(lab.id, { files })}
                      />
                    </div>

                    {/* Completion */}
                    <div>
                      <div className={`${sectionHeadCls} mb-2`}>
                        <Flag size={12} /> How it gets marked done
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => updateLab(lab.id, { completion: { mode: 'self' } })}
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
                            A finish button
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-[#8592ad]">
                            Students say when they are done. Nothing to check.
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
                            Flags to submit
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-[#8592ad]">
                            Values they extract from the environment. All correct finishes the lab.
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
                            addLabel="Add another flag"
                            maxItems={10}
                            renderItem={(item, _i, change) => (
                              <FlagRow flag={item} onChange={change} />
                            )}
                          />
                          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#8592ad]">
                            <AlertTriangle size={11} className="mt-0.5 flex-shrink-0 text-[#f3a43a]" />
                            <span>
                              Answers are checked in the student&apos;s browser, which means a
                              determined one can read them from the page. Good for a self-check,
                              not for a graded exam.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT: exactly what students get ── */}
                  <div>
                    <EnhancedCard padding="none" className="sticky top-4 overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-[#263248] bg-[#0b1019] px-4 py-3">
                        <Eye size={13} className="text-[#8592ad]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#8592ad]">
                          Student view
                        </span>
                        <span className="ms-auto text-[10px] font-bold text-[#8592ad]">
                          {lang === 'ar' ? 'العربية' : 'English'}
                        </span>
                      </div>
                      <div
                        className="max-h-[70vh] overflow-y-auto bg-[#0d1117] p-5 custom-scrollbar"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                        <LabView lab={cleanLab(lab)} lang={lang} preview />
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
                            Add a network simulation
                          </p>
                          <p className="text-[11px] text-[#8592ad]">
                            The one part of a lab that runs here. Use it when the topic is better
                            shown than described, packets moving through a topology, a handshake
                            step by step.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Plus size={13} />}
                        onClick={() => updateLab(lab.id, { simulation: emptySimulation() })}
                      >
                        Add simulation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#263248] bg-[#0b1019] px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Network size={15} className="mt-0.5 flex-shrink-0 text-[#60a5fa]" />
                          <div>
                            <p className="text-xs font-bold text-[#f3f6ff]">
                              This lab has a simulation
                            </p>
                            <p className="text-[11px] text-[#8592ad]">
                              It sits in the lab page, and students can open it full screen.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateLab(lab.id, { simulation: undefined })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#263248] px-3 py-1.5 text-[11px] font-semibold text-[#9aa5bf] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={12} /> Remove the simulation
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
                            <span className="text-xs font-bold uppercase tracking-wider text-[#8592ad]">
                              Simulation preview
                            </span>
                          </div>
                          <div className="p-4">
                            {lab.simulation!.nodes.length === 0 ? (
                              <div className="flex h-[420px] items-center justify-center text-center text-sm text-[#7c8aa6]">
                                Add devices and steps to preview the simulation.
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
        <Plus size={14} /> Add another lab
      </button>
    </div>
  );
};

export default LabEditor;
