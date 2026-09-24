import type { ProgrammingModule } from '../types';

const gettingStarted: ProgrammingModule = {
  id: 'c-getting-started',
  slug: 'getting-started',
  title: { en: 'Getting Started', ar: 'البداية' },
  description: {
    en: 'Your first C programs, printing output and reading input.',
    ar: 'برامجك الأولى بلغة C، طباعة المخرجات وقراءة المدخلات.',
  },
  order: 1,
  concepts: [
    /* ── 1. Hello, World! (lesson) ── */
    {
      id: 'c-hello-world',
      slug: 'hello-world',
      title: { en: 'Hello, World!', ar: 'مرحبًا بالعالم!' },
      order: 1,
      type: 'lesson',
      starterCode: `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
`,
      markdownContent: { en: `# Hello, World!

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

\`printf\` prints exactly what you give it, it does **not** add a new line on
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
        ar: `# مرحبًا بالعالم!

يبدأ تنفيذ كل برنامج بلغة C من الدالة \`main\`. عند تشغيل البرنامج، تُنفّذ التعليمات داخلها بالترتيب.

---

## بنية البرنامج

\`\`\`c
#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
\`\`\`

- يتيح \`#include <stdio.h>\` استخدام مكتبة الإدخال والإخراج القياسية، ومنها \`printf\`.
- يبدأ التنفيذ من \`int main() { ... }\`.
- تطبع \`printf(...)\` نصًا على الشاشة.
- تشير \`return 0;\` إلى انتهاء البرنامج بنجاح.

## طباعة النصوص

تطبع \`printf\` ما تمرّره إليها كما هو، ولا تضيف سطرًا جديدًا تلقائيًا. أضف \`\\n\` عند الحاجة:

\`\`\`c
printf("Line 1\\n");
printf("Line 2\\n");
\`\`\`

**المخرجات:**
\`\`\`
Line 1
Line 2
\`\`\`

من دون \`\\n\` ستظهر المخرجات كلها في السطر نفسه.

---

## جرّب بنفسك

اضغط **تشغيل** لرؤية المخرجات، ثم غيّر النص بين علامتي الاقتباس وشغّل البرنامج مجددًا.
`,
      },
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
      starterCodeAr: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);

    // المطلوب: اطبع مجموع a وb ثم سطرًا جديدًا

    return 0;
}
`,
      testCases: [
        { id: 'tc-1', description: '3 and 4 → 7', descriptionAr: 'مجموع ٣ و٤ هو ٧', input: '3 4', expectedOutput: '7' },
        { id: 'tc-2', description: '10 and 20 → 30', descriptionAr: 'مجموع ١٠ و٢٠ هو ٣٠', input: '10 20', expectedOutput: '30' },
        { id: 'tc-3', description: 'handles negatives', descriptionAr: 'يتعامل مع الأعداد السالبة', input: '-5 2', expectedOutput: '-3' },
      ],
      hints: [
        'Read the two numbers with scanf, that part is already written for you.',
        'The sum is simply a + b.',
        'printf("%d\\n", a + b); prints the result on its own line.',
      ],
      hintsAr: [
        'اقرأ العددين باستخدام scanf؛ هذا الجزء مكتوب لك مسبقًا.',
        'المجموع هو a + b.',
        'تطبع printf("%d\\n", a + b); الناتج في سطر مستقل.',
      ],
      solution: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}
`,
      markdownContent: { en: `# Challenge: Add Two Numbers

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
        ar: `# تحدٍّ: جمع رقمين

اقرأ عددين صحيحين من المدخلات واطبع **مجموعهما**.

---

## التعليمات

يحتوي الإدخال على عددين يفصل بينهما فراغ، مثل:

\`\`\`
3 4
\`\`\`

اطبع المجموع في سطر مستقل:

\`\`\`
7
\`\`\`

## ما الذي تحتاجه؟

- تقرأ \`scanf("%d %d", &a, &b);\` العددين، وهي موجودة في الشيفرة الابتدائية.
- تطبع \`printf("%d\\n", ...)\` عددًا صحيحًا.
- الرمز \`%d\` موضع مخصص لقيمة من النوع \`int\`.

---

اضغط **تسليم** لتشغيل برنامجك على حالات الاختبار. إذا احتجت مساعدة، استخدم زر **تلميح**.
`,
      },
    },
  ],
};

export default gettingStarted;
