import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import SectionHeading from './SectionHeading';
import { SHELL } from './shell';

/* ─── Intro video ───
 *
 * The film is hosted on YouTube, but nothing of YouTube's is on the page
 * until the visitor asks for it. What they see first is a still from the film
 * served from our own origin; the player is only fetched on the click that
 * starts it.
 *
 * Two reasons, and either would be enough:
 *   - the landing page is the one page everybody loads, and the player is
 *     over a megabyte of script that most visitors would never use;
 *   - the Privacy Policy says the Academy has no third-party trackers and
 *     needs no cookie banner. An iframe that loads with the page would put
 *     Google in front of every anonymous visitor. This way it is only in
 *     front of the ones who pressed play, on the domain that sets no cookies.
 *
 * The poster is frame 5.0s of the render (video/out), exported at two widths.
 * If the video is replaced, replace VIDEO_ID, DURATION and both posters.
 */
const VIDEO_ID = 'cUY19HkSfFg';
const DURATION = '2:12';
const EMBED_URL = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&playsinline=1`;

const IntroVideoSection: React.FC = () => {
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);

  return (
    <section className="relative px-6 py-20 md:py-28 bg-[#0a0f18] border-y border-[#1a2332] overflow-hidden">
      <div className={`relative z-10 ${SHELL}`}>
        <SectionHeading heading={t('intro.heading')} subtitle={t('intro.subtitle')} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mx-auto mt-12 md:mt-14 max-w-5xl"
        >
          <div className="absolute -inset-6 bg-[#9fef00]/[0.06] rounded-full blur-[90px] pointer-events-none" />

          <div className="relative aspect-video rounded-2xl border border-[#263248] bg-[#0b1019] shadow-2xl shadow-black/40 overflow-hidden">
            {playing ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={EMBED_URL}
                title={t('intro.videoTitle')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 w-full h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9fef00]"
              >
                <img
                  src="/assets/landing/intro-poster.webp"
                  srcSet="/assets/landing/intro-poster-sm.webp 640w, /assets/landing/intro-poster.webp 1280w"
                  sizes="(min-width: 1072px) 1024px, calc(100vw - 48px)"
                  width={1280}
                  height={720}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
                {/* scrim, so the label reads over whatever the frame holds */}
                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#05080e]/90 via-[#05080e]/35 to-transparent" />

                {/* The label sits low rather than dead centre: the frame's own
                    headline is in the middle, and it is the better invitation. */}
                <span className="absolute inset-x-0 bottom-3 sm:bottom-7 flex justify-center">
                  <span className="inline-flex items-center gap-2.5 sm:gap-3 ps-1.5 pe-4 py-1.5 sm:ps-2 sm:pe-5 sm:py-2 rounded-full border border-white/15 bg-[#0d1117]/80 backdrop-blur-md shadow-lg shadow-black/40 transition-colors duration-200 group-hover:border-[#9fef00]/60">
                    <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#9fef00] text-[#0d1117] transition-transform duration-200 group-hover:scale-110">
                      {/* a play triangle is never mirrored, so the optical nudge is physical */}
                      <Play size={15} fill="currentColor" className="translate-x-[1px]" />
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-[#f3f6ff]">{t('intro.play')}</span>
                    <span className="text-xs font-semibold text-[#9aa5bf] tabular-nums" dir="ltr">
                      {DURATION}
                    </span>
                  </span>
                </span>
              </button>
            )}
          </div>

          <p className="relative mt-4 text-center text-xs sm:text-[13px] text-[#7c8aa6] [text-wrap:balance]">{t('intro.note')}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default IntroVideoSection;
