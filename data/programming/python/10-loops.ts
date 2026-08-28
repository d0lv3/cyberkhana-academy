import type { ProgrammingModule } from '../types';

const loops: ProgrammingModule = {
  id: 'py-loops',
  slug: 'loops',
  title: {
    en: 'Loops',
    ar: 'الحلقات',
  },
  description: {
    en: 'Repeating work, while and for, break and continue, nesting, and looping over dictionaries.',
    ar: 'تكرار العمل، while و for، break و continue، التداخل، والمرور على القواميس.',
  },
  order: 10,
  concepts: [
    /* ── 1. While ── */
    {
      id: 'py-while',
      slug: 'while-loop',
      title: { en: 'The while Loop', ar: 'حلقة while' },
      order: 1,
      type: 'lesson',
      starterCode: `count = 3
while count > 0:
    print("tick", count)
    count -= 1        # without this, it never ends
print("liftoff")

print("---")

# while/else, else runs if the loop was NEVER broken out of
n = 0
while n < 3:
    print("n =", n)
    n += 1
else:
    print("finished normally")

print("---")

# Broken out of -> the else is SKIPPED
n = 0
while n < 3:
    if n == 1:
        break
    n += 1
else:
    print("you will not see this")
print("done")
`,
      markdownContent: {
        en: `# The while Loop

\`while\` repeats a block **for as long as a condition stays true**.

\`\`\`python
count = 3
while count > 0:
    print("tick", count)
    count -= 1
\`\`\`

Same shape as \`if\`, keyword, condition, colon, indented block. The difference is that \`if\` runs the block **once**; \`while\` runs it **again and again**, re-checking the condition each time.

If the condition is false at the start, the body never runs at all.

---

## Something must change

\`count -= 1\` isn't decoration, it's the whole loop. Delete it and \`count > 0\` is true forever:

\`\`\`python
count = 3
while count > 0:
    print("tick")   # infinite loop
\`\`\`

Every \`while\` needs three things, and forgetting any one is a bug:

1. something **initialised** before the loop (\`count = 3\`)
2. a condition that can **become false**
3. something **inside** that moves toward it (\`count -= 1\`)

In this editor an infinite loop hits the 10-second timeout and stops. In a terminal you'd press Ctrl+C.

---

## while/else

Python gives loops an \`else\`, which almost no other language has:

\`\`\`python
while n < 3:
    ...
else:
    print("finished normally")
\`\`\`

The \`else\` runs when the loop ends **because its condition went false**, and is **skipped if you \`break\` out**.

The name is genuinely misleading. Read it as **"no break"**, not "otherwise". It means: *the loop ran to completion without being interrupted.*

That makes it useful for searching, "I looked at everything and never found it":

\`\`\`python
while attempts < 3:
    if guess_correct():
        break
    attempts += 1
else:
    print("locked out")   # only if we never broke out
\`\`\`

Without \`else\` you'd need a \`found = False\` flag. It's a nice tool, used rarely, many Python developers never write one, and that's fine.

---

## while vs for

Use **\`while\`** when you don't know how many rounds you need: waiting for valid input, retrying, running until a condition changes.

Use **\`for\`** when you're walking a known collection. That's the next lesson, and it's what you'll reach for most.

---

## Try It

Run the starter code. The third block \`break\`s, so its \`else\` never prints, that's the "no break" rule.
`,
        ar: `# حلقة while

تكرر \`while\` كتلة **ما دام شرط ما صادقا**.

\`\`\`python
count = 3
while count > 0:
    print("tick", count)
    count -= 1
\`\`\`

الشكل نفسه الذي في \`if\`: كلمة مفتاحية، فشرط، فنقطتان، فكتلة مزاحة. والفرق أن \`if\` تنفذ الكتلة **مرة واحدة**، بينما \`while\` تنفذها **مرة بعد مرة**، وتعيد فحص الشرط في كل دورة.

وإن كان الشرط كاذبا من البداية فلن ينفذ الجسم أبدا.

---

## لا بد أن يتغير شيء

السطر \`count -= 1\` ليس زينة، بل هو الحلقة كلها. احذفه فيبقى \`count > 0\` صادقا إلى الأبد:

\`\`\`python
count = 3
while count > 0:
    print("tick")   # infinite loop
\`\`\`

وكل حلقة \`while\` تحتاج ثلاثة أشياء، ونسيان أي منها خلل:

1. شيء **يهيأ** قبل الحلقة (\`count = 3\`)
2. شرط **يمكن أن يصير كاذبا**
3. شيء **بالداخل** يتحرك نحو ذلك (\`count -= 1\`)

وفي هذا المحرر تصطدم الحلقة اللانهائية بمهلة العشر ثوان فتتوقف. أما في الطرفية فكنت ستضغط Ctrl+C.

---

## while/else

تمنح بايثون الحلقات جملة \`else\`، وهو ما لا تكاد تجده في لغة أخرى:

\`\`\`python
while n < 3:
    ...
else:
    print("finished normally")
\`\`\`

تنفذ \`else\` حين تنتهي الحلقة **لأن شرطها صار كاذبا**، و**تتخطى إن خرجت بـ \`break\`**.

والاسم مضلل فعلا. اقرأه بمعنى **"بلا break"** لا بمعنى "وإلا". أي: *مضت الحلقة إلى نهايتها دون أن تقاطع.*

وهذا يجعله مفيدا في البحث، بمعنى "نظرت في كل شيء ولم أجده قط":

\`\`\`python
while attempts < 3:
    if guess_correct():
        break
    attempts += 1
else:
    print("locked out")   # only if we never broke out
\`\`\`

وبدون \`else\` كنت ستحتاج راية \`found = False\`. وهي أداة لطيفة قليلة الاستعمال، وكثير من مطوري بايثون لا يكتبونها أبدا، ولا بأس بذلك.

---

## while مقابل for

استعمل **\`while\`** حين لا تعرف كم دورة تحتاج: كانتظار مدخل صالح، أو إعادة المحاولة، أو العمل حتى يتغير شرط.

واستعمل **\`for\`** حين تمشي على حاوية معروفة. وهذا هو الدرس التالي، وهو ما ستلجأ إليه أكثر.

---

## جربها

شغل الشيفرة الابتدائية. الكتلة الثالثة تستعمل \`break\`، فلا تطبع \`else\` الخاصة بها أبدا، وتلك هي قاعدة "بلا break".
`,
      },
    },

    /* ── 2. While in Practice ── */
    {
      id: 'py-while-practice',
      slug: 'while-practice',
      title: { en: 'while in Practice', ar: 'while عمليا' },
      order: 2,
      type: 'lesson',
      sampleInput: 'abc\n-5\n21\n',
      starterCode: `# Pattern 1: keep asking until the input is valid
age = None
while age is None:
    raw = input("Age: ").strip()
    if raw.isdigit():
        age = int(raw)
    else:
        print("  not a whole number, try again")
print("Got:", age)

print("---")

# Pattern 2: a limited number of attempts
SECRET = "khana"
attempts = 0
while attempts < 3:
    attempts += 1
    if SECRET == "khana" and attempts == 2:
        print("unlocked on attempt", attempts)
        break
else:
    print("locked out")

print("---")

# Pattern 3: accumulate until a total is reached
total, n = 0, 0
while total < 20:
    n += 1
    total += n
print(f"summed 1..{n} = {total}")
`,
      markdownContent: {
        en: `# while in Practice

Three patterns you'll write for real.

---

## 1. Ask until valid

The reason \`while\` exists: you don't know how many attempts a user needs.

\`\`\`python
age = None
while age is None:
    raw = input("Age: ").strip()
    if raw.isdigit():
        age = int(raw)
    else:
        print("  not a whole number, try again")
\`\`\`

\`age\` starts as \`None\`, the "no answer yet" value from Module 7. The loop's exit condition and its result are the same variable, so there's no separate flag.

Note \`is None\`, not \`== None\`, and it matters here beyond style. If the user enters \`0\`, then \`while not age\` would keep looping forever, because \`0\` is falsy. \`is None\` asks the exact question: *do we have an answer yet?*

This is the shape of every input-validation loop: assume nothing, keep asking, only accept what you've checked.

## 2. Limited attempts

\`\`\`python
attempts = 0
while attempts < 3:
    attempts += 1
    if correct:
        break
else:
    print("locked out")
\`\`\`

The counter guarantees an exit, and \`while/else\` handles "we used every attempt and never succeeded" without a flag.

Increment **first**, before the check, so an early \`break\` still leaves \`attempts\` accurate.

## 3. Accumulate until a threshold

\`\`\`python
total, n = 0, 0
while total < 20:
    n += 1
    total += n
\`\`\`

You don't know how many rounds it takes, the loop finds out. This is exactly what \`for\` can't do: with \`for\` you must know the range up front.

---

## The mistakes to know

**Forgetting to advance** → infinite loop. Every \`while\` body must move toward the exit.

**Checking a stale value.** The condition is tested at the **top**, so a change halfway through the body isn't noticed until the next round. The rest of the body still runs.

**Off-by-one.** \`while attempts < 3\` gives attempts 1, 2, 3, three of them. \`<= 3\` would give four. Count them out when it matters.

---

## Try It

Run it: the Input box has \`abc\`, then \`-5\`, then \`21\`. The first two are rejected, \`-5\` because \`isdigit()\` is \`False\` for a minus sign, exactly as Module 3 warned, and \`21\` is accepted.
`,
        ar: `# while في الممارسة

ثلاثة أنماط ستكتبها فعلا.

---

## 1. اسأل حتى يصح

هذا هو سبب وجود \`while\`: فأنت لا تعرف كم محاولة يحتاج المستخدم.

\`\`\`python
age = None
while age is None:
    raw = input("Age: ").strip()
    if raw.isdigit():
        age = int(raw)
    else:
        print("  not a whole number, try again")
\`\`\`

يبدأ \`age\` بـ \`None\`، وهي قيمة "لا جواب بعد" من الوحدة 7. فشرط خروج الحلقة ونتيجتها هما المتغير نفسه، فلا حاجة إلى راية منفصلة.

ولاحظ \`is None\` لا \`== None\`، والأمر هنا يتجاوز الأسلوب. فلو أدخل المستخدم \`0\` لظلت \`while not age\` تدور إلى الأبد، لأن \`0\` كاذبة. أما \`is None\` فتطرح السؤال بدقة: *هل صار لدينا جواب؟*

وهذا هو شكل كل حلقة تحقق من المدخلات: لا تفترض شيئا، واستمر في السؤال، ولا تقبل إلا ما فحصته.

## 2. محاولات محدودة

\`\`\`python
attempts = 0
while attempts < 3:
    attempts += 1
    if correct:
        break
else:
    print("locked out")
\`\`\`

العداد يضمن الخروج، و\`while/else\` تتكفل بحالة "استنفدنا كل محاولة ولم ننجح" دون راية.

وزد العداد **أولا** قبل الفحص، فيبقى \`attempts\` دقيقا حتى مع خروج مبكر بـ \`break\`.

## 3. راكم حتى عتبة

\`\`\`python
total, n = 0, 0
while total < 20:
    n += 1
    total += n
\`\`\`

أنت لا تعرف كم دورة يستغرق الأمر، والحلقة هي التي تكتشف ذلك. وهذا بالضبط ما لا تستطيع \`for\` فعله: فمعها يجب أن تعرف المدى مسبقا.

---

## الأخطاء التي ينبغي معرفتها

**نسيان التقدم** يعطي حلقة لانهائية. فكل جسم \`while\` يجب أن يتحرك نحو الخروج.

**فحص قيمة قديمة.** فالشرط يختبر في **الأعلى**، فالتغيير في منتصف الجسم لا يلاحظ حتى الدورة التالية. وبقية الجسم تنفذ رغم ذلك.

**الانحراف بواحد.** فـ \`while attempts < 3\` تعطي المحاولات 1 و2 و3، أي ثلاثا. و\`<= 3\` كانت ستعطي أربعا. فعدها بنفسك حين يكون الأمر مهما.

---

## جربها

شغلها: صندوق Input يحمل \`abc\` ثم \`-5\` ثم \`21\`. فالأولان يرفضان، و\`-5\` يرفض لأن \`isdigit()\` تساوي \`False\` مع الإشارة السالبة، تماما كما حذرت الوحدة 3، و\`21\` يقبل.
`,
      },
    },

    /* ── 3. For ── */
    {
      id: 'py-for',
      slug: 'for-loop',
      title: { en: 'The for Loop', ar: 'حلقة for' },
      order: 3,
      type: 'lesson',
      starterCode: `for tool in ["nmap", "burp"]:
    print(tool)

# Strings are sequences too
for ch in "abc":
    print(ch, end=" ")
print()

# range(stop) / range(start, stop) / range(start, stop, step)
for i in range(3):
    print(i, end=" ")
print()
print(list(range(2, 8, 2)))

# enumerate when you need the index as well
for i, tool in enumerate(["nmap", "burp"], start=1):
    print(i, tool)

# zip walks two sequences together
for name, port in zip(["ssh", "http"], [22, 80]):
    print(f"{name} -> {port}")

# for/else, the same "no break" rule
for n in [1, 2, 3]:
    if n == 99:
        break
else:
    print("99 not found")
`,
      markdownContent: {
        en: `# The for Loop

\`for\` walks through a collection, one item at a time.

\`\`\`python
for tool in ["nmap", "burp"]:
    print(tool)
\`\`\`

Read it as English: *for each tool in this list, print it.* The variable \`tool\` is created by the loop and holds each item in turn.

No counter, no index, no length. Compare with the \`while\` version:

\`\`\`python
i = 0
while i < len(tools):
    print(tools[i])
    i += 1
\`\`\`

Three places to get wrong, versus none. **If you're walking a collection, use \`for\`.**

It works on anything iterable, lists, tuples, sets, strings, dicts, files:

\`\`\`python
for ch in "abc":
    print(ch)
\`\`\`

---

## range()

For "do this N times", when there's no collection to walk:

\`\`\`python
range(3)         # 0, 1, 2
range(2, 5)      # 2, 3, 4
range(2, 8, 2)   # 2, 4, 6
\`\`\`

The **stop is excluded**, exactly like slicing. \`range(3)\` gives three numbers starting at 0, which lines up with indexes being 0-based.

\`range\` doesn't build a list; it generates numbers as needed. So \`range(1000000)\` costs nothing until you loop it. \`print(range(3))\` shows \`range(0, 3)\` rather than the numbers, wrap it in \`list()\` to see them.

## enumerate()

When you need the position **and** the item:

\`\`\`python
for i, tool in enumerate(tools, start=1):
    print(i, tool)
\`\`\`

Better than \`range(len(tools))\` and indexing back in. \`start=1\` is for humans who count from one.

Each round hands back an \`(index, item)\` tuple, unpacked into \`i, tool\`, tuple unpacking again.

## zip()

Walks two collections in step:

\`\`\`python
for name, port in zip(["ssh", "http"], [22, 80]):
    print(f"{name} -> {port}")
\`\`\`

It stops at the **shorter** one, silently. That's usually what you want, and occasionally hides a bug, pass \`strict=True\` (3.10+) to raise on a length mismatch.

## for/else

Same "no break" rule as \`while\`:

\`\`\`python
for n in items:
    if n == target:
        break
else:
    print("not found")
\`\`\`

The classic search-and-report-failure, with no flag variable.

---

## Try It

Run the starter code. \`print(x, end=" ")\` replaces the newline with a space, handy for printing a loop's results on one line.
`,
        ar: `# حلقة for

تمشي \`for\` على حاوية، عنصرا في كل مرة.

\`\`\`python
for tool in ["nmap", "burp"]:
    print(tool)
\`\`\`

اقرأها كالإنجليزية: *لكل أداة في هذه القائمة، اطبعها.* والمتغير \`tool\` تنشئه الحلقة ويحمل كل عنصر بدوره.

لا عداد، ولا فهرس، ولا طول. قارن ذلك بنسخة \`while\`:

\`\`\`python
i = 0
while i < len(tools):
    print(tools[i])
    i += 1
\`\`\`

ثلاثة مواضع للخطأ مقابل لا شيء. **فإن كنت تمشي على حاوية فاستعمل \`for\`.**

وهي تعمل على كل ما هو قابل للتكرار، من قوائم وصفوف ومجموعات ونصوص وقواميس وملفات:

\`\`\`python
for ch in "abc":
    print(ch)
\`\`\`

---

## range()

للحالة "افعل هذا N مرة" حين لا توجد حاوية تمشي عليها:

\`\`\`python
range(3)         # 0, 1, 2
range(2, 5)      # 2, 3, 4
range(2, 8, 2)   # 2, 4, 6
\`\`\`

و**نقطة التوقف مستثناة**، تماما كالتقطيع. فـ \`range(3)\` تعطي ثلاثة أعداد تبدأ من 0، وهذا يتوافق مع بدء الفهارس من الصفر.

ولا تبني \`range\` قائمة، بل تولد الأعداد عند الحاجة. فـ \`range(1000000)\` لا تكلف شيئا حتى تمر عليها. وطباعة \`print(range(3))\` تظهر \`range(0, 3)\` لا الأعداد، فغلفها بـ \`list()\` لرؤيتها.

## enumerate()

حين تحتاج الموضع **والعنصر** معا:

\`\`\`python
for i, tool in enumerate(tools, start=1):
    print(i, tool)
\`\`\`

وهي أفضل من \`range(len(tools))\` ثم الفهرسة رجوعا. والوسيط \`start=1\` للبشر الذين يعدون من واحد.

وتسلمك كل دورة صفا من \`(index, item)\` يفكك إلى \`i, tool\`، أي تفكيك الصفوف من جديد.

## zip()

تمشي على حاويتين معا:

\`\`\`python
for name, port in zip(["ssh", "http"], [22, 80]):
    print(f"{name} -> {port}")
\`\`\`

وتتوقف عند **الأقصر** بصمت. وهذا هو المطلوب عادة، وقد يخفي خللا أحيانا، فمرر \`strict=True\` (منذ 3.10) لترفع خطأ عند اختلاف الطول.

## for/else

القاعدة نفسها "بلا break" كما في \`while\`:

\`\`\`python
for n in items:
    if n == target:
        break
else:
    print("not found")
\`\`\`

وهو البحث الكلاسيكي مع الإبلاغ عن الفشل، بلا متغير راية.

---

## جربها

شغل الشيفرة الابتدائية. والتعبير \`print(x, end=" ")\` يستبدل السطر الجديد بمسافة، وهو مفيد لطباعة نتائج حلقة في سطر واحد.
`,
      },
    },

    /* ── 4. Break, Continue, Pass ── */
    {
      id: 'py-break-continue',
      slug: 'break-continue-pass',
      title: { en: 'break, continue, pass', ar: 'break و continue و pass' },
      order: 4,
      type: 'lesson',
      starterCode: `# break, leave the loop entirely
for n in [1, 2, 3, 4, 5]:
    if n == 3:
        break
    print("break demo:", n)

# continue, skip the rest of THIS round only
for n in [1, 2, 3, 4, 5]:
    if n % 2 == 0:
        continue
    print("continue demo:", n)

# pass, do nothing; a placeholder to keep the syntax valid
for n in [1, 2]:
    pass

if True:
    pass    # "handle this later"

# break only leaves the INNERMOST loop
for i in range(2):
    for j in range(5):
        if j == 1:
            break
        print(f"i={i} j={j}")
`,
      markdownContent: {
        en: `# break, continue, pass

Three keywords, often confused.

---

## break, get out

Leaves the loop **immediately**. Nothing else in the body runs, and no further rounds happen:

\`\`\`python
for n in [1, 2, 3, 4, 5]:
    if n == 3:
        break
    print(n)      # 1, 2
\`\`\`

Its job is "I found what I came for" or "something's wrong, stop." Remember it also **skips the loop's \`else\`**.

## continue, skip this one

Jumps straight to the **next round**. The rest of the body is skipped; the loop itself keeps going:

\`\`\`python
for n in [1, 2, 3, 4, 5]:
    if n % 2 == 0:
        continue
    print(n)      # 1, 3, 5
\`\`\`

Its job is "not interested in this item." It's a filter, and it saves you a level of indentation:

\`\`\`python
for line in lines:
    if not line.strip():
        continue          # skip blanks
    if line.startswith("#"):
        continue          # skip comments
    process(line)         # the real work, unindented
\`\`\`

That's the guard-clause idea from Module 9, applied to loops: reject early, keep the real work flat.

## pass, do nothing

Not a loop keyword at all. It's a **placeholder** where Python's grammar demands a block but you have nothing to put there:

\`\`\`python
if True:
    pass    # TODO
\`\`\`

Without it that's an \`IndentationError\`, Python has no \`{}\` to leave empty. \`pass\` lets you sketch structure now and fill it in later.

**\`pass\` is not \`continue\`.** \`pass\` does nothing and execution carries on to the next line in the body. \`continue\` jumps to the next round. In a loop they look similar and behave differently:

\`\`\`python
for n in [1, 2]:
    pass
    print(n)      # prints 1, 2, pass did nothing

for n in [1, 2]:
    continue
    print(n)      # prints NOTHING, continue skipped it
\`\`\`

---

## break only leaves one level

In nested loops, \`break\` exits the **innermost** loop only:

\`\`\`python
for i in range(2):
    for j in range(5):
        if j == 1:
            break      # leaves the j loop; the i loop continues
\`\`\`

There's no "break out of both" in Python. To do that, put the loops in a function and \`return\`, or use a flag. Wanting it is usually a sign the loops belong in their own function.

---

## Try It

Run the starter code and compare the first two blocks: \`break\` stops at 1, 2, \`continue\` prints 1, 3, 5.
`,
        ar: `# break و continue و pass

ثلاث كلمات مفتاحية كثيرا ما يخلط بينها.

---

## break، اخرج

تغادر الحلقة **فورا**. فلا ينفذ شيء آخر من الجسم، ولا تحدث دورات أخرى:

\`\`\`python
for n in [1, 2, 3, 4, 5]:
    if n == 3:
        break
    print(n)      # 1, 2
\`\`\`

ومهمتها "وجدت ما جئت من أجله" أو "هناك خطب ما، توقف". وتذكر أنها **تتخطى \`else\` الخاصة بالحلقة** أيضا.

## continue، تخط هذا

تقفز مباشرة إلى **الدورة التالية**. فتتخطى بقية الجسم، وتستمر الحلقة نفسها:

\`\`\`python
for n in [1, 2, 3, 4, 5]:
    if n % 2 == 0:
        continue
    print(n)      # 1, 3, 5
\`\`\`

ومهمتها "لا يعنيني هذا العنصر". وهي مرشح، وتوفر عليك مستوى إزاحة:

\`\`\`python
for line in lines:
    if not line.strip():
        continue          # skip blanks
    if line.startswith("#"):
        continue          # skip comments
    process(line)         # the real work, unindented
\`\`\`

وهذه فكرة الجمل الحارسة من الوحدة 9 مطبقة على الحلقات: ارفض مبكرا وأبق العمل الحقيقي مسطحا.

## pass، لا تفعل شيئا

وهي ليست كلمة حلقات أصلا. بل هي **حشوة** حيث تطالب قواعد بايثون بكتلة وليس لديك ما تضعه فيها:

\`\`\`python
if True:
    pass    # TODO
\`\`\`

وبدونها يكون ذلك \`IndentationError\`، فبايثون لا تملك \`{}\` تتركها فارغة. وتتيح لك \`pass\` أن ترسم البنية الآن وتملأها لاحقا.

**و\`pass\` ليست \`continue\`.** فـ \`pass\` لا تفعل شيئا ويمضي التنفيذ إلى السطر التالي في الجسم. أما \`continue\` فتقفز إلى الدورة التالية. وهما داخل الحلقة تبدوان متشابهتين وتسلكان سلوكا مختلفا:

\`\`\`python
for n in [1, 2]:
    pass
    print(n)      # prints 1, 2, pass did nothing

for n in [1, 2]:
    continue
    print(n)      # prints NOTHING, continue skipped it
\`\`\`

---

## break تغادر مستوى واحدا فقط

في الحلقات المتداخلة، تخرج \`break\` من الحلقة **الأعمق** فقط:

\`\`\`python
for i in range(2):
    for j in range(5):
        if j == 1:
            break      # leaves the j loop; the i loop continues
\`\`\`

ولا وجود لـ "اخرج من الاثنتين" في بايثون. ولفعل ذلك، ضع الحلقتين في دالة واستعمل \`return\`، أو استعمل راية. والرغبة في ذلك عادة إشارة إلى أن الحلقتين تنتميان إلى دالة خاصة بهما.

---

## جربها

شغل الشيفرة الابتدائية وقارن الكتلتين الأوليين: \`break\` تتوقف عند 1 و2، و\`continue\` تطبع 1 و3 و5.
`,
      },
    },

    /* ── 5. Nested Loops ── */
    {
      id: 'py-nested-loops',
      slug: 'nested-loops',
      title: { en: 'Nested Loops', ar: 'الحلقات المتداخلة' },
      order: 5,
      type: 'lesson',
      starterCode: `# The inner loop runs FULLY for each outer round
for host in ["10.0.0.5", "10.0.0.6"]:
    for port in [22, 80]:
        print(f"{host}:{port}")

print("---")

# A grid
for row in range(1, 4):
    for col in range(1, 4):
        print(f"{row * col:3}", end="")
    print()

print("---")

# Walking nested data
scan = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
for host, ports in scan.items():
    print(host)
    for port in ports:
        print("  -", port)
`,
      markdownContent: {
        en: `# Nested Loops

A loop inside a loop. The **inner loop runs completely for every single round of the outer one**.

\`\`\`python
for host in ["10.0.0.5", "10.0.0.6"]:
    for port in [22, 80]:
        print(f"{host}:{port}")
\`\`\`

Four lines of output: two hosts × two ports. The inner loop restarts from the beginning each time the outer one advances.

That multiplication is the thing to keep in mind. Two lists of 1,000 items each is **a million** rounds. Nested loops are where slow programs come from, and where a bad idea becomes an expensive one.

---

## Building a grid

\`\`\`python
for row in range(1, 4):
    for col in range(1, 4):
        print(f"{row * col:3}", end="")
    print()
\`\`\`

Note where the bare \`print()\` sits: indented to the **outer** loop, so it runs once per row and ends the line. Move it in one level and every number gets its own line. Indentation is the logic.

\`{row * col:3}\` pads each number to width 3, so the columns line up, the format spec from Module 3.

## Walking nested data

The common real use: a dict whose values are lists.

\`\`\`python
scan = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
for host, ports in scan.items():
    print(host)
    for port in ports:
        print("  -", port)
\`\`\`

\`.items()\` gives \`(key, value)\` pairs, unpacked into \`host, ports\`. \`ports\` is a list, so the inner loop walks it. The structure of the loops mirrors the structure of the data, that's how you should read them.

## Before you nest

Nesting is often the wrong tool. If you're comparing two collections:

\`\`\`python
for a in list_a:            # slow: len(a) x len(b) checks
    for b in list_b:
        if a == b: ...

set(list_a) & set(list_b)   # fast, and one line
\`\`\`

Module 6 already gave you the better answer. Ask what you're really doing before writing the second \`for\`.

---

## Try It

Run the starter code. Then move the bare \`print()\` in the grid block one level deeper and watch the layout collapse, that's indentation carrying the meaning.
`,
        ar: `# الحلقات المتداخلة

حلقة داخل حلقة. و**الحلقة الداخلية تدور كاملة في كل دورة واحدة من الخارجية**.

\`\`\`python
for host in ["10.0.0.5", "10.0.0.6"]:
    for port in [22, 80]:
        print(f"{host}:{port}")
\`\`\`

أربعة أسطر من المخرجات: مضيفان في منفذين. فالحلقة الداخلية تبدأ من أولها في كل مرة تتقدم فيها الخارجية.

وذلك الضرب هو ما ينبغي أن تبقيه في ذهنك. فقائمتان فيهما 1000 عنصر لكل واحدة تعنيان **مليون** دورة. والحلقات المتداخلة هي منبع البرامج البطيئة، وهي حيث تصير الفكرة السيئة فكرة مكلفة.

---

## بناء شبكة

\`\`\`python
for row in range(1, 4):
    for col in range(1, 4):
        print(f"{row * col:3}", end="")
    print()
\`\`\`

ولاحظ أين تقع \`print()\` المجردة: مزاحة إلى الحلقة **الخارجية**، فتنفذ مرة لكل صف وتنهي السطر. وانقلها مستوى واحدا إلى الداخل فيحصل كل عدد على سطره الخاص. فالإزاحة هي المنطق.

والتعبير \`{row * col:3}\` يحشو كل عدد إلى عرض 3 فتتحاذى الأعمدة، وهي مواصفة التنسيق من الوحدة 3.

## المشي على بيانات متداخلة

الاستعمال الحقيقي الشائع: قاموس قيمه قوائم.

\`\`\`python
scan = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
for host, ports in scan.items():
    print(host)
    for port in ports:
        print("  -", port)
\`\`\`

فـ \`.items()\` تعطي أزواج \`(key, value)\` تفكك إلى \`host, ports\`. والمتغير \`ports\` قائمة، فتمشي عليها الحلقة الداخلية. وبنية الحلقات تعكس بنية البيانات، وهكذا ينبغي أن تقرأها.

## قبل أن تعشش

التعشيش كثيرا ما يكون الأداة الخاطئة. فإن كنت تقارن حاويتين:

\`\`\`python
for a in list_a:            # slow: len(a) x len(b) checks
    for b in list_b:
        if a == b: ...

set(list_a) & set(list_b)   # fast, and one line
\`\`\`

فقد أعطتك الوحدة 6 الجواب الأفضل أصلا. اسأل نفسك ما الذي تفعله حقا قبل أن تكتب \`for\` الثانية.

---

## جربها

شغل الشيفرة الابتدائية. ثم انقل \`print()\` المجردة في كتلة الشبكة مستوى واحدا إلى العمق وراقب انهيار التخطيط، فتلك الإزاحة وهي تحمل المعنى.
`,
      },
    },

    /* ── 6. Looping Over Dictionaries ── */
    {
      id: 'py-loops-dicts',
      slug: 'loops-over-dicts',
      title: { en: 'Looping Over Dictionaries', ar: 'المرور على القواميس' },
      order: 6,
      type: 'lesson',
      starterCode: `host = {"ip": "10.0.0.5", "port": 8080, "up": True}

# Looping a dict directly gives its KEYS
for key in host:
    print(key, end=" ")
print()

for key, value in host.items():
    print(f"{key} = {value}")

for value in host.values():
    print(value, end=" ")
print()

# Building a dict with a loop
scan = [443, 22, 443, 80, 22, 22]
counts = {}
for port in scan:
    counts[port] = counts.get(port, 0) + 1
print(counts)

# Never resize a dict while looping it, loop a copy of the keys
for key in list(counts.keys()):
    if counts[key] < 2:
        del counts[key]
print(counts)
`,
      markdownContent: {
        en: `# Looping Over Dictionaries

---

## The three ways

Looping a dict **directly gives its keys**:

\`\`\`python
for key in host:        # ip, port, up
\`\`\`

Same as \`for key in host.keys()\`, the shorter form is idiomatic. Consistent with \`in\`, which also checks keys.

For both parts, use \`.items()\`:

\`\`\`python
for key, value in host.items():
    print(f"{key} = {value}")
\`\`\`

This is the one you'll write most. Each round yields a \`(key, value)\` tuple, unpacked into two names.

And for values alone:

\`\`\`python
for value in host.values():
\`\`\`

Since 3.7 all three follow **insertion order**.

---

## Counting with a dict

The pattern worth memorising:

\`\`\`python
counts = {}
for port in scan:
    counts[port] = counts.get(port, 0) + 1
\`\`\`

\`.get(port, 0)\` is what makes it work. The first time a port appears it isn't a key yet, so \`counts[port]\` would raise \`KeyError\`, \`.get\` returns \`0\` instead, and \`0 + 1\` starts the count.

The clumsy version:

\`\`\`python
if port in counts:
    counts[port] += 1
else:
    counts[port] = 1
\`\`\`

Same result, four lines. \`.get(key, default)\` collapses it to one. (The standard library has \`collections.Counter\` for exactly this, Module 13.)

---

## Never resize while looping

The rule that bites:

\`\`\`python
for key in counts:
    if counts[key] < 2:
        del counts[key]     # RuntimeError: dictionary changed size during iteration
\`\`\`

The loop walks a **live view** (Module 6). Removing a key while it's being walked pulls the floor out. Python detects it and raises rather than silently skipping items.

The fix is to loop a **snapshot**:

\`\`\`python
for key in list(counts.keys()):
    if counts[key] < 2:
        del counts[key]
\`\`\`

\`list()\` copies the keys, so the loop reads the copy while you edit the original.

The same applies to lists, removing from a list you're looping makes items get skipped, and there it happens **silently**, which is worse. Loop a copy, or build a new list of what you want to keep.

---

## Try It

Run the starter code. Then remove the \`list()\` from the last loop and read the \`RuntimeError\`, Python protecting you from yourself.
`,
        ar: `# المرور على القواميس

---

## الطرق الثلاث

المرور على القاموس **مباشرة يعطي مفاتيحه**:

\`\`\`python
for key in host:        # ip, port, up
\`\`\`

وهي مطابقة لـ \`for key in host.keys()\`، والصيغة الأقصر هي المتعارف عليها. وهي متسقة مع \`in\` التي تفحص المفاتيح أيضا.

وللجزأين معا استعمل \`.items()\`:

\`\`\`python
for key, value in host.items():
    print(f"{key} = {value}")
\`\`\`

وهذه ما ستكتبه أكثر من غيرها. فكل دورة تنتج صفا من \`(key, value)\` يفكك إلى اسمين.

وللقيم وحدها:

\`\`\`python
for value in host.values():
\`\`\`

ومنذ الإصدار 3.7 تتبع الثلاث كلها **ترتيب الإدراج**.

---

## العد بقاموس

النمط الجدير بالحفظ:

\`\`\`python
counts = {}
for port in scan:
    counts[port] = counts.get(port, 0) + 1
\`\`\`

والتعبير \`.get(port, 0)\` هو ما يجعله يعمل. ففي أول ظهور للمنفذ لا يكون مفتاحا بعد، فكانت \`counts[port]\` سترفع \`KeyError\`، لكن \`.get\` تعيد \`0\` بدلا من ذلك، فيبدأ العد بـ \`0 + 1\`.

والنسخة الثقيلة:

\`\`\`python
if port in counts:
    counts[port] += 1
else:
    counts[port] = 1
\`\`\`

النتيجة نفسها في أربعة أسطر. و\`.get(key, default)\` تختصرها إلى سطر واحد. (وفي المكتبة القياسية \`collections.Counter\` لهذا الغرض بالذات، وهي في الوحدة 13.)

---

## لا تغير الحجم أثناء المرور أبدا

القاعدة التي تلدغ:

\`\`\`python
for key in counts:
    if counts[key] < 2:
        del counts[key]     # RuntimeError: dictionary changed size during iteration
\`\`\`

فالحلقة تمشي على **منظر حي** (الوحدة 6). وحذف مفتاح أثناء المشي عليه يسحب الأرض من تحتها. وتكشف بايثون ذلك فترفع خطأ بدل أن تتخطى عناصر بصمت.

والحل هو المرور على **لقطة ثابتة**:

\`\`\`python
for key in list(counts.keys()):
    if counts[key] < 2:
        del counts[key]
\`\`\`

فـ \`list()\` تنسخ المفاتيح، فتقرأ الحلقة النسخة بينما تعدل أنت الأصل.

والأمر نفسه ينطبق على القوائم، فالحذف من قائمة تمر عليها يجعل عناصر تتخطى، وهو يحدث هناك **بصمت** وهذا أسوأ. مر على نسخة، أو ابن قائمة جديدة بما تريد الاحتفاظ به.

---

## جربها

شغل الشيفرة الابتدائية. ثم احذف \`list()\` من الحلقة الأخيرة واقرأ \`RuntimeError\`، فتلك بايثون تحميك من نفسك.
`,
      },
    },

    /* ── 7. Challenge: Log Summary ── */
    {
      id: 'py-ch-log-summary',
      slug: 'challenge-log-summary',
      title: { en: 'Challenge: Log Summary', ar: 'تحدي: ملخص السجل' },
      order: 7,
      type: 'challenge',
      starterCode: `lines = [
    "GET /home 200",
    "",
    "# a comment",
    "POST /login 401",
    "GET /admin 403",
    "GET /home 200",
    "POST /login 200",
]

# Summarise the log and print exactly:
#
#   Processed: 5
#   GET: 3
#   POST: 2
#   Errors: 2
#   Top path: /home (2)
#
# Rules:
#   - Skip blank lines and lines starting with "#". Use continue.
#   - "Processed" counts only the real lines.
#   - Count methods (the first word) and paths (the second word).
#   - "Errors" are lines whose status (third word) is 400 or above.
#   - "Top path" is the most frequent path, with its count.
#   - Hard-code nothing.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Skips noise, counts methods and errors, and finds the top path',
          expectedOutput: 'Processed: 5\nGET: 3\nPOST: 2\nErrors: 2\nTop path: /home (2)',
        },
      ],
      hints: [
        'Loop the lines. First strip each one, then use continue to skip it when it is empty or starts with "#".',
        'line.split() gives [method, path, status]. Count methods and paths in two dicts using the counts[k] = counts.get(k, 0) + 1 pattern. int(status) >= 400 is an error.',
        'For the top path: max(paths, key=paths.get) returns the key with the highest count, the same key= idea as sorted() and max() in Module 5.',
      ],
      solution: `lines = [
    "GET /home 200",
    "",
    "# a comment",
    "POST /login 401",
    "GET /admin 403",
    "GET /home 200",
    "POST /login 200",
]

methods = {}
paths = {}
processed = 0
errors = 0

for line in lines:
    line = line.strip()
    if not line or line.startswith("#"):
        continue

    processed += 1
    method, path, status = line.split()

    methods[method] = methods.get(method, 0) + 1
    paths[path] = paths.get(path, 0) + 1

    if int(status) >= 400:
        errors += 1

top = max(paths, key=paths.get)

print(f"Processed: {processed}")
print(f"GET: {methods['GET']}")
print(f"POST: {methods['POST']}")
print(f"Errors: {errors}")
print(f"Top path: {top} ({paths[top]})")
`,
      markdownContent: {
        en: `# Challenge: Log Summary

Reading a log and reporting on it, loops, \`continue\`, dict counting and \`max\` together. This is a real script.

---

## Instructions

Given the \`lines\` list in the editor, print **exactly**:

\`\`\`
Processed: 5
GET: 3
POST: 2
Errors: 2
Top path: /home (2)
\`\`\`

## Rules

- **Skip** blank lines and lines starting with \`#\`, using \`continue\`.
- **Processed** counts only the real lines.
- Count **methods** (first word) and **paths** (second word).
- **Errors** are lines whose status (third word) is **400 or above**.
- **Top path** is the most frequent path, with its count in brackets.
- Hard-code nothing.

## What you need

\`\`\`python
line.split()                          # ['GET', '/home', '200']
counts[k] = counts.get(k, 0) + 1      # the counting pattern
max(paths, key=paths.get)             # the key with the biggest value
\`\`\`

That last line deserves a look: \`max\` over a dict walks its **keys**, and \`key=paths.get\` tells it to rank each key by its value. Same \`key=\` idea as \`sorted()\`.

## Watch out

\`.strip()\` each line **before** testing it, or a line of spaces won't look blank. And the status is text, \`int()\` it before comparing to 400.

---

Click **Submit** when ready.
`,
        ar: `# تحد: ملخص السجل

قراءة سجل وإعداد تقرير عنه، بجمع الحلقات و\`continue\` والعد بالقاموس و\`max\` معا. وهذا سكربت حقيقي.

---

## التعليمات

انطلاقا من قائمة \`lines\` في المحرر، اطبع هذا **بالضبط**:

\`\`\`
Processed: 5
GET: 3
POST: 2
Errors: 2
Top path: /home (2)
\`\`\`

## القواعد

- **تخط** الأسطر الفارغة والأسطر التي تبدأ بـ \`#\`، مستعملا \`continue\`.
- و**Processed** تعد الأسطر الحقيقية فقط.
- عد **الطرائق** (الكلمة الأولى) و**المسارات** (الكلمة الثانية).
- و**Errors** هي الأسطر التي حالتها (الكلمة الثالثة) **400 أو أكثر**.
- و**Top path** هو المسار الأكثر تكرارا، مع عدده بين قوسين.
- لا تكتب شيئا ثابتا.

## ما تحتاجه

\`\`\`python
line.split()                          # ['GET', '/home', '200']
counts[k] = counts.get(k, 0) + 1      # the counting pattern
max(paths, key=paths.get)             # the key with the biggest value
\`\`\`

والسطر الأخير يستحق النظر: فـ \`max\` على قاموس تمشي على **مفاتيحه**، و\`key=paths.get\` تخبرها أن ترتب كل مفتاح بحسب قيمته. وهي فكرة \`key=\` نفسها التي في \`sorted()\`.

## انتبه

استعمل \`.strip()\` على كل سطر **قبل** اختباره، وإلا لم يبد سطر المسافات فارغا. والحالة نص، فحولها بـ \`int()\` قبل مقارنتها بـ 400.

---

اضغط **Submit** حين تجهز.
`,
      },
    },
  ],
};

export default loops;
