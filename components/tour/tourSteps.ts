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
 *
 * The tour walks the main navigation one stop at a time: Dashboard, then
 * Fundamentals, then Modules, then Paths. Each stop opens with a `requireClick`
 * step, the nav row lit and nothing else, that only moves on once the learner
 * actually clicks the row, the same click that carries them there. What
 * follows is the explaining, on the page itself. The last stop is a question
 * rather than a lecture: whether Fundamentals is worth their time or they
 * already know it.
 */

export type Localized = { en: string; ar: string };

export interface TourStep {
  id: string;
  /** `data-tour-id` of the element to light. Absent means a centred card. */
  target?: string;
  /** Where the card would rather sit. `start`/`end` are logical, so they
   *  follow the reading direction. */
  placement?: 'bottom' | 'top' | 'start' | 'end';
  /** Drop the step when the target never appears, rather than showing it
   *  centred. For navigation only some accounts have. */
  optional?: boolean;
  /** The step talks about this route, so the tour goes there first. */
  route?: string;
  /** Moves on only when the target itself is clicked, never the Next button:
   *  the row being lit is the row the learner has to actually use. Falls back
   *  to a normal Next button if the target never turns up, so the tour never
   *  strands someone on a row that failed to render. */
  requireClick?: boolean;
  title: Localized;
  body: Localized;
  /** Short supporting lines, one per bullet. */
  points?: Localized[];
  /** The closing question, in place of a Finish button: two ways onward, one
   *  for a learner who wants Fundamentals first and one for a learner who
   *  reckons they already have it. */
  branch?: {
    a: { label: Localized; route: string };
    b: { label: Localized; route: string };
  };
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
      en: 'This is where you learn security by doing it. Lessons are written in order, the exercises run in your browser, and everything you finish is counted toward where you are going. A minute here and you will know your way around.',
      ar: 'هنا تتعلم الأمن السيبراني بالممارسة. الدروس مرتبة، والتمارين تعمل داخل متصفحك، وكل ما تنهيه يحسب في طريقك. دقيقة واحدة وتعرف طريقك في الأكاديمية.',
    },
  },
  {
    id: 'dashboard-gate',
    target: 'nav-dashboard',
    placement: 'end',
    requireClick: true,
    title: { en: 'Your dashboard', ar: 'لوحتك' },
    body: {
      en: 'This is home, and it already knows where you left off. Click it to see what is waiting for you there.',
      ar: 'هذه صفحتك الرئيسية، وهي تعرف أين توقفت. اضغط عليها لترى ما ينتظرك فيها.',
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
    target: 'dashboard-level',
    placement: 'bottom',
    route: '/dashboard',
    title: { en: 'XP and level', ar: 'الخبرة والمستوى' },
    body: {
      en: 'Finished work earns XP, XP raises your level, and your level is what other members see. It is a record of the learning, not the point of it: nobody was ever hired for a number.',
      ar: 'ما تنهيه يكسبك نقاط خبرة، والنقاط ترفع مستواك، ومستواك هو ما يراه بقية الأعضاء. وهو سجل للتعلم لا غايته: فما وظف أحد من أجل رقم.',
    },
  },
  {
    id: 'fundamentals-gate',
    target: 'nav-fundamentals',
    placement: 'end',
    requireClick: true,
    title: { en: 'Start with Fundamentals', ar: 'ابدأ بالأساسيات' },
    body: {
      en: 'Three pillars everything else is built on. Click it to open the door.',
      ar: 'ثلاث ركائز يقوم عليها كل ما بعدها. اضغط عليها لتفتح الباب.',
    },
  },
  {
    id: 'fundamentals',
    target: 'fundamentals-roadmap',
    placement: 'bottom',
    title: { en: 'The road for a beginner', ar: 'طريق المبتدئ' },
    body: {
      en: 'This is the road map. Each pillar is a straight line of lessons, in the order that makes the next one make sense, in a real editor and a real shell rather than slides about one.',
      ar: 'هذه خريطة الطريق. كل ركيزة سلسلة دروس مرتبة، بالترتيب الذي يجعل ما بعده مفهوما، في محرر حقيقي وطرفية حقيقية لا في شرائح عنهما.',
    },
    points: [
      { en: 'Programming, in a real editor that runs your code', ar: 'البرمجة، في محرر حقيقي ينفذ كودك' },
      { en: 'Networking, with packets you can watch move', ar: 'الشبكات، مع حزم تراها تتحرك' },
      { en: 'Operating systems, at a real shell', ar: 'أنظمة التشغيل، على طرفية حقيقية' },
    ],
  },
  {
    id: 'modules-gate',
    target: 'nav-modules',
    placement: 'end',
    requireClick: true,
    title: { en: 'Modules', ar: 'الوحدات' },
    body: {
      en: 'One security subject, start to finish. Click it to see what is there.',
      ar: 'موضوع أمني واحد من أوله إلى آخره. اضغط عليها لترى ما فيها.',
    },
  },
  {
    id: 'modules',
    target: 'modules-grid',
    placement: 'top',
    title: { en: 'Study whatever you want, on your own', ar: 'ادرس ما تريد بنفسك' },
    body: {
      en: 'A module holds its lessons, its quizzes and usually a lab you work in. Pick whichever one interests you, in whatever order you like, and be done with it properly.',
      ar: 'تضم الوحدة دروسها واختباراتها وغالبا مختبرا تعمل فيه. اختر ما يهمك، بأي ترتيب تريد، وأتقنه.',
    },
  },
  {
    id: 'paths-gate',
    target: 'nav-paths',
    placement: 'end',
    requireClick: true,
    title: { en: 'Career paths', ar: 'المسارات المهنية' },
    body: {
      en: 'Modules arranged into a job, for the ones who would rather be told the order. Click it to see them.',
      ar: 'وحدات مرتبة على شكل مهنة، لمن يفضل أن يقال له الترتيب. اضغط عليها لتراها.',
    },
  },
  {
    id: 'paths',
    target: 'paths-grid',
    placement: 'top',
    title: { en: 'The structured way in', ar: 'الطريق المنظم' },
    body: {
      en: 'A path puts modules in the order the work itself needs, SOC analyst or penetration tester, and tracks your progress across all of them at once.',
      ar: 'يضع المسار الوحدات بالترتيب الذي يتطلبه العمل نفسه، محلل مركز عمليات أو مختبر اختراق، ويتابع تقدمك فيها جميعا.',
    },
  },
  {
    id: 'branch',
    title: { en: 'One last thing', ar: 'أمر أخير' },
    body: {
      en: 'How much do you already know? If the fundamentals are new to you, start there. If you already have them, skip ahead to a module.',
      ar: 'كم تعرف مسبقا؟ إن كانت الأساسيات جديدة عليك فابدأ بها. وإن كانت لديك مسبقا فتخط إلى إحدى الوحدات.',
    },
    branch: {
      a: {
        label: { en: "I'm new, start with Fundamentals", ar: 'أنا جديد، ابدأ بالأساسيات' },
        route: '/fundamentals',
      },
      b: {
        label: { en: 'I know the basics, show me Modules', ar: 'أعرف الأساسيات، أرني الوحدات' },
        route: '/modules',
      },
    },
  },
];
