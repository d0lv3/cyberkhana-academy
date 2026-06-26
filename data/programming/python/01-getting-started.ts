import type { ProgrammingModule } from '../types';

const gettingStarted: ProgrammingModule = {
  id: 'py-getting-started',
  slug: 'getting-started',
  title: {
    en: 'Getting Started',
    ar: 'البداية',
  },
  description: {
    en: 'Your first steps with Python — printing output, writing comments, and running programs.',
    ar: 'خطواتك الأولى مع بايثون — طباعة المخرجات، كتابة التعليقات، وتشغيل البرامج.',
  },
  order: 1,
  concepts: [
    /* ── 1. Hello, World! (lesson) ── */
    {
      id: 'py-hello-world',
      slug: 'hello-world',
      title: { en: 'Hello, World!', ar: '!Hello, World' },
      order: 1,
      type: 'lesson',
      starterCode: `# Your first Python program
print("Hello, World!")
`,
      markdownContent: `# Hello, World!

Every programming journey starts here. The \`print()\` function is Python's way of displaying output to the screen.

---

## The print() Function

\`print()\` takes a value and displays it in the terminal:

\`\`\`python
print("Hello, World!")
\`\`\`

**Output:**
\`\`\`
Hello, World!
\`\`\`

You can print text (called **strings**) by wrapping them in quotes — either double \`"\` or single \`'\`:

\`\`\`python
print("Hello, World!")   # double quotes
print('Hello, World!')   # single quotes — same result
\`\`\`

---

## Printing Multiple Things

You can print several values separated by commas:

\`\`\`python
print("Name:", "CyberKhana")
print("Year:", 2026)
\`\`\`

**Output:**
\`\`\`
Name: CyberKhana
Year: 2026
\`\`\`

Python automatically adds a space between comma-separated values.

---

## Multiple print() Calls

Each \`print()\` outputs on a new line:

\`\`\`python
print("Line 1")
print("Line 2")
print("Line 3")
\`\`\`

---

## Try It

The editor on the right has your first program. Click **Run** to see the output.

Then try changing the message inside the quotes and running it again.
`,
    },

    /* ── 2. Comments (lesson) ── */
    {
      id: 'py-comments',
      slug: 'comments',
      title: { en: 'Comments', ar: 'التعليقات' },
      order: 2,
      type: 'lesson',
      starterCode: `# This is a single-line comment — Python ignores it

print("This runs")  # inline comment after code

# You can use comments to explain your logic:
# Calculate the number of seconds in a day
seconds = 60 * 60 * 24
print("Seconds in a day:", seconds)

"""
This is a multi-line comment (docstring).
Useful for longer explanations or
temporarily disabling blocks of code.
"""
`,
      markdownContent: `# Comments

Comments are notes you write in your code that Python **ignores completely**. They're for humans — to explain what the code does and why.

---

## Single-Line Comments

Use the \`#\` symbol. Everything after \`#\` on that line is a comment:

\`\`\`python
# This is a comment
print("Hello")   # This is also a comment
\`\`\`

---

## Multi-Line Comments

For longer notes, use triple quotes (\`"""\` or \`'''\`):

\`\`\`python
"""
This entire block
is a comment.
Python skips it.
"""
\`\`\`

Technically these are "docstrings," but they work the same way when not assigned to anything.

---

## Why Comments Matter

1. **Explain complex logic** — your future self (and teammates) will thank you
2. **Disable code temporarily** — comment out a line instead of deleting it
3. **Document intent** — explain *why*, not just *what*

\`\`\`python
# BAD comment (restates the code):
x = 10  # set x to 10

# GOOD comment (explains the why):
x = 10  # max retry attempts before timeout
\`\`\`

---

## Try It

Run the starter code. Notice that the comments don't appear in the output — only the \`print()\` calls produce output.
`,
    },

    /* ── 3. Your First Challenge ── */
    {
      id: 'py-first-challenge',
      slug: 'first-challenge',
      title: { en: 'Challenge: First Program', ar: 'تحدي: البرنامج الأول' },
      order: 3,
      type: 'challenge',
      starterCode: `# Challenge: Print the following three lines exactly:
#   Python is powerful
#   CyberKhana Academy
#   2026

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Should print "Python is powerful" on the first line',
          expectedOutput: 'Python is powerful\nCyberKhana Academy\n2026',
        },
      ],
      hints: [
        'Use three separate print() calls — one for each line.',
        'Remember: text goes inside quotes, but numbers don\'t need quotes.',
        'print("Python is powerful") gives you the first line.',
      ],
      solution: `print("Python is powerful")
print("CyberKhana Academy")
print(2026)
`,
      markdownContent: `# Challenge: Your First Program

Time to write code on your own!

---

## Instructions

Write a program that prints **exactly** these three lines:

\`\`\`
Python is powerful
CyberKhana Academy
2026
\`\`\`

## Rules

- Each line must be printed exactly as shown
- Use the \`print()\` function
- The number \`2026\` can be printed as a string or as an integer

## What You'll Need

- The \`print()\` function from the previous lesson
- Three separate print statements

---

When you're ready, click **Submit** to check your answer. If you're stuck, use the **Hint** button below the editor.
`,
    },
  ],
};

export default gettingStarted;
