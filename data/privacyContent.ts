/* ── The Privacy Policy, as rendered data ──
 *
 * Authoritative text: `legal/PRIVACY.md` at the repo root (English governs; the
 * Arabic below is a convenience translation).
 *
 * Every factual claim here is checkable against the code, and several were
 * written by reading it: there are no analytics or third-party trackers, only
 * Google OAuth is implemented, exercise code never leaves the browser, the
 * leaderboard and public-profile projections (routes/leaderboard.ts,
 * routes/users.ts) exclude email and country, and the bio reaches other
 * members only when its owner has switched it on. "Deleting your account" is
 * what backend/src/utils/accountDeletion.ts does, grace period included. If
 * any of that changes, this file is wrong, in both languages, and has to
 * change with it.
 */
import type { BilingualDoc } from './legalTypes';

export const PRIVACY: BilingualDoc = {
  en: {
    title: 'Privacy Policy',
    updated: '11 September 2026',
    version: '2026-09-11',
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
          'a short bio, which stays private unless you choose to show it on your profile;',
          'links to your accounts elsewhere, such as GitHub, LinkedIn, X, TryHackMe or a website, if you choose to add them;',
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
          'whether your account is suspended;',
          'whether you have asked for your account to be deleted, and when.',
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
          'your Google name, email, picture and ID: to create your account, sign you in, and recognise you;',
          'your display name, username, picture and university: to show who you are on the leaderboard, on your public profile and beside anything you publish;',
          'your social links, and your bio if you switch it on: to show on your public profile;',
          'your country and language: to personalise the Academy and show it in your language;',
          'your progress, completions and learning time: to track where you are and pick up where you left off;',
          'your points: to build the leaderboards;',
          'your feedback and ratings: to help creators improve their content;',
          'creator content, uploads and permissions: to publish your content and control who can edit what;',
          'the auth cookie: to keep you signed in;',
          'server logs: to keep the service secure, find abuse, and fix faults.',
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
        body: ['Visible to anyone signed in to the Academy, on the leaderboard and on your public profile:'],
        list: [
          'your display name and username;',
          'your profile picture;',
          'your university, if you set one;',
          'your points, monthly points and rank;',
          'links to your accounts elsewhere, if you add them;',
          'your bio, only if you switch on "Show my bio on my public profile". It is off until you do;',
          'the content you have published as a creator.',
        ],
        after: [
          'Never shown to other members: your email address, your country, your language setting, the Google account you sign in with, when you last signed in, whether your account is suspended, whether you have asked for it to be deleted, and your learning record beyond your points.',
          'Content you publish as a creator is visible to everyone, credited to your account: your display name, username and picture appear beside it and link to your profile.',
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
          'We keep your account data for as long as your account exists. If you ask for your account to be deleted, we keep it for 7 more days in case you change your mind, and then delete it, as described below. Server logs are kept only as long as they are useful for security and debugging.',
        ],
      },
      {
        h: 'Deleting your account',
        emphasis: true,
        body: [
          'You can delete your account yourself, from the bottom of your profile page. You are signed out straight away, on every device, and your account is kept for 7 days in case you change your mind. While it waits, your profile and your place on the leaderboards are hidden from other members.',
          'Signing in again during those 7 days cancels the request, and your account comes back exactly as you left it. If you do not sign in, it is deleted automatically and permanently when the 7 days are up. After that it cannot be recovered.',
          'Administrators can see that you have asked, and when the deletion is due, next to your account in the members list. If you cannot sign in, email support@cyberkhana.tech and we will delete your account for you within 30 days of a request we can verify came from you.',
          'An administrator can also delete an account straight away, as the Terms of Service allow. That takes effect at once, with no waiting period, and deletes and keeps exactly what is listed below.',
          'What is deleted: your name, email address, profile picture, username, university, country, bio, social links, language preference, your public profile, and the link between your account and your Google identity; your learning progress, your points and your place on the leaderboards; and anything you wrote as a creator but had not published, such as drafts and content waiting for review, along with uploaded files that nothing else uses. Sharing between you and other creators ends. The leaderboards are worked out from the accounts that exist, so nobody else loses points; the members below you each move up a place.',
          'What is not deleted, and why:',
        ],
        list: [
          'Content you published as a creator stays. Lessons, modules and paths remain on the Academy under the licence in the Creator Agreement, still carrying the name you wrote them under, but no longer linked to a profile. Other creators’ Paths and Modules are built out of that content, and students are partway through it. If you are a creator, understand this before you publish, not after.',
          'Feedback you left is anonymised. The rating and the comment stay, so creators keep the substance. Your name comes off, and nothing links it to you or to the rest of your feedback any more.',
          'Server logs are not edited. They are kept only as long as they are useful for security and debugging. Records we are required to keep, and records of moderation decisions such as a ban, are retained where we need them.',
        ],
        after: [
          'Deleting your Academy account does not delete your Google account, and does not affect any account you have on the CTF platform, which is a separate service. If you sign in again after your account has been deleted, you start again with a new, empty account.',
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
          'If you are under 18, think before you fill in your profile. Your display name, username, picture and university are shown to other members on the leaderboard and on your profile, and so are any links you add. Your bio stays private unless you choose to show it. You do not have to use your real name or a photo of yourself.',
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
          'This policy is written in English, and the Arabic translation is provided for convenience. If the two versions disagree, the English version is the one that counts.',
        ],
      },
      {
        h: 'Contact',
        body: ['support@cyberkhana.tech'],
      },
    ],
  },

  ar: {
    title: 'سياسة الخصوصية',
    updated: '١١ أيلول/سبتمبر ٢٠٢٦',
    version: '2026-09-11',
    intro:
      'تشرح هذه السياسة ما تجمعه أكاديمية سايبر خانة، وما نفعله به، وما يمكنك أن تطلب منا فعله بشأنه.',
    callout: {
      heading: 'النسخة المختصرة',
      body: [
        'نجمع ما نحتاجه لتشغيل منصة تعليمية ولوحة صدارة، ولا شيء غير ذلك.',
        'ليس لدينا أي تحليلات ولا إعلانات ولا أدوات تتبّع من أطراف أخرى. لا Google Analytics ولا Facebook ولا غيرهما. هناك ملف تعريف ارتباط واحد فقط، وُجد ليُبقيك مسجَّل الدخول. ونحن لا نبيع بياناتك ولن نفعل.',
        'أمران لا يتوقّعهما معظم الناس، ولذلك نقولهما هنا بوضوح: التقييمات التي تتركها ليست مجهولة المصدر — يرى مُنشِئو المحتوى اسمك معها — وإذا حذفت حسابك، تبقى الدروس التي كتبتها كمُنشِئ منشورة. وكلاهما مشروح أدناه.',
      ],
    },
    sections: [
      {
        h: 'مَن المسؤول عن بياناتك',
        body: [
          'سايبر خانة، وهو مشروع تعليمي في مجال الأمن السيبراني يُدار من العراق. وسايبر خانة ليست شركة مسجّلة بعد، فالمسؤولية تقع على الأشخاص الذين يديرونها.',
          'ولأي أمر يخصّ بياناتك — استفسار أو تصحيح أو نسخة أو حذف — راسلنا على support@cyberkhana.tech.',
        ],
      },
      {
        h: 'ما نجمعه من Google',
        body: ['ليس لدى الأكاديمية كلمات مرور خاصة بها. أنت تسجّل الدخول عبر Google، وترسل إلينا Google:'],
        list: [
          'اسمك؛',
          'بريدك الإلكتروني، ويجب أن يكون مُوثَّقًا لدى Google؛',
          'صورتك الشخصية؛',
          'معرّف حساب Google، لنتعرّف عليك في المرة القادمة.',
        ],
        after: [
          'ونحن لا نستلم كلمة مرور Google الخاصة بك، ولا يمكننا الاطّلاع على أي شيء آخر في حسابك عليها.',
        ],
      },
      {
        h: 'ما تضيفه أنت',
        list: [
          'اسم معروض، واسم مستخدم اختياري؛',
          'صورة شخصية اختيارية، إن رفعتَ واحدة بدلًا من صورة Google؛',
          'جامعتك، تختارها من قائمة، وبلدك؛',
          'نبذة قصيرة، تبقى خاصة ما لم تختر إظهارها في ملفك؛',
          'روابط لحساباتك في مواقع أخرى، مثل GitHub وLinkedIn وX وTryHackMe أو موقعك الشخصي، إن اخترت إضافتها؛',
          'لغتك المفضّلة (الإنجليزية أو العربية).',
        ],
        after: [
          'وكل هذه اختيارية عدا الاسم المعروض، ويمكنك تغييرها أو مسحها في أي وقت من ملفك الشخصي.',
        ],
      },
      {
        h: 'ما تسجّله الأكاديمية أثناء تعلّمك',
        list: [
          'الدروس والوحدات التي أكملتها، وتقدّمك داخلها؛',
          'الوقت الذي قضيته في التعلّم، بالدقائق؛',
          'نقاطك ونقاطك الشهرية وموقعك على لوحات الصدارة؛',
          'آخر مرة سجّلت فيها الدخول؛',
          'ما إذا كان حسابك معلَّقًا؛',
          'ما إذا كنت قد طلبت حذف حسابك، ومتى.',
        ],
        after: [
          'وعندما تقيّم محتوى أو تعلّق عليه، نخزّن التقييم وتعليقك واسمك والدرس المعني واللغة التي كتبت بها.',
          'وإذا كنت مُنشِئًا، فإننا نخزّن أيضًا المحتوى الذي تؤلّفه وسجلّ تعديلاته، والملفات التي ترفعها، وصلاحيات المحتوى والأذونات التي تملكها.',
          'ومن الناحية التقنية، نخزّن ملف تعريف ارتباط واحدًا للمصادقة، وسجلّات خادم اعتيادية تشمل عنوان IP ونوع المتصفح والطلبات التي جرت، ونحتفظ بها لأغراض الأمان وتصحيح الأعطال.',
        ],
      },
      {
        h: 'ما لا نجمعه',
        body: [
          'لا نجمع تاريخ ميلادك ولا رقم هاتفك ولا عنوانك ولا بيانات الدفع ولا أي معرّفات حكومية. نحن لا نطلبها، ولا ينبغي أن ترسلها.',
          'ولا نرى الشيفرة التي تكتبها. فتمارين Python وC++ والطرفية تعمل بالكامل داخل متصفحك أنت. وشيفرتك لا تُرسل إلى خوادمنا إطلاقًا، فلا نستطيع قراءتها حتى لو أردنا.',
        ],
      },
      {
        h: 'فيمَ نستخدمها',
        list: [
          'اسمك وبريدك وصورتك ومعرّفك من Google: لإنشاء حسابك وتسجيل دخولك والتعرّف عليك؛',
          'اسمك المعروض واسم المستخدم وصورتك وجامعتك: لإظهار مَن أنت على لوحة الصدارة وفي ملفك العام وبجانب ما تنشره؛',
          'روابطك، ونبذتك إن فعّلت إظهارها: لعرضها في ملفك العام؛',
          'بلدك ولغتك: لتخصيص الأكاديمية وعرضها بلغتك؛',
          'تقدّمك وما أكملته ووقت تعلّمك: لتتبّع موضعك ومتابعة ما توقفت عنده؛',
          'نقاطك: لبناء لوحات الصدارة؛',
          'تقييماتك وتعليقاتك: لمساعدة المُنشِئين على تحسين محتواهم؛',
          'محتوى المُنشِئ والملفات المرفوعة والصلاحيات: لنشر محتواك وضبط مَن يمكنه التعديل؛',
          'ملف تعريف ارتباط المصادقة: لإبقائك مسجَّل الدخول؛',
          'سجلّات الخادم: للحفاظ على أمان الخدمة ورصد إساءة الاستخدام وإصلاح الأعطال.',
        ],
        after: [
          'ولا نستخدم بياناتك لبناء ملفات إعلانية، ولا نتخذ بشأنك قرارات آلية ذات أثر قانوني.',
          'وقد نراسلك على بريدك في Google بخصوص حسابك أو تغيير جوهري في الخدمة. ولا نرسل رسائل تسويقية.',
        ],
      },
      {
        h: 'ملفات تعريف الارتباط',
        body: [
          'ملف واحد. وهو ملف مصادقة من نوع httpOnly يُبقيك مسجَّل الدخول، ولا يمكن لجافاسكربت في متصفحك قراءته.',
          'ولا توجد ملفات إعلانية ولا تحليلية ولا أي ملفات تتبّع من أطراف أخرى. ولهذا لا تعرض الأكاديمية لافتة موافقة على الارتباطات — إذ لا شيء يستدعي موافقتك سوى الملف الذي يجعل تسجيل الدخول يعمل.',
          'كما تستخدم الأكاديمية التخزين المحلي في متصفحك لأمور عملية مثل اختيارك للغة وموضعك في الدرس. وهذا يبقى على جهازك.',
        ],
      },
      {
        h: 'مَن يرى ماذا',
        body: ['يظهر لكل مَن سجّل الدخول إلى الأكاديمية، على لوحة الصدارة وفي ملفك العام:'],
        list: [
          'اسمك المعروض واسم المستخدم؛',
          'صورتك الشخصية؛',
          'جامعتك، إن حدّدتها؛',
          'نقاطك ونقاطك الشهرية ومرتبتك؛',
          'روابط حساباتك في مواقع أخرى، إن أضفتها؛',
          'نبذتك، فقط إذا فعّلت خيار «أظهر نبذتي في ملفي العام». وهو مطفأ حتى تفعّله؛',
          'المحتوى الذي نشرته كمُنشِئ.',
        ],
        after: [
          'ولا يظهر للأعضاء الآخرين أبدًا: بريدك الإلكتروني، وبلدك، وإعداد لغتك، وحساب Google الذي تسجّل الدخول به، ووقت آخر تسجيل دخول لك، وما إذا كان حسابك معلَّقًا، وما إذا كنت قد طلبت حذفه، وسجلّ تعلّمك فيما عدا نقاطك.',
          'والمحتوى الذي تنشره كمُنشِئ مرئي للجميع، ويُنسب إلى حسابك: يظهر بجانبه اسمك المعروض واسم المستخدم وصورتك، مع رابط إلى ملفك.',
        ],
      },
      {
        h: 'التقييمات ليست مجهولة المصدر',
        emphasis: true,
        body: [
          'عندما تقيّم درسًا أو تعلّق عليه، يستطيع كل مُنشِئ محتوى وكل مشرف في الأكاديمية رؤية اسمك بجانب التقييم والتعليق.',
          'ونقول لك ذلك صراحةً بدل إخفائه، لأن معظم الناس يفترضون أن تقييم الدروس مجهول المصدر، وهو هنا ليس كذلك. والمُنشِئون مُلزَمون بألّا يستخدموه إلا لتحسين محتواهم، وبألّا يراسلوك بشأنه أو يعاملوك معاملة مختلفة بسببه — لكن الحقيقة الصريحة أنهم يستطيعون رؤية مَن كتبه.',
          'وإذا فضّلت طرح أمر ما بصورة خاصة، فراسلنا على support@cyberkhana.tech بدلًا من ترك تقييم.',
        ],
      },
      {
        h: 'مع مَن نشاركها',
        body: [
          'نحن لا نبيع بياناتك الشخصية ولن نفعل، ولا نشاركها مع معلنين أو وسطاء بيانات.',
          'ولا تصل إلى أطراف أخرى إلا بهذه الطرق:',
        ],
        list: [
          'Google، لأنك تسجّل الدخول عبرها. واستخدامك لتسجيل الدخول عبر Google يخضع أيضًا لسياسة الخصوصية الخاصة بها.',
          'مزوّد الاستضافة لدينا، وهو الذي يشغّل الخوادم التي تعمل عليها الأكاديمية.',
          'شبكة توزيع محتوى عامة (jsDelivr)، وذلك كخيار احتياطي فقط. فالأكاديمية تقدّم بيئة تشغيل Python من خوادمها عادةً، وإذا لم تكن تلك النسخة متاحة، يجلبها متصفحك من jsDelivr بدلًا منها، ما يعني أن jsDelivr ترى عنوان IP الخاص بك وأنك طلبت ذلك الملف. وهي لا ترى شيئًا عن حسابك أو تعلّمك.',
          'وعندما يقتضي القانون ذلك، أو حين نحتاج إلى حماية سلامة شخص ما.',
        ],
      },
      {
        h: 'أين تُخزَّن بياناتك',
        body: [
          'خوادم الأكاديمية وقاعدة بياناتها مستضافة على خادم افتراضي في أوروبا، يشغّله مزوّد الاستضافة لدينا.',
          'وإذا كنت تستخدم الأكاديمية من العراق أو من أي مكان خارج أوروبا، فهذا يعني أن بياناتك تُنقل خارج بلدك وتُخزَّن هناك. وباستخدامك الأكاديمية فإنك تدرك ذلك وتقبله.',
        ],
      },
      {
        h: 'مدة الاحتفاظ بها',
        body: [
          'نحتفظ ببيانات حسابك ما دام حسابك قائمًا. وإذا طلبت حذف حسابك، نحتفظ به ٧ أيام أخرى تحسّبًا لتغيير رأيك، ثم نحذفه، على النحو المبيّن أدناه. أما سجلّات الخادم فنحتفظ بها فقط ما دامت مفيدة لأغراض الأمان وتصحيح الأعطال.',
        ],
      },
      {
        h: 'حذف حسابك',
        emphasis: true,
        body: [
          'يمكنك حذف حسابك بنفسك من أسفل صفحة ملفك الشخصي. يُسجَّل خروجك فورًا من جميع الأجهزة، ونحتفظ بحسابك ٧ أيام تحسّبًا لتغيير رأيك. وخلال هذه المدة يُخفى ملفك وموقعك على لوحات الصدارة عن الأعضاء الآخرين.',
          'وتسجيل دخولك مجددًا خلال هذه الأيام السبعة يلغي الطلب، فيعود حسابك كما تركته تمامًا. وإن لم تسجّل الدخول، يُحذف حسابك تلقائيًا ونهائيًا عند انقضائها، ولا يمكن استرجاعه بعد ذلك.',
          'ويستطيع المشرفون أن يروا أنك طلبت الحذف، وموعد تنفيذه، بجانب حسابك في قائمة الأعضاء. وإذا لم تتمكن من تسجيل الدخول، فراسلنا على support@cyberkhana.tech وسنحذف حسابك خلال ٣٠ يومًا من طلبٍ نتحقق من صدوره عنك.',
          'ويجوز للمشرف أيضًا حذف حساب فورًا، على النحو الذي تسمح به شروط الخدمة. ويسري ذلك في الحال دون مدة انتظار، ويحذف ويُبقي بالضبط ما هو مبيّن أدناه.',
          'ما يُحذف: اسمك وبريدك الإلكتروني وصورتك الشخصية واسم المستخدم وجامعتك وبلدك ونبذتك وروابطك ولغتك المفضّلة وملفك العام، والرابط بين حسابك وهويتك على Google؛ وتقدّمك في التعلّم ونقاطك وموقعك على لوحات الصدارة؛ وكل ما كتبته كمُنشِئ ولم تنشره، كالمسودّات والمحتوى الذي ينتظر المراجعة، مع الملفات المرفوعة التي لا يستخدمها شيء آخر. وتنتهي المشاركة بينك وبين المُنشِئين الآخرين. ولوحات الصدارة تُحسب من الحسابات الموجودة، فلا يخسر أحد غيرك نقاطًا، ويتقدّم كل من كان بعدك مرتبة واحدة.',
          'وما لا يُحذف، ولماذا:',
        ],
        list: [
          'المحتوى الذي نشرته كمُنشِئ يبقى. فالدروس والوحدات والمسارات تظلّ على الأكاديمية بموجب الترخيص الوارد في اتفاقية المُنشِئ، حاملةً الاسم الذي كتبتها به، لكن دون رابط إلى أي ملف شخصي. ومسارات ووحدات مُنشِئين آخرين مبنيّة على ذلك المحتوى، وهناك طلاب في منتصفه. فإن كنت مُنشِئًا، افهم هذا قبل أن تنشر لا بعده.',
          'التقييمات التي تركتها تُجهَّل. يبقى التقييم والتعليق ليحتفظ المُنشِئون بمضمونهما، ويُزال اسمك، فلا يعود شيء يربطها بك أو بباقي تقييماتك.',
          'سجلّات الخادم لا تُعدَّل، ونحتفظ بها فقط ما دامت مفيدة لأغراض الأمان وتصحيح الأعطال. والسجلّات التي يلزمنا الاحتفاظ بها، وسجلّات قرارات الإشراف كالحظر، نحتفظ بها حيث نحتاج إليها.',
        ],
        after: [
          'وحذف حسابك في الأكاديمية لا يحذف حسابك على Google، ولا يؤثر على أي حساب لك على منصة التحديات، فهي خدمة منفصلة. وإذا سجّلت الدخول بعد حذف حسابك، فستبدأ من جديد بحساب جديد فارغ.',
        ],
      },
      {
        h: 'حقوقك تجاه بياناتك',
        body: ['يمكنك أن:'],
        list: [
          'تطّلع على ما نحتفظ به عنك — ومعظمه موجود في ملفك الشخصي أصلًا؛',
          'تصحّحه، مباشرةً من ملفك الشخصي أو بطلب منّا؛',
          'تحصل على نسخة منه بصيغة قابلة للقراءة؛',
          'تحذفه، على النحو المبيّن أعلاه؛',
          'تعترض على استخدام معيّن، وسنشرح أو نتوقف.',
        ],
        after: [
          'اطلب ذلك على support@cyberkhana.tech. لن نتقاضى منك شيئًا، ولن نُصعّب الأمر عليك.',
          'ولا يوجد في العراق حاليًا قانون شامل لحماية البيانات من النوع المعمول به في الاتحاد الأوروبي. وقد كتبنا هذه السياسة لنمنحك هذه الحقوق على أي حال.',
        ],
      },
      {
        h: 'إذا كان عمرك دون ١٨',
        body: [
          'الأكاديمية مخصّصة لمن بلغ ١٣ عامًا فأكثر، وإذا كان عمرك دون ١٨ فأنت بحاجة إلى إذن أحد والديك أو وليّ أمرك لاستخدامها.',
          'ولا نجمع عن علم بيانات أي شخص دون ١٣ عامًا. وإذا كنت تعتقد أن طفلًا دون ١٣ يملك حسابًا، فأخبرنا على support@cyberkhana.tech وسنحذفه.',
          'وإذا كان عمرك دون ١٨، ففكّر قبل أن تملأ ملفك الشخصي. فاسمك المعروض واسم المستخدم وصورتك وجامعتك تظهر للأعضاء الآخرين على لوحة الصدارة وفي ملفك، وكذلك أي روابط تضيفها. وتبقى نبذتك خاصة ما لم تختر إظهارها. ولستَ مضطرًا لاستخدام اسمك الحقيقي أو صورة لك.',
        ],
      },
      {
        h: 'الأمان',
        body: [
          'نحمي بياناتك باستخدام HTTPS في كل مكان، وملف مصادقة من نوع httpOnly، وتحديد لمعدّل الطلبات، وضوابط وصول قائمة على الأدوار، وخطوة إعادة مصادقة قبل الإجراءات الإدارية الحسّاسة.',
          'وكلمات المرور ليست مصدر خطر هنا، لأننا لا نملك أيًّا منها — فـ Google تتولّى تسجيل الدخول.',
          'ولا يوجد نظام آمن تمامًا. وإذا اكتشفنا خرقًا يمسّ بياناتك الشخصية، فسنُعلم المتأثرين بما حدث وبما انكشف وبما ينبغي فعله حياله، بأسرع ما نستطيع.',
          'وإذا وجدت ثغرة أمنية، فأبلغنا بها على support@cyberkhana.tech — وشروط الخدمة تشرح كيف نتعامل مع البلاغات المقدَّمة بحسن نية.',
        ],
      },
      {
        h: 'التغييرات على هذه السياسة',
        body: [
          'قد نحدّث هذه السياسة. وعندما نفعل، سنغيّر تاريخ «آخر تحديث» في الأعلى، وسنعلن عن أي تغيير جوهري داخل الأكاديمية.',
          'وإذا كان التغيير يعني أننا سنستخدم بيانات نحتفظ بها أصلًا بطريقة مختلفة جوهريًا، فسنستأذنك أولًا.',
        ],
      },
      {
        h: 'اللغة',
        body: [
          'كُتبت هذه السياسة بالإنجليزية، وهذه ترجمة عربية مقدَّمة للتيسير. وإذا اختلفت النسختان، فالنسخة الإنجليزية هي المُلزِمة.',
        ],
      },
      {
        h: 'التواصل',
        body: ['support@cyberkhana.tech'],
      },
    ],
  },
};
