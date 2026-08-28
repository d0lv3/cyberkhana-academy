import type { ProgrammingModule } from '../types';

const gettingStarted: ProgrammingModule = {
  id: 'py-getting-started',
  slug: 'getting-started',
  title: {
    en: 'Getting Started',
    ar: 'البداية',
  },
  description: {
    en: 'What Python is, what you need to run it, and how to write your first program.',
    ar: 'ما هي بايثون، وما الذي تحتاجه لتشغيلها، وكيف تكتب برنامجك الأول.',
  },
  order: 1,
  concepts: [
    /* ── 1. What Python Is (lesson) ── */
    {
      id: 'py-what-is-python',
      slug: 'what-is-python',
      title: { en: 'What Python Is', ar: 'ما هي بايثون' },
      order: 1,
      type: 'lesson',
      starterCode: `import sys

# Python can tell you about itself.
print("Version:", sys.version_info.major, sys.version_info.minor)
print("Python is running right here in your browser.")
`,
      markdownContent: {
        en: `# What Python Is

Python is a **high-level, interpreted** programming language. Two words worth unpacking, because they explain most of what it feels like to use.

---

## High-level

You write instructions that read close to English, and Python handles the machine details, memory, pointers, types. Compare the same idea in two languages:

\`\`\`python
names = ["Sara", "Ali"]
names.append("Zaid")
\`\`\`

In a low-level language you'd be deciding how much memory to reserve and when to release it. Here you just say what you want.

## Interpreted

There's no separate "compile" step you run by hand. You hand Python a source file and it executes it, line by line, top to bottom. That's why you can run a program the instant you finish typing it.

The trade-off is **speed**: Python is slower than C for raw number-crunching. It's fast enough for the overwhelming majority of real work, and when it isn't, the slow part gets pushed into a C library underneath.

---

## Why it matters in security

Python is the default language of the security world, and that's not an accident:

1. **Speed of writing**, you can go from idea to working script in minutes. When you're testing a hypothesis, that matters more than runtime speed.
2. **Batteries included**, the standard library ships with networking, hashing, JSON, regex, and file handling built in.
3. **The ecosystem**, most offensive and defensive tooling exposes a Python interface, and the ones that don't usually have a Python wrapper.

Automating a boring task, parsing a log, talking to an API, prototyping an exploit, all Python jobs.

---

## What Python is *not*

It's worth being honest about the limits:

- Not the tool for writing an operating system kernel or a device driver.
- Not typically used for browser front-ends, that's JavaScript's territory.
- Not the fastest option when microseconds genuinely matter.

Picking the right tool is part of the skill. Python is a very wide default, not a universal one.

---

## Try It

The editor has a short program that asks Python which version of itself is running. Click **Run**.

You should see \`3 12\`, this academy runs **CPython 3.12** compiled to WebAssembly, so the Python executing your code is the same Python you'd install on your machine.
`,
        ar: `# ما هي بايثون

بايثون لغة برمجة **عالية المستوى ومفسرة**. كلمتان تستحقان الشرح، لأنهما تفسران معظم ما ستشعر به أثناء استخدامها.

---

## عالية المستوى

تكتب تعليمات تقرأ وكأنها لغة إنجليزية، وبايثون تتكفل بتفاصيل الجهاز: الذاكرة، والمؤشرات، والأنواع. قارن الفكرة نفسها في لغتين:

\`\`\`python
names = ["Sara", "Ali"]
names.append("Zaid")
\`\`\`

في لغة منخفضة المستوى كنت ستقرر بنفسك كم من الذاكرة تحجز ومتى تحررها. أما هنا فتكتفي بقول ما تريد.

## مفسرة

لا توجد خطوة ترجمة (compile) منفصلة تشغلها بيدك. تسلم بايثون ملفا مصدريا فتنفذه سطرا بعد سطر، من الأعلى إلى الأسفل. لهذا تستطيع تشغيل البرنامج في اللحظة التي تنتهي فيها من كتابته.

الثمن هو **السرعة**: بايثون أبطأ من C في العمليات الحسابية الخام. وهي سريعة بما يكفي للغالبية العظمى من العمل الحقيقي، وحين لا تكون كذلك ينقل الجزء البطيء إلى مكتبة مكتوبة بلغة C تعمل تحتها.

---

## لماذا لها هذه الأهمية في الأمن السيبراني

بايثون هي اللغة الافتراضية في عالم الأمن السيبراني، وهذا ليس صدفة:

1. **سرعة الكتابة**، تستطيع الانتقال من الفكرة إلى سكربت يعمل خلال دقائق. وحين تختبر فرضية ما، فهذا أهم من سرعة التنفيذ.
2. **مكتبة قياسية شاملة**، تأتي معها أدوات جاهزة للشبكات، والتجزئة (hashing)، وJSON، والتعابير النمطية (regex)، والتعامل مع الملفات.
3. **المنظومة المحيطة بها**، معظم الأدوات الهجومية والدفاعية توفر واجهة بايثون، وما لا يوفرها منها له عادة غلاف (wrapper) مكتوب ببايثون.

أتمتة مهمة مملة، أو تحليل سجل (log)، أو التحدث إلى واجهة برمجية (API)، أو بناء نموذج أولي لاستغلال ثغرة، كلها أعمال تؤديها بايثون.

---

## ما ليست عليه بايثون

من الإنصاف أن نكون صريحين بشأن الحدود:

- ليست الأداة المناسبة لكتابة نواة نظام تشغيل أو مشغل جهاز (device driver).
- لا تستخدم عادة في واجهات المتصفح الأمامية، فتلك أرض JavaScript.
- ليست الخيار الأسرع حين تكون الميكروثانية مهمة فعلا.

اختيار الأداة الصحيحة جزء من المهارة. بايثون خيار افتراضي واسع جدا، لكنه ليس خيارا شاملا لكل شيء.

---

## جربها

في المحرر برنامج قصير يسأل بايثون عن إصدارها الذي يعمل الآن. اضغط **Run**.

من المفترض أن ترى \`3 12\`، فهذه الأكاديمية تشغل **CPython 3.12** مترجمة إلى WebAssembly، أي أن بايثون التي تنفذ شيفرتك هي نفسها بايثون التي كنت ستثبتها على جهازك.
`,
      },
    },

    /* ── 2. What You Need (lesson) ── */
    {
      id: 'py-setup',
      slug: 'setup',
      title: { en: 'What You Need', ar: 'ما الذي تحتاجه' },
      order: 2,
      type: 'lesson',
      starterCode: `# Nothing to install here, this editor is a real Python interpreter.
# On your own machine, this same file would be saved as e.g. hello.py
# and run from a terminal with:  python hello.py

print("Same language, same result, here or on your laptop.")
`,
      markdownContent: {
        en: `# What You Need

**For this course: nothing.** The editor beside these lessons is a real Python interpreter running in your browser, so you can start immediately.

But you will eventually want Python on your own machine, so here's what that involves.

---

## 1. The interpreter

Download it from [python.org/downloads](https://www.python.org/downloads/). Take the latest stable 3.x release.

On Windows, tick **"Add python.exe to PATH"** during installation. Skipping it is the single most common setup mistake, it's why \`python\` "isn't recognised" in a fresh terminal.

Check it worked:

\`\`\`
python --version
\`\`\`

Depending on your system you may need \`python3\` instead. macOS and most Linux distributions ship a Python already.

## 2. An editor

Any text editor technically works, but a real code editor pays for itself immediately, syntax highlighting, error underlining, autocomplete.

**VS Code** is the common choice: free, cross-platform, and its Python extension is excellent. PyCharm is the heavier, more opinionated alternative.

## 3. A terminal

You run Python from a command line: PowerShell or Windows Terminal on Windows, Terminal on macOS and Linux. You'll live here more than you expect.

---

## Two ways to run code

**A script**, put your code in a file ending in \`.py\` and run it:

\`\`\`
python hello.py
\`\`\`

**The REPL**, type \`python\` with no filename and you get an interactive prompt:

\`\`\`
>>> 2 + 2
4
>>> print("hi")
hi
\`\`\`

The REPL (Read-Eval-Print Loop) runs each line the moment you press Enter and shows the result. It's ideal for testing a small idea. Press Ctrl+D (or type \`exit()\`) to leave.

Scripts are for programs you keep. The REPL is for questions you have right now. This editor behaves like a script.

---

## Try It

Run the starter code. Then picture the same two lines saved as \`hello.py\` on your laptop, identical language, identical output. The only thing that changes is what launches it.
`,
        ar: `# ما الذي تحتاجه

**لهذه الدورة: لا شيء.** المحرر المجاور لهذه الدروس مفسر بايثون حقيقي يعمل داخل متصفحك، فتستطيع البدء فورا.

لكنك ستحتاج في النهاية إلى بايثون على جهازك، وإليك ما يتطلبه ذلك.

---

## 1. المفسر

نزله من [python.org/downloads](https://www.python.org/downloads/). خذ أحدث إصدار مستقر من الفرع 3.x.

على ويندوز، ضع علامة على **"Add python.exe to PATH"** أثناء التثبيت. تخطي هذه الخطوة هو أشيع خطأ في الإعداد على الإطلاق، وهو سبب رسالة "isn't recognised" عند كتابة \`python\` في طرفية جديدة.

تأكد من نجاح التثبيت:

\`\`\`
python --version
\`\`\`

قد تحتاج إلى \`python3\` بدلا منها حسب نظامك. فنظام macOS ومعظم توزيعات لينكس تأتي ومعها بايثون مثبتة أصلا.

## 2. محرر

أي محرر نصوص يفي بالغرض من الناحية التقنية، لكن محرر شيفرة حقيقي يرد تكلفته فورا: تلوين الصياغة، وتسطير الأخطاء، والإكمال التلقائي.

**VS Code** هو الخيار الشائع: مجاني، ويعمل على كل الأنظمة، وإضافة بايثون فيه ممتازة. أما PyCharm فهو البديل الأثقل والأكثر تحديدا لطريقة عملك.

## 3. طرفية

تشغل بايثون من سطر الأوامر: PowerShell أو Windows Terminal على ويندوز، وTerminal على macOS ولينكس. ستقضي هنا وقتا أطول مما تتوقع.

---

## طريقتان لتشغيل الشيفرة

**سكربت**، تضع شيفرتك في ملف ينتهي بـ \`.py\` ثم تشغله:

\`\`\`
python hello.py
\`\`\`

**الصدفة التفاعلية (REPL)**، تكتب \`python\` دون اسم ملف فتحصل على محث تفاعلي:

\`\`\`
>>> 2 + 2
4
>>> print("hi")
hi
\`\`\`

الـ REPL (اختصار Read-Eval-Print Loop) ينفذ كل سطر لحظة ضغطك Enter ويعرض النتيجة. وهو مثالي لاختبار فكرة صغيرة. اضغط Ctrl+D (أو اكتب \`exit()\`) للخروج منه.

السكربتات للبرامج التي تحتفظ بها. والـ REPL للأسئلة التي تدور في ذهنك الآن. وهذا المحرر يسلك سلوك السكربت.

---

## جربها

شغل الشيفرة الابتدائية. ثم تخيل السطرين نفسيهما محفوظين باسم \`hello.py\` على حاسوبك: اللغة نفسها، والمخرجات نفسها. الشيء الوحيد الذي يتغير هو ما يشغلها.
`,
      },
    },

    /* ── 3. Syntax and Your First Program (lesson) ── */
    {
      id: 'py-syntax-first-program',
      slug: 'syntax-first-program',
      title: { en: 'Syntax and Your First Program', ar: 'الصياغة وبرنامجك الأول' },
      order: 3,
      type: 'lesson',
      starterCode: `# Your first Python program
print("Hello, World!")

# print() can take several values, separated by commas
print("Name:", "CyberKhana", "| Year:", 2026)

# Indentation is part of the language, not decoration
if True:
    print("This line is indented, so it belongs to the if")
print("This line is not indented, so it always runs")
`,
      markdownContent: {
        en: `# Syntax and Your First Program

**Syntax** is the set of rules for how code must be written. Break them and Python refuses to run the file at all, it reports a \`SyntaxError\` before executing a single line.

---

## print()

\`print()\` displays a value:

\`\`\`python
print("Hello, World!")
\`\`\`

**Output:**
\`\`\`
Hello, World!
\`\`\`

Text goes in quotes, double or single, Python doesn't care, as long as they match:

\`\`\`python
print("Hello")   # fine
print('Hello')   # also fine
print("Hello')   # SyntaxError, mismatched quotes
\`\`\`

## Printing several values

Separate them with commas and Python inserts a space between each:

\`\`\`python
print("Name:", "CyberKhana", "| Year:", 2026)
\`\`\`

**Output:**
\`\`\`
Name: CyberKhana | Year: 2026
\`\`\`

Notice \`2026\` has no quotes. It's a number, not text, a distinction the next module builds on.

Each \`print()\` ends with a newline, so three calls produce three lines.

---

## Indentation is the syntax

This is the rule that surprises newcomers. Most languages use braces to group statements and treat indentation as cosmetic. **Python uses the indentation itself.**

\`\`\`python
if True:
    print("indented, inside the if")
print("not indented, outside the if")
\`\`\`

The indented line belongs to the \`if\`. The unindented one doesn't. Get it wrong and you get an error, not a warning:

\`\`\`python
if True:
print("boom")   # IndentationError
\`\`\`

The convention is **4 spaces** per level. Be consistent, mixing tabs and spaces in one block is an error.

## Case sensitivity

\`print\` is not \`Print\`. \`Print("hi")\` raises \`NameError: name 'Print' is not defined\`, because Python looked for something with that exact name and found nothing.

---

## One statement per line

Python reads one instruction per line. No semicolons needed:

\`\`\`python
print("first")
print("second")
\`\`\`

---

## Try It

Run the starter code and match each output line to the code that produced it.

Then break it on purpose, it's the fastest way to learn to read errors:

- Change \`print\` to \`Print\` → \`NameError\`
- Add a space before \`print("Hello, World!")\` → \`IndentationError\`
- Delete a closing quote → \`SyntaxError\`

Errors are Python telling you exactly what it couldn't understand. Read them; they're on your side.
`,
        ar: `# الصياغة وبرنامجك الأول

**الصياغة (syntax)** هي مجموعة القواعد التي تحدد كيف تكتب الشيفرة. إن خالفتها رفضت بايثون تشغيل الملف من أساسه، وأبلغتك عن \`SyntaxError\` قبل أن تنفذ سطرا واحدا.

---

## print()

الدالة \`print()\` تعرض قيمة:

\`\`\`python
print("Hello, World!")
\`\`\`

**المخرجات:**
\`\`\`
Hello, World!
\`\`\`

النص يوضع بين علامتي اقتباس، مزدوجة أو مفردة، ولا يهم بايثون أيهما تختار ما دامتا متطابقتين:

\`\`\`python
print("Hello")   # fine
print('Hello')   # also fine
print("Hello')   # SyntaxError, mismatched quotes
\`\`\`

## طباعة عدة قيم

افصل بينها بفواصل فتضع بايثون مسافة بين كل قيمة وأخرى:

\`\`\`python
print("Name:", "CyberKhana", "| Year:", 2026)
\`\`\`

**المخرجات:**
\`\`\`
Name: CyberKhana | Year: 2026
\`\`\`

لاحظ أن \`2026\` بلا علامتي اقتباس. فهو عدد لا نص، وهو تمييز تبني عليه الوحدة القادمة.

كل استدعاء لـ \`print()\` ينتهي بسطر جديد، فثلاثة استدعاءات تنتج ثلاثة أسطر.

---

## الإزاحة هي جزء من الصياغة

هذه هي القاعدة التي تفاجئ القادمين الجدد. معظم اللغات تستخدم الأقواس المعقوفة لتجميع التعليمات وتعد الإزاحة مجرد تجميل. **أما بايثون فتستخدم الإزاحة نفسها.**

\`\`\`python
if True:
    print("indented, inside the if")
print("not indented, outside the if")
\`\`\`

السطر المزاح ينتمي إلى \`if\`. وغير المزاح لا ينتمي إليه. وإن أخطأت حصلت على خطأ لا على تحذير:

\`\`\`python
if True:
print("boom")   # IndentationError
\`\`\`

العرف المتبع هو **4 مسافات** لكل مستوى. كن متسقا، فخلط المسافات مع علامات الجدولة (tabs) في كتلة واحدة خطأ.

## حساسية حالة الأحرف

\`print\` ليست \`Print\`. فاستدعاء \`Print("hi")\` يرفع \`NameError: name 'Print' is not defined\`، لأن بايثون بحثت عن اسم بهذه الصيغة تماما فلم تجد شيئا.

---

## تعليمة واحدة في كل سطر

تقرأ بايثون تعليمة واحدة في كل سطر. ولا حاجة إلى الفاصلة المنقوطة:

\`\`\`python
print("first")
print("second")
\`\`\`

---

## جربها

شغل الشيفرة الابتدائية وطابق كل سطر من المخرجات مع الشيفرة التي أنتجته.

ثم اكسرها عمدا، فهذه أسرع طريقة لتتعلم قراءة الأخطاء:

- غير \`print\` إلى \`Print\` لتحصل على \`NameError\`
- أضف مسافة قبل \`print("Hello, World!")\` لتحصل على \`IndentationError\`
- احذف علامة اقتباس مغلقة لتحصل على \`SyntaxError\`

الأخطاء هي بايثون وهي تخبرك بالضبط بما لم تستطع فهمه. اقرأها، فهي في صفك.
`,
      },
    },

    /* ── 4. Comments (lesson) ── */
    {
      id: 'py-comments',
      slug: 'comments',
      title: { en: 'Comments', ar: 'التعليقات' },
      order: 4,
      type: 'lesson',
      starterCode: `# A single-line comment, Python ignores it entirely

print("This runs")  # an inline comment, after the code

# Comments are useful for explaining a decision:
seconds = 60 * 60 * 24  # a day, in seconds
print("Seconds in a day:", seconds)

"""
A triple-quoted string sitting on its own.
Often used as a block comment.
"""

print("Done")
`,
      markdownContent: {
        en: `# Comments

A comment is a note in your source that Python **ignores completely**. It's written for humans.

---

## Single-line comments

Everything after a \`#\` on that line is a comment:

\`\`\`python
# A comment on its own line
print("Hello")   # An inline comment, after code
\`\`\`

The \`#\` only comments to the **end of the line**. The next line is code again.

## Block comments

Python has no true multi-line comment syntax. What people use instead is a triple-quoted string that isn't assigned to anything:

\`\`\`python
"""
This block is ignored
for practical purposes.
"""
\`\`\`

Be precise about what's happening here: that's a **string**, not a comment. Python evaluates it, then throws the value away because nothing uses it. The effect is a comment; the mechanism isn't.

The exception matters: a triple-quoted string as the *first* statement of a function, class, or file is a **docstring**, and Python stores it rather than discarding it. That's the subject of a later lesson.

For a genuine multi-line comment, many developers just use several \`#\` lines. Your editor will do it for a selected block with a single shortcut.

---

## Commenting out code

The other everyday use is disabling a line without deleting it:

\`\`\`python
print("this runs")
# print("this does not")
\`\`\`

Useful while narrowing down a bug.

---

## Write *why*, not *what*

The code already states what it does. A comment repeating that is noise that rots the moment the code changes:

\`\`\`python
# Poor, restates the obvious
x = 10  # set x to 10

# Better, explains a decision the code cannot express
x = 10  # max retries before we treat the host as down
\`\`\`

The second comment carries information the reader cannot get from the code. That's the bar worth aiming for.

---

## Try It

Run the starter code. The comments produce no output, only the \`print()\` calls do. The triple-quoted block prints nothing either: it's evaluated and discarded.
`,
        ar: `# التعليقات

التعليق ملاحظة في شيفرتك **تتجاهلها بايثون تماما**. وهو مكتوب للبشر.

---

## تعليقات السطر الواحد

كل ما يأتي بعد \`#\` في ذلك السطر تعليق:

\`\`\`python
# A comment on its own line
print("Hello")   # An inline comment, after code
\`\`\`

الرمز \`#\` يعلق حتى **نهاية السطر** فقط. والسطر التالي يعود شيفرة من جديد.

## التعليقات الكتلية

لا تملك بايثون صياغة حقيقية للتعليقات متعددة الأسطر. وما يستخدمه الناس بدلا منها نص بين ثلاث علامات اقتباس لا يسند إلى أي شيء:

\`\`\`python
"""
This block is ignored
for practical purposes.
"""
\`\`\`

كن دقيقا في فهم ما يجري هنا: هذا **نص (string)** لا تعليق. تقيمه بايثون ثم ترمي القيمة لأن لا أحد يستعملها. النتيجة تعليق، أما الآلية فلا.

والاستثناء مهم: النص الثلاثي الاقتباس إذا كان *أول* تعليمة في دالة أو صنف أو ملف صار **docstring**، فتخزنه بايثون بدل أن ترميه. وهذا موضوع درس لاحق.

وللحصول على تعليق متعدد الأسطر بحق، يكتفي كثير من المطورين بعدة أسطر تبدأ بـ \`#\`. ومحررك يفعل ذلك لكتلة محددة باختصار واحد.

---

## تعطيل الشيفرة بالتعليق

الاستعمال اليومي الآخر هو تعطيل سطر دون حذفه:

\`\`\`python
print("this runs")
# print("this does not")
\`\`\`

وهو مفيد أثناء تضييق دائرة البحث عن خلل.

---

## اكتب *لماذا* لا *ماذا*

الشيفرة تقول أصلا ما الذي تفعله. والتعليق الذي يكرر ذلك ضجيج يتعفن لحظة تغير الشيفرة:

\`\`\`python
# Poor, restates the obvious
x = 10  # set x to 10

# Better, explains a decision the code cannot express
x = 10  # max retries before we treat the host as down
\`\`\`

التعليق الثاني يحمل معلومة لا يستطيع القارئ استخلاصها من الشيفرة. وهذا هو المستوى الذي يستحق أن تسعى إليه.

---

## جربها

شغل الشيفرة الابتدائية. التعليقات لا تنتج أي مخرجات، وحدها استدعاءات \`print()\` تفعل. والكتلة الثلاثية الاقتباس لا تطبع شيئا أيضا: فهي تقيم ثم ترمى.
`,
      },
    },

    /* ── 5. Challenge: First Program ── */
    {
      id: 'py-ch-first-program',
      slug: 'challenge-first-program',
      title: { en: 'Challenge: First Program', ar: 'تحدي: البرنامج الأول' },
      order: 5,
      type: 'challenge',
      starterCode: `# Print these three lines, exactly:
#
#   Python is powerful
#   CyberKhana Academy
#   2026
#
# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Prints the three lines exactly, each on its own line',
          expectedOutput: 'Python is powerful\nCyberKhana Academy\n2026',
        },
      ],
      hints: [
        'Each print() call puts its output on its own line, so three lines means three calls.',
        'Text must be wrapped in quotes: print("Python is powerful")',
        'The last line is the number 2026, it works with or without quotes.',
      ],
      solution: `print("Python is powerful")
print("CyberKhana Academy")
print(2026)
`,
      markdownContent: {
        en: `# Challenge: First Program

Your turn to write code from scratch.

---

## Instructions

Print **exactly** these three lines:

\`\`\`
Python is powerful
CyberKhana Academy
2026
\`\`\`

## Rules

- Each line must appear on its own line, spelled and capitalised exactly as above.
- Use \`print()\`.
- \`2026\` may be printed as a number or as text, both produce the same output.

## What you need

Only \`print()\` from the syntax lesson. Three lines of output means three calls.

---

Click **Submit** to check your answer. Stuck? The **Hint** button below the editor will nudge you.
`,
        ar: `# تحد: البرنامج الأول

جاء دورك لتكتب الشيفرة من الصفر.

---

## التعليمات

اطبع هذه الأسطر الثلاثة **بالضبط**:

\`\`\`
Python is powerful
CyberKhana Academy
2026
\`\`\`

## القواعد

- يجب أن يظهر كل سطر في سطر مستقل، بالإملاء وحالة الأحرف نفسها الواردة أعلاه.
- استخدم \`print()\`.
- يمكن طباعة \`2026\` كعدد أو كنص، فكلاهما ينتج المخرجات نفسها.

## ما تحتاجه

فقط \`print()\` من درس الصياغة. وثلاثة أسطر من المخرجات تعني ثلاثة استدعاءات.

---

اضغط **Submit** للتحقق من إجابتك. تعثرت؟ زر **Hint** أسفل المحرر سيرشدك.
`,
      },
    },
  ],
};

export default gettingStarted;
