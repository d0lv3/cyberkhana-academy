import React, { useId, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { usePwa } from '../contexts/PwaContext';

const copy = {
  en: {
    title: 'Install the Academy app',
    description: 'Add it to your home screen and open your learning space with one tap.',
    install: 'Install app', how: 'How to install', busy: 'Opening…', dismiss: 'Not now',
    steps: 'Add to your home screen',
    ios: ['Open the browser’s Share menu.', 'Choose “Add to Home Screen”.', 'Keep “Open as Web App” enabled if shown, then tap “Add”.'],
    other: ['Open your browser’s menu (⋮).', 'Choose “Install app” or “Add to Home screen”.', 'Confirm to add Cyberkhana Academy.'],
    help: 'If the option is missing, open this page in Safari on iPhone or Chrome on Android.',
  },
  ar: {
    title: 'ثبّت تطبيق الأكاديمية',
    description: 'أضفه إلى شاشتك الرئيسية وافتح مساحة تعلّمك بلمسة واحدة.',
    install: 'تثبيت التطبيق', how: 'طريقة التثبيت', busy: 'جارٍ الفتح…', dismiss: 'ليس الآن',
    steps: 'أضف التطبيق إلى الشاشة الرئيسية',
    ios: ['افتح قائمة المشاركة في المتصفح.', 'اختر «إضافة إلى الشاشة الرئيسية».', 'أبقِ خيار «فتح كتطبيق ويب» مفعّلًا إن ظهر، ثم اضغط «إضافة».'],
    other: ['افتح قائمة المتصفح (⋮).', 'اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».', 'أكّد لإضافة تطبيق أكاديمية سايبر خانة.'],
    help: 'إذا لم يظهر الخيار، افتح هذه الصفحة في سفاري على آيفون أو كروم على أندرويد.',
  },
};

/** In the page flow so it never covers mobile tabs or learning content. */
export default function PwaInstallBanner({ className = '' }: { className?: string }) {
  const { lang } = useLang();
  const { visible, canPrompt, ios, busy, dismiss, install } = usePwa();
  const [instructions, setInstructions] = useState(false);
  const id = useId();
  const text = copy[lang];
  if (!visible) return null;

  return (
    <aside aria-labelledby={`${id}-title`} data-pwa-install className={`rounded-2xl border border-[#00a859]/30 bg-[#121a2a] p-4 text-start md:hidden ${className}`}>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2.5">
        <img src="/assets/brand/cyberkhana-icon-512.png" alt="" width={44} height={44} className="rounded-xl bg-[#0d1117]" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#00a859]"><bdi>Cyberkhana Academy</bdi></p>
          <h2 id={`${id}-title`} className="mt-1 text-sm font-bold leading-snug text-[#f3f6ff]">{text.title}</h2>
        </div>
        <button type="button" onClick={dismiss} aria-label={text.dismiss} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#9aa5bf] hover:bg-[#263248] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00a859]">
          <X size={18} />
        </button>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#9aa5bf]">{text.description}</p>
      <button type="button" disabled={busy}
        aria-expanded={!canPrompt ? instructions : undefined}
        aria-controls={!canPrompt ? `${id}-steps` : undefined}
        onClick={async () => {
          if (canPrompt) { if (!(await install())) setInstructions(true); }
          else setInstructions(!instructions);
        }}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#007a42] px-3 py-2 text-sm font-bold text-white hover:bg-[#006635] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a859]">
        {canPrompt ? <Download size={16} /> : <Smartphone size={16} />}
        {busy ? text.busy : canPrompt ? text.install : text.how}
      </button>
      {instructions && (
        <div id={`${id}-steps`} className="mt-4 border-t border-[#263248] pt-3">
          <h3 className="text-sm font-bold text-[#f3f6ff]">{text.steps}</h3>
          <ol className="mt-2 list-decimal space-y-2 ps-5 text-sm leading-relaxed text-[#d2d7e3]">
            {(ios ? text.ios : text.other).map(step => <li key={step}>{step}</li>)}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-[#9aa5bf]">{text.help}</p>
        </div>
      )}
    </aside>
  );
}
