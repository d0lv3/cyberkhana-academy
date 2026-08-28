import type { ProgrammingModule } from '../types';

const setsDicts: ProgrammingModule = {
  id: 'py-sets-dicts',
  slug: 'sets-dicts',
  title: {
    en: 'Sets & Dictionaries',
    ar: 'المجموعات والقواميس',
  },
  description: {
    en: 'Sets for uniqueness and comparison, dictionaries for looking things up by name.',
    ar: 'المجموعات للتفرد والمقارنة، والقواميس للبحث بالاسم.',
  },
  order: 6,
  concepts: [
    /* ── 1. Sets ── */
    {
      id: 'py-sets-intro',
      slug: 'sets-intro',
      title: { en: 'Sets', ar: 'المجموعات' },
      order: 1,
      type: 'lesson',
      starterCode: `# Duplicates disappear
ports = {80, 443, 80, 22}
print(ports, len(ports))

# The everyday use: dedupe a list
scan = [443, 22, 8080, 22, 443]
print(sorted(set(scan)))

# An EMPTY set needs set(), not {}
print(type({}).__name__)
print(type(set()).__name__)

# No indexing, a set has no order
# print(ports[0])   # TypeError

# Membership is the superpower
print(443 in ports)

# Items must be immutable
ok = {(1, 2), "text", 3}
print(len(ok))
# bad = {[1, 2]}   # TypeError: unhashable type: 'list'
`,
      markdownContent: {
        en: `# Sets

A **set** is an unordered collection with **no duplicates**.

---

## Creating one

Curly braces, or \`set()\` from any iterable:

\`\`\`python
ports = {80, 443, 80, 22}
print(ports)        # {80, 443, 22}
print(len(ports))   # 3 , the duplicate 80 is gone
\`\`\`

You didn't remove the duplicate; a set simply can't hold one.

**An empty set needs \`set()\`.** \`{}\` is an empty **dictionary**, dicts claimed the braces first:

\`\`\`python
type({})      # dict
type(set())   # set
\`\`\`

---

## What you give up

**No order**, so **no indexing**:

\`\`\`python
ports[0]   # TypeError: 'set' object is not subscriptable
\`\`\`

There's no "first" item in a set. If you need order, use a list, or \`sorted(my_set)\`, which returns a list.

**Items must be immutable** (technically, *hashable*):

\`\`\`python
{(1, 2), "text", 3}   # fine, tuple, str, int
{[1, 2]}              # TypeError: unhashable type: 'list'
\`\`\`

This is the practical reason tuples exist. A set finds items by their hash, and a value that can change would break that.

---

## What you gain

**Deduplication in one step**, the most common use by far:

\`\`\`python
scan = [443, 22, 8080, 22, 443]
sorted(set(scan))   # [22, 443, 8080]
\`\`\`

\`set()\` drops duplicates, \`sorted()\` gives back an ordered list. You wrote this in the last challenge.

**Fast membership.** \`x in my_set\` is dramatically faster than \`x in my_list\` for large collections, the set jumps straight to the answer, while the list checks items one by one. With a million items that's the difference between instant and a noticeable wait.

If your code asks "have I seen this before?" a lot, visited URLs, scanned hosts, seen hashes, a set is the right structure.

---

## Try It

Run the starter code. Note \`type({})\` is \`dict\`, not \`set\`, the mistake everyone makes once.
`,
        ar: `# المجموعات

**المجموعة (set)** حاوية غير مرتبة **بلا تكرار**.

---

## إنشاء مجموعة

بأقواس معقوفة، أو بـ \`set()\` من أي كائن قابل للتكرار:

\`\`\`python
ports = {80, 443, 80, 22}
print(ports)        # {80, 443, 22}
print(len(ports))   # 3 , the duplicate 80 is gone
\`\`\`

أنت لم تحذف المكرر، فالمجموعة ببساطة لا تستطيع حمله.

**والمجموعة الفارغة تحتاج \`set()\`.** فـ \`{}\` **قاموس** فارغ، إذ سبقت القواميس إلى الأقواس المعقوفة:

\`\`\`python
type({})      # dict
type(set())   # set
\`\`\`

---

## ما الذي تتنازل عنه

**لا ترتيب**، ومن ثم **لا فهرسة**:

\`\`\`python
ports[0]   # TypeError: 'set' object is not subscriptable
\`\`\`

فلا يوجد عنصر "أول" في المجموعة. وإن احتجت الترتيب فاستعمل قائمة، أو \`sorted(my_set)\` التي تعيد قائمة.

**والعناصر يجب أن تكون غير قابلة للتغيير** (وتقنيا: *قابلة للتجزئة*):

\`\`\`python
{(1, 2), "text", 3}   # fine, tuple, str, int
{[1, 2]}              # TypeError: unhashable type: 'list'
\`\`\`

وهذا هو السبب العملي لوجود الصفوف. فالمجموعة تجد عناصرها بقيمة التجزئة (hash)، والقيمة القابلة للتغير كانت ستكسر ذلك.

---

## ما الذي تكسبه

**إزالة التكرار في خطوة واحدة**، وهو الاستعمال الأشيع بفارق كبير:

\`\`\`python
scan = [443, 22, 8080, 22, 443]
sorted(set(scan))   # [22, 443, 8080]
\`\`\`

تسقط \`set()\` المكرر، وتعيد \`sorted()\` قائمة مرتبة. وقد كتبت هذا في التحدي السابق.

**واختبار انتماء سريع.** فـ \`x in my_set\` أسرع بمراحل من \`x in my_list\` في المجموعات الكبيرة، إذ تقفز المجموعة إلى الجواب مباشرة بينما تفحص القائمة العناصر واحدا واحدا. ومع مليون عنصر يكون الفرق بين الفوري والانتظار الملحوظ.

فإن كانت شيفرتك تسأل كثيرا "هل رأيت هذا من قبل؟"، كالروابط المزارة، أو المضيفين الممسوحين، أو البصمات المرصودة، فالمجموعة هي البنية الصحيحة.

---

## جربها

شغل الشيفرة الابتدائية. ولاحظ أن \`type({})\` هو \`dict\` لا \`set\`، وهو الخطأ الذي يقع فيه الجميع مرة واحدة.
`,
      },
    },

    /* ── 2. Set Methods: Changing ── */
    {
      id: 'py-sets-methods-change',
      slug: 'set-methods-changing',
      title: { en: 'Set Methods: Changing', ar: 'دوال المجموعات: التعديل' },
      order: 2,
      type: 'lesson',
      starterCode: `ports = {80, 443}

ports.add(22)          # one item
print(ports)

ports.add(80)          # already there, no error, no change
print(ports)

ports.update([8080, 3306])   # many
print(ports)

ports.discard(3306)    # remove; silent if missing
ports.discard(9999)    # no error
print(ports)

ports.remove(8080)     # remove; KeyError if missing
print(ports)

got = ports.pop()      # removes an ARBITRARY item
print("popped:", got)

ports.clear()
print(ports, len(ports))
`,
      markdownContent: {
        en: `# Set Methods: Changing

Sets are mutable, so, like lists, these methods change the set and return \`None\`.

---

## Adding

\`\`\`python
ports.add(22)                # one item
ports.update([8080, 3306])   # many
\`\`\`

\`add()\` on something already present does **nothing**, no error, no duplicate. That's the point: adding is idempotent, so you never need to check first.

\`update()\` is the set's \`extend\`: it loops over its argument. So \`update("ab")\` adds \`'a'\` and \`'b'\`, not \`"ab"\`.

## Removing

\`\`\`python
ports.discard(3306)   # remove if present, silent if not
ports.remove(8080)    # remove, KeyError if not present
ports.pop()           # remove an ARBITRARY item, and return it
ports.clear()         # empty it
\`\`\`

\`discard\` vs \`remove\` is the only real decision:

- **\`discard()\`**, "make sure it's gone." Missing is fine.
- **\`remove()\`**, "take this out." Missing is a bug, so it raises.

Choose the one that matches what a missing value would *mean*. Same reasoning as \`find()\` vs \`index()\` on strings.

\`pop()\` removes an **arbitrary** item, not the first, a set has no first. It's for "give me any one," and raises \`KeyError\` on an empty set.

---

## Try It

Run the starter code. \`add(80)\` when 80 is already there changes nothing, and \`discard(9999)\` on a missing value raises nothing. Swap in \`remove(9999)\` to see the \`KeyError\`.
`,
        ar: `# توابع المجموعات: التغيير

المجموعات قابلة للتغيير، لذلك فهذه التوابع، كتوابع القوائم، تغير المجموعة وتعيد \`None\`.

---

## الإضافة

\`\`\`python
ports.add(22)                # one item
ports.update([8080, 3306])   # many
\`\`\`

واستدعاء \`add()\` على عنصر موجود أصلا **لا يفعل شيئا**، لا خطأ ولا تكرار. وهذا هو المقصود: فالإضافة عملية متكررة الأثر (idempotent)، فلا تحتاج أبدا إلى التحقق أولا.

والتابع \`update()\` هو \`extend\` الخاص بالمجموعة: فهو يمر على وسيطه. لذلك تضيف \`update("ab")\` المحرف \`'a'\` والمحرف \`'b'\` لا النص \`"ab"\`.

## الحذف

\`\`\`python
ports.discard(3306)   # remove if present, silent if not
ports.remove(8080)    # remove, KeyError if not present
ports.pop()           # remove an ARBITRARY item, and return it
ports.clear()         # empty it
\`\`\`

والاختيار بين \`discard\` و\`remove\` هو القرار الحقيقي الوحيد:

- **\`discard()\`** تعني "تأكد من أنه اختفى". والغياب مقبول.
- **\`remove()\`** تعني "أخرج هذا". والغياب خلل، لذلك ترفع خطأ.

اختر ما يطابق ما *يعنيه* غياب القيمة. وهو المنطق نفسه بين \`find()\` و\`index()\` في النصوص.

والتابع \`pop()\` يحذف عنصرا **عشوائيا** لا الأول، فالمجموعة لا أول لها. وهو مخصص لـ "أعطني أي واحد"، ويرفع \`KeyError\` على مجموعة فارغة.

---

## جربها

شغل الشيفرة الابتدائية. فـ \`add(80)\` حين يكون 80 موجودا أصلا لا يغير شيئا، و\`discard(9999)\` على قيمة غائبة لا يرفع شيئا. ضع \`remove(9999)\` مكانه لترى \`KeyError\`.
`,
      },
    },

    /* ── 3. Set Methods: Comparing ── */
    {
      id: 'py-sets-methods-compare',
      slug: 'set-methods-comparing',
      title: { en: 'Set Methods: Comparing', ar: 'دوال المجموعات: المقارنة' },
      order: 3,
      type: 'lesson',
      starterCode: `expected = {22, 80, 443}
found = {22, 443, 8080}

print(found | expected)   # union, in either
print(found & expected)   # intersection, in both
print(found - expected)   # difference, in found, not expected
print(expected - found)   # the other direction: missing
print(found ^ expected)   # symmetric difference, in one, not both

# Method names do the same jobs
print(found.union(expected))
print(found.intersection(expected))

# Relationships
print({22, 80} <= expected)          # subset
print(expected >= {22, 80})          # superset
print({1, 2}.isdisjoint({3, 4}))     # nothing in common
`,
      markdownContent: {
        en: `# Set Methods: Comparing

This is where sets stop being "lists without duplicates" and start earning their place. You can compare two sets in one operation.

---

## The four operations

\`\`\`python
expected = {22, 80, 443}
found    = {22, 443, 8080}

found | expected   # {22, 80, 443, 8080}  union, in either
found & expected   # {22, 443}            intersection, in both
found - expected   # {8080}               difference, in found only
found ^ expected   # {80, 8080}           symmetric difference, in one, not both
\`\`\`

Each has a method form, which reads better in a long line:

\`\`\`python
found.union(expected)
found.intersection(expected)
found.difference(expected)
found.symmetric_difference(expected)
\`\`\`

The operators need both sides to be sets; the methods accept any iterable, so \`found.union([1, 2])\` works.

---

## Why this matters

Read that example again as a security question. You have the ports you **expected** open and the ports you **found** open:

\`\`\`python
found - expected     # {8080} , unexpected! investigate
expected - found     # {80}   , expected but missing
found & expected     # {22, 443} , as designed
\`\`\`

Three lines answer the whole question. The list version is a nested loop and a page of code. Any time you're comparing two collections, old vs new users, allowed vs actual, yesterday's hosts vs today's, reach for sets.

Note \`-\` is **not** symmetric: \`found - expected\` and \`expected - found\` answer different questions.

## Relationships

These return a \`bool\`:

\`\`\`python
{22, 80} <= expected           # True , subset: all of mine are in yours
expected >= {22, 80}           # True , superset
{1, 2}.isdisjoint({3, 4})      # True , nothing in common
\`\`\`

\`<=\` is \`issubset()\`, \`>=\` is \`issuperset()\`. Useful for "does this user have all required permissions?":

\`\`\`python
required <= user_perms
\`\`\`

---

## Try It

Run the starter code and read each result as a question about the scan: what's unexpected, what's missing, what matches.
`,
        ar: `# توابع المجموعات: المقارنة

هنا تكف المجموعات عن كونها "قوائم بلا تكرار" وتبدأ باستحقاق مكانها. فتستطيع مقارنة مجموعتين في عملية واحدة.

---

## العمليات الأربع

\`\`\`python
expected = {22, 80, 443}
found    = {22, 443, 8080}

found | expected   # {22, 80, 443, 8080}  union, in either
found & expected   # {22, 443}            intersection, in both
found - expected   # {8080}               difference, in found only
found ^ expected   # {80, 8080}           symmetric difference, in one, not both
\`\`\`

ولكل واحدة صيغة تابع تقرأ أفضل في السطر الطويل:

\`\`\`python
found.union(expected)
found.intersection(expected)
found.difference(expected)
found.symmetric_difference(expected)
\`\`\`

والعوامل تشترط أن يكون الطرفان مجموعتين، أما التوابع فتقبل أي كائن قابل للتكرار، فيعمل \`found.union([1, 2])\`.

---

## لماذا يهم هذا

اقرأ المثال السابق مرة أخرى بوصفه سؤالا أمنيا. لديك المنافذ التي **توقعت** أن تكون مفتوحة والمنافذ التي **وجدتها** مفتوحة:

\`\`\`python
found - expected     # {8080} , unexpected! investigate
expected - found     # {80}   , expected but missing
found & expected     # {22, 443} , as designed
\`\`\`

ثلاثة أسطر تجيب عن السؤال كله. أما نسخة القوائم فحلقة متداخلة وصفحة من الشيفرة. وفي كل مرة تقارن فيها حاويتين، كالمستخدمين القدامى والجدد، أو المسموح والفعلي، أو مضيفي الأمس ومضيفي اليوم، فالجأ إلى المجموعات.

ولاحظ أن \`-\` **ليست** متناظرة: فـ \`found - expected\` و\`expected - found\` يجيبان عن سؤالين مختلفين.

## العلاقات

هذه تعيد \`bool\`:

\`\`\`python
{22, 80} <= expected           # True , subset: all of mine are in yours
expected >= {22, 80}           # True , superset
{1, 2}.isdisjoint({3, 4})      # True , nothing in common
\`\`\`

فـ \`<=\` هي \`issubset()\`، و\`>=\` هي \`issuperset()\`. وهي مفيدة للسؤال "هل يملك هذا المستخدم كل الصلاحيات المطلوبة؟":

\`\`\`python
required <= user_perms
\`\`\`

---

## جربها

شغل الشيفرة الابتدائية واقرأ كل نتيجة بوصفها سؤالا عن الفحص: ما غير المتوقع، وما المفقود، وما المطابق.
`,
      },
    },

    /* ── 4. Dictionaries ── */
    {
      id: 'py-dicts-intro',
      slug: 'dicts-intro',
      title: { en: 'Dictionaries', ar: 'القواميس' },
      order: 4,
      type: 'lesson',
      starterCode: `host = {"ip": "10.0.0.5", "port": 8080, "up": True}

print(host)
print(host["ip"])
print(len(host))

# Add / change, same syntax
host["os"] = "linux"
host["port"] = 443
print(host)

# A missing key raises
# print(host["missing"])   # KeyError

# .get() returns None (or a default) instead
print(host.get("missing"))
print(host.get("missing", "unknown"))

print("ip" in host)

# Keys must be immutable; values can be anything
mixed = {("10.0.0.5", 80): "http", "tags": ["web", "prod"]}
print(mixed)
`,
      markdownContent: {
        en: `# Dictionaries

A **dictionary** stores **key → value** pairs. Instead of "item number 3," you ask for \`"port"\`.

It's the most important data structure in Python. JSON, API responses, config files and object attributes are all dictionaries underneath.

---

## Creating one

\`\`\`python
host = {"ip": "10.0.0.5", "port": 8080, "up": True}
empty = {}
\`\`\`

Compare with the list version:

\`\`\`python
host = ["10.0.0.5", 8080, True]
host[1]        # 8080, but what IS 8080? you have to remember
host["port"]   # 8080, the code says what it means
\`\`\`

That's the whole argument for dicts.

## Reading

\`\`\`python
host["ip"]   # '10.0.0.5'
\`\`\`

A missing key **raises**:

\`\`\`python
host["missing"]   # KeyError: 'missing'
\`\`\`

\`.get()\` is the safe version, it returns \`None\` instead, or a default you choose:

\`\`\`python
host.get("missing")              # None
host.get("missing", "unknown")   # 'unknown'
\`\`\`

Use \`[]\` when the key **must** exist, the \`KeyError\` is a real bug you want to hear about. Use \`.get()\` when it's genuinely optional. Same judgement as \`remove\` vs \`discard\`.

To just check:

\`\`\`python
"ip" in host   # True, checks KEYS, not values
\`\`\`

## Writing

Adding and updating are the same line:

\`\`\`python
host["os"] = "linux"   # new key -> added
host["port"] = 443     # existing key -> replaced
\`\`\`

No error either way, so a typo silently creates a key rather than failing. Worth remembering when a value mysteriously "doesn't update."

---

## The rules on keys and values

**Keys must be immutable**, \`str\`, \`int\`, \`tuple\`. Not lists. Same hashing reason as sets, and the practical payoff:

\`\`\`python
{("10.0.0.5", 80): "http"}   # a tuple key, fine
\`\`\`

**Keys are unique.** Assigning an existing key replaces it.

**Values can be anything**, lists, other dicts, whatever. Nested dicts are how JSON maps into Python.

Since Python 3.7, dicts **keep insertion order**, so looping gives your keys back in the order you added them.

---

## Try It

Run the starter code. Then uncomment the \`host["missing"]\` line and read the \`KeyError\`, then compare with what \`.get()\` does.
`,
        ar: `# القواميس

**القاموس (dictionary)** يخزن أزواج **مفتاح وقيمة**. فبدل "العنصر رقم 3" تطلب \`"port"\`.

وهو أهم بنية بيانات في بايثون. فـ JSON، واستجابات الواجهات البرمجية، وملفات الإعدادات، وخصائص الكائنات كلها قواميس في العمق.

---

## إنشاء قاموس

\`\`\`python
host = {"ip": "10.0.0.5", "port": 8080, "up": True}
empty = {}
\`\`\`

قارن ذلك بنسخة القائمة:

\`\`\`python
host = ["10.0.0.5", 8080, True]
host[1]        # 8080, but what IS 8080? you have to remember
host["port"]   # 8080, the code says what it means
\`\`\`

وهذه هي الحجة كلها لصالح القواميس.

## القراءة

\`\`\`python
host["ip"]   # '10.0.0.5'
\`\`\`

والمفتاح المفقود **يرفع خطأ**:

\`\`\`python
host["missing"]   # KeyError: 'missing'
\`\`\`

والتابع \`.get()\` هو النسخة الآمنة، فهو يعيد \`None\` بدلا من ذلك، أو قيمة افتراضية تختارها أنت:

\`\`\`python
host.get("missing")              # None
host.get("missing", "unknown")   # 'unknown'
\`\`\`

استعمل \`[]\` حين **يجب** أن يكون المفتاح موجودا، فـ \`KeyError\` خلل حقيقي تريد أن تسمع به. واستعمل \`.get()\` حين يكون اختياريا فعلا. وهو الحكم نفسه بين \`remove\` و\`discard\`.

وللتحقق فقط:

\`\`\`python
"ip" in host   # True, checks KEYS, not values
\`\`\`

## الكتابة

الإضافة والتحديث سطر واحد:

\`\`\`python
host["os"] = "linux"   # new key -> added
host["port"] = 443     # existing key -> replaced
\`\`\`

ولا خطأ في الحالتين، فالخطأ المطبعي ينشئ مفتاحا بصمت بدل أن يفشل. وهذا جدير بالتذكر حين "تمتنع" قيمة ما عن التحديث لسبب غامض.

---

## قواعد المفاتيح والقيم

**المفاتيح يجب أن تكون غير قابلة للتغيير**، مثل \`str\` و\`int\` و\`tuple\`. لا القوائم. والسبب هو التجزئة نفسها كما في المجموعات، والمردود العملي:

\`\`\`python
{("10.0.0.5", 80): "http"}   # a tuple key, fine
\`\`\`

**والمفاتيح فريدة.** فإسناد مفتاح موجود يستبدله.

**والقيم يمكن أن تكون أي شيء**، قوائم، أو قواميس أخرى، أو أي شيء. والقواميس المتداخلة هي كيفية انعكاس JSON في بايثون.

ومنذ بايثون 3.7، **تحفظ القواميس ترتيب الإدراج**، فيعيد التكرار عليها مفاتيحك بالترتيب الذي أضفتها به.

---

## جربها

شغل الشيفرة الابتدائية. ثم أزل التعليق عن سطر \`host["missing"]\` واقرأ \`KeyError\`، ثم قارن ذلك بما تفعله \`.get()\`.
`,
      },
    },

    /* ── 5. Dictionary Methods: Access ── */
    {
      id: 'py-dicts-methods-access',
      slug: 'dict-methods-access',
      title: { en: 'Dictionary Methods: Access', ar: 'دوال القواميس: الوصول' },
      order: 5,
      type: 'lesson',
      starterCode: `host = {"ip": "10.0.0.5", "port": 8080, "up": True}

print(list(host.keys()))
print(list(host.values()))
print(list(host.items()))

# items() is what you loop over
for key, value in host.items():
    print(f"{key} = {value}")

# The views are LIVE
keys = host.keys()
host["os"] = "linux"
print(list(keys))

# setdefault, get it, or create it first
print(host.setdefault("port", 22))
print(host.setdefault("proto", "tcp"))
print(host["proto"])
`,
      markdownContent: {
        en: `# Dictionary Methods: Access

---

## keys, values, items

\`\`\`python
host.keys()     # dict_keys(['ip', 'port', 'up'])
host.values()   # dict_values(['10.0.0.5', 8080, True])
host.items()    # dict_items([('ip', '10.0.0.5'), ...])
\`\`\`

\`items()\` gives **(key, value) tuples**, which is why this is the standard way to loop a dict:

\`\`\`python
for key, value in host.items():
    print(f"{key} = {value}")
\`\`\`

Each item is a tuple, unpacked into \`key, value\`, exactly the tuple unpacking from Module 5. It's all the same idea reappearing.

## They're views, not lists

\`keys()\` doesn't return a list. It returns a **view**, a live window onto the dict:

\`\`\`python
keys = host.keys()
host["os"] = "linux"
print(list(keys))   # ['ip', 'port', 'up', 'os'] , it updated itself
\`\`\`

That's efficient (nothing is copied) and occasionally surprising. Two consequences:

- Wrap in \`list()\` if you want a snapshot, or need indexing: \`list(host.keys())[0]\`.
- **Never add or remove keys while looping** over a view, Python raises \`RuntimeError: dictionary changed size during iteration\`. Loop over \`list(host.keys())\` if you must modify.

Handily, views support set operations, because keys are unique:

\`\`\`python
host.keys() & {"ip", "mac"}   # {'ip'}, which of these exist?
\`\`\`

## setdefault

"Give me this key; if it's missing, create it with this value first":

\`\`\`python
host.setdefault("port", 22)      # 8080, exists, so unchanged
host.setdefault("proto", "tcp")  # 'tcp', missing, so added
\`\`\`

The difference from \`.get()\` matters: \`.get()\` never modifies the dict; \`setdefault()\` **writes the default in**.

---

## Try It

Run the starter code. Watch \`keys\` pick up \`"os"\` on its own, that's the view being live, not a stale copy.
`,
        ar: `# توابع القواميس: الوصول

---

## keys و values و items

\`\`\`python
host.keys()     # dict_keys(['ip', 'port', 'up'])
host.values()   # dict_values(['10.0.0.5', 8080, True])
host.items()    # dict_items([('ip', '10.0.0.5'), ...])
\`\`\`

يعطي \`items()\` **صفوفا من (مفتاح، قيمة)**، ولهذا فهو الطريقة القياسية للمرور على القاموس:

\`\`\`python
for key, value in host.items():
    print(f"{key} = {value}")
\`\`\`

فكل عنصر صف يفكك إلى \`key, value\`، وهو تفكيك الصفوف نفسه من الوحدة 5. إنها الفكرة ذاتها تعاود الظهور.

## هي مناظر لا قوائم

التابع \`keys()\` لا يعيد قائمة. بل يعيد **منظرا (view)**، أي نافذة حية على القاموس:

\`\`\`python
keys = host.keys()
host["os"] = "linux"
print(list(keys))   # ['ip', 'port', 'up', 'os'] , it updated itself
\`\`\`

وهذا كفء (فلا شيء ينسخ) ومفاجئ أحيانا. ولذلك نتيجتان:

- غلفه بـ \`list()\` إن أردت لقطة ثابتة، أو احتجت الفهرسة: \`list(host.keys())[0]\`.
- **ولا تضف مفاتيح أو تحذفها أثناء المرور** على منظر، فترفع بايثون \`RuntimeError: dictionary changed size during iteration\`. مر على \`list(host.keys())\` إن اضطررت إلى التعديل.

ومن حسن الحظ أن المناظر تدعم عمليات المجموعات، لأن المفاتيح فريدة:

\`\`\`python
host.keys() & {"ip", "mac"}   # {'ip'}, which of these exist?
\`\`\`

## setdefault

بمعنى "أعطني هذا المفتاح، وإن كان مفقودا فأنشئه بهذه القيمة أولا":

\`\`\`python
host.setdefault("port", 22)      # 8080, exists, so unchanged
host.setdefault("proto", "tcp")  # 'tcp', missing, so added
\`\`\`

والفرق عن \`.get()\` مهم: فـ \`.get()\` لا تعدل القاموس أبدا، بينما \`setdefault()\` **تكتب القيمة الافتراضية فيه**.

---

## جربها

شغل الشيفرة الابتدائية. وراقب \`keys\` وهي تلتقط \`"os"\` من تلقاء نفسها، فذاك المنظر حي لا نسخة قديمة.
`,
      },
    },

    /* ── 6. Dictionary Methods: Changing ── */
    {
      id: 'py-dicts-methods-change',
      slug: 'dict-methods-changing',
      title: { en: 'Dictionary Methods: Changing', ar: 'دوال القواميس: التعديل' },
      order: 6,
      type: 'lesson',
      starterCode: `host = {"ip": "10.0.0.5", "port": 8080}

host.update({"port": 443, "os": "linux"})   # merge in
print(host)

# The | operator merges into a NEW dict (3.9+)
print({"a": 1} | {"b": 2})

port = host.pop("port")        # remove, and return the value
print(port, host)

print(host.pop("gone", "n/a"))  # a default keeps it safe

host["temp"] = 1
last = host.popitem()           # removes the LAST inserted pair
print(last, host)

# Copies are shallow, same rule as lists
a = {"tags": ["web"]}
b = a.copy()
b["tags"].append("prod")
print(a)
`,
      markdownContent: {
        en: `# Dictionary Methods: Changing

---

## update(), merge

\`\`\`python
host.update({"port": 443, "os": "linux"})
\`\`\`

Existing keys are **overwritten**, new ones added. It's the bulk version of \`host[k] = v\`, and the usual way to apply overrides on top of defaults:

\`\`\`python
settings = DEFAULTS.copy()
settings.update(user_settings)   # user wins
\`\`\`

Since 3.9, \`|\` merges into a **new** dict, leaving both originals alone:

\`\`\`python
{"a": 1} | {"b": 2}   # {'a': 1, 'b': 2}
\`\`\`

Right-hand side wins on conflicts. Use \`|\` when you want a new dict, \`update()\` to modify in place.

## pop() and popitem()

\`\`\`python
port = host.pop("port")        # removes it, returns the VALUE
host.pop("gone", "n/a")        # a default avoids the KeyError
host.popitem()                 # removes and returns the LAST pair
\`\`\`

\`pop()\` without a default raises \`KeyError\` on a missing key, the default makes it safe, mirroring \`.get()\`.

\`popitem()\` returns a \`(key, value)\` tuple. Since 3.7 it takes the **last inserted** pair, which makes a dict usable as a stack. On an empty dict it raises \`KeyError\`.

\`del host["ip"]\` also removes, but returns nothing.

## clear() and copy()

\`\`\`python
host.clear()   # empty it
copy = host.copy()
\`\`\`

And the same warning as lists, **\`copy()\` is shallow**:

\`\`\`python
a = {"tags": ["web"]}
b = a.copy()
b["tags"].append("prod")
print(a)   # {'tags': ['web', 'prod']} , the inner list is shared
\`\`\`

The dict is new; the values inside are the same objects. For nested data use \`copy.deepcopy()\`.

---

## The pattern behind all of it

You've now seen it three times:

| | missing key/value | safe version |
|---|---|---|
| dict | \`d[k]\` → KeyError | \`d.get(k, default)\` |
| dict | \`d.pop(k)\` → KeyError | \`d.pop(k, default)\` |
| set | \`remove()\` → KeyError | \`discard()\` |
| list | \`index()\` → ValueError | \`in\` first |

Python consistently offers a loud version and a quiet one. Pick by asking: *would missing mean a bug?* If yes, take the loud one.

---

## Try It

Run the starter code. The last block is the shallow-copy trap again, same lesson as lists, now with dicts.
`,
        ar: `# توابع القواميس: التغيير

---

## update()، الدمج

\`\`\`python
host.update({"port": 443, "os": "linux"})
\`\`\`

المفاتيح الموجودة **تكتب فوقها**، والجديدة تضاف. وهو النسخة الجملية من \`host[k] = v\`، والطريقة المعتادة لتطبيق تجاوزات فوق القيم الافتراضية:

\`\`\`python
settings = DEFAULTS.copy()
settings.update(user_settings)   # user wins
\`\`\`

ومنذ الإصدار 3.9، يدمج العامل \`|\` في قاموس **جديد** ويترك الأصلين كما هما:

\`\`\`python
{"a": 1} | {"b": 2}   # {'a': 1, 'b': 2}
\`\`\`

والطرف الأيمن يفوز عند التعارض. استعمل \`|\` حين تريد قاموسا جديدا، و\`update()\` للتعديل في المكان.

## pop() و popitem()

\`\`\`python
port = host.pop("port")        # removes it, returns the VALUE
host.pop("gone", "n/a")        # a default avoids the KeyError
host.popitem()                 # removes and returns the LAST pair
\`\`\`

والتابع \`pop()\` بلا قيمة افتراضية يرفع \`KeyError\` عند مفتاح مفقود، والقيمة الافتراضية تجعله آمنا، على غرار \`.get()\`.

ويعيد \`popitem()\` صفا من \`(key, value)\`. ومنذ الإصدار 3.7 يأخذ **آخر زوج أدرج**، وهذا يجعل القاموس صالحا للاستعمال كمكدس. وعلى قاموس فارغ يرفع \`KeyError\`.

والتعبير \`del host["ip"]\` يحذف أيضا لكنه لا يعيد شيئا.

## clear() و copy()

\`\`\`python
host.clear()   # empty it
copy = host.copy()
\`\`\`

والتحذير نفسه الذي جاء مع القوائم، **فـ \`copy()\` سطحية**:

\`\`\`python
a = {"tags": ["web"]}
b = a.copy()
b["tags"].append("prod")
print(a)   # {'tags': ['web', 'prod']} , the inner list is shared
\`\`\`

فالقاموس جديد، أما القيم بداخله فهي الكائنات نفسها. وللبيانات المتداخلة استعمل \`copy.deepcopy()\`.

---

## النمط الكامن وراء هذا كله

لقد رأيته الآن ثلاث مرات:

| البنية | عند الغياب | النسخة الآمنة |
|---|---|---|
| قاموس | \`d[k]\` ترفع KeyError | \`d.get(k, default)\` |
| قاموس | \`d.pop(k)\` ترفع KeyError | \`d.pop(k, default)\` |
| مجموعة | \`remove()\` ترفع KeyError | \`discard()\` |
| قائمة | \`index()\` ترفع ValueError | التحقق بـ \`in\` أولا |

تعرض بايثون باستمرار نسخة صاخبة وأخرى هادئة. واختر بسؤال نفسك: *هل يعني الغياب وجود خلل؟* إن كان الجواب نعم فخذ الصاخبة.

---

## جربها

شغل الشيفرة الابتدائية. الكتلة الأخيرة هي فخ النسخ السطحي من جديد، الدرس نفسه الذي مر مع القوائم، والآن مع القواميس.
`,
      },
    },

    /* ── 7. Challenge: Scan Diff ── */
    {
      id: 'py-ch-scan-diff',
      slug: 'challenge-scan-diff',
      title: { en: 'Challenge: Scan Diff', ar: 'تحدي: مقارنة الفحص' },
      order: 7,
      type: 'challenge',
      starterCode: `baseline = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
current  = {"10.0.0.5": [22, 80, 8080], "10.0.0.7": [22]}

# Compare the two scans and print exactly:
#
#   New hosts: ['10.0.0.7']
#   Gone hosts: ['10.0.0.6']
#   10.0.0.5 opened: [8080]
#
# Rules:
#   - Do not hard-code any host or port.
#   - "New hosts" are in current but not baseline; "Gone hosts" the reverse.
#   - The last line is for hosts in BOTH: ports open now but not before.
#   - All three lists must be sorted.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Reports new hosts, gone hosts, and newly opened ports on a shared host',
          expectedOutput:
            "New hosts: ['10.0.0.7']\nGone hosts: ['10.0.0.6']\n10.0.0.5 opened: [8080]",
        },
      ],
      hints: [
        'Dict keys behave like sets: current.keys() - baseline.keys() gives the new hosts. Wrap in sorted() to get a sorted list.',
        'For shared hosts, intersect the keys: baseline.keys() & current.keys(). Loop over sorted() of that.',
        'For each shared host, newly opened ports are set(current[host]) - set(baseline[host]), then sorted().',
      ],
      solution: `baseline = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
current  = {"10.0.0.5": [22, 80, 8080], "10.0.0.7": [22]}

new_hosts = sorted(current.keys() - baseline.keys())
gone_hosts = sorted(baseline.keys() - current.keys())

print(f"New hosts: {new_hosts}")
print(f"Gone hosts: {gone_hosts}")

for host in sorted(baseline.keys() & current.keys()):
    opened = sorted(set(current[host]) - set(baseline[host]))
    print(f"{host} opened: {opened}")
`,
      markdownContent: {
        en: `# Challenge: Scan Diff

Comparing today's scan against a baseline, a real task, and the whole module in one problem.

---

## Instructions

Given:

\`\`\`python
baseline = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
current  = {"10.0.0.5": [22, 80, 8080], "10.0.0.7": [22]}
\`\`\`

print **exactly**:

\`\`\`
New hosts: ['10.0.0.7']
Gone hosts: ['10.0.0.6']
10.0.0.5 opened: [8080]
\`\`\`

## Rules

- Hard-code nothing, derive it all from the two dicts.
- **New hosts**: in \`current\`, not in \`baseline\`. **Gone hosts**: the reverse.
- The last line covers hosts in **both**: ports open now that weren't before.
- Every list printed must be **sorted**.

## What you need

The key insight: **\`dict.keys()\` supports set operations**, because keys are unique.

\`\`\`python
current.keys() - baseline.keys()   # new hosts
baseline.keys() & current.keys()   # hosts in both
\`\`\`

Then for a shared host, compare its port lists as sets, \`set(a) - set(b)\` gives what's new.

You'll need a small loop for the last line. If \`for host in ...\` is still unfamiliar, it's fine to peek ahead, the Loops module covers it properly.

---

Click **Submit** when ready.
`,
        ar: `# تحد: فرق الفحص

مقارنة فحص اليوم بخط أساس، وهي مهمة حقيقية، والوحدة كلها في مسألة واحدة.

---

## التعليمات

إذا أعطيت:

\`\`\`python
baseline = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
current  = {"10.0.0.5": [22, 80, 8080], "10.0.0.7": [22]}
\`\`\`

اطبع هذا **بالضبط**:

\`\`\`
New hosts: ['10.0.0.7']
Gone hosts: ['10.0.0.6']
10.0.0.5 opened: [8080]
\`\`\`

## القواعد

- لا تكتب شيئا ثابتا، بل اشتق كل شيء من القاموسين.
- **New hosts**: ما هو في \`current\` وليس في \`baseline\`. و**Gone hosts**: العكس.
- والسطر الأخير يخص المضيفين الموجودين في **الاثنين**: المنافذ المفتوحة الآن ولم تكن مفتوحة قبلا.
- كل قائمة تطبع يجب أن تكون **مرتبة**.

## ما تحتاجه

الفكرة المفتاحية: **\`dict.keys()\` تدعم عمليات المجموعات**، لأن المفاتيح فريدة.

\`\`\`python
current.keys() - baseline.keys()   # new hosts
baseline.keys() & current.keys()   # hosts in both
\`\`\`

ثم للمضيف المشترك، قارن قائمتي منافذه كمجموعتين، فـ \`set(a) - set(b)\` تعطيك الجديد.

وستحتاج حلقة صغيرة للسطر الأخير. وإن كانت \`for host in ...\` غير مألوفة لك بعد فلا بأس أن تسترق النظر إلى الأمام، فوحدة الحلقات تغطيها كما ينبغي.

---

اضغط **Submit** حين تجهز.
`,
      },
    },
  ],
};

export default setsDicts;
