import type { ProgrammingModule } from '../types';

const numbers: ProgrammingModule = {
  id: 'py-numbers',
  slug: 'numbers',
  title: {
    en: 'Numbers & Arithmetic',
    ar: 'الأرقام والعمليات الحسابية',
  },
  description: {
    en: 'Integers and floats, the arithmetic operators, precedence, and why 0.1 + 0.2 is not 0.3.',
    ar: 'الأعداد الصحيحة والعشرية، العمليات الحسابية، الأولوية، ولماذا 0.1 + 0.2 لا تساوي 0.3.',
  },
  order: 4,
  concepts: [
    /* ── 1. Numbers ── */
    {
      id: 'py-numbers-intro',
      slug: 'numbers-intro',
      title: { en: 'Numbers', ar: 'الأرقام' },
      order: 1,
      type: 'lesson',
      starterCode: `# int — whole numbers, any size
big = 2 ** 100
print(big)
print(type(big).__name__)

# float — has a decimal point
print(type(3.0).__name__)
print(type(3).__name__)

# Underscores make long literals readable
print(1_000_000)

# The float surprise
print(0.1 + 0.2)
print(0.1 + 0.2 == 0.3)

# round() for display
print(round(0.1 + 0.2, 2))
`,
      markdownContent: `# Numbers

Python has two number types you'll use daily: **\`int\`** and **\`float\`**.

---

## int

Whole numbers, positive or negative, with **no size limit**:

\`\`\`python
big = 2 ** 100
print(big)   # 1267650600228229401496703205376
\`\`\`

Most languages would overflow. Python grows the integer as needed — the only ceiling is memory. That's genuinely useful in security work, where cryptography routinely handles numbers this large.

Long literals get unreadable, so Python allows underscores as separators:

\`\`\`python
print(1_000_000)   # 1000000
\`\`\`

They're ignored entirely — purely for your eyes.

## float

A number with a decimal point:

\`\`\`python
type(3.0)   # float
type(3)     # int
\`\`\`

The dot is the whole difference. \`3\` and \`3.0\` are equal in value but different types.

---

## Why 0.1 + 0.2 is not 0.3

Run this and it looks like a bug:

\`\`\`python
print(0.1 + 0.2)          # 0.30000000000000004
print(0.1 + 0.2 == 0.3)   # False
\`\`\`

It isn't a bug, and it isn't Python — you'd see the same in C, Java or JavaScript.

A \`float\` is stored in **binary**. Just as \`1/3\` can't be written exactly in decimal (0.3333…), \`0.1\` can't be written exactly in binary. The stored value is a hair off, and the error surfaces when you add.

The lesson: **never compare floats with \`==\`.** Instead check they're close enough:

\`\`\`python
print(abs((0.1 + 0.2) - 0.3) < 1e-9)   # True
\`\`\`

Or use the standard library:

\`\`\`python
import math
math.isclose(0.1 + 0.2, 0.3)   # True
\`\`\`

For money, don't use floats at all — use \`decimal.Decimal\`, which stores digits exactly.

\`round()\` fixes the *display*, not the value:

\`\`\`python
round(0.1 + 0.2, 2)   # 0.3
\`\`\`

---

## Try It

Run the starter code. \`2 ** 100\` prints in full — no overflow. And \`0.1 + 0.2\` shows its tail. Now you know why, you'll recognise it instead of chasing it.
`,
    },

    /* ── 2. Arithmetic Operators ── */
    {
      id: 'py-arithmetic',
      slug: 'arithmetic-operators',
      title: { en: 'Arithmetic Operators', ar: 'العمليات الحسابية' },
      order: 2,
      type: 'lesson',
      starterCode: `a, b = 17, 5

print(a + b)
print(a - b)
print(a * b)
print(a / b)    # true division -> always a float
print(a // b)   # floor division -> drops the remainder
print(a % b)    # modulus -> the remainder
print(a ** 2)   # power

# / gives a float even when it divides evenly
print(10 / 2)

# Floor division rounds DOWN, which matters for negatives
print(-7 // 2)

# Precedence: ** then * / // % then + -
print(2 + 3 * 4)
print((2 + 3) * 4)

# The everyday use of %: is it even?
print(10 % 2 == 0)
`,
      markdownContent: `# Arithmetic Operators

---

## The seven

\`\`\`python
a, b = 17, 5

a + b    # 22   addition
a - b    # 12   subtraction
a * b    # 85   multiplication
a / b    # 3.4  true division
a // b   # 3    floor division
a % b    # 2    modulus (remainder)
a ** 2   # 289  exponent
\`\`\`

The first three hold no surprises. The other four are worth care.

---

## / always gives a float

\`\`\`python
print(10 / 2)   # 5.0  — not 5
\`\`\`

Even when it divides evenly, \`/\` returns a \`float\`. That's a deliberate Python 3 change: division shouldn't silently discard a fraction.

## // drops the remainder

\`\`\`python
17 // 5   # 3   — 3.4 with the .4 discarded
\`\`\`

It's called **floor** division because it rounds **down** — toward negative infinity — not toward zero. With negatives that's not what most people expect:

\`\`\`python
7 // 2    #  3
-7 // 2   # -4   — not -3
\`\`\`

\`-3.5\` rounded *down* is \`-4\`. Worth knowing before it bites you.

## % is the remainder

\`\`\`python
17 % 5   # 2
\`\`\`

Its everyday jobs:

\`\`\`python
n % 2 == 0        # is n even?
seconds % 60      # leftover seconds
i % len(items)    # wrap around a list
\`\`\`

The even/odd test is the one you'll write most.

## ** is power

\`\`\`python
2 ** 10   # 1024
2 ** 0.5  # 1.4142... — a fractional power is a root
\`\`\`

---

## Precedence

Python follows normal maths order:

1. \`**\`
2. \`*\`, \`/\`, \`//\`, \`%\`
3. \`+\`, \`-\`

\`\`\`python
2 + 3 * 4     # 14 — not 20
(2 + 3) * 4   # 20
\`\`\`

Same level evaluates **left to right**. \`**\` is the exception — it goes **right to left**, so \`2 ** 3 ** 2\` is \`2 ** 9\` = \`512\`, not \`64\`.

Don't memorise the edges. Use parentheses: they cost nothing and remove all doubt for the next reader.

---

## Mixing types

An \`int\` and a \`float\` together produce a \`float\` — Python widens to the type that can hold the answer:

\`\`\`python
3 + 0.5   # 3.5, a float
\`\`\`

A number and a string do **not** mix. \`"5" + 5\` is a \`TypeError\`; convert with \`int()\` or \`str()\` first.

## Division by zero

\`\`\`python
10 / 0   # ZeroDivisionError
\`\`\`

Not \`None\`, not infinity — your program stops. When the divisor comes from outside (input, a file, a count), check it first. The Errors module handles this properly.

---

## Try It

Run the starter code. Look hard at \`-7 // 2\` giving \`-4\`, and at \`10 / 2\` giving \`2.0\`.
`,
    },

    /* ── 3. Challenge: Seconds Breakdown ── */
    {
      id: 'py-ch-seconds',
      slug: 'challenge-seconds',
      title: { en: 'Challenge: Seconds Breakdown', ar: 'تحدي: تفصيل الثواني' },
      order: 3,
      type: 'challenge',
      starterCode: `total = 100000

# Break total seconds into days, hours, minutes and seconds, and print:
#
#   Days: 1
#   Hours: 3
#   Minutes: 46
#   Seconds: 40
#
# Rules:
#   - Use // and % — do not hard-code the answers.
#   - Every number printed must be a whole number (no .0).
#   - Use f-strings.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Breaks 100000 seconds into 1d 3h 46m 40s',
          expectedOutput: 'Days: 1\nHours: 3\nMinutes: 46\nSeconds: 40',
        },
      ],
      hints: [
        'A day is 86400 seconds (60 * 60 * 24). total // 86400 gives whole days.',
        'Use % to get what is left over after taking the days out: rest = total % 86400. Then repeat with 3600 for hours and 60 for minutes.',
        'If you see 1.0 instead of 1, you used / somewhere — it returns a float. Use // for whole numbers.',
      ],
      solution: `total = 100000

days = total // 86400
rest = total % 86400

hours = rest // 3600
rest = rest % 3600

minutes = rest // 60
seconds = rest % 60

print(f"Days: {days}")
print(f"Hours: {hours}")
print(f"Minutes: {minutes}")
print(f"Seconds: {seconds}")
`,
      markdownContent: `# Challenge: Seconds Breakdown

The classic use of \`//\` and \`%\` together.

---

## Instructions

Starting from:

\`\`\`python
total = 100000
\`\`\`

print **exactly**:

\`\`\`
Days: 1
Hours: 3
Minutes: 46
Seconds: 40
\`\`\`

## Rules

- Compute the values with \`//\` and \`%\`. Don't hard-code them — the code should work if \`total\` changes.
- Each number must print as a **whole number**. \`Days: 1.0\` is wrong.
- Use **f-strings**.

## The idea

The pattern repeats at every unit:

1. \`//\` the unit size → how many whole units fit
2. \`%\` the unit size → what's left for the next unit down

Take the days out, then work on the remainder for hours, and so on.

## Useful numbers

- a day = \`86400\` seconds
- an hour = \`3600\` seconds
- a minute = \`60\` seconds

## Watch out

If a value prints as \`1.0\`, you used \`/\` instead of \`//\`. True division always returns a float.

---

Click **Submit** when ready.
`,
    },
  ],
};

export default numbers;
