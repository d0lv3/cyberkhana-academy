import quizBank, { type QuizQuestion } from './linuxQuizData';

type QuizText = { question: string; options: string[] };

/** Text only: answer indexes and quiz scoring continue to use linuxQuizData. */
const translations: Record<string, QuizText[]> = {
  '2.1': [
    { question: 'ما العبارة التي يختصرها GUI؟', options: ['Graphical Universe Interface', 'Graphical Unified Interface', 'Graphical User Interface'] },
    { question: 'ما العبارة التي يختصرها CLI؟', options: ['Command Line Interface', 'Command Layout Interface', 'Command Light Interface'] },
    { question: 'ما وظيفة الأمر echo؟', options: ['طباعة محتوى ملف', 'حذف ملف', 'طباعة النص الذي يليه'] },
    { question: 'ماذا يعرض الأمر whoami؟', options: ['محتويات المجلد الحالي', 'اسم المستخدم الحالي', 'مدة تشغيل النظام'] },
  ],
  '2.2': [
    { question: 'ما نوع البيانات المحفوظة في /etc؟', options: ['المجلدات الشخصية للمستخدمين', 'ملفات إعدادات النظام', 'الملفات المؤقتة'] },
    { question: 'ما الغرض من المجلد /home؟', options: ['الملفات التنفيذية للنظام', 'ملفات المستخدمين الشخصية', 'ملفات السجل'] },
    { question: 'ما نوع البيانات الموجودة عادة في /var؟', options: ['بيانات متغيرة مثل السجلات', 'المجلدات الشخصية للمستخدمين', 'الشيفرة المصدرية للنواة'] },
    { question: 'ماذا يعرض الأمر pwd؟', options: ['مسار مجلد العمل الحالي', 'مساحة القرص المتاحة', 'العمليات الجارية'] },
    { question: 'ما وظيفة الأمر ls؟', options: ['تغيير المجلد', 'سرد محتويات المجلد', 'إنشاء ملفات جديدة'] },
    { question: 'ماذا يفعل الأمر cd؟', options: ['تغيير المجلد', 'نسخ الملفات', 'حذف الملفات'] },
  ],
  '2.3': [
    { question: 'ماذا ينشئ الأمر touch؟', options: ['ملفًا فارغًا', 'مجلدًا جديدًا', 'رابطًا رمزيًا'] },
    { question: 'ما الغرض من الأمر mkdir؟', options: ['نقل الملفات', 'إنشاء مجلد جديد', 'حذف مجلد'] },
    { question: 'ماذا يفعل الأمر cp؟', options: ['نسخ الملفات أو المجلدات', 'تغيير صلاحيات الملفات', 'ضغط الملفات'] },
    { question: 'ماذا يفعل الأمر mv؟', options: ['نقل الملفات أو إعادة تسميتها', 'عرض العمليات الجارية', 'حذف الملفات'] },
    { question: 'ما وظيفة الأمر rm؟', options: ['حذف الملفات أو المجلدات', 'إعادة تسمية الملفات', 'قراءة ملف'] },
    { question: 'ماذا يفعل الأمر cat؟', options: ['عرض محتوى الملفات فقط', 'وصل الملفات فقط', 'عرض محتوى الملفات ووصلها'] },
    { question: 'ماذا يعرض الأمر tree؟', options: ['بنية المجلدات على شكل شجرة', 'صلاحيات ملف', 'تسلسل العمليات'] },
    { question: 'ماذا يوفر الأمر man؟', options: ['صفحات دليل الأوامر', 'سجلات النظام', 'أحجام الملفات'] },
  ],
  '2.4': [
    { question: 'ما فائدة الإكمال التلقائي بمفتاح Tab في الطرفية؟', options: ['إكمال الأوامر أو أسماء الملفات تلقائيًا', 'فتح محرر نصوص', 'عرض سجل الأوامر'] },
    { question: 'لِمَ يُستخدم nano؟', options: ['تحرير الملفات النصية', 'عرض السجلات', 'ترجمة الشيفرة البرمجية'] },
    { question: 'ماذا تفعل الأنبوبة (|)؟', options: ['تمرير مخرجات أمر إلى أمر آخر', 'تشغيل أوامر بالتوازي', 'حفظ المخرجات في ملف'] },
    { question: 'لِمَ يُستخدم grep؟', options: ['البحث عن أنماط في النصوص', 'عرض حالة النظام', 'ضغط الملفات'] },
    { question: 'ماذا يفعل معامل إعادة توجيه المخرجات (>)؟', options: ['إرسال المخرجات إلى ملف', 'عرض المخرجات بترتيب عكسي', 'إرسال المخرجات إلى جهاز آخر'] },
    { question: 'ماذا يحدث عند وصل أمرين بـ &&؟', options: ['يعمل الثاني إذا نجح الأول فقط', 'يعمل الثاني إذا فشل الأول فقط', 'يعمل الأمران في الوقت نفسه'] },
  ],
  '3.1': [
    { question: 'ما المستخدمون في لينكس؟', options: ['حسابات يمكنها تسجيل الدخول وتشغيل البرامج', 'ملفات على النظام', 'مجموعات من الأوامر'] },
    { question: 'ما المجموعات في لينكس؟', options: ['تجميعات لحسابات المستخدمين', 'ملفات منفردة', 'عمليات جارية'] },
    { question: 'أي أمر يضيف مستخدمًا جديدًا؟', options: ['useradd', 'usermod', 'groups', 'passwd'] },
    { question: 'أي أمر يعدّل مستخدمًا موجودًا؟', options: ['usermod', 'userdel', 'id', 'groups'] },
    { question: 'أي أمر يحذف حساب مستخدم؟', options: ['usermod', 'userdel', 'passwd', 'useradd'] },
    { question: 'أي أمر يعرض معرّف المستخدم ومعلومات مجموعاته؟', options: ['id', 'groups', 'useradd', 'userdel'] },
  ],
  '3.2': [
    { question: 'ماذا يفعل chmod؟', options: ['تغيير صلاحيات الملف', 'تغيير ملكية الملف', 'سرد الملفات', 'حذف الملفات'] },
    { question: 'ماذا يفعل chown؟', options: ['تغيير ملكية الملف', 'تغيير صلاحيات الملف', 'عرض محتوى الملف', 'نقل الملفات'] },
    { question: 'ما المعلومات التي يعرضها ls -l؟', options: ['تفاصيل الملفات، ومنها الصلاحيات والمالك', 'أسماء الملفات فقط', 'المجلدات فقط', 'العمليات الجارية'] },
    { question: 'ما أنواع صلاحيات الملفات الثلاثة في لينكس؟', options: ['القراءة والكتابة والتنفيذ', 'البدء والإيقاف والإيقاف المؤقت', 'الإنشاء والحذف والتعديل'] },
    { question: 'ما فئات الصلاحيات التي تنطبق على ملف؟', options: ['المالك والمجموعة والآخرون', 'المستخدم الجذر فقط', 'كل المستخدمين بالتساوي'] },
    { question: 'كيف تمنح ملفًا صلاحية التنفيذ؟', options: ['chmod +x filename', 'chmod -x filename', 'chown user filename'] },
  ],
  '3.3': [
    { question: 'من هو المستخدم الجذر root في لينكس؟', options: ['مستخدم أعلى صلاحية وله وصول كامل للنظام', 'مستخدم عادي', 'مجموعة مستخدمين'] },
    { question: 'ماذا يفعل sudo؟', options: ['تشغيل أمر بصفة الجذر أو مستخدم آخر', 'حذف الملفات', 'عرض معلومات النظام'] },
    { question: 'لماذا تستخدم sudo بدل الدخول بصفة الجذر؟', options: ['للسلامة وضبط الصلاحيات', 'لأن الجذر أبطأ', 'لسرد الملفات بسرعة أكبر'] },
    { question: 'أي ملف يضبط صلاحية استخدام sudo؟', options: ['/etc/sudoers', '/etc/passwd', '/etc/group', '/etc/shadow'] },
  ],
  '4.1': [
    { question: 'ماذا يفعل apt update؟', options: ['تحديث فهرس الحزم', 'تثبيت حزم جديدة', 'إزالة الحزم'] },
    { question: 'ماذا يفعل apt upgrade؟', options: ['ترقية الحزم المثبتة', 'تثبيت حزم جديدة', 'إزالة الحزم'] },
    { question: 'كيف تثبت حزمة باستخدام APT؟', options: ['apt install package_name', 'apt remove package_name', 'apt update'] },
    { question: 'كيف تزيل حزمة باستخدام APT؟', options: ['apt remove package_name', 'apt install package_name', 'apt upgrade'] },
  ],
  '4.2': [
    { question: 'لِمَ يُستخدم dpkg؟', options: ['تثبيت حزم .deb أو إدارتها مباشرة', 'ترقية جميع الحزم', 'تحديث فهرس الحزم'] },
    { question: 'كيف تثبت حزمة .deb باستخدام dpkg؟', options: ['dpkg -i package.deb', 'apt install package.deb', 'dpkg -r package.deb'] },
    { question: 'كيف تزيل حزمة وملفات إعداداتها بالكامل؟', options: ['apt purge package_name', 'apt remove package_name', 'apt delete package_name'] },
  ],
  '5.1': [
    { question: 'أي أمر يعرض واجهات الشبكة وإعداداتها؟', options: ['ifconfig', 'ipconfig', 'route', 'ping'] },
    { question: 'ما استخدام واجهة الحلقة المحلية loopback؟', options: ['الاتصال بالجهاز المحلي نفسه', 'الاتصال بالإنترنت', 'الربط بين الشبكات'] },
    { question: 'أي أمر يختبر الاتصال بمضيف آخر؟', options: ['ping', 'ss', 'lsof', 'nmap'] },
  ],
  '5.2': [
    { question: 'ما العبارة التي يختصرها DNS؟', options: ['Domain Name System', 'Data Network Service', 'Distributed Name Server'] },
    { question: 'ما الوظيفة الأساسية لـ DNS؟', options: ['تحويل أسماء النطاقات إلى عناوين IP', 'تأمين حركة الشبكة', 'قياس عرض النطاق'] },
    { question: 'ماذا يفعل dig example.com؟', options: ['عرض سجلات DNS للنطاق example.com', 'عرض المنافذ المفتوحة على example.com', 'عرض الاتصالات النشطة'] },
  ],
  '5.3': [
    { question: 'ما بروتوكول الشبكة؟', options: ['مجموعة قواعد للتواصل', 'برنامج حاسوب', 'جهاز مادي'] },
    { question: 'لِمَ تُستخدم منافذ الشبكة؟', options: ['تمييز الخدمات على مضيف معيّن', 'تخزين الملفات', 'عرض الرسومات'] },
    { question: 'ماذا يفعل nmap -sV؟', options: ['كشف إصدارات الخدمات على المنافذ المفتوحة', 'العثور على المستخدمين النشطين', 'عرض العمليات الجارية'] },
  ],
  '6.1': [
    { question: 'ما نص الصدفة البرمجي؟', options: ['ملف نصي يحتوي على أوامر', 'برنامج مُترجم', 'ملف ثنائي'] },
    { question: 'ما السطر الذي يوضع أعلى نص Bash البرمجي؟', options: ['#!/bin/bash', '//', '<?php'] },
    { question: 'كيف تجعل نص الصدفة البرمجي قابلًا للتنفيذ؟', options: ['chmod +x script.sh', 'bash script.sh', 'run script.sh'] },
    { question: 'كيف تصل إلى قيمة متغير Bash المسمى VAR؟', options: ['$VAR', 'VAR', '@VAR', '%VAR'] },
  ],
  '6.2': [
    { question: 'لِمَ يُستخدم cron؟', options: ['جدولة المهام المتكررة', 'مراقبة العمليات', 'سرد الملفات'] },
    { question: 'أي أمر يحرر مهام cron للمستخدم الحالي؟', options: ['crontab -e', 'cron -e', 'editcron'] },
    { question: 'أي أمر يسرد مهام cron الحالية؟', options: ['crontab -l', 'cron -l', 'lscron'] },
  ],
  '7.1': [
    { question: 'أي أمر يسرد العمليات الجارية؟', options: ['ps', 'ls', 'jobs'] },
    { question: 'أي أمر يعرض نشاط العمليات لحظيًا؟', options: ['top', 'ps', 'jobs'] },
    { question: 'ماذا يفعل الأمر kill؟', options: ['يوقف عملية', 'يبدأ عملية', 'يسرد العمليات'] },
    { question: 'ماذا يفعل Ctrl+C في الطرفية؟', options: ['ينهي العملية الجارية في الواجهة', 'يعلّق العملية', 'يشغّلها في الخلفية'] },
    { question: 'أي أمر يعيد مهمة من الخلفية إلى الواجهة؟', options: ['fg', 'bg', 'jobs'] },
  ],
  '7.2': [
    { question: 'أي أداة تعرض العمليات في واجهة تفاعلية؟', options: ['htop', 'ps', 'watch'] },
    { question: 'أي أمر يعيد تشغيل أمر آخر ويحدّث مخرجاته باستمرار؟', options: ['watch', 'uptime', 'ps'] },
    { question: 'أي أمر يعرض مدة تشغيل النظام؟', options: ['uptime', 'jobs', 'ps'] },
  ],
  '8.1': [
    { question: 'ما systemd؟', options: ['مدير للنظام والخدمات', 'محرر نصوص', 'مدير حزم'] },
    { question: 'أي أمر يدير الخدمات، مثل تشغيلها وإيقافها وتمكينها؟', options: ['systemctl', 'journalctl', 'dmesg'] },
    { question: 'كيف تبدأ خدمة SSH؟', options: ['systemctl start ssh', 'ssh start', 'service sshd enable'] },
  ],
  '8.2': [
    { question: 'أي أمر يعرض رسائل سجل النواة؟', options: ['dmesg', 'journalctl -u', 'systemctl'] },
    { question: 'أي أمر يستعلم عن سجل systemd؟', options: ['journalctl', 'dmesg', 'systemctl'] },
    { question: 'ماذا يفعل journalctl -f؟', options: ['متابعة السجلات الجديدة لحظيًا', 'عرض سجلات آخر إقلاع فقط', 'تصفية السجلات حسب الخدمة'] },
  ],
  '8.3': [
    { question: 'ما الطريقة الآمنة لتثبيت حزم بايثون دون التأثير في النظام؟', options: ['استخدام بيئة افتراضية (venv)', 'استخدام sudo pip install', 'التثبيت بصفة الجذر'] },
    { question: 'كيف تنشئ بيئة افتراضية اسمها myenv؟', options: ['python3 -m venv myenv', 'virtualenv myenv', 'pip install venv'] },
    { question: 'أي أمر يفعّل بيئة venv في Bash؟', options: ['source myenv/bin/activate', 'venv activate myenv', 'activate myenv'] },
  ],
  '9.1': [
    { question: 'أي أمر ينسخ الملفات بأمان عبر SSH؟', options: ['scp', 'wget', 'curl', 'nc'] },
    { question: 'أي أداة تنزّل ملفات عبر HTTP أو HTTPS؟', options: ['scp', 'wget', 'nc'] },
    { question: 'كيف تبدأ خادم HTTP بسيطًا باستخدام بايثون 3؟', options: ['python3 -m http.server 8000', 'python -m SimpleHTTPServer 8000', 'nc -lvp 8000'] },
  ],
  '9.2': [
    { question: 'في الصدفة العكسية، من يبدأ الاتصال؟', options: ['الجهاز الهدف يتصل بالمختبِر', 'المختبِر يتصل بالجهاز الهدف', 'يتصل الطرفان في الوقت نفسه'] },
    { question: 'ما الشرط اللازم لصدفة bind؟', options: ['الجهاز الهدف يستمع على منفذ', 'المختبِر يستمع على منفذ', 'لا حاجة إلى شبكة'] },
  ],
};

/** Resolve by the original question/option so shuffled answers keep their meaning. */
export function arabicLinuxQuizText(lectureId: string, quiz: QuizQuestion): QuizText {
  const source = quizBank[lectureId];
  const index = source?.findIndex((item) => item.question === quiz.question) ?? -1;
  const translated = translations[lectureId]?.[index];
  if (!translated || index < 0) return { question: quiz.question, options: quiz.options };
  return {
    question: translated.question,
    options: quiz.options.map((option) => {
      const originalIndex = source[index].options.indexOf(option);
      return translated.options[originalIndex] ?? option;
    }),
  };
}
