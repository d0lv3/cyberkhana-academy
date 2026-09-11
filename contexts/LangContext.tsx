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
  'hero.subtitle': { en: 'A state-of-the-art cybersecurity learning platform, where cybersecurity speaks Arabic.', ar: 'منصة تعليم أمن سيبراني متطورة، عندما يتحدث الأمن السيبراني العربية.' },
  'hero.learn': { en: 'Learn', ar: 'تعلّم' },
  'hero.cta': { en: 'Start Learning', ar: 'ابدأ التعلم' },
  'hero.cta.login': { en: 'I Have An Account', ar: 'لدي حساب' },

  // Features
  'features.heading': { en: 'Structured Around How You Actually Learn', ar: 'مبنية على الطريقة الصحيحة للتعلّم' },
  'features.subtitle': { en: 'A guided roadmap from core fundamentals to job-ready skills.', ar: 'خارطة طريق موجّهة من الأساسيات إلى مهارات سوق العمل.' },
  'features.fundamentals.title': { en: 'Fundamentals', ar: 'الأساسيات' },
  'features.fundamentals.desc': { en: 'Master the three pillars: Programming, Networking, and Operating Systems. Build the foundation every cybersecurity professional needs.', ar: 'أتقن الركائز الثلاث: البرمجة، الشبكات، وأنظمة التشغيل. ابنِ الأساس الذي يحتاجه كل محترف أمن سيبراني.' },
  'features.modules.title': { en: 'Modules', ar: 'الوحدات' },
  'features.modules.desc': { en: 'Self-contained learning units on specific cybersecurity topics, available as both video and text, in Arabic and English.', ar: 'وحدات تعليمية مستقلة في مواضيع أمن سيبراني محددة، متوفرة كفيديو ونص، بالعربية والإنجليزية.' },
  'features.paths.title': { en: 'Learning Paths', ar: 'مسارات التعلم' },
  'features.paths.desc': { en: 'Structured sequences of modules organized by career track. SOC Analyst, Penetration Tester, and more.', ar: 'تسلسلات منظمة من الوحدات حسب التخصص المهني. محلل SOC، مختبر اختراق، والمزيد.' },

  // Product preview — "See it in action"
  'preview.heading': { en: 'See it in action', ar: 'شاهدها أثناء العمل' },
  'preview.subtitle': { en: 'No slides, no passive videos. Every lesson runs in a real, interactive environment, right in your browser.', ar: 'لا شرائح ولا فيديوهات سلبية. كل درس يعمل في بيئة تفاعلية حقيقية، داخل متصفحك مباشرة.' },
  'preview.lab.tag': { en: 'In-browser Labs', ar: 'مختبرات داخل المتصفح' },
  'preview.lab.title': { en: 'Write & run real code', ar: 'اكتب ونفّذ كودًا حقيقيًا' },
  'preview.lab.desc': { en: 'Open a lesson and start typing. Execute Python, Bash, and more in-browser, instant feedback, zero setup.', ar: 'افتح درسًا وابدأ الكتابة. نفّذ بايثون وباش والمزيد داخل المتصفح، نتائج فورية وبدون أي إعداد.' },
  'preview.sim.tag': { en: 'Interactive Simulations', ar: 'محاكاة تفاعلية' },
  'preview.sim.title': { en: 'Visualize how networks really work', ar: 'تصوّر كيف تعمل الشبكات فعلاً' },
  'preview.sim.desc': { en: 'Watch packets travel, NAT translate, and protocols negotiate, step by step, on a live topology.', ar: 'شاهد الحزم تنتقل وNAT يترجم والبروتوكولات تتفاوض، خطوة بخطوة على طوبولوجيا حية.' },
  'preview.practice.tag': { en: 'Practice As You Go', ar: 'تدرّب أثناء تعلّمك' },
  'preview.practice.title': { en: 'Every module ships with its own lab', ar: 'كل وحدة تأتي بمختبرها الخاص' },
  'preview.practice.desc': { en: 'Read a concept, then immediately do it. Each module opens into an interactive lab with a real shell and a real editor, write the exploit, compile it, run it, and see exactly what it does. Hands-on, not hypothetical.', ar: 'اقرأ المفهوم ثم طبّقه فوراً. كل وحدة تفتح على مختبر تفاعلي بطرفية حقيقية ومحرّر حقيقي، اكتب الاستغلال وصرّفه ونفّذه وشاهد ما يفعله بالضبط. عمليّاً لا نظريّاً.' },

  // Landing stats
  'landing.stats.tracks': { en: 'Learning Tracks', ar: 'مسارات تعليمية' },
  'landing.stats.lessons': { en: 'Interactive Lessons', ar: 'درسًا تفاعليًا' },
  'landing.stats.languages': { en: 'Languages, AR & EN', ar: 'لغتان، عربي وإنجليزي' },
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
  /* Punctuation that sits between two translated pieces in JSX rather than
     inside a string, so it never got translated with them. Arabic has its own
     comma, and a Latin one in the middle of an Arabic sentence reads as a
     typo, or worse leans the wrong way at a direction boundary. */
  'punct.comma': { en: ',', ar: '،' },
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
  'dashboard.simDesc': { en: 'Step through a live topology and watch the packets move.', ar: 'تنقّل بين الخطوات على طوبولوجيا حية وشاهد الحزم تتحرك.' },
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

  // Lab / code editor
  'lab.reset': { en: 'Reset', ar: 'إعادة تعيين' },
  'lab.resetTitle': { en: 'Reset to starter code', ar: 'استعادة الكود الأصلي' },
  'lab.run': { en: 'Run', ar: 'تشغيل' },
  'lab.running': { en: 'Running...', ar: 'جارٍ التنفيذ...' },
  'lab.submit': { en: 'Submit', ar: 'تسليم' },
  'lab.input': { en: 'Input', ar: 'الإدخال' },
  'lab.inputHint': { en: ', one line per input() call', ar: '، سطر لكل استدعاء ()input' },
  'lab.inputPlaceholder': { en: 'Type the lines your program should read...', ar: 'اكتب الأسطر التي سيقرأها برنامجك...' },
  'lab.allTestsPassed': { en: 'All tests passed', ar: 'نجحت جميع الاختبارات' },
  'lab.testsPassed': { en: 'tests passed', ar: 'اختبارات ناجحة' },
  'lab.expected': { en: 'Expected', ar: 'المتوقع' },
  'lab.got': { en: 'Got', ar: 'الناتج' },
  'lab.emptyValue': { en: '(empty)', ar: '(فارغ)' },
  'lab.hint': { en: 'Hint', ar: 'تلميح' },
  'lab.showSolution': { en: 'Show Solution', ar: 'إظهار الحل' },
  'lab.hideSolution': { en: 'Hide Solution', ar: 'إخفاء الحل' },
  'lab.solution': { en: 'Solution', ar: 'الحل' },
  'lab.output': { en: 'Output', ar: 'المخرجات' },
  'lab.outputEmpty': { en: 'Run your code to see output here.', ar: 'شغّل الكود لعرض المخرجات هنا.' },
  'lab.error': { en: 'Error', ar: 'خطأ' },
  'lab.clear': { en: 'Clear', ar: 'مسح' },
  'lab.inputPanel': { en: 'Input panel', ar: 'لوحة الإدخال' },
  'lab.testsPanel': { en: 'Test results panel', ar: 'لوحة نتائج الاختبارات' },
  'lab.outputPanel': { en: 'Output panel', ar: 'لوحة المخرجات' },

  // Difficulty levels
  'difficulty.Beginner': { en: 'Beginner', ar: 'مبتدئ' },
  'difficulty.Easy': { en: 'Easy', ar: 'سهل' },
  'difficulty.Medium': { en: 'Medium', ar: 'متوسط' },
  'difficulty.Hard': { en: 'Hard', ar: 'صعب' },
  'difficulty.Expert': { en: 'Expert', ar: 'خبير' },

  // Card meta badges
  'card.lesson': { en: 'lesson', ar: 'درس' },
  'card.lessons': { en: 'lessons', ar: 'دروس' },
  'card.challenge': { en: 'challenge', ar: 'تحدي' },
  'card.challenges': { en: 'challenges', ar: 'تحديات' },
  'card.module': { en: 'module', ar: 'وحدة' },
  'card.modules': { en: 'modules', ar: 'وحدات' },
  'card.section': { en: 'section', ar: 'قسم' },
  'card.sections': { en: 'sections', ar: 'أقسام' },
  'card.hoursShort': { en: 'h', ar: 'س' },

  // Lesson viewer + practice terminal
  'lesson.lesson': { en: 'Lesson', ar: 'درس' },
  'lesson.challenge': { en: 'Challenge', ar: 'تحدي' },
  'lesson.backToProgramming': { en: 'Back to Programming', ar: 'العودة إلى البرمجة' },
  'lesson.notFound': { en: 'Lesson not found', ar: 'الدرس غير موجود' },
  'terminal.machine': { en: 'Machine', ar: 'الجهاز' },
  'terminal.useThisIp': { en: ', use this IP to connect', ar: 'استخدم هذا العنوان للاتصال' },

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
