import React, { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'en' | 'ar';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  isArabic: boolean;
}

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  'nav.login': { en: 'Login', ar: 'تسجيل الدخول' },
  'nav.getStarted': { en: 'Get Started', ar: 'ابدأ الآن' },
  'nav.logout': { en: 'Logout', ar: 'تسجيل الخروج' },

  // Hero
  'hero.badge': { en: 'Hands-on Cybersecurity Academy', ar: 'أكاديمية الأمن السيبراني العملية' },
  'hero.headline': { en: 'Learn Cybersecurity.\nFrom the Ground Up.', ar: 'تعلّم الأمن السيبراني.\nمن الصفر.' },
  'hero.subtitle': { en: 'A state-of-the-art cybersecurity learning platform — where cybersecurity speaks Arabic.', ar: 'منصة تعليم أمن سيبراني متطورة — عندما يتحدث الأمن السيبراني العربية.' },
  'hero.learn': { en: 'Learn', ar: 'تعلّم' },
  'hero.cta': { en: 'Start Learning', ar: 'ابدأ التعلم' },
  'hero.cta.login': { en: 'I Have An Account', ar: 'لدي حساب' },

  // Features
  'features.heading': { en: 'Structured Around How You Actually Learn', ar: 'مبنية على الطريقة الصحيحة للتعلّم' },
  'features.subtitle': { en: 'A guided roadmap from core fundamentals to job-ready skills.', ar: 'خارطة طريق موجّهة من الأساسيات إلى مهارات سوق العمل.' },
  'features.fundamentals.title': { en: 'Fundamentals', ar: 'الأساسيات' },
  'features.fundamentals.desc': { en: 'Master the three pillars: Programming, Networking, and Operating Systems. Build the foundation every cybersecurity professional needs.', ar: 'أتقن الركائز الثلاث: البرمجة، الشبكات، وأنظمة التشغيل. ابنِ الأساس الذي يحتاجه كل محترف أمن سيبراني.' },
  'features.modules.title': { en: 'Modules', ar: 'الوحدات' },
  'features.modules.desc': { en: 'Self-contained learning units on specific cybersecurity topics — available as both video and text, in Arabic and English.', ar: 'وحدات تعليمية مستقلة في مواضيع أمن سيبراني محددة — متوفرة كفيديو ونص، بالعربية والإنجليزية.' },
  'features.paths.title': { en: 'Learning Paths', ar: 'مسارات التعلم' },
  'features.paths.desc': { en: 'Structured sequences of modules organized by career track. SOC Analyst, Penetration Tester, and more.', ar: 'تسلسلات منظمة من الوحدات حسب التخصص المهني. محلل SOC، مختبر اختراق، والمزيد.' },

  // Why / Differentiators
  'why.heading': { en: 'Built for how you actually learn', ar: 'مصمّمة لطريقة تعلّمك الحقيقية' },
  'why.subtitle': { en: 'Not another video course. CyberKhana Academy is interactive, hands-on, and bilingual from day one.', ar: 'ليست مجرد دورة فيديو أخرى. أكاديمية سايبر خانة تفاعلية وعملية وثنائية اللغة منذ اليوم الأول.' },
  'why.sim.title': { en: 'Interactive Simulations', ar: 'محاكاة تفاعلية' },
  'why.sim.desc': { en: 'Watch real network traffic flow packet by packet — NAT, routing, and protocols come alive on screen.', ar: 'شاهد حركة الشبكة الحقيقية حزمة تلو الأخرى — NAT والتوجيه والبروتوكولات تنبض بالحياة أمامك.' },
  'why.code.title': { en: 'Code in Your Browser', ar: 'برمج داخل المتصفح' },
  'why.code.desc': { en: 'Write and run real code instantly. No installs, no setup — just open a lesson and start typing.', ar: 'اكتب ونفّذ كودًا حقيقيًا فورًا. بدون تثبيت أو إعداد — افتح الدرس وابدأ الكتابة.' },
  'why.lang.title': { en: 'Arabic & English', ar: 'بالعربية والإنجليزية' },
  'why.lang.desc': { en: 'Every concept, lesson, and challenge is fully bilingual, with proper right-to-left support.', ar: 'كل مفهوم ودرس وتحدٍّ ثنائي اللغة بالكامل، مع دعم كامل للكتابة من اليمين لليسار.' },

  // Product preview — "See it in action"
  'preview.heading': { en: 'See it in action', ar: 'شاهدها أثناء العمل' },
  'preview.subtitle': { en: 'No slides, no passive videos. Every lesson runs in a real, interactive environment — right in your browser.', ar: 'لا شرائح ولا فيديوهات سلبية. كل درس يعمل في بيئة تفاعلية حقيقية — داخل متصفحك مباشرة.' },
  'preview.lab.tag': { en: 'In-browser Labs', ar: 'مختبرات داخل المتصفح' },
  'preview.lab.title': { en: 'Write & run real code', ar: 'اكتب ونفّذ كودًا حقيقيًا' },
  'preview.lab.desc': { en: 'Open a lesson and start typing. Execute Python, Bash, and more in-browser — instant feedback, zero setup.', ar: 'افتح درسًا وابدأ الكتابة. نفّذ بايثون وباش والمزيد داخل المتصفح — نتائج فورية وبدون أي إعداد.' },
  'preview.sim.tag': { en: 'Interactive Simulations', ar: 'محاكاة تفاعلية' },
  'preview.sim.title': { en: 'Visualize how networks really work', ar: 'تصوّر كيف تعمل الشبكات فعلاً' },
  'preview.sim.desc': { en: 'Watch packets travel, NAT translate, and protocols negotiate — step by step, on a live topology.', ar: 'شاهد الحزم تنتقل وNAT يترجم والبروتوكولات تتفاوض — خطوة بخطوة على طوبولوجيا حية.' },

  // Skill progression — surfaces the in-app skill matrix + ranks
  'skills.heading': { en: 'Watch your mastery take shape', ar: 'شاهد إتقانك يتشكّل' },
  'skills.subtitle': { en: 'Every lesson you finish feeds a live skill matrix across six security pillars — so you can see exactly where you’re strong and what to train next.', ar: 'كل درس تُنهيه يغذّي مصفوفة مهارات حيّة عبر ست ركائز أمنية — لترى بالضبط أين تتفوّق وما الذي يجب أن تتدرّب عليه تالياً.' },
  'skills.matrixLabel': { en: 'Live Skill Matrix', ar: 'مصفوفة مهارات حيّة' },
  'skills.rankLabel': { en: 'Your Rank', ar: 'رتبتك' },
  'skills.point1.title': { en: 'Six security pillars', ar: 'ست ركائز أمنية' },
  'skills.point1.desc': { en: 'Offensive, defensive, networking, programming, systems, and fundamentals — each scored by what you complete.', ar: 'هجومي، دفاعي، شبكات، برمجة، أنظمة، وأساسيات — كلٌّ يُقيَّم بما تُكمله.' },
  'skills.point2.title': { en: 'See your strengths', ar: 'اعرف نقاط قوّتك' },
  'skills.point2.desc': { en: 'Your matrix highlights which pillars you’ve mastered and which still need work — so every session has a clear focus.', ar: 'تُبرز مصفوفتك الركائز التي أتقنتها وتلك التي ما زالت بحاجة إلى عمل — ليكون لكل جلسة هدف واضح.' },

  // Landing stats
  'landing.stats.tracks': { en: 'Learning Tracks', ar: 'مسارات تعليمية' },
  'landing.stats.lessons': { en: 'Interactive Lessons', ar: 'درسًا تفاعليًا' },
  'landing.stats.languages': { en: 'Languages — AR & EN', ar: 'لغتان — عربي وإنجليزي' },
  'landing.stats.handson': { en: 'Hands-on Content', ar: 'محتوى عملي' },

  // Closing CTA
  'cta.heading': { en: 'Start your cybersecurity journey today', ar: 'ابدأ رحلتك في الأمن السيبراني اليوم' },
  'cta.subtitle': { en: 'Join students across Iraq and the Arab world building real, practical security skills.', ar: 'انضم إلى طلاب في العراق والعالم العربي يبنون مهارات أمن عملية حقيقية.' },
  'cta.button': { en: 'Get Started Free', ar: 'ابدأ مجانًا' },

  // Footer
  'footer.product': { en: 'Platform', ar: 'المنصة' },
  'footer.tagline': { en: 'Learn Cybersecurity. Your Way. Your Language.', ar: 'تعلم الأمن السيبراني. بطريقتك. بلغتك.' },
  'footer.copyright': { en: '© 2026 CyberKhana Academy. All rights reserved.', ar: '© 2026 أكاديمية سايبر خانة. جميع الحقوق محفوظة.' },
  'footer.builtIn': { en: 'Built in Iraq', ar: 'صُنعت في العراق' },
  'footer.privacy': { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  'footer.terms': { en: 'Terms of Service', ar: 'شروط الخدمة' },

  // Sidebar
  'sidebar.learn': { en: 'LEARN', ar: 'تعلّم' },
  'sidebar.account': { en: 'ACCOUNT', ar: 'الحساب' },
  'sidebar.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'sidebar.fundamentals': { en: 'Fundamentals', ar: 'الأساسيات' },
  'sidebar.modules': { en: 'Modules', ar: 'الوحدات' },
  'sidebar.paths': { en: 'Paths', ar: 'المسارات' },
  'sidebar.leaderboard': { en: 'Leaderboard', ar: 'لوحة المتصدرين' },
  'sidebar.profile': { en: 'Profile', ar: 'الملف الشخصي' },

  // Dashboard
  'dashboard.welcome': { en: 'Welcome back', ar: 'مرحباً بعودتك' },
  'dashboard.overview': { en: 'Your Learning Overview', ar: 'نظرة عامة على تعلمك' },
  'dashboard.modulesCompleted': { en: 'Modules Completed', ar: 'الوحدات المكتملة' },
  'dashboard.learningTime': { en: 'Learning Time', ar: 'وقت التعلم' },
  'dashboard.pathsEnrolled': { en: 'Paths Enrolled', ar: 'المسارات المسجلة' },
  'dashboard.continueLearning': { en: 'Continue Learning', ar: 'تابع التعلم' },
  'dashboard.noActivity': { en: 'No learning activity yet', ar: 'لا يوجد نشاط تعلم بعد' },
  'dashboard.noActivityDesc': { en: 'Start a module or enroll in a path to begin your cybersecurity journey.', ar: 'ابدأ وحدة أو سجل في مسار لتبدأ رحلتك في الأمن السيبراني.' },
  'dashboard.explorePaths': { en: 'Explore Paths', ar: 'استكشف المسارات' },
  'dashboard.browseModules': { en: 'Browse Modules', ar: 'تصفح الوحدات' },
  'dashboard.hours': { en: 'hours', ar: 'ساعات' },
  'dashboard.subtitle': { en: 'Pick up where you left off and keep building your skills.', ar: 'تابع من حيث توقفت وواصل بناء مهاراتك.' },
  'dashboard.level': { en: 'Level', ar: 'المستوى' },
  'dashboard.xp': { en: 'XP', ar: 'نقاط الخبرة' },
  'dashboard.toNextLevel': { en: 'XP to next level', ar: 'نقطة للمستوى التالي' },
  'dashboard.challengesSolved': { en: 'Challenges Solved', ar: 'التحديات المحلولة' },
  'dashboard.tracks': { en: 'Learning Tracks', ar: 'مسارات التعلم' },
  'dashboard.overall': { en: 'Overall progress', ar: 'التقدّم الكلي' },
  'dashboard.exploreTracks': { en: 'Explore Tracks', ar: 'استكشف المسارات' },
  'dashboard.yourProgress': { en: 'Your Progress', ar: 'تقدّمك' },
  'dashboard.featuredSim': { en: 'Featured Simulation', ar: 'محاكاة مميزة' },
  'dashboard.simDesc': { en: 'Watch how IP addressing and NAT route traffic across a network — step by step.', ar: 'شاهد كيف توجّه عنونة IP وتقنية NAT حركة البيانات عبر الشبكة — خطوة بخطوة.' },
  'dashboard.jumpBackIn': { en: 'Jump Back In', ar: 'تابع التعلم' },
  'dashboard.start': { en: 'Start', ar: 'ابدأ' },
  'dashboard.continueBtn': { en: 'Continue', ar: 'متابعة' },
  'dashboard.lessonsLabel': { en: 'lessons', ar: 'دروس' },
  'dashboard.complete': { en: 'complete', ar: 'مكتمل' },
  'dashboard.tryNow': { en: 'Try it now', ar: 'جرّبها الآن' },

  // Paths
  'paths.enroll': { en: 'Enroll in this path', ar: 'سجّل في هذا المسار' },
  'paths.enrolled': { en: 'Enrolled', ar: 'مُسجّل' },
  'paths.continue': { en: 'Continue path', ar: 'متابعة المسار' },
  'paths.review': { en: 'Review path', ar: 'مراجعة المسار' },
  'paths.completed': { en: 'Path completed', ar: 'اكتمل المسار' },
  'paths.unavailable': { en: 'Unavailable', ar: 'غير متاح' },
  'paths.notFound': { en: 'Path not found', ar: 'المسار غير موجود' },
  'paths.back': { en: 'Back to Paths', ar: 'العودة إلى المسارات' },
  'paths.stepsLabel': { en: 'steps', ar: 'خطوات' },
  'paths.curriculum': { en: 'Curriculum', ar: 'المنهج' },

  // Profile
  'profile.title': { en: 'Profile', ar: 'الملف الشخصي' },
  'profile.subtitle': { en: 'Your account and learning progress.', ar: 'حسابك وتقدّمك في التعلم.' },
  'profile.edit': { en: 'Edit profile', ar: 'تعديل الملف' },
  'profile.save': { en: 'Save changes', ar: 'حفظ التغييرات' },
  'profile.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'profile.displayName': { en: 'Display name', ar: 'الاسم الظاهر' },
  'profile.bio': { en: 'Bio', ar: 'نبذة تعريفية' },
  'profile.bioPlaceholder': { en: 'Tell us a bit about yourself…', ar: 'أخبرنا قليلاً عن نفسك…' },
  'profile.university': { en: 'University', ar: 'الجامعة' },
  'profile.country': { en: 'Country', ar: 'البلد' },
  'profile.memberSince': { en: 'Member since', ar: 'عضو منذ' },
  'profile.role.admin': { en: 'Creator', ar: 'منشئ محتوى' },
  'profile.role.user': { en: 'Student', ar: 'طالب' },
  'profile.noBio': { en: 'No bio yet.', ar: 'لا توجد نبذة بعد.' },
  'profile.notSet': { en: 'Not set', ar: 'غير محدد' },
  'profile.progressTitle': { en: 'Progress by Track', ar: 'التقدّم حسب المسار' },
  'profile.preferences': { en: 'Preferences', ar: 'التفضيلات' },
  'profile.language': { en: 'Interface language', ar: 'لغة الواجهة' },
  'profile.signOut': { en: 'Sign out', ar: 'تسجيل الخروج' },
  'profile.lessonsDone': { en: 'Lessons done', ar: 'دروس مكتملة' },
  'profile.points': { en: 'Points', ar: 'النقاط' },

  // Leaderboard
  'leaderboard.title': { en: 'Leaderboard', ar: 'لوحة المتصدرين' },
  'leaderboard.subtitle': { en: 'See how you rank against learners across the Academy.', ar: 'اطّلع على ترتيبك بين المتعلمين في الأكاديمية.' },
  'leaderboard.overall': { en: 'All-time', ar: 'كل الأوقات' },
  'leaderboard.monthly': { en: 'This month', ar: 'هذا الشهر' },
  'leaderboard.monthlyReset': { en: 'Resets at the start of every month', ar: 'يُعاد ضبطها مع بداية كل شهر' },
  'leaderboard.allUniversities': { en: 'All universities', ar: 'كل الجامعات' },
  'leaderboard.rank': { en: 'Rank', ar: 'الترتيب' },
  'leaderboard.student': { en: 'Student', ar: 'الطالب' },
  'leaderboard.points': { en: 'Points', ar: 'النقاط' },
  'leaderboard.pts': { en: 'pts', ar: 'نقطة' },
  'leaderboard.you': { en: 'You', ar: 'أنت' },
  'leaderboard.yourRank': { en: 'Your rank', ar: 'ترتيبك' },
  'leaderboard.empty': { en: 'No one has scored yet', ar: 'لا أحد سجّل نقاطًا بعد' },
  'leaderboard.emptyDesc': { en: 'Complete modules and lessons to put your name on the board.', ar: 'أكمل الوحدات والدروس لتضع اسمك على اللوحة.' },
  'leaderboard.notRanked': { en: 'Earn points by completing content to join the leaderboard.', ar: 'اكسب النقاط بإكمال المحتوى للانضمام إلى لوحة المتصدرين.' },

  // Creator Studio
  'studio.save': { en: 'Save', ar: 'حفظ' },
  'studio.preview': { en: 'Preview', ar: 'معاينة' },
  'studio.backDefault': { en: 'Back', ar: 'رجوع' },
  'studio.contentStudio': { en: 'Content Studio', ar: 'استوديو المحتوى' },
  'studio.createContent': { en: 'Create Content', ar: 'إنشاء محتوى' },
  'studio.createNew': { en: 'Create New', ar: 'إنشاء جديد' },
  'studio.yourContent': { en: 'Your Content', ar: 'محتواك' },
  'studio.manage': { en: 'Manage', ar: 'إدارة' },
  'studio.new': { en: 'New', ar: 'جديد' },
  'studio.adminRole': { en: 'Studio Admin', ar: 'مدير الاستوديو' },
  'studio.creatorRole': { en: 'Content Creator', ar: 'منشئ محتوى' },
  'studio.welcomeLine': { en: 'craft hands-on content for the community.', ar: 'اصنع محتوى عمليًا للمجتمع.' },
  'studio.welcomeBack': { en: 'Welcome back', ar: 'مرحبًا بعودتك' },
  'studio.total': { en: 'Total', ar: 'الإجمالي' },
  'studio.published': { en: 'Published', ar: 'منشور' },
  'studio.inReview': { en: 'In Review', ar: 'قيد المراجعة' },
  'studio.drafts': { en: 'Drafts', ar: 'مسودات' },
  'studio.review': { en: 'Review', ar: 'مراجعة' },
  'studio.all': { en: 'All', ar: 'الكل' },
  'studio.search': { en: 'Search...', ar: 'بحث...' },
  'studio.items': { en: 'items', ar: 'عناصر' },
  'studio.item': { en: 'item', ar: 'عنصر' },
  'studio.startCreating': { en: 'Start creating', ar: 'ابدأ الإنشاء' },
  'studio.nothingMatches': { en: 'Nothing matches', ar: 'لا يوجد تطابق' },
  'studio.emptyHint': { en: 'Your authored lessons, challenges and modules will appear here. Pick a content type above to begin.', ar: 'ستظهر دروسك وتحدياتك ووحداتك هنا. اختر نوع محتوى بالأعلى للبدء.' },
  'studio.tryDifferent': { en: 'Try a different filter or search term.', ar: 'جرّب فلترًا أو كلمة بحث مختلفة.' },
  'studio.createFirstLesson': { en: 'Create your first lesson', ar: 'أنشئ أول درس لك' },
  'studio.builtIn': { en: 'Built-in', ar: 'مدمج' },
  'studio.untitled': { en: 'Untitled', ar: 'بدون عنوان' },
  'studio.noDescription': { en: 'No description', ar: 'لا يوجد وصف' },
  'studio.edit': { en: 'Edit', ar: 'تعديل' },
  'studio.delete': { en: 'Delete', ar: 'حذف' },
  'studio.publish': { en: 'Publish', ar: 'نشر' },
  'studio.unpublish': { en: 'Unpublish', ar: 'إلغاء النشر' },
  'studio.lessonsLabel': { en: 'lessons', ar: 'دروس' },
  'studio.sectionsLabel': { en: 'sections', ar: 'أقسام' },
  'studio.stepsLabel': { en: 'steps', ar: 'خطوات' },
  'studio.conceptsLabel': { en: 'concepts', ar: 'مفاهيم' },
  'studio.modulesLabel': { en: 'modules', ar: 'وحدات' },
  'studio.customLabel': { en: 'custom', ar: 'مخصص' },
  'studio.inModules': { en: 'In Modules', ar: 'في الوحدات' },
  'studio.addModule': { en: 'Add Module', ar: 'إضافة وحدة' },
  'studio.addConcept': { en: 'Add Concept', ar: 'إضافة مفهوم' },
  'studio.editModule': { en: 'Edit module', ar: 'تعديل الوحدة' },
  'studio.newLesson': { en: 'New Lesson', ar: 'درس جديد' },
  'studio.newModule': { en: 'New Module', ar: 'وحدة جديدة' },
  'studio.newPath': { en: 'New Path', ar: 'مسار جديد' },
  'studio.createLesson': { en: 'Create Lesson', ar: 'إنشاء درس' },
  'studio.createModule': { en: 'Create Module', ar: 'إنشاء وحدة' },
  'studio.builtInLessons': { en: 'Built-in Lessons', ar: 'الدروس المدمجة' },
  'studio.builtInModules': { en: 'Built-in Modules', ar: 'الوحدات المدمجة' },
  'studio.yourLessons': { en: 'Your Lessons', ar: 'دروسك' },
  'studio.yourModules': { en: 'Your Modules', ar: 'وحداتك' },
  'studio.yourPaths': { en: 'Your Paths', ar: 'مساراتك' },
  'studio.statusDraftDesc': { en: 'Only you can see this', ar: 'يمكنك أنت فقط رؤيته' },
  'studio.statusReviewDesc': { en: 'Submitted for approval', ar: 'مُرسل للموافقة' },
  'studio.statusPublishedDesc': { en: 'Live for all students', ar: 'متاح لجميع الطلاب' },
  'studio.justNow': { en: 'just now', ar: 'الآن' },

  // Common
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'common.comingSoon': { en: 'Coming Soon', ar: 'قريباً' },
  'common.comingSoonDesc': { en: 'This section is under development. Check back soon!', ar: 'هذا القسم قيد التطوير. عد قريباً!' },
};

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
  isArabic: false,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('academy-lang');
    return (saved === 'ar' ? 'ar' : 'en') as Lang;
  });

  useEffect(() => {
    localStorage.setItem('academy-lang', lang);
  }, [lang]);

  const t = (key: string): string => {
    return translations[key]?.[lang] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t, isArabic: lang === 'ar' }}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
