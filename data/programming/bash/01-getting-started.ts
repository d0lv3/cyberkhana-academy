import type { ProgrammingModule } from '../types';

const gettingStarted: ProgrammingModule = {
  id: 'bash-getting-started',
  slug: 'getting-started',
  title: { en: 'Getting Started', ar: 'البداية' },
  description: {
    en: 'Your first shell scripts — printing text, variables, and arithmetic.',
    ar: 'نصوصك البرمجية الأولى — طباعة النصوص، المتغيرات، والحساب.',
  },
  order: 1,
  concepts: [
    /* ── 1. Echo & Variables (lesson) ── */
    {
      id: 'bash-echo-variables',
      slug: 'echo-variables',
      title: { en: 'Echo & Variables', ar: 'echo والمتغيرات' },
      order: 1,
      type: 'lesson',
      starterCode: `# echo prints a line of text
echo "Hello from Bash!"

# Variables — note: NO spaces around the =
name="CyberKhana"
echo "Welcome to $name"

# Arithmetic goes inside $(( ))
echo $(( 6 * 7 ))
`,
      markdownContent: `# Echo & Variables

Bash is the language of the terminal — you write commands, and the shell runs
them top to bottom. Let's cover the two things you'll use constantly.

---

## Printing with \`echo\`

\`echo\` prints a line of text:

\`\`\`bash
echo "Hello from Bash!"
\`\`\`

---

## Variables

Assign a value with \`=\`. **Do not put spaces around it** — \`name = "x"\` is an
error in Bash.

\`\`\`bash
name="CyberKhana"
echo "Welcome to $name"
\`\`\`

Put a \`$\` in front of a variable name to read its value. Inside **double
quotes**, variables are expanded; inside **single quotes** they are not.

---

## Arithmetic

Math goes inside \`$(( ))\`:

\`\`\`bash
echo $(( 6 * 7 ))      # 42
count=5
echo $(( count + 1 ))  # 6
\`\`\`

---

## Try It

Click **Run**. Then change the name, or the numbers in the \`$(( ))\`, and run
it again.
`,
    },

    /* ── 2. Add Two Numbers (challenge) ── */
    {
      id: 'bash-sum-two',
      slug: 'sum-two',
      title: { en: 'Challenge: Add Two Numbers', ar: 'تحدي: جمع رقمين' },
      order: 2,
      type: 'challenge',
      starterCode: `# The input has two numbers on one line, e.g. "3 4".
# 'read a b' puts the first in $a and the second in $b.

read a b

# TODO: print the sum of a and b
`,
      testCases: [
        { id: 'tc-1', description: '3 and 4 → 7', input: '3 4', expectedOutput: '7' },
        { id: 'tc-2', description: '10 and 20 → 30', input: '10 20', expectedOutput: '30' },
        { id: 'tc-3', description: 'handles zero', input: '0 5', expectedOutput: '5' },
      ],
      hints: [
        'read a b puts the first number in $a and the second in $b.',
        'Arithmetic goes inside $(( )).',
        'echo $(( a + b )) prints the sum.',
      ],
      solution: `read a b
echo $(( a + b ))
`,
      markdownContent: `# Challenge: Add Two Numbers

Read two whole numbers from the input and print their **sum**.

---

## Instructions

The input contains two numbers separated by a space, for example:

\`\`\`
3 4
\`\`\`

Your script should print their sum on its own line:

\`\`\`
7
\`\`\`

## What You'll Need

- \`read a b\` — reads a line and splits it into \`$a\` and \`$b\` (already written).
- \`$(( a + b ))\` — evaluates the arithmetic.
- \`echo\` — prints the result.

---

Click **Submit** to run your script against the test cases. Stuck? Use the
**Hint** button.
`,
    },
  ],
};

export default gettingStarted;
