import type { ProgrammingModule } from '../types';

const gettingStarted: ProgrammingModule = {
  id: 'cpp-getting-started',
  slug: 'getting-started',
  title: { en: 'Getting Started', ar: 'البداية' },
  description: {
    en: 'Your first C++ programs — printing output with cout and reading input with cin.',
    ar: 'برامجك الأولى بلغة C++‎ — طباعة المخرجات بـ cout وقراءة المدخلات بـ cin.',
  },
  order: 1,
  concepts: [
    /* ── 1. Hello, World! (lesson) ── */
    {
      id: 'cpp-hello-world',
      slug: 'hello-world',
      title: { en: 'Hello, World!', ar: '!Hello, World' },
      order: 1,
      type: 'lesson',
      starterCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
`,
      markdownContent: `# Hello, World!

Every C++ program starts from a function called \`main\`. When you run the
program, the code inside \`main\` runs from top to bottom.

---

## The Structure

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
\`\`\`

- \`#include <iostream>\` pulls in the **input/output stream** library, which
  gives you \`cout\` and \`cin\`.
- \`using namespace std;\` lets you write \`cout\` instead of the longer
  \`std::cout\`. **Keep this line** — the in-browser runner used by this course
  needs the short form.
- \`int main() { ... }\` is where execution begins.
- \`cout << ...\` sends text to the screen. The \`<<\` is the **stream insertion
  operator** — think of it as an arrow pointing into the output.
- \`return 0;\` tells the system the program finished successfully.

---

## Printing Text

\`cout\` prints exactly what you give it — it does **not** add a new line on its
own. You end a line with \`endl\`:

\`\`\`cpp
cout << "Line 1" << endl;
cout << "Line 2" << endl;
\`\`\`

**Output:**
\`\`\`
Line 1
Line 2
\`\`\`

Without the \`endl\`, everything prints on the same line. \`"\n"\` inside the
string does the same job:

\`\`\`cpp
cout << "Line 1\n";
\`\`\`

---

## Chaining

One \`cout\` can print several things in a row — just keep adding \`<<\`:

\`\`\`cpp
int n = 7;
cout << "n is " << n << endl;
\`\`\`

**Output:**
\`\`\`
n is 7
\`\`\`

---

## Try It

Click **Run** to see the output. Then change the message inside the quotes and
run it again.
`,
    },

    /* ── 2. Add Two Numbers (challenge) ── */
    {
      id: 'cpp-sum-two',
      slug: 'sum-two',
      title: { en: 'Challenge: Add Two Numbers', ar: 'تحدي: جمع رقمين' },
      order: 2,
      type: 'challenge',
      starterCode: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;

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
        'Read the two numbers with cin — that part is already written for you.',
        'The sum is simply a + b.',
        'cout << a + b << endl; prints the result on its own line.',
      ],
      solution: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
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

- \`cin >> a >> b;\` reads the two numbers (already in the starter code). The
  \`>>\` is the **stream extraction operator** — an arrow pointing out of the
  input and into your variables.
- \`cout << ... << endl;\` prints a value and ends the line.
- Unlike C, you do not need a \`%d\` placeholder — \`cout\` works out the type
  for you.

---

Click **Submit** to run your code against the test cases. Stuck? Use the
**Hint** button.
`,
    },
  ],
};

export default gettingStarted;
