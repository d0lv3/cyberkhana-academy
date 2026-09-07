/* ── The Privacy Policy, as rendered data ──
 *
 * Authoritative text: `legal/PRIVACY.md` at the repo root. Change one, change
 * the other.
 *
 * Every factual claim here is checkable against the code, and several were
 * written by reading it: there are no analytics or third-party trackers, only
 * Google OAuth is implemented, exercise code never leaves the browser, and the
 * leaderboard projection excludes email, country and bio. If any of that
 * changes, this file is wrong and has to change with it.
 */
import type { LegalDoc } from './legalTypes';

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  updated: '7 September 2026',
  version: '2026-09-07',
  intro:
    'This policy explains what CyberKhana Academy collects, what we do with it, and what you can ask us to do about it.',
  callout: {
    heading: 'The short version',
    body: [
      'We collect what we need to run a learning platform and a leaderboard, and nothing else.',
      'We have no analytics, no advertising, and no third-party trackers. Not Google Analytics, not Facebook, not anything. There is one cookie and it exists to keep you signed in. We do not sell your data and we never will.',
      'The two things most people do not expect, so they are said plainly here: feedback you leave is not anonymous — creators see your name with it — and if you delete your account, lessons you wrote as a creator stay published. Both are explained below.',
    ],
  },
  sections: [
    {
      h: 'Who is responsible for your data',
      body: [
        'CyberKhana, a cybersecurity education project run from Iraq. CyberKhana is not a registered company yet, so responsibility rests with the people who run it.',
        'For anything about your data — questions, corrections, copies, deletion — write to support@cyberkhana.tech.',
      ],
    },
    {
      h: 'What we collect from Google',
      body: [
        'The Academy has no passwords of its own. You sign in with Google, and Google sends us:',
      ],
      list: [
        'your name;',
        'your email address, which must be verified on Google’s side;',
        'your profile picture;',
        'a Google account identifier, so we recognise you next time.',
      ],
      after: [
        'We do not receive your Google password, and we cannot see anything else in your Google account.',
      ],
    },
    {
      h: 'What you add yourself',
      list: [
        'a display name and optional username;',
        'an optional profile picture, if you upload one instead of using Google’s;',
        'your university, chosen from a list, and your country;',
        'a short bio;',
        'your language preference (English or Arabic).',
      ],
      after: [
        'All of these are optional except the display name, and you can change or clear them at any time on your profile.',
      ],
    },
    {
      h: 'What the Academy records as you learn',
      list: [
        'which lessons and modules you have completed, and your progress within them;',
        'how much time you have spent learning, in minutes;',
        'your points, your monthly points, and your position on the leaderboards;',
        'when you last signed in;',
        'whether your account is suspended.',
      ],
      after: [
        'When you rate or comment on content, we store the rating, your comment, your name, which lesson it was about, and the language you wrote it in.',
        'If you are a creator, we also store the content you author and its edit history, the files you upload, and which content permissions and grants you hold.',
        'Technically, we store one authentication cookie and ordinary server logs, including IP address, browser type and the requests made, kept for security and debugging.',
      ],
    },
    {
      h: 'What we do not collect',
      body: [
        'We do not collect your date of birth, phone number, address, payment details or government identifiers. We do not ask for them and you should not send them.',
        'We do not see the code you write. Python, C++ and shell exercises run entirely inside your own browser. Your code is never sent to our servers, so we could not read it even if we wanted to.',
      ],
    },
    {
      h: 'What we use it for',
      list: [
        'your Google name, email, picture and ID — to create your account, sign you in, and recognise you;',
        'your display name, picture and university — to show who you are on the leaderboard and your profile;',
        'your country, bio and language — to personalise the Academy and show it in your language;',
        'your progress, completions and learning time — to track where you are and pick up where you left off;',
        'your points — to build the leaderboards;',
        'your feedback and ratings — to help creators improve their content;',
        'creator content, uploads and permissions — to publish your content and control who can edit what;',
        'the auth cookie — to keep you signed in;',
        'server logs — to keep the service secure, find abuse, and fix faults.',
      ],
      after: [
        'We do not use your data to build advertising profiles, and we do not make automated decisions about you that have legal effects.',
        'We may email you at your Google address about your account or a significant change to the service. We do not send marketing email.',
      ],
    },
    {
      h: 'Cookies',
      body: [
        'One cookie. It is an httpOnly authentication cookie that keeps you signed in. It cannot be read by JavaScript in your browser.',
        'There are no advertising cookies, no analytics cookies, and no third-party tracking cookies of any kind. That is why the Academy has no cookie banner — there is nothing to consent to beyond the cookie that makes signing in work.',
        'The Academy also uses your browser’s local storage for practical things like your language choice and your place in a lesson. That stays on your device.',
      ],
    },
    {
      h: 'Who can see what',
      body: ['Public, to anyone who can see the leaderboard:'],
      list: [
        'your display name;',
        'your profile picture;',
        'your university, if you set one;',
        'your points, monthly points and rank.',
      ],
      after: [
        'Your email address, your country and your bio are not shown on the leaderboard.',
        'Content you publish as a creator is visible to everyone, with your name on it as the author.',
      ],
    },
    {
      h: 'Feedback is not anonymous',
      emphasis: true,
      body: [
        'When you rate or comment on a lesson, every creator and administrator on the Academy can see your name next to it, along with your rating and your comment.',
        'We are telling you plainly rather than burying it, because most people assume course feedback is anonymous and here it is not. Creators are told they may only use it to improve their content, and may not contact you about it or treat you differently because of it — but the honest position is that they can see who said it.',
        'If you would rather raise something privately, email support@cyberkhana.tech instead of leaving feedback.',
      ],
    },
    {
      h: 'Who we share it with',
      body: [
        'We do not sell your personal data, and we never will. We do not share it with advertisers or data brokers.',
        'It reaches other parties only in these ways:',
      ],
      list: [
        'Google, because you sign in with it. Your use of Google sign-in is also governed by Google’s own privacy policy.',
        'Our hosting provider, which runs the servers the Academy sits on.',
        'A public CDN (jsDelivr), but only as a fallback. The Academy normally serves its Python runtime from its own servers. If that copy is unavailable, your browser fetches it from jsDelivr instead, which means jsDelivr sees your IP address and that you requested that file. It sees nothing about your account or your learning.',
        'When the law requires it, or where we need to protect someone’s safety.',
      ],
    },
    {
      h: 'Where your data is stored',
      body: [
        'The Academy’s servers and database are hosted on a virtual server in Europe, operated by our hosting provider.',
        'If you are using the Academy from Iraq or anywhere outside Europe, that means your data is transferred outside your country and stored there. By using the Academy you understand and accept that.',
      ],
    },
    {
      h: 'How long we keep it',
      body: [
        'We keep your account data for as long as your account exists. Server logs are kept only as long as they are useful for security and debugging.',
      ],
    },
    {
      h: 'Deleting your account',
      emphasis: true,
      body: [
        'Email support@cyberkhana.tech and ask. There is no self-service delete button yet — we do it by hand, and we will complete it within 30 days of a request we can verify came from you.',
        'What is deleted: your name, email address, profile picture, username, university, country, bio, language preference, and the link between your account and your Google identity.',
        'What is not deleted, and why:',
      ],
      list: [
        'Content you published as a creator stays. Lessons, modules and paths remain on the Academy under the licence in the Creator Agreement, with your authorship credit. Other creators’ Paths and Modules are built out of that content, and students are partway through it. If you are a creator, understand this before you publish, not after.',
        'Past leaderboard entries are anonymised, not removed. Your name comes off; the historical standings stay intact so other people’s ranks still make sense.',
        'Feedback you left is anonymised — the comment stays so creators keep the substance, your name comes off it.',
        'Records we are required to keep, and records of moderation decisions such as a ban, are retained where we need them.',
      ],
      after: [
        'Deleting your Academy account does not delete your Google account, and does not affect any account you have on the CTF platform, which is a separate service.',
      ],
    },
    {
      h: 'Your rights over your data',
      body: ['You can:'],
      list: [
        'see what we hold about you — most of it is on your profile already;',
        'correct it, directly on your profile or by asking us;',
        'get a copy of it in a readable format;',
        'delete it, as described above;',
        'object to a particular use, and we will explain or stop.',
      ],
      after: [
        'Ask at support@cyberkhana.tech. We will not charge you, and we will not make it difficult.',
        'Iraq does not currently have a comprehensive data protection statute of the kind found in the EU. We have written this policy to give you these rights anyway.',
      ],
    },
    {
      h: 'If you are under 18',
      body: [
        'The Academy is for people aged 13 and over, and if you are under 18 you need a parent or guardian’s permission to use it.',
        'We do not knowingly collect data from anyone under 13. If you believe a child under 13 has an account, tell us at support@cyberkhana.tech and we will delete it.',
        'If you are under 18, think before you fill in your profile. Your display name, picture and university are shown publicly on the leaderboard. You do not have to use your real name or a photo of yourself.',
      ],
    },
    {
      h: 'Security',
      body: [
        'We protect your data with HTTPS everywhere, an httpOnly authentication cookie, rate limiting, role-based access controls, and a re-authentication step before sensitive administrative actions.',
        'Passwords are not a risk here, because we do not have any — Google handles sign-in.',
        'No system is perfectly secure. If we discover a breach affecting your personal data, we will tell affected users what happened, what was exposed, and what to do about it, as quickly as we reasonably can.',
        'If you find a security flaw, please report it to support@cyberkhana.tech — the Terms of Service explain how we handle good-faith reports.',
      ],
    },
    {
      h: 'Changes to this policy',
      body: [
        'We may update this policy. When we do, we will change the "Last updated" date at the top, and for anything significant we will announce it in the Academy.',
        'If a change means we would use data we already hold in a materially different way, we will ask first.',
      ],
    },
    {
      h: 'Language',
      body: [
        'This policy is written in English. An Arabic translation is being prepared and will be provided for convenience. If the two versions disagree, the English version is the one that counts.',
      ],
    },
    {
      h: 'Contact',
      body: ['support@cyberkhana.tech'],
    },
  ],
};
