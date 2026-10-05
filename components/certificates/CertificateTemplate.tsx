import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import './certificate.css';
import { CERT_BACKGROUND_SVG, CERT_DEFS_SVG, CERT_SEAL_SVG } from './certificateArt';
import type { CertificateData } from '../../services/certificateService';

/* ─── The certificate sheet ───
 *
 * One standard sheet for every path, the same one the CyberKhana platform
 * prints for its events, set for a learning path. A creator switches it on
 * for a path and can change nothing else about it: a certificate carries
 * CyberKhana's name, and it should look like one whoever wrote the path.
 *
 * Everything it shows comes from the certificate record, fixed when it was
 * issued (backend/src/models/Certificate.ts).
 */

// Arabic, Arabic Supplement, Arabic Extended-A and the presentation forms: such names are set right to left.
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
// The sheet is in English whatever language the Academy is read in, so it reads the same everywhere.
const longDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

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

const Cell: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <div className="cell">
    <div className="k">{label}</div>
    <div className="vbox">
      <div className={`v${muted ? ' m' : ''}`} data-fit={muted ? '10,8,8' : '12,8,8'}>
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [natural, setNatural] = useState({ width: 0, height: 0 });

  const code = c.code.toUpperCase();
  const groups = code.match(/.{1,4}/g) || [];
  const codeLines = [0, 2, 4, 6]
    .map((i) => groups.slice(i, i + 2).join(' '))
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

  // Fit now, and again once the fonts arrive: sizes measured in a fallback face are wrong.
  useLayoutEffect(() => {
    const cert = certRef.current;
    if (!cert) return;
    fitAll(cert);
    let live = true;
    document.fonts?.ready.then(() => {
      if (live && certRef.current) fitAll(certRef.current);
    });
    return () => {
      live = false;
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
          <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }} dangerouslySetInnerHTML={{ __html: CERT_DEFS_SVG }} />
          <div className="bg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: CERT_BACKGROUND_SVG }} />
          <div className="logo sym" role="img" aria-label="CyberKhana" />
          <div className="logo wm" role="img" aria-label="CyberKhana" />
          <div className="abs wm-sub">Academy</div>

          {/* panel */}
          <div className="abs k p-label">Verified credential</div>
          <div className="abs sealwrap">
            <div className="seal" role="img" aria-label="CyberKhana Academy verified seal">
              <div aria-hidden="true" style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: CERT_SEAL_SVG }} />
              <div className="seal-mark" />
            </div>
          </div>
          <div className="abs fitbox resultbox">
            <div className="result" data-fit="12,9,9">
              {c.distinction ? 'Passed with distinction' : 'Final exam passed'}
            </div>
          </div>
          <div className="abs qr" role="img" aria-label="QR code linking to the verification page">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges">
              <path fill="#0d1117" d={qr.d} />
            </svg>
          </div>
          <div className="abs code">
            <div className="k">Verify</div>
            <div className="code-groups">{codeLines}</div>
          </div>

          {/* main column */}
          <div className="abs main title">Certificate of Achievement</div>
          <div className="abs main awarded">Awarded to</div>
          <div className="abs main fitbox namebox">
            <div className="name" data-fit="46,32,22" {...(rtlName ? { dir: 'rtl', lang: 'ar' } : {})}>
              {c.name}
            </div>
          </div>
          {(c.username || c.university) && (
            <div className="abs main fitbox whobox">
              <div className="who" data-fit="12,9,9">
                {c.username && <span className="u">@{c.username}</span>}
                {c.university && <span>{c.university}</span>}
              </div>
            </div>
          )}
          <div className="abs main rule" />
          <div className="abs main copy">for completing the learning path and passing its final exam</div>
          <div className="abs main fitbox eventbox">
            <div className="event" data-fit="19,15,12">
              {c.pathTitle}
            </div>
          </div>
          {/* One labelled cell per fact, in two aligned rows anchored to the bottom of the sheet. */}
          <div className="abs main fields">
            <Cell label="Curriculum" value={curriculum} />
            <Cell label="Level" value={c.difficulty || 'All levels'} />
            <Cell label="Final exam" value={c.practical ? 'Practical' : 'Theory'} />
            <Cell label="Issued by" value="CyberKhana Academy" muted />
            <Cell label="Path completed" value={longDate(c.pathCompletedAt)} muted />
            <Cell label="Issued" value={longDate(c.issuedAt)} muted />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
