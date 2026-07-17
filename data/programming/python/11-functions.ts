import type { ProgrammingModule } from '../types';

const functions: ProgrammingModule = {
  id: 'py-functions',
  slug: 'functions',
  title: {
    en: 'Functions',
    ar: 'الدوال',
  },
  description: {
    en: 'Naming a piece of work — parameters, return, *args and **kwargs, scope, recursion and lambda.',
    ar: 'تسمية جزء من العمل — المعاملات، return، *args و **kwargs، النطاق، التكرار الذاتي، و lambda.',
  },
  order: 11,
  concepts: [
    /* ── 1. Functions and return ── */
    {
      id: 'py-functions-intro',
      slug: 'functions-intro',
      title: { en: 'Functions and return', ar: 'الدوال و return' },
      order: 1,
      type: 'lesson',
      starterCode: `def greet():
    print("hello")

greet()          # call it — the parentheses matter
print(greet)     # without them, you get the function itself

# return hands a value BACK to the caller
def double(n):
    return n * 2

print(double(5))
result = double(5)
print(result + 1)

# print is not return
def shout(word):
    print(word.upper())

x = shout("hi")
print("shout returned:", x)

# return exits immediately
def first_even(nums):
    for n in nums:
        if n % 2 == 0:
            return n
    return None

print(first_even([1, 3, 4, 5]))
print(first_even([1, 3, 5]))
`,
      markdownContent: `# Functions and return

A **function** is a named piece of work you can run whenever you want.

\`\`\`python
def greet():
    print("hello")

greet()
\`\`\`

\`def\`, a name, parentheses, a colon, then an indented block — the same block rule as \`if\` and \`for\`.

Defining a function doesn't run it. The body only executes when you **call** it, and the parentheses are what call it:

\`\`\`python
greet     # the function itself
greet()   # calling it
\`\`\`

Forgetting the parentheses is a quiet bug: \`greet\` on its own is a perfectly valid expression that does nothing.

---

## return

\`print\` shows a value to a human. **\`return\` hands it back to the code that called it** — which is what makes functions composable:

\`\`\`python
def double(n):
    return n * 2

result = double(5)   # 10
print(result + 1)    # 11
\`\`\`

The difference is the single most common confusion in this module:

\`\`\`python
def shout(word):
    print(word.upper())

x = shout("hi")   # prints HI
print(x)          # None
\`\`\`

\`shout\` printed something, but **returned nothing**, so \`x\` is \`None\`. A function with no \`return\` returns \`None\` — always. You can't do arithmetic on it, store it usefully, or pass it on.

Rule of thumb: functions that **compute** should \`return\`. Only functions whose entire job is output should \`print\`. Mixing the two makes a function hard to reuse and impossible to test.

## return exits immediately

\`\`\`python
def first_even(nums):
    for n in nums:
        if n % 2 == 0:
            return n      # stops here — loop and function both end
    return None
\`\`\`

\`return\` doesn't just set a value; it **leaves the function on the spot**. Anything after it is skipped, including the rest of a loop. That's what makes guard clauses (Module 9) work.

A function can have several \`return\`s. The first one reached wins.

---

## Why bother

1. **Don't repeat yourself.** One definition, many calls. Fix a bug once.
2. **Naming.** \`is_valid_port(p)\` says what a condition *means*.
3. **Isolation.** A function is a box with a clear input and output — you can reason about it alone.

The moment you copy-paste a block and tweak one value, that block wanted to be a function with a parameter.

---

## Try It

Run the starter code. \`shout\` returns \`None\` despite printing — that's the lesson.
`,
    },

    /* ── 2. Parameters and Arguments ── */
    {
      id: 'py-parameters',
      slug: 'parameters-arguments',
      title: { en: 'Parameters and Arguments', ar: 'المعاملات والوسائط' },
      order: 2,
      type: 'lesson',
      starterCode: `def connect(host, port):
    return f"{host}:{port}"

# Positional — order decides
print(connect("10.0.0.5", 8080))

# Keyword — name decides, so order stops mattering
print(connect(port=8080, host="10.0.0.5"))

# Mixed: positional must come FIRST
print(connect("10.0.0.5", port=8080))

# Wrong count -> TypeError
# connect("10.0.0.5")   # missing 'port'

def scan(host, port=80, timeout=5):
    return f"{host}:{port} t={timeout}"

print(scan("10.0.0.5"))
print(scan("10.0.0.5", 443))
print(scan("10.0.0.5", timeout=1))
`,
      markdownContent: `# Parameters and Arguments

Two words for two sides of the same thing:

- a **parameter** is the name in the definition — \`def connect(host, port)\`
- an **argument** is the value you pass — \`connect("10.0.0.5", 8080)\`

---

## Positional arguments

Matched by **order**:

\`\`\`python
connect("10.0.0.5", 8080)   # host, then port
\`\`\`

Swap them and Python won't notice — it can't know \`8080\` isn't a hostname. You get a wrong answer, not an error.

Pass the wrong **number**, though, and it raises immediately:

\`\`\`python
connect("10.0.0.5")   # TypeError: missing 1 required positional argument: 'port'
\`\`\`

## Keyword arguments

Matched by **name**, so order stops mattering:

\`\`\`python
connect(port=8080, host="10.0.0.5")
\`\`\`

They're self-documenting. Compare:

\`\`\`python
scan("10.0.0.5", 443, 1, True, False)      # what are those?
scan("10.0.0.5", port=443, timeout=1)      # obvious
\`\`\`

Rule of thumb: pass the first one or two positionally, and name anything that would otherwise be a mystery number.

**Positional arguments must come first.** \`connect(host="x", 8080)\` is a \`SyntaxError\`.

---

## Default values

Give a parameter a default and it becomes optional:

\`\`\`python
def scan(host, port=80, timeout=5):
    ...

scan("10.0.0.5")               # port=80, timeout=5
scan("10.0.0.5", 443)          # port=443
scan("10.0.0.5", timeout=1)    # skip port, set timeout
\`\`\`

That last call is why keywords matter: you can set a later parameter without restating the ones before it.

**Parameters with defaults must come after those without** — otherwise a positional call would be ambiguous:

\`\`\`python
def scan(port=80, host):   # SyntaxError
\`\`\`

---

## The mutable default trap

The famous Python gotcha:

\`\`\`python
def add(item, items=[]):     # DON'T
    items.append(item)
    return items

add("a")   # ['a']
add("b")   # ['a', 'b']   <- the SAME list!
\`\`\`

The default is evaluated **once, when the function is defined** — not per call. So every call shares one list, and it grows forever.

The fix is always the same:

\`\`\`python
def add(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
\`\`\`

Never use a mutable default (\`[]\`, \`{}\`, \`set()\`). Use \`None\` and build it inside.

---

## Try It

Run the starter code. Then try the mutable-default version above and watch the list grow across calls.
`,
    },

    /* ── 3. *args and **kwargs ── */
    {
      id: 'py-args-kwargs',
      slug: 'args-kwargs',
      title: { en: '*args and **kwargs', ar: '*args و **kwargs' },
      order: 3,
      type: 'lesson',
      starterCode: `# *args collects extra positional arguments into a TUPLE
def total(*nums):
    return sum(nums)

print(total(1, 2), total(1, 2, 3, 4), total())

# **kwargs collects extra keyword arguments into a DICT
def describe(**info):
    return ", ".join(f"{k}={v}" for k, v in info.items())

print(describe(host="10.0.0.5", port=80))

# All together — the order is fixed
def demo(required, *args, **kwargs):
    return f"{required} | {args} | {kwargs}"

print(demo("a", 1, 2, x=9))

# * also UNPACKS when calling
nums = [1, 2, 3]
print(total(*nums))

opts = {"host": "10.0.0.5", "port": 22}
print(describe(**opts))
`,
      markdownContent: `# *args and **kwargs

For when you don't know how many arguments there will be.

---

## *args — extra positionals

\`\`\`python
def total(*nums):
    return sum(nums)

total(1, 2)          # 3
total(1, 2, 3, 4)    # 10
total()              # 0
\`\`\`

\`*nums\` collects every extra positional argument into a **tuple**. A tuple, not a list — you're not meant to modify it.

The \`*\` is the syntax; \`args\` is just a conventional name. \`*nums\` is clearer when you know what they are.

## **kwargs — extra keywords

\`\`\`python
def describe(**info):
    return ", ".join(f"{k}={v}" for k, v in info.items())

describe(host="10.0.0.5", port=80)   # 'host=10.0.0.5, port=80'
\`\`\`

\`**info\` collects extra **keyword** arguments into a **dict** — keys are the names, values the values.

## Together

The order is fixed and Python enforces it:

\`\`\`python
def demo(required, *args, **kwargs):
    ...

demo("a", 1, 2, x=9)
# required = "a"
# args     = (1, 2)
# kwargs   = {"x": 9}
\`\`\`

Normal parameters, then \`*args\`, then \`**kwargs\`. Anything else is a \`SyntaxError\`.

---

## The other direction: unpacking

The same symbols **unpack** at the call site — which is the half people miss:

\`\`\`python
nums = [1, 2, 3]
total(*nums)          # same as total(1, 2, 3)

opts = {"host": "10.0.0.5", "port": 22}
describe(**opts)      # same as describe(host="10.0.0.5", port=22)
\`\`\`

\`*\` spreads a sequence into positional arguments; \`**\` spreads a dict into keyword arguments.

So the meaning depends on where you write it:

- **in a definition** → *collect* many into one
- **in a call** → *spread* one into many

Two opposite jobs, one symbol. That symmetry is why \`total(*nums)\` and \`def total(*nums)\` look alike.

## Where you'll actually use it

Mostly when wrapping another function — accept anything, pass it straight through:

\`\`\`python
def logged(*args, **kwargs):
    print("calling with", args, kwargs)
    return real_function(*args, **kwargs)
\`\`\`

That's exactly how decorators work (Module 13). Don't reach for \`*args\` when three named parameters would do — named parameters document themselves.

---

## Try It

Run the starter code. The last two lines are unpacking: the same \`*\` and \`**\` doing the reverse job.
`,
    },

    /* ── 4. Scope ── */
    {
      id: 'py-scope',
      slug: 'scope',
      title: { en: 'Scope', ar: 'النطاق' },
      order: 4,
      type: 'lesson',
      starterCode: `x = "global"

def show():
    print("inside:", x)      # can READ the global

show()

def shadow():
    x = "local"              # a NEW local, shadowing the global
    print("inside:", x)

shadow()
print("outside:", x)         # unchanged

# Assigning makes the whole name local -> this raises
def broken():
    # print(x)   # UnboundLocalError if uncommented
    x = "local"
    return x
print(broken())

# global says: use the module-level name
counter = 0
def bump():
    global counter
    counter += 1
bump(); bump()
print("counter:", counter)

# Mutating is not assigning — no global needed
items = []
def add():
    items.append("x")
add()
print("items:", items)
`,
      markdownContent: `# Scope

**Scope** is where a name is visible.

Every function call gets its own private space. Names created inside it are **local** — they exist while it runs and vanish when it returns:

\`\`\`python
def f():
    y = 1
f()
print(y)   # NameError: name 'y' is not defined
\`\`\`

That's a feature. Two functions can both use \`i\` without colliding.

---

## Reading vs assigning

A function can **read** a name from outside:

\`\`\`python
x = "global"
def show():
    print(x)   # works
\`\`\`

But **assigning** creates a *new local* that shadows it:

\`\`\`python
def shadow():
    x = "local"   # a different x
    print(x)      # local
shadow()
print(x)          # global — untouched
\`\`\`

And here's the sharp edge. Python decides local-or-global by scanning the **whole function** at definition time. If a name is assigned *anywhere* in it, it's local *everywhere* in it — including before the assignment:

\`\`\`python
def broken():
    print(x)      # UnboundLocalError
    x = "local"
\`\`\`

That reads like it should print the global. It doesn't. The \`x = "local"\` on the next line already made \`x\` local for the entire function, and you read it before it was set.

## global

To assign to a module-level name from inside:

\`\`\`python
counter = 0
def bump():
    global counter
    counter += 1
\`\`\`

Without \`global\`, \`counter += 1\` needs the old value of a name it has just decided is local → \`UnboundLocalError\`.

Use it sparingly. A function that quietly changes global state is hard to test and hard to trust. Prefer taking an argument and returning a result:

\`\`\`python
def bump(counter):
    return counter + 1
\`\`\`

## Mutating is not assigning

This trips people who half-learn the rule:

\`\`\`python
items = []
def add():
    items.append("x")   # no global needed!
add()
print(items)   # ['x']
\`\`\`

\`items.append(...)\` doesn't assign to \`items\` — it **calls a method on the value it already points at**. No new name is created, so no \`global\` is required.

\`items = [...]\` would be an assignment, and would need \`global\`. Names label values (Module 2): \`global\` is about **rebinding the name**, not about touching the value.

---

## The LEGB order

Python resolves a name in this order:

1. **L**ocal — this function
2. **E**nclosing — any function wrapping it
3. **G**lobal — the module
4. **B**uilt-in — \`print\`, \`len\`, …

First match wins. It's also why \`list = [1, 2]\` breaks \`list("abc")\`: your global shadows the built-in.

---

## Try It

Run the starter code, then uncomment the \`print(x)\` in \`broken()\` and read the \`UnboundLocalError\`.
`,
    },

    /* ── 5. Recursion ── */
    {
      id: 'py-recursion',
      slug: 'recursion',
      title: { en: 'Recursion', ar: 'التكرار الذاتي' },
      order: 5,
      type: 'lesson',
      starterCode: `def countdown(n):
    if n == 0:          # base case — stops the recursion
        print("liftoff")
        return
    print(n)
    countdown(n - 1)    # recursive case — a SMALLER problem

countdown(3)

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))

# Recursion shines on nested data of unknown depth
def flatten(items):
    out = []
    for item in items:
        if isinstance(item, list):
            out.extend(flatten(item))
        else:
            out.append(item)
    return out

print(flatten([1, [2, [3, [4]], 5]]))

# There is a depth limit
import sys
print("limit:", sys.getrecursionlimit())
`,
      markdownContent: `# Recursion

A function that **calls itself**.

\`\`\`python
def countdown(n):
    if n == 0:
        print("liftoff")
        return
    print(n)
    countdown(n - 1)
\`\`\`

---

## Two parts, always

Every recursive function needs both:

1. **A base case** — when to stop.
2. **A recursive case** — call itself on a **smaller** problem.

Miss the base case and it never stops. Fail to shrink the problem and it never reaches the base case. Either way you get:

\`\`\`
RecursionError: maximum recursion depth exceeded
\`\`\`

That's Python's guard, at roughly 1000 frames deep (\`sys.getrecursionlimit()\`). Without it, you'd crash the interpreter.

Write the base case **first**. Then ask: how do I make the problem smaller?

\`\`\`python
def factorial(n):
    if n <= 1:
        return 1              # base
    return n * factorial(n - 1)   # smaller
\`\`\`

Note \`n <= 1\`, not \`n == 1\`. \`factorial(0)\` should be 1, and \`==\` would sail past it into negative infinity. Base cases want to catch *everything* at or beyond the boundary.

---

## When it's the right tool

For counting down, recursion is a worse \`for\` loop — slower and more fragile.

It earns its place on **nested data of unknown depth**:

\`\`\`python
def flatten(items):
    out = []
    for item in items:
        if isinstance(item, list):
            out.extend(flatten(item))   # a list? flatten that too
        else:
            out.append(item)
    return out

flatten([1, [2, [3, [4]], 5]])   # [1, 2, 3, 4, 5]
\`\`\`

Try that with loops. You'd need a loop per level, and you don't know how many levels there are. Recursion doesn't care — each call handles one level and delegates the rest to itself.

That's the signal: **a problem shaped like itself at a smaller size.** Folders inside folders, JSON inside JSON, a tree of replies. Real work, not puzzles.

## The cost

Each call keeps a frame on the stack until it returns, so recursion uses memory that a loop doesn't, and Python has no tail-call optimisation. Deep recursion on a long list will hit the limit. If a loop expresses it naturally, use the loop.

---

## Try It

Run the starter code. Then remove the base case from \`countdown\` and read the \`RecursionError\` — the limit protecting you.
`,
    },

    /* ── 6. Lambda ── */
    {
      id: 'py-lambda',
      slug: 'lambda',
      title: { en: 'Lambda', ar: 'lambda' },
      order: 6,
      type: 'lesson',
      starterCode: `double = lambda n: n * 2
print(double(5))

def double_def(n):
    return n * 2
print(double_def(5))

# Where lambda belongs: a throwaway function passed to another function
words = ["banana", "fig", "apple"]
print(sorted(words, key=lambda w: len(w)))
print(sorted(words, key=len))          # even better — no lambda needed

people = [("sara", 21), ("ali", 19)]
print(sorted(people, key=lambda p: p[1]))

print(max([1, -5, 3], key=lambda n: abs(n)))

# One expression only — no statements
# bad = lambda n: print(n); return n   # SyntaxError
`,
      markdownContent: `# Lambda

A **lambda** is a small, anonymous function written in one expression.

\`\`\`python
double = lambda n: n * 2
double(5)   # 10
\`\`\`

Identical to:

\`\`\`python
def double(n):
    return n * 2
\`\`\`

The shape is \`lambda parameters: expression\`. The result of the expression is returned automatically — there's no \`return\` keyword, and no room for one.

---

## The limits

**One expression. No statements.** No \`if\` blocks, no loops, no assignments, no multiple lines:

\`\`\`python
lambda n: print(n); return n   # SyntaxError
\`\`\`

A ternary is allowed, because it's an expression:

\`\`\`python
lambda n: "even" if n % 2 == 0 else "odd"
\`\`\`

---

## Don't name a lambda

The first example is bad style, and the style guide says so explicitly:

\`\`\`python
double = lambda n: n * 2   # don't
def double(n):             # do
    return n * 2
\`\`\`

If you're giving it a name, use \`def\`. It's clearer, it can grow, and its name shows up properly in tracebacks — a named lambda reports as \`<lambda>\` when it fails, which is useless when you're debugging.

## Where lambda belongs

Passed **to another function**, used once, not worth naming:

\`\`\`python
sorted(people, key=lambda p: p[1])   # sort by the second item
max([1, -5, 3], key=lambda n: abs(n))
\`\`\`

You've seen \`key=\` since Module 5. It wants *a function*, and a lambda writes one inline instead of defining a whole \`def\` for something used once.

But check first whether a function already exists:

\`\`\`python
sorted(words, key=lambda w: len(w))   # works
sorted(words, key=len)                # better — len IS the function
\`\`\`

If your lambda just calls one function on its argument, pass that function directly.

---

## Try It

Run the starter code. Compare the two \`sorted(words, ...)\` lines — same output, and the second says more with less.
`,
    },

    /* ── 7. Challenge: Port Toolkit ── */
    {
      id: 'py-ch-port-toolkit',
      slug: 'challenge-port-toolkit',
      title: { en: 'Challenge: Port Toolkit', ar: 'تحدي: أدوات المنافذ' },
      order: 7,
      type: 'challenge',
      starterCode: `# Write THREE functions, then the prints below will work.
#
#   1. is_valid(port)          -> True if 1 <= port <= 65535, else False
#   2. describe(port, proto="tcp") -> "80/tcp" style; proto defaults to "tcp"
#   3. summarise(*ports)       -> a dict: {"count": n, "valid": v, "highest": h}
#                                 "highest" is the highest VALID port,
#                                 or None when there are no valid ones.
#
# Expected output:
#
#   True False
#   80/tcp 53/udp
#   {'count': 4, 'valid': 3, 'highest': 8080}
#   {'count': 1, 'valid': 0, 'highest': None}
#
# Rules:
#   - Use return, not print, inside the functions.
#   - describe must use a default parameter.
#   - summarise must use *args.

# Write your functions below:


# Do not change these:
print(is_valid(80), is_valid(70000))
print(describe(80), describe(53, "udp"))
print(summarise(80, 8080, 22, 99999))
print(summarise(0))
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'All three functions behave as specified',
          expectedOutput:
            "True False\n80/tcp 53/udp\n{'count': 4, 'valid': 3, 'highest': 8080}\n{'count': 1, 'valid': 0, 'highest': None}",
        },
      ],
      hints: [
        'is_valid can return the comparison directly: return 1 <= port <= 65535 — chained comparison from Module 7.',
        'describe(port, proto="tcp") uses a default parameter, and returns an f-string: f"{port}/{proto}".',
        'In summarise(*ports), ports is a tuple. Build valid = [p for p in ports if is_valid(p)] — or a loop. Then highest is max(valid) if valid else None, since max() on an empty list raises ValueError.',
      ],
      solution: `def is_valid(port):
    return 1 <= port <= 65535


def describe(port, proto="tcp"):
    return f"{port}/{proto}"


def summarise(*ports):
    valid = [p for p in ports if is_valid(p)]
    return {
        "count": len(ports),
        "valid": len(valid),
        "highest": max(valid) if valid else None,
    }


# Do not change these:
print(is_valid(80), is_valid(70000))
print(describe(80), describe(53, "udp"))
print(summarise(80, 8080, 22, 99999))
print(summarise(0))
`,
      markdownContent: `# Challenge: Port Toolkit

Three small functions that use most of this module.

---

## Instructions

Write these, leaving the \`print\` calls at the bottom untouched:

**1. \`is_valid(port)\`** — \`True\` when the port is between 1 and 65535 inclusive, else \`False\`.

**2. \`describe(port, proto="tcp")\`** — returns \`"80/tcp"\`. \`proto\` must have a **default**.

**3. \`summarise(*ports)\`** — takes **any number** of ports and returns:

\`\`\`python
{"count": 4, "valid": 3, "highest": 8080}
\`\`\`

- \`count\` — how many were passed
- \`valid\` — how many pass \`is_valid\`
- \`highest\` — the highest **valid** port, or \`None\` if there are none

## Expected output

\`\`\`
True False
80/tcp 53/udp
{'count': 4, 'valid': 3, 'highest': 8080}
{'count': 1, 'valid': 0, 'highest': None}
\`\`\`

## Rules

- \`return\` from the functions — don't \`print\` inside them.
- \`describe\` must use a **default parameter**.
- \`summarise\` must use **\`*args\`**.

## Watch out

\`max()\` on an **empty** list raises \`ValueError\`. The last case has no valid ports, so guard it — a ternary does it in one line.

Note the whole point of \`is_valid\` returning a bool: \`summarise\` can just *use* it.

---

Click **Submit** when ready.
`,
    },
  ],
};

export default functions;
