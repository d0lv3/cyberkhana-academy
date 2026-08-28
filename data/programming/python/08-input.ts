import type { ProgrammingModule } from '../types';

const input: ProgrammingModule = {
  id: 'py-input',
  slug: 'input',
  title: {
    en: 'User Input & Practice',
    ar: 'مدخلات المستخدم وتدريبات',
  },
  description: {
    en: 'Reading input from the user, and two practicals that put the first seven modules to work.',
    ar: 'قراءة المدخلات من المستخدم، وتمرينان عمليان يوظفان الوحدات السبع الأولى.',
  },
  order: 8,
  concepts: [
    /* ── 1. User Input ── */
    {
      id: 'py-user-input',
      slug: 'user-input',
      title: { en: 'User Input', ar: 'مدخلات المستخدم' },
      order: 1,
      type: 'lesson',
      sampleInput: 'Sara\n21\n  YES  \n',
      starterCode: `# The Input box below feeds these lines to input(), as if you typed them.
# Try changing them, then Run again.

name = input("Name: ")
raw_age = input("Age: ")

print("Type of raw_age:", type(raw_age).__name__)

age = int(raw_age)
print(f"Hello {name}, next year you turn {age + 1}")

# input() keeps every character except the newline, 
# including spaces, so strip() before comparing.
answer = input("Continue? ")
print("clean:", repr(answer.strip().lower()))
`,
      markdownContent: {
        en: `# User Input

\`input()\` pauses the program, waits for a line, and hands it back.

\`\`\`python
name = input("Name: ")
print(f"Hello {name}")
\`\`\`

The argument is the **prompt**, printed with no newline, so the cursor sits after it. It's optional, but a bare \`input()\` looks like your program has frozen.

In this editor there's no keyboard to wait on, so the **Input box** supplies the lines instead, one per \`input()\` call, in order. Everything else behaves exactly as it would in a terminal.

---

## input() always returns a string

The single most important fact about it. Always. No exceptions:

\`\`\`python
raw_age = input("Age: ")   # you type 21
type(raw_age)              # str , "21", not 21
raw_age + 1                # TypeError
\`\`\`

So convert before doing arithmetic:

\`\`\`python
age = int(raw_age)
print(age + 1)   # 22
\`\`\`

And the silent version of the same bug, from Module 7:

\`\`\`python
if raw_age >= 18:    # TypeError, str vs int
if raw_age == 18:    # no error, just never True
\`\`\`

The second one is worse. \`"18" == 18\` is \`False\`, Python compares happily and the test simply never fires. No traceback, no clue.

## Bad input raises

\`int()\` on something that isn't a number stops the program:

\`\`\`python
age = int(input("Age: "))   # user types "abc" -> ValueError
\`\`\`

That's the whole risk of input: it comes from **outside**, so you can't assume anything about it. Guard it:

\`\`\`python
raw = input("Age: ")
if raw.isdigit():
    age = int(raw)
else:
    print("Please enter a whole number.")
\`\`\`

The complete answer is \`try\`/\`except\`, in the Errors module.

---

## What input() keeps

It strips the trailing newline, and nothing else. Leading and trailing **spaces survive**:

\`\`\`python
answer = input("Continue? ")   # user types "  YES  "
answer == "yes"                # False, spaces and capitals
answer.strip().lower() == "yes"  # True
\`\`\`

\`.strip().lower()\` before comparing anything a human typed. Same rule as Module 3.

\`repr()\` is worth knowing here, it shows the quotes and any hidden whitespace, which \`print()\` hides:

\`\`\`python
print(answer)         #   YES
print(repr(answer))   # '  YES  '
\`\`\`

When input "looks right" but won't match, \`repr()\` shows you why.

---

## Try It

Run the starter code with the given input, then edit the Input box. Try entering \`abc\` for the age and read the \`ValueError\`, that's your program meeting the real world.
`,
        ar: `# مدخلات المستخدم

الدالة \`input()\` توقف البرنامج، وتنتظر سطرا، ثم تسلمه لك.

\`\`\`python
name = input("Name: ")
print(f"Hello {name}")
\`\`\`

والوسيط هو **المحث (prompt)**، ويطبع بلا سطر جديد، فيستقر المؤشر بعده. وهو اختياري، لكن \`input()\` مجردة تجعل برنامجك يبدو وكأنه تجمد.

وفي هذا المحرر لا توجد لوحة مفاتيح ينتظرها، لذلك يزودها **صندوق Input** بالأسطر بدلا من ذلك، سطرا لكل استدعاء لـ \`input()\` بالترتيب. وكل ما عدا ذلك يسلك تماما كما يسلك في الطرفية.

---

## input() تعيد نصا دائما

هذه أهم حقيقة عنها. دائما. بلا استثناء:

\`\`\`python
raw_age = input("Age: ")   # you type 21
type(raw_age)              # str , "21", not 21
raw_age + 1                # TypeError
\`\`\`

فحول قبل إجراء أي حساب:

\`\`\`python
age = int(raw_age)
print(age + 1)   # 22
\`\`\`

والنسخة الصامتة من الخطأ نفسه، من الوحدة 7:

\`\`\`python
if raw_age >= 18:    # TypeError, str vs int
if raw_age == 18:    # no error, just never True
\`\`\`

والثاني أسوأ. فـ \`"18" == 18\` تساوي \`False\`، وتقارن بايثون في هدوء ولا ينطلق الاختبار أبدا. لا أثر تتبع ولا دليل.

## المدخل السيئ يرفع خطأ

استدعاء \`int()\` على ما ليس عددا يوقف البرنامج:

\`\`\`python
age = int(input("Age: "))   # user types "abc" -> ValueError
\`\`\`

وتلك هي خطورة المدخلات كلها: فهي تأتي من **الخارج**، فلا تستطيع افتراض أي شيء عنها. احرسها:

\`\`\`python
raw = input("Age: ")
if raw.isdigit():
    age = int(raw)
else:
    print("Please enter a whole number.")
\`\`\`

والجواب الكامل هو \`try\` و\`except\` في وحدة الأخطاء.

---

## ما الذي تبقيه input()

تزيل السطر الجديد في النهاية ولا شيء غيره. أما المسافات في البداية والنهاية **فتبقى**:

\`\`\`python
answer = input("Continue? ")   # user types "  YES  "
answer == "yes"                # False, spaces and capitals
answer.strip().lower() == "yes"  # True
\`\`\`

استعمل \`.strip().lower()\` قبل مقارنة أي شيء كتبه إنسان. وهي القاعدة نفسها من الوحدة 3.

والدالة \`repr()\` تستحق المعرفة هنا، فهي تظهر علامات الاقتباس وأي مسافات خفية تخفيها \`print()\`:

\`\`\`python
print(answer)         #   YES
print(repr(answer))   # '  YES  '
\`\`\`

فحين يبدو المدخل "صحيحا" ولا يطابق، تريك \`repr()\` السبب.

---

## جربها

شغل الشيفرة الابتدائية بالمدخل المعطى، ثم عدل صندوق Input. جرب إدخال \`abc\` للعمر واقرأ \`ValueError\`، فذاك برنامجك وهو يلتقي بالعالم الحقيقي.
`,
      },
    },

    /* ── 2. Practical: Email Slice ── */
    {
      id: 'py-practical-email',
      slug: 'practical-email',
      title: { en: 'Practical: Email Parts', ar: 'تطبيق: أجزاء البريد' },
      order: 2,
      type: 'lesson',
      starterCode: `email = "sara.ahmed@cyberkhana.tech"

at = email.index("@")
user = email[:at]
domain = email[at + 1:]

print("User:", user)
print("Domain:", domain)

# Slicing is one way; split() is usually clearer
user2, domain2 = email.split("@")
print(user2, "|", domain2)

# Three parts at once
name, sep, host = email.partition("@")
print(name, sep, host)

# Go further: the TLD is the last dotted piece
print("TLD:", domain.split(".")[-1])
print("First name:", user.split(".")[0].capitalize())

# A crude validity check
print("Valid-ish:", email.count("@") == 1 and "." in domain)
`,
      markdownContent: {
        en: `# Practical: Email Parts

Pulling an email apart, indexing, slicing and string methods together.

---

## By slicing

Find the \`@\`, then cut around it:

\`\`\`python
email = "sara.ahmed@cyberkhana.tech"

at = email.index("@")
user = email[:at]        # everything before
domain = email[at + 1:]  # everything after
\`\`\`

The \`+ 1\` matters: \`email[at:]\` would keep the \`@\` itself, since slices include the start.

\`index()\` raises \`ValueError\` if there's no \`@\`, which is right here. An email without one is broken, and you'd want to know.

## By split()

Usually clearer:

\`\`\`python
user, domain = email.split("@")
\`\`\`

One line, and it unpacks straight into two names. The catch: it raises \`ValueError\` if there isn't **exactly one** \`@\`, because the counts wouldn't match.

## By partition()

Safest, because it always returns three parts:

\`\`\`python
name, sep, host = email.partition("@")
\`\`\`

No \`@\`? \`sep\` is \`""\` and you can check that, instead of handling an exception.

Three tools, same job, pick by what should happen when the input is malformed.

---

## Going further

Chain the methods:

\`\`\`python
domain.split(".")[-1]              # 'tech' , the TLD
user.split(".")[0].capitalize()    # 'Sara' , the first name
\`\`\`

Read left to right: split on dots, take the last piece. \`[-1]\` is doing real work, it's the last item however many dots there are, so it handles \`mail.co.uk\` too.

## A word on validating

\`\`\`python
email.count("@") == 1 and "." in domain
\`\`\`

Good enough for a form hint, and **not** a real validation. The actual rules are notoriously baroque, quoted strings, comments, and addresses that look illegal but aren't. Don't write your own; the only real test is sending a mail and seeing if it arrives.

That instinct generalises: for anything with a specification (emails, URLs, dates), reach for the library before writing a clever one-liner.

---

## Try It

Run the starter code, then change the email, try one with no \`@\` and watch which lines break, and which don't.
`,
        ar: `# تطبيق عملي: أجزاء البريد الإلكتروني

تفكيك عنوان بريد إلكتروني، بجمع الفهرسة والتقطيع وتوابع النصوص معا.

---

## بالتقطيع

جد \`@\` ثم اقطع حولها:

\`\`\`python
email = "sara.ahmed@cyberkhana.tech"

at = email.index("@")
user = email[:at]        # everything before
domain = email[at + 1:]  # everything after
\`\`\`

والزيادة \`+ 1\` مهمة: فـ \`email[at:]\` كانت ستبقي \`@\` نفسها، لأن الشرائح تشمل البداية.

ويرفع \`index()\` خطأ \`ValueError\` إن لم توجد \`@\`، وهذا صحيح هنا. فالبريد الذي بلا \`@\` معطوب، وستحب أن تعرف بذلك.

## بـ split()

وهي أوضح عادة:

\`\`\`python
user, domain = email.split("@")
\`\`\`

سطر واحد يفكك مباشرة إلى اسمين. والمأخذ: أنه يرفع \`ValueError\` إن لم توجد \`@\` **واحدة بالضبط**، لأن العددين لن يتطابقا.

## بـ partition()

وهي الأأمن، لأنها تعيد ثلاثة أجزاء دائما:

\`\`\`python
name, sep, host = email.partition("@")
\`\`\`

فإن لم توجد \`@\` صار \`sep\` هو \`""\` وتستطيع التحقق من ذلك بدل معالجة استثناء.

ثلاث أدوات لمهمة واحدة، اختر بحسب ما ينبغي أن يحدث حين يكون المدخل مشوها.

---

## أبعد من ذلك

سلسل التوابع:

\`\`\`python
domain.split(".")[-1]              # 'tech' , the TLD
user.split(".")[0].capitalize()    # 'Sara' , the first name
\`\`\`

اقرأ من اليسار إلى اليمين: قسم عند النقاط، ثم خذ القطعة الأخيرة. والفهرس \`[-1]\` يؤدي عملا حقيقيا، فهو العنصر الأخير مهما كان عدد النقاط، فيتعامل مع \`mail.co.uk\` أيضا.

## كلمة عن التحقق

\`\`\`python
email.count("@") == 1 and "." in domain
\`\`\`

جيد بما يكفي لتلميح في نموذج، وهو **ليس** تحققا حقيقيا. فالقواعد الفعلية معقدة إلى حد الأسطورة، من نصوص مقتبسة، وتعليقات، وعناوين تبدو غير قانونية وهي قانونية. لا تكتب تحققك بنفسك، فالاختبار الحقيقي الوحيد هو إرسال رسالة ورؤية هل تصل.

وهذه الغريزة تعمم: فكل ما له مواصفة قياسية (البريد الإلكتروني، والروابط، والتواريخ) الجأ فيه إلى المكتبة قبل كتابة سطر ذكي.

---

## جربها

شغل الشيفرة الابتدائية، ثم غير البريد، وجرب واحدا بلا \`@\` وراقب أي الأسطر ينكسر وأيها لا ينكسر.
`,
      },
    },

    /* ── 3. Practical: Age in Detail ── */
    {
      id: 'py-practical-age',
      slug: 'practical-age',
      title: { en: 'Practical: Age in Detail', ar: 'تطبيق: العمر بالتفصيل' },
      order: 3,
      type: 'lesson',
      sampleInput: '21\n',
      starterCode: `years = int(input("Age in years: "))

days = years * 365
hours = days * 24
minutes = hours * 60
seconds = minutes * 60

print(f"Years:   {years}")
print(f"Days:    {days:,}")
print(f"Hours:   {hours:,}")
print(f"Minutes: {minutes:,}")
print(f"Seconds: {seconds:,}")

# The reverse direction: seconds back to units
total = seconds
d = total // 86400
h = total % 86400 // 3600
print(f"Check: {d:,} days and {h} hours")
`,
      markdownContent: {
        en: `# Practical: Age in Detail

Take an age in years and express it in every unit down to seconds. Input, conversion, arithmetic and formatting in one go.

---

## The shape

Each unit is the one above it times a fixed factor:

\`\`\`python
years = int(input("Age in years: "))

days = years * 365
hours = days * 24
minutes = hours * 60
seconds = minutes * 60
\`\`\`

Note each line builds on the last rather than restating the maths from years. \`hours = years * 365 * 24\` works too, but by \`seconds\` you'd be squinting at \`years * 365 * 24 * 60 * 60\`. Building up in steps is easier to read and to check.

## Formatting

Big numbers are unreadable raw. The thousands separator from Module 3 earns its keep:

\`\`\`python
print(f"Seconds: {seconds:,}")   # Seconds: 662,256,000
\`\`\`

And a fixed label width lines the output up:

\`\`\`python
print(f"Years:   {years}")
print(f"Minutes: {minutes:,}")
\`\`\`

## Going the other way

\`//\` and \`%\` from Module 4 reverse it:

\`\`\`python
d = total // 86400          # whole days
h = total % 86400 // 3600   # leftover seconds -> whole hours
\`\`\`

Read the second line as: take what's left after removing whole days, then see how many whole hours fit. That two-step, \`%\` to get the remainder, \`//\` to take the next unit, is the pattern for any unit breakdown.

---

## An honest caveat

\`years * 365\` is an approximation. It ignores leap years, so it's off by roughly a day every four. For a real answer you'd use actual dates:

\`\`\`python
from datetime import date
days = (date.today() - date(2004, 5, 1)).days
\`\`\`

That's Module 13. The point stands: know when your arithmetic is a model rather than the truth, and say so.

---

## Try It

Run it, then change the age in the Input box. Try \`0\`, everything is zero, and nothing breaks.
`,
        ar: `# تطبيق عملي: العمر بالتفصيل

خذ عمرا بالسنوات وعبر عنه بكل وحدة نزولا إلى الثواني. المدخلات، والتحويل، والحساب، والتنسيق في عمل واحد.

---

## الشكل العام

كل وحدة هي التي فوقها مضروبة في معامل ثابت:

\`\`\`python
years = int(input("Age in years: "))

days = years * 365
hours = days * 24
minutes = hours * 60
seconds = minutes * 60
\`\`\`

ولاحظ أن كل سطر يبني على سابقه بدل إعادة الحساب من السنوات. والتعبير \`hours = years * 365 * 24\` يعمل أيضا، لكنك عند \`seconds\` ستحدق في \`years * 365 * 24 * 60 * 60\`. فالبناء على خطوات أسهل قراءة وأسهل تدقيقا.

## التنسيق

الأعداد الكبيرة لا تقرأ خاما. وهنا يثبت فاصل الآلاف من الوحدة 3 جدواه:

\`\`\`python
print(f"Seconds: {seconds:,}")   # Seconds: 662,256,000
\`\`\`

وعرض ثابت للعناوين يحاذي المخرجات:

\`\`\`python
print(f"Years:   {years}")
print(f"Minutes: {minutes:,}")
\`\`\`

## في الاتجاه المعاكس

العاملان \`//\` و\`%\` من الوحدة 4 يعكسان ذلك:

\`\`\`python
d = total // 86400          # whole days
h = total % 86400 // 3600   # leftover seconds -> whole hours
\`\`\`

اقرأ السطر الثاني هكذا: خذ ما تبقى بعد إزالة الأيام الكاملة، ثم انظر كم ساعة كاملة تسعها. وهذه الخطوتان، \`%\` لأخذ الباقي ثم \`//\` لأخذ الوحدة التالية، هما نمط أي تفكيك إلى وحدات.

---

## تحفظ صريح

التعبير \`years * 365\` تقريب. فهو يتجاهل السنوات الكبيسة، فيحيد بمقدار يوم تقريبا كل أربع سنوات. وللحصول على جواب حقيقي تستعمل تواريخ فعلية:

\`\`\`python
from datetime import date
days = (date.today() - date(2004, 5, 1)).days
\`\`\`

وتلك هي الوحدة 13. ويبقى المقصود قائما: اعرف متى يكون حسابك نموذجا لا حقيقة، وقل ذلك صراحة.

---

## جربها

شغلها، ثم غير العمر في صندوق Input. جرب \`0\`، فكل شيء يصير صفرا ولا شيء ينكسر.
`,
      },
    },

    /* ── 4. Challenge: Login Report ── */
    {
      id: 'py-ch-login-report',
      slug: 'challenge-login-report',
      title: { en: 'Challenge: Login Report', ar: 'تحدي: تقرير الدخول' },
      order: 4,
      type: 'challenge',
      starterCode: `# Read TWO lines of input:
#   1. an email address
#   2. an age in years
#
# For the input in the box (sara.ahmed@cyberkhana.tech / 21), print exactly:
#
#   User: sara.ahmed
#   Domain: cyberkhana.tech
#   First: Sara
#   Adult: True
#   Days: 7,665
#
# Rules:
#   - Read both values with input(). Hard-code nothing.
#   - "First" is the part before the dot in the user, capitalised.
#   - "Adult" is whether the age is 18 or over.
#   - "Days" is age * 365, with a thousands separator.
#   - Strip whitespace from the email before using it.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Parses the email and age, and reports all five lines',
          input: 'sara.ahmed@cyberkhana.tech\n21\n',
          expectedOutput:
            'User: sara.ahmed\nDomain: cyberkhana.tech\nFirst: Sara\nAdult: True\nDays: 7,665',
        },
      ],
      hints: [
        'Two input() calls, in order: the email first, then the age. Remember input() always returns a string.',
        'email.strip().split("@") unpacks straight into user and domain. Then user.split(".")[0].capitalize() gives the first name.',
        'age must be int(...) before comparing to 18 or multiplying. For the separator use an f-string: f"Days: {age * 365:,}".',
      ],
      solution: `email = input().strip()
age = int(input())

user, domain = email.split("@")
first = user.split(".")[0].capitalize()

print(f"User: {user}")
print(f"Domain: {domain}")
print(f"First: {first}")
print(f"Adult: {age >= 18}")
print(f"Days: {age * 365:,}")
`,
      markdownContent: {
        en: `# Challenge: Login Report

Everything so far, on data that arrives from outside.

---

## Instructions

Read **two** lines with \`input()\`:

1. an email address
2. an age in years

The Input box holds \`sara.ahmed@cyberkhana.tech\` and \`21\`. For those, print **exactly**:

\`\`\`
User: sara.ahmed
Domain: cyberkhana.tech
First: Sara
Adult: True
Days: 7,665
\`\`\`

## Rules

- Read both values with \`input()\`, hard-code nothing.
- **First** is the part of the user before the dot, capitalised.
- **Adult** is whether the age is 18 or over.
- **Days** is age × 365, printed **with a thousands separator**.
- \`.strip()\` the email before using it.

## What you need

\`input()\`, \`.strip()\`, \`.split()\`, \`.capitalize()\`, \`int()\`, a comparison, and the \`:,\` format spec.

Two reminders:

- \`input()\` returns a **string**, the age needs \`int()\` before you compare or multiply.
- \`{age >= 18}\` inside an f-string prints \`True\` directly; no \`if\` needed.

---

Click **Submit** when ready.
`,
        ar: `# تحد: تقرير الدخول

كل ما سبق، على بيانات تصل من الخارج.

---

## التعليمات

اقرأ **سطرين** بـ \`input()\`:

1. عنوان بريد إلكتروني
2. عمرا بالسنوات

يحمل صندوق Input القيمتين \`sara.ahmed@cyberkhana.tech\` و\`21\`. ولهما اطبع هذا **بالضبط**:

\`\`\`
User: sara.ahmed
Domain: cyberkhana.tech
First: Sara
Adult: True
Days: 7,665
\`\`\`

## القواعد

- اقرأ كلتا القيمتين بـ \`input()\`، ولا تكتب شيئا ثابتا.
- و**First** هي الجزء من اسم المستخدم قبل النقطة، بحرف أول كبير.
- و**Adult** هي ما إذا كان العمر 18 أو أكثر.
- و**Days** هي العمر مضروبا في 365، وتطبع **بفاصل آلاف**.
- استعمل \`.strip()\` على البريد قبل استعماله.

## ما تحتاجه

\`input()\`، و\`.strip()\`، و\`.split()\`، و\`.capitalize()\`، و\`int()\`، ومقارنة، ومواصفة التنسيق \`:,\`.

وتذكيران:

- الدالة \`input()\` تعيد **نصا**، فالعمر يحتاج \`int()\` قبل أن تقارن أو تضرب.
- والتعبير \`{age >= 18}\` داخل f-string يطبع \`True\` مباشرة، فلا حاجة إلى \`if\`.

---

اضغط **Submit** حين تجهز.
`,
      },
    },
  ],
};

export default input;
