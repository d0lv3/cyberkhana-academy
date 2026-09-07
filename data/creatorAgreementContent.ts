/* ── The Creator Agreement, as rendered data ──
 *
 * Authoritative text: `legal/CREATOR-AGREEMENT.md` at the repo root (English
 * governs; the Arabic below is a convenience translation). Change one, change
 * the other, and bump the version here and in the backend's `config/legal.ts`
 * (CURRENT_CREATOR_AGREEMENT_VERSION) together.
 */
import type { BilingualDoc, BilingualKeyPoints } from './legalTypes';

/** Must match CURRENT_CREATOR_AGREEMENT_VERSION in backend/src/config/legal.ts. */
export const CREATOR_AGREEMENT_VERSION = '2026-09-07';

export const CREATOR_AGREEMENT_UPDATED = {
  en: '7 September 2026',
  ar: '٧ أيلول/سبتمبر ٢٠٢٦',
};

/**
 * What a creator must see before the Content Studio unlocks.
 *
 * Weighted towards the two things a creator is most likely to object to later
 * if they meet them by surprise — the perpetual licence, and being personally
 * on the hook for copied material.
 */
export const CREATOR_KEY_POINTS: BilingualKeyPoints = {
  en: [
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
  ],
  ar: [
    {
      title: 'محتواك يبقى إن غادرت',
      text: 'تحتفظ بالملكية، لكن الترخيص الذي تمنحنا إياه دائم ويستمر حتى بعد حذف حسابك. فالمسارات والوحدات تُبنى من أعمال عدة مُنشِئين، وترخيصٌ ينتهي برحيل أحدهم كان سيُعطّل دورات يقف طلاب في منتصفها.',
    },
    {
      title: 'الترخيص غير حصري',
      text: 'يبقى عملك ملكك تنشره أو تُدرّسه أو تبيعه في أي مكان آخر. نحن لا نأخذه منك — بل نضمن ألّا تتعطّل الأكاديمية حين تمضي في طريقك.',
    },
    {
      title: 'لا تنسخ محتوى من مكان آخر أبدًا',
      text: 'لا من HackTheBox ولا TryHackMe ولا من مقرر جامعي ولا كتاب مدفوع ولا مدوّنة أحدهم. شروطهم تمنع ذلك غالبًا، وشكوى حقوق النشر تقع علينا كما تقع عليك. اربط بالمصدر واكتب شرحك أنت بدلًا من ذلك.',
    },
    {
      title: 'علّم المواد الهجومية بمسؤولية',
      text: 'وضّح الغرض من التقنية وأين يجوز استخدامها قانونًا. ولا توجّه الطلاب إلى هدف حقيقي أبدًا — لا مضيفات حيّة ولا موقع شركة حقيقية، ولا حتى على سبيل المزاح. وإذا احتاج التمرين إلى هدف، فليكن داخل البيئة المعزولة في المتصفح.',
    },
    {
      title: 'الدقة مسؤوليتك',
      text: 'اختبر شيفرتك وتحقّق من معلوماتك. بعض طلابك في الثالثة عشرة، ومعظمهم سيصدّقك. وشرحٌ خاطئ لآلية الصلاحيات أو التشفير يُحدث ضررًا حقيقيًا لاحقًا.',
    },
    {
      title: 'تقييمات الطلاب لتحسين المحتوى، لا لغير ذلك',
      text: 'يمكنك رؤية كاتب كل تقييم. ويُمنع عليك مراسلته بشأنه أو مجادلته أو الضغط عليه لتغييره أو معاملته معاملة مختلفة بسببه.',
    },
    {
      title: 'أنت متطوّع غير مأجور',
      text: 'لا أجور ولا حصة من الإيرادات ولا استحقاق لأي مقابل عن عمل أُنجز سابقًا إذا استحدثت الأكاديمية اشتراكًا مدفوعًا لاحقًا. وسايبر خانة ليست شركة مسجّلة ولا تحمل أي تأمين يغطي أنشطتك.',
    },
  ],
};

export const CREATOR_AGREEMENT: BilingualDoc = {
  en: {
    title: 'Creator Agreement',
    updated: CREATOR_AGREEMENT_UPDATED.en,
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
          'Language. Written in English, with the Arabic translation provided for convenience; if they disagree, the English version counts.',
          'The rest. If part of this Agreement cannot be enforced, the rest still stands. If we do not enforce something once, we can still enforce it later. You cannot transfer this Agreement or your creator role to anyone else.',
        ],
      },
      {
        h: 'Contact',
        body: ['Questions before you accept: support@cyberkhana.tech'],
      },
    ],
  },

  ar: {
    title: 'اتفاقية المُنشِئ',
    updated: CREATOR_AGREEMENT_UPDATED.ar,
    version: CREATOR_AGREEMENT_VERSION,
    intro:
      'تغطي هذه الاتفاقية دورك كمُنشِئ محتوى في أكاديمية سايبر خانة، وتسري إضافةً إلى شروط الخدمة — وحيثما كانت هذه الاتفاقية أشدّ، فهي التي تسري.',
    callout: {
      heading: 'قبل أن توافق',
      body: [
        'أن تكون مُنشِئًا يعني أن الطلاب يتعلّمون مما تكتبه. بعضهم في الثالثة عشرة من العمر، ومعظمهم سيصدّقك.',
        'ويترتب على ذلك أمران، وهما سبب وجود هذه الوثيقة. ما تُعلّمه يجب أن يكون صحيحًا — فشرحٌ خاطئ لآلية الصلاحيات أو التشفير يُحدث ضررًا حقيقيًا لاحقًا. وما تنشره يجب أن يكون لك حق نشره — فنقل درس من منصة أخرى يجعل المشكلة مشكلتنا كما هي مشكلتك.',
        'والقسمان المتعلقان بما يجب أن يكون عليه محتواك، وبتعليم المواد الهجومية بمسؤولية، هما اللذان ينبغي أن تقرأهما مرتين.',
      ],
    },
    sections: [
      {
        h: 'ما هذه الوثيقة',
        body: [
          'هذه الاتفاقية بينك وبين سايبر خانة، وتغطي دورك كمُنشِئ محتوى في أكاديمية سايبر خانة (academy.cyberkhana.tech، «الأكاديمية»).',
          'وسايبر خانة مشروع تعليمي في مجال الأمن السيبراني يُدار من العراق. وهو ليس شركة مسجّلة بعد، فهذه الاتفاقية مع الأشخاص الذين يديرون المشروع. ويمكنك مراسلتنا على support@cyberkhana.tech.',
          'وهذه الاتفاقية إضافة إلى شروط الخدمة، فكل ما ورد في الشروط ينطبق عليك أيضًا.',
          'وبقبولك دور المُنشِئ، أو بتأليفك أو تعديلك محتوى في الأكاديمية، فإنك توافق على هذه الاتفاقية.',
        ],
      },
      {
        h: 'كيف يعمل دور المُنشِئ',
        body: [
          'صلاحية الإنشاء يمنحها مشرف، ولا تُطلب. وأنت تحمل صلاحيات لأنواع محدّدة من المحتوى — دروس الشبكات، ومحتوى البرمجة، ووحدات أنظمة التشغيل، والوحدات المستقلة، والمسارات، وبشكل منفصل القدرة على إنشاء لغات برمجة جديدة بالكامل في الفهرس.',
          'ويُخزَّن عملك في «سلال» تخصّك. والمحتوى داخل السلة ليس له مالك منفصل لكل عنصر: السلة هي الوحدة.',
          'ويمكن أن تُمنح إذنًا على سلة شخص آخر يتيح لك العمل على محتواه. وثلاثة أمور تهمّ بشأن هذه الأذونات:',
        ],
        list: [
          'تعديلاتك تُكتب في سلته هو، لا في سلتك؛',
          'نسبة التأليف لا تنتقل — فالعمل يبقى له؛',
          'وإذا سُحب الإذن، يبقى ما أنجزته في مكانه. أنت لا تأخذه معك.',
        ],
        after: [
          'والإذن ليس صلاحية. فلا بد أن تحمل صلاحية الإنشاء لذلك النوع من المحتوى بشكل مستقل؛ والإذن يوجّه تلك الصلاحية القائمة نحو سلة شخص آخر لا غير.',
        ],
      },
      {
        h: 'هذه ليست وظيفة',
        body: [
          'أنت متطوّع. وهذه الاتفاقية لا تجعل منك موظفًا أو عاملًا أو شريكًا أو وكيلًا أو متعاقدًا لدى سايبر خانة.',
          'ولا تتقاضى أجرًا. فلا رواتب ولا مزايا ولا إجازات ولا مدة إشعار ولا تعويض نهاية خدمة، ولا حصة من الإيرادات.',
          'وقد نستحدث مستقبلًا نظام دفع أو مكافآت أو مشاركة في الإيرادات. وإذا فعلنا، فسيكون بشروط يُتفق عليها حينها ويسري مستقبلًا. ولا شيء في هذه الاتفاقية يمنحك حقًّا في مقابل عن عمل أُنجز قبل وجود ذلك النظام، وفرض الأكاديمية رسومًا على المحتوى لاحقًا لا ينشئ بذاته أي مطالبة بشيء منه. وإذا كان هذا غير مقبول لك، فلا توافق على هذه الاتفاقية.',
          'ولك أن تتوقف في أي وقت، ولنا ذلك أيضًا.',
        ],
      },
      {
        h: 'ما يجب أن يكون عليه محتواك',
        emphasis: true,
        body: ['كل ما تنشره يجب أن:'],
        list: [
          'يكون دقيقًا. اختبر شيفرتك. تحقّق من معلوماتك. وإذا لم تكن واثقًا من صحة شيء، فلا تُعلّمه على أنه حقيقة — بيّن ما تشكّ فيه، أو اتركه؛',
          'يكون من عملك أنت، أو مرخّصًا على النحو الصحيح مع نسبته إلى مصدره؛',
          'يكون مناسبًا ليقرأه شخص في الثالثة عشرة، لغةً وموضوعًا؛',
          'يعمل فعلًا — فالتمارين ينبغي أن يكون لها حلّ يمرّ بنجاح؛',
          'يلتزم بشروط الخدمة، بما فيها قواعد التحرّش والكراهية والمحتوى غير القانوني.',
        ],
        after: [
          'ولا تنسخ محتوى من منصة أخرى أبدًا. لا من HackTheBox ولا TryHackMe ولا من مقرر جامعي ولا كتاب مدفوع ولا وحدة على Udemy ولا مدوّنة أحدهم. فشروطهم تمنع ذلك غالبًا، وشكوى حقوق النشر تقع علينا كما تقع عليك. أما الربط بالمصدر وكتابة شرحك أنت فلا بأس به. ولصق شرحهم ليس كذلك.',
          'ولا تُدرِج بيانات شخصية حقيقية أبدًا — لا بياناتك ولا بيانات طالب ولا بيانات شخص غريب. استخدم أسماء وعناوين بريد وعناوين وهمية بشكل واضح في الأمثلة.',
          'ولا تُدرِج برمجيات خبيثة حقيقية، ولا شيفرة الغرض منها الإضرار بجهاز الطالب. فكل ما يشغّله الطالب يُنفَّذ داخل متصفحه هو، على حاسوبه هو.',
        ],
      },
      {
        h: 'تعليم المواد الهجومية بمسؤولية',
        emphasis: true,
        body: [
          'تُعلّم الأكاديمية كيف تعمل الهجمات، وهذا هو المقصود. لكنك تكتب لطلاب قد لا يعرفون بعدُ أين يقف الخط، وبعضهم قاصرون.',
          'وعندما تُعلّم تقنية هجومية:',
        ],
        list: [
          'وضّح الغرض منها. اشرح الغاية الدفاعية، لا الآلية وحدها؛',
          'وضّح أين يجوز استخدامها قانونًا — على نظام يملكونه، أو نظام لديهم إذن مكتوب باختباره، ولا مكان غير ذلك. ولا تفترض أنهم يعرفون؛',
          'ولا توجّه الطلاب إلى هدف حقيقي. لا مضيفات حيّة ولا موقع شركة حقيقية ولا «جرّب هذا على بوابة جامعتك»، ولا حتى على سبيل الاقتراح أو المزاح. وإذا احتاج التمرين إلى هدف، فليكن داخل البيئة المعزولة في المتصفح؛',
          'ولا تنشر ثغرات عاملة لبرمجيات حالية غير مُرقَّعة، ولا أي شيء استخدامه الأساسي إحداث الضرر لا الفهم؛',
          'ولا تُعلّم كيفية التهرّب من الكشف أو طمس الآثار أو إخفاء الوصول كغايات بحدّ ذاتها.',
        ],
        after: [
          'وإذا لم تكن متأكدًا من أن شيئًا ما يتجاوز الخط، فاسألنا قبل أن تنشره. فنحن نفضّل الإجابة كثيرًا على أن نحذفه بعد النشر.',
        ],
      },
      {
        h: 'الملفات المرفوعة',
        body: [
          'يمكنك رفع صور (PNG أو JPEG أو WebP أو GIF، بحد أقصى ٢ ميغابايت) وملفات موارد للمختبرات (بحد أقصى ٢٥ ميغابايت) لاستخدامها في محتواك.',
          'وما ترفعه يجب أن يكون لك حق رفعه أو مرخّصًا على النحو الصحيح، وألّا يحتوي على بيانات شخصية حقيقية، وألّا يحتوي على برمجيات خبيثة. ولا تستخدم خاصية الرفع كمساحة تخزين عامة.',
          'ويجوز لنا حذف أي ملف مرفوع يخالف هذه الاتفاقية.',
        ],
      },
      {
        h: 'العمل على محتوى الآخرين',
        body: ['إذا كنت تملك إذنًا على سلة شخص آخر:'],
        list: [
          'فتعامل مع عمله على أنه عمله. صحّح الأخطاء، وحسّن الوضوح، ووسّع الموجود — ولا تعِد كتابة درس أحدهم ليصبح درسك دون أن تستأذنه؛',
          'ولا تحذف محتواه ما لم يطلب منك ذلك؛',
          'وتذكّر أن نسبة التأليف لا تنتقل، فالفضل يبقى له؛',
          'ولا تستخدم الإذن لنقل محتواه إلى سلتك أنت.',
        ],
        after: [
          'وإذا اختلفت مع مُنشِئ آخر بشأن محتواه، فتحدّث إليه، وارفع الأمر إلينا إن لم تستطيعا حلّه.',
        ],
      },
      {
        h: 'تقييمات الطلاب',
        body: [
          'يقيّم الطلاب المحتوى ويعلّقون عليه، ويمكنك رؤية تلك التقييمات مرفقةً باسم الطالب.',
          'وهذا الاطّلاع لتحسين محتواك لا غير. ويُمنع عليك مراسلة الطالب بشأن تقييمه، أو مجادلته، أو الضغط عليه لتغييره أو حذفه، أو معاملته معاملة مختلفة بسببه، أو مشاركته خارج الأكاديمية. وإذا كان التقييم مسيئًا لا نقديًا، فأبلغنا به.',
        ],
      },
      {
        h: 'محتواك والترخيص الذي تمنحنا إياه',
        emphasis: true,
        body: [
          'تحتفظ بملكية كل ما تكتبه.',
          'وتمنح سايبر خانة ترخيصًا عالميًا غير حصري، خاليًا من الإتاوات، دائمًا وغير قابل للإلغاء، لاستضافة محتواك وتخزينه وعرضه ونسخه وترجمته وتكييفه وتوزيعه عبر منتجات سايبر خانة — بما فيها منصة التحديات وأي نسخة مدفوعة مستقبلية لأيٍّ منهما — وسننسب التأليف إليك حيثما أمكن ذلك بشكل معقول.',
          'وهذا الترخيص يستمر بعد مغادرتك. فإذا توقفت عن كونك مُنشِئًا، أو حذفت حسابك بالكامل، يبقى المحتوى الذي نشرته على الأكاديمية بموجب هذا الترخيص.',
          'وهذا مقصود، وينبغي أن تفهم سببه قبل الموافقة: فالمسارات والوحدات تُجمَّع من أعمال مُنشِئين كثر، والسلال ليس فيها ملكية منفصلة لكل عنصر. وترخيصٌ ينتهي برحيل أحدهم كان سيُحدث ثغرات في دورات يقف آخرون في منتصفها، وفي محتوى بنى عليه مُنشِئون آخرون.',
          'وما لا يفعله هذا الترخيص: إنه غير حصري، فيبقى عملك ملكك تستخدمه أو تنشره أو تُدرّسه أو تبيعه في أي مكان آخر تشاء. نحن لا نأخذه منك — بل نضمن ألّا تتعطّل الأكاديمية حين تمضي في طريقك.',
          'وأنت تُقرّ بأن كل ما تنشره لك حق منحنا إياه بهذه الشروط.',
        ],
      },
      {
        h: 'إنهاء الدور',
        body: [
          'يمكنك التوقف في أي وقت. أخبرنا وسنزيل صلاحية الإنشاء عنك.',
          'ويمكننا إنهاء الدور في أي وقت، بسبب أو بغير سبب. وسنتحدث إليك أولًا في العادة. وقد نزيل صلاحيتك فورًا ودون إنذار إذا خالفت قسم معايير المحتوى أو قسم تعليم المواد الهجومية، أو إذا رأينا أن الطلاب يُعلَّمون شيئًا ضارًا أو خاطئًا، أو إذا بدا المحتوى منقولًا، أو إذا انقطعت ولم تردّ علينا.',
          'وعند انتهاء الدور: تُسحب صلاحياتك وأي أذونات لديك على سلال الآخرين؛ ويبقى المحتوى الذي نشرته بموجب الترخيص أعلاه؛ ويستمر حسابك العادي كطالب، إن أردت.',
          'وقد نعدّل أو نلغي نشر محتوى بعينه دون إنهاء دورك — مثلًا لتصحيح خطأ أو للاستجابة لشكوى أو لإزالة ما يخالف هذه الاتفاقية.',
        ],
      },
      {
        h: 'موقفك القانوني',
        body: [
          'أنت متطوّع، ولن نلاحق متطوّعًا على أخطاء صادقة وقعت أثناء أدائه العمل على الوجه الصحيح. فإن التزمت بهذه الاتفاقية وحدث خطأ رغم ذلك، فتعال إلينا ونعالج الأمر معًا.',
          'ولا تمتد هذه الحماية إلى نشر محتوى ليس لك، أو توجيه الطلاب إلى أهداف حقيقية، أو إساءة استخدام تقييمات الطلاب، أو أي شيء تفعله عمدًا أو بسوء نية أو بعد أن نطلب منك التوقف.',
          'وإذا فعلت أحد هذه الأمور ونتج عنه مطالبة أو شكوى أو تحقيق أو خسارة تطالنا، فأنت المسؤول عنها وعن التكاليف المعقولة التي تسبّبها لنا.',
          'وسايبر خانة ليست شركة مسجّلة ولا تحمل أي تأمين يغطي أنشطتك. أنت غير مشمول بأي تغطية. ونحن كذلك.',
        ],
      },
      {
        h: 'ما لا نضمنه',
        body: [
          'تُقدَّم الأكاديمية كما هي. ولا نضمن أنها ستكون متاحة أو عاملة أو خالية من الأخطاء، ولا أن محتواك سيبقى منشورًا، ولا أن أحدًا سيقرؤه، ولا أن دور المُنشِئ سيستمر في الوجود.',
          'ولا نضمن أن هذا الدور يؤدي إلى شيء، ولا أن جامعتك أو أي جهة توظيف مستقبلية ستعترف به.',
        ],
      },
      {
        h: 'أحكام عامة',
        body: [
          'القانون. تخضع هذه الاتفاقية لقوانين جمهورية العراق، وتختصّ المحاكم العراقية المختصة بالنظر في النزاعات.',
          'التغييرات. قد نحدّث هذه الاتفاقية، وسنُعلم المُنشِئين حين نفعل. واستمرارك في تأليف المحتوى بعد ذلك يعني قبولك النسخة الجديدة.',
          'اللغة. كُتبت بالإنجليزية، والترجمة العربية مقدَّمة للتيسير؛ وإذا اختلفتا، فالنسخة الإنجليزية هي المُلزِمة.',
          'الباقي. إذا تعذّر تنفيذ جزء من هذه الاتفاقية، يبقى الباقي ساريًا. وعدم إنفاذنا لأمر مرة واحدة لا يمنعنا من إنفاذه لاحقًا. ولا يمكنك نقل هذه الاتفاقية أو دورك كمُنشِئ إلى أي شخص آخر.',
        ],
      },
      {
        h: 'التواصل',
        body: ['أسئلة قبل الموافقة: support@cyberkhana.tech'],
      },
    ],
  },
};
