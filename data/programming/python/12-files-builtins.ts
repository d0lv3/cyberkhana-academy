import type { ProgrammingModule } from '../types';

const filesBuiltins: ProgrammingModule = {
  id: 'py-files-builtins',
  slug: 'files-builtins',
  title: {
    en: 'Files & Built-ins',
    ar: 'الملفات والدوال المدمجة',
  },
  description: {
    en: 'Reading and writing files, and the built-in functions you get for free, including map, filter and reduce.',
    ar: 'قراءة الملفات والكتابة فيها، والدوال المدمجة، بما فيها map و filter و reduce.',
  },
  order: 12,
  concepts: [
    /* ── 1. Working with Files ── */
    {
      id: 'py-files-intro',
      slug: 'files-intro',
      title: { en: 'Working with Files', ar: 'التعامل مع الملفات' },
      order: 1,
      type: 'lesson',
      starterCode: `# with open(...), opens, and closes for you
with open("notes.txt", "w") as f:
    f.write("first line\\n")
    f.write("second line\\n")

with open("notes.txt") as f:
    print(f.read())

# The old way, you must remember to close()
f = open("notes.txt")
print(f.read().strip())
f.close()
print("closed?", f.closed)

# A missing file raises rather than returning nothing
try:
    open("nope.txt")
except FileNotFoundError as e:
    print("FileNotFoundError:", e)
`,
      markdownContent: {
        en: `# Working with Files

Your programs have been losing everything the moment they end. Files are how work survives.

---

## open()

\`\`\`python
f = open("notes.txt")
\`\`\`

\`open()\` hands back a **file object**, a handle you read from or write to. It does not give you the contents.

Every open file uses a real operating-system resource, so it must be **closed**. Forget, and you leak handles; worse, written data may sit in a buffer and never reach the disk.

## with, always use this

\`\`\`python
with open("notes.txt", "w") as f:
    f.write("first line\\n")
\`\`\`

\`with\` closes the file automatically when the block ends, **including when an exception is thrown**. That's the part manual \`close()\` gets wrong:

\`\`\`python
f = open("notes.txt")
process(f.read())   # if this raises...
f.close()           # ...this never runs
\`\`\`

The \`with\` version cannot leak. Treat \`with open(...)\` as the only way you open a file, and the rest of this module gets simpler.

(It's called a *context manager*, and it works for anything with setup/teardown, locks, connections, timers.)

## The modes

The second argument says what you're doing:

| Mode | Means |
|---|---|
| \`"r"\` | read (the default), **file must exist** |
| \`"w"\` | write, **wipes the file**, creates it if missing |
| \`"a"\` | append, adds to the end, creates it if missing |
| \`"x"\` | create, **fails** if it already exists |

\`"w"\` is the dangerous one: it truncates immediately, before you write anything. Open the wrong path in \`"w"\` and it's gone.

Add \`"b"\` for binary (\`"rb"\`, \`"wb"\`) when the file isn't text, images, archives, packet captures.

## Missing files raise

\`\`\`python
open("nope.txt")   # FileNotFoundError
\`\`\`

It raises rather than returning \`None\`, loud, which is right: reading a file that isn't there is a real problem. Handling it properly is the Errors module.

---

## About this editor

Your files live in an **in-memory filesystem** inside the browser tab. Everything works exactly as it would on disk, but nothing touches your real machine, that's the sandbox from day one, and it resets when you reload the page.

---

## Try It

Run the starter code. Then change \`"w"\` to \`"x"\` on the first open and run twice, the second time it refuses, because the file now exists.
`,
        ar: `# التعامل مع الملفات

كانت برامجك تفقد كل شيء لحظة انتهائها. والملفات هي كيف ينجو العمل.

---

## open()

\`\`\`python
f = open("notes.txt")
\`\`\`

تسلمك \`open()\` **كائن ملف**، أي مقبضا تقرأ منه أو تكتب فيه. وهي لا تعطيك المحتويات.

وكل ملف مفتوح يستهلك موردا حقيقيا من نظام التشغيل، فوجب **إغلاقه**. وإن نسيت سربت المقابض، والأسوأ أن البيانات المكتوبة قد تبقى في مخزن مؤقت ولا تصل القرص أبدا.

## with، استعمل هذه دائما

\`\`\`python
with open("notes.txt", "w") as f:
    f.write("first line\\n")
\`\`\`

تغلق \`with\` الملف تلقائيا حين تنتهي الكتلة، **بما في ذلك حين يرمى استثناء**. وهذا هو الجزء الذي يخطئ فيه \`close()\` اليدوي:

\`\`\`python
f = open("notes.txt")
process(f.read())   # if this raises...
f.close()           # ...this never runs
\`\`\`

ونسخة \`with\` لا يمكن أن تسرب. عد \`with open(...)\` الطريقة الوحيدة لفتح ملف، فتصير بقية هذه الوحدة أبسط.

(ويسمى هذا *مدير سياق (context manager)*، وهو يعمل مع كل ما له تهيئة وإنهاء، كالأقفال والاتصالات والمؤقتات.)

## الأنماط

الوسيط الثاني يقول ما الذي تفعله:

| النمط | المعنى |
|---|---|
| \`"r"\` | قراءة (الافتراضي)، **ويجب أن يكون الملف موجودا** |
| \`"w"\` | كتابة، **تمسح الملف**، وتنشئه إن كان مفقودا |
| \`"a"\` | إلحاق، تضيف إلى النهاية، وتنشئ الملف إن كان مفقودا |
| \`"x"\` | إنشاء، **وتفشل** إن كان موجودا أصلا |

والنمط \`"w"\` هو الخطر: فهو يقتطع الملف فورا قبل أن تكتب أي شيء. وافتح المسار الخطأ بـ \`"w"\` فيضيع.

وأضف \`"b"\` للنمط الثنائي (\`"rb"\` و\`"wb"\`) حين لا يكون الملف نصيا، كالصور والأرشيفات وملفات التقاط الحزم.

## الملفات المفقودة ترفع خطأ

\`\`\`python
open("nope.txt")   # FileNotFoundError
\`\`\`

فهي ترفع خطأ بدل أن تعيد \`None\`، أي بصوت عال، وهذا صحيح: فقراءة ملف غير موجود مشكلة حقيقية. ومعالجة ذلك كما ينبغي في وحدة الأخطاء.

---

## عن هذا المحرر

تعيش ملفاتك في **نظام ملفات في الذاكرة** داخل لسان المتصفح. وكل شيء يعمل تماما كما يعمل على القرص، لكن لا شيء يمس جهازك الحقيقي، فتلك هي البيئة المعزولة منذ اليوم الأول، وهي تصفر عند إعادة تحميل الصفحة.

---

## جربها

شغل الشيفرة الابتدائية. ثم غير \`"w"\` إلى \`"x"\` في أول فتح وشغلها مرتين، ففي المرة الثانية ترفض لأن الملف صار موجودا.
`,
      },
    },

    /* ── 2. Reading Files ── */
    {
      id: 'py-files-read',
      slug: 'files-read',
      title: { en: 'Reading Files', ar: 'قراءة الملفات' },
      order: 2,
      type: 'lesson',
      starterCode: `with open("hosts.txt", "w") as f:
    f.write("10.0.0.5\\n10.0.0.6\\n10.0.0.7\\n")

# read(), the whole file as ONE string
with open("hosts.txt") as f:
    print(repr(f.read()))

# readlines(), a list of lines, newlines included
with open("hosts.txt") as f:
    print(f.readlines())

# readline(), one line at a time
with open("hosts.txt") as f:
    print(repr(f.readline()))

# Looping the file, the best way
with open("hosts.txt") as f:
    for line in f:
        print("host:", line.strip())

# A file can only be read ONCE without rewinding
with open("hosts.txt") as f:
    first = f.read()
    second = f.read()
print("second read:", repr(second))
`,
      markdownContent: {
        en: `# Reading Files

Four ways in. They differ in how much they pull into memory at once.

---

## read()

The whole file as **one string**:

\`\`\`python
with open("hosts.txt") as f:
    content = f.read()   # '10.0.0.5\\n10.0.0.6\\n10.0.0.7\\n'
\`\`\`

Simple, and it loads **everything into memory**. Fine for a config file, ruinous for a 10 GB log.

## readlines()

A **list** of lines, with the \`\\n\` still on the end of each:

\`\`\`python
f.readlines()   # ['10.0.0.5\\n', '10.0.0.6\\n', '10.0.0.7\\n']
\`\`\`

Those trailing newlines cause more bugs than anything else in this module. \`"10.0.0.5\\n" == "10.0.0.5"\` is \`False\`. Always \`.strip()\` before comparing.

Also loads the whole file.

## Looping the file, do this

\`\`\`python
with open("hosts.txt") as f:
    for line in f:
        print(line.strip())
\`\`\`

A file object is **iterable**, handing you one line at a time and holding only that line in memory. It works identically on a 3-line file and a 3-million-line one.

This is the idiomatic way to read a text file in Python. Reach for it by default; use \`read()\` only when you genuinely want the whole thing as a string.

## readline()

One line per call. You rarely need it, the loop is better.

---

## A file is read once

The subtle one:

\`\`\`python
with open("hosts.txt") as f:
    first = f.read()    # everything
    second = f.read()   # ''  <- empty!
\`\`\`

A file has a **position**, which advances as you read. After \`read()\` you're at the end, so there's nothing left. It's a stream, not a container.

This bites when you loop a file twice: the second loop does nothing, silently. Either rewind with \`f.seek(0)\`, or read once into a list and reuse that.

---

## Try It

Run the starter code. Look at \`readlines()\` keeping the \`\\n\`, and at the second \`read()\` returning \`''\`.
`,
        ar: `# قراءة الملفات

أربع طرق للدخول. وهي تختلف في مقدار ما تسحبه إلى الذاكرة دفعة واحدة.

---

## read()

الملف كله بوصفه **نصا واحدا**:

\`\`\`python
with open("hosts.txt") as f:
    content = f.read()   # '10.0.0.5\\n10.0.0.6\\n10.0.0.7\\n'
\`\`\`

بسيطة، وهي تحمل **كل شيء إلى الذاكرة**. ولا بأس بها لملف إعدادات، وهي كارثية لسجل حجمه 10 غيغابايت.

## readlines()

**قائمة** من الأسطر، وما زال \`\\n\` في نهاية كل منها:

\`\`\`python
f.readlines()   # ['10.0.0.5\\n', '10.0.0.6\\n', '10.0.0.7\\n']
\`\`\`

وتلك الأسطر الجديدة المتخلفة تسبب من الأخطاء أكثر من أي شيء آخر في هذه الوحدة. فـ \`"10.0.0.5\\n" == "10.0.0.5"\` تساوي \`False\`. استعمل \`.strip()\` دائما قبل المقارنة.

وهي تحمل الملف كله أيضا.

## المرور على الملف، افعل هذا

\`\`\`python
with open("hosts.txt") as f:
    for line in f:
        print(line.strip())
\`\`\`

كائن الملف **قابل للتكرار**، فيسلمك سطرا في كل مرة ولا يحتفظ في الذاكرة إلا بذلك السطر. وهو يعمل بالطريقة نفسها على ملف من ثلاثة أسطر وعلى ملف من ثلاثة ملايين.

وهذه هي الطريقة المتعارف عليها لقراءة ملف نصي في بايثون. اجعلها خيارك الافتراضي، ولا تستعمل \`read()\` إلا حين تريد فعلا الملف كله نصا واحدا.

## readline()

سطر واحد لكل استدعاء. ونادرا ما تحتاجها، فالحلقة أفضل.

---

## الملف يقرأ مرة واحدة

النقطة الدقيقة:

\`\`\`python
with open("hosts.txt") as f:
    first = f.read()    # everything
    second = f.read()   # ''  <- empty!
\`\`\`

للملف **موضع** يتقدم كلما قرأت. وبعد \`read()\` تكون في النهاية، فلا يبقى شيء. فهو دفق لا حاوية.

وهذا يلدغ حين تمر على ملف مرتين: فالمرور الثاني لا يفعل شيئا، بصمت. فإما أن ترجع بـ \`f.seek(0)\`، وإما أن تقرأ مرة واحدة إلى قائمة وتعيد استعمالها.

---

## جربها

شغل الشيفرة الابتدائية. وانظر إلى \`readlines()\` وهي تبقي \`\\n\`، وإلى \`read()\` الثانية وهي تعيد \`''\`.
`,
      },
    },

    /* ── 3. Writing and Appending ── */
    {
      id: 'py-files-write',
      slug: 'files-write',
      title: { en: 'Writing and Appending', ar: 'الكتابة والإضافة' },
      order: 3,
      type: 'lesson',
      starterCode: `# "w" creates, and WIPES an existing file
with open("log.txt", "w") as f:
    f.write("first\\n")

with open("log.txt", "w") as f:      # the 'first' line is now gone
    f.write("second\\n")

with open("log.txt") as f:
    print("after two writes:", repr(f.read()))

# "a" appends
with open("log.txt", "a") as f:
    f.write("third\\n")

with open("log.txt") as f:
    print("after append:", repr(f.read()))

# write() adds NO newline of its own
with open("run.txt", "w") as f:
    f.write("a")
    f.write("b")
with open("run.txt") as f:
    print("no newlines:", repr(f.read()))

# writelines() writes a list, also no newlines added
with open("hosts.txt", "w") as f:
    f.writelines([h + "\\n" for h in ["10.0.0.5", "10.0.0.6"]])

# print(file=...) DOES add a newline
with open("hosts.txt", "a") as f:
    print("10.0.0.7", file=f)

with open("hosts.txt") as f:
    print(f.read())
`,
      markdownContent: {
        en: `# Writing and Appending

---

## "w" wipes

The one to be careful with:

\`\`\`python
with open("log.txt", "w") as f:
    f.write("first\\n")

with open("log.txt", "w") as f:   # truncates immediately
    f.write("second\\n")
\`\`\`

The file now holds only \`second\`. \`"w"\` empties the file the moment it opens, **before** you write a byte, so even opening in \`"w"\` and writing nothing destroys the contents.

There's no undo and no confirmation. Check the path twice.

## "a" appends

\`\`\`python
with open("log.txt", "a") as f:
    f.write("third\\n")
\`\`\`

Adds to the end, keeping what's there, and creates the file if it's missing. This is what a log wants.

---

## write() adds no newline

\`\`\`python
f.write("a")
f.write("b")     # the file contains 'ab', on one line
\`\`\`

Unlike \`print\`, \`write()\` puts down **exactly** what you give it. If you want a line, include \`\\n\`:

\`\`\`python
f.write("10.0.0.5\\n")
\`\`\`

It also takes **only strings**, \`f.write(42)\` is a \`TypeError\`. Convert first.

## writelines()

Writes a list of strings, and, despite the name, **adds no newlines either**:

\`\`\`python
f.writelines(["a", "b"])                    # 'ab'
f.writelines([h + "\\n" for h in hosts])     # one per line
\`\`\`

## print(file=...)

Often the nicest option: \`print\` does its usual job, converts non-strings, adds a newline, but into a file:

\`\`\`python
print("10.0.0.7", file=f)
print("count:", 42, file=f)   # numbers fine, no str() needed
\`\`\`

If you find yourself writing \`f.write(str(x) + "\\n")\`, this is what you wanted.

---

## Try It

Run the starter code. The two \`"w"\` opens leave only \`second\`, proof that \`"w"\` really does throw the file away.
`,
        ar: `# الكتابة والإلحاق

---

## النمط "w" يمسح

هذا هو ما ينبغي الحذر منه:

\`\`\`python
with open("log.txt", "w") as f:
    f.write("first\\n")

with open("log.txt", "w") as f:   # truncates immediately
    f.write("second\\n")
\`\`\`

صار الملف الآن يحمل \`second\` فقط. فالنمط \`"w"\` يفرغ الملف لحظة فتحه، **قبل** أن تكتب بايتا واحدا، فحتى الفتح بـ \`"w"\` دون كتابة شيء يدمر المحتويات.

ولا تراجع ولا تأكيد. تحقق من المسار مرتين.

## النمط "a" يلحق

\`\`\`python
with open("log.txt", "a") as f:
    f.write("third\\n")
\`\`\`

يضيف إلى النهاية ويبقي ما هناك، وينشئ الملف إن كان مفقودا. وهذا ما يريده السجل.

---

## write() لا تضيف سطرا جديدا

\`\`\`python
f.write("a")
f.write("b")     # the file contains 'ab', on one line
\`\`\`

فخلافا لـ \`print\`، تضع \`write()\` **بالضبط** ما تعطيه إياها. فإن أردت سطرا فأدرج \`\\n\`:

\`\`\`python
f.write("10.0.0.5\\n")
\`\`\`

وهي تقبل **النصوص فقط**، فـ \`f.write(42)\` يعطي \`TypeError\`. حول أولا.

## writelines()

تكتب قائمة من النصوص، ورغم اسمها **فهي لا تضيف أسطرا جديدة أيضا**:

\`\`\`python
f.writelines(["a", "b"])                    # 'ab'
f.writelines([h + "\\n" for h in hosts])     # one per line
\`\`\`

## print(file=...)

وهو الخيار الأجمل غالبا: تؤدي \`print\` عملها المعتاد فتحول ما ليس نصا وتضيف سطرا جديدا، لكن إلى ملف:

\`\`\`python
print("10.0.0.7", file=f)
print("count:", 42, file=f)   # numbers fine, no str() needed
\`\`\`

فإن وجدت نفسك تكتب \`f.write(str(x) + "\\n")\` فهذا هو ما كنت تريده.

---

## جربها

شغل الشيفرة الابتدائية. عمليتا الفتح بـ \`"w"\` تتركان \`second\` وحدها، وهذا برهان على أن \`"w"\` ترمي الملف فعلا.
`,
      },
    },

    /* ── 4. Files in Practice ── */
    {
      id: 'py-files-practice',
      slug: 'files-practice',
      title: { en: 'Files in Practice', ar: 'الملفات عمليا' },
      order: 4,
      type: 'lesson',
      starterCode: `import os

with open("scan.log", "w") as f:
    f.write("GET /home 200\\n")
    f.write("\\n")
    f.write("# comment\\n")
    f.write("POST /login 401\\n")

# os.path, ask before you open
print("exists:", os.path.exists("scan.log"))
print("size:", os.path.getsize("scan.log"), "bytes")
print("missing:", os.path.exists("nope.txt"))

# The real-world read: skip noise, strip lines
errors = 0
with open("scan.log") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if int(line.split()[-1]) >= 400:
            errors += 1
print("errors:", errors)

# Build paths with os.path.join, never with "+"
print(os.path.join("logs", "2026", "scan.log"))

os.remove("scan.log")
print("after remove:", os.path.exists("scan.log"))
`,
      markdownContent: {
        en: `# Files in Practice

The things that matter once files stop being an exercise.

---

## Ask before you open

\`\`\`python
import os
os.path.exists("scan.log")    # True / False
os.path.getsize("scan.log")   # bytes
os.remove("scan.log")         # delete
\`\`\`

\`os.path.exists()\` looks like the polite way to avoid \`FileNotFoundError\`. Be aware it isn't airtight: the file can vanish between your check and your open. That gap is a real class of bug (and, in security, a real class of vulnerability, a TOCTOU race).

The robust pattern is to just open it and handle the failure, "easier to ask forgiveness than permission," which is very much the Python way. That's the Errors module. Use \`exists()\` for reporting; use \`try\` for correctness.

## Build paths properly

\`\`\`python
os.path.join("logs", "2026", "scan.log")   # logs/2026/scan.log
\`\`\`

Not \`"logs" + "/" + name\`. \`join\` uses the right separator for the platform, so your script survives moving between Linux and Windows. (\`pathlib\` is the modern, nicer alternative, worth looking up once you're comfortable.)

## Encoding

Text files are bytes, and an **encoding** maps bytes to characters. Python assumes your platform's default, which differs between machines, a script that works for you can raise \`UnicodeDecodeError\` on a colleague's laptop.

Be explicit:

\`\`\`python
open("notes.txt", encoding="utf-8")
\`\`\`

For an academy that teaches in Arabic and English, this isn't optional. UTF-8 handles every script; the old defaults do not. Make \`encoding="utf-8"\` a habit.

## The shape of a real file read

\`\`\`python
with open("scan.log") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        ...
\`\`\`

Every element earns its place:

- **\`with\`**, it closes, even on an exception
- **\`for line in f\`**, one line in memory, any file size
- **\`.strip()\`**, kills the trailing \`\\n\` before it ruins a comparison
- **\`continue\`**, skips noise, keeps the real work unindented

That's Module 10's log summary, now reading from disk. Memorise this shape; you'll write it constantly.

---

## Try It

Run the starter code, it writes a log, reads it back skipping noise, and cleans up after itself.
`,
        ar: `# الملفات في الممارسة

الأمور التي تهم حين تكف الملفات عن كونها تمرينا.

---

## اسأل قبل أن تفتح

\`\`\`python
import os
os.path.exists("scan.log")    # True / False
os.path.getsize("scan.log")   # bytes
os.remove("scan.log")         # delete
\`\`\`

تبدو \`os.path.exists()\` الطريقة المهذبة لتفادي \`FileNotFoundError\`. وانتبه إلى أنها ليست محكمة: فقد يختفي الملف بين لحظة فحصك ولحظة فتحك. وتلك الفجوة صنف حقيقي من الأخطاء (وفي الأمن السيبراني صنف حقيقي من الثغرات، وهو سباق TOCTOU).

والنمط المتين هو أن تفتحه ببساطة وتعالج الفشل، على قاعدة "طلب الصفح أسهل من طلب الإذن"، وهذه بايثونية جدا. وذلك في وحدة الأخطاء. استعمل \`exists()\` للإبلاغ، واستعمل \`try\` للصحة.

## ابن المسارات كما ينبغي

\`\`\`python
os.path.join("logs", "2026", "scan.log")   # logs/2026/scan.log
\`\`\`

لا \`"logs" + "/" + name\`. فـ \`join\` تستعمل الفاصل الصحيح للمنصة، فينجو سكربتك عند الانتقال بين لينكس وويندوز. (والوحدة \`pathlib\` هي البديل الحديث الأجمل، وتستحق الاطلاع عليها حين تستقر قدمك.)

## الترميز

الملفات النصية بايتات، و**الترميز (encoding)** يربط البايتات بالمحارف. وبايثون تفترض الافتراضي الخاص بمنصتك، وهو يختلف بين جهاز وآخر، فالسكربت الذي يعمل عندك قد يرفع \`UnicodeDecodeError\` على حاسوب زميلك.

كن صريحا:

\`\`\`python
open("notes.txt", encoding="utf-8")
\`\`\`

ولأكاديمية تعلم بالعربية والإنجليزية، هذا ليس اختياريا. فترميز UTF-8 يتعامل مع كل الكتابات، أما الافتراضيات القديمة فلا. اجعل \`encoding="utf-8"\` عادة.

## شكل قراءة ملف حقيقي

\`\`\`python
with open("scan.log") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        ...
\`\`\`

وكل عنصر فيه يستحق مكانه:

- **\`with\`** تغلق حتى عند الاستثناء
- **\`for line in f\`** تبقي سطرا واحدا في الذاكرة، مهما كان حجم الملف
- **\`.strip()\`** تقتل \`\\n\` المتخلف قبل أن يفسد مقارنة
- **\`continue\`** تتخطى الضجيج وتبقي العمل الحقيقي بلا إزاحة

وهذا هو ملخص السجل من الوحدة 10، وقد صار يقرأ من القرص. احفظ هذا الشكل، فستكتبه باستمرار.

---

## جربها

شغل الشيفرة الابتدائية، فهي تكتب سجلا، ثم تقرؤه متخطية الضجيج، ثم تنظف وراءها.
`,
      },
    },

    /* ── 5. Essential Built-ins ── */
    {
      id: 'py-builtins-essential',
      slug: 'builtins-essential',
      title: { en: 'Essential Built-ins', ar: 'الدوال المدمجة الأساسية' },
      order: 5,
      type: 'lesson',
      starterCode: `nums = [3, -1, 4, -1, 5]

print(len(nums), sum(nums), min(nums), max(nums))
print(abs(-7), round(3.567, 2), pow(2, 10))
print(sorted(nums), sorted(nums, reverse=True))
print(list(reversed(nums)))

# any / all, the loop you don't have to write
print(any(n < 0 for n in nums))
print(all(n < 0 for n in nums))
print(any([]), all([]))

# key= works on min and max too
words = ["banana", "fig", "apple"]
print(max(words, key=len), min(words, key=len))

# Inspecting
print(isinstance(3, int), isinstance(True, int))
print(type(3).__name__)

# enumerate / zip return lazy objects
print(list(enumerate("ab")), list(zip([1, 2], "ab")))
`,
      markdownContent: {
        en: `# Essential Built-ins

**Built-ins** are always available, no import. You've used \`print\`, \`len\`, \`type\`, \`int\`, \`str\`, \`range\` and \`input\` since Module 1. Here's the rest of the everyday set.

---

## Numbers

\`\`\`python
len(nums)        # 5  , works on any sized collection
sum(nums)        # 10
min(nums)        # -1
max(nums)        # 5
abs(-7)          # 7
round(3.567, 2)  # 3.57
pow(2, 10)       # 1024, same as 2 ** 10
\`\`\`

\`sum\`, \`min\` and \`max\` on an **empty** collection differ: \`sum([])\` is \`0\`, but \`min([])\` and \`max([])\` raise \`ValueError\`, there's no smallest of nothing. Guard them, as the Module 11 challenge did.

\`min\` and \`max\` take **\`key=\`**, exactly like \`sorted\`:

\`\`\`python
max(words, key=len)   # 'banana'
\`\`\`

## Ordering

\`\`\`python
sorted(nums)                 # new sorted list
sorted(nums, reverse=True)
list(reversed(nums))         # reversed order, not sorted
\`\`\`

\`reversed()\` returns a lazy iterator, so wrap it in \`list()\` to see it. It flips the current order; it does not sort.

---

## any and all

Two loops you no longer have to write:

\`\`\`python
any(n < 0 for n in nums)   # True , is at least one negative?
all(n < 0 for n in nums)   # False, are they all negative?
\`\`\`

They **short-circuit**: \`any\` stops at the first true, \`all\` at the first false.

The empty cases look odd until you say them out loud:

\`\`\`python
any([])   # False, none of them are true (there are none)
all([])   # True , none of them are false (there are none)
\`\`\`

\`all([])\` being \`True\` is correct and does surprise people. "All zero of these passed" is vacuously true.

## Inspecting

\`\`\`python
isinstance(3, int)      # True, the right way to test a type
isinstance(True, int)   # True!, bool subclasses int (Module 7)
\`\`\`

Prefer \`isinstance(x, int)\` over \`type(x) == int\`: it respects subclasses, which is usually what you want, though \`isinstance(True, int)\` shows that cuts both ways.

Two more worth knowing at a REPL: \`dir(x)\` lists what a value can do, and \`help(x)\` prints its documentation. They're how you explore an unfamiliar object without leaving Python.

## Lazy by default

\`enumerate\`, \`zip\`, \`reversed\`, \`map\`, \`filter\` and \`range\` all return **lazy** objects, they produce values on demand rather than building a list:

\`\`\`python
print(zip([1, 2], "ab"))        # <zip object at 0x...>
print(list(zip([1, 2], "ab")))  # [(1, 'a'), (2, 'b')]
\`\`\`

That's why they cost nothing on huge inputs. Wrap in \`list()\` to look at them. Why they behave this way is Module 13.

---

## Try It

Run the starter code. \`any([])\` is \`False\` and \`all([])\` is \`True\`, get comfortable with that now.
`,
        ar: `# الدوال المدمجة الأساسية

**الدوال المدمجة (built-ins)** متاحة دائما بلا استيراد. وأنت تستعمل \`print\` و\`len\` و\`type\` و\`int\` و\`str\` و\`range\` و\`input\` منذ الوحدة 1. وإليك بقية المجموعة اليومية.

---

## الأعداد

\`\`\`python
len(nums)        # 5  , works on any sized collection
sum(nums)        # 10
min(nums)        # -1
max(nums)        # 5
abs(-7)          # 7
round(3.567, 2)  # 3.57
pow(2, 10)       # 1024, same as 2 ** 10
\`\`\`

وتختلف \`sum\` و\`min\` و\`max\` على حاوية **فارغة**: فـ \`sum([])\` تساوي \`0\`، أما \`min([])\` و\`max([])\` فترفعان \`ValueError\`، إذ لا أصغر للعدم. فاحرسهما كما فعل تحدي الوحدة 11.

وتأخذ \`min\` و\`max\` الوسيط **\`key=\`** تماما مثل \`sorted\`:

\`\`\`python
max(words, key=len)   # 'banana'
\`\`\`

## الترتيب

\`\`\`python
sorted(nums)                 # new sorted list
sorted(nums, reverse=True)
list(reversed(nums))         # reversed order, not sorted
\`\`\`

وتعيد \`reversed()\` مكررا كسولا، فغلفه بـ \`list()\` لرؤيته. وهي تقلب الترتيب الحالي ولا ترتب.

---

## any و all

حلقتان لم تعد مضطرا إلى كتابتهما:

\`\`\`python
any(n < 0 for n in nums)   # True , is at least one negative?
all(n < 0 for n in nums)   # False, are they all negative?
\`\`\`

وهما **تقطعان قطعا قصيرا**: فـ \`any\` تتوقف عند أول صادق، و\`all\` عند أول كاذب.

وتبدو الحالات الفارغة غريبة حتى تقولها بصوت مرتفع:

\`\`\`python
any([])   # False, none of them are true (there are none)
all([])   # True , none of them are false (there are none)
\`\`\`

وكون \`all([])\` تساوي \`True\` صحيح ويفاجئ الناس فعلا. فـ "كل هذه الأصفار نجحت" صادقة صدقا خاويا.

## الفحص

\`\`\`python
isinstance(3, int)      # True, the right way to test a type
isinstance(True, int)   # True!, bool subclasses int (Module 7)
\`\`\`

فضل \`isinstance(x, int)\` على \`type(x) == int\`: فهي تحترم الأصناف المشتقة، وهذا هو المطلوب عادة، وإن كانت \`isinstance(True, int)\` تبين أن للسيف حدين.

واثنتان أخريان تستحقان المعرفة في الـ REPL: فـ \`dir(x)\` تسرد ما تستطيع القيمة فعله، و\`help(x)\` تطبع توثيقها. وبهما تستكشف كائنا غير مألوف دون مغادرة بايثون.

## كسولة بالأصل

الدوال \`enumerate\` و\`zip\` و\`reversed\` و\`map\` و\`filter\` و\`range\` كلها تعيد كائنات **كسولة**، تنتج القيم عند الطلب بدل بناء قائمة:

\`\`\`python
print(zip([1, 2], "ab"))        # <zip object at 0x...>
print(list(zip([1, 2], "ab")))  # [(1, 'a'), (2, 'b')]
\`\`\`

ولهذا لا تكلف شيئا على المدخلات الضخمة. غلفها بـ \`list()\` لتنظر إليها. أما سبب سلوكها هذا فهو موضوع الوحدة 13.

---

## جربها

شغل الشيفرة الابتدائية. فـ \`any([])\` تساوي \`False\` و\`all([])\` تساوي \`True\`، فاعتد على ذلك من الآن.
`,
      },
    },

    /* ── 6. map and filter ── */
    {
      id: 'py-map-filter',
      slug: 'map-filter',
      title: { en: 'map and filter', ar: 'map و filter' },
      order: 6,
      type: 'lesson',
      starterCode: `nums = [1, 2, 3, 4, 5]

# map, apply a function to EVERY item
print(list(map(str, nums)))
print(list(map(lambda n: n * 2, nums)))

# filter, keep the items where the function says True
print(list(filter(lambda n: n % 2 == 0, nums)))

# filter(None, ...) drops every falsy value
print(list(filter(None, [1, 0, "a", "", None, [], 3])))

# map over two sequences at once
print(list(map(lambda a, b: a + b, [1, 2], [10, 20])))

# They are lazy and single-use
m = map(str, nums)
print(list(m))
print("again:", list(m))

# The comprehension usually reads better
print([str(n) for n in nums])
print([n for n in nums if n % 2 == 0])
`,
      markdownContent: {
        en: `# map and filter

Two built-ins that take **a function** and a sequence. They're the classic functional pair.

---

## map, transform everything

\`\`\`python
map(str, nums)                # every item -> str
map(lambda n: n * 2, nums)    # every item -> doubled
\`\`\`

\`map(function, sequence)\` calls the function on each item and yields the results. It replaces this loop:

\`\`\`python
out = []
for n in nums:
    out.append(str(n))
\`\`\`

Note \`str\` with **no parentheses**, you're passing the function itself, not calling it. Same idea as \`key=len\`.

\`map\` can take several sequences, calling the function with one item from each and stopping at the shortest:

\`\`\`python
map(lambda a, b: a + b, [1, 2], [10, 20])   # [11, 22]
\`\`\`

## filter, keep some

\`\`\`python
filter(lambda n: n % 2 == 0, nums)   # [2, 4]
\`\`\`

\`filter(function, sequence)\` keeps items where the function returns truthy. Same items, fewer of them, \`map\` changes values, \`filter\` removes them.

A special case worth knowing:

\`\`\`python
filter(None, [1, 0, "a", "", None, [], 3])   # [1, 'a', 3]
\`\`\`

Pass \`None\` as the function and it keeps everything **truthy**, a one-liner for stripping empties out of messy data.

---

## Lazy and single-use

Both return **iterators**, not lists:

\`\`\`python
print(map(str, nums))   # <map object at 0x...>
\`\`\`

So wrap in \`list()\` to see them. And they're **exhausted** after one pass:

\`\`\`python
m = map(str, nums)
list(m)   # ['1', ...]
list(m)   # []  <- empty, it's spent
\`\`\`

Same rule as reading a file twice. If you need it more than once, store the \`list()\`.

Laziness is the payoff: \`map\` over a million rows does no work until you consume it, and never holds more than one item.

---

## Prefer the comprehension

Honest advice: in modern Python, a **list comprehension** usually reads better.

\`\`\`python
list(map(lambda n: n * 2, nums))     # map + lambda
[n * 2 for n in nums]                # comprehension

list(filter(lambda n: n % 2 == 0, nums))
[n for n in nums if n % 2 == 0]
\`\`\`

The comprehension says the same thing with less machinery, and it does both jobs at once:

\`\`\`python
[n * 2 for n in nums if n % 2 == 0]   # filter AND map
\`\`\`

\`map\` still wins when you're passing an **existing named function**, \`map(str, nums)\` is cleaner than \`[str(n) for n in nums]\`. The rule of thumb: **named function → \`map\`; anything needing a \`lambda\` → comprehension.**

You must be able to read both. Every codebase has them.

---

## Try It

Run the starter code. The re-used \`m\` gives \`[]\` the second time, that's the iterator being spent.
`,
        ar: `# map و filter

دالتان مدمجتان تأخذان **دالة** ومتتالية. وهما الثنائي الدالي الكلاسيكي.

---

## map، حول كل شيء

\`\`\`python
map(str, nums)                # every item -> str
map(lambda n: n * 2, nums)    # every item -> doubled
\`\`\`

تستدعي \`map(function, sequence)\` الدالة على كل عنصر وتنتج النتائج. وهي تحل محل هذه الحلقة:

\`\`\`python
out = []
for n in nums:
    out.append(str(n))
\`\`\`

ولاحظ \`str\` **بلا قوسين**، فأنت تمرر الدالة نفسها لا تستدعيها. وهي الفكرة نفسها التي في \`key=len\`.

وتستطيع \`map\` أن تأخذ عدة متتاليات، فتستدعي الدالة بعنصر من كل واحدة وتتوقف عند الأقصر:

\`\`\`python
map(lambda a, b: a + b, [1, 2], [10, 20])   # [11, 22]
\`\`\`

## filter، أبق بعضها

\`\`\`python
filter(lambda n: n % 2 == 0, nums)   # [2, 4]
\`\`\`

تبقي \`filter(function, sequence)\` العناصر التي تعيد الدالة عندها قيمة صادقة. فالعناصر نفسها وعددها أقل، إذ تغير \`map\` القيم بينما تحذف \`filter\` بعضها.

وثمة حالة خاصة تستحق المعرفة:

\`\`\`python
filter(None, [1, 0, "a", "", None, [], 3])   # [1, 'a', 3]
\`\`\`

مرر \`None\` بدل الدالة فتبقي كل ما هو **صادق**، وهو سطر واحد لتنقية البيانات الفوضوية من الفراغات.

---

## كسولة وذات استعمال واحد

كلتاهما تعيد **مكررا (iterator)** لا قائمة:

\`\`\`python
print(map(str, nums))   # <map object at 0x...>
\`\`\`

فغلفها بـ \`list()\` لرؤيتها. وهي **تستنفد** بعد مرور واحد:

\`\`\`python
m = map(str, nums)
list(m)   # ['1', ...]
list(m)   # []  <- empty, it's spent
\`\`\`

وهي القاعدة نفسها التي في قراءة الملف مرتين. فإن احتجتها أكثر من مرة فاحفظ نتيجة \`list()\`.

والكسل هو المكسب: فـ \`map\` على مليون صف لا تؤدي عملا حتى تستهلكها، ولا تحتفظ أبدا بأكثر من عنصر واحد.

---

## فضل الاشتمال

نصيحة صريحة: في بايثون الحديثة، **اشتمال القائمة (list comprehension)** يقرأ أفضل عادة.

\`\`\`python
list(map(lambda n: n * 2, nums))     # map + lambda
[n * 2 for n in nums]                # comprehension

list(filter(lambda n: n % 2 == 0, nums))
[n for n in nums if n % 2 == 0]
\`\`\`

فالاشتمال يقول الشيء نفسه بآلية أقل، وهو يؤدي المهمتين معا:

\`\`\`python
[n * 2 for n in nums if n % 2 == 0]   # filter AND map
\`\`\`

وتبقى \`map\` متفوقة حين تمرر **دالة مسماة موجودة**، فـ \`map(str, nums)\` أنظف من \`[str(n) for n in nums]\`. والقاعدة العامة: **الدالة المسماة تستدعي \`map\`، وكل ما يحتاج \`lambda\` يستدعي الاشتمال.**

ويجب أن تقدر على قراءة الاثنين. فكل قاعدة شيفرة فيها الاثنان.

---

## جربها

شغل الشيفرة الابتدائية. والمكرر \`m\` المعاد استعماله يعطي \`[]\` في المرة الثانية، فذاك المكرر وقد استنفد.
`,
      },
    },

    /* ── 7. reduce ── */
    {
      id: 'py-reduce',
      slug: 'reduce',
      title: { en: 'reduce', ar: 'reduce' },
      order: 7,
      type: 'lesson',
      starterCode: `from functools import reduce

nums = [1, 2, 3, 4]

# reduce folds a sequence down to ONE value
print(reduce(lambda a, b: a + b, nums))
print(sum(nums))          # ...but sum() already does that

# Where reduce earns its place: no built-in exists
print(reduce(lambda a, b: a * b, nums))

# An initial value, and the empty-list guard
print(reduce(lambda a, b: a * b, [], 1))
# print(reduce(lambda a, b: a * b, []))   # TypeError on empty with no initial

# Step by step: ((1*2)*3)*4
def show(a, b):
    print(f"  {a} * {b} = {a * b}")
    return a * b
print("result:", reduce(show, nums))

# Usually a loop is clearer
total = 1
for n in nums:
    total *= n
print("loop:", total)
`,
      markdownContent: {
        en: `# reduce

\`reduce\` **folds** a whole sequence down to a single value.

It lives in \`functools\`, not the built-ins, it was deliberately moved out in Python 3:

\`\`\`python
from functools import reduce
\`\`\`

---

## How it works

\`\`\`python
reduce(lambda a, b: a + b, [1, 2, 3, 4])   # 10
\`\`\`

The function takes **two** arguments: the result so far, and the next item. \`reduce\` walks left to right, carrying the running result:

\`\`\`
((1 + 2) + 3) + 4
\`\`\`

Where \`map\` gives you N results and \`filter\` gives you some of them, \`reduce\` gives you **one**.

## An initial value

\`\`\`python
reduce(lambda a, b: a * b, nums, 1)
\`\`\`

The third argument is where the fold starts. It also fixes the empty case:

\`\`\`python
reduce(lambda a, b: a * b, [])      # TypeError: empty sequence with no initial value
reduce(lambda a, b: a * b, [], 1)   # 1
\`\`\`

With no items and no starting point there's nothing to return. Always pass an initial value when the sequence might be empty.

---

## Usually, don't

Guido van Rossum moved \`reduce\` out of the built-ins on purpose, arguing that almost every real use is clearer as a loop or an existing built-in.

He's mostly right:

\`\`\`python
reduce(lambda a, b: a + b, nums)   # don't
sum(nums)                          # do

reduce(lambda a, b: a if a > b else b, nums)   # don't
max(nums)                                      # do
\`\`\`

\`sum\`, \`max\`, \`min\`, \`any\`, \`all\` and \`"".join\` are all reductions that already have a name. Use the name.

\`reduce\` is defensible when there's genuinely no built-in and the operation is a true fold, a running product, for example:

\`\`\`python
reduce(lambda a, b: a * b, nums)   # 24
\`\`\`

Even then, compare:

\`\`\`python
total = 1
for n in nums:
    total *= n
\`\`\`

Three lines, and any reader gets it instantly. (\`math.prod()\` exists for this specific case anyway.)

**So why learn it?** Because you'll read it in other people's code, and because the *idea*, fold a sequence into one value, is worth having a name for.

---

## Try It

Run the starter code. The \`show\` function prints each step, so you can watch the fold happen: \`((1*2)*3)*4\`.
`,
        ar: `# reduce

الدالة \`reduce\` **تطوي** متتالية كاملة إلى قيمة واحدة.

وهي تسكن في \`functools\` لا في الدوال المدمجة، فقد نقلت خارجها عمدا في بايثون 3:

\`\`\`python
from functools import reduce
\`\`\`

---

## كيف تعمل

\`\`\`python
reduce(lambda a, b: a + b, [1, 2, 3, 4])   # 10
\`\`\`

تأخذ الدالة **وسيطين**: النتيجة حتى الآن، والعنصر التالي. وتمشي \`reduce\` من اليسار إلى اليمين حاملة النتيجة الجارية:

\`\`\`
((1 + 2) + 3) + 4
\`\`\`

وحيث تعطيك \`map\` عدد N من النتائج وتعطيك \`filter\` بعضها، تعطيك \`reduce\` **واحدة**.

## قيمة ابتدائية

\`\`\`python
reduce(lambda a, b: a * b, nums, 1)
\`\`\`

الوسيط الثالث هو حيث يبدأ الطي. وهو يصلح الحالة الفارغة أيضا:

\`\`\`python
reduce(lambda a, b: a * b, [])      # TypeError: empty sequence with no initial value
reduce(lambda a, b: a * b, [], 1)   # 1
\`\`\`

فبلا عناصر وبلا نقطة بداية لا يوجد ما يعاد. مرر دائما قيمة ابتدائية حين يحتمل أن تكون المتتالية فارغة.

---

## وعادة، لا تفعل

نقل غيدو فان روسم \`reduce\` خارج الدوال المدمجة عمدا، محتجا بأن كل استعمال حقيقي لها تقريبا أوضح بحلقة أو بدالة مدمجة موجودة.

وهو محق في معظم الأمر:

\`\`\`python
reduce(lambda a, b: a + b, nums)   # don't
sum(nums)                          # do

reduce(lambda a, b: a if a > b else b, nums)   # don't
max(nums)                                      # do
\`\`\`

فـ \`sum\` و\`max\` و\`min\` و\`any\` و\`all\` و\`"".join\` كلها عمليات طي لها أسماء أصلا. استعمل الاسم.

وتبقى \`reduce\` مبررة حين لا توجد دالة مدمجة فعلا وتكون العملية طيا حقيقيا، كحاصل ضرب جار مثلا:

\`\`\`python
reduce(lambda a, b: a * b, nums)   # 24
\`\`\`

وحتى حينها، قارن:

\`\`\`python
total = 1
for n in nums:
    total *= n
\`\`\`

ثلاثة أسطر يفهمها أي قارئ فورا. (وعلى كل حال توجد \`math.prod()\` لهذه الحالة بعينها.)

**فلماذا نتعلمها إذن؟** لأنك ستقرؤها في شيفرة غيرك، ولأن *الفكرة* نفسها، أي طي متتالية إلى قيمة واحدة، تستحق أن يكون لها اسم.

---

## جربها

شغل الشيفرة الابتدائية. الدالة \`show\` تطبع كل خطوة، فتستطيع مشاهدة الطي وهو يحدث: \`((1*2)*3)*4\`.
`,
      },
    },

    /* ── 8. Challenge: Log File Report ── */
    {
      id: 'py-ch-log-file',
      slug: 'challenge-log-file',
      title: { en: 'Challenge: Log File Report', ar: 'تحدي: تقرير ملف السجل' },
      order: 8,
      type: 'challenge',
      starterCode: `# Set-up: this writes the log file for you. Do not change it.
with open("access.log", "w") as f:
    f.write("GET /home 200\\n")
    f.write("\\n")
    f.write("# ignore me\\n")
    f.write("POST /login 401\\n")
    f.write("GET /admin 403\\n")
    f.write("GET /home 200\\n")

# Read access.log back and print exactly:
#
#   Lines: 4
#   Errors: 2
#   Paths: ['/admin', '/home', '/login']
#   All GET: False
#   Report written: True
#
# Rules:
#   - Read the file with "with" and loop it line by line.
#   - Skip blank lines and lines starting with "#".
#   - "Lines" counts the real lines; "Errors" are status >= 400.
#   - "Paths" is the sorted unique paths.
#   - "All GET" uses all() over the methods.
#   - Finally write the error count to report.txt as "errors=2",
#     then confirm it exists with os.path.exists.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Reads the log, reports on it, and writes report.txt',
          expectedOutput:
            "Lines: 4\nErrors: 2\nPaths: ['/admin', '/home', '/login']\nAll GET: False\nReport written: True",
        },
      ],
      hints: [
        'Open with: with open("access.log") as f: then for line in f. Strip each line and continue past blanks and comments.',
        'Collect the methods and paths into lists as you go. Then Paths is sorted(set(paths)), and All GET is all(m == "GET" for m in methods).',
        'For the last part: with open("report.txt", "w") as f: f.write(f"errors={errors}"), then import os and print os.path.exists("report.txt").',
      ],
      solution: `# Set-up: this writes the log file for you. Do not change it.
with open("access.log", "w") as f:
    f.write("GET /home 200\\n")
    f.write("\\n")
    f.write("# ignore me\\n")
    f.write("POST /login 401\\n")
    f.write("GET /admin 403\\n")
    f.write("GET /home 200\\n")

import os

methods = []
paths = []
errors = 0

with open("access.log") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        method, path, status = line.split()
        methods.append(method)
        paths.append(path)
        if int(status) >= 400:
            errors += 1

with open("report.txt", "w") as f:
    f.write(f"errors={errors}")

print(f"Lines: {len(methods)}")
print(f"Errors: {errors}")
print(f"Paths: {sorted(set(paths))}")
print(f"All GET: {all(m == 'GET' for m in methods)}")
print(f"Report written: {os.path.exists('report.txt')}")
`,
      markdownContent: {
        en: `# Challenge: Log File Report

The Module 10 log summary, now reading from an actual file and writing a report back.

---

## Instructions

The set-up code writes \`access.log\` for you, leave it alone. Read it back and print **exactly**:

\`\`\`
Lines: 4
Errors: 2
Paths: ['/admin', '/home', '/login']
All GET: False
Report written: True
\`\`\`

## Rules

- Read with \`with\`, looping the file **line by line**.
- Skip blank lines and \`#\` comments.
- **Lines** counts the real lines; **Errors** are status ≥ 400.
- **Paths** is the **sorted unique** paths.
- **All GET** uses \`all()\` over the methods.
- Then write \`errors=2\` to \`report.txt\` and confirm with \`os.path.exists\`.

## What you need

The shape from *Files in Practice*, plus \`sorted(set(...))\` from Module 6 and \`all()\` from this one.

## Watch out

\`.strip()\` each line first, the \`\\n\` is still attached, and a bare \`"\\n"\` won't look blank until you strip it.

---

Click **Submit** when ready.
`,
        ar: `# تحد: تقرير من ملف سجل

ملخص السجل من الوحدة 10، وقد صار يقرأ من ملف حقيقي ويكتب تقريرا في المقابل.

---

## التعليمات

شيفرة التهيئة تكتب لك \`access.log\`، فاتركها وشأنها. اقرأه ثم اطبع هذا **بالضبط**:

\`\`\`
Lines: 4
Errors: 2
Paths: ['/admin', '/home', '/login']
All GET: False
Report written: True
\`\`\`

## القواعد

- اقرأ بـ \`with\`، ومر على الملف **سطرا سطرا**.
- تخط الأسطر الفارغة وتعليقات \`#\`.
- و**Lines** تعد الأسطر الحقيقية، و**Errors** هي التي حالتها 400 فأكثر.
- و**Paths** هي المسارات **الفريدة المرتبة**.
- و**All GET** تستعمل \`all()\` على الطرائق.
- ثم اكتب \`errors=2\` في \`report.txt\` وتأكد بـ \`os.path.exists\`.

## ما تحتاجه

الشكل الوارد في درس *الملفات في الممارسة*، مع \`sorted(set(...))\` من الوحدة 6 و\`all()\` من هذه الوحدة.

## انتبه

استعمل \`.strip()\` على كل سطر أولا، فـ \`\\n\` ما زال ملتصقا، والسطر \`"\\n"\` المجرد لن يبدو فارغا حتى تنظفه.

---

اضغط **Submit** حين تجهز.
`,
      },
    },
  ],
};

export default filesBuiltins;
