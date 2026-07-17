import type { ProgrammingModule } from '../types';

const modulesIteration: ProgrammingModule = {
  id: 'py-modules-iteration',
  slug: 'modules-iteration',
  title: {
    en: 'Modules, Dates & Iteration',
    ar: 'الوحدات والتواريخ والتكرار',
  },
  description: {
    en: 'Importing and writing modules, dates and times, iterators and generators, and decorators.',
    ar: 'الاستيراد وكتابة الوحدات، التواريخ والأوقات، المكررات والمولدات، والمزخرفات.',
  },
  order: 13,
  concepts: [
    /* ── 1. Modules and Imports ── */
    {
      id: 'py-modules-intro',
      slug: 'modules-intro',
      title: { en: 'Modules and Imports', ar: 'الوحدات والاستيراد' },
      order: 1,
      type: 'lesson',
      starterCode: `import math
print(math.sqrt(16), math.pi)

# Import specific names
from random import randint, choice
print(randint(1, 6), choice(["a", "b"]))

# Rename on import
import datetime as dt
print(dt.date(2026, 7, 16))

# A module is just an object — look inside it
print(type(math).__name__)
print([n for n in dir(math) if n.startswith("f")][:4])

import os, sys, json, hashlib
print(os.name)
print(json.dumps({"host": "10.0.0.5", "up": True}))
print(hashlib.sha256(b"khana").hexdigest()[:16])
print(sys.version_info.major, sys.version_info.minor)
`,
      markdownContent: `# Modules and Imports

A **module** is a file of Python you can use from another file. The **standard library** is hundreds of them, shipped with Python — this is what "batteries included" means.

---

## import

\`\`\`python
import math
math.sqrt(16)   # 4.0
\`\`\`

\`import math\` binds the name \`math\` to the module object; you reach inside with a dot. The prefix is a feature — \`math.sqrt\` says where \`sqrt\` came from.

## from ... import

Pull specific names into your file directly:

\`\`\`python
from random import randint, choice
randint(1, 6)   # no prefix
\`\`\`

Shorter, and you lose the origin. Fine for the obvious (\`from datetime import date\`), risky when it collides — \`from math import pow\` quietly shadows the built-in \`pow\`.

**Never do this:**

\`\`\`python
from math import *
\`\`\`

It dumps every name into your file, silently clobbering anything with the same name, and no reader can tell where a function came from.

## import ... as

Rename on the way in:

\`\`\`python
import datetime as dt
\`\`\`

For long names, or to dodge a clash. Some aliases are conventions you'll see everywhere (\`import numpy as np\`).

---

## The standard library you'll actually use

\`\`\`python
import os        # files, paths, environment
import sys       # the interpreter itself
import json      # parse and produce JSON
import re        # regular expressions
import random    # random numbers
import math      # maths
import datetime  # dates and times
import hashlib   # md5, sha256, ...
\`\`\`

\`\`\`python
json.dumps({"host": "10.0.0.5"})        # dict -> JSON string
hashlib.sha256(b"khana").hexdigest()    # note the b"" — bytes, not str
\`\`\`

That \`b\` prefix matters: hashing works on **bytes**, not text. \`sha256("khana")\` is a \`TypeError\` — use \`"khana".encode()\` for real input.

Before you write a utility, check whether the standard library already has it. It usually does, and it's better tested than yours.

## Imports go at the top

Convention (and PEP 8): all imports at the top of the file, standard library first, then third-party, then your own. Modules are cached after the first import, so re-importing costs nothing — but a mid-file import hides a dependency.

---

## Try It

Run the starter code. \`dir(math)\` lists what a module contains — the fastest way to explore one without leaving Python.
`,
    },

    /* ── 2. Your Own Module ── */
    {
      id: 'py-own-module',
      slug: 'own-module',
      title: { en: 'Your Own Module', ar: 'وحدتك الخاصة' },
      order: 2,
      type: 'lesson',
      starterCode: `# Write a real file — this IS a module
with open("tools.py", "w") as f:
    print("VERSION = '1.0'", file=f)
    print("", file=f)
    print("def is_valid(port):", file=f)
    print("    return 1 <= port <= 65535", file=f)
    print("", file=f)
    print("if __name__ == '__main__':", file=f)
    print("    print('tools.py run directly')", file=f)

import tools
print(tools.VERSION, tools.is_valid(80), tools.is_valid(99999))

from tools import is_valid
print(is_valid(22))

# The imported module's __name__ is its filename...
print("tools.__name__:", tools.__name__)
# ...while the file you are RUNNING is always __main__
print("this file:", __name__)
`,
      markdownContent: `# Your Own Module

There's nothing special about a module. **Any \`.py\` file is one.** Save functions in \`tools.py\` and \`import tools\` works — that's the whole mechanism.

---

## Making one

\`tools.py\`:

\`\`\`python
VERSION = "1.0"

def is_valid(port):
    return 1 <= port <= 65535
\`\`\`

Then, from another file in the same folder:

\`\`\`python
import tools
tools.is_valid(80)     # True
tools.VERSION          # '1.0'

from tools import is_valid
is_valid(80)
\`\`\`

The module name is the **filename without \`.py\`**. So it must be a valid Python name: \`my_tools.py\` imports as \`my_tools\`; \`my-tools.py\` cannot be imported at all.

Don't name a file after a standard library module. A local \`random.py\` shadows the real one, and the error you get is baffling.

---

## if __name__ == "__main__"

The line that appears in every Python file and confuses everyone at first:

\`\`\`python
if __name__ == "__main__":
    print("run directly")
\`\`\`

Python sets \`__name__\` in every module:

- **run the file directly** → \`__name__\` is \`"__main__"\`
- **import the file** → \`__name__\` is the module's name (\`"tools"\`)

So that block runs **only when the file is executed directly**, and is skipped when it's imported.

Why it matters: **importing a module runs all of its top-level code.** If \`tools.py\` had a bare \`print("starting scan")\` at the top, that would fire the moment someone imported it — which is never what an importer wants.

So: definitions at the top level, anything that *does* something inside the guard. It lets one file serve as both a reusable library and a runnable script, which is exactly why you see it everywhere.

---

## Beyond one file

A folder of modules is a **package**. Historically it needed an \`__init__.py\`; modern Python doesn't require it, though you'll still see it. Then:

\`\`\`python
from mypackage.scanner import scan
\`\`\`

Same idea, one level up.

---

## Try It

Run the starter code — it writes \`tools.py\`, then imports it. \`tools.__name__\` is \`"tools"\` while your file is \`"__main__"\`, so \`tools.py\`'s guarded print never fires.
`,
    },

    /* ── 3. External Packages ── */
    {
      id: 'py-packages',
      slug: 'external-packages',
      title: { en: 'External Packages', ar: 'الحزم الخارجية' },
      order: 3,
      type: 'lesson',
      starterCode: `# Pillow is a THIRD-PARTY package — not part of the standard library.
# On your machine you would install it first:  pip install Pillow
from PIL import Image

img = Image.new("RGB", (8, 4), (200, 30, 30))
print("size:", img.size, "| mode:", img.mode)
print("rotated:", img.rotate(90, expand=True).size)

# Note the import name differs from the install name:
#   pip install Pillow   ->   from PIL import Image
import PIL
print("Pillow version:", PIL.__version__)
`,
      markdownContent: `# External Packages

The standard library is large. **PyPI** — the Python Package Index — is enormous: hundreds of thousands of packages other people wrote.

---

## pip

\`pip\` is Python's installer, and it comes with Python:

\`\`\`
pip install requests
pip install Pillow
pip uninstall requests
pip list
pip show requests
\`\`\`

You run these in a **terminal**, not inside Python. That trips everyone once: typing \`pip install x\` at the \`>>>\` prompt is a \`SyntaxError\`.

Then import it as normal:

\`\`\`python
import requests
\`\`\`

## The install name is not always the import name

\`\`\`
pip install Pillow          ->  from PIL import Image
pip install beautifulsoup4  ->  from bs4 import BeautifulSoup
pip install pyyaml          ->  import yaml
\`\`\`

Historical accidents, and a reliable source of confusion. When an import fails, check what the package is actually called.

---

## Virtual environments

The important part, and the one beginners skip.

Installing globally means every project shares one set of versions. Project A needs \`requests\` 2.25, project B needs 2.31 — you can't have both, and upgrading for B silently breaks A.

A **virtual environment** is a private Python for one project:

\`\`\`
python -m venv .venv
source .venv/bin/activate     # Linux / macOS
.venv\\Scripts\\activate        # Windows
pip install requests
\`\`\`

Now \`pip install\` only touches this project. Delete the folder and it's gone cleanly.

Record what you depend on:

\`\`\`
pip freeze > requirements.txt
pip install -r requirements.txt
\`\`\`

\`requirements.txt\` is how someone else — or a server, or you in six months — reproduces your setup. Make a venv per project, every time. It's two commands and it prevents a whole category of misery.

## Installing is running someone's code

Worth saying in a security course: \`pip install\` downloads code and can execute it during setup. Typosquatting on PyPI is real — a package one letter off from a popular one, doing something unpleasant. Check the name, check the download counts, prefer well-known packages, and pin versions in \`requirements.txt\`.

---

## In this editor

Packages are **pre-installed and served from the academy's own servers** — there's no \`pip\` here, and nothing is fetched from PyPI while you work. Pillow is available because this lesson needs it; the sandbox stays sealed.

On your own machine, the same code needs \`pip install Pillow\` in an activated venv first.

---

## Try It

Run the starter code. Pillow loads on demand the first time you import it, so give it a moment — after that it's cached.
`,
    },

    /* ── 4. Dates and Times ── */
    {
      id: 'py-datetime',
      slug: 'dates-and-times',
      title: { en: 'Dates and Times', ar: 'التواريخ والأوقات' },
      order: 4,
      type: 'lesson',
      starterCode: `from datetime import date, datetime, timedelta

d = date(2026, 7, 16)
print(d, d.year, d.month, d.day)
print("weekday:", d.weekday())     # Monday is 0

dt = datetime(2026, 7, 16, 14, 30, 5)
print(dt, "|", dt.hour, dt.minute)

# Subtracting dates gives a timedelta
born = date(2004, 5, 1)
age = d - born
print("days alive:", age.days)
print("years (approx):", age.days // 365)

# Adding time
print("in 30 days:", d + timedelta(days=30))
print("yesterday:", d - timedelta(days=1))

# Comparisons work
print(date(2026, 1, 1) < d)

# Parsing a string into a date
parsed = datetime.strptime("2026-07-16", "%Y-%m-%d").date()
print("parsed:", parsed, parsed == d)
`,
      markdownContent: `# Dates and Times

Dates look simple and are not. Leap years, months of different lengths, time zones, daylight saving. **Never do date arithmetic by hand** — the \`datetime\` module exists precisely so you don't.

---

## The three types

\`\`\`python
from datetime import date, datetime, timedelta

date(2026, 7, 16)                  # a day
datetime(2026, 7, 16, 14, 30, 5)   # a day and a time
timedelta(days=30)                 # a DURATION, not a moment
\`\`\`

\`date.today()\` and \`datetime.now()\` give the current one.

Attributes are what you'd expect — \`.year\`, \`.month\`, \`.day\`, \`.hour\`. One to watch:

\`\`\`python
d.weekday()   # Monday is 0, Sunday is 6
\`\`\`

Zero-based, like everything else in Python. (\`isoweekday()\` starts Monday at 1 if you prefer.)

---

## Arithmetic

Subtract two dates and you get a **timedelta**:

\`\`\`python
age = date(2026, 7, 16) - date(2004, 5, 1)
age.days   # 8111
\`\`\`

This is the honest version of the Module 8 practical. That one did \`years * 365\` and I flagged it as a model; this counts real days, leap years included.

Add a duration to get a new date:

\`\`\`python
d + timedelta(days=30)   # handles month ends for you
\`\`\`

Note what you *cannot* do: \`timedelta(months=1)\` doesn't exist. A month isn't a fixed length — is a month after 31 January the 28th, 29th, or 3 March? There's no correct answer, so the library refuses to guess. Use \`dateutil.relativedelta\` if you need it.

Dates compare with \`<\`, \`>\`, \`==\` as you'd hope.

## Parsing

Turn a string into a real date:

\`\`\`python
datetime.strptime("2026-07-16", "%Y-%m-%d")
\`\`\`

**str-p-time** = "parse time". Get the format wrong and it raises \`ValueError\` — which is right; a date you can't parse is a problem.

---

## One warning: time zones

\`datetime.now()\` gives a **naive** datetime: no time zone, just numbers. Fine for a local timer, wrong the moment two machines compare notes.

For anything real, work in UTC and attach a zone:

\`\`\`python
from datetime import timezone
datetime.now(timezone.utc)
\`\`\`

Log timestamps without time zones are a genuine problem in security work — correlating events across servers is impossible if you don't know what "14:30" meant where.

---

## Try It

Run the starter code. \`d - born\` counts real days, leap years and all — no 365 approximation.
`,
    },

    /* ── 5. Formatting Dates ── */
    {
      id: 'py-date-format',
      slug: 'formatting-dates',
      title: { en: 'Formatting Dates', ar: 'تنسيق التواريخ' },
      order: 5,
      type: 'lesson',
      starterCode: `from datetime import datetime

dt = datetime(2026, 7, 16, 14, 30, 5)

# strftime — datetime -> string
print(dt.strftime("%Y-%m-%d"))
print(dt.strftime("%d/%m/%Y %H:%M"))
print(dt.strftime("%A %d %B %Y"))
print(dt.strftime("%I:%M %p"))

# ISO format — the one to use for machines
print(dt.isoformat())
print(dt.date().isoformat())

# strptime — string -> datetime
back = datetime.strptime("16/07/2026 14:30", "%d/%m/%Y %H:%M")
print(back, back == dt.replace(second=0))

# f-strings understand format specs too
print(f"{dt:%Y-%m-%d}")

# A wrong format raises
try:
    datetime.strptime("16-07-2026", "%d/%m/%Y")
except ValueError as e:
    print("ValueError:", str(e)[:40])
`,
      markdownContent: `# Formatting Dates

Two directions, two functions with confusingly similar names:

- **\`strftime\`** — *format* time: datetime → string
- **\`strptime\`** — *parse* time: string → datetime

The \`f\` is format, the \`p\` is parse. That's the only way to keep them apart.

---

## strftime

\`\`\`python
dt.strftime("%Y-%m-%d")           # 2026-07-16
dt.strftime("%d/%m/%Y %H:%M")     # 16/07/2026 14:30
dt.strftime("%A %d %B %Y")        # Thursday 16 July 2026
dt.strftime("%I:%M %p")           # 02:30 PM
\`\`\`

The codes worth knowing:

| Code | Means |
|---|---|
| \`%Y\` / \`%y\` | 2026 / 26 |
| \`%m\` / \`%B\` / \`%b\` | 07 / July / Jul |
| \`%d\` | day, zero-padded |
| \`%A\` / \`%a\` | Thursday / Thu |
| \`%H\` / \`%I\` | hour 24 / hour 12 |
| \`%M\` / \`%S\` | minute / second |
| \`%p\` | AM/PM |

Case matters: \`%M\` is minutes, \`%m\` is months. Mixing them up is a classic.

f-strings accept the same codes directly, which is usually neater:

\`\`\`python
f"{dt:%Y-%m-%d}"
\`\`\`

## ISO format

\`\`\`python
dt.isoformat()   # '2026-07-16T14:30:05'
\`\`\`

**Use this whenever a machine will read it.** It's the international standard: unambiguous, and it sorts correctly as plain text, because the parts run largest to smallest. \`sorted()\` on ISO date strings gives chronological order for free.

That's the real reason to prefer \`%Y-%m-%d\` over \`%d/%m/%Y\` in filenames and logs.

And ambiguity is not theoretical: \`07/08/2026\` is 7 August in Baghdad and 8 July in Boston. The same string, two dates. ISO has one meaning everywhere.

Rule: **ISO for machines, \`strftime\` for humans.**

## strptime

\`\`\`python
datetime.strptime("16/07/2026 14:30", "%d/%m/%Y %H:%M")
\`\`\`

The format string must match the input **exactly** — every separator, every digit. Mismatch raises \`ValueError\`:

\`\`\`python
datetime.strptime("16-07-2026", "%d/%m/%Y")   # ValueError
\`\`\`

Loud, and correct. A misparsed date is worse than no date.

---

## Try It

Run the starter code. Then swap \`%M\` for \`%m\` somewhere and watch the minutes turn into a month.
`,
    },

    /* ── 6. Iterables and Iterators ── */
    {
      id: 'py-iterables',
      slug: 'iterables-iterators',
      title: { en: 'Iterables and Iterators', ar: 'المكررات' },
      order: 6,
      type: 'lesson',
      starterCode: `nums = [1, 2, 3]

# A list is an ITERABLE — you can ask it for an iterator
it = iter(nums)
print(type(it).__name__)

# An ITERATOR hands over one item per next() call
print(next(it), next(it), next(it))
try:
    next(it)
except StopIteration:
    print("StopIteration — exhausted")

# That IS what a for loop does, under the hood
it = iter(nums)
while True:
    try:
        print("got", next(it))
    except StopIteration:
        break

# An iterable can be looped many times; an iterator only once
print(list(nums), list(nums))
it2 = iter(nums)
print(list(it2), list(it2))
`,
      markdownContent: `# Iterables and Iterators

Two words that sound identical and mean different things. This lesson explains behaviour you've already been surprised by.

---

## The distinction

- An **iterable** can *give you* an iterator. Lists, tuples, strings, sets, dicts, files.
- An **iterator** produces values **one at a time**, and remembers where it is.

\`\`\`python
nums = [1, 2, 3]     # iterable
it = iter(nums)      # iterator
next(it)             # 1
next(it)             # 2
next(it)             # 3
next(it)             # StopIteration
\`\`\`

Two functions: \`iter()\` asks an iterable for an iterator; \`next()\` asks the iterator for the next value. When it's spent it raises **\`StopIteration\`**.

## That's all a for loop is

\`\`\`python
for n in nums:
    print(n)
\`\`\`

is exactly:

\`\`\`python
it = iter(nums)
while True:
    try:
        n = next(it)
    except StopIteration:
        break
    print(n)
\`\`\`

\`for\` calls \`iter()\`, then \`next()\` until \`StopIteration\`, and catches it for you. That's the entire mechanism — and it's why \`for\` works identically on lists, files, dicts and generators. They all answer \`iter()\`.

---

## The consequence you've already hit

**An iterable can be walked repeatedly. An iterator is single-use.**

\`\`\`python
list(nums), list(nums)     # both full — nums is an iterable

it = iter(nums)
list(it)   # [1, 2, 3]
list(it)   # []  <- spent
\`\`\`

That explains three things from earlier modules:

- \`map\`/\`filter\` gave \`[]\` the second time — they're iterators.
- Reading a file twice gave \`''\` — a file object is its own iterator.
- \`zip\`, \`enumerate\`, \`reversed\` behave the same way.

One rule, several symptoms. If you need the values twice, materialise them: \`data = list(it)\`.

## Why bother being lazy

An iterator holds **one item**, not the collection. So you can walk a 10 GB file, or an endless stream, in constant memory. Building the list first would be impossible.

That's the trade: **laziness buys memory and costs re-use.**

---

## Try It

Run the starter code. The hand-written \`while\`/\`next()\`/\`StopIteration\` loop is precisely what \`for\` does for you.
`,
    },

    /* ── 7. Generators ── */
    {
      id: 'py-generators',
      slug: 'generators',
      title: { en: 'Generators', ar: 'المولدات' },
      order: 7,
      type: 'lesson',
      starterCode: `def count_to(n):
    for i in range(1, n + 1):
        yield i          # yield, not return

gen = count_to(3)
print(type(gen).__name__)
print(list(gen))

# yield PAUSES the function and resumes where it left off
def chatty():
    print("  start")
    yield 1
    print("  resumed")
    yield 2
    print("  finishing")

g = chatty()
print("made it — nothing ran yet")
print("first:", next(g))
print("second:", next(g))

# An infinite generator is fine — it is lazy
def naturals():
    n = 1
    while True:
        yield n
        n += 1

nat = naturals()
print([next(nat) for _ in range(5)])

# Generator expressions — like a comprehension with ()
squares = (n * n for n in range(5))
print(type(squares).__name__, list(squares))
print(sum(n * n for n in range(1000)))
`,
      markdownContent: `# Generators

The easy way to make an iterator: a function with **\`yield\`** in it.

---

## yield

\`\`\`python
def count_to(n):
    for i in range(1, n + 1):
        yield i
\`\`\`

Put \`yield\` in a function and it stops being a normal function. Calling it **runs nothing** — it hands back a **generator object**:

\`\`\`python
gen = count_to(3)   # no output; the body has not run
list(gen)           # [1, 2, 3]  — now it runs
\`\`\`

## yield pauses; return ends

That's the whole idea. \`return\` finishes a function and throws away its local state. \`yield\` **hands back a value and freezes the function**, keeping every local variable, ready to resume at the next \`next()\`:

\`\`\`python
def chatty():
    print("start")
    yield 1
    print("resumed")
    yield 2
\`\`\`

Nothing prints until the first \`next()\`. Then it runs to the first \`yield\` and **stops**. The second \`next()\` resumes *after* that yield and prints \`resumed\`.

A function that can pause in the middle and pick up later is genuinely different from anything before this module.

---

## Why they matter

**Memory.** A generator holds one value at a time:

\`\`\`python
[n * n for n in range(10_000_000)]   # a list — hundreds of MB
(n * n for n in range(10_000_000))   # a generator — a few bytes
\`\`\`

**Infinite sequences become possible:**

\`\`\`python
def naturals():
    n = 1
    while True:
        yield n
        n += 1
\`\`\`

That \`while True\` never ends — and it's fine, because it only ever runs as far as you ask. \`list(naturals())\` would hang forever; \`next()\` five times costs nothing.

## Generator expressions

A comprehension with parentheses:

\`\`\`python
[n * n for n in range(5)]   # list — built now
(n * n for n in range(5))   # generator — built on demand
\`\`\`

And you can drop the parentheses when it's the only argument:

\`\`\`python
sum(n * n for n in range(1000))
\`\`\`

That's the everyday use: feed \`sum\`, \`any\`, \`all\`, \`max\` from a generator and nothing is built in memory. You've already written this — \`all(m == "GET" for m in methods)\` in Module 12 was a generator expression.

## The catch

Generators are iterators, so **single-use**, and you can't index or \`len()\` them. If you need the data twice, \`list()\` it.

---

## Try It

Run the starter code. \`chatty()\` prints nothing until the first \`next()\` — the function is frozen until you ask.
`,
    },

    /* ── 8. Decorators ── */
    {
      id: 'py-decorators',
      slug: 'decorators',
      title: { en: 'Decorators', ar: 'المزخرفات' },
      order: 8,
      type: 'lesson',
      starterCode: `import functools

# Functions are values — you can pass and return them
def shout(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs).upper()
    return wrapper

@shout
def greet(name):
    return f"hello {name}"

print(greet("sara"))
print("name kept:", greet.__name__)

# @shout is exactly this:
def plain(name):
    return f"hi {name}"
plain = shout(plain)
print(plain("ali"))

# A decorator that TAKES arguments needs one more layer
def repeat(times):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            return [fn(*args, **kwargs) for _ in range(times)]
        return wrapper
    return decorator

@repeat(3)
def ping():
    return "pong"

print(ping())
`,
      markdownContent: `# Decorators

A **decorator** wraps a function to add behaviour, without editing the function.

It rests on one fact from Module 11: **functions are values.** You can pass them around and return them.

---

## The idea

\`\`\`python
def shout(fn):
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs).upper()
    return wrapper

@shout
def greet(name):
    return f"hello {name}"

greet("sara")   # 'HELLO SARA'
\`\`\`

\`shout\` takes a function and returns a **new** function that calls the original and does something extra.

\`@shout\` is pure syntax sugar. It means exactly:

\`\`\`python
greet = shout(greet)
\`\`\`

That's it. The \`@\` line rebinds the name to the wrapped version. Once you see that, decorators stop being magic.

## Why *args, **kwargs

The wrapper doesn't know what it's wrapping, so it must accept **anything** and pass it through untouched:

\`\`\`python
def wrapper(*args, **kwargs):
    return fn(*args, **kwargs)
\`\`\`

Collect on the way in, spread on the way out — both halves from Module 11, and this is what they were for.

## functools.wraps

Without it, the wrapper's identity replaces the original's:

\`\`\`python
greet.__name__   # 'wrapper'  <- wrong, and confusing in tracebacks
\`\`\`

\`@functools.wraps(fn)\` copies the name, docstring and signature across. **Always include it.** It costs one line and saves real debugging pain.

---

## Decorators with arguments

To write \`@repeat(3)\`, you need **three** layers:

\`\`\`python
def repeat(times):          # 1. takes the ARGUMENT
    def decorator(fn):      # 2. takes the FUNCTION
        @functools.wraps(fn)
        def wrapper(*a, **kw):   # 3. takes the CALL
            return [fn(*a, **kw) for _ in range(times)]
        return wrapper
    return decorator
\`\`\`

Because \`@repeat(3)\` **calls** \`repeat(3)\` first, and whatever comes back is used as the decorator. So:

\`\`\`python
ping = repeat(3)(ping)
\`\`\`

Three layers for three jobs: the argument, the function, the call. Nobody finds this obvious the first time. Write it out as nested calls when it confuses you.

## Where you'll meet them

You'll *use* decorators long before you write one — \`@app.route("/")\` in Flask, \`@pytest.fixture\`, \`@property\`, \`@staticmethod\`, \`@functools.cache\`. Knowing they're just \`f = decorator(f)\` demystifies all of them.

---

## Try It

Run the starter code. The \`plain = shout(plain)\` line proves \`@\` is only sugar — same result, no \`@\`.
`,
    },

    /* ── 9. Practical: Timing Decorator ── */
    {
      id: 'py-practical-timing',
      slug: 'practical-timing',
      title: { en: 'Practical: Timing Decorator', ar: 'تطبيق: مزخرف القياس' },
      order: 9,
      type: 'lesson',
      starterCode: `import functools, time

def timed(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"  {fn.__name__} took {elapsed * 1000:.2f} ms")
        return result
    return wrapper

@timed
def build_list(n):
    out = []
    for i in range(n):
        out.append(i * i)
    return out

@timed
def build_comprehension(n):
    return [i * i for i in range(n)]

@timed
def join_strings(n):
    return "".join(str(i) for i in range(n))

@timed
def concat_strings(n):
    s = ""
    for i in range(n):
        s += str(i)
    return s

N = 50000
build_list(N)
build_comprehension(N)
join_strings(N)
concat_strings(N)
`,
      markdownContent: `# Practical: Timing Decorator

The decorator you'll actually write. It answers "which of these is faster?" without touching either function.

---

## The wrapper

\`\`\`python
def timed(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"  {fn.__name__} took {elapsed * 1000:.2f} ms")
        return result
    return wrapper
\`\`\`

Three details worth the attention:

**\`time.perf_counter()\`**, not \`time.time()\`. \`time.time()\` is a wall clock — it can jump when the system clock adjusts, and it's coarse. \`perf_counter\` is a monotonic high-resolution timer meant exactly for measuring durations.

**\`result = fn(...)\` then \`return result\`.** The wrapper must hand back what the original returned. Forget the \`return\` and every decorated function silently returns \`None\` — a nasty bug, because the timing still prints and looks fine.

**\`fn.__name__\`** works because of \`@functools.wraps\`. Without it, every line would say \`wrapper\`.

---

## What it tells you

**loop + append** vs **list comprehension**: the comprehension usually edges it, because the looping happens in C rather than in your Python bytecode.

**\`"".join(...)\`** vs **\`s += str(i)\`**: here it gets interesting — and this is the most useful thing in the lesson.

The folklore says \`+=\` on strings is disastrous. The reasoning sounds airtight: strings are immutable (Module 3), so every \`+=\` must build a whole new string and copy the old one, making the total cost grow with the *square* of the length.

**Measure it and the story falls apart.** The two land in the same ballpark — within a few tens of percent either way, depending on what you're joining. Nothing like the catastrophe you were promised.

The decisive test is how it **scales**. Quadratic means doubling the work *quadruples* the time. Try \`N\` at 25,000 then 50,000 then 100,000: the time roughly **doubles** each step. That's linear, so the copy-every-time story is simply not what's happening.

Why: CPython cheats. When the string being grown has exactly **one reference**, it resizes the buffer in place instead of copying — so the loop stays linear. The immutability is preserved from your point of view; the optimisation happens underneath.

## So is the folklore wrong?

Not quite — it's **conditional**, which is worse than wrong, because it's right often enough to sound authoritative.

That optimisation evaporates the moment anything else holds a reference to the string. Keep each intermediate result and the copying comes back, quadratic and brutal. It's also a CPython implementation detail: no other Python promises it.

So \`join\` is still the better habit — it's predictable, portable, and says "build one string from many pieces" more directly than a loop does. Just not for the reason you were told.

## The actual lesson

**Measure. Don't trust folklore — including mine.**

Performance intuition is unreliable, and confident explanations are the most unreliable of all, because a good story is convincing whether or not it's true. When you think something is slow, time it. A decorator makes that a one-line change you can remove just as easily.

For serious work use the \`timeit\` module, which runs a snippet many times and handles the statistics. This decorator is the quick version — perfect for "is this obviously terrible?"

Note the numbers will shift between runs, and this is a browser. Compare the **ratios**, not the absolute milliseconds.

---

## Try It

Run it a couple of times. Look at \`concat_strings\` against \`join_strings\` — same output, different algorithmic cost.
`,
    },

    /* ── 10. Practical: zip ── */
    {
      id: 'py-practical-zip',
      slug: 'practical-zip',
      title: { en: 'Practical: Many Lists at Once', ar: 'تطبيق: عدة قوائم معا' },
      order: 10,
      type: 'lesson',
      starterCode: `names = ["ssh", "http", "https"]
ports = [22, 80, 443]
states = ["open", "open", "closed"]

for name, port, state in zip(names, ports, states):
    print(f"{name:<6} {port:<5} {state}")

# Build a dict from two lists
print(dict(zip(names, ports)))

# zip stops at the SHORTEST — silently
print(list(zip([1, 2, 3], ["a"])))

# strict=True catches a mismatch instead
try:
    list(zip([1, 2, 3], ["a"], strict=True))
except ValueError as e:
    print("strict:", e)

# zip(*rows) transposes — rows become columns
rows = [(1, 2, 3), (4, 5, 6)]
print(list(zip(*rows)))

# With enumerate for an index too
for i, (name, port) in enumerate(zip(names, ports), start=1):
    print(i, name, port)
`,
      markdownContent: `# Practical: Many Lists at Once

\`zip\` walks several iterables in step, handing you one item from each.

---

## The basic use

\`\`\`python
for name, port, state in zip(names, ports, states):
    print(f"{name:<6} {port:<5} {state}")
\`\`\`

Any number of iterables. Each round yields a tuple, unpacked into your names.

Compare with the index version:

\`\`\`python
for i in range(len(names)):
    print(names[i], ports[i], states[i])
\`\`\`

That works, and it's worse: it assumes equal lengths, it's noisy, and \`[i]\` three times invites a typo. **If you're indexing several lists with the same counter, you want \`zip\`.**

## Building a dict

\`\`\`python
dict(zip(names, ports))   # {'ssh': 22, 'http': 80, 'https': 443}
\`\`\`

The neatest way to pair keys with values from two sources — CSV headers with a row, for instance.

---

## It stops at the shortest — silently

\`\`\`python
list(zip([1, 2, 3], ["a"]))   # [(1, 'a')]
\`\`\`

Two items vanished, and nothing warned you. Usually convenient, occasionally a data-loss bug you never notice.

Since 3.10 you can demand they match:

\`\`\`python
list(zip([1, 2, 3], ["a"], strict=True))   # ValueError
\`\`\`

Use \`strict=True\` whenever equal lengths are an assumption rather than a coincidence. Better a loud error than a quietly truncated report.

## zip(*rows) transposes

A trick worth knowing:

\`\`\`python
rows = [(1, 2, 3), (4, 5, 6)]
list(zip(*rows))   # [(1, 4), (2, 5), (3, 6)]
\`\`\`

\`*rows\` spreads the rows in as separate arguments (Module 11), so \`zip\` pairs them element-wise — turning rows into columns. Applying it twice gets you back where you started.

## With enumerate

\`\`\`python
for i, (name, port) in enumerate(zip(names, ports), start=1):
\`\`\`

Note the parentheses around \`(name, port)\`: \`enumerate\` yields \`(index, item)\` where the item is itself \`zip\`'s tuple, so you unpack the nested shape. Getting this wrong is a \`ValueError\` about unpacking — and now you know why.

---

## Try It

Run the starter code. The \`strict=True\` line raises where the line above it silently dropped data — same inputs, very different behaviour.
`,
    },

    /* ── 11. Challenge: Scan Report ── */
    {
      id: 'py-ch-scan-report',
      slug: 'challenge-scan-report',
      title: { en: 'Challenge: Scan Report', ar: 'تحدي: تقرير الفحص' },
      order: 11,
      type: 'challenge',
      starterCode: `from datetime import date

names = ["ssh", "http", "https", "mysql"]
ports = [22, 80, 443, 3306]
states = ["open", "open", "closed", "open"]
scanned = date(2026, 7, 16)

# Print exactly:
#
#   Date: 2026-07-16
#   Weekday: Thursday
#   ssh:22 open
#   http:80 open
#   https:443 closed
#   mysql:3306 open
#   Open ports: [22, 80, 3306]
#   Open count: 3
#   Next scan: 2026-07-23
#
# Rules:
#   - Use zip to walk the three lists together — no indexing with range(len()).
#   - "Weekday" uses strftime.
#   - "Open ports" is a list of the ports whose state is "open".
#   - "Open count" must come from a generator expression with sum().
#   - "Next scan" is 7 days after the scan date.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Formats the dates and reports the open ports via zip',
          expectedOutput:
            'Date: 2026-07-16\nWeekday: Thursday\nssh:22 open\nhttp:80 open\nhttps:443 closed\nmysql:3306 open\nOpen ports: [22, 80, 3306]\nOpen count: 3\nNext scan: 2026-07-23',
        },
      ],
      hints: [
        'scanned.isoformat() gives 2026-07-16, and scanned.strftime("%A") gives the weekday name.',
        'Loop with: for name, port, state in zip(names, ports, states). Print each line with an f-string.',
        'Open ports: [p for p, s in zip(ports, states) if s == "open"]. Open count: sum(1 for s in states if s == "open"). Next scan: scanned + timedelta(days=7) — import it from datetime.',
      ],
      solution: `from datetime import date, timedelta

names = ["ssh", "http", "https", "mysql"]
ports = [22, 80, 443, 3306]
states = ["open", "open", "closed", "open"]
scanned = date(2026, 7, 16)

print(f"Date: {scanned.isoformat()}")
print(f"Weekday: {scanned.strftime('%A')}")

for name, port, state in zip(names, ports, states):
    print(f"{name}:{port} {state}")

open_ports = [p for p, s in zip(ports, states) if s == "open"]
print(f"Open ports: {open_ports}")
print(f"Open count: {sum(1 for s in states if s == 'open')}")
print(f"Next scan: {(scanned + timedelta(days=7)).isoformat()}")
`,
      markdownContent: `# Challenge: Scan Report

Dates, \`zip\` and a generator expression together.

---

## Instructions

Using the data in the editor, print **exactly**:

\`\`\`
Date: 2026-07-16
Weekday: Thursday
ssh:22 open
http:80 open
https:443 closed
mysql:3306 open
Open ports: [22, 80, 3306]
Open count: 3
Next scan: 2026-07-23
\`\`\`

## Rules

- Walk the three lists with **\`zip\`** — no \`range(len(...))\`.
- **Weekday** comes from \`strftime\`.
- **Open ports** is the ports whose state is \`"open"\`.
- **Open count** must use \`sum()\` over a **generator expression**.
- **Next scan** is 7 days later — use \`timedelta\`.

## What you need

\`\`\`python
scanned.isoformat()          # 2026-07-16
scanned.strftime("%A")       # Thursday
zip(names, ports, states)
sum(1 for s in states if s == "open")
scanned + timedelta(days=7)
\`\`\`

## Watch out

\`timedelta\` needs importing alongside \`date\`. And \`sum(1 for ...)\` counts by adding 1 per match — the generator-expression way to count without building a list.

---

Click **Submit** when ready.
`,
    },
  ],
};

export default modulesIteration;
