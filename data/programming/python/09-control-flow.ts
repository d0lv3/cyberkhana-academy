import type { ProgrammingModule } from '../types';

const controlFlow: ProgrammingModule = {
  id: 'py-control-flow',
  slug: 'control-flow',
  title: {
    en: 'Control Flow',
    ar: 'التحكم في المسار',
  },
  description: {
    en: 'Making decisions, if/elif/else, nesting, the ternary operator, and membership tests.',
    ar: 'اتخاذ القرارات، if/elif/else، التداخل، المعامل الثلاثي، واختبارات العضوية.',
  },
  order: 9,
  concepts: [
    /* ── 1. If, Elif, Else ── */
    {
      id: 'py-if-elif-else',
      slug: 'if-elif-else',
      title: { en: 'If, Elif, Else', ar: 'if و elif و else' },
      order: 1,
      type: 'lesson',
      starterCode: `score = 74

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
else:
    print("F")

# Only the FIRST matching branch runs
print("---")

# Any value works as a condition, truthiness from Module 7
items = []
if items:
    print("has items")
else:
    print("empty")

# Indentation decides what belongs to the branch
if score > 50:
    print("inside the if")
print("always runs")
`,
      markdownContent: {
        en: `# If, Elif, Else

Until now your code ran top to bottom, every line, every time. \`if\` is how it starts making decisions.

---

## if

\`\`\`python
if score >= 50:
    print("pass")
\`\`\`

Three parts: the keyword, a condition, a colon, then an **indented block** that runs only when the condition is truthy.

The colon and the indentation are both required. Miss the colon and you get a \`SyntaxError\`; miss the indent and an \`IndentationError\`.

The condition doesn't have to be a comparison. Any value works, judged by truthiness:

\`\`\`python
if items:      # truthy when non-empty
if not name:   # truthy when name is ""
\`\`\`

## else

The fallback when the condition is falsy:

\`\`\`python
if score >= 50:
    print("pass")
else:
    print("fail")
\`\`\`

Exactly one of the two runs. Always.

## elif

For more than two outcomes:

\`\`\`python
if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
else:
    print("F")
\`\`\`

\`elif\` is "else if", checked only when every branch above it failed.

---

## Order is the whole game

**Only the first matching branch runs**, then the rest are skipped entirely. That's why the example goes high to low.

Reverse it and it breaks:

\`\`\`python
if score >= 70:
    print("C")
elif score >= 90:
    print("A")   # unreachable, 95 already matched >= 70
\`\`\`

A score of 95 prints \`C\`, because \`95 >= 70\` matched first. No error, no warning, just a wrong answer. When branches overlap, order them from most specific to most general.

Because only one branch runs, you don't repeat the bounds:

\`\`\`python
elif score >= 80:              # 90+ is already gone
elif score >= 80 and score < 90:   # correct but redundant
\`\`\`

## if vs a chain of ifs

\`\`\`python
if score >= 90: print("A")
if score >= 80: print("B")   # separate, also runs!
\`\`\`

Separate \`if\` statements are **independent**, so a 95 prints both. Use \`elif\` when the cases are alternatives, separate \`if\`s when they're genuinely unrelated questions.

---

## Try It

Run the starter code with \`score = 74\`, then try \`95\`. Then reorder the branches lowest-first and watch it quietly give wrong answers.
`,
        ar: `# if و elif و else

حتى الآن كانت شيفرتك تعمل من الأعلى إلى الأسفل، كل سطر في كل مرة. وبـ \`if\` تبدأ باتخاذ القرارات.

---

## if

\`\`\`python
if score >= 50:
    print("pass")
\`\`\`

ثلاثة أجزاء: الكلمة المفتاحية، ثم شرط، ثم نقطتان، ثم **كتلة مزاحة** لا تنفذ إلا حين يكون الشرط صادقا.

والنقطتان والإزاحة كلتاهما مطلوبة. فإن أهملت النقطتين حصلت على \`SyntaxError\`، وإن أهملت الإزاحة حصلت على \`IndentationError\`.

ولا يشترط أن يكون الشرط مقارنة. فأي قيمة تصلح، ويحكم عليها بالصدقية:

\`\`\`python
if items:      # truthy when non-empty
if not name:   # truthy when name is ""
\`\`\`

## else

البديل حين يكون الشرط كاذبا:

\`\`\`python
if score >= 50:
    print("pass")
else:
    print("fail")
\`\`\`

وينفذ واحد منهما بالضبط. دائما.

## elif

لأكثر من نتيجتين:

\`\`\`python
if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
else:
    print("F")
\`\`\`

فـ \`elif\` تعني "وإلا إذا"، ولا تفحص إلا حين تفشل كل الفروع التي فوقها.

---

## الترتيب هو اللعبة كلها

**لا ينفذ إلا أول فرع مطابق**، ثم تتخطى البقية بالكامل. ولهذا يسير المثال من الأعلى إلى الأدنى.

اعكسه فينكسر:

\`\`\`python
if score >= 70:
    print("C")
elif score >= 90:
    print("A")   # unreachable, 95 already matched >= 70
\`\`\`

فدرجة 95 تطبع \`C\`، لأن \`95 >= 70\` طابقت أولا. لا خطأ ولا تحذير، بل جواب خاطئ فحسب. وحين تتداخل الفروع فرتبها من الأكثر تخصيصا إلى الأكثر عموما.

ولأن فرعا واحدا فقط ينفذ، فلا تكرر الحدود:

\`\`\`python
elif score >= 80:              # 90+ is already gone
elif score >= 80 and score < 90:   # correct but redundant
\`\`\`

## if مقابل سلسلة من if

\`\`\`python
if score >= 90: print("A")
if score >= 80: print("B")   # separate, also runs!
\`\`\`

جمل \`if\` المنفصلة **مستقلة**، فدرجة 95 تطبع الاثنين. استعمل \`elif\` حين تكون الحالات بدائل، وجمل \`if\` منفصلة حين تكون أسئلة غير مترابطة فعلا.

---

## جربها

شغل الشيفرة الابتدائية بـ \`score = 74\`، ثم جرب \`95\`. ثم أعد ترتيب الفروع من الأدنى أولا وراقبها وهي تعطي أجوبة خاطئة في هدوء.
`,
      },
    },

    /* ── 2. Nested Conditions ── */
    {
      id: 'py-nested-if',
      slug: 'nested-conditions',
      title: { en: 'Nested Conditions', ar: 'الشروط المتداخلة' },
      order: 2,
      type: 'lesson',
      starterCode: `age, has_id, banned = 21, True, False

# Nested, each level narrows further
if age >= 18:
    if has_id:
        if not banned:
            print("allowed")
        else:
            print("banned")
    else:
        print("no id")
else:
    print("too young")

print("---")

# The same logic, flattened with and
if age >= 18 and has_id and not banned:
    print("allowed")

print("---")

# Guard clauses, reject early, keep the happy path unindented
def check(age, has_id, banned):
    if age < 18:
        return "too young"
    if not has_id:
        return "no id"
    if banned:
        return "banned"
    return "allowed"

print(check(21, True, False))
print(check(16, True, False))
`,
      markdownContent: {
        en: `# Nested Conditions

An \`if\` can live inside another \`if\`. Each level is another indent.

\`\`\`python
if age >= 18:
    if has_id:
        print("allowed")
    else:
        print("no id")
else:
    print("too young")
\`\`\`

The inner \`if\` is only reached when the outer one passed, so by the time you read \`has_id\`, age is already known to be fine.

Getting the indentation wrong changes the meaning without any error. An \`else\` attaches to the \`if\` at **its own indent level**, so shifting it by four spaces silently rewires your logic. This is why Python insists on consistent indentation.

---

## Flatten it when you can

Nesting is easy to write and hard to read. Three levels deep and you're tracking three conditions at once.

When the branches all lead to the same place, **\`and\` is flatter**:

\`\`\`python
if age >= 18 and has_id and not banned:
    print("allowed")
\`\`\`

One line, one indent, reads like the sentence you'd say out loud. Short-circuiting means it's also efficient, \`has_id\` is never checked if the age already failed.

Use nesting only when the levels genuinely differ, when each failure needs its own distinct response.

## Guard clauses

The better pattern when each failure has its own message: handle the bad cases **first** and leave early.

\`\`\`python
def check(age, has_id, banned):
    if age < 18:
        return "too young"
    if not has_id:
        return "no id"
    if banned:
        return "banned"
    return "allowed"
\`\`\`

Compare with the nested version. Same logic, but:

- nothing is indented more than once
- each rule is one line, readable in isolation
- the **happy path** is last and unindented, the thing that normally happens is the easiest thing to find

This is one of the highest-value habits in programming. When you catch yourself three levels deep, ask what you could reject early instead.

(\`def\` is the Functions module, here just read \`return\` as "answer, and stop".)

---

## Try It

Run the starter code, all three versions agree. Then flip \`has_id\` to \`False\` and confirm all three still agree.
`,
        ar: `# الشروط المتداخلة

تستطيع جملة \`if\` أن تسكن داخل جملة \`if\` أخرى. وكل مستوى إزاحة إضافية.

\`\`\`python
if age >= 18:
    if has_id:
        print("allowed")
    else:
        print("no id")
else:
    print("too young")
\`\`\`

ولا يصل التنفيذ إلى \`if\` الداخلية إلا حين تنجح الخارجية، فحين تقرأ \`has_id\` يكون العمر قد ثبت أنه سليم.

وإخطاء الإزاحة يغير المعنى دون أي خطأ. فـ \`else\` ترتبط بـ \`if\` التي في **مستوى إزاحتها هي**، فإزاحتها أربع مسافات تعيد توصيل منطقك بصمت. ولهذا تصر بايثون على اتساق الإزاحة.

---

## سطح البنية حين تستطيع

التداخل سهل الكتابة صعب القراءة. فثلاثة مستويات عمقا تعني تتبع ثلاثة شروط في آن واحد.

وحين تؤدي الفروع كلها إلى المكان نفسه، فـ **\`and\` أكثر تسطيحا**:

\`\`\`python
if age >= 18 and has_id and not banned:
    print("allowed")
\`\`\`

سطر واحد وإزاحة واحدة، ويقرأ كالجملة التي كنت ستقولها بصوتك. والقطع القصير يجعله كفئا أيضا، فلا يفحص \`has_id\` أبدا إن كان العمر قد فشل أصلا.

ولا تستعمل التداخل إلا حين تختلف المستويات اختلافا حقيقيا، أي حين يحتاج كل فشل إلى رد مميز خاص به.

## الجمل الحارسة

النمط الأفضل حين يكون لكل فشل رسالته: عالج الحالات السيئة **أولا** واخرج مبكرا.

\`\`\`python
def check(age, has_id, banned):
    if age < 18:
        return "too young"
    if not has_id:
        return "no id"
    if banned:
        return "banned"
    return "allowed"
\`\`\`

قارن ذلك بالنسخة المتداخلة. المنطق نفسه، لكن:

- لا شيء مزاح أكثر من مرة واحدة
- وكل قاعدة سطر واحد يقرأ منفردا
- و**المسار السعيد** أخيرا وبلا إزاحة، فما يحدث عادة هو أسهل ما يعثر عليه

وهذه من أعلى العادات قيمة في البرمجة. فحين تضبط نفسك على عمق ثلاثة مستويات، اسأل ما الذي كان بوسعك رفضه مبكرا بدل ذلك.

(والكلمة \`def\` من وحدة الدوال، واكتف هنا بقراءة \`return\` بمعنى "أجب وتوقف".)

---

## جربها

شغل الشيفرة الابتدائية، فالنسخ الثلاث متفقة. ثم اقلب \`has_id\` إلى \`False\` وتأكد أن الثلاث ما زلن متفقات.
`,
      },
    },

    /* ── 3. The Ternary Operator ── */
    {
      id: 'py-ternary',
      slug: 'ternary-operator',
      title: { en: 'The Ternary Operator', ar: 'المعامل الثلاثي' },
      order: 3,
      type: 'lesson',
      starterCode: `age = 21

# The long way
if age >= 18:
    status = "adult"
else:
    status = "minor"
print(status)

# The same thing, in one line
status = "adult" if age >= 18 else "minor"
print(status)

# It's an EXPRESSION, so it fits anywhere a value fits
print(f"You are an {'adult' if age >= 18 else 'minor'}")
print([n if n > 0 else 0 for n in [-1, 5, -3]])

# Guarding against division by zero
total, count = 10, 0
print(total / count if count else 0)

# Don't do this, chaining gets unreadable fast
score = 74
print("A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "F")
`,
      markdownContent: {
        en: `# The Ternary Operator

A one-line \`if/else\` that **produces a value**.

---

## The shape

\`\`\`python
status = "adult" if age >= 18 else "minor"
\`\`\`

Read it as: *this value*, **if** *condition*, **else** *that value*.

The order is unusual, the result comes first, then the test. Most languages put the condition first (\`age >= 18 ? "adult" : "minor"\`). Python chose to read like English.

It replaces this:

\`\`\`python
if age >= 18:
    status = "adult"
else:
    status = "minor"
\`\`\`

Four lines, one variable, one decision. The ternary says the same thing without the ceremony.

---

## It's an expression

That's the real distinction. A statement *does* something; an **expression** *evaluates to a value*. \`if\` is a statement, you can't assign it:

\`\`\`python
status = if age >= 18: "adult"   # SyntaxError
\`\`\`

The ternary is an expression, so it goes anywhere a value goes:

\`\`\`python
f"You are an {'adult' if age >= 18 else 'minor'}"   # inside an f-string
[n if n > 0 else 0 for n in nums]                   # inside a comprehension
print(total / count if count else 0)                # as an argument
\`\`\`

That last one is a neat guard: if \`count\` is \`0\` it's falsy, so the division never happens and you dodge \`ZeroDivisionError\`.

The \`else\` is **not optional**. An expression must always produce a value, so there's no one-line \`if\` without it.

---

## When not to

It's for **choosing between two values**. That's it.

Don't chain them:

\`\`\`python
"A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "F"
\`\`\`

That's legal, and nobody wants to read it. The \`elif\` chain is longer and instantly clear, pick that.

Don't use it for side effects either:

\`\`\`python
print("hi") if debug else None   # works; use a plain if
\`\`\`

The rule: if you're picking a value, ternary. If you're deciding what to *do*, \`if\`.

---

## Try It

Run the starter code. The last line is the anti-pattern on purpose, compare it against the elif chain in lesson 1 and notice which one you'd rather debug.
`,
        ar: `# العامل الثلاثي

جملة \`if/else\` في سطر واحد **تنتج قيمة**.

---

## الشكل

\`\`\`python
status = "adult" if age >= 18 else "minor"
\`\`\`

اقرأه هكذا: *هذه القيمة*، **إن** تحقق *الشرط*، **وإلا** *تلك القيمة*.

والترتيب غير مألوف، فالنتيجة تأتي أولا ثم الاختبار. ومعظم اللغات تضع الشرط أولا (\`age >= 18 ? "adult" : "minor"\`). أما بايثون فاختارت أن تقرأ كالإنجليزية.

وهو يحل محل هذا:

\`\`\`python
if age >= 18:
    status = "adult"
else:
    status = "minor"
\`\`\`

أربعة أسطر، ومتغير واحد، وقرار واحد. والعامل الثلاثي يقول الشيء نفسه دون هذه المراسم.

---

## هو تعبير

وهذا هو الفارق الحقيقي. فالجملة (statement) *تفعل* شيئا، أما **التعبير (expression)** *فيقيم إلى قيمة*. وجملة \`if\` جملة، فلا تستطيع إسنادها:

\`\`\`python
status = if age >= 18: "adult"   # SyntaxError
\`\`\`

أما العامل الثلاثي فتعبير، فيصلح في أي موضع تصلح فيه قيمة:

\`\`\`python
f"You are an {'adult' if age >= 18 else 'minor'}"   # inside an f-string
[n if n > 0 else 0 for n in nums]                   # inside a comprehension
print(total / count if count else 0)                # as an argument
\`\`\`

والأخير حارس أنيق: فإن كان \`count\` يساوي \`0\` فهو كاذب، فلا تحدث القسمة أبدا وتتفادى \`ZeroDivisionError\`.

والجزء \`else\` **ليس اختياريا**. فالتعبير يجب أن ينتج قيمة دائما، فلا وجود لـ \`if\` من سطر واحد بدونه.

---

## متى لا تستعمله

هو مخصص لـ **الاختيار بين قيمتين**. لا أكثر.

فلا تسلسله:

\`\`\`python
"A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "F"
\`\`\`

هذا مسموح، ولا أحد يريد قراءته. فسلسلة \`elif\` أطول وواضحة على الفور، اخترها.

ولا تستعمله لأثر جانبي أيضا:

\`\`\`python
print("hi") if debug else None   # works; use a plain if
\`\`\`

والقاعدة: إن كنت تنتقي قيمة فالعامل الثلاثي. وإن كنت تقرر ماذا *تفعل* فـ \`if\`.

---

## جربها

شغل الشيفرة الابتدائية. السطر الأخير نمط سيئ متعمد، قارنه بسلسلة elif في الدرس الأول ولاحظ أيهما تفضل تتبع أخطائه.
`,
      },
    },

    /* ── 4. Membership Operators ── */
    {
      id: 'py-membership',
      slug: 'membership-operators',
      title: { en: 'Membership Operators', ar: 'معاملات العضوية' },
      order: 4,
      type: 'lesson',
      starterCode: `# in works on every container
print("adm" in "admin")
print(22 in [22, 80])
print(22 in (22, 80))
print(22 in {22, 80})

# On a dict, 'in' checks the KEYS
host = {"ip": "10.0.0.5", "port": 8080}
print("ip" in host)
print("10.0.0.5" in host)
print("10.0.0.5" in host.values())

# not in
print("root" not in ["sara", "ali"])

# Replacing a pile of ors
user = "sara"
print(user in ("sara", "ali", "zaid"))

# Substring vs element, a real difference
print("22" in "8022")
print(22 in [8022])
`,
      markdownContent: {
        en: `# Membership Operators

Two: **\`in\`** and **\`not in\`**. Both return a \`bool\`.

You've used \`in\` since Module 3, this is the full picture.

---

## It works on everything

\`\`\`python
"adm" in "admin"     # True, substring
22 in [22, 80]       # True, list element
22 in (22, 80)       # True, tuple element
22 in {22, 80}       # True, set member
\`\`\`

One operator, every container. That consistency is very Python: learn the idea once, apply it everywhere.

## Dictionaries check keys

\`\`\`python
host = {"ip": "10.0.0.5", "port": 8080}
"ip" in host            # True , a key
"10.0.0.5" in host      # False, that's a VALUE
"10.0.0.5" in host.values()   # True
\`\`\`

The default is **keys**, always. If you want values, say \`.values()\`. Worth remembering, because \`"10.0.0.5" in host\` returns \`False\` rather than raising, a silent wrong answer.

## not in

\`\`\`python
"root" not in ["sara", "ali"]   # True
\`\`\`

Prefer it over \`not (x in y)\`. Same result, reads like English.

---

## Where it shines

Collapsing a chain of \`or\`:

\`\`\`python
if user == "sara" or user == "ali" or user == "zaid":   # noisy
if user in ("sara", "ali", "zaid"):                     # better
\`\`\`

Shorter, and adding a name means editing one tuple.

---

## The trap: substring is not element

\`\`\`python
"22" in "8022"    # True! , "22" appears inside "8022"
22 in [8022]      # False , 8022 is not 22
\`\`\`

For strings, \`in\` asks "does this appear **anywhere inside**?" For lists, it asks "is this **one of the items**?"

So checking a port against a string of ports gives nonsense, \`"22" in "8022,443"\` is \`True\` even though port 22 isn't in that list. Keep structured data in a list or set, not in a string.

## A note on speed

\`in\` on a **list** checks items one at a time. On a **set** or **dict** it jumps straight there. For a handful of items it makes no difference; for thousands, checked repeatedly, it's the difference between instant and slow. If your code asks "have I seen this?" a lot, store it in a set.

---

## Try It

Run the starter code. The last two lines are the trap, same question, different answer, because the containers are different.
`,
        ar: `# عوامل الانتماء

اثنان: **\`in\`** و**\`not in\`**. وكلاهما يعيد \`bool\`.

وأنت تستعمل \`in\` منذ الوحدة 3، وهذه هي الصورة الكاملة.

---

## يعمل مع كل شيء

\`\`\`python
"adm" in "admin"     # True, substring
22 in [22, 80]       # True, list element
22 in (22, 80)       # True, tuple element
22 in {22, 80}       # True, set member
\`\`\`

عامل واحد وكل الحاويات. وهذا الاتساق بايثوني جدا: تعلم الفكرة مرة وطبقها في كل مكان.

## القواميس تفحص المفاتيح

\`\`\`python
host = {"ip": "10.0.0.5", "port": 8080}
"ip" in host            # True , a key
"10.0.0.5" in host      # False, that's a VALUE
"10.0.0.5" in host.values()   # True
\`\`\`

فالافتراضي هو **المفاتيح** دائما. وإن أردت القيم فقل \`.values()\`. وهذا جدير بالتذكر، لأن \`"10.0.0.5" in host\` تعيد \`False\` بدل أن ترفع خطأ، أي جوابا خاطئا صامتا.

## not in

\`\`\`python
"root" not in ["sara", "ali"]   # True
\`\`\`

فضلها على \`not (x in y)\`. النتيجة نفسها، والقراءة كالإنجليزية.

---

## أين يتألق

في اختصار سلسلة من \`or\`:

\`\`\`python
if user == "sara" or user == "ali" or user == "zaid":   # noisy
if user in ("sara", "ali", "zaid"):                     # better
\`\`\`

أقصر، وإضافة اسم تعني تعديل صف واحد.

---

## الفخ: النص الجزئي ليس عنصرا

\`\`\`python
"22" in "8022"    # True! , "22" appears inside "8022"
22 in [8022]      # False , 8022 is not 22
\`\`\`

فمع النصوص يسأل \`in\`: "هل يظهر هذا **في أي موضع بالداخل**؟" ومع القوائم يسأل: "هل هذا **أحد العناصر**؟"

لذلك فحص منفذ مقابل نص من المنافذ يعطي هراء، فـ \`"22" in "8022,443"\` تساوي \`True\` مع أن المنفذ 22 ليس في تلك القائمة. احفظ البيانات المهيكلة في قائمة أو مجموعة لا في نص.

## ملاحظة عن السرعة

العامل \`in\` على **قائمة** يفحص العناصر واحدا واحدا. وعلى **مجموعة** أو **قاموس** يقفز إليها مباشرة. ومع حفنة من العناصر لا فرق، أما مع الآلاف المفحوصة مرارا فهو الفرق بين الفوري والبطيء. فإن كانت شيفرتك تسأل كثيرا "هل رأيت هذا؟" فاحفظه في مجموعة.

---

## جربها

شغل الشيفرة الابتدائية. السطران الأخيران هما الفخ، السؤال نفسه وجواب مختلف، لأن الحاويتين مختلفتان.
`,
      },
    },

    /* ── 5. Practical: Access Control ── */
    {
      id: 'py-practical-access',
      slug: 'practical-access-control',
      title: { en: 'Practical: Access Control', ar: 'تطبيق: التحكم في الوصول' },
      order: 5,
      type: 'lesson',
      sampleInput: 'sara\n',
      starterCode: `ADMINS = {"sara", "ali"}
BANNED = {"mallory"}
USERS = {"zaid", "omar"}

user = input("User: ").strip().lower()

# Order matters, most restrictive first
if user in BANNED:
    role, allowed = "banned", False
elif user in ADMINS:
    role, allowed = "admin", True
elif user in USERS:
    role, allowed = "user", True
else:
    role, allowed = "unknown", False

print(f"User: {user}")
print(f"Role: {role}")
print(f"Allowed: {allowed}")
print(f"Can delete: {allowed and role == 'admin'}")
`,
      markdownContent: {
        en: `# Practical: Access Control

A permission check, \`in\`, \`elif\` ordering and booleans doing real work.

---

## Sets for the lists

\`\`\`python
ADMINS = {"sara", "ali"}
BANNED = {"mallory"}
\`\`\`

Sets, not lists, for three reasons: duplicates are meaningless here, \`in\` is fast, and the braces signal "a bag of names" rather than an ordered sequence.

\`UPPER_CASE\` marks them as constants, fixed configuration, not data that changes as the program runs.

## Clean the input first

\`\`\`python
user = input("User: ").strip().lower()
\`\`\`

Never test raw input. \`" Sara "\` should match \`"sara"\`; without this it doesn't, and the failure looks like a permissions bug rather than a whitespace bug.

Note this only works because the sets are stored lowercase too. Normalising one side isn't enough, both sides need the same shape.

## Order encodes the policy

\`\`\`python
if user in BANNED:      ...
elif user in ADMINS:    ...
elif user in USERS:     ...
else:                   ...
\`\`\`

**\`BANNED\` is checked first, and that's a security decision.** If someone is in both \`BANNED\` and \`ADMINS\`, the order decides what happens. Checking admin first would let a banned admin straight through.

The rule: **deny before allow**. When branches overlap, the safest outcome goes first. Bugs in this ordering aren't cosmetic, they're the vulnerability.

The \`else\` matters just as much: an unknown user is denied. Default to "no", and let the rules grant access explicitly.

## Assigning two names at once

\`\`\`python
role, allowed = "admin", True
\`\`\`

Tuple unpacking from Module 5. Both facts about a branch stay on one line, so it's obvious that every branch sets both.

## Combining

\`\`\`python
allowed and role == "admin"
\`\`\`

Deleting needs *both*. Note \`==\` binds tighter than \`and\`, so no parentheses are needed, though they'd do no harm.

---

## Try It

Run it with \`sara\`, then try \`mallory\`, \`omar\`, and something unknown. Then add \`mallory\` to \`ADMINS\` as well and confirm she's still refused, that's the ordering doing its job.
`,
        ar: `# تطبيق عملي: التحكم بالوصول

فحص صلاحيات، حيث يؤدي \`in\` وترتيب \`elif\` والقيم المنطقية عملا حقيقيا.

---

## مجموعات بدل القوائم

\`\`\`python
ADMINS = {"sara", "ali"}
BANNED = {"mallory"}
\`\`\`

مجموعات لا قوائم، لثلاثة أسباب: التكرار بلا معنى هنا، و\`in\` سريع، والأقواس المعقوفة تشير إلى "كيس من الأسماء" لا إلى متتالية مرتبة.

والتسمية بـ \`UPPER_CASE\` تعلمها ثوابت، أي إعدادات ثابتة لا بيانات تتغير أثناء عمل البرنامج.

## نظف المدخل أولا

\`\`\`python
user = input("User: ").strip().lower()
\`\`\`

لا تختبر مدخلا خاما أبدا. فـ \`" Sara "\` ينبغي أن يطابق \`"sara"\`، وبدون هذا لا يطابق، ويبدو الفشل كخلل في الصلاحيات لا كخلل في المسافات.

ولاحظ أن هذا لا يعمل إلا لأن المجموعات مخزنة بأحرف صغيرة أيضا. فتوحيد طرف واحد لا يكفي، بل يحتاج الطرفان إلى الشكل نفسه.

## الترتيب يجسد السياسة

\`\`\`python
if user in BANNED:      ...
elif user in ADMINS:    ...
elif user in USERS:     ...
else:                   ...
\`\`\`

**تفحص \`BANNED\` أولا، وهذا قرار أمني.** فإن كان أحدهم في \`BANNED\` و\`ADMINS\` معا، فالترتيب هو الذي يحدد ما يحدث. وفحص المدير أولا كان سيمرر مديرا محظورا مباشرة.

والقاعدة: **المنع قبل السماح**. فحين تتداخل الفروع تأتي النتيجة الأكثر أمانا أولا. والأخطاء في هذا الترتيب ليست شكلية، بل هي الثغرة نفسها.

والجزء \`else\` لا يقل أهمية: فالمستخدم المجهول يمنع. اجعل الأصل هو "لا"، ودع القواعد تمنح الوصول صراحة.

## إسناد اسمين دفعة واحدة

\`\`\`python
role, allowed = "admin", True
\`\`\`

تفكيك الصفوف من الوحدة 5. فتبقى الحقيقتان المتعلقتان بالفرع في سطر واحد، فيتضح أن كل فرع يضبط كليهما.

## الدمج

\`\`\`python
allowed and role == "admin"
\`\`\`

فالحذف يحتاج *الاثنين*. ولاحظ أن \`==\` أشد ارتباطا من \`and\`، فلا حاجة إلى أقواس، وإن كانت لن تضر.

---

## جربها

شغلها بـ \`sara\`، ثم جرب \`mallory\` و\`omar\` وشيئا مجهولا. ثم أضف \`mallory\` إلى \`ADMINS\` أيضا وتأكد أنها ما زالت مرفوضة، فذاك الترتيب وهو يؤدي عمله.
`,
      },
    },

    /* ── 6. Challenge: Grade Report ── */
    {
      id: 'py-ch-grade-report',
      slug: 'challenge-grade-report',
      title: { en: 'Challenge: Grade Report', ar: 'تحدي: تقرير الدرجة' },
      order: 6,
      type: 'challenge',
      starterCode: `# Read TWO lines:
#   1. a name
#   2. a score (0-100)
#
# For the input in the box (sara / 74), print exactly:
#
#   Name: Sara
#   Score: 74
#   Grade: C
#   Passed: True
#   Status: pass
#
# Rules:
#   - Grade: 90+ A, 80+ B, 70+ C, 60+ D, otherwise F. Use if/elif/else.
#   - Passed is whether the score is 60 or more.
#   - Status is "pass" or "fail", use a ternary operator.
#   - Name is capitalised; strip whitespace from it.
#   - The score arrives as a string.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'A score of 74 grades C and passes',
          input: 'sara\n74\n',
          expectedOutput: 'Name: Sara\nScore: 74\nGrade: C\nPassed: True\nStatus: pass',
        },
        {
          id: 'tc-2',
          description: 'A score of 95 grades A',
          input: 'ali\n95\n',
          expectedOutput: 'Name: Ali\nScore: 95\nGrade: A\nPassed: True\nStatus: pass',
        },
        {
          id: 'tc-3',
          description: 'A score of 42 grades F and fails',
          input: 'omar\n42\n',
          expectedOutput: 'Name: Omar\nScore: 42\nGrade: F\nPassed: False\nStatus: fail',
        },
      ],
      hints: [
        'Read the name, then the score. The score needs int() before you can compare it.',
        'Order the elif chain from highest to lowest: if score >= 90 first, then 80, then 70, then 60, else "F". Checking 60 first would match everything.',
        'Status is a ternary: "pass" if passed else "fail". And passed itself is just score >= 60.',
      ],
      solution: `name = input().strip().capitalize()
score = int(input())

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

passed = score >= 60
status = "pass" if passed else "fail"

print(f"Name: {name}")
print(f"Score: {score}")
print(f"Grade: {grade}")
print(f"Passed: {passed}")
print(f"Status: {status}")
`,
      markdownContent: {
        en: `# Challenge: Grade Report

The module in one program, and this one is checked against **three** different inputs, so it has to be genuinely right rather than right for one case.

---

## Instructions

Read **two** lines:

1. a name
2. a score from 0 to 100

For \`sara\` and \`74\`, print **exactly**:

\`\`\`
Name: Sara
Score: 74
Grade: C
Passed: True
Status: pass
\`\`\`

## Rules

- **Grade**: 90+ → \`A\`, 80+ → \`B\`, 70+ → \`C\`, 60+ → \`D\`, else \`F\`. Use \`if\`/\`elif\`/\`else\`.
- **Passed**: the score is 60 or more.
- **Status**: \`"pass"\` or \`"fail"\`, use a **ternary**.
- **Name**: stripped and capitalised.
- The score arrives as a **string**.

## Watch out

Your elif chain must run **highest to lowest**. Put \`score >= 60\` first and every passing score becomes a \`D\`, and the \`74\` test would still fail loudly, which is the point of testing more than one input.

---

Click **Submit** when ready.
`,
        ar: `# تحد: تقرير الدرجات

الوحدة كلها في برنامج واحد، وهذا يفحص مقابل **ثلاثة** مدخلات مختلفة، فيجب أن يكون صحيحا فعلا لا صحيحا لحالة واحدة.

---

## التعليمات

اقرأ **سطرين**:

1. اسما
2. درجة من 0 إلى 100

ولأجل \`sara\` و\`74\`، اطبع هذا **بالضبط**:

\`\`\`
Name: Sara
Score: 74
Grade: C
Passed: True
Status: pass
\`\`\`

## القواعد

- **Grade**: 90 فأكثر تعطي \`A\`، و80 فأكثر تعطي \`B\`، و70 فأكثر تعطي \`C\`، و60 فأكثر تعطي \`D\`، وإلا \`F\`. استعمل \`if\` و\`elif\` و\`else\`.
- **Passed**: الدرجة 60 أو أكثر.
- **Status**: إما \`"pass"\` أو \`"fail"\`، واستعمل **العامل الثلاثي**.
- **Name**: منظف بـ strip وبحرف أول كبير.
- والدرجة تصل **نصا**.

## انتبه

يجب أن تسير سلسلة elif **من الأعلى إلى الأدنى**. فإن وضعت \`score >= 60\` أولا صارت كل درجة ناجحة \`D\`، وسيفشل اختبار \`74\` بصوت عال، وهذا هو المقصود من الاختبار بأكثر من مدخل واحد.

---

اضغط **Submit** حين تجهز.
`,
      },
    },
  ],
};

export default controlFlow;
