/* ─── The tour, written out ───
 *
 * One entry per stop. Everything that varies between stops lives here so the
 * host below is only mechanics: find the element, light it, place the card.
 *
 * Targets are `data-tour-id` attributes put on the real components. They are
 * deliberately not CSS selectors: a class name is a styling decision and
 * changes without warning, while a tour id is a promise that something can be
 * pointed at. A step whose target never appears is either dropped (`optional`,
 * for navigation an account may not have) or shown in the middle of the
 * screen with nothing lit, so a missing element costs a spotlight, never the
 * tour.
 */

export type Localized = { en: string; ar: string };

export interface TourStep {
  id: string;
  /** `data-tour-id` of the element to light. Absent means a centred card. */
  target?: string;
  /** Where the card would rather sit. `start`/`end` are logical, so they
   *  follow the reading direction. */
  placement?: 'bottom' | 'top' | 'start' | 'end';
  /** Lives in the navigation, which is a drawer on a phone and has to be
   *  opened before there is anything to point at. */
  inNav?: boolean;
  /** Drop the step when the target never appears, rather than showing it
   *  centred. For navigation only some accounts have. */
  optional?: boolean;
  /** The step talks about this route, so the tour goes there first. */
  route?: string;
  title: Localized;
  body: Localized;
  /** Short supporting lines, one per bullet. */
  points?: Localized[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    route: '/dashboard',
    title: {
      en: 'Welcome to CyberKhana Academy',
      ar: 'أهلا بك في أكاديمية سايبر خانة',
    },
    body: {
      en: 'This is where you learn security by doing it. Lessons are written in order, the exercises run in your browser, and everything you finish is counted toward where you are going. Two minutes here and you will know your way around.',
      ar: 'هنا تتعلم الأمن السيبراني بالممارسة. الدروس مرتبة، والتمارين تعمل داخل متصفحك، وكل ما تنهيه يحسب في طريقك. دقيقتان وتعرف طريقك في الأكاديمية.',
    },
  },
  {
    id: 'dashboard',
    target: 'nav-dashboard',
    placement: 'end',
    inNav: true,
    route: '/dashboard',
    title: { en: 'Your dashboard', ar: 'لوحتك' },
    body: {
      en: 'Home. It opens on the lesson you had last, what we suggest taking up next, and how far along you are. When you are not sure what to do, this page has already decided for you.',
      ar: 'صفحتك الرئيسية. تفتح على آخر درس كنت فيه، وعلى ما نقترح أن تأخذه بعده، وعلى موضعك من الطريق. وحين لا تدري بماذا تبدأ، فالصفحة قررت عنك.',
    },
  },
  {
    id: 'fundamentals',
    target: 'nav-fundamentals',
    placement: 'end',
    inNav: true,
    title: { en: 'Start with Fundamentals', ar: 'ابدأ بالأساسيات' },
    body: {
      en: 'Three pillars everything else is built on. If you are new, this is the door: take them in order and the rest of the Academy stops being a wall of jargon.',
      ar: 'ثلاث ركائز يقوم عليها كل ما بعدها. إن كنت مبتدئا فهذا هو الباب: خذها بالترتيب وسيتوقف باقي الأكاديمية عن كونه جدارا من المصطلحات.',
    },
    points: [
      { en: 'Programming, in a real editor that runs your code', ar: 'البرمجة، في محرر حقيقي ينفذ كودك' },
      { en: 'Networking, with packets you can watch move', ar: 'الشبكات، مع حزم تراها تتحرك' },
      { en: 'Operating systems, at a real shell', ar: 'أنظمة التشغيل، على طرفية حقيقية' },
    ],
  },
  {
    id: 'modules',
    target: 'nav-modules',
    placement: 'end',
    inNav: true,
    title: { en: 'Modules', ar: 'الوحدات' },
    body: {
      en: 'One subject, start to finish. A module holds its lessons, its quizzes and usually a lab you work in, so you can take a single topic and be done with it properly.',
      ar: 'موضوع واحد من أوله إلى آخره. تضم الوحدة دروسها واختباراتها وغالبا مختبرا تعمل فيه، فتأخذ موضوعا واحدا وتتقنه.',
    },
  },
  {
    id: 'paths',
    target: 'nav-paths',
    placement: 'end',
    inNav: true,
    title: { en: 'Career paths', ar: 'المسارات المهنية' },
    body: {
      en: 'Modules arranged into a job. A path puts them in the order the work itself needs, SOC analyst or penetration tester, and tracks you across all of them at once.',
      ar: 'وحدات مرتبة على شكل مهنة. يضعها المسار بالترتيب الذي يتطلبه العمل نفسه، محلل مركز عمليات أو مختبر اختراق، ويتابع تقدمك فيها جميعا.',
    },
  },
  {
    id: 'primary',
    target: 'dashboard-primary',
    placement: 'bottom',
    route: '/dashboard',
    title: { en: 'The one button that matters', ar: 'الزر الذي يهم' },
    body: {
      en: 'The top of this page always holds your next move: where you stopped reading, or the first step if you have not started. You never have to go looking for it.',
      ar: 'أعلى الصفحة يحمل دائما خطوتك التالية: حيث توقفت، أو أول خطوة إن لم تبدأ بعد. ولن تضطر للبحث عنها.',
    },
  },
  {
    id: 'skills',
    target: 'skill-matrix',
    placement: 'top',
    route: '/dashboard',
    title: { en: 'Your skill matrix', ar: 'مصفوفة مهاراتك' },
    body: {
      en: 'What you have covered, by area. Offensive and defensive work, networking, programming, systems and fundamentals each fill in as you finish the content that belongs to them, so the shape shows you what you have been avoiding.',
      ar: 'ما غطيته من كل مجال. الهجوم والدفاع والشبكات والبرمجة والأنظمة والأساسيات، يمتلئ كل منها بما تنهيه مما يخصه، فيريك الشكل ما كنت تتجنبه.',
    },
  },
  {
    id: 'standing',
    target: 'dashboard-standing',
    placement: 'top',
    route: '/dashboard',
    title: { en: 'XP, level and rank', ar: 'الخبرة والمستوى والترتيب' },
    body: {
      en: 'Finished work earns XP, XP raises your level, and your level is what other members see. It is a record of the learning, not the point of it: nobody was ever hired for a number.',
      ar: 'ما تنهيه يكسبك نقاط خبرة، والنقاط ترفع مستواك، ومستواك هو ما يراه بقية الأعضاء. وهو سجل للتعلم لا غايته: فما وظف أحد من أجل رقم.',
    },
  },
  {
    id: 'community',
    target: 'nav-leaderboard',
    placement: 'end',
    inNav: true,
    title: { en: 'Leaderboard and members', ar: 'المتصدرون والأعضاء' },
    body: {
      en: 'See where you stand against everyone else, or filter it down to your own university. Every name opens a public profile, which is how you find the people learning beside you.',
      ar: 'انظر أين تقف بين الجميع، أو صفّ القائمة على جامعتك وحدها. وكل اسم يفتح ملفا عاما، وبه تجد من يتعلمون إلى جانبك.',
    },
  },
  {
    id: 'profile',
    target: 'nav-profile',
    placement: 'end',
    inNav: true,
    title: { en: 'Your profile', ar: 'ملفك الشخصي' },
    body: {
      en: 'Your side of the Academy: the level you have reached, what you have finished, your university and your links. What you publish here is what other members see.',
      ar: 'جانبك من الأكاديمية: المستوى الذي بلغته، وما أنهيته، وجامعتك وروابطك. وما تنشره هنا هو ما يراه بقية الأعضاء.',
    },
  },
  {
    id: 'finish',
    route: '/dashboard',
    title: { en: 'That is the whole place', ar: 'هذا هو المكان كله' },
    body: {
      en: 'You can run this tour again whenever you like, from the question mark at the top of any page. Now the only thing left is the first lesson.',
      ar: 'يمكنك إعادة هذه الجولة متى شئت من علامة الاستفهام أعلى أي صفحة. ولم يبق الآن إلا الدرس الأول.',
    },
  },
];
