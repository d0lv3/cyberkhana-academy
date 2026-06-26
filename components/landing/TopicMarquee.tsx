import React from 'react';

const TOPICS = [
  'IP Addressing',
  'NAT',
  'Subnetting',
  'Python',
  'Linux',
  'Bash',
  'Firewalls',
  'Routing',
  'OSI Model',
  'Packets',
  'Terminal',
  'Encryption',
  'DNS',
  'Permissions',
];

const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

/** Infinite ticker of curriculum topics — adds motion and tells you what's inside. */
const TopicMarquee: React.FC = () => (
  <div className="relative border-y border-[#1a2332] bg-[#0a0f18] py-3.5 overflow-hidden" dir="ltr">
    {/* Edge fades */}
    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0f18] to-transparent z-10" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0f18] to-transparent z-10" />

    <div className="flex w-max animate-marquee">
      {[...TOPICS, ...TOPICS].map((topic, i) => (
        <span
          key={i}
          className="flex items-center gap-6 px-3 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#4d5a73] whitespace-nowrap"
          style={{ fontFamily: MONO }}
        >
          {topic}
          <span className="w-1 h-1 rounded-full bg-[#00a859]/60" />
        </span>
      ))}
    </div>
  </div>
);

export default TopicMarquee;
