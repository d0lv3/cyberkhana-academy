import type { ProgrammingModule } from '../types';

const variables: ProgrammingModule = {
  id: 'py-variables',
  slug: 'variables',
  title: {
    en: 'Variables & Data Types',
    ar: 'المتغيرات وأنواع البيانات',
  },
  description: {
    en: 'Store and manipulate data using variables, and understand Python\'s core data types.',
    ar: 'تخزين البيانات ومعالجتها باستخدام المتغيرات، وفهم أنواع البيانات الأساسية في بايثون.',
  },
  order: 2,
  concepts: [
    /* ── 1. Variables (lesson) ── */
    {
      id: 'py-variables-intro',
      slug: 'variables',
      title: { en: 'Variables', ar: 'المتغيرات' },
      order: 1,
      type: 'lesson',
      starterCode: `# Creating variables
name = "CyberKhana"
year = 2026
version = 3.5
active = True

# Using variables
print("Platform:", name)
print("Year:", year)
print("Version:", version)
print("Active:", active)

# Reassigning a variable
year = 2027
print("Updated year:", year)
`,
      markdownContent: `# Variables

A **variable** is a name that stores a value. Think of it as a labeled box — you put data in, and retrieve it later by name.

---

## Creating Variables

In Python, you create a variable by using the assignment operator \`=\`:

\`\`\`python
name = "CyberKhana"
age = 5
pi = 3.14159
\`\`\`

No special keyword needed — just \`name = value\`.

---

## Naming Rules

| Rule | Valid | Invalid |
|------|-------|---------|
| Start with letter or \`_\` | \`name\`, \`_count\` | \`2fast\` |
| Letters, digits, \`_\` only | \`user_1\` | \`user-name\` |
| Case-sensitive | \`Name\` ≠ \`name\` | — |
| No Python keywords | \`my_class\` | \`class\`, \`for\` |

**Convention:** Use \`snake_case\` for variable names in Python:

\`\`\`python
user_name = "admin"       # good
max_retries = 5           # good
userLoginCount = 10       # works but not Pythonic
\`\`\`

---

## Reassignment

Variables can be changed at any time:

\`\`\`python
status = "loading"
print(status)       # loading

status = "ready"
print(status)       # ready
\`\`\`

The old value is discarded — the variable now points to the new value.

---

## Try It

Run the starter code. Then try creating your own variables and printing them.
`,
    },

    /* ── 2. Data Types (lesson) ── */
    {
      id: 'py-data-types',
      slug: 'data-types',
      title: { en: 'Data Types', ar: 'أنواع البيانات' },
      order: 2,
      type: 'lesson',
      starterCode: `# Python's core data types
text = "Hello"          # str  (string)
whole = 42              # int  (integer)
decimal = 3.14          # float (decimal number)
flag = True             # bool (boolean)

# Check types with type()
print(type(text))
print(type(whole))
print(type(decimal))
print(type(flag))

# Type conversion
age_str = "25"
age_int = int(age_str)    # string -> integer
print("Age + 1 =", age_int + 1)

price = 19
price_str = str(price)    # integer -> string
print("Price: $" + price_str)
`,
      markdownContent: `# Data Types

Every value in Python has a **type** that determines what operations you can perform on it.

---

## Core Types

| Type | Name | Example | Use Case |
|------|------|---------|----------|
| \`str\` | String | \`"hello"\` | Text, messages, file paths |
| \`int\` | Integer | \`42\` | Whole numbers, counts, ports |
| \`float\` | Float | \`3.14\` | Decimals, percentages |
| \`bool\` | Boolean | \`True\` / \`False\` | Flags, conditions |

---

## Checking Types

Use \`type()\` to see what type a value is:

\`\`\`python
print(type("hello"))   # <class 'str'>
print(type(42))        # <class 'int'>
print(type(3.14))      # <class 'float'>
print(type(True))      # <class 'bool'>
\`\`\`

---

## Type Conversion

Convert between types using the type name as a function:

\`\`\`python
int("42")      # string -> int: 42
float("3.14")  # string -> float: 3.14
str(100)       # int -> string: "100"
bool(1)        # int -> bool: True
bool(0)        # int -> bool: False
\`\`\`

> **Warning:** \`int("hello")\` will crash — you can only convert strings that look like numbers.

---

## String Operations

Strings have special powers:

\`\`\`python
name = "CyberKhana"

print(len(name))          # 10 (length)
print(name.upper())       # CYBERKHANA
print(name.lower())       # cyberkhana
print(name[0])            # C (first character)
print("Cyber" in name)    # True (contains check)
\`\`\`

---

## f-strings (Formatted Strings)

The cleanest way to mix variables into text:

\`\`\`python
name = "Alice"
age = 22
print(f"My name is {name} and I'm {age} years old")
\`\`\`

The \`f\` before the quotes enables \`{variable}\` interpolation.

---

## Try It

Run the starter code, then experiment with \`type()\` and conversions.
`,
    },

    /* ── 3. String Formatting (lesson) ── */
    {
      id: 'py-string-formatting',
      slug: 'string-formatting',
      title: { en: 'String Formatting', ar: 'تنسيق النصوص' },
      order: 3,
      type: 'lesson',
      starterCode: `# f-strings — the modern way
name = "Alice"
score = 95.5
print(f"Student: {name}, Score: {score}%")

# Expressions inside f-strings
a = 10
b = 3
print(f"{a} + {b} = {a + b}")
print(f"{a} / {b} = {a / b:.2f}")   # .2f = 2 decimal places

# Multi-line f-strings
ip = "192.168.1.10"
port = 8080
status = "open"
print(f"""
Server Report:
  IP:     {ip}
  Port:   {port}
  Status: {status.upper()}
""".strip())

# String concatenation (older way)
first = "Cyber"
second = "Khana"
print(first + second)          # CyberKhana
print(first + " " + second)   # Cyber Khana

# String repetition
print("-" * 30)
print("Alert! " * 3)
`,
      markdownContent: `# String Formatting

Combining variables with text is something you'll do constantly. Python gives you several ways to do it.

---

## f-strings (Recommended)

Prefix a string with \`f\` and put variables in curly braces:

\`\`\`python
name = "Alice"
print(f"Hello, {name}!")   # Hello, Alice!
\`\`\`

You can put **any expression** inside the braces:

\`\`\`python
print(f"2 + 2 = {2 + 2}")        # 2 + 2 = 4
print(f"{'hello'.upper()}")       # HELLO
\`\`\`

---

## Format Specifiers

Control how numbers are displayed:

| Specifier | Example | Output |
|-----------|---------|--------|
| \`:.2f\` | \`f"{3.14159:.2f}"\` | \`3.14\` |
| \`:,\` | \`f"{1000000:,}"\` | \`1,000,000\` |
| \`:>10\` | \`f"{'hi':>10}"\` | \`        hi\` |
| \`:05d\` | \`f"{42:05d}"\` | \`00042\` |

---

## Concatenation

Join strings with \`+\`:

\`\`\`python
first = "Cyber"
last = "Khana"
full = first + " " + last   # "Cyber Khana"
\`\`\`

> **Note:** You can't concatenate a string and a number directly — convert the number first: \`"Port: " + str(80)\`

---

## Repetition

Repeat a string with \`*\`:

\`\`\`python
print("-" * 40)      # ----------------------------------------
print("ha" * 3)      # hahaha
\`\`\`

---

## Try It

Run the examples and experiment with f-strings. They're one of Python's most useful features.
`,
    },

    /* ── 4. Variables Challenge ── */
    {
      id: 'py-variables-challenge',
      slug: 'variables-challenge',
      title: { en: 'Challenge: Profile Card', ar: 'تحدي: بطاقة الملف الشخصي' },
      order: 4,
      type: 'challenge',
      starterCode: `# Challenge: Build a profile card
#
# Create these variables:
#   name     -> "Lina"
#   age      -> 21
#   uni      -> "Baghdad University"
#   gpa      -> 3.75
#
# Then print EXACTLY:
#   Name: Lina
#   Age: 21
#   University: Baghdad University
#   GPA: 3.75

# Your code below:
`,
      testCases: [
        {
          id: 'tc-profile',
          description: 'Should print the profile card with correct formatting',
          expectedOutput: 'Name: Lina\nAge: 21\nUniversity: Baghdad University\nGPA: 3.75',
        },
      ],
      hints: [
        'Start by creating four variables: name, age, uni, gpa.',
        'Use f-strings to format each line: f"Name: {name}"',
        'Make sure each field prints on its own line using separate print() calls.',
      ],
      solution: `name = "Lina"
age = 21
uni = "Baghdad University"
gpa = 3.75

print(f"Name: {name}")
print(f"Age: {age}")
print(f"University: {uni}")
print(f"GPA: {gpa}")
`,
      markdownContent: `# Challenge: Profile Card

Build a student profile card using variables and formatted output.

---

## Instructions

1. Create four variables:
   - \`name\` = \`"Lina"\`
   - \`age\` = \`21\`
   - \`uni\` = \`"Baghdad University"\`
   - \`gpa\` = \`3.75\`

2. Print a profile card with **exactly** this output:

\`\`\`
Name: Lina
Age: 21
University: Baghdad University
GPA: 3.75
\`\`\`

## Requirements

- Use variables (don't hardcode the values directly in print)
- Each field on its own line
- Output must match exactly

---

Good luck! Use the **Hint** button if you need help.
`,
    },
  ],
};

export default variables;
