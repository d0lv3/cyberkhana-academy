import type { ProgrammingModule } from '../types';

const gettingStarted: ProgrammingModule = {
  id: 'bash-getting-started',
  slug: 'getting-started',
  title: { en: 'Getting Started', ar: 'البداية' },
  description: {
    en: 'Your first shell scripts, printing text, variables, and arithmetic.',
    ar: 'نصوصك البرمجية الأولى، طباعة النصوص، المتغيرات، والحساب.',
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

# Variables, note: NO spaces around the =
name="CyberKhana"
echo "Welcome to $name"

# Arithmetic goes inside $(( ))
echo $(( 6 * 7 ))
`,
      starterCodeAr: `# يطبع echo سطرًا من النص
echo "Hello from Bash!"

# لا تضع فراغات حول علامة = عند إسناد قيمة لمتغير
name="CyberKhana"
echo "Welcome to $name"

# تُكتب العمليات الحسابية داخل $(( ))
echo $(( 6 * 7 ))
`,
      markdownContent: { en: `# Echo & Variables

Bash is the language of the terminal, you write commands, and the shell runs
them top to bottom. Let's cover the two things you'll use constantly.

---

## Printing with \`echo\`

\`echo\` prints a line of text:

\`\`\`bash
echo "Hello from Bash!"
\`\`\`

---

## Variables

Assign a value with \`=\`. **Do not put spaces around it**, \`name = "x"\` is an
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
        ar: `# echo والمتغيرات

Bash لغة أوامر الطرفية. تكتب الأوامر، وتنفذها الصدفة بالترتيب. لنبدأ بالطباعة والمتغيرات.

---

## الطباعة باستخدام echo

يطبع \`echo\` سطرًا من النص:

\`\`\`bash
echo "Hello from Bash!"
\`\`\`

## المتغيرات

أسند قيمة باستخدام \`=\`. **لا تضع فراغات حوله**؛ فالصيغة \`name = "x"\` تُعد خطأ في Bash.

\`\`\`bash
name="CyberKhana"
echo "Welcome to $name"
\`\`\`

ضع \`$\` قبل اسم المتغير لقراءة قيمته. تُوسَّع المتغيرات داخل علامتي الاقتباس **المزدوجتين**، ولا تُوسَّع داخل علامتي الاقتباس **المفردتين**.

## الحساب

تُكتب العمليات الحسابية داخل \`$(( ))\`:

\`\`\`bash
echo $(( 6 * 7 ))      # 42
count=5
echo $(( count + 1 ))  # 6
\`\`\`

---

## جرّب بنفسك

اضغط **تشغيل**، ثم غيّر الاسم أو الأعداد داخل \`$(( ))\` وشغّل النص البرمجي مجددًا.
`,
      },
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
      starterCodeAr: `# يحتوي الإدخال على عددين في سطر واحد، مثل "3 4".
# يضع read a b العدد الأول في $a والثاني في $b.

read a b

# المطلوب: اطبع مجموع a وb
`,
      testCases: [
        { id: 'tc-1', description: '3 and 4 → 7', descriptionAr: 'مجموع ٣ و٤ هو ٧', input: '3 4', expectedOutput: '7' },
        { id: 'tc-2', description: '10 and 20 → 30', descriptionAr: 'مجموع ١٠ و٢٠ هو ٣٠', input: '10 20', expectedOutput: '30' },
        { id: 'tc-3', description: 'handles zero', descriptionAr: 'يتعامل مع الصفر', input: '0 5', expectedOutput: '5' },
      ],
      hints: [
        'read a b puts the first number in $a and the second in $b.',
        'Arithmetic goes inside $(( )).',
        'echo $(( a + b )) prints the sum.',
      ],
      hintsAr: [
        'يضع read a b العدد الأول في $a والثاني في $b.',
        'اكتب العملية الحسابية داخل $(( )).',
        'يطبع echo $(( a + b )) المجموع.',
      ],
      solution: `read a b
echo $(( a + b ))
`,
      markdownContent: { en: `# Challenge: Add Two Numbers

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

- \`read a b\`, reads a line and splits it into \`$a\` and \`$b\` (already written).
- \`$(( a + b ))\`, evaluates the arithmetic.
- \`echo\`, prints the result.

---

Click **Submit** to run your script against the test cases. Stuck? Use the
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

- يقرأ \`read a b\` السطر ويضع العددين في \`$a\` و\`$b\`؛ وهو موجود في الشيفرة الابتدائية.
- يحسب \`$(( a + b ))\` المجموع.
- يطبع \`echo\` الناتج.

---

اضغط **تسليم** لتشغيل النص البرمجي على حالات الاختبار. إذا احتجت مساعدة، استخدم زر **تلميح**.
`,
      },
    },
  ],
};

export default gettingStarted;
