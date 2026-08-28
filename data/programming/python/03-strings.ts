import type { ProgrammingModule } from '../types';

const strings: ProgrammingModule = {
  id: 'py-strings',
  slug: 'strings',
  title: {
    en: 'Strings',
    ar: 'النصوص',
  },
  description: {
    en: 'Text in depth, creating strings, indexing and slicing, the method toolkit, and formatting.',
    ar: 'النصوص بالتفصيل، إنشاؤها، الفهرسة والتقطيع، الدوال، والتنسيق.',
  },
  order: 3,
  concepts: [
    /* ── 1. Strings ── */
    {
      id: 'py-strings-intro',
      slug: 'strings-intro',
      title: { en: 'Strings', ar: 'النصوص' },
      order: 1,
      type: 'lesson',
      starterCode: `# Quotes: single and double are interchangeable
a = "CyberKhana"
b = 'CyberKhana'
print(a == b)

# Triple quotes keep line breaks
banner = """Scan report
Host: 10.0.0.5
Status: up"""
print(banner)

# len() counts characters
print(len("CyberKhana"))

# Strings are immutable, this builds a NEW string
name = "Sara"
print(name.upper())
print(name)
`,
      markdownContent: {
        en: `# Strings

A **string** is text: a sequence of characters in quotes. It's the type you'll handle most, usernames, file paths, HTTP responses, log lines.

---

## Creating one

Single and double quotes are identical in Python:

\`\`\`python
a = "CyberKhana"
b = 'CyberKhana'
print(a == b)   # True
\`\`\`

Having both is convenient: pick the one your text doesn't contain.

\`\`\`python
print('She said "hello"')
print("It's fine")
\`\`\`

For text spanning lines, use **triple quotes**, the line breaks are kept:

\`\`\`python
banner = """Scan report
Host: 10.0.0.5"""
\`\`\`

## Length

\`len()\` gives the number of characters:

\`\`\`python
print(len("CyberKhana"))   # 10
\`\`\`

An empty string \`""\` has length \`0\`. It's still a real value, not \`None\`.

---

## Strings are immutable

This is the rule that explains everything else in this module. **A string can never be changed.** Try, and Python stops you:

\`\`\`python
name = "Sara"
name[0] = "M"   # TypeError: 'str' object does not support item assignment
\`\`\`

So what does \`.upper()\` do?

\`\`\`python
name = "Sara"
print(name.upper())   # SARA
print(name)           # Sara  <- unchanged
\`\`\`

It **returns a new string** and leaves the original alone. Every string method works this way. The consequence is a mistake beginners make constantly:

\`\`\`python
name.upper()          # result thrown away, pointless
name = name.upper()   # keep it
\`\`\`

If a string method's result isn't assigned or used, the line does nothing at all.

---

## Sequences

A string is a **sequence**, an ordered run of characters. That earns it a set of powers shared with lists and tuples: indexing, slicing, \`len()\`, \`in\`, and looping.

\`\`\`python
print("Cyber" in "CyberKhana")   # True
\`\`\`

The next lesson uses that ordering directly.

---

## Try It

Run the starter code. The last two lines are the point: \`.upper()\` produced \`SARA\`, and \`name\` is still \`Sara\`.
`,
        ar: `# النصوص

**النص (string)** هو نص: متتالية من المحارف بين علامتي اقتباس. وهو النوع الذي ستتعامل معه أكثر من غيره، فأسماء المستخدمين ومسارات الملفات واستجابات HTTP وأسطر السجلات كلها نصوص.

---

## إنشاء نص

علامتا الاقتباس المفردة والمزدوجة متطابقتان في بايثون:

\`\`\`python
a = "CyberKhana"
b = 'CyberKhana'
print(a == b)   # True
\`\`\`

ووجود الاثنتين معا مريح: اختر ما لا يحتويه نصك.

\`\`\`python
print('She said "hello"')
print("It's fine")
\`\`\`

وللنص الممتد على عدة أسطر استعمل **الاقتباس الثلاثي**، فتحفظ فيه فواصل الأسطر:

\`\`\`python
banner = """Scan report
Host: 10.0.0.5"""
\`\`\`

## الطول

تعطيك \`len()\` عدد المحارف:

\`\`\`python
print(len("CyberKhana"))   # 10
\`\`\`

والنص الفارغ \`""\` طوله \`0\`. وهو مع ذلك قيمة حقيقية لا \`None\`.

---

## النصوص غير قابلة للتغيير

هذه هي القاعدة التي تفسر كل ما تبقى في هذه الوحدة. **لا يمكن تغيير النص أبدا.** جرب فتوقفك بايثون:

\`\`\`python
name = "Sara"
name[0] = "M"   # TypeError: 'str' object does not support item assignment
\`\`\`

إذن ماذا تفعل \`.upper()\`؟

\`\`\`python
name = "Sara"
print(name.upper())   # SARA
print(name)           # Sara  <- unchanged
\`\`\`

إنها **تعيد نصا جديدا** وتترك الأصل كما هو. وكل توابع النصوص تعمل بهذه الطريقة. ونتيجة ذلك خطأ يقع فيه المبتدئون باستمرار:

\`\`\`python
name.upper()          # result thrown away, pointless
name = name.upper()   # keep it
\`\`\`

فإذا لم تسند نتيجة تابع النص أو تستعملها، لم يفعل السطر شيئا على الإطلاق.

---

## المتتاليات

النص **متتالية (sequence)**، أي سلسلة مرتبة من المحارف. وهذا يمنحه مجموعة قدرات يتقاسمها مع القوائم والصفوف (tuples): الفهرسة، والتقطيع، و\`len()\`، و\`in\`، والتكرار عليه.

\`\`\`python
print("Cyber" in "CyberKhana")   # True
\`\`\`

والدرس التالي يستعمل هذا الترتيب مباشرة.

---

## جربها

شغل الشيفرة الابتدائية. السطران الأخيران هما بيت القصيد: أنتجت \`.upper()\` النص \`SARA\`، وبقي \`name\` هو \`Sara\`.
`,
      },
    },

    /* ── 2. Indexing and Slicing ── */
    {
      id: 'py-strings-indexing',
      slug: 'indexing-and-slicing',
      title: { en: 'Indexing and Slicing', ar: 'الفهرسة والتقطيع' },
      order: 2,
      type: 'lesson',
      starterCode: `text = "CyberKhana"

# Indexing, counting starts at 0
print(text[0])
print(text[4])
print(text[-1])    # last character

# Slicing, [start:end], end is NOT included
print(text[0:5])
print(text[5:])    # from 5 to the end
print(text[:5])    # from the start to 5
print(text[:])     # the whole thing

# Step
print(text[::2])   # every second character
print(text[::-1])  # reversed
`,
      markdownContent: {
        en: `# Indexing and Slicing

Because a string is an ordered sequence, you can reach into it by position.

---

## Indexing

Positions start at **0**, not 1:

\`\`\`
 C  y  b  e  r  K  h  a  n  a
 0  1  2  3  4  5  6  7  8  9
-10 -9 -8 -7 -6 -5 -4 -3 -2 -1
\`\`\`

\`\`\`python
text = "CyberKhana"
print(text[0])    # C
print(text[4])    # r
\`\`\`

The last character of a 10-character string is at index **9**. Asking for \`text[10]\` raises \`IndexError: string index out of range\`.

Negative indexes count from the right, which saves the arithmetic:

\`\`\`python
print(text[-1])   # a  , last
print(text[-2])   # n  , second to last
\`\`\`

\`text[-1]\` beats \`text[len(text) - 1]\` for the same result.

---

## Slicing

\`[start:end]\` takes a range. **\`start\` is included, \`end\` is not:**

\`\`\`python
print(text[0:5])   # Cyber
\`\`\`

Indexes 0,1,2,3,4, five characters, stopping *before* 5. That exclusive end looks odd for a day, then becomes useful:

- the length of \`text[a:b]\` is simply \`b - a\`
- \`text[:5]\` and \`text[5:]\` split cleanly with no overlap and nothing lost

Both ends are optional:

\`\`\`python
print(text[5:])    # Khana , 5 to the end
print(text[:5])    # Cyber , start to 5
print(text[:])     # CyberKhana, a full copy
\`\`\`

Unlike indexing, slicing **never raises** for out-of-range values:

\`\`\`python
print(text[0:999])   # CyberKhana, clamped, no error
print(text[99:])     # ''        , empty string
\`\`\`

## Step

The third part is the step:

\`\`\`python
print(text[::2])    # Cbrhn , every second character
print(text[::-1])   # anahKrebyC, reversed
\`\`\`

\`[::-1]\` walks backwards and is the idiomatic way to reverse a string.

---

## It returns a new string

Slicing never modifies the original, strings are immutable. \`text[0:5]\` hands back a new string; \`text\` is untouched.

---

## Try It

Run the starter code and match each line to the diagram above. Then try \`text[10]\` for the \`IndexError\`, and \`text[10:]\`, which quietly gives you \`''\`.
`,
        ar: `# الفهرسة والتقطيع

لأن النص متتالية مرتبة، تستطيع الوصول إلى داخله بالموضع.

---

## الفهرسة

تبدأ المواضع من **0** لا من 1:

\`\`\`
 C  y  b  e  r  K  h  a  n  a
 0  1  2  3  4  5  6  7  8  9
-10 -9 -8 -7 -6 -5 -4 -3 -2 -1
\`\`\`

\`\`\`python
text = "CyberKhana"
print(text[0])    # C
print(text[4])    # r
\`\`\`

المحرف الأخير في نص من 10 محارف يقع في الفهرس **9**. وطلب \`text[10]\` يرفع \`IndexError: string index out of range\`.

والفهارس السالبة تعد من اليمين، وهذا يوفر عليك الحساب:

\`\`\`python
print(text[-1])   # a  , last
print(text[-2])   # n  , second to last
\`\`\`

فـ \`text[-1]\` أفضل من \`text[len(text) - 1]\` للنتيجة نفسها.

---

## التقطيع

الصيغة \`[start:end]\` تأخذ مجالا. **البداية مشمولة والنهاية غير مشمولة:**

\`\`\`python
print(text[0:5])   # Cyber
\`\`\`

أي الفهارس 0 و1 و2 و3 و4، خمسة محارف، والتوقف *قبل* 5. وهذه النهاية غير المشمولة تبدو غريبة ليوم واحد، ثم تصبح مفيدة:

- طول \`text[a:b]\` هو ببساطة \`b - a\`
- يقسم \`text[:5]\` و\`text[5:]\` النص قسمة نظيفة دون تداخل ودون ضياع شيء

وكلا الطرفين اختياري:

\`\`\`python
print(text[5:])    # Khana , 5 to the end
print(text[:5])    # Cyber , start to 5
print(text[:])     # CyberKhana, a full copy
\`\`\`

وخلافا للفهرسة، **لا يرفع** التقطيع خطأ عند تجاوز المدى:

\`\`\`python
print(text[0:999])   # CyberKhana, clamped, no error
print(text[99:])     # ''        , empty string
\`\`\`

## الخطوة

الجزء الثالث هو الخطوة:

\`\`\`python
print(text[::2])    # Cbrhn , every second character
print(text[::-1])   # anahKrebyC, reversed
\`\`\`

فـ \`[::-1]\` يسير إلى الوراء وهو الأسلوب المتعارف عليه لعكس النص.

---

## يعيد نصا جديدا

لا يعدل التقطيع الأصل أبدا، فالنصوص غير قابلة للتغيير. فـ \`text[0:5]\` يسلمك نصا جديدا، ويبقى \`text\` كما هو.

---

## جربها

شغل الشيفرة الابتدائية وطابق كل سطر مع المخطط أعلاه. ثم جرب \`text[10]\` لترى \`IndexError\`، وجرب \`text[10:]\` الذي يعطيك \`''\` بهدوء.
`,
      },
    },

    /* ── 3. Methods: Case and Whitespace ── */
    {
      id: 'py-strings-methods-case',
      slug: 'methods-case-whitespace',
      title: { en: 'Methods: Case & Whitespace', ar: 'الدوال: الحالة والمسافات' },
      order: 3,
      type: 'lesson',
      starterCode: `name = "cyber khana"

print(name.upper())
print(name.lower())
print(name.capitalize())
print(name.title())
print("CyBeR".swapcase())

messy = "   admin   "
print("[" + messy.strip() + "]")
print("[" + messy.lstrip() + "]")
print("[" + messy.rstrip() + "]")

# strip() also removes specific characters
print("...hello...".strip("."))

# The classic use: comparing user input fairly
answer = "  YES  "
print(answer.strip().lower() == "yes")
`,
      markdownContent: {
        en: `# Methods: Case & Whitespace

A **method** is a function attached to a value, called with a dot: \`value.method()\`. Strings come with a large toolkit. Remember: every one of them **returns a new string**.

---

## Case

\`\`\`python
name = "cyber khana"
name.upper()        # CYBER KHANA
name.lower()        # cyber khana
name.capitalize()   # Cyber khana, first letter of the string
name.title()        # Cyber Khana, first letter of every word
"CyBeR".swapcase()  # cYbEr
\`\`\`

The distinction worth remembering: \`capitalize()\` touches only the **first character of the whole string**, while \`title()\` capitalises **each word**.

## Whitespace

\`strip()\` removes whitespace from **both** ends, spaces, tabs, newlines:

\`\`\`python
messy = "   admin   "
messy.strip()    # 'admin'
messy.lstrip()   # 'admin   ' , left only
messy.rstrip()   # '   admin' , right only
\`\`\`

It only touches the ends. \`"a b".strip()\` keeps the middle space.

Given an argument, it strips **those characters** instead of whitespace:

\`\`\`python
"...hello...".strip(".")   # 'hello'
\`\`\`

That argument is a *set of characters*, not a prefix, \`"xyxhixy".strip("xy")\` gives \`'hi'\`, removing any \`x\` or \`y\` from either end.

---

## Why this pair matters

Almost every time you compare text a human typed, you want both:

\`\`\`python
answer = "  YES  "
if answer.strip().lower() == "yes":
    ...
\`\`\`

Without \`.strip()\` a stray space fails the check. Without \`.lower()\` so does a capital letter. The user typed "yes" and would be baffled by a rejection.

Note the **chaining**: \`.strip()\` returns a string, so you can immediately call \`.lower()\` on it. Each link makes a new string and passes it on.

---

## Try It

Run the starter code. The brackets around the stripped values make the whitespace visible, that's a useful debugging trick in itself.
`,
        ar: `# التوابع: حالة الأحرف والمسافات

**التابع (method)** دالة ملحقة بقيمة، تستدعى بنقطة: \`value.method()\`. وتأتي النصوص مع صندوق أدوات كبير. وتذكر: كل واحد منها **يعيد نصا جديدا**.

---

## حالة الأحرف

\`\`\`python
name = "cyber khana"
name.upper()        # CYBER KHANA
name.lower()        # cyber khana
name.capitalize()   # Cyber khana, first letter of the string
name.title()        # Cyber Khana, first letter of every word
"CyBeR".swapcase()  # cYbEr
\`\`\`

والفرق الجدير بالتذكر: \`capitalize()\` تمس **أول محرف في النص كله** فقط، بينما \`title()\` تكبر **أول حرف من كل كلمة**.

## المسافات

يزيل \`strip()\` المسافات من **الطرفين**، سواء كانت فراغات أو جدولات أو أسطرا جديدة:

\`\`\`python
messy = "   admin   "
messy.strip()    # 'admin'
messy.lstrip()   # 'admin   ' , left only
messy.rstrip()   # '   admin' , right only
\`\`\`

وهو لا يمس إلا الطرفين. فـ \`"a b".strip()\` تبقي المسافة الوسطى.

وإن أعطيته وسيطا أزال **تلك المحارف** بدل المسافات:

\`\`\`python
"...hello...".strip(".")   # 'hello'
\`\`\`

وذلك الوسيط *مجموعة محارف* لا بادئة، فـ \`"xyxhixy".strip("xy")\` تعطي \`'hi'\`، إذ تزيل أي \`x\` أو \`y\` من أي من الطرفين.

---

## لماذا يهم هذان التابعان

في كل مرة تقريبا تقارن فيها نصا كتبه إنسان، تحتاج كليهما:

\`\`\`python
answer = "  YES  "
if answer.strip().lower() == "yes":
    ...
\`\`\`

فبدون \`.strip()\` تفشل المطابقة بسبب مسافة شاردة. وبدون \`.lower()\` تفشل بسبب حرف كبير. وقد كتب المستخدم "yes" وسيحتار من الرفض.

ولاحظ **التسلسل (chaining)**: يعيد \`.strip()\` نصا، فتستطيع استدعاء \`.lower()\` عليه مباشرة. كل حلقة تصنع نصا جديدا وتمرره.

---

## جربها

شغل الشيفرة الابتدائية. الأقواس المحيطة بالقيم المنظفة تجعل المسافات مرئية، وهذه بحد ذاتها حيلة مفيدة في تتبع الأخطاء.
`,
      },
    },

    /* ── 4. Methods: Searching ── */
    {
      id: 'py-strings-methods-search',
      slug: 'methods-searching',
      title: { en: 'Methods: Searching', ar: 'الدوال: البحث' },
      order: 4,
      type: 'lesson',
      starterCode: `log = "GET /admin HTTP/1.1 200"

# in, the simplest question
print("admin" in log)
print("POST" in log)

# find(), position, or -1 when absent
print(log.find("admin"))
print(log.find("POST"))

# index(), like find(), but raises when absent
print(log.index("admin"))

# count()
print("a,b,a,c".count("a"))

# startswith / endswith
print(log.startswith("GET"))
print(log.endswith("200"))

# endswith accepts a tuple, any of these
print("report.pdf".endswith((".pdf", ".txt")))
`,
      markdownContent: {
        en: `# Methods: Searching

Finding text inside text.

---

## in, just asking

For "is it there?", the \`in\` operator is the clearest thing available:

\`\`\`python
log = "GET /admin HTTP/1.1 200"
print("admin" in log)   # True
print("POST" in log)    # False
\`\`\`

It gives a \`bool\`, so it drops straight into an \`if\`. Reach for this first.

## find(), where is it?

\`find()\` returns the **index** of the first match, or **-1** if there's none:

\`\`\`python
log.find("admin")   # 5
log.find("POST")    # -1
\`\`\`

It returns \`-1\` rather than raising, so always check before using the result, \`-1\` is a valid index (the last character), which makes a missed match fail silently and confusingly.

\`rfind()\` is identical but searches from the right, giving the **last** match.

## index(), where is it, or else

\`index()\` does the same job but **raises \`ValueError\`** when the text isn't found:

\`\`\`python
log.index("POST")   # ValueError: substring not found
\`\`\`

Which to use is about intent. If absence is normal, \`find()\` and check for \`-1\`. If absence means something is broken, \`index()\`, an exception is louder than a \`-1\` you forgot to handle.

## count()

\`\`\`python
"a,b,a,c".count("a")   # 2
\`\`\`

Counts **non-overlapping** matches: \`"aaa".count("aa")\` is \`1\`, not \`2\`.

---

## startswith / endswith

\`\`\`python
log.startswith("GET")   # True
log.endswith("200")     # True
\`\`\`

Both return a \`bool\`. Both accept a **tuple** to test several options at once:

\`\`\`python
"report.pdf".endswith((".pdf", ".txt"))   # True
\`\`\`

Cleaner than chaining \`or\`. Note the extra parentheses, that's one tuple argument, not two arguments.

---

## Try It

Run the starter code. Compare \`find("POST")\` returning \`-1\` with what \`index("POST")\` would do, swap it in and read the traceback.
`,
        ar: `# التوابع: البحث

إيجاد نص داخل نص.

---

## in، مجرد سؤال

للسؤال "هل هو موجود؟" يعد العامل \`in\` أوضح ما لديك:

\`\`\`python
log = "GET /admin HTTP/1.1 200"
print("admin" in log)   # True
print("POST" in log)    # False
\`\`\`

وهو يعطي قيمة \`bool\`، فيدخل مباشرة في جملة \`if\`. اجعله خيارك الأول.

## find()، أين هو؟

يعيد \`find()\` **فهرس** أول تطابق، أو **-1** إن لم يجد شيئا:

\`\`\`python
log.find("admin")   # 5
log.find("POST")    # -1
\`\`\`

وهو يعيد \`-1\` بدل أن يرفع خطأ، فتحقق دائما قبل استعمال النتيجة، لأن \`-1\` فهرس صالح (المحرف الأخير)، وهذا يجعل التطابق المفقود يفشل بصمت وبطريقة محيرة.

والتابع \`rfind()\` مطابق له لكنه يبحث من اليمين، فيعطي **آخر** تطابق.

## index()، أين هو، وإلا

يؤدي \`index()\` المهمة نفسها لكنه **يرفع \`ValueError\`** حين لا يعثر على النص:

\`\`\`python
log.index("POST")   # ValueError: substring not found
\`\`\`

واختيار أحدهما مسألة نية. فإن كان الغياب أمرا طبيعيا فاستعمل \`find()\` وتحقق من \`-1\`. وإن كان الغياب يعني أن شيئا ما معطوب فاستعمل \`index()\`، فالاستثناء أعلى صوتا من \`-1\` نسيت معالجته.

## count()

\`\`\`python
"a,b,a,c".count("a")   # 2
\`\`\`

يعد التطابقات **غير المتداخلة**: فـ \`"aaa".count("aa")\` تساوي \`1\` لا \`2\`.

---

## startswith و endswith

\`\`\`python
log.startswith("GET")   # True
log.endswith("200")     # True
\`\`\`

كلاهما يعيد \`bool\`. وكلاهما يقبل **صفا (tuple)** لاختبار عدة احتمالات دفعة واحدة:

\`\`\`python
"report.pdf".endswith((".pdf", ".txt"))   # True
\`\`\`

وهذا أنظف من تسلسل \`or\`. ولاحظ القوسين الإضافيين، فهذا وسيط واحد من نوع tuple لا وسيطان.

---

## جربها

شغل الشيفرة الابتدائية. وقارن بين \`find("POST")\` وهو يعيد \`-1\` وبين ما كان سيفعله \`index("POST")\`، ضعه مكانه واقرأ أثر التتبع (traceback).
`,
      },
    },

    /* ── 5. Methods: Splitting and Joining ── */
    {
      id: 'py-strings-methods-split',
      slug: 'methods-splitting-joining',
      title: { en: 'Methods: Splitting & Joining', ar: 'الدوال: التقسيم والدمج' },
      order: 5,
      type: 'lesson',
      starterCode: `csv = "sara,ali,zaid"

# split(), string -> list
print(csv.split(","))

# With no argument: split on any run of whitespace
print("GET /admin HTTP/1.1".split())

# maxsplit limits how many splits happen
print(csv.split(",", 1))

# splitlines(), split on line breaks
print("a\\nb\\nc".splitlines())

# join(), list -> string
names = ["sara", "ali", "zaid"]
print(", ".join(names))
print("-".join("abc"))

# partition(), split once, keep the separator
print("user@mail.com".partition("@"))
`,
      markdownContent: {
        en: `# Methods: Splitting & Joining

Two opposite operations, and the pair you'll use most when handling real data.

---

## split(), text to list

\`\`\`python
csv = "sara,ali,zaid"
csv.split(",")   # ['sara', 'ali', 'zaid']
\`\`\`

It returns a **list**, not a string, the first method here that changes type.

With **no argument** it does something subtly different: splits on any run of whitespace *and* discards empties:

\`\`\`python
"GET  /admin   HTTP/1.1".split()   # ['GET', '/admin', 'HTTP/1.1']
\`\`\`

Compare with an explicit separator, which does not collapse runs:

\`\`\`python
"a,,b".split(",")   # ['a', '', 'b']   <- empty string in the middle
\`\`\`

That's the correct behaviour, two commas really do delimit an empty field, but it surprises people. Bare \`.split()\` is what you want for whitespace; \`.split(sep)\` for structured data.

\`maxsplit\` caps the number of splits:

\`\`\`python
csv.split(",", 1)   # ['sara', 'ali,zaid']
\`\`\`

Handy for \`key=value\` lines where the value may itself contain \`=\`.

\`splitlines()\` handles line breaks properly across platforms:

\`\`\`python
"a\\nb\\nc".splitlines()   # ['a', 'b', 'c']
\`\`\`

---

## join(), list to text

\`join()\` is \`split()\` backwards. The **separator is the string you call it on**, and the list is the argument:

\`\`\`python
names = ["sara", "ali", "zaid"]
", ".join(names)   # 'sara, ali, zaid'
\`\`\`

That reads backwards to most people. It's \`separator.join(items)\`, not \`items.join(separator)\`, a consequence of \`join\` being a *string* method that accepts any sequence.

Because a string is itself a sequence of characters:

\`\`\`python
"-".join("abc")   # 'a-b-c'
\`\`\`

Every item must be a string, or you get a \`TypeError\`:

\`\`\`python
", ".join(["a", 1])   # TypeError: sequence item 1: expected str instance, int found
\`\`\`

## partition()

Splits **once** and keeps the separator, always returning three parts:

\`\`\`python
"user@mail.com".partition("@")   # ('user', '@', 'mail.com')
\`\`\`

If the separator is absent you still get three parts, the last two empty, so unpacking never breaks.

---

## Try It

Run the starter code. Then try \`"a,,b".split(",")\` and see the empty string appear, then \`" a  b ".split()\` and watch the empties vanish.
`,
        ar: `# التوابع: التقسيم والوصل

عمليتان متعاكستان، وهما الزوج الذي ستستعمله أكثر من غيره في التعامل مع البيانات الحقيقية.

---

## split()، من نص إلى قائمة

\`\`\`python
csv = "sara,ali,zaid"
csv.split(",")   # ['sara', 'ali', 'zaid']
\`\`\`

يعيد **قائمة** لا نصا، وهو أول تابع هنا يغير النوع.

ومن **دون وسيط** يفعل شيئا مختلفا اختلافا دقيقا: يقسم عند أي سلسلة مسافات *ويهمل* الفراغات:

\`\`\`python
"GET  /admin   HTTP/1.1".split()   # ['GET', '/admin', 'HTTP/1.1']
\`\`\`

قارن ذلك بفاصل صريح، فهو لا يدمج السلاسل المتتالية:

\`\`\`python
"a,,b".split(",")   # ['a', '', 'b']   <- empty string in the middle
\`\`\`

وهذا هو السلوك الصحيح، فالفاصلتان تحددان فعلا حقلا فارغا، لكنه يفاجئ الناس. فاستعمل \`.split()\` المجردة للمسافات، و\`.split(sep)\` للبيانات المهيكلة.

والوسيط \`maxsplit\` يحد من عدد عمليات التقسيم:

\`\`\`python
csv.split(",", 1)   # ['sara', 'ali,zaid']
\`\`\`

وهو مفيد لأسطر \`key=value\` التي قد تحتوي قيمتها على \`=\`.

والتابع \`splitlines()\` يتعامل مع فواصل الأسطر تعاملا سليما عبر الأنظمة المختلفة:

\`\`\`python
"a\\nb\\nc".splitlines()   # ['a', 'b', 'c']
\`\`\`

---

## join()، من قائمة إلى نص

التابع \`join()\` هو \`split()\` بالمقلوب. و**الفاصل هو النص الذي تستدعيه عليه**، والقائمة هي الوسيط:

\`\`\`python
names = ["sara", "ali", "zaid"]
", ".join(names)   # 'sara, ali, zaid'
\`\`\`

وهذا يقرأ بالمقلوب عند معظم الناس. فهو \`separator.join(items)\` لا \`items.join(separator)\`، وذلك لأن \`join\` تابع *نصي* يقبل أي متتالية.

ولأن النص نفسه متتالية من المحارف:

\`\`\`python
"-".join("abc")   # 'a-b-c'
\`\`\`

ويجب أن يكون كل عنصر نصا، وإلا حصلت على \`TypeError\`:

\`\`\`python
", ".join(["a", 1])   # TypeError: sequence item 1: expected str instance, int found
\`\`\`

## partition()

يقسم **مرة واحدة** ويبقي الفاصل، ويعيد دائما ثلاثة أجزاء:

\`\`\`python
"user@mail.com".partition("@")   # ('user', '@', 'mail.com')
\`\`\`

وإن غاب الفاصل حصلت على ثلاثة أجزاء أيضا، الأخيران فارغان، فلا ينكسر التفكيك أبدا.

---

## جربها

شغل الشيفرة الابتدائية. ثم جرب \`"a,,b".split(",")\` وشاهد النص الفارغ يظهر، ثم \`" a  b ".split()\` وراقب اختفاء الفراغات.
`,
      },
    },

    /* ── 6. Methods: Replacing and Testing ── */
    {
      id: 'py-strings-methods-test',
      slug: 'methods-replacing-testing',
      title: { en: 'Methods: Replacing & Testing', ar: 'الدوال: الاستبدال والفحص' },
      order: 6,
      type: 'lesson',
      starterCode: `# replace()
print("a-b-c".replace("-", "+"))
print("a-b-c".replace("-", "+", 1))   # only the first

# The is* family returns True/False
print("12345".isdigit())
print("abc".isalpha())
print("abc123".isalnum())
print("   ".isspace())
print("Hello".istitle())

# Validating input before converting
age = "21"
if age.isdigit():
    print("valid:", int(age) + 1)

# Padding
print("7".zfill(3))
print("hi".center(10, "*"))
print("hi".ljust(6, ".") + "|")
`,
      markdownContent: {
        en: `# Methods: Replacing & Testing

---

## replace()

Swaps every occurrence and hands back a new string:

\`\`\`python
"a-b-c".replace("-", "+")      # 'a+b+c'
"a-b-c".replace("-", "+", 1)   # 'a+b-c' , count limits it
\`\`\`

Replacing with \`""\` deletes:

\`\`\`python
"1,234,567".replace(",", "")   # '1234567'
\`\`\`

And again, it returns a new string. \`text.replace(...)\` on its own line changes nothing.

---

## The is* family

These ask a question and return \`True\` or \`False\`:

\`\`\`python
"12345".isdigit()   # True
"abc".isalpha()     # True
"abc123".isalnum()  # True, letters or digits
"   ".isspace()     # True
"Hello".istitle()   # True
\`\`\`

Also \`islower()\` and \`isupper()\`.

Two sharp edges:

**Empty strings are always \`False\`.** \`"".isdigit()\` is \`False\`. There's no character to satisfy the test, so nothing does.

**\`isdigit()\` is not "is a number".** It's \`False\` for \`"-5"\` and \`"3.14"\`, the minus and the dot aren't digits. So this rejects valid input:

\`\`\`python
"3.14".isdigit()   # False
\`\`\`

For whole, non-negative numbers it's exactly right, and that's its real job:

\`\`\`python
age = "21"
if age.isdigit():
    print(int(age) + 1)
\`\`\`

That guard matters, because \`int("abc")\` raises \`ValueError\` and stops your program. Check first, convert second.

---

## Padding

\`\`\`python
"7".zfill(3)          # '007'  , pad with zeros
"hi".center(10, "*")  # '****hi****'
"hi".ljust(6, ".")    # 'hi....'
"hi".rjust(6, ".")    # '....hi'
\`\`\`

\`zfill()\` is for numbers as text (invoice ids, timestamps). The others build aligned columns. If the string is already long enough, all three return it unchanged, they never truncate.

---

## Try It

Run the starter code. Then try \`"3.14".isdigit()\` and \`"".isdigit()\`, both \`False\`, for different reasons worth being clear about.
`,
        ar: `# التوابع: الاستبدال والاختبار

---

## replace()

يبدل كل ظهور ويسلمك نصا جديدا:

\`\`\`python
"a-b-c".replace("-", "+")      # 'a+b+c'
"a-b-c".replace("-", "+", 1)   # 'a+b-c' , count limits it
\`\`\`

والاستبدال بـ \`""\` يحذف:

\`\`\`python
"1,234,567".replace(",", "")   # '1234567'
\`\`\`

ومرة أخرى، هو يعيد نصا جديدا. فسطر \`text.replace(...)\` وحده لا يغير شيئا.

---

## عائلة is*

هذه تطرح سؤالا وتعيد \`True\` أو \`False\`:

\`\`\`python
"12345".isdigit()   # True
"abc".isalpha()     # True
"abc123".isalnum()  # True, letters or digits
"   ".isspace()     # True
"Hello".istitle()   # True
\`\`\`

وهناك أيضا \`islower()\` و\`isupper()\`.

وفيها حدان حادان:

**النصوص الفارغة تعطي \`False\` دائما.** فـ \`"".isdigit()\` تساوي \`False\`. إذ لا يوجد محرف يحقق الاختبار، فلا شيء يحققه.

**والتابع \`isdigit()\` لا يعني "هل هو عدد".** فهو \`False\` لـ \`"-5"\` و\`"3.14"\`، لأن الإشارة السالبة والنقطة ليستا أرقاما. لذلك فهو يرفض مدخلات صالحة:

\`\`\`python
"3.14".isdigit()   # False
\`\`\`

أما للأعداد الصحيحة غير السالبة فهو مضبوط تماما، وتلك مهمته الحقيقية:

\`\`\`python
age = "21"
if age.isdigit():
    print(int(age) + 1)
\`\`\`

وهذا التحقق مهم، لأن \`int("abc")\` ترفع \`ValueError\` وتوقف برنامجك. تحقق أولا ثم حول.

---

## الحشو

\`\`\`python
"7".zfill(3)          # '007'  , pad with zeros
"hi".center(10, "*")  # '****hi****'
"hi".ljust(6, ".")    # 'hi....'
"hi".rjust(6, ".")    # '....hi'
\`\`\`

التابع \`zfill()\` مخصص للأعداد المكتوبة كنص (أرقام الفواتير، الطوابع الزمنية). والبقية تبني أعمدة متحاذية. وإن كان النص طويلا بما يكفي أصلا أعادته الثلاثة كما هو، فهي لا تقتطع منه أبدا.

---

## جربها

شغل الشيفرة الابتدائية. ثم جرب \`"3.14".isdigit()\` و\`"".isdigit()\`، وكلتاهما \`False\` لسببين مختلفين يستحقان الوضوح.
`,
      },
    },

    /* ── 7. Formatting: The Older Ways ── */
    {
      id: 'py-string-formatting',
      slug: 'string-formatting',
      title: { en: 'Formatting: The Older Ways', ar: 'التنسيق: الطرق القديمة' },
      order: 7,
      type: 'lesson',
      starterCode: `name = "Sara"
level = 3
score = 91.5

# 1. Concatenation, needs str(), gets noisy fast
print("Name: " + name + " | Level: " + str(level))

# 2. % formatting, the oldest style
print("Name: %s | Level: %d" % (name, level))
print("Score: %.1f%%" % score)

# 3. .format(), placeholders by position...
print("Name: {} | Level: {}".format(name, level))
# ...or by index, so you can reuse and reorder
print("{0} is level {1}. Yes, {0}.".format(name, level))
# ...or by name
print("{n} scored {s:.1f}".format(n=name, s=score))
`,
      markdownContent: {
        en: `# Formatting: The Older Ways

Building a string out of values. You'll write **f-strings** in your own code, the next lesson, but these two older styles are everywhere in existing code, so you need to read them.

---

## Why not concatenation

\`\`\`python
print("Name: " + name + " | Level: " + str(level))
\`\`\`

It works, and it's painful: every non-string needs \`str()\`, and the text is chopped into fragments. Formatting exists to fix that.

---

## 1. % formatting

The oldest style, borrowed from C. A template with \`%\` placeholders, then \`%\` and the values:

\`\`\`python
print("Name: %s | Level: %d" % (name, level))
\`\`\`

The common codes:

| Code | Means |
|---|---|
| \`%s\` | string (calls \`str()\` on anything) |
| \`%d\` | whole number |
| \`%f\` | float, 6 decimals by default |
| \`%.2f\` | float, 2 decimals |
| \`%%\` | a literal \`%\` |

\`\`\`python
print("Score: %.1f%%" % score)   # Score: 91.5%
\`\`\`

Note \`%%\`, since \`%\` starts a placeholder, a literal percent must be doubled.

The trap: with several values you must pass a **tuple**, and the count and order must match, or you get a \`TypeError\` at runtime.

## 2. .format()

Python 3's replacement. Placeholders are \`{}\`, filled in order:

\`\`\`python
print("Name: {} | Level: {}".format(name, level))
\`\`\`

Better, because you can index them, which lets you reuse a value:

\`\`\`python
print("{0} is level {1}. Yes, {0}.".format(name, level))
\`\`\`

Or name them, which survives reordering:

\`\`\`python
print("{n} scored {s:.1f}".format(n=name, s=score))
\`\`\`

That \`:.1f\` after the colon is a **format spec**, the same mini-language f-strings use. Learn it once here and it transfers directly.

---

## So which?

Read all three; write f-strings. You'll meet \`%\` in older code and in \`logging\`, where it's still the recommended style. \`.format()\` still wins when the template lives apart from the values, in a config file, say, because an f-string is evaluated where it's written.

---

## Try It

Run the starter code, all five lines build the same kind of output by different routes. Then try removing a value from a \`%\` tuple and read the error.
`,
        ar: `# التنسيق: الطرق الأقدم

بناء نص من قيم. ستكتب **f-strings** في شيفرتك أنت، وهي موضوع الدرس القادم، لكن هذين الأسلوبين الأقدم منتشران في الشيفرات الموجودة، فأنت بحاجة إلى قراءتهما.

---

## لماذا لا نكتفي بالدمج

\`\`\`python
print("Name: " + name + " | Level: " + str(level))
\`\`\`

يعمل، وهو مؤلم: فكل ما ليس نصا يحتاج \`str()\`، والنص يتقطع إلى شظايا. والتنسيق موجود ليعالج هذا.

---

## 1. التنسيق بـ %

الأسلوب الأقدم، مستعار من لغة C. قالب فيه عناصر نائبة تبدأ بـ \`%\`، ثم \`%\` والقيم:

\`\`\`python
print("Name: %s | Level: %d" % (name, level))
\`\`\`

والرموز الشائعة:

| الرمز | المعنى |
|---|---|
| \`%s\` | نص (تستدعي \`str()\` على أي شيء) |
| \`%d\` | عدد صحيح |
| \`%f\` | عدد عشري، بست خانات افتراضيا |
| \`%.2f\` | عدد عشري، بخانتين |
| \`%%\` | علامة \`%\` حرفية |

\`\`\`python
print("Score: %.1f%%" % score)   # Score: 91.5%
\`\`\`

ولاحظ \`%%\`، فلأن \`%\` تبدأ عنصرا نائبا وجب مضاعفة علامة النسبة الحرفية.

والفخ: مع عدة قيم يجب أن تمرر **صفا (tuple)**، ويجب أن يتطابق العدد والترتيب، وإلا حصلت على \`TypeError\` أثناء التنفيذ.

## 2. .format()

بديل بايثون 3. العناصر النائبة هي \`{}\`، وتملأ بالترتيب:

\`\`\`python
print("Name: {} | Level: {}".format(name, level))
\`\`\`

وهو أفضل، لأنك تستطيع ترقيمها، وهذا يتيح إعادة استعمال قيمة:

\`\`\`python
print("{0} is level {1}. Yes, {0}.".format(name, level))
\`\`\`

أو تسميتها، وهذا ينجو من إعادة الترتيب:

\`\`\`python
print("{n} scored {s:.1f}".format(n=name, s=score))
\`\`\`

وما بعد النقطتين \`:.1f\` هو **مواصفة تنسيق (format spec)**، وهي اللغة المصغرة نفسها التي تستعملها f-strings. تعلمها هنا مرة واحدة وستنتقل معك مباشرة.

---

## فأيها إذن؟

اقرأ الثلاثة، واكتب f-strings. ستقابل \`%\` في الشيفرات القديمة وفي وحدة \`logging\` حيث لا يزال الأسلوب الموصى به. ويبقى \`.format()\` متفوقا حين يعيش القالب بعيدا عن القيم، في ملف إعدادات مثلا، لأن f-string تقيم في الموضع الذي كتبت فيه.

---

## جربها

شغل الشيفرة الابتدائية، فالأسطر الخمسة كلها تبني النوع نفسه من المخرجات بطرق مختلفة. ثم جرب حذف قيمة من صف \`%\` واقرأ الخطأ.
`,
      },
    },

    /* ── 8. Formatting: f-strings ── */
    {
      id: 'py-fstrings',
      slug: 'f-strings',
      title: { en: 'Formatting: f-strings', ar: 'التنسيق: f-strings' },
      order: 8,
      type: 'lesson',
      starterCode: `name = "Sara"
level = 3
score = 91.4567

# Put the expression where the value belongs
print(f"Name: {name} | Level: {level}")

# Any expression works inside the braces
print(f"Next level: {level + 1}")
print(f"Shouting: {name.upper()}")

# Format specs after a colon
print(f"Score: {score:.2f}")
print(f"Padded: {level:03d}")
print(f"[{name:>10}]")
print(f"[{name:^10}]")

# = shows the expression AND its value, a debugging gift
print(f"{score = }")

# Literal braces are doubled
print(f"{{not a placeholder}}")
`,
      markdownContent: {
        en: `# Formatting: f-strings

Added in Python 3.6, and the way to format text today. Prefix the string with **\`f\`** and put expressions directly inside \`{}\`.

---

## The basics

\`\`\`python
name = "Sara"
level = 3
print(f"Name: {name} | Level: {level}")   # Name: Sara | Level: 3
\`\`\`

The value appears where you read it. No \`str()\`, no counting arguments, no tuple.

Forget the \`f\` and you get the braces printed literally, a quiet bug, since nothing raises:

\`\`\`python
print("Level: {level}")    # Level: {level}
\`\`\`

## Any expression

The braces hold **expressions**, not just names:

\`\`\`python
print(f"Next level: {level + 1}")
print(f"Shouting: {name.upper()}")
print(f"Initial: {name[0]}")
\`\`\`

Keep them short. If the expression needs thought, give it a name on its own line first, the point is readability.

---

## Format specs

After a colon comes the same mini-language \`.format()\` uses:

\`\`\`python
f"{score:.2f}"    # 91.46  , 2 decimals (rounded)
f"{level:03d}"    # 003    , zero-padded to 3
f"{name:>10}"     # '      Sara' , right-aligned in 10
f"{name:<10}"     # 'Sara      ' , left
f"{name:^10}"     # '   Sara   ' , centred
f"{1234567:,}"    # 1,234,567    , thousands separator
\`\`\`

\`.2f\` **rounds** for display; it doesn't change the value. That's a display concern only.

## The = trick

Since 3.8, adding \`=\` prints the expression *and* its value:

\`\`\`python
print(f"{score = }")   # score = 91.4567
\`\`\`

Purpose-built for debugging, you stop typing \`print("score:", score)\` forever.

## Literal braces

Double them:

\`\`\`python
print(f"{{not a placeholder}}")   # {not a placeholder}
\`\`\`

---

## One caution

An f-string is evaluated **where it's written**, so it can't be a reusable template, and never build SQL or shell commands with one. That's how injection happens. Pass values as parameters to the library instead.

---

## Try It

Run the starter code and match each spec to its output. Then try \`f"{score = }"\` on your own values, it's the fastest debugging tool in the language.
`,
        ar: `# التنسيق: f-strings

أضيفت في بايثون 3.6، وهي طريقة تنسيق النص اليوم. ضع البادئة **\`f\`** قبل النص وضع التعابير مباشرة داخل \`{}\`.

---

## الأساسيات

\`\`\`python
name = "Sara"
level = 3
print(f"Name: {name} | Level: {level}")   # Name: Sara | Level: 3
\`\`\`

تظهر القيمة في الموضع الذي تقرؤها فيه. لا \`str()\`، ولا عد للوسائط، ولا صفوف.

وإن نسيت \`f\` طبعت الأقواس حرفيا، وهذا خلل صامت لأن لا شيء يرفع خطأ:

\`\`\`python
print("Level: {level}")    # Level: {level}
\`\`\`

## أي تعبير

الأقواس تحمل **تعابير** لا أسماء فقط:

\`\`\`python
print(f"Next level: {level + 1}")
print(f"Shouting: {name.upper()}")
print(f"Initial: {name[0]}")
\`\`\`

أبقها قصيرة. فإن احتاج التعبير إلى تفكير فأعطه اسما في سطر مستقل أولا، فالمقصود هو سهولة القراءة.

---

## مواصفات التنسيق

بعد النقطتين تأتي اللغة المصغرة نفسها التي يستعملها \`.format()\`:

\`\`\`python
f"{score:.2f}"    # 91.46  , 2 decimals (rounded)
f"{level:03d}"    # 003    , zero-padded to 3
f"{name:>10}"     # '      Sara' , right-aligned in 10
f"{name:<10}"     # 'Sara      ' , left
f"{name:^10}"     # '   Sara   ' , centred
f"{1234567:,}"    # 1,234,567    , thousands separator
\`\`\`

والمواصفة \`.2f\` **تقرب** لأجل العرض فقط، ولا تغير القيمة. فهذا شأن عرض لا أكثر.

## حيلة العلامة =

منذ الإصدار 3.8، تطبع إضافة \`=\` التعبير *وقيمته* معا:

\`\`\`python
print(f"{score = }")   # score = 91.4567
\`\`\`

وهي مصممة لتتبع الأخطاء، فتتوقف عن كتابة \`print("score:", score)\` إلى الأبد.

## الأقواس الحرفية

ضاعفها:

\`\`\`python
print(f"{{not a placeholder}}")   # {not a placeholder}
\`\`\`

---

## تحذير واحد

تقيم f-string **في الموضع الذي كتبت فيه**، فلا يمكن أن تكون قالبا قابلا لإعادة الاستعمال، ولا تبن بها أبدا استعلامات SQL أو أوامر صدفة. فهكذا يحدث الحقن (injection). مرر القيم إلى المكتبة كوسائط بدل ذلك.

---

## جربها

شغل الشيفرة الابتدائية وطابق كل مواصفة مع مخرجاتها. ثم جرب \`f"{score = }"\` على قيمك أنت، فهي أسرع أداة لتتبع الأخطاء في اللغة.
`,
      },
    },

    /* ── 9. Challenge: Log Line Parser ── */
    {
      id: 'py-ch-log-parser',
      slug: 'challenge-log-parser',
      title: { en: 'Challenge: Log Line', ar: 'تحدي: سطر السجل' },
      order: 9,
      type: 'challenge',
      starterCode: `line = "  GET /admin HTTP/1.1 200  "

# From the line above, print exactly:
#
#   Method: GET
#   Path: /admin
#   Status: 200
#   Admin: True
#
# Rules:
#   - Strip the surrounding whitespace first.
#   - Split the line into its parts; do not hard-code "GET", "/admin" or "200".
#   - "Admin" is whether "/admin" appears in the path.
#   - Use f-strings for the output.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Prints method, path, status and the admin check',
          expectedOutput: 'Method: GET\nPath: /admin\nStatus: 200\nAdmin: True',
        },
      ],
      hints: [
        'Start with line.strip(), then .split() with no argument to break on whitespace.',
        'split() returns a list, parts[0] is the method, parts[1] the path, parts[3] the status.',
        'For the last line: "/admin" in path gives you True or False directly, so f"Admin: {\'/admin\' in path}" works, or store it in a variable first.',
      ],
      solution: `line = "  GET /admin HTTP/1.1 200  "

parts = line.strip().split()
method = parts[0]
path = parts[1]
status = parts[3]
is_admin = "/admin" in path

print(f"Method: {method}")
print(f"Path: {path}")
print(f"Status: {status}")
print(f"Admin: {is_admin}")
`,
      markdownContent: {
        en: `# Challenge: Log Line

Parsing a log line is the most ordinary job in security scripting. Here's a small one.

---

## Instructions

Starting from:

\`\`\`python
line = "  GET /admin HTTP/1.1 200  "
\`\`\`

print **exactly**:

\`\`\`
Method: GET
Path: /admin
Status: 200
Admin: True
\`\`\`

## Rules

- **Strip** the surrounding whitespace first.
- **Split** the line into parts. Don't hard-code \`GET\`, \`/admin\` or \`200\`, pull them out of the string, so the code would work on a different line.
- \`Admin\` is whether \`/admin\` appears in the path, a \`bool\`, printed as \`True\`.
- Use **f-strings**.

## What you need

\`.strip()\`, \`.split()\`, indexing a list, the \`in\` operator, and f-strings, the whole module in four lines.

## A hint on the shape

After \`line.strip().split()\` you have:

\`\`\`
['GET', '/admin', 'HTTP/1.1', '200']
   0        1          2        3
\`\`\`

The status is the **fourth** item, not the third.

---

Click **Submit** when ready.
`,
        ar: `# تحد: سطر سجل

تحليل سطر من سجل هو أكثر المهام اعتيادا في برمجة الأمن السيبراني. وإليك واحدا صغيرا منها.

---

## التعليمات

انطلاقا من:

\`\`\`python
line = "  GET /admin HTTP/1.1 200  "
\`\`\`

اطبع هذا **بالضبط**:

\`\`\`
Method: GET
Path: /admin
Status: 200
Admin: True
\`\`\`

## القواعد

- **نظف** المسافات المحيطة أولا بـ strip.
- **قسم** السطر إلى أجزاء. ولا تكتب \`GET\` أو \`/admin\` أو \`200\` نصا ثابتا، بل استخرجها من النص، ليعمل الحل على سطر آخر أيضا.
- القيمة \`Admin\` هي ما إذا كان \`/admin\` يظهر في المسار، وهي \`bool\` تطبع بصيغة \`True\`.
- استعمل **f-strings**.

## ما تحتاجه

\`.strip()\`، و\`.split()\`، وفهرسة القائمة، والعامل \`in\`، وf-strings، أي الوحدة كلها في أربعة أسطر.

## تلميح عن الشكل

بعد \`line.strip().split()\` يصير لديك:

\`\`\`
['GET', '/admin', 'HTTP/1.1', '200']
   0        1          2        3
\`\`\`

فالحالة هي العنصر **الرابع** لا الثالث.

---

اضغط **Submit** حين تجهز.
`,
      },
    },
  ],
};

export default strings;
