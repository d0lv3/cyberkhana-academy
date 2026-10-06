import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import './certificate.css';
import { CERT_FRAME_SVG, CERT_SEAL_SVG } from './certificateArt';
import type { CertificateData } from '../../services/certificateService';

/* ─── The certificate sheet ───
 *
 * One standard sheet for every path: a diploma on a dark ground, centred, with
 * the Academy's logo at its head and a round foil seal at its foot. A creator
 * switches it on for a path and can change nothing else about it: a
 * certificate carries CyberKhana's name, and it should look like one whoever
 * wrote the path.
 *
 * Everything it shows comes from the certificate record, fixed when it was
 * issued (backend/src/models/Certificate.ts).
 */

// Arabic, Arabic Supplement, Arabic Extended-A and the presentation forms: such names are set right to left.
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
// The sheet is in English whatever language the Academy is read in, so it reads the same everywhere.
const longDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/* The serif the sheet is set in, and its Arabic companion for a holder's name.
   Nothing else in the Academy uses them, so they are asked for here, when a
   certificate is first shown, and not in the page every visit begins with. */
const FONTS_ID = 'ck-certificate-fonts';
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,400&family=Noto+Naskh+Arabic:wght@700&display=swap';

function useCertificateFonts(): void {
  useEffect(() => {
    if (document.getElementById(FONTS_ID)) return;
    const link = document.createElement('link');
    link.id = FONTS_ID;
    link.rel = 'stylesheet';
    link.href = FONTS_HREF;
    document.head.appendChild(link);
  }, []);
}

/** QR modules as one SVG path. */
const qrPath = (text: string) => {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  const size = q.getModuleCount();
  let d = '';
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return { size, d };
};

/**
 * Text fitting. `data-fit="max,singleMin,min"` in points: shrink on one line
 * down to singleMin, then allow wrapping down to min, until the text fits its box.
 */
const fitOne = (el: HTMLElement) => {
  const [max, singleMin, min] = (el.dataset.fit || '').split(',').map(Number);
  const box = el.parentElement!;
  const fits = () => el.scrollWidth <= box.clientWidth + 0.5 && el.offsetHeight <= box.clientHeight + 0.5;
  el.style.whiteSpace = 'nowrap';
  for (let size = max; size >= singleMin; size -= 0.5) {
    el.style.fontSize = `${size}pt`;
    if (fits()) return;
  }
  el.style.whiteSpace = 'normal';
  for (let size = singleMin; size >= min; size -= 0.5) {
    el.style.fontSize = `${size}pt`;
    if (fits()) return;
  }
};
const fitAll = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('[data-fit]').forEach(fitOne);

/* Active only while a certificate is mounted: one landscape A4 page holding the
   certificate alone, at full size, dark background included. */
const PRINT_STYLES = `
@page { size: 297mm 210mm; margin: 0; }
@media print {
  html, body { width: 297mm !important; height: 210mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #0d1117 !important; }
  body * { visibility: hidden !important; }
  .cert, .cert * { visibility: visible !important; }
  .cert-scaler > .cert { position: fixed !important; left: 0 !important; top: 0 !important; transform: none !important; box-shadow: none !important; }
}`;

const Cell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="cell">
    <div className="k">{label}</div>
    <div className="vbox">
      <div className="v" data-fit="11,7.5,7.5">
        {value}
      </div>
    </div>
  </div>
);

const plural = (n: number, one: string) => `${n.toLocaleString('en-US')} ${one}${n === 1 ? '' : 's'}`;

interface CertificateTemplateProps {
  certificate: CertificateData;
  /** Where the QR code leads: this certificate's own page. */
  verifyUrl: string;
  /** Print rules take over the whole page, so a preview inside another page
   *  (the Studio's) leaves them out. */
  printable?: boolean;
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ certificate: c, verifyUrl, printable = true }) => {
  useCertificateFonts();
  const wrapRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [natural, setNatural] = useState({ width: 0, height: 0 });

  const code = c.code.toUpperCase();
  const groups = code.match(/.{1,4}/g) || [];
  const codeLines = [0, 4]
    .map((i) => groups.slice(i, i + 4).join(' '))
    .filter(Boolean)
    .join('\n');
  const qr = useMemo(() => qrPath(verifyUrl), [verifyUrl]);
  const rtlName = ARABIC.test(c.name);

  const curriculum = [
    plural(c.stepCount, 'step'),
    c.lessonCount > 0 ? plural(c.lessonCount, 'lesson') : '',
    c.hours > 0 ? `${c.hours} h` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  /* Fit now, and again once the fonts arrive: sizes measured in a fallback
     face are wrong. The sheet's own serif is asked for after the first paint,
     so the set of fonts is watched and the text is fitted again when it lands. */
  useLayoutEffect(() => {
    const cert = certRef.current;
    if (!cert) return;
    fitAll(cert);
    let live = true;
    const refit = () => {
      if (live && certRef.current) fitAll(certRef.current);
    };
    document.fonts?.ready.then(refit);
    document.fonts?.addEventListener?.('loadingdone', refit);
    return () => {
      live = false;
      document.fonts?.removeEventListener?.('loadingdone', refit);
    };
  }, [c, verifyUrl]);

  // Scale the millimetre-sized sheet to the width available; transforms do not change layout, so fitting is unaffected.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const cert = certRef.current;
    if (!wrap || !cert) return;
    const measure = () => {
      const width = cert.offsetWidth;
      const height = cert.offsetHeight;
      setNatural({ width, height });
      setScale(Math.min(1, wrap.clientWidth / width));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full">
      {printable && <style>{PRINT_STYLES}</style>}
      <div
        className="cert-scaler"
        style={{ width: natural.width * scale || undefined, height: natural.height * scale || undefined }}
      >
        <div
          ref={certRef}
          className="cert"
          data-tier={c.distinction ? 'distinction' : 'pass'}
          lang="en"
          dir="ltr"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="bg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: CERT_FRAME_SVG }} />

          {/* head */}
          <div className="abs logo" role="img" aria-label="CyberKhana Academy" />
          <div className="abs mid title">Certificate of Achievement</div>

          {/* holder */}
          <div className="abs mid pre">This certifies that</div>
          <div className="abs mid fitbox namebox">
            <div className="name" data-fit="52,34,22" {...(rtlName ? { dir: 'rtl', lang: 'ar' } : {})}>
              {c.name}
            </div>
          </div>
          <div className="abs rule" />
          {(c.username || c.university) && (
            <div className="abs mid fitbox whobox">
              <div className="who" data-fit="11,8,8">
                {c.username && <span className="u">@{c.username}</span>}
                {c.username && c.university && <span className="dot">·</span>}
                {c.university && <span>{c.university}</span>}
              </div>
            </div>
          )}

          {/* what it is for */}
          <div className="abs mid copy">has completed the learning path and passed its final exam</div>
          <div className="abs mid fitbox pathbox">
            <div className="path" data-fit="23,16,12">
              {c.pathTitle}
            </div>
          </div>
          <div className="abs facts">
            <Cell label="Curriculum" value={curriculum} />
            <Cell label="Level" value={c.difficulty || 'All levels'} />
            <Cell label="Final exam" value={c.practical ? 'Practical' : 'Theory'} />
          </div>

          {/* foot */}
          <div className="abs qr" role="img" aria-label="QR code linking to the verification page">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges">
              <path fill="#0d1117" d={qr.d} />
            </svg>
          </div>
          <div className="abs code">
            <div className="k">Verify</div>
            <div className="code-groups">{codeLines}</div>
          </div>
          <div className="abs sealwrap">
            <div className="seal" role="img" aria-label="CyberKhana Academy verified seal">
              <div aria-hidden="true" style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: CERT_SEAL_SVG }} />
              <div className="seal-mark" />
            </div>
          </div>
          <div className="abs mid result">{c.distinction ? 'Passed with distinction' : 'Final exam passed'}</div>
          <div className="abs dates">
            <div className="k">Path completed</div>
            <div className="v">{longDate(c.pathCompletedAt)}</div>
            <div className="k">Issued</div>
            <div className="v">{longDate(c.issuedAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
