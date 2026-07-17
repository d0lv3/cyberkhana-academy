import type { ProgrammingModule } from '../types';

const qualityErrors: ProgrammingModule = {
  id: 'py-quality-errors',
  slug: 'quality-errors',
  title: {
    en: 'Quality, Errors & HTTP',
    ar: 'الجودة والأخطاء و HTTP',
  },
  description: {
    en: 'Images with Pillow, documenting and linting, exceptions, debugging, type hints, and HTTP with requests.',
    ar: 'الصور مع Pillow، التوثيق والفحص، الاستثناءات، التنقيح، تلميحات الأنواع، و HTTP مع requests.',
  },
  order: 14,
  concepts: [
    /* ── 1. Images with Pillow ── */
    {
      id: 'py-pillow',
      slug: 'images-pillow',
      title: { en: 'Images with Pillow', ar: 'الصور مع Pillow' },
      order: 1,
      type: 'lesson',
      starterCode: `from PIL import Image, ImageOps, ImageFilter

# Make an image from scratch: mode, size, colour
img = Image.new("RGB", (200, 100), (20, 40, 80))
print("size:", img.size, "| mode:", img.mode)
print("one pixel:", img.getpixel((0, 0)))

# Transform — each returns a NEW image
print("rotated:", img.rotate(90, expand=True).size)
print("resized:", img.resize((100, 50)).size)
print("cropped:", img.crop((0, 0, 50, 50)).size)
print("thumbnail box:", img.copy().size)

# Colour and filters
print("greyscale mode:", ImageOps.grayscale(img).mode)
print("blurred:", img.filter(ImageFilter.BLUR).size)

# Save it, then read it back from the virtual filesystem
img.save("banner.png")
import os
print("bytes on disk:", os.path.getsize("banner.png"))

reopened = Image.open("banner.png")
print("reopened:", reopened.size, reopened.format)
`,
      markdownContent: `# Images with Pillow

**Pillow** is the standard image library — resizing, converting, cropping, reading metadata. It's third-party, so on your machine: \`pip install Pillow\`, imported as \`PIL\`.

---

## Making and inspecting

\`\`\`python
from PIL import Image

img = Image.new("RGB", (200, 100), (20, 40, 80))
img.size       # (200, 100)  — (width, height)
img.mode       # 'RGB'
img.getpixel((0, 0))   # (20, 40, 80)
\`\`\`

Usually you'd open a real file instead:

\`\`\`python
img = Image.open("photo.jpg")
\`\`\`

\`Image.open()\` is **lazy** — it reads the header for \`size\` and \`format\` without decoding the pixels. That's why it's fast on a huge file, and why an actually-corrupt image may not complain until you touch the data.

The **mode** is the pixel format: \`"RGB"\` (colour), \`"RGBA"\` (with transparency), \`"L"\` (greyscale, one channel). Converting between them is a common first step.

## Transforming

\`\`\`python
img.rotate(90, expand=True)   # expand=True keeps the corners
img.resize((100, 50))
img.crop((0, 0, 50, 50))      # (left, upper, right, lower)
ImageOps.grayscale(img)
img.filter(ImageFilter.BLUR)
\`\`\`

Every one **returns a new image** and leaves the original alone — the same rule as string methods. So \`img.rotate(90)\` on its own line does nothing; you must keep the result.

The exception is \`thumbnail()\`, which modifies **in place** and returns \`None\`. An inconsistency worth knowing before it bites.

Without \`expand=True\`, \`rotate\` keeps the original canvas and cuts the corners off.

## Saving

\`\`\`python
img.save("banner.png")
img.save("banner.jpg", quality=85)
\`\`\`

The format comes from the **extension**. Saving RGBA to JPEG raises, because JPEG has no transparency — convert first with \`img.convert("RGB")\`.

---

## Why this is in a security course

Images carry more than pixels. **EXIF** metadata can hold GPS coordinates, timestamps, device serials — a genuine leak in any uploaded photo:

\`\`\`python
img._getexif()   # None, or a dict of metadata
\`\`\`

Stripping it before publishing is a real task, and Pillow is how you do it. Image parsers are also a classic attack surface: a malformed file aimed at the decoder, not the viewer. Pillow has had its share of CVEs — keep it updated, and treat uploaded images as untrusted input.

---

## Try It

Run the starter code — it builds an image, transforms it, saves it into the browser's virtual filesystem and reads it back. Pillow loads on first import, so the first run is slower.
`,
    },

    /* ── 2. Docstrings ── */
    {
      id: 'py-docstrings',
      slug: 'docstrings',
      title: { en: 'Docstrings', ar: 'سلاسل التوثيق' },
      order: 2,
      type: 'lesson',
      starterCode: `def is_valid(port):
    """Return True if port is a usable TCP/UDP port.

    A valid port is 1-65535. Port 0 is reserved.

    Args:
        port: the port number to check.

    Returns:
        bool: True when 1 <= port <= 65535.
    """
    return 1 <= port <= 65535

print(is_valid.__doc__.splitlines()[0])
print(is_valid(80), is_valid(0))

# A comment is for the reader of the source.
# A docstring is part of the object, at runtime.
def undocumented(x):
    # this comment is invisible at runtime
    return x

print("no docstring:", undocumented.__doc__)

# Modules and classes have them too
import math
print(math.sqrt.__doc__.splitlines()[0])

# help() reads the docstring
# help(is_valid)
`,
      markdownContent: `# Docstrings

A **docstring** is a string as the **first statement** of a function, class or module. Python keeps it, and it becomes the object's documentation.

\`\`\`python
def is_valid(port):
    """Return True if port is a usable TCP/UDP port."""
    return 1 <= port <= 65535

is_valid.__doc__   # 'Return True if port is a usable TCP/UDP port.'
help(is_valid)     # prints it
\`\`\`

---

## Not a comment

The distinction Module 2 promised to come back to:

- A **comment** (\`#\`) is stripped away. It exists only in the source, for whoever reads the file.
- A **docstring** is a real object attribute, alive at runtime. \`help()\`, IDE tooltips and doc generators all read it.

That's why the triple-quoted string in the **first position** is special and one further down is just a discarded string.

## The convention

\`\`\`python
def scan(host, ports, timeout=5):
    """Scan host for open ports.

    Args:
        host: IP or hostname to scan.
        ports: iterable of port numbers.
        timeout: seconds to wait per port.

    Returns:
        list[int]: the ports found open.

    Raises:
        ValueError: if ports is empty.
    """
\`\`\`

The shape (PEP 257): a **one-line summary** first, in the imperative — "Return the...", not "Returns the..." or "This function returns..." — then a blank line, then detail.

The one-liner matters most: it's what shows in tooltips and index listings. If you can't summarise the function in one line, the function is probably doing too much.

---

## Documenting vs commenting

Two different jobs, and confusing them produces noise:

**Comments** explain *why*, to whoever edits the code. From Module 2:

\`\`\`python
x = 10  # max retries before we treat the host as down
\`\`\`

**Docstrings** explain *what and how to use it*, to whoever **calls** it — someone who will never read the body:

\`\`\`python
"""Return the ports found open on host."""
\`\`\`

A caller needs to know what goes in, what comes out, and what can go wrong. They don't need your implementation notes — those are comments.

## Don't document the obvious

\`\`\`python
def get_name(self):
    """Get the name."""    # adds nothing
\`\`\`

If the docstring only restates the signature, delete it. Good naming already did the job. Save documentation for what the code *can't* say: units, edge cases, what raises, what the return means when it's empty.

---

## Try It

Run the starter code. \`is_valid.__doc__\` exists at runtime; the comment inside \`undocumented\` is gone entirely.
`,
    },

    /* ── 3. Linting ── */
    {
      id: 'py-linting',
      slug: 'linting',
      title: { en: 'Linting and Style', ar: 'الفحص والأسلوب' },
      order: 3,
      type: 'lesson',
      starterCode: `# A linter reads code WITHOUT running it, and reports problems.
# Here is what one would flag in this file:

import os, sys          # C0410: multiple imports on one line

UnusedImport = os       # ...and 'sys' is imported but never used

def f( x,y ):           # C0103: bad name; and the spacing is off
    z = x+y             # C0103 again; missing spaces around '+'
    return z
    print("unreachable")  # W0101: unreachable code

l = [1,2,3]             # E741: 'l' is a terrible name (looks like 1)
print(f(1, 2), l)

# The linter catches real bugs too, not just style:
def broken():
    total = 0
    for i in range(3):
        total += i
    return totl        # E0602: undefined variable 'totl' — a typo

# Nothing above RUNS wrong until you call broken().
# A linter would tell you before you ever ran it.
`,
      markdownContent: `# Linting and Style

A **linter** reads your code without running it and reports problems — typos, unused imports, unreachable lines, style violations.

---

## Why it matters

Python only discovers most mistakes when the line executes. This is a perfectly valid file:

\`\`\`python
def broken():
    total = 0
    return totl    # a typo
\`\`\`

No error until someone calls \`broken()\`. If that's in a rare branch, it ships. A linter finds it in a second, before you run anything.

That's the real value: **static analysis catches what dynamic typing lets through.**

## The tools

\`\`\`
pip install pylint
pylint myfile.py

pip install flake8      # lighter, style-focused
pip install ruff        # much faster, increasingly the default
\`\`\`

Output looks like:

\`\`\`
myfile.py:3:0: C0103: Constant name "l" doesn't conform to naming style
myfile.py:5:4: W0612: Unused variable 'z'
myfile.py:8:0: E0602: Undefined variable 'totl'
\`\`\`

The letters are the severity: **E**rror (likely broken), **W**arning (suspicious), **C**onvention (style), **R**efactor (could be simpler).

Pylint scores you out of 10. Chasing 10/10 is a waste of time — plenty of its complaints are matters of taste. Fix the **E**s always, read the **W**s, and configure away the **C**s you disagree with (in \`pyproject.toml\` or \`.pylintrc\`).

## Formatters are different

A linter *reports*; a **formatter** *rewrites*:

\`\`\`
pip install black
black myfile.py
\`\`\`

**Black** reformats to one consistent style with almost no options. That's the point: nobody argues about spacing again, and diffs stop being full of reformatting noise. Run a formatter on save and a linter in CI.

## PEP 8

The style guide the tools encode — 4-space indents, \`snake_case\` functions, \`UPPER_CASE\` constants, spaces around operators, ~79-character lines. You've been following it since Module 2.

The reason isn't aesthetics. Consistent code is **scannable**: when everything looks the same, the thing that's different stands out. That's how you spot bugs by eye.

---

## In this editor

There's no linter here — it's a Python runtime, not an IDE. On your machine, your editor runs one as you type and underlines problems live.

Read the starter code and find the problems yourself. That's the same skill; the tool just never gets bored.

---

## Try It

Run the starter code — it works, despite everything wrong with it. Then read the comments and count how many issues a linter would have flagged before you ever hit Run.
`,
    },

    /* ── 4. Errors and Raising ── */
    {
      id: 'py-errors',
      slug: 'errors-raising',
      title: { en: 'Errors and Raising', ar: 'الأخطاء وإطلاقها' },
      order: 4,
      type: 'lesson',
      starterCode: `# The exceptions you have already met
for code in ['int("abc")', '[1][5]', '{"a":1}["b"]', '1/0', '"a"+1', 'undefined_name']:
    try:
        eval(code)
    except Exception as e:
        print(f"{code:18} -> {type(e).__name__}: {e}")

# raise your own
def set_port(port):
    if not isinstance(port, int):
        raise TypeError(f"port must be an int, got {type(port).__name__}")
    if not 1 <= port <= 65535:
        raise ValueError(f"port out of range: {port}")
    return port

for bad in ["80", 0, 99999]:
    try:
        set_port(bad)
    except (TypeError, ValueError) as e:
        print(f"{type(e).__name__}: {e}")

print(set_port(80))
`,
      markdownContent: `# Errors and Raising

An **exception** is Python's way of saying "I can't do this." It stops the program rather than continuing with a wrong answer — which is the right instinct.

---

## The ones you know

You've met most of these already:

| Exception | Cause |
|---|---|
| \`ValueError\` | right type, impossible value — \`int("abc")\` |
| \`TypeError\` | wrong type — \`"a" + 1\` |
| \`IndexError\` | list index out of range |
| \`KeyError\` | missing dict key |
| \`ZeroDivisionError\` | \`1 / 0\` |
| \`NameError\` | undefined name |
| \`FileNotFoundError\` | missing file |
| \`AttributeError\` | no such method |

\`ValueError\` vs \`TypeError\` is the distinction to keep straight: \`int("abc")\` is a **ValueError** — a string is the right type, that particular string just isn't a number. \`int([])\` is a **TypeError**.

---

## raise

Throw your own when something is wrong:

\`\`\`python
def set_port(port):
    if not isinstance(port, int):
        raise TypeError(f"port must be an int, got {type(port).__name__}")
    if not 1 <= port <= 65535:
        raise ValueError(f"port out of range: {port}")
    return port
\`\`\`

\`raise\` stops the function immediately, like \`return\` but shouting.

**Raise early.** Check at the boundary, so a bad value is rejected where it enters — not five functions later where the message makes no sense.

**Pick the right type.** \`TypeError\` for the wrong kind of thing, \`ValueError\` for the wrong value. Callers catch specific exceptions, so the type is part of the interface.

**Say what's wrong in the message.** Compare:

\`\`\`python
raise ValueError("bad input")            # useless
raise ValueError(f"port out of range: {port}")   # actionable
\`\`\`

The second tells you the rule and the offending value. You will read this message at 3am one day.

## Don't return an error code

\`\`\`python
def set_port(port):
    if not valid:
        return -1     # don't
\`\`\`

The caller has to remember to check, and \`-1\` flows onward silently when they don't. An exception can't be ignored by accident. **Fail loudly.**

That's the recurring theme from Module 6: Python gives you a loud version and a quiet one. When something is genuinely wrong, choose loud.

---

## Try It

Run the starter code. The first block shows six familiar failures with their real types and messages; the second raises its own.
`,
    },

    /* ── 5. try / except / else / finally ── */
    {
      id: 'py-try-except',
      slug: 'try-except',
      title: { en: 'try / except / else / finally', ar: 'try / except / else / finally' },
      order: 5,
      type: 'lesson',
      starterCode: `def parse(raw):
    try:
        value = int(raw)
    except ValueError:
        print(f"  {raw!r}: not a number")
        return None
    else:
        print(f"  {raw!r}: parsed fine")
        return value
    finally:
        print(f"  {raw!r}: finally always runs")

for raw in ["42", "abc"]:
    print("->", parse(raw))

# Catch several, and keep the object
try:
    {"a": 1}["b"]
except (KeyError, IndexError) as e:
    print(f"{type(e).__name__}: {e}")

# Order matters: specific BEFORE general
try:
    int("x")
except ValueError:
    print("caught the specific one")
except Exception:
    print("never reached")

# Bare except catches EVERYTHING — including your typos
try:
    undefined_thing
except Exception as e:
    print("bare-ish:", type(e).__name__)
`,
      markdownContent: `# try / except / else / finally

Handling an exception instead of letting it stop the program.

---

## The four parts

\`\`\`python
try:
    value = int(raw)        # might fail
except ValueError:
    print("not a number")   # runs ONLY on that failure
else:
    print("parsed fine")    # runs only if NOTHING failed
finally:
    print("always runs")    # runs no matter what
\`\`\`

**\`try\`** — the risky code. Keep it **short**: only the line that can fail. A big \`try\` catches errors you didn't mean to catch.

**\`except\`** — what to do about it.

**\`else\`** — runs when no exception fired. Why bother? It keeps the \`try\` minimal: put the risky call in \`try\` and the follow-up work in \`else\`, so a failure *there* isn't swallowed by your handler.

**\`finally\`** — always runs: success, failure, even a \`return\` inside the \`try\`. It's for cleanup — closing things, releasing locks. \`with\` is built on this idea, which is why \`with open(...)\` can't leak.

---

## Catch specific exceptions

The most important rule:

\`\`\`python
try:
    value = int(raw)
except ValueError:      # yes — the one thing you expect
except Exception:       # rarely
except:                 # never
\`\`\`

A **bare \`except:\`** catches everything — including \`NameError\` from your own typo, and \`KeyboardInterrupt\` when a user tries to quit. Your program keeps running, quietly broken, and the real problem is hidden.

\`\`\`python
try:
    result = compute()
except:
    result = 0     # was it bad input, or did you misspell a variable?
\`\`\`

You'll never know. **Catch the exception you can actually handle**; let the rest crash, because a crash with a traceback tells you exactly what to fix.

Several at once, and keep the object:

\`\`\`python
except (KeyError, IndexError) as e:
    print(type(e).__name__, e)
\`\`\`

**Order specific before general.** The first matching \`except\` wins, so a general one first makes the rest unreachable — the same rule as \`elif\` in Module 9.

## Don't silence it

\`\`\`python
try:
    risky()
except Exception:
    pass         # the worst two lines in Python
\`\`\`

That's a bug you will never find. If you truly must continue, **log it**:

\`\`\`python
except Exception as e:
    logger.warning("risky() failed: %s", e)
\`\`\`

---

## EAFP

Python's style is **"easier to ask forgiveness than permission"**:

\`\`\`python
try:                       # EAFP — Pythonic
    value = data["key"]
except KeyError:
    value = None

if "key" in data:          # LBYL — fine, but racy for files
    value = data["key"]
\`\`\`

For files, EAFP is genuinely more correct: the file can vanish between \`exists()\` and \`open()\`, as Module 12 noted. \`try\` has no gap.

---

## Try It

Run the starter code and watch the order: \`finally\` runs even after \`return\`.
`,
    },

    /* ── 6. Exceptions in Practice ── */
    {
      id: 'py-exceptions-practice',
      slug: 'exceptions-practice',
      title: { en: 'Exceptions in Practice', ar: 'الاستثناءات عمليا' },
      order: 6,
      type: 'lesson',
      sampleInput: 'abc\n99999\n8080\n',
      starterCode: `# Your own exception type
class InvalidPort(Exception):
    """Raised when a port is outside 1-65535."""

def parse_port(raw):
    port = int(raw)                      # may raise ValueError
    if not 1 <= port <= 65535:
        raise InvalidPort(f"out of range: {port}")
    return port

# Keep asking until it is valid
while True:
    raw = input("Port: ").strip()
    try:
        port = parse_port(raw)
    except ValueError:
        print("  not a number, try again")
    except InvalidPort as e:
        print(f"  {e}, try again")
    else:
        print("accepted:", port)
        break

# Chaining: raise a friendly error, keep the original cause
def load(raw):
    try:
        return int(raw)
    except ValueError as e:
        raise InvalidPort(f"bad port {raw!r}") from e

try:
    load("abc")
except InvalidPort as e:
    print(f"{e} | caused by {type(e.__cause__).__name__}")
`,
      markdownContent: `# Exceptions in Practice

---

## Your own exception type

\`\`\`python
class InvalidPort(Exception):
    """Raised when a port is outside 1-65535."""
\`\`\`

That's a complete class — inherit from \`Exception\`, give it a docstring, done. (Classes are beyond this course; this pattern is all you need.)

Why bother, when \`ValueError\` exists? Because it lets callers catch **your** failure specifically:

\`\`\`python
except InvalidPort:      # exactly this problem
except ValueError:       # this, and every other value error
\`\`\`

Name it for the problem, and end it in \`Error\` if it's an error. Always inherit from \`Exception\`, never \`BaseException\` — that's the one \`KeyboardInterrupt\` uses, and catching it stops users quitting.

## The validation loop

Everything so far, in one shape:

\`\`\`python
while True:
    raw = input("Port: ").strip()
    try:
        port = parse_port(raw)
    except ValueError:
        print("  not a number, try again")
    except InvalidPort as e:
        print(f"  {e}, try again")
    else:
        break
\`\`\`

Two failure modes, two messages, and \`else\` + \`break\` to leave on success. This is the honest version of the Module 10 loop — \`isdigit()\` couldn't handle \`"-5"\` or \`"3.14"\`; \`try/except\` handles anything \`int()\` rejects, because it asks \`int()\` itself.

## Chaining with \`from\`

Wrap a low-level failure in a meaningful one, without losing the trail:

\`\`\`python
try:
    return int(raw)
except ValueError as e:
    raise InvalidPort(f"bad port {raw!r}") from e
\`\`\`

The caller gets \`InvalidPort\` — the error that means something to them — and the traceback still shows the \`ValueError\` underneath, via \`__cause__\`. You get a clean interface *and* the diagnostics.

Without \`from e\`, Python still shows "During handling of the above exception, another occurred" — \`from\` makes the relationship explicit and deliberate.

## Where to handle

The rule: **catch it where you can do something about it.**

A deep utility that catches and returns \`None\` has destroyed information the caller needed. Let it raise; handle it at the level that knows what to do — retry, use a default, tell the user, give up.

That's why \`parse_port\` raises rather than printing. It doesn't know whether it's serving a CLI, a web request, or a test.

---

## Try It

Run it — the Input box has \`abc\`, then \`99999\`, then \`8080\`. Each is rejected by a different handler for a different reason.
`,
    },

    /* ── 7. Debugging ── */
    {
      id: 'py-debugging',
      slug: 'debugging',
      title: { en: 'Debugging', ar: 'تنقيح الأخطاء' },
      order: 7,
      type: 'lesson',
      starterCode: `import traceback

def level_three(data):
    return data["missing"]

def level_two(data):
    return level_three(data)

def level_one():
    return level_two({"a": 1})

# Read a traceback from the BOTTOM up
try:
    level_one()
except KeyError:
    traceback.print_exc()

# The f-string = trick — the fastest debugging tool you have
port, host = 8080, "10.0.0.5"
print(f"{port = }, {host = }")
print(f"{port > 1024 = }")

# repr shows what print hides
value = " 42\\n"
print("print:", value.strip())
print("repr :", repr(value))

# type() and dir() when you do not know what you are holding
mystery = {"a": 1}.keys()
print(type(mystery).__name__)
print([m for m in dir(mystery) if not m.startswith("_")])
`,
      markdownContent: `# Debugging

Code fails. The skill is finding out **why**, quickly.

---

## Read the traceback

Beginners see a wall of text and panic. It's a precise report — read it **bottom up**:

\`\`\`
Traceback (most recent call last):
  File "x.py", line 12, in level_one
    return level_two({"a": 1})
  File "x.py", line 9, in level_two
    return level_three(data)
  File "x.py", line 6, in level_three
    return data["missing"]
KeyError: 'missing'
\`\`\`

- **The last line** is what went wrong: \`KeyError: 'missing'\`.
- **The line above it** is where: \`level_three\`, line 6.
- **The rest** is how you got there — the call chain, outermost first.

"Most recent call last" means the deepest frame is at the bottom. Start there; that's your bug 90% of the time. The chain above matters when the real problem is *which* caller passed bad data.

## print debugging is fine

There's snobbery about \`print()\` debugging. Ignore it — it's fast, it always works, and it needs no setup.

The f-string \`=\` trick from Module 3 makes it painless:

\`\`\`python
print(f"{port = }, {host = }")   # port = 8080, host = '10.0.0.5'
print(f"{port > 1024 = }")       # port > 1024 = True
\`\`\`

Name and value together, no typing the name twice, no drift when you rename.

## repr shows what print hides

\`\`\`python
value = " 42\\n"
print(value)        # 42        <- looks fine!
print(repr(value))  # ' 42\\n'   <- there's the bug
\`\`\`

When a value "looks right" but won't compare equal, **\`repr()\` it**. Whitespace, \`"42"\` vs \`42\`, \`None\` vs \`"None"\` — all invisible to \`print\` and obvious to \`repr\`.

## When you don't know what you're holding

\`\`\`python
type(x).__name__   # what is it?
dir(x)             # what can it do?
vars(x)            # what's inside it?
\`\`\`

## The real debugger

\`\`\`python
breakpoint()   # drops into pdb, right there
\`\`\`

Then \`n\` (next), \`s\` (step in), \`c\` (continue), \`p x\` (print x), \`q\` (quit). It's interactive, so it needs a terminal — it won't work in this editor, and your IDE's graphical debugger is nicer anyway.

## The method

When you're stuck, the failure is that you're **guessing**. Instead:

1. **Read the error.** Actually read it. It usually names the problem.
2. **Find the smallest failing case.** Cut away everything that still fails without it.
3. **Check your assumptions** — that's what \`print(f"{x = }")\` is for. The bug is almost always where you were *certain* you were right.
4. **Change one thing at a time.**

Most bugs are a value not being what you assumed. Print it and the mystery usually evaporates.

---

## Try It

Run the starter code. The traceback shows three frames — read it bottom-up and find \`level_three\` in one step.
`,
    },

    /* ── 8. Type Hinting ── */
    {
      id: 'py-type-hints',
      slug: 'type-hinting',
      title: { en: 'Type Hinting', ar: 'تلميحات الأنواع' },
      order: 8,
      type: 'lesson',
      starterCode: `def is_valid(port: int) -> bool:
    return 1 <= port <= 65535

def describe(port: int, proto: str = "tcp") -> str:
    return f"{port}/{proto}"

print(is_valid(80), describe(53, "udp"))

# Hints are NOT enforced — this runs fine
print(is_valid("not an int") if False else "hints don't stop you")
print(describe("80", "tcp"))

# Collections
def open_ports(ports: list[int]) -> list[int]:
    return [p for p in ports if is_valid(p)]

print(open_ports([22, 0, 8080]))

def lookup(name: str) -> int | None:
    return {"ssh": 22}.get(name)

print(lookup("ssh"), lookup("nope"))

# They are readable at runtime
print(is_valid.__annotations__)
print(open_ports.__annotations__)
`,
      markdownContent: `# Type Hinting

**Type hints** say what types a function expects and returns.

\`\`\`python
def is_valid(port: int) -> bool:
    return 1 <= port <= 65535
\`\`\`

\`port: int\` — the parameter should be an \`int\`. \`-> bool\` — it returns a \`bool\`.

---

## Python does not enforce them

The thing to understand first:

\`\`\`python
describe("80", "tcp")   # runs fine — no error
\`\`\`

Python **ignores** hints at runtime. They're annotations, not checks. Nothing stops you passing the wrong type; Python stays dynamically typed.

So what's the point?

**1. Documentation that can't drift.** A comment saying "port is an int" can go stale. A hint is in the signature, where a reader looks first.

**2. Your editor.** With hints, VS Code autocompletes \`.upper()\` on a \`str\` parameter and flags \`port.upper()\` on an \`int\` — as you type, before you run.

**3. Static checkers.** This is the real payoff:

\`\`\`
pip install mypy
mypy myfile.py
\`\`\`

\`\`\`
myfile.py:5: error: Argument 1 to "describe" has incompatible type "str"; expected "int"
\`\`\`

Like a linter, but for types. It catches a whole class of bug — the \`"18" == 18\` kind from Module 7 — without running anything.

## The syntax

\`\`\`python
name: str = "sara"                     # variables too
def f(port: int, proto: str = "tcp") -> str:
def g(ports: list[int]) -> list[int]:
def h(host: str) -> dict[str, int]:
def i(name: str) -> int | None:        # int OR None
def j() -> None:                       # returns nothing
\`\`\`

\`int | None\` is the modern union (3.10+); older code writes \`Optional[int]\` from \`typing\`. It's the honest signature for anything that might not find an answer — \`.get()\`, a lookup, a parse.

Lowercase \`list[int]\` and \`dict[str, int]\` are current (3.9+). \`List\`/\`Dict\` from \`typing\` are the old way, still common in older codebases.

## Where to use them

Hint your **function signatures** — the boundaries. That's where the information helps a caller and a checker.

Don't hint every local variable; it's noise, and the value's obvious from the line above:

\`\`\`python
count: int = 0   # adds nothing
\`\`\`

Hints are optional and incremental. Add them to new code and to the tricky parts of old code. A partly-hinted codebase is fine — mypy checks what it can.

They're readable at runtime if you want them:

\`\`\`python
is_valid.__annotations__   # {'port': <class 'int'>, 'return': <class 'bool'>}
\`\`\`

---

## Try It

Run the starter code. \`describe("80", "tcp")\` works despite the hint saying \`int\` — Python doesn't care, but mypy would have told you.
`,
    },

    /* ── 9. HTTP with requests ── */
    {
      id: 'py-requests-intro',
      slug: 'requests-intro',
      title: { en: 'HTTP with requests', ar: 'HTTP مع requests' },
      order: 9,
      type: 'lesson',
      starterCode: `# NOTE: real network calls cannot run in the browser sandbox — there are no
# raw sockets here. The code below is exactly what you would write on your
# machine; here we model a Response so you can see the SHAPE of the API.
import json

class FakeResponse:
    def __init__(self, status_code, body, headers):
        self.status_code = status_code
        self.text = body
        self.headers = headers
    def json(self):
        return json.loads(self.text)
    @property
    def ok(self):
        return self.status_code < 400
    def raise_for_status(self):
        if not self.ok:
            raise Exception(f"{self.status_code} Error")

r = FakeResponse(200, '{"login": "d0lv3", "public_repos": 12}',
                 {"Content-Type": "application/json"})

print("status:", r.status_code)
print("ok:", r.ok)
print("text:", r.text)
print("json:", r.json())
print("field:", r.json()["login"])
print("header:", r.headers["Content-Type"])

bad = FakeResponse(404, "not found", {})
print("ok:", bad.ok)
try:
    bad.raise_for_status()
except Exception as e:
    print("raise_for_status:", e)
`,
      markdownContent: `# HTTP with requests

**requests** is the standard way to speak HTTP from Python. Third-party: \`pip install requests\`.

---

## A word about this editor

Real HTTP **cannot run here.** The browser sandbox has no raw sockets, and a page can only reach servers that permit it. That's the same sandbox that makes this editor safe.

So the starter models a \`Response\` object instead, to show the API's shape. Every snippet in this lesson is exactly what you'd write on your machine.

---

## GET

\`\`\`python
import requests

r = requests.get("https://api.github.com/users/d0lv3")
print(r.status_code)   # 200
print(r.text)          # the raw body, as a string
print(r.json())        # parsed, if it's JSON
\`\`\`

\`requests.get()\` returns a **Response**. The useful bits:

| | |
|---|---|
| \`r.status_code\` | 200, 404, 500… |
| \`r.ok\` | \`True\` when < 400 |
| \`r.text\` | body as \`str\` |
| \`r.content\` | body as \`bytes\` — for images, files |
| \`r.json()\` | parsed JSON → dict/list |
| \`r.headers\` | response headers (a case-insensitive dict) |

\`r.json()\` raises if the body isn't JSON — check the content type, or wrap it in \`try\`.

## Query parameters

Don't build the URL by hand:

\`\`\`python
requests.get("https://api.example.com/search?q=" + term)          # no
requests.get("https://api.example.com/search", params={"q": term}) # yes
\`\`\`

\`params\` **encodes** for you. A term with a space, \`&\` or \`/\` breaks the first version — and if that term came from a user, string-building a URL is an injection bug. The library escapes it correctly; you won't.

Same principle as never building SQL with an f-string.

## POST

\`\`\`python
requests.post(url, data={"user": "sara"})    # form-encoded
requests.post(url, json={"user": "sara"})    # JSON body
\`\`\`

\`json=\` sets \`Content-Type: application/json\` and serialises for you. Most APIs want this one.

---

## A 404 is not an error

The trap that catches everyone:

\`\`\`python
r = requests.get("https://example.com/nope")
print(r.status_code)   # 404 — and NO exception was raised
\`\`\`

The request **succeeded** — the server answered, and its answer was "not found." As far as \`requests\` is concerned that's a normal response, so nothing raises.

If you want a bad status to be an exception:

\`\`\`python
r.raise_for_status()   # raises HTTPError on 4xx/5xx
\`\`\`

Otherwise every response looks fine and you'll happily parse an error page as data.

---

## Try It

Run the starter code — the fake Response mirrors the real API, including \`raise_for_status()\` staying silent on 200 and raising on 404.
`,
    },

    /* ── 10. requests in Practice ── */
    {
      id: 'py-requests-practice',
      slug: 'requests-practice',
      title: { en: 'requests in Practice', ar: 'requests عمليا' },
      order: 10,
      type: 'lesson',
      starterCode: `# Again: no real network here. This shows the shapes you will write.
import json

# Headers are a plain dict
headers = {
    "User-Agent": "cyberkhana-scanner/1.0",
    "Authorization": "Bearer TOKEN_FROM_ENV",
    "Accept": "application/json",
}
print("headers:", json.dumps(headers, indent=None))

# Never hard-code a secret — read it from the environment
import os
token = os.environ.get("API_TOKEN", "<not set>")
print("token from env:", token)

# Timeouts and proxies are just arguments
call = {
    "url": "https://api.example.com/users",
    "params": {"page": 2},
    "timeout": 10,
    "proxies": {"http": "http://127.0.0.1:8080",
                "https": "http://127.0.0.1:8080"},
}
print("call:", json.dumps(call, indent=None))

# The error types you must handle
for name in ["Timeout", "ConnectionError", "HTTPError", "TooManyRedirects"]:
    print(f"  requests.exceptions.{name}")
`,
      markdownContent: `# requests in Practice

The four things that separate a script that works on your machine from one that works.

---

## 1. Headers

A plain dict:

\`\`\`python
headers = {
    "User-Agent": "cyberkhana-scanner/1.0",
    "Authorization": "Bearer " + token,
    "Accept": "application/json",
}
r = requests.get(url, headers=headers)
\`\`\`

\`User-Agent\` is worth setting honestly — many servers reject the default, and identifying your tool is basic manners when you're allowed to be scanning at all.

**Never hard-code a token.** It ends up in git, and git remembers forever:

\`\`\`python
token = os.environ["API_TOKEN"]   # from the environment
\`\`\`

That's the single most common way secrets leak. Environment variables or a \`.env\` file that's in \`.gitignore\` — never a literal in the source.

## 2. Timeouts

**Always pass one:**

\`\`\`python
requests.get(url, timeout=10)
\`\`\`

By default \`requests\` waits **forever**. A server that accepts your connection and never answers will hang your script indefinitely — no error, no exit. A hung scan at 3am is usually a missing timeout.

There's no default because the library can't guess what's reasonable. So say.

## 3. Sessions

Making several calls to one host? Use a \`Session\`:

\`\`\`python
with requests.Session() as s:
    s.headers.update({"Authorization": f"Bearer {token}"})
    s.get(url1)
    s.get(url2)
\`\`\`

It **reuses the TCP connection** (much faster over many requests) and **persists cookies** — which is how you stay logged in after authenticating. Set the headers once instead of on every call.

Note \`with\`: a Session holds connections, so it wants closing. Same context-manager idea as files.

## 4. Proxies

\`\`\`python
proxies = {"http": "http://127.0.0.1:8080",
           "https": "http://127.0.0.1:8080"}
requests.get(url, proxies=proxies)
\`\`\`

Point your script at Burp or mitmproxy on :8080 and you can **see exactly what it sends**. Invaluable when an API rejects you and you can't work out why.

Intercepting HTTPS needs the proxy's CA cert trusted. \`verify=False\` disables certificate checking — fine against your own proxy while debugging, **never** in real code. It turns off the protection TLS exists for, and \`requests\` will warn you loudly.

---

## Handle the failures

Network calls fail. That's normal, not exceptional:

\`\`\`python
try:
    r = requests.get(url, timeout=10)
    r.raise_for_status()
except requests.exceptions.Timeout:
    print("too slow")
except requests.exceptions.ConnectionError:
    print("unreachable — DNS, refused, no route")
except requests.exceptions.HTTPError as e:
    print("bad status:", e)
except requests.exceptions.RequestException as e:
    print("something else:", e)
\`\`\`

\`RequestException\` is the base class of all of them — catch it last, as the general case. Specific before general, exactly as Module 9 and lesson 5 said.

---

## Try It

Run the starter code — it prints the shapes without touching the network. Then write the real version on your machine, and point it at a proxy to watch it work.
`,
    },

    /* ── 11. Challenge: Robust Fetch ── */
    {
      id: 'py-ch-robust-parse',
      slug: 'challenge-robust-parse',
      title: { en: 'Challenge: Robust Parser', ar: 'تحدي: محلل متين' },
      order: 11,
      type: 'challenge',
      starterCode: `import json

# A batch of API responses. Some are broken.
responses = [
    (200, '{"host": "10.0.0.5", "port": 22}'),
    (404, 'not found'),
    (200, 'this is not json'),
    (200, '{"host": "10.0.0.6", "port": 99999}'),
    (500, '{"error": "boom"}'),
    (200, '{"host": "10.0.0.7", "port": 443}'),
]

# Write parse_one(status, body) -> str, then the loop below will work.
#
# It must return, in this order of checks:
#   - "bad status: <status>"      when status is 400 or above
#   - "bad json"                  when the body will not parse
#   - "bad port: <port>"          when port is not 1-65535
#   - "<host>:<port>"             when everything is fine
#
# Rules:
#   - Use try/except — do not check the JSON by hand.
#   - Catch json.JSONDecodeError for the parse, raise/handle ValueError
#     for the port.
#
# Expected output:
#
#   10.0.0.5:22
#   bad status: 404
#   bad json
#   bad port: 99999
#   bad status: 500
#   10.0.0.7:443
#   OK: 2

# Write parse_one below:


# Do not change this:
ok = 0
for status, body in responses:
    result = parse_one(status, body)
    print(result)
    if ":" in result and not result.startswith("bad"):
        ok += 1
print("OK:", ok)
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Handles bad status, bad JSON and bad ports without crashing',
          expectedOutput:
            '10.0.0.5:22\nbad status: 404\nbad json\nbad port: 99999\nbad status: 500\n10.0.0.7:443\nOK: 2',
        },
      ],
      hints: [
        'Check the status first and return early — a guard clause, like Module 9. Then try to parse.',
        'Wrap json.loads(body) in try/except json.JSONDecodeError and return "bad json" from the except block.',
        'After parsing, pull out host and port, then check 1 <= port <= 65535. Return f"bad port: {port}" if not, else f"{host}:{port}".',
      ],
      solution: `import json

responses = [
    (200, '{"host": "10.0.0.5", "port": 22}'),
    (404, 'not found'),
    (200, 'this is not json'),
    (200, '{"host": "10.0.0.6", "port": 99999}'),
    (500, '{"error": "boom"}'),
    (200, '{"host": "10.0.0.7", "port": 443}'),
]


def parse_one(status, body):
    if status >= 400:
        return f"bad status: {status}"

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return "bad json"

    port = data.get("port")
    host = data.get("host")

    if not isinstance(port, int) or not 1 <= port <= 65535:
        return f"bad port: {port}"

    return f"{host}:{port}"


# Do not change this:
ok = 0
for status, body in responses:
    result = parse_one(status, body)
    print(result)
    if ":" in result and not result.startswith("bad"):
        ok += 1
print("OK:", ok)
`,
      markdownContent: `# Challenge: Robust Parser

Real API responses lie. Some are errors, some aren't JSON, some are JSON with nonsense in it. A parser that assumes the happy path crashes on the first one.

---

## Instructions

Write \`parse_one(status, body)\`, returning a string. Check **in this order**:

1. \`"bad status: 404"\` — status is 400 or above
2. \`"bad json"\` — the body won't parse
3. \`"bad port: 99999"\` — port isn't 1–65535
4. \`"10.0.0.5:22"\` — all good

## Expected output

\`\`\`
10.0.0.5:22
bad status: 404
bad json
bad port: 99999
bad status: 500
10.0.0.7:443
OK: 2
\`\`\`

## Rules

- Use **try/except** for the JSON — don't inspect the string by hand.
- Catch \`json.JSONDecodeError\` specifically, not bare \`except\`.
- Leave the loop at the bottom untouched.

## The shape

**Guard clauses** (Module 9) make this clean: check status, return early. Try the parse, return early on failure. Check the port, return early. The happy path ends up last and unindented.

Note the order isn't arbitrary — checking the port before confirming it parsed would crash on the non-JSON row. **Validate outward in.**

## Watch out

Row 5 is a \`500\` with a *valid* JSON body. The status check must come first, or you'll report a missing port instead of the server error that actually happened.

---

Click **Submit** when ready.
`,
    },
  ],
};

export default qualityErrors;
