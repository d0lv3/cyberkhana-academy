import type { ProgrammingModule } from '../types';

const listsTuples: ProgrammingModule = {
  id: 'py-lists-tuples',
  slug: 'lists-tuples',
  title: {
    en: 'Lists & Tuples',
    ar: 'القوائم والصفوف',
  },
  description: {
    en: 'Ordered collections, building lists, changing them, the method toolkit, and why tuples exist.',
    ar: 'المجموعات المرتبة، إنشاء القوائم وتعديلها، الدوال، ولماذا توجد الصفوف.',
  },
  order: 5,
  concepts: [
    /* ── 1. Lists ── */
    {
      id: 'py-lists-intro',
      slug: 'lists-intro',
      title: { en: 'Lists', ar: 'القوائم' },
      order: 1,
      type: 'lesson',
      starterCode: `tools = ["nmap", "burp", "wireshark"]

print(tools)
print(len(tools))
print(tools[0])
print(tools[-1])
print(tools[0:2])

# A list can hold mixed types
mixed = ["sara", 21, True, 3.5]
print(mixed)

# Nested lists
grid = [[1, 2], [3, 4]]
print(grid[1][0])

# Unlike strings, lists CAN be changed in place
tools[0] = "nmap-ng"
print(tools)

print("burp" in tools)
`,
      markdownContent: {
        en: `# Lists

A **list** is an ordered, changeable collection. It's the workhorse container in Python.

---

## Creating one

Square brackets, comma-separated:

\`\`\`python
tools = ["nmap", "burp", "wireshark"]
empty = []
\`\`\`

A list can hold **any** types, mixed:

\`\`\`python
mixed = ["sara", 21, True, 3.5]
\`\`\`

Allowed, and usually a smell, a list normally means "many of the same kind of thing." Mixed types are what dictionaries and classes are for.

Lists can nest:

\`\`\`python
grid = [[1, 2], [3, 4]]
grid[1][0]   # 3, row 1, then item 0
\`\`\`

---

## It's a sequence, so you already know it

A list is a sequence, exactly like a string. Everything from the Strings module transfers:

\`\`\`python
len(tools)      # 3
tools[0]        # 'nmap'
tools[-1]       # 'wireshark'
tools[0:2]      # ['nmap', 'burp']
"burp" in tools # True
\`\`\`

Indexing from 0, negatives from the right, slices excluding the end, \`in\` for membership. Learn the sequence rules once and they apply everywhere.

Slicing a list returns a **list**; indexing returns **one item**:

\`\`\`python
tools[0]     # 'nmap'    , a string
tools[0:1]   # ['nmap']  , a list holding one string
\`\`\`

---

## The big difference: lists are mutable

Strings are immutable. Lists are **not**:

\`\`\`python
tools[0] = "nmap-ng"   # works
\`\`\`

The same line on a string is a \`TypeError\`. This single difference drives everything else:

- List methods usually **change the list and return \`None\`**, where string methods return a new string.
- Two names can point at one list, and a change through one is visible through the other.

That second point is where the surprises live, the next lesson is about exactly that.

---

## Try It

Run the starter code. Note \`tools[0] = "nmap-ng"\` really did modify the list. Then try the same on a string and watch it refuse.
`,
        ar: `# القوائم

**القائمة (list)** مجموعة مرتبة وقابلة للتغيير. وهي الحاوية التي تحمل عبء العمل في بايثون.

---

## إنشاء قائمة

أقواس مربعة، والعناصر مفصولة بفواصل:

\`\`\`python
tools = ["nmap", "burp", "wireshark"]
empty = []
\`\`\`

وتستطيع القائمة أن تحمل **أي** أنواع مختلطة:

\`\`\`python
mixed = ["sara", 21, True, 3.5]
\`\`\`

مسموح، وهو غالبا مؤشر على خلل في التصميم، فالقائمة تعني عادة "أشياء كثيرة من النوع نفسه". أما الأنواع المختلطة فالقواميس والأصناف هي المخصصة لها.

ويمكن تعشيش القوائم:

\`\`\`python
grid = [[1, 2], [3, 4]]
grid[1][0]   # 3, row 1, then item 0
\`\`\`

---

## هي متتالية، فأنت تعرفها أصلا

القائمة متتالية تماما كالنص. فكل ما في وحدة النصوص ينتقل إليها:

\`\`\`python
len(tools)      # 3
tools[0]        # 'nmap'
tools[-1]       # 'wireshark'
tools[0:2]      # ['nmap', 'burp']
"burp" in tools # True
\`\`\`

الفهرسة من 0، والسالبة من اليمين، والشرائح تستثني النهاية، و\`in\` للانتماء. تعلم قواعد المتتاليات مرة واحدة فتنطبق في كل مكان.

وتقطيع القائمة يعيد **قائمة**، أما الفهرسة فتعيد **عنصرا واحدا**:

\`\`\`python
tools[0]     # 'nmap'    , a string
tools[0:1]   # ['nmap']  , a list holding one string
\`\`\`

---

## الفارق الكبير: القوائم قابلة للتغيير

النصوص غير قابلة للتغيير. أما القوائم فـ **قابلة**:

\`\`\`python
tools[0] = "nmap-ng"   # works
\`\`\`

والسطر نفسه على نص يعطي \`TypeError\`. وهذا الفارق وحده يقود كل ما تبقى:

- توابع القوائم عادة **تغير القائمة وتعيد \`None\`**، بينما توابع النصوص تعيد نصا جديدا.
- يستطيع اسمان أن يشيرا إلى قائمة واحدة، فيظهر التغيير عبر أحدهما في الآخر.

والنقطة الثانية هي موطن المفاجآت، والدرس التالي عنها بالضبط.

---

## جربها

شغل الشيفرة الابتدائية. ولاحظ أن \`tools[0] = "nmap-ng"\` عدلت القائمة فعلا. ثم جرب الشيء نفسه على نص وراقب رفضه.
`,
      },
    },

    /* ── 2. List Methods: Adding and Removing ── */
    {
      id: 'py-lists-methods-add',
      slug: 'list-methods-adding',
      title: { en: 'List Methods: Adding & Removing', ar: 'دوال القوائم: الإضافة والحذف' },
      order: 2,
      type: 'lesson',
      starterCode: `tools = ["nmap", "burp"]

tools.append("wireshark")      # add one, at the end
print(tools)

tools.insert(0, "metasploit")  # add at a position
print(tools)

tools.extend(["sqlmap", "hydra"])   # add MANY
print(tools)

# append vs extend
a = [1, 2]
a.append([3, 4])
print(a)
b = [1, 2]
b.extend([3, 4])
print(b)

# Removing
tools.remove("burp")      # by value (first match)
print(tools)
last = tools.pop()        # by position, returns it
print(last, "|", tools)

# Methods change the list and return None
result = tools.append("x")
print(result)
`,
      markdownContent: {
        en: `# List Methods: Adding & Removing

---

## Adding

\`\`\`python
tools.append("wireshark")        # one item, at the end
tools.insert(0, "metasploit")    # one item, at an index
tools.extend(["sqlmap", "hydra"])  # many items
\`\`\`

\`append()\` is the one you'll use most. \`insert()\` takes the index to insert *before*, so \`insert(0, x)\` puts \`x\` first.

## append vs extend

The distinction that catches everyone:

\`\`\`python
a = [1, 2]
a.append([3, 4])
print(a)            # [1, 2, [3, 4]]   <- ONE new item, a list

b = [1, 2]
b.extend([3, 4])
print(b)            # [1, 2, 3, 4]     <- TWO new items
\`\`\`

\`append\` adds its argument **as a single item**, whatever it is. \`extend\` **loops** over its argument and adds each element. So \`extend("ab")\` adds \`'a'\` and \`'b'\`, because a string is iterable, which is rarely what you meant.

\`+\` also joins lists, but builds a **new** one:

\`\`\`python
c = [1, 2] + [3, 4]   # new list; the originals are untouched
\`\`\`

---

## Removing

\`\`\`python
tools.remove("burp")   # by VALUE, first match only
last = tools.pop()     # by POSITION, removes and RETURNS it
first = tools.pop(0)   # from an index
del tools[0]           # by position, returns nothing
tools.clear()          # empty it
\`\`\`

\`remove()\` raises \`ValueError\` if the value isn't there, so check with \`in\` first when it might not be.

\`pop()\` is the only remover that **hands the item back**, that's what makes it useful:

\`\`\`python
task = queue.pop(0)   # take the next job off the front
\`\`\`

---

## Methods return None

Say this out loud, because it's the #1 list mistake:

\`\`\`python
result = tools.append("x")
print(result)   # None
\`\`\`

\`append()\` changed the list **in place** and returned \`None\`. So this destroys your data:

\`\`\`python
tools = tools.append("x")   # tools is now None
\`\`\`

It's the exact opposite of strings, where you *must* assign the result. The rule:

- **Strings** are immutable → methods **return** a new string → assign it.
- **Lists** are mutable → methods **change** the list → don't assign.

---

## Try It

Run the starter code. Compare the \`append([3, 4])\` and \`extend([3, 4])\` outputs, and note the final \`None\`.
`,
        ar: `# توابع القوائم: الإضافة والحذف

---

## الإضافة

\`\`\`python
tools.append("wireshark")        # one item, at the end
tools.insert(0, "metasploit")    # one item, at an index
tools.extend(["sqlmap", "hydra"])  # many items
\`\`\`

التابع \`append()\` هو ما ستستعمله أكثر من غيره. أما \`insert()\` فيأخذ الفهرس الذي تريد الإدراج *قبله*، فـ \`insert(0, x)\` تضع \`x\` أولا.

## append مقابل extend

الفرق الذي يوقع الجميع:

\`\`\`python
a = [1, 2]
a.append([3, 4])
print(a)            # [1, 2, [3, 4]]   <- ONE new item, a list

b = [1, 2]
b.extend([3, 4])
print(b)            # [1, 2, 3, 4]     <- TWO new items
\`\`\`

يضيف \`append\` وسيطه **كعنصر واحد** مهما كان. أما \`extend\` **فيمر** على وسيطه ويضيف كل عنصر فيه. لذلك تضيف \`extend("ab")\` المحرف \`'a'\` والمحرف \`'b'\`، لأن النص قابل للتكرار عليه، وهذا نادرا ما يكون مقصودك.

والعامل \`+\` يصل القوائم أيضا، لكنه يبني قائمة **جديدة**:

\`\`\`python
c = [1, 2] + [3, 4]   # new list; the originals are untouched
\`\`\`

---

## الحذف

\`\`\`python
tools.remove("burp")   # by VALUE, first match only
last = tools.pop()     # by POSITION, removes and RETURNS it
first = tools.pop(0)   # from an index
del tools[0]           # by position, returns nothing
tools.clear()          # empty it
\`\`\`

يرفع \`remove()\` خطأ \`ValueError\` إن لم تكن القيمة موجودة، فتحقق بـ \`in\` أولا حين يحتمل غيابها.

والتابع \`pop()\` هو الوحيد بين أدوات الحذف الذي **يعيد العنصر إليك**، وهذا ما يجعله مفيدا:

\`\`\`python
task = queue.pop(0)   # take the next job off the front
\`\`\`

---

## التوابع تعيد None

قل هذا بصوت مرتفع، فهو الخطأ الأول في التعامل مع القوائم:

\`\`\`python
result = tools.append("x")
print(result)   # None
\`\`\`

غير \`append()\` القائمة **في مكانها** وأعاد \`None\`. لذلك يدمر هذا السطر بياناتك:

\`\`\`python
tools = tools.append("x")   # tools is now None
\`\`\`

وهو عكس النصوص تماما، حيث *يجب* أن تسند النتيجة. والقاعدة:

- **النصوص** غير قابلة للتغيير، فتوابعها **تعيد** نصا جديدا، فأسنده.
- **القوائم** قابلة للتغيير، فتوابعها **تغير** القائمة، فلا تسند.

---

## جربها

شغل الشيفرة الابتدائية. وقارن مخرجات \`append([3, 4])\` و\`extend([3, 4])\`، ولاحظ \`None\` في النهاية.
`,
      },
    },

    /* ── 3. List Methods: Ordering and Copying ── */
    {
      id: 'py-lists-methods-order',
      slug: 'list-methods-ordering',
      title: { en: 'List Methods: Ordering & Copying', ar: 'دوال القوائم: الترتيب والنسخ' },
      order: 3,
      type: 'lesson',
      starterCode: `nums = [3, 1, 2]

# sort() changes the list; sorted() returns a new one
nums.sort()
print(nums)
print(sorted([3, 1, 2], reverse=True))

original = [3, 1, 2]
print(sorted(original), original)   # original untouched

# Sort by a rule
words = ["banana", "fig", "apple"]
print(sorted(words, key=len))

nums.reverse()
print(nums)
print(nums.count(2), nums.index(2))

# The aliasing trap
a = [1, 2, 3]
b = a          # SAME list, two names
b.append(4)
print(a)

# A real copy
c = a.copy()
c.append(5)
print(a, c)
`,
      markdownContent: {
        en: `# List Methods: Ordering & Copying

---

## sort() vs sorted()

Both order items; the difference is what they touch:

\`\`\`python
nums = [3, 1, 2]
nums.sort()            # changes nums, returns None
print(nums)            # [1, 2, 3]

sorted([3, 1, 2])      # returns a NEW list, original untouched
\`\`\`

\`sort()\` is a list method that mutates. \`sorted()\` is a **built-in function** that works on any iterable, including strings and tuples, and always hands back a new list.

Use \`sorted()\` when you need the original intact; \`sort()\` when you don't.

Both take the same options:

\`\`\`python
sorted([3, 1, 2], reverse=True)      # [3, 2, 1]
sorted(["banana", "fig"], key=len)   # shortest first
\`\`\`

\`key\` takes a **function**, applied to each item to decide its rank. \`key=len\` sorts by length; \`key=str.lower\` sorts text case-insensitively. Note \`len\` with no parentheses, you're passing the function, not calling it.

Mixed types won't sort: \`sorted([1, "a"])\` raises \`TypeError\`, because Python won't guess whether \`1\` comes before \`"a"\`.

## reverse, count, index

\`\`\`python
nums.reverse()    # flips in place, returns None
nums.count(2)     # how many 2s
nums.index(2)     # position of the first 2, ValueError if absent
\`\`\`

\`nums[::-1]\` also reverses, but returns a **new** list instead of mutating.

---

## The aliasing trap

This is the most important idea in the module:

\`\`\`python
a = [1, 2, 3]
b = a
b.append(4)
print(a)   # [1, 2, 3, 4]  <- a changed too!
\`\`\`

\`b = a\` did **not** copy the list. It gave the same list a second name, remember from Variables: names label values. There is one list here, and \`a\` and \`b\` both point at it.

Strings hid this from you: they're immutable, so you can never observe it. Lists can be changed, so you can.

To get a genuine copy:

\`\`\`python
c = a.copy()     # clearest
c = a[:]         # a full slice, same effect
c = list(a)      # also works
\`\`\`

Now \`c\` is a separate list and changing it leaves \`a\` alone.

**One caveat:** these are **shallow** copies. The new list is new, but the items inside are still shared. For a list of lists, the inner lists are not copied:

\`\`\`python
grid = [[1, 2], [3, 4]]
copy = grid.copy()
copy[0].append(99)
print(grid)   # [[1, 2, 99], [3, 4]] , the inner list is shared
\`\`\`

For that, use \`copy.deepcopy()\`. It rarely comes up, but when it does, this is why.

---

## Try It

Run the starter code. The two blocks at the end are the lesson: \`b = a\` leaks changes, \`a.copy()\` doesn't.
`,
        ar: `# توابع القوائم: الترتيب والنسخ

---

## sort() مقابل sorted()

كلاهما يرتب العناصر، والفرق فيما يمسه كل منهما:

\`\`\`python
nums = [3, 1, 2]
nums.sort()            # changes nums, returns None
print(nums)            # [1, 2, 3]

sorted([3, 1, 2])      # returns a NEW list, original untouched
\`\`\`

فـ \`sort()\` تابع قائمة يغيرها. و\`sorted()\` **دالة مدمجة** تعمل على أي كائن قابل للتكرار، بما فيه النصوص والصفوف، وتسلمك دائما قائمة جديدة.

استعمل \`sorted()\` حين تحتاج الأصل سليما، و\`sort()\` حين لا تحتاجه.

وكلاهما يأخذ الخيارات نفسها:

\`\`\`python
sorted([3, 1, 2], reverse=True)      # [3, 2, 1]
sorted(["banana", "fig"], key=len)   # shortest first
\`\`\`

والوسيط \`key\` يأخذ **دالة** تطبق على كل عنصر لتحديد رتبته. فـ \`key=len\` يرتب حسب الطول، و\`key=str.lower\` يرتب النص دون حساسية لحالة الأحرف. ولاحظ \`len\` بلا أقواس، فأنت تمرر الدالة لا تستدعيها.

والأنواع المختلطة لا ترتب: فـ \`sorted([1, "a"])\` يرفع \`TypeError\`، لأن بايثون لن تخمن هل يأتي \`1\` قبل \`"a"\`.

## reverse و count و index

\`\`\`python
nums.reverse()    # flips in place, returns None
nums.count(2)     # how many 2s
nums.index(2)     # position of the first 2, ValueError if absent
\`\`\`

والتعبير \`nums[::-1]\` يعكس أيضا، لكنه يعيد قائمة **جديدة** بدل أن يغير الأصل.

---

## فخ الأسماء المتعددة

هذه أهم فكرة في الوحدة:

\`\`\`python
a = [1, 2, 3]
b = a
b.append(4)
print(a)   # [1, 2, 3, 4]  <- a changed too!
\`\`\`

السطر \`b = a\` **لم** ينسخ القائمة. بل أعطى القائمة نفسها اسما ثانيا، وتذكر من وحدة المتغيرات: الأسماء لصاقات على القيم. فهناك قائمة واحدة هنا، ويشير إليها كل من \`a\` و\`b\`.

وقد أخفت عنك النصوص هذا الأمر: فهي غير قابلة للتغيير، فلا يمكنك ملاحظته أبدا. أما القوائم فتتغير، فتستطيع ملاحظته.

وللحصول على نسخة حقيقية:

\`\`\`python
c = a.copy()     # clearest
c = a[:]         # a full slice, same effect
c = list(a)      # also works
\`\`\`

الآن صار \`c\` قائمة منفصلة، وتغييرها يترك \`a\` وشأنه.

**وهناك تحفظ واحد:** هذه نسخ **سطحية (shallow)**. فالقائمة الجديدة جديدة، لكن العناصر بداخلها ما زالت مشتركة. ففي قائمة من القوائم لا تنسخ القوائم الداخلية:

\`\`\`python
grid = [[1, 2], [3, 4]]
copy = grid.copy()
copy[0].append(99)
print(grid)   # [[1, 2, 99], [3, 4]] , the inner list is shared
\`\`\`

ولهذه الحالة استعمل \`copy.deepcopy()\`. وهي نادرة الحدوث، لكن حين تحدث فهذا هو سببها.

---

## جربها

شغل الشيفرة الابتدائية. الكتلتان في النهاية هما الدرس: \`b = a\` يسرب التغييرات، و\`a.copy()\` لا يفعل.
`,
      },
    },

    /* ── 4. Tuples ── */
    {
      id: 'py-tuples-intro',
      slug: 'tuples-intro',
      title: { en: 'Tuples', ar: 'الصفوف' },
      order: 4,
      type: 'lesson',
      starterCode: `point = (10, 20)

print(point, len(point), point[0])
print(point[0:1])

# Immutable, this fails
# point[0] = 99   # TypeError

# A one-item tuple NEEDS the comma
one = (5,)
not_a_tuple = (5)
print(type(one).__name__, type(not_a_tuple).__name__)

# Parentheses are optional; the comma makes the tuple
t = 1, 2, 3
print(t)

# Unpacking
host, port = ("10.0.0.5", 8080)
print(host, port)

# Which is why swapping works
a, b = 1, 2
a, b = b, a
print(a, b)

print(list(point), tuple([1, 2]))
`,
      markdownContent: {
        en: `# Tuples

A **tuple** is an ordered collection that **cannot be changed** after creation. A list you can't edit.

---

## Creating one

\`\`\`python
point = (10, 20)
\`\`\`

Everything you know about sequences applies, \`len()\`, indexing, slicing, \`in\`, looping:

\`\`\`python
point[0]     # 10
point[0:1]   # (10,) , slicing a tuple gives a tuple
\`\`\`

What's missing is any way to change it:

\`\`\`python
point[0] = 99   # TypeError: 'tuple' object does not support item assignment
\`\`\`

No \`append\`, no \`remove\`, no \`sort\`. Only two methods, \`count()\` and \`index()\`, because the rest would mutate.

---

## The comma is what matters

Two gotchas worth memorising.

**A single-item tuple needs a trailing comma:**

\`\`\`python
one = (5,)          # tuple
not_a_tuple = (5)   # just the int 5, the parens are grouping
\`\`\`

**The parentheses are optional:**

\`\`\`python
t = 1, 2, 3   # a tuple
\`\`\`

It's the **comma** that builds a tuple, not the brackets. That explains a lot of Python that otherwise looks like magic, like a function returning \`return x, y\` (one tuple) and this:

\`\`\`python
a, b = b, a
\`\`\`

The right side builds the tuple \`(b, a)\`, then it's unpacked into \`a, b\`. That's the whole trick.

## Unpacking

\`\`\`python
host, port = ("10.0.0.5", 8080)
\`\`\`

The counts must match or you get a \`ValueError\`. Use \`*\` to absorb the rest:

\`\`\`python
first, *rest = (1, 2, 3)   # first=1, rest=[2, 3]
\`\`\`

---

## Why tuples exist

If a list does more, why use a tuple?

1. **Intent.** A tuple says "these belong together and won't change", a coordinate, an RGB colour, a host/port pair. The reader learns that for free.
2. **Safety.** It can't be modified by accident, including by a function you passed it to.
3. **They can be dict keys.** Lists can't, that's the practical reason. Dictionary keys must be immutable, so \`{("10.0.0.5", 80): "http"}\` works and a list key raises \`TypeError\`.

Rule of thumb: many of the same thing, changing → **list**. A few related things, fixed → **tuple**.

Convert freely:

\`\`\`python
list((1, 2))   # [1, 2]
tuple([1, 2])  # (1, 2)
\`\`\`

---

## Try It

Run the starter code. Note \`(5,)\` is a tuple and \`(5)\` is an int, that comma is the entire difference.
`,
        ar: `# الصفوف

**الصف (tuple)** مجموعة مرتبة **لا يمكن تغييرها** بعد إنشائها. أي قائمة لا تستطيع تحريرها.

---

## إنشاء صف

\`\`\`python
point = (10, 20)
\`\`\`

وكل ما تعرفه عن المتتاليات ينطبق عليه، من \`len()\` والفهرسة والتقطيع و\`in\` والتكرار:

\`\`\`python
point[0]     # 10
point[0:1]   # (10,) , slicing a tuple gives a tuple
\`\`\`

والمفقود هو أي وسيلة لتغييره:

\`\`\`python
point[0] = 99   # TypeError: 'tuple' object does not support item assignment
\`\`\`

لا \`append\` ولا \`remove\` ولا \`sort\`. وله تابعان فقط هما \`count()\` و\`index()\`، لأن البقية كانت ستغيره.

---

## الفاصلة هي المهمة

مزلقان يستحقان الحفظ.

**الصف ذو العنصر الواحد يحتاج فاصلة في آخره:**

\`\`\`python
one = (5,)          # tuple
not_a_tuple = (5)   # just the int 5, the parens are grouping
\`\`\`

**والأقواس اختيارية:**

\`\`\`python
t = 1, 2, 3   # a tuple
\`\`\`

فـ **الفاصلة** هي التي تبني الصف لا الأقواس. وهذا يفسر كثيرا من بايثون الذي يبدو لولاه سحرا، كدالة تعيد \`return x, y\` (صف واحد)، وكهذا السطر:

\`\`\`python
a, b = b, a
\`\`\`

فالطرف الأيمن يبني الصف \`(b, a)\`، ثم يفكك إلى \`a, b\`. وهذه هي الحيلة كلها.

## التفكيك

\`\`\`python
host, port = ("10.0.0.5", 8080)
\`\`\`

ويجب أن يتطابق العددان وإلا حصلت على \`ValueError\`. واستعمل \`*\` لامتصاص الباقي:

\`\`\`python
first, *rest = (1, 2, 3)   # first=1, rest=[2, 3]
\`\`\`

---

## لماذا وجدت الصفوف

إن كانت القائمة تفعل أكثر، فلماذا نستعمل الصف؟

1. **النية.** الصف يقول "هذه أشياء متلازمة ولن تتغير"، كإحداثية، أو لون RGB، أو زوج مضيف ومنفذ. ويتعلم القارئ ذلك مجانا.
2. **الأمان.** لا يمكن تعديله بالخطأ، ولا حتى من دالة مررته إليها.
3. **يصلح مفتاحا للقاموس.** والقوائم لا تصلح، وهذا هو السبب العملي. فمفاتيح القواميس يجب أن تكون غير قابلة للتغيير، لذلك يعمل \`{("10.0.0.5", 80): "http"}\` بينما يرفع المفتاح من نوع قائمة \`TypeError\`.

وقاعدة عامة: أشياء كثيرة من النوع نفسه وتتغير، فاستعمل **list**. وأشياء قليلة مترابطة وثابتة، فاستعمل **tuple**.

والتحويل بينهما حر:

\`\`\`python
list((1, 2))   # [1, 2]
tuple([1, 2])  # (1, 2)
\`\`\`

---

## جربها

شغل الشيفرة الابتدائية. ولاحظ أن \`(5,)\` صف وأن \`(5)\` عدد صحيح، فتلك الفاصلة هي الفرق كله.
`,
      },
    },

    /* ── 5. Challenge: Top Ports ── */
    {
      id: 'py-ch-top-ports',
      slug: 'challenge-top-ports',
      title: { en: 'Challenge: Port Report', ar: 'تحدي: تقرير المنافذ' },
      order: 5,
      type: 'challenge',
      starterCode: `scan = [443, 22, 8080, 22, 80, 443, 22]

# Print exactly:
#
#   Total: 7
#   Unique sorted: [22, 80, 443, 8080]
#   Most common: 22 (3 times)
#   Highest: 8080
#
# Rules:
#   - Do not hard-code any of the numbers.
#   - "Unique sorted" must be a sorted list with no duplicates.
#   - "Most common" is the port appearing most often; use .count().
#   - Leave the original scan list unchanged.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Reports total, unique sorted ports, the most common, and the highest',
          expectedOutput:
            'Total: 7\nUnique sorted: [22, 80, 443, 8080]\nMost common: 22 (3 times)\nHighest: 8080',
        },
      ],
      hints: [
        'len(scan) gives the total. set(scan) drops duplicates, and sorted() turns it back into an ordered list.',
        'max(scan) gives the highest port. For the most common, max() accepts a key: max(unique, key=scan.count) picks the item with the biggest count.',
        'Use sorted(set(scan)) rather than scan.sort(), so the original list stays unchanged as the rules require.',
      ],
      solution: `scan = [443, 22, 8080, 22, 80, 443, 22]

total = len(scan)
unique = sorted(set(scan))
most_common = max(unique, key=scan.count)
highest = max(scan)

print(f"Total: {total}")
print(f"Unique sorted: {unique}")
print(f"Most common: {most_common} ({scan.count(most_common)} times)")
print(f"Highest: {highest}")
`,
      markdownContent: {
        en: `# Challenge: Port Report

Summarising a scan result, the kind of thing you'll write constantly.

---

## Instructions

Starting from:

\`\`\`python
scan = [443, 22, 8080, 22, 80, 443, 22]
\`\`\`

print **exactly**:

\`\`\`
Total: 7
Unique sorted: [22, 80, 443, 8080]
Most common: 22 (3 times)
Highest: 8080
\`\`\`

## Rules

- Don't hard-code any number, derive everything from \`scan\`.
- **Unique sorted** must have duplicates removed and be in ascending order.
- **Most common** is the port that appears most often, with its count.
- Leave \`scan\` itself **unchanged**, so prefer \`sorted()\` over \`.sort()\`.

## What you need

\`len()\`, \`sorted()\`, \`max()\`, \`.count()\`, and f-strings.

Two nudges:

- \`set()\` removes duplicates in one step (Module 6 covers sets properly, here just use it).
- \`max()\` takes a \`key\`, exactly like \`sorted()\`. \`max(unique, key=scan.count)\` returns the item with the highest count.

---

Click **Submit** when ready.
`,
        ar: `# تحد: تقرير المنافذ

تلخيص نتيجة فحص، وهو من النوع الذي ستكتبه باستمرار.

---

## التعليمات

انطلاقا من:

\`\`\`python
scan = [443, 22, 8080, 22, 80, 443, 22]
\`\`\`

اطبع هذا **بالضبط**:

\`\`\`
Total: 7
Unique sorted: [22, 80, 443, 8080]
Most common: 22 (3 times)
Highest: 8080
\`\`\`

## القواعد

- لا تكتب أي عدد ثابتا، بل اشتق كل شيء من \`scan\`.
- يجب أن تكون **Unique sorted** خالية من التكرار ومرتبة تصاعديا.
- و**Most common** هو المنفذ الأكثر ظهورا، مع عدد مرات ظهوره.
- اترك \`scan\` نفسها **دون تغيير**، ففضل \`sorted()\` على \`.sort()\`.

## ما تحتاجه

\`len()\`، و\`sorted()\`، و\`max()\`، و\`.count()\`، وf-strings.

وتلميحان:

- الدالة \`set()\` تزيل التكرار في خطوة واحدة (والوحدة 6 تغطي المجموعات كما ينبغي، فاكتف باستعمالها هنا).
- والدالة \`max()\` تأخذ \`key\` تماما مثل \`sorted()\`. فـ \`max(unique, key=scan.count)\` تعيد العنصر صاحب أعلى عدد.

---

اضغط **Submit** حين تجهز.
`,
      },
    },
  ],
};

export default listsTuples;
