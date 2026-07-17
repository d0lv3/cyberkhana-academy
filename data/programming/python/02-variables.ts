import type { ProgrammingModule } from '../types';

const variables: ProgrammingModule = {
  id: 'py-variables',
  slug: 'variables',
  title: {
    en: 'Data & Variables',
    ar: 'البيانات والمتغيرات',
  },
  description: {
    en: 'How Python holds data, the core data types, and how to name, store and join values.',
    ar: 'كيف تتعامل بايثون مع البيانات، الأنواع الأساسية، وكيفية تسمية القيم وتخزينها ودمجها.',
  },
  order: 2,
  concepts: [
    /* ── 1. Working With Data (lesson) ── */
    {
      id: 'py-working-with-data',
      slug: 'working-with-data',
      title: { en: 'Working With Data', ar: 'التعامل مع البيانات' },
      order: 1,
      type: 'lesson',
      starterCode: `# Every value has a type. type() tells you which.
print(type("CyberKhana"))
print(type(2026))
print(type(3.5))
print(type(True))

# The type travels with the value, not with the name.
x = "text"
print(type(x))
x = 99
print(type(x))
`,
      markdownContent: `# Working With Data

A program is mostly one thing: **data, and what you do to it**. A password, a port number, a list of hosts, whether a scan finished — all data.

Python needs to know what *kind* of data each value is, because the kind decides what's possible. Adding two numbers means arithmetic. "Adding" two pieces of text means sticking them together. Same \`+\`, different meaning, decided by the type.

---

## Values and types

Write a value directly in your code and it's called a **literal**:

\`\`\`python
"CyberKhana"   # text
2026           # a whole number
3.5            # a number with a decimal point
True           # a yes/no value
\`\`\`

Python attaches a type to each one automatically. Ask it with the built-in \`type()\`:

\`\`\`python
print(type("CyberKhana"))
print(type(2026))
\`\`\`

**Output:**
\`\`\`
<class 'str'>
<class 'int'>
\`\`\`

\`str\` is text (a *string*), \`int\` is a whole number (an *integer*). "class" appears because in Python every value is an **object**, and its type is the class it came from. Nothing to worry about yet — just notice the vocabulary.

---

## The type belongs to the value

This is the idea to hold on to. In some languages you declare "this box holds integers, forever." Python doesn't. The type lives on **the value**, and a name can point at any value:

\`\`\`python
x = "text"
print(type(x))   # <class 'str'>
x = 99
print(type(x))   # <class 'int'>
\`\`\`

\`x\` didn't change type — \`x\` was pointed at a different value, and that value has its own type. This is called **dynamic typing**.

It's why Python feels quick to write. It's also why a whole class of mistakes only shows up when the line actually runs:

\`\`\`python
port = "8080"      # text that looks like a number
print(port + 1)    # TypeError, at runtime
\`\`\`

Nothing warns you in advance. Knowing what type you're holding is your job — which is exactly why \`type()\` is worth knowing on day one.

---

## Try It

Run the starter code. Watch the last two lines: the same name reports two different types, because it's pointing at two different values.
`,
    },

    /* ── 2. Data Types Overview (lesson) ── */
    {
      id: 'py-data-types',
      slug: 'data-types',
      title: { en: 'Data Types Overview', ar: 'نظرة على أنواع البيانات' },
      order: 2,
      type: 'lesson',
      starterCode: `# The types you will use constantly
text    = "CyberKhana"        # str
whole   = 2026                # int
decimal = 3.5                 # float
flag    = True                # bool
items   = ["nmap", "burp"]    # list  — ordered, changeable
point   = (10, 20)            # tuple — ordered, fixed
unique  = {"a", "b", "a"}     # set   — no duplicates
person  = {"name": "Sara"}    # dict  — key: value
nothing = None                # NoneType

for value in [text, whole, decimal, flag, items, point, unique, person, nothing]:
    print(type(value).__name__, "->", value)
`,
      markdownContent: `# Data Types Overview

A map of the types you'll meet. Each gets its own module later — the goal now is recognition, not mastery.

---

## The simple types

\`\`\`python
text    = "CyberKhana"   # str   — text
whole   = 2026           # int   — whole number
decimal = 3.5            # float — number with a decimal point
flag    = True           # bool  — True or False
nothing = None           # NoneType — "no value"
\`\`\`

**\`str\`** holds text, in quotes. **\`int\`** is a whole number, with no size limit in Python. **\`float\`** has a decimal point. Note \`3.0\` is a float and \`3\` is an int — the decimal point is the whole difference.

**\`bool\`** is only ever \`True\` or \`False\` (capitalised — \`true\` is a \`NameError\`). It's what every comparison produces.

**\`None\`** is Python's "nothing here." Not \`0\`, not \`""\` — those are values. \`None\` is the absence of one, which is a genuinely different thing.

---

## The collection types

These hold several values at once:

\`\`\`python
items  = ["nmap", "burp"]      # list  — ordered, changeable
point  = (10, 20)              # tuple — ordered, fixed
unique = {"a", "b", "a"}       # set   — unordered, no duplicates
person = {"name": "Sara"}      # dict  — key -> value
\`\`\`

**\`list\`** — square brackets. Ordered and changeable; your everyday collection.

**\`tuple\`** — parentheses. Like a list, but **cannot be changed** after creation. Use it for things that shouldn't shift, like a coordinate.

**\`set\`** — curly braces. **Discards duplicates** automatically, and has no order. \`{"a", "b", "a"}\` holds two items.

**\`dict\`** — curly braces with \`key: value\` pairs. Look things up by name instead of position. Probably the most-used structure in Python.

Both \`set\` and \`dict\` use \`{}\`. The pairs are what make it a dict.

---

## Checking a type

\`type()\` returns the class; \`.__name__\` gets just the readable name:

\`\`\`python
print(type("hi"))            # <class 'str'>
print(type("hi").__name__)   # str
\`\`\`

To *test* a type, prefer \`isinstance()\`:

\`\`\`python
isinstance(2026, int)   # True
\`\`\`

---

## Try It

Run the starter code — it prints each value with its type name. Look at \`unique\`: you wrote three items and got two, because a set drops the duplicate.
`,
    },

    /* ── 3. Variables (lesson) ── */
    {
      id: 'py-variables-intro',
      slug: 'variables',
      title: { en: 'Variables', ar: 'المتغيرات' },
      order: 3,
      type: 'lesson',
      starterCode: `# Create a variable: name = value
name = "CyberKhana"
year = 2026

print("Platform:", name)
print("Year:", year)

# A variable is a name pointing at a value.
a = "first"
b = a          # b points at the same value
a = "second"   # a is re-pointed; b is untouched
print("a =", a)
print("b =", b)
`,
      markdownContent: `# Variables

A **variable** is a name for a value, so you can use it later without repeating it.

---

## Creating one

\`\`\`python
name = "CyberKhana"
year = 2026
\`\`\`

No keyword, no type declaration — just \`name = value\`. The \`=\` is the **assignment operator**: it takes the value on the right and binds the name on the left to it.

It is not equality. \`=\` assigns; \`==\` compares. Mixing them up is a rite of passage.

Once bound, the name stands in for the value:

\`\`\`python
print("Year:", year)   # Year: 2026
\`\`\`

Use a name you never assigned and Python stops:

\`\`\`python
print(city)   # NameError: name 'city' is not defined
\`\`\`

---

## A name is a label, not a box

"A variable is a box holding a value" is the usual first explanation, and it will mislead you soon. A Python variable is a **label attached to a value**.

Why it matters:

\`\`\`python
a = "first"
b = a          # b labels the same value as a
a = "second"   # a now labels a different value
print(a)       # second
print(b)       # first
\`\`\`

\`b = a\` didn't copy anything and didn't tie \`b\` to \`a\`. It pointed \`b\` at the value \`a\` had *at that moment*. Re-pointing \`a\` afterwards has nothing to do with \`b\`.

Hold that picture. When we reach lists — which *can* be changed in place — this same rule produces results that look surprising until you remember: names label values.

---

## Why bother

\`\`\`python
print("Report for CyberKhana")
print("Welcome to CyberKhana")
\`\`\`

Rename the platform and you must find every copy. With a variable there's one place to change, and the name says what the value *means* — \`retries\` explains itself where a bare \`3\` doesn't.

---

## Try It

Run the starter code. The last two lines are the point: \`a\` and \`b\` end up different, because \`b = a\` copied a *reference*, not a promise.
`,
    },

    /* ── 4. Naming and Reassigning (lesson) ── */
    {
      id: 'py-variables-naming',
      slug: 'naming-and-reassigning',
      title: { en: 'Naming and Reassigning', ar: 'التسمية وإعادة الإسناد' },
      order: 4,
      type: 'lesson',
      starterCode: `# snake_case is the Python convention
scan_count = 0
target_host = "10.0.0.5"

# Reassigning — including based on the old value
scan_count = scan_count + 1
scan_count += 1              # shorthand for the same thing
print("scans:", scan_count)

# Assign several names at once
host, port = "10.0.0.5", 8080
print(host, port)

# Swap without a temporary variable
a, b = 1, 2
a, b = b, a
print("a =", a, "| b =", b)
`,
      markdownContent: `# Naming and Reassigning

---

## The rules

A variable name **must**:

- start with a letter or an underscore — not a digit
- contain only letters, digits and underscores
- avoid Python's reserved keywords

\`\`\`python
user_name = "Sara"    # fine
_private  = 1         # fine
name2     = "Ali"     # fine

2name = "x"           # SyntaxError — starts with a digit
user-name = "x"       # SyntaxError — '-' is a minus sign
class = "x"           # SyntaxError — 'class' is a keyword
\`\`\`

Names are **case-sensitive**: \`name\`, \`Name\` and \`NAME\` are three different variables.

To see the reserved words:

\`\`\`python
import keyword
print(keyword.kwlist)
\`\`\`

---

## The conventions

Not enforced, but universal in Python code:

- **\`snake_case\`** for variables and functions — \`scan_count\`, not \`scanCount\`.
- **\`UPPER_CASE\`** for constants — \`MAX_RETRIES = 3\`.
- **Descriptive over short** — \`timeout_seconds\` beats \`t\`. You'll read code far more than you write it.

Also: don't shadow built-ins. \`list = [1, 2]\` works, and then \`list("abc")\` breaks, because you replaced the built-in \`list\`. Same for \`str\`, \`type\`, \`id\`, \`input\`.

---

## Reassigning

A variable can be re-pointed at any time, to any type:

\`\`\`python
count = 0
count = "zero"   # legal — dynamic typing
\`\`\`

Legal, but usually a bad idea: a name that changes type mid-script is hard to follow.

The common case is updating a value from itself:

\`\`\`python
scan_count = scan_count + 1
scan_count += 1              # identical, shorter
\`\`\`

The right side is evaluated **first**, then the name is re-bound to the result. \`+=\`, \`-=\`, \`*=\`, \`/=\` all follow this pattern.

---

## Assigning several at once

\`\`\`python
host, port = "10.0.0.5", 8080
\`\`\`

Python pairs them left-to-right. The counts must match, or you get a \`ValueError\`.

This gives you the neatest swap in any language:

\`\`\`python
a, b = b, a
\`\`\`

The right side is fully evaluated before either assignment happens, so no temporary variable is needed.

You can also chain:

\`\`\`python
x = y = 0   # both names point at 0
\`\`\`

---

## Try It

Run the starter code. Then try \`class = 1\` and read the \`SyntaxError\` — Python names the exact problem.
`,
    },

    /* ── 5. Escape Sequences (lesson) ── */
    {
      id: 'py-escape-sequences',
      slug: 'escape-sequences',
      title: { en: 'Escape Sequences', ar: 'محارف الهروب' },
      order: 5,
      type: 'lesson',
      starterCode: `# \\n starts a new line
print("Line one\\nLine two")

# \\t inserts a tab — handy for columns
print("Name\\tPort")
print("ssh\\t22")

# Escaping quotes and backslashes
print("She said \\"hello\\"")
print('It\\'s fine')
print("C:\\\\Users\\\\Sara")

# A raw string takes backslashes literally
print(r"C:\\Users\\Sara")
`,
      markdownContent: `# Escape Sequences

Some characters can't simply be typed inside a string. A newline would end the line; a quote would end the string. An **escape sequence** — a backslash plus a letter — represents them instead.

---

## The common ones

| Sequence | Meaning |
|---|---|
| \`\\n\` | newline |
| \`\\t\` | tab |
| \`\\\\\` | a literal backslash |
| \`\\"\` | a double quote |
| \`\\'\` | a single quote |

\`\`\`python
print("Line one\\nLine two")
\`\`\`

**Output:**
\`\`\`
Line one
Line two
\`\`\`

That's **one** string. The \`\\n\` isn't two characters in the output — it's one newline character. \`\\t\` works the same way and is useful for lining up columns.

---

## Quotes

A string ends at the matching quote, so a quote inside needs care:

\`\`\`python
print("She said "hello"")     # SyntaxError
print("She said \\"hello\\"")   # escape it
print('She said "hello"')     # or use the other quote style
\`\`\`

The last one is usually cleanest: if your text contains double quotes, wrap it in single quotes. Escape only when you need both.

---

## Backslashes

A backslash starts an escape, so a literal one must be doubled:

\`\`\`python
print("C:\\\\Users\\\\Sara")   # C:\\Users\\Sara
\`\`\`

This bites on Windows paths and regular expressions, which are full of backslashes. Hence **raw strings** — prefix \`r\` and backslashes lose their special meaning:

\`\`\`python
print(r"C:\\Users\\Sara")   # C:\\Users\\Sara
\`\`\`

Same output, far more readable. Reach for \`r"..."\` whenever backslashes are data rather than instructions.

---

## Try It

Run the starter code and compare the last two lines: the escaped version and the raw version print identically, but one is much easier to read.
`,
    },

    /* ── 6. Concatenation (lesson) ── */
    {
      id: 'py-concatenation',
      slug: 'concatenation',
      title: { en: 'Concatenation', ar: 'الدمج' },
      order: 6,
      type: 'lesson',
      starterCode: `first = "Cyber"
second = "Khana"

# + joins strings
print(first + second)
print(first + " " + second)

# * repeats a string
print("-" * 20)

# Numbers must be converted first
year = 2026
print("Year: " + str(year))

# print() with commas needs no conversion — it adds spaces itself
print("Year:", year)
`,
      markdownContent: `# Concatenation

**Concatenation** is joining strings end to end.

---

## The + operator

\`\`\`python
first = "Cyber"
second = "Khana"
print(first + second)          # CyberKhana
print(first + " " + second)    # Cyber Khana
\`\`\`

\`+\` joins exactly what you give it — no spaces added. If you want one, include it.

## The * operator

Multiplying a string by an integer repeats it:

\`\`\`python
print("-" * 20)    # --------------------
print("ab" * 3)    # ababab
\`\`\`

A quick way to draw a separator line.

---

## The type trap

This is the error you will hit today:

\`\`\`python
year = 2026
print("Year: " + year)
\`\`\`

\`\`\`
TypeError: can only concatenate str (not "int") to str
\`\`\`

\`+\` means "add" for numbers and "join" for strings. Given one of each, Python won't guess — it refuses. Convert explicitly with \`str()\`:

\`\`\`python
print("Year: " + str(year))   # Year: 2026
\`\`\`

The same in reverse: \`"5" + 5\` fails, and \`"5" * 3\` gives \`"555"\`, not \`15\`.

---

## Three ways to build a line

\`\`\`python
year = 2026
print("Year: " + str(year))   # concatenation — needs str()
print("Year:", year)          # commas — converts, adds a space
print(f"Year: {year}")        # f-string — converts, full control
\`\`\`

All print \`Year: 2026\`. The comma form is easiest for quick output but always puts a space between values. The **f-string** is what you'll use in real code — the Strings module covers it properly.

Concatenation is still worth knowing: it's the clearest way to see that types don't mix silently in Python.

---

## Try It

Run the starter code. Then delete the \`str()\` on the \`"Year: " + str(year)\` line and read the \`TypeError\` — it names both types it was given.
`,
    },

    /* ── 7. Challenge: Profile Card ── */
    {
      id: 'py-variables-challenge',
      slug: 'variables-challenge',
      title: { en: 'Challenge: Profile Card', ar: 'تحدي: بطاقة الملف الشخصي' },
      order: 7,
      type: 'challenge',
      starterCode: `# Build a profile card.
#
# 1. Create these variables:
#      name  = "Sara"
#      role  = "Analyst"
#      level = 3
#
# 2. Print exactly this, using those variables:
#
#    ==============
#    Name:  Sara
#    Role:  Analyst
#    Level: 3
#    ==============
#
# The == line is 14 '=' characters — build it with * rather than typing it.
# Use a tab (\\t) nowhere here; the labels are padded with plain spaces.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Prints the card with the border, labels and values',
          expectedOutput:
            '==============\nName:  Sara\nRole:  Analyst\nLevel: 3\n==============',
        },
      ],
      hints: [
        'Store the three values first, then print. "=" * 14 gives you the border line.',
        'Level is a number, so "Level: " + level fails — either use str(level) or print("Level:", level).',
        'Note the padding: "Name:" and "Role:" are followed by two spaces so the values line up under "Level: ".',
      ],
      solution: `name = "Sara"
role = "Analyst"
level = 3

border = "=" * 14
print(border)
print("Name:  " + name)
print("Role:  " + role)
print("Level: " + str(level))
print(border)
`,
      markdownContent: `# Challenge: Profile Card

Put the module together: variables, concatenation, repetition and type conversion.

---

## Instructions

Create three variables:

\`\`\`python
name  = "Sara"
role  = "Analyst"
level = 3
\`\`\`

Then print **exactly** this:

\`\`\`
==============
Name:  Sara
Role:  Analyst
Level: 3
==============
\`\`\`

## Rules

- The border is **14** \`=\` characters. Build it with \`*\`, don't type them out.
- The values must come from the variables, not be retyped as literals.
- Watch the spacing: \`Name:\` and \`Role:\` are followed by **two** spaces, \`Level:\` by **one**, so the values align.
- \`level\` is an \`int\` — joining it to a string with \`+\` needs \`str()\`.

## What you need

Assignment, \`+\`, \`*\`, and \`str()\` — everything from this module.

---

Click **Submit** when ready. The **Hint** button is there if the alignment fights you.
`,
    },
  ],
};

export default variables;
