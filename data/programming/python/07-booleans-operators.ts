import type { ProgrammingModule } from '../types';

const booleansOperators: ProgrammingModule = {
  id: 'py-booleans-operators',
  slug: 'booleans-operators',
  title: {
    en: 'Booleans & Operators',
    ar: 'القيم المنطقية والمعاملات',
  },
  description: {
    en: 'True and False, truthiness, and the comparison, logical, assignment and conversion operators.',
    ar: 'صح وخطأ، القيم المنطقية الضمنية، ومعاملات المقارنة والمنطق والإسناد والتحويل.',
  },
  order: 7,
  concepts: [
    /* ── 1. Booleans ── */
    {
      id: 'py-booleans-intro',
      slug: 'booleans-intro',
      title: { en: 'Booleans', ar: 'القيم المنطقية' },
      order: 1,
      type: 'lesson',
      starterCode: `# Only two values — capitalised
print(True, False, type(True).__name__)

# Comparisons produce booleans
print(10 > 5)

# bool() shows how any value is judged
print(bool(0), bool(1), bool(-1))
print(bool(""), bool("a"), bool("False"))
print(bool([]), bool([0]))
print(bool(None))

# Booleans ARE integers underneath
print(True + True)
print(sum([True, False, True]))
`,
      markdownContent: `# Booleans

A **bool** has exactly two values: \`True\` and \`False\`. Capitalised — \`true\` is a \`NameError\`.

They're what every comparison produces, and what every \`if\` consumes.

\`\`\`python
print(10 > 5)   # True
\`\`\`

---

## Truthiness

Python lets you use **any** value where a bool is expected. \`bool()\` shows how each is judged:

\`\`\`python
bool(0)      # False
bool(1)      # True
bool("")     # False
bool("a")    # True
bool([])     # False
bool([0])    # True
bool(None)   # False
\`\`\`

The rule is short: **empty and zero are falsy; everything else is truthy.**

Falsy values, in full:

- \`False\`, \`None\`
- zero of any numeric type: \`0\`, \`0.0\`
- empty containers: \`""\`, \`[]\`, \`()\`, \`{}\`, \`set()\`

Everything else is truthy. Which is why this is idiomatic Python:

\`\`\`python
if items:          # instead of: if len(items) > 0
if not name:       # instead of: if name == ""
\`\`\`

Two traps worth burning in:

\`\`\`python
bool("False")   # True!  — a non-empty string
bool("0")       # True!  — also non-empty
bool([0])       # True   — a list holding one item
\`\`\`

A string is truthy because it has characters, regardless of what they spell. \`"0"\` read from input or a file is **truthy** — convert before testing.

## None is not False

\`None\` is falsy, but it is not equal to \`False\`:

\`\`\`python
bool(None)      # False — None is falsy
None == False   # False — but None is not the value False
\`\`\`

Both lines print \`False\`, for completely different reasons. The first says "None counts as false in an \`if\`." The second says "None is not the same thing as False."

The distinction matters when \`None\` means "no answer yet" and \`False\` means "the answer is no" — a setting left unset versus a setting turned off. Test with \`is None\`, not \`== False\`.

---

## Booleans are integers

A quirk with real uses — \`bool\` is a subclass of \`int\`, where \`True\` is \`1\` and \`False\` is \`0\`:

\`\`\`python
True + True            # 2
sum([True, False, True])  # 2
\`\`\`

So counting how many things are true is just \`sum()\` over the tests. Occasionally elegant; never worth being clever about.

---

## Try It

Run the starter code. Stare at \`bool("False")\` being \`True\` — that one bites people in real code.
`,
    },

    /* ── 2. Comparison Operators ── */
    {
      id: 'py-comparison-operators',
      slug: 'comparison-operators',
      title: { en: 'Comparison Operators', ar: 'معاملات المقارنة' },
      order: 2,
      type: 'lesson',
      starterCode: `print(5 == 5, 5 != 4, 5 > 4, 5 <= 5)

# Strings compare alphabetically, and case matters
print("apple" < "banana")
print("Z" < "a")

# Chaining reads like maths
age = 21
print(18 <= age < 65)

# == compares VALUE; is compares IDENTITY
a = [1, 2]
b = [1, 2]
print(a == b, a is b)
c = a
print(a is c)

# The right way to test None
x = None
print(x is None)

# Types matter
print(1 == 1.0)
print("1" == 1)
`,
      markdownContent: `# Comparison Operators

Six of them, all returning a \`bool\`:

\`\`\`python
5 == 5   # True   equal
5 != 4   # True   not equal
5 > 4    # True   greater
5 < 4    # False  less
5 >= 5   # True   greater or equal
5 <= 5   # True   less or equal
\`\`\`

\`==\` is comparison. \`=\` is assignment. Writing \`if x = 5\` is a \`SyntaxError\` — Python catches this one for you.

---

## Comparing strings

Strings compare **alphabetically**, character by character:

\`\`\`python
"apple" < "banana"   # True
\`\`\`

But it's really by **character code**, and every uppercase letter sorts before every lowercase one:

\`\`\`python
"Z" < "a"   # True  — 'Z' is 90, 'a' is 97
\`\`\`

So \`"Apple" < "apple"\`, and sorting mixed-case text gives an order that looks wrong to a human. Normalise with \`.lower()\` when you mean a human alphabetical order.

## Types matter

\`\`\`python
1 == 1.0     # True   — same value, int and float compare fine
"1" == 1     # False  — a string is never equal to a number
\`\`\`

That second line is silent. Comparing a value from \`input()\` (always a string) to a number is a classic bug — nothing raises, the test just never passes.

Ordering across unrelated types **does** raise:

\`\`\`python
"a" < 1   # TypeError: '<' not supported between 'str' and 'int'
\`\`\`

## Chaining

Python lets you chain, and it reads exactly like maths:

\`\`\`python
18 <= age < 65
\`\`\`

Equivalent to \`18 <= age and age < 65\`, but \`age\` is evaluated once. Most languages don't allow this.

---

## == vs is

The distinction that trips everyone:

- **\`==\`** — do they have the same **value**?
- **\`is\`** — are they the **same object** in memory?

\`\`\`python
a = [1, 2]
b = [1, 2]
a == b   # True  — same contents
a is b   # False — two separate lists

c = a
a is c   # True  — one list, two names
\`\`\`

Names label values, from Module 2. \`is\` asks whether two names label the *same* value.

**Use \`==\` for values. Use \`is\` only for \`None\`:**

\`\`\`python
if x is None:      # correct
if x == None:      # works, but not idiomatic
\`\`\`

\`None\` is a singleton — there's exactly one — so identity is the right question.

Never use \`is\` on numbers or strings. \`a is b\` for small ints may print \`True\` because Python caches them, and \`False\` for large ones. Relying on that is a bug waiting to happen.

---

## Try It

Run the starter code. \`a == b\` is \`True\` while \`a is b\` is \`False\` — same contents, different objects.
`,
    },

    /* ── 3. Boolean Operators ── */
    {
      id: 'py-boolean-operators',
      slug: 'boolean-operators',
      title: { en: 'Boolean Operators', ar: 'المعاملات المنطقية' },
      order: 3,
      type: 'lesson',
      starterCode: `print(True and False, True or False, not True)

age, has_id = 21, True
print(age >= 18 and has_id)

# Precedence: not, then and, then or
print(True or False and False)
print((True or False) and False)

# They return an OPERAND, not always a bool
print(0 or "fallback")
print("a" and "b")
print(None or 0 or "last")

# The short-circuit guard
items = []
print(items and items[0])
`,
      markdownContent: `# Boolean Operators

Three: **\`and\`**, **\`or\`**, **\`not\`**. Words, not symbols — no \`&&\` or \`||\`.

\`\`\`python
True and False   # False — both must be true
True or False    # True  — either will do
not True         # False — flips it
\`\`\`

\`\`\`python
if age >= 18 and has_id:
    ...
\`\`\`

---

## Precedence

\`not\` binds tightest, then \`and\`, then \`or\`:

\`\`\`python
True or False and False    # True  — the 'and' runs first
(True or False) and False  # False
\`\`\`

\`and\` before \`or\`, like \`*\` before \`+\`. When it matters, use parentheses rather than making the reader recall this.

---

## Short-circuiting

Python stops as soon as the answer is settled:

- \`A and B\` — if \`A\` is falsy, \`B\` is **never evaluated**.
- \`A or B\` — if \`A\` is truthy, \`B\` is **never evaluated**.

That's not trivia; it's a tool. This is safe:

\`\`\`python
if items and items[0] == "x":
\`\`\`

If \`items\` is empty, \`items[0]\` never runs, so no \`IndexError\`. Order the conditions so the cheap or protective test comes first.

## They return an operand

The part that surprises people: \`and\` and \`or\` don't return \`True\`/\`False\`. They return **one of the values**:

\`\`\`python
0 or "fallback"      # 'fallback'
"a" and "b"          # 'b'
None or 0 or "last"  # 'last'
\`\`\`

The rule:

- **\`or\`** returns the first **truthy** operand, else the last one.
- **\`and\`** returns the first **falsy** operand, else the last one.

Which explains the classic default idiom:

\`\`\`python
name = user_input or "anonymous"
\`\`\`

Empty input is falsy, so \`name\` becomes \`"anonymous"\`.

One catch: it triggers on *any* falsy value, so \`port = given or 8080\` also replaces a legitimate \`0\`. When \`0\` or \`""\` are valid, test explicitly:

\`\`\`python
port = 8080 if given is None else given
\`\`\`

Also:

\`\`\`python
items and items[0]   # [] -> returns [], not False
\`\`\`

Fine in an \`if\` (\`[]\` is falsy), but don't print it expecting \`False\`.

---

## Try It

Run the starter code. The last four lines return values rather than booleans — that's the lesson.
`,
    },

    /* ── 4. Assignment Operators ── */
    {
      id: 'py-assignment-operators',
      slug: 'assignment-operators',
      title: { en: 'Assignment Operators', ar: 'معاملات الإسناد' },
      order: 4,
      type: 'lesson',
      starterCode: `count = 10
count += 5
count -= 3
count *= 2
count //= 4
count **= 2
print(count)

# /= always gives a float
n = 10
n /= 2
print(n, type(n).__name__)

# += on a string builds a new one
s = "a"
s += "b"
print(s)

# On a LIST it mutates in place — visible through other names
a = [1, 2]
b = a
a += [3]
print("b:", b)

# Whereas a = a + [...] rebinds a new list
c = [1, 2]
d = c
c = c + [3]
print("d:", d)
`,
      markdownContent: `# Assignment Operators

Shorthand for "update this variable using its own value."

\`\`\`python
count += 5    # count = count + 5
count -= 3    # subtract
count *= 2    # multiply
count /= 2    # divide  -> float
count //= 4   # floor divide
count %= 3    # remainder
count **= 2   # power
\`\`\`

The right side is evaluated **first**, then the name is re-bound to the result. \`x += 1\` is the most common line in programming.

Note \`/=\` follows \`/\`: it always produces a **float**, even on whole numbers.

The variable must already exist — \`x += 1\` on an undefined \`x\` is a \`NameError\`, since it needs the old value.

---

## On strings

\`\`\`python
s = "a"
s += "b"   # 'ab'
\`\`\`

Strings are immutable, so this doesn't modify anything — it builds a **new** string and re-points \`s\`. Fine occasionally; in a big loop, collect into a list and \`"".join()\` at the end instead, which is much faster.

---

## The one that surprises: += on a list

For mutable types, \`+=\` is genuinely different from \`x = x + y\`:

\`\`\`python
a = [1, 2]
b = a
a += [3]
print(b)   # [1, 2, 3]  — b changed too!
\`\`\`

versus:

\`\`\`python
c = [1, 2]
d = c
c = c + [3]
print(d)   # [1, 2]  — d untouched
\`\`\`

**\`a += [3]\`** modifies the existing list in place (like \`extend\`), and \`b\` labels that same list, so \`b\` sees it.

**\`c = c + [3]\`** builds a **new** list and points \`c\` at it. \`d\` still labels the old one.

Same-looking lines, different outcomes. It's the aliasing rule from Module 5 again: with mutable values, *modify in place* and *rebind* are not interchangeable.

---

## Try It

Run the starter code. The last two blocks are the point: \`b\` changed, \`d\` didn't.
`,
    },

    /* ── 5. Type Conversion ── */
    {
      id: 'py-type-conversion',
      slug: 'type-conversion',
      title: { en: 'Type Conversion', ar: 'تحويل الأنواع' },
      order: 5,
      type: 'lesson',
      starterCode: `print(int("42") + 1)
print(str(42) + "!")
print(float("3.14"))

# int() TRUNCATES a float — it does not round
print(int(3.9), int(-3.9))
print(round(3.9))

# int() will not parse a decimal string
# print(int("3.14"))   # ValueError
print(int(float("3.14")))

# Bad input raises
# print(int("abc"))    # ValueError

# So check first
raw = "42"
print(int(raw) + 1 if raw.isdigit() else "not a number")

# Between collections
print(list("abc"), set([1, 1, 2]), tuple([1, 2]))
print(dict([("a", 1)]))
`,
      markdownContent: `# Type Conversion

Turning one type into another. Also called *casting*.

---

## The main three

\`\`\`python
int("42")     # 42
str(42)       # '42'
float("3.14") # 3.14
\`\`\`

You've been using \`str()\` since Module 2 — \`"Year: " + str(year)\`. The reverse matters just as much, because **\`input()\` always gives a string**:

\`\`\`python
age = input()      # "21" — a string
age + 1            # TypeError
int(age) + 1       # 22
\`\`\`

---

## int() truncates

It does **not** round:

\`\`\`python
int(3.9)    # 3
int(-3.9)   # -3    — toward zero
round(3.9)  # 4
\`\`\`

Note \`int()\` cuts toward **zero**, while \`//\` floors toward **negative infinity**. So \`int(-3.9)\` is \`-3\` but \`-7 // 2\` is \`-4\`. Use \`round()\` when you mean rounding.

## int() is strict about strings

\`\`\`python
int("42")     # 42
int("3.14")   # ValueError — not a whole number
int("abc")    # ValueError
int(" 42 ")   # 42 — surrounding whitespace is fine
\`\`\`

For a decimal string, go through \`float\` first:

\`\`\`python
int(float("3.14"))   # 3
\`\`\`

## Bad input raises

\`\`\`python
int("abc")   # ValueError: invalid literal for int() with base 10: 'abc'
\`\`\`

Which stops your program. Since conversions usually run on data from outside — input, a file, a response — guard them:

\`\`\`python
if raw.isdigit():
    value = int(raw)
\`\`\`

Remember \`isdigit()\` is \`False\` for \`"-5"\` and \`"3.14"\`, so it only covers whole non-negative numbers. The proper tool is \`try\`/\`except\`, in the Errors module.

---

## Between collections

\`\`\`python
list("abc")        # ['a', 'b', 'c']
set([1, 1, 2])     # {1, 2}       — dedupe
tuple([1, 2])      # (1, 2)
list({"a": 1})     # ['a']        — a dict gives its KEYS
dict([("a", 1)])   # {'a': 1}     — from (key, value) pairs
\`\`\`

\`set(my_list)\` for deduping is the one you'll reach for constantly.

---

## Try It

Run the starter code. Compare \`int(3.9)\` (3) with \`round(3.9)\` (4) — truncation is not rounding.
`,
    },

    /* ── 6. Challenge: Access Check ── */
    {
      id: 'py-ch-access-check',
      slug: 'challenge-access-check',
      title: { en: 'Challenge: Access Check', ar: 'تحدي: فحص الصلاحية' },
      order: 6,
      type: 'challenge',
      starterCode: `raw_age = "21"
has_id = True
name = ""

# Print exactly:
#
#   Name: anonymous
#   Adult: True
#   Allowed: True
#   Next year: 22
#
# Rules:
#   - "Name" falls back to "anonymous" when name is empty. Use 'or'.
#   - "Adult" is whether the age is 18 or over. raw_age is a STRING.
#   - "Allowed" is adult AND has_id.
#   - "Next year" is the age plus 1, as a number.
#   - Hard-code nothing; derive it all from the three variables.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Applies the fallback, converts the age, and combines the checks',
          expectedOutput: 'Name: anonymous\nAdult: True\nAllowed: True\nNext year: 22',
        },
      ],
      hints: [
        'An empty string is falsy, so name or "anonymous" gives you the fallback in one step.',
        'raw_age is a string — int(raw_age) converts it. Comparing "21" >= 18 would be a TypeError.',
        'Adult is int(raw_age) >= 18, and Allowed is that result and has_id. Store them in variables, then print with f-strings.',
      ],
      solution: `raw_age = "21"
has_id = True
name = ""

display_name = name or "anonymous"
age = int(raw_age)
adult = age >= 18
allowed = adult and has_id

print(f"Name: {display_name}")
print(f"Adult: {adult}")
print(f"Allowed: {allowed}")
print(f"Next year: {age + 1}")
`,
      markdownContent: `# Challenge: Access Check

The whole module in one small gate: truthiness, conversion, comparison and logic.

---

## Instructions

Given:

\`\`\`python
raw_age = "21"
has_id = True
name = ""
\`\`\`

print **exactly**:

\`\`\`
Name: anonymous
Adult: True
Allowed: True
Next year: 22
\`\`\`

## Rules

- **Name** falls back to \`"anonymous"\` when \`name\` is empty — use \`or\`.
- **Adult** is whether the age is 18 or over. Note \`raw_age\` is a **string**.
- **Allowed** is adult **and** \`has_id\`.
- **Next year** is the age plus 1, printed as a number.
- Hard-code nothing — derive everything from the three variables.

## Watch out

\`raw_age\` is text. \`"21" >= 18\` is a \`TypeError\`, not a comparison — convert first.

And \`name\` is \`""\`, which is falsy. That's exactly what \`or\` needs.

---

Click **Submit** when ready.
`,
    },
  ],
};

export default booleansOperators;
