/* ── The Creator Agreement, as rendered data ──
 *
 * Authoritative text: `legal/CREATOR-AGREEMENT.md` at the repo root. Change one,
 * change the other, and bump the version here and in the backend's
 * `config/legal.ts` (CURRENT_CREATOR_AGREEMENT_VERSION) together.
 */
import type { LegalDoc, LegalKeyPoint } from './legalTypes';

/** Must match CURRENT_CREATOR_AGREEMENT_VERSION in backend/src/config/legal.ts. */
export const CREATOR_AGREEMENT_VERSION = '2026-09-07';

export const CREATOR_AGREEMENT_UPDATED = '7 September 2026';

/**
 * What a creator must see before the Content Studio unlocks.
 *
 * Weighted towards the two things a creator is most likely to object to later
 * if they meet them by surprise — the perpetual licence, and being personally
 * on the hook for copied material.
 */
export const CREATOR_KEY_POINTS: LegalKeyPoint[] = [
  {
    title: 'Your content stays if you leave',
    text: 'You keep ownership, but the licence you give us is perpetual and survives deleting your account. Paths and Modules are assembled from several creators’ work, so a licence that ended when someone left would break courses other students are partway through.',
  },
  {
    title: 'The licence is non-exclusive',
    text: 'Your work remains yours to publish, teach or sell anywhere else. We are not taking it from you — we are making sure the Academy does not break when you move on.',
  },
  {
    title: 'Never copy content from elsewhere',
    text: 'Not HackTheBox, TryHackMe, a university course, a paid book or someone’s blog. Their terms almost always forbid it, and a copyright complaint lands on us as well as you. Link to a source and write your own explanation instead.',
  },
  {
    title: 'Teach offensive material responsibly',
    text: 'Say what a technique is for and where it is legal to use it. Never point students at a real target — no live hosts, no real company’s site, not even as a joke. If an exercise needs a target, it runs in the browser sandbox.',
  },
  {
    title: 'Accuracy is on you',
    text: 'Test your code, check your claims. Some of your students are 13 and most will believe you. A wrong explanation of how permissions or cryptography work does real damage downstream.',
  },
  {
    title: 'Student feedback is for improving content, nothing else',
    text: 'You can see who wrote each rating. You must not contact them about it, argue, pressure them to change it, or treat them differently because of it.',
  },
  {
    title: 'You are an unpaid volunteer',
    text: 'No wages, no revenue share, and no entitlement to payment for work already done if the Academy introduces a paid tier later. CyberKhana is not a registered company and carries no insurance for your activities.',
  },
];

export const CREATOR_AGREEMENT: LegalDoc = {
  title: 'Creator Agreement',
  updated: CREATOR_AGREEMENT_UPDATED,
  version: CREATOR_AGREEMENT_VERSION,
  intro:
    'This Agreement covers your role as a creator on CyberKhana Academy. It applies in addition to the Terms of Service — where this Agreement is stricter, this Agreement wins.',
  callout: {
    heading: 'Before you accept',
    body: [
      'Being a creator means students learn from what you write. Some of them are 13 years old, and most of them will believe you.',
      'Two things follow from that, and they are the reason this document exists. What you teach has to be right — a wrong explanation of how permissions or cryptography work does real damage downstream. And what you publish has to be yours to publish — lifting a lesson from another platform makes it our problem as well as yours.',
      'The sections on what your content must be, and on teaching offensive material responsibly, are the ones to read twice.',
    ],
  },
  sections: [
    {
      h: 'What this is',
      body: [
        'This Agreement is between you and CyberKhana, and it covers your role as a creator on CyberKhana Academy (academy.cyberkhana.tech, the "Academy").',
        'CyberKhana is a cybersecurity education project run from Iraq. It is not a registered company yet, so this Agreement is with the people who run the project. You can reach us at support@cyberkhana.tech.',
        'This Agreement is in addition to the Terms of Service. Everything in the Terms applies to you as well.',
        'By accepting a creator role, or by authoring or editing content on the Academy, you agree to this Agreement.',
      ],
    },
    {
      h: 'How the creator role works',
      body: [
        'Creator access is granted by an administrator, not requested. You hold permissions for specific kinds of content — networking lessons, programming content, operating-system modules, standalone modules, paths, and separately the ability to create whole new programming languages in the catalogue.',
        'Your work is stored in buckets that belong to you. Content inside a bucket has no separate per-item owner: the bucket is the unit.',
        'You can be given a grant over someone else’s bucket, letting you work on their content. Three things about grants matter:',
      ],
      list: [
        'your edits are written into their bucket, not yours;',
        'authorship does not move — the work stays theirs;',
        'if the grant is revoked, the work you did stays where it is. You do not take it with you.',
      ],
      after: [
        'A grant is not a permission. You still need to hold the creator permission for that content type independently; the grant only points that existing capability at someone else’s bucket.',
      ],
    },
    {
      h: 'This is not a job',
      body: [
        'You are a volunteer. This Agreement does not make you an employee, worker, partner, agent or contractor of CyberKhana.',
        'You are not paid. There are no wages, benefits, holiday, notice period or severance, and no revenue share.',
        'We may introduce payment, bounties or a revenue-share scheme in future. If we do, it will be on terms agreed at the time and will apply going forward. Nothing in this Agreement entitles you to payment for work done before such a scheme exists, and the Academy charging for content later does not by itself create a claim to any of it. If that is not acceptable to you, do not accept this Agreement.',
        'You are free to stop at any time, and so are we.',
      ],
    },
    {
      h: 'What your content must be',
      emphasis: true,
      body: ['Everything you publish must:'],
      list: [
        'be accurate. Test your code. Check your claims. If you are not confident something is correct, do not teach it as fact — say what you are unsure of, or leave it out;',
        'be your own work, or properly licensed with the source credited;',
        'be appropriate for a 13-year-old to read, in language and in subject matter;',
        'work — exercises should have a solution that actually passes;',
        'follow the Terms of Service, including the rules on harassment, hate and illegal content.',
      ],
      after: [
        'Never copy content from another platform. Not HackTheBox, TryHackMe, a university course, a paid book, a Udemy module, or someone’s blog. Their terms almost always forbid it, and a copyright complaint lands on us as well as you. Linking to a source and writing your own explanation is fine. Pasting theirs is not.',
        'Never include real personal data — not yours, not a student’s, not a stranger’s. Use obviously fake names, emails and addresses in examples.',
        'Never include real malware, or code whose purpose is to damage a student’s machine. Everything a student runs executes in their own browser, on their own computer.',
      ],
    },
    {
      h: 'Teaching offensive material responsibly',
      emphasis: true,
      body: [
        'The Academy teaches how attacks work. That is the point. But you are writing for students who may not yet know where the line is, and some of them are minors.',
        'When you teach an offensive technique:',
      ],
      list: [
        'say what it is for. Explain the defensive purpose, not just the mechanics;',
        'say where it is legal to use it — a system they own, or one they have written permission to test, and nowhere else. Do not assume they know;',
        'do not point students at a real target. No live hosts, no real company’s site, no "try this on your university’s portal", not even as a suggestion or a joke. If an exercise needs a target, it runs in the browser sandbox;',
        'do not publish working exploits for current, unpatched software, or anything whose main use is causing harm rather than understanding it;',
        'do not teach how to evade detection, cover tracks, or launder access as ends in themselves.',
      ],
      after: [
        'If you are not sure whether something crosses the line, ask us before you publish it. We would much rather answer than take it down afterwards.',
      ],
    },
    {
      h: 'Uploads',
      body: [
        'You can upload images (PNG, JPEG, WebP or GIF, up to 2 MB) and lab resource files (up to 25 MB) for use in your content.',
        'What you upload must be yours to upload or properly licensed, must contain no real personal data, and must contain no malware. Do not use the upload facility as general file storage.',
        'We may remove any uploaded file that breaks this Agreement.',
      ],
    },
    {
      h: 'Working on other people’s content',
      body: ['If you hold a grant over someone else’s bucket:'],
      list: [
        'treat their work as theirs. Fix errors, improve clarity, extend what is there — do not rewrite someone’s lesson into your own without asking them;',
        'do not delete their content unless they have asked you to;',
        'remember that authorship does not move, so credit stays with them;',
        'do not use a grant to move their content into your own bucket.',
      ],
      after: [
        'If you disagree with another creator about their content, talk to them, and bring it to us if you cannot resolve it.',
      ],
    },
    {
      h: 'Student feedback',
      body: [
        'Students rate and comment on content, and you can see that feedback with the student’s name attached.',
        'That access is for improving your content and nothing else. You must not contact a student about their feedback, argue with them, pressure them to change or remove it, treat them differently because of it, or share it outside the Academy. If feedback is abusive rather than critical, report it to us.',
      ],
    },
    {
      h: 'Your content and the licence you give us',
      emphasis: true,
      body: [
        'You keep ownership of everything you write.',
        'You give CyberKhana a worldwide, non-exclusive, royalty-free, perpetual and irrevocable licence to host, store, display, copy, translate, adapt and distribute your content across CyberKhana products — including the CTF platform and any future paid version of either — and we will credit you as the author wherever we reasonably can.',
        'This licence survives you leaving. If you stop being a creator, or delete your account entirely, your published content stays on the Academy under this licence.',
        'That is deliberate, and you should understand why before accepting: Paths and Modules are assembled from many creators’ work, and buckets have no per-item ownership. A licence that ended when someone left would tear holes in courses other people are partway through, and in content other creators built on top of.',
        'What this licence does not do: it is non-exclusive, so your work remains yours to use, publish, teach or sell anywhere else you like. We are not taking it from you — we are making sure the Academy does not break when you move on.',
        'You confirm that everything you publish is yours to give us on these terms.',
      ],
    },
    {
      h: 'Ending the role',
      body: [
        'You can stop at any time. Tell us and we will remove your creator access.',
        'We can end the role at any time, with or without a reason. We will normally talk to you first. We may remove your access immediately, without warning, if you break the sections on content standards or on teaching offensive material, if we believe students are being taught something harmful or wrong, if content appears to be copied, or if you go inactive and do not respond to us.',
        'When the role ends: your creator permissions and any grants over other people’s buckets are withdrawn; your published content stays under the licence above; and your ordinary student account continues, if you want it.',
        'We may also edit or unpublish specific content without ending your role — for example to fix an error, respond to a complaint, or take down something that breaks this Agreement.',
      ],
    },
    {
      h: 'Where you stand legally',
      body: [
        'You are a volunteer, and we are not going to pursue a volunteer for honest mistakes made while doing this properly. If you follow this Agreement and something goes wrong anyway, come to us and we will deal with it together.',
        'That protection does not extend to publishing content that is not yours, pointing students at real targets, misusing student feedback, or anything you do deliberately, dishonestly, or after we told you to stop.',
        'If you do one of those and it results in a claim, complaint, investigation or loss involving us, you are responsible for it and for the reasonable costs it causes us.',
        'CyberKhana is not a registered company and carries no insurance for your activities. You are not covered by anything. Neither are we.',
      ],
    },
    {
      h: 'Things we do not promise',
      body: [
        'The Academy is provided as is. We do not promise it will be available, working or error-free, that your content will remain published, that anyone will read it, or that the creator role will continue to exist.',
        'We do not promise the role leads to anything, or that it will be recognised by your university or a future employer.',
      ],
    },
    {
      h: 'General',
      body: [
        'Law. This Agreement is governed by the laws of the Republic of Iraq, and disputes go to the competent Iraqi courts.',
        'Changes. We may update this Agreement. We will tell creators when we do. If you keep authoring content afterwards, you accept the new version.',
        'Language. Written in English. An Arabic translation is being prepared and will be provided for convenience; if they disagree, the English version counts.',
        'The rest. If part of this Agreement cannot be enforced, the rest still stands. If we do not enforce something once, we can still enforce it later. You cannot transfer this Agreement or your creator role to anyone else.',
      ],
    },
    {
      h: 'Contact',
      body: ['Questions before you accept: support@cyberkhana.tech'],
    },
  ],
};
