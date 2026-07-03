import type { ProgrammingModule } from '../types';

const gettingStarted: ProgrammingModule = {
  id: 'c-getting-started',
  slug: 'getting-started',
  title: { en: 'Getting Started', ar: 'البداية' },
  description: {
    en: 'Your first C programs — printing output and reading input.',
    ar: 'برامجك الأولى بلغة C — طباعة المخرجات وقراءة المدخلات.',
  },
  order: 1,
  concepts: [
    /* ── 1. Hello, World! (lesson) ── */
    {
      id: 'c-hello-world',
      slug: 'hello-world',
      title: { en: 'Hello, World!', ar: '!Hello, World' },
      order: 1,
      type: 'lesson',
      starterCode: `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
`,
      markdownContent: `# Hello, World!

Every C program starts from a function called \`main\`. When you run the
program, the code inside \`main\` runs from top to bottom.

---

## The Structure

\`\`\`c
#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
\`\`\`

- \`#include <stdio.h>\` pulls in the **standard input/output** library, which
  gives you \`printf\`.
- \`int main() { ... }\` is where execution begins.
- \`printf(...)\` prints text to the screen.
- \`return 0;\` tells the system the program finished successfully.

---

## Printing Text

\`printf\` prints exactly what you give it — it does **not** add a new line on
its own. You add one with \`\\n\`:

\`\`\`c
printf("Line 1\\n");
printf("Line 2\\n");
\`\`\`

**Output:**
\`\`\`
Line 1
Line 2
\`\`\`

Without the \`\\n\`, everything prints on the same line.

---

## Try It

Click **Run** to see the output. Then change the message inside the quotes and
run it again.
`,
    },

    /* ── 2. Add Two Numbers (challenge) ── */
    {
      id: 'c-sum-two',
      slug: 'sum-two',
      title: { en: 'Challenge: Add Two Numbers', ar: 'تحدي: جمع رقمين' },
      order: 2,
      type: 'challenge',
      starterCode: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);

    // TODO: print the sum of a and b, followed by a new line

    return 0;
}
`,
      testCases: [
        { id: 'tc-1', description: '3 and 4 → 7', input: '3 4', expectedOutput: '7' },
        { id: 'tc-2', description: '10 and 20 → 30', input: '10 20', expectedOutput: '30' },
        { id: 'tc-3', description: 'handles negatives', input: '-5 2', expectedOutput: '-3' },
      ],
      hints: [
        'Read the two numbers with scanf — that part is already written for you.',
        'The sum is simply a + b.',
        'printf("%d\\n", a + b); prints the result on its own line.',
      ],
      solution: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}
`,
      markdownContent: `# Challenge: Add Two Numbers

Read two whole numbers from the input and print their **sum**.

---

## Instructions

The input contains two numbers separated by a space, for example:

\`\`\`
3 4
\`\`\`

Your program should print their sum on its own line:

\`\`\`
7
\`\`\`

## What You'll Need

- \`scanf("%d %d", &a, &b);\` reads the two numbers (already in the starter code).
- \`printf("%d\\n", ...)\` prints an integer.
- \`%d\` is the placeholder for an \`int\`.

---

Click **Submit** to run your code against the test cases. Stuck? Use the
**Hint** button.
`,
    },
  ],
};

export default gettingStarted;
