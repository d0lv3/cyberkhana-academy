/* ── The Terms of Service, as rendered data ──
 *
 * The authoritative text lives in `legal/TERMS.md` at the repo root. This file
 * is that document typed out for the app to render; change one, change the
 * other, and bump the version here and in the backend's `config/legal.ts`
 * (CURRENT_TERMS_VERSION) together.
 *
 * English only for now. The page shows Arabic readers a notice that the
 * translation is being prepared and that the English version governs.
 */
import type { LegalDoc } from './legalTypes';

/** Must match CURRENT_TERMS_VERSION in backend/src/config/legal.ts. */
export const TERMS_VERSION = '2026-09-07';

export const TERMS: LegalDoc = {
  title: 'Terms of Service',
  updated: '7 September 2026',
  version: TERMS_VERSION,
  intro:
    'These Terms govern your use of CyberKhana Academy at academy.cyberkhana.tech (the "Academy"). By signing in or using the Academy, you agree to them.',
  sections: [
    {
      h: 'Who you are agreeing with',
      body: [
        'CyberKhana is a cybersecurity education project run from Iraq. It operates CyberKhana Academy, a self-paced learning platform where you work through Fundamentals, Modules and Paths, and write and run real code in your browser.',
        'CyberKhana is not a registered company yet. In these Terms, "CyberKhana", "we", "us" and "our" mean the people who run the project. If CyberKhana becomes a registered company later, that company will take over these Terms, and we will update this section and tell you.',
        'You can reach us at support@cyberkhana.tech.',
        'These Terms cover academy.cyberkhana.tech only. The CyberKhana CTF platform (app.cyberkhana.tech) is a separate service with its own separate Terms. Having an account on one does not give you an account on the other.',
      ],
    },
    {
      h: 'The three documents',
      body: ['There are three documents. This one applies to everyone.'],
      list: [
        'These Terms of Service — everyone who uses the Academy.',
        'The Creator Agreement — creators who author lessons, modules and paths.',
        'The Privacy Policy — what we collect and what we do with it.',
      ],
      after: [
        'Creators are bound by both these Terms and the Creator Agreement. If the two differ, the stricter rule wins.',
      ],
    },
    {
      h: 'Who can use the Academy',
      body: [
        'You must be at least 13 years old. Signing in uses a Google account, and Google has its own minimum age rules that apply on top of ours.',
        'If you are under 18, you need permission from a parent or guardian, and they should read these Terms — particularly the section on what the Academy teaches and how you may use it. By signing in while under 18, you are confirming you have that permission.',
        'If you are a parent or guardian and your child uses the Academy, you are agreeing to these Terms for them and you are responsible for what they do here.',
        'Your university is something you tell us, not something we check. You can pick your university on your profile so you appear on your university’s leaderboard. We do not verify it, we have no formal relationship with any university, and appearing under a university’s name does not mean that university endorses, runs or supervises the Academy.',
        'Your local law is your responsibility. Make sure using the Academy, and the material in it, is lawful where you are.',
      ],
    },
    {
      h: 'Your account',
      body: [
        'You sign in with Google. We do not set or store a password for you — Google handles that, and your Google account’s security is your responsibility. Turn on two-factor authentication there if you have not.',
        'Because sign-in depends on Google, losing access to your Google account means losing access to your Academy account. We cannot move your progress to a different email address on request alone; write to support@cyberkhana.tech and we will do what we reasonably can, but we may not be able to help.',
        'You are responsible for everything done through your account.',
        'One account each. Do not create extra accounts, share yours, or use someone else’s.',
      ],
    },
    {
      h: 'What the Academy teaches, and how you may use it',
      emphasis: true,
      body: [
        'The Academy teaches cybersecurity, including how attacks work. Understanding an attack is not permission to carry one out.',
        'Nothing you learn here authorises you to test, access or interfere with any system you do not own or have written permission to test. Doing so is a crime in Iraq and in nearly every other country, and these Terms will not protect you.',
        'You must not:',
      ],
      list: [
        'use anything you learn here against a system you are not authorised to test;',
        'attack, scan, probe or attempt to gain access to the Academy itself, its servers, its API, or another user’s account;',
        'use the Academy to plan, coordinate or carry out an attack on a real target;',
        'upload, host or share real malware, or anything designed to damage someone else’s system;',
        'upload, share or trade real personal data, credentials, or stolen material of any kind.',
      ],
      after: [
        'If you want to practise offensive techniques against real targets, that is what the CTF platform’s lab is for, under its own Terms and inside its own authorised scope.',
      ],
    },
    {
      h: 'Running code in your browser',
      body: [
        'Lessons let you write and run Python, C++ and shell commands, and there is a sandboxed terminal with its own small filesystem.',
        'Your code runs on your own computer, not ours. It executes inside your browser. We do not receive it, run it on our servers, or store it. That is a privacy benefit — your exercises are yours — but it also means we cannot recover anything you lose.',
        'The sandbox is a convenience, not a security boundary. It is there so lessons work without you installing anything. It is not built to safely contain hostile code. So:',
      ],
      list: [
        'do not paste code you do not understand or trust into it;',
        'do not enter real passwords, API keys, tokens or personal information into an exercise or the terminal;',
        'do not rely on it to isolate anything that matters;',
        'the terminal’s filesystem is temporary and resets — keep anything you want on your own machine.',
      ],
      after: [
        'The Academy also loads its Python runtime from a public CDN if our own copy is unavailable. See the Privacy Policy for what that means.',
      ],
    },
    {
      h: 'Other things you must not do',
      body: ['You also agree not to:'],
      list: [
        'harass, threaten, bully or abuse anyone, or post hateful, discriminatory, sexual or violent content, including in feedback and profile fields;',
        'pretend to be someone else, a creator, or CyberKhana;',
        'scrape the Academy, or point automated tools at it;',
        'copy our lessons, modules or paths and republish them elsewhere;',
        'get around a ban, a rate limit, or any access control;',
        'resell, sublicense or make money from any part of the Academy;',
        'break the law while using the Academy.',
      ],
    },
    {
      h: 'Learning honestly',
      body: [
        'Points and ranks only mean something if they are earned.',
        'Do not use extra accounts to farm points, automate lesson completion, or exploit a bug in progress tracking or scoring instead of doing the work. If you find such a bug, tell us — reporting it in good faith earns credit; using it does not.',
      ],
    },
    {
      h: 'Points, ranks and leaderboards',
      body: [
        'You earn points as you complete lessons and modules. There is an all-time leaderboard and a monthly one, and you can be filtered onto your university’s board if you have set one.',
        'What others can see: your display name, your profile picture, your university if you set one, and your points and rank. Your email address, your country and your bio are not shown on the leaderboard. There is more detail in the Privacy Policy.',
        'Points are not money. They have no cash value, are not your property, and cannot be sold, traded or transferred.',
        'We can adjust or reset them. We may correct points, recalculate them, or reset them at the start of a new season, to fix errors, deal with broken content, or respond to cheating. Monthly points reset each month by design.',
      ],
    },
    {
      h: 'Certificates',
      body: ['The Academy does not currently issue certificates. If we introduce them:'],
      list: [
        'a certificate will record that you completed specific Academy content, and nothing more;',
        'it is not an accredited qualification, is not awarded by a university or any recognised awarding body, and does not license you to do professional security work;',
        'we may withdraw one obtained through cheating, multiple accounts, or any breach of these Terms;',
        'we may change what a certificate covers or stop issuing them at any time.',
      ],
    },
    {
      h: 'Found a bug in the Academy?',
      body: [
        'If you find a security flaw in the Academy itself, email support@cyberkhana.tech before doing anything else.',
        'We will treat your report as good-faith research, and will not come after you, as long as you:',
      ],
      list: [
        'tell us promptly, and give us reasonable time to fix it before telling anyone else;',
        'go only as far as you need to prove it is real, and stop there;',
        'do not read, change, download or delete anyone else’s data;',
        'do not degrade the service for other people, and do not run denial-of-service tests;',
        'do not use the flaw to gain points or rank.',
      ],
      after: [
        'Stay inside those lines and we will thank you, credit you if you want, and fix it. Step outside them and it stops being research and becomes a breach of the section above on how you may use what you learn.',
      ],
    },
    {
      h: 'Content you post',
      body: [
        'This covers feedback, ratings and profile fields. Creators have their own, fuller obligations in the Creator Agreement.',
        'Feedback is not anonymous. When you rate or comment on a lesson, your name goes with it, and the creators and administrators of the Academy can see it. Write accordingly — useful and honest is welcome, abusive is not.',
        'You keep ownership of what you post, and you give us permission to store and display it so the Academy works. You are responsible for it, and it must not break the rules above.',
        'We can moderate. We may edit, hide or delete anything that breaks these Terms, without notice where there is a risk of harm.',
      ],
    },
    {
      h: 'Creator content',
      body: [
        'Lessons, modules and paths may be written by other users, not by us.',
        'We select who can author content and can withdraw that access, but we do not check every line before it appears. Creator content is the creator’s work, and mistakes in it are not ours. If something is wrong, harmful or looks copied from somewhere it should not be, tell us at support@cyberkhana.tech.',
        'If you want to become a creator, the Creator Agreement sets out what the role commits you to.',
      ],
    },
    {
      h: 'Our content and our name',
      body: [
        'The Academy’s software, design, structure, and the content we write ourselves belong to CyberKhana or the people who licensed it to us. The CyberKhana name and logo are ours.',
        'You can use the Academy to learn. You cannot copy it, republish it, mirror it, sell it, or build a competing service from it, and you cannot use our name or logo in a way that suggests we endorse you, without our written permission.',
        'Some lessons and tools use third-party open-source software, which stays under its own licence.',
      ],
    },
    {
      h: 'Availability, and changes to content',
      body: [
        'The Academy is free, and it is run by a small volunteer team.',
        'We do not promise it will be available, and we do not promise any particular content will stay. Lessons, modules and whole paths can be edited, replaced, unpublished or removed, including while you are partway through one. Creators change their own material, and we may remove content that breaks the rules.',
        'We can change, pause, limit or shut down any part of the Academy at any time. We will try to give reasonable warning before anything major, but we are not obliged to.',
      ],
    },
    {
      h: 'Suspension and closing your account',
      body: [
        'We may suspend or ban your account, remove points, or restrict what you can do, if you break these Terms, if we believe your behaviour puts other users or the Academy at risk, or if the law requires it.',
        'For minor problems we will normally warn you first. For anything involving abuse, another person’s data, or real harm, we may act immediately and without warning.',
        'We may also remove content — lessons, uploads, feedback or profile text — that breaks these Terms, and withdraw creator access from someone who misuses it, without ending their student account.',
        'You can stop using the Academy whenever you like, and you can ask us to delete your account at support@cyberkhana.tech. What happens to your data then, and what survives, is set out in the Privacy Policy.',
      ],
    },
    {
      h: 'What we do not promise',
      body: [
        'The Academy is provided "as is" and "as available", with no warranties of any kind, as far as the law allows. We do not promise it will be uninterrupted, secure or error-free, that lessons are accurate or complete, or that the in-browser runtimes behave identically to a real Python, C++ or Linux environment. They are teaching tools, and they differ from the real thing.',
        'This is education, not qualification. Nothing here is professional security advice, and none of it qualifies you to test a real system or to practise professionally. We do not guarantee any certificate, skill level, exam result, internship or job.',
        'We are not responsible for what you do with what you learn. These techniques work on real systems. Using them outside the limits set out above is your choice and your responsibility alone.',
        'We are not responsible for content written by creators or other users, for how other users behave, or for third-party sites and services we link to or rely on.',
      ],
    },
    {
      h: 'Limits on our liability',
      body: [
        'As far as the law allows, CyberKhana and the people who run it are not liable for:',
      ],
      list: [
        'indirect or knock-on losses of any kind;',
        'lost data, progress, points, rank or opportunity;',
        'damage to your computer or systems arising from lessons, exercises, code you ran, or files you downloaded;',
        'anything another user does, or content we did not write;',
        'any consequence — legal, academic or otherwise — of you using what you learn outside the limits set out above.',
      ],
      after: [
        'Where liability cannot legally be excluded, it is limited to what you have paid us to use the Academy. That is zero.',
        'Nothing here limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited under Iraqi law.',
      ],
    },
    {
      h: 'If you cause us a problem',
      body: [
        'If you break these Terms and that results in a claim, complaint, investigation or loss involving us, you agree to take responsibility for it and to cover the reasonable costs it causes us.',
      ],
    },
    {
      h: 'Your data',
      body: [
        'What we collect and what we do with it is set out in the Privacy Policy, which forms part of these Terms.',
      ],
    },
    {
      h: 'Law and disputes',
      body: [
        'These Terms are governed by the laws of the Republic of Iraq, and disputes go to the competent Iraqi courts.',
        'Please talk to us first at support@cyberkhana.tech. Almost everything is faster to sort out that way.',
        'If a court decides part of these Terms cannot be enforced, the rest still stands. If we do not enforce a rule on one occasion, that does not mean we have given up the right to enforce it later.',
      ],
    },
    {
      h: 'Changes to these Terms',
      body: [
        'We may update these Terms. When we do, we will change the "Last updated" date at the top, and for anything significant we will announce it in the Academy.',
        'If you keep using the Academy after a change, you accept the new Terms. If you do not accept them, stop using the Academy and ask us to close your account.',
      ],
    },
    {
      h: 'Language',
      body: [
        'These Terms are written in English. An Arabic translation is being prepared and will be provided for convenience. If the two versions disagree, the English version is the one that counts.',
      ],
    },
    {
      h: 'Contact',
      body: ['support@cyberkhana.tech'],
    },
  ],
};
