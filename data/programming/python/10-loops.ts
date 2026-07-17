import type { ProgrammingModule } from '../types';

const loops: ProgrammingModule = {
  id: 'py-loops',
  slug: 'loops',
  title: {
    en: 'Loops',
    ar: 'الحلقات',
  },
  description: {
    en: 'Repeating work — while and for, break and continue, nesting, and looping over dictionaries.',
    ar: 'تكرار العمل — while و for، break و continue، التداخل، والمرور على القواميس.',
  },
  order: 10,
  concepts: [
    /* ── 1. While ── */
    {
      id: 'py-while',
      slug: 'while-loop',
      title: { en: 'The while Loop', ar: 'حلقة while' },
      order: 1,
      type: 'lesson',
      starterCode: `count = 3
while count > 0:
    print("tick", count)
    count -= 1        # without this, it never ends
print("liftoff")

print("---")

# while/else — else runs if the loop was NEVER broken out of
n = 0
while n < 3:
    print("n =", n)
    n += 1
else:
    print("finished normally")

print("---")

# Broken out of -> the else is SKIPPED
n = 0
while n < 3:
    if n == 1:
        break
    n += 1
else:
    print("you will not see this")
print("done")
`,
      markdownContent: `# The while Loop

\`while\` repeats a block **for as long as a condition stays true**.

\`\`\`python
count = 3
while count > 0:
    print("tick", count)
    count -= 1
\`\`\`

Same shape as \`if\` — keyword, condition, colon, indented block. The difference is that \`if\` runs the block **once**; \`while\` runs it **again and again**, re-checking the condition each time.

If the condition is false at the start, the body never runs at all.

---

## Something must change

\`count -= 1\` isn't decoration — it's the whole loop. Delete it and \`count > 0\` is true forever:

\`\`\`python
count = 3
while count > 0:
    print("tick")   # infinite loop
\`\`\`

Every \`while\` needs three things, and forgetting any one is a bug:

1. something **initialised** before the loop (\`count = 3\`)
2. a condition that can **become false**
3. something **inside** that moves toward it (\`count -= 1\`)

In this editor an infinite loop hits the 10-second timeout and stops. In a terminal you'd press Ctrl+C.

---

## while/else

Python gives loops an \`else\`, which almost no other language has:

\`\`\`python
while n < 3:
    ...
else:
    print("finished normally")
\`\`\`

The \`else\` runs when the loop ends **because its condition went false** — and is **skipped if you \`break\` out**.

The name is genuinely misleading. Read it as **"no break"**, not "otherwise". It means: *the loop ran to completion without being interrupted.*

That makes it useful for searching — "I looked at everything and never found it":

\`\`\`python
while attempts < 3:
    if guess_correct():
        break
    attempts += 1
else:
    print("locked out")   # only if we never broke out
\`\`\`

Without \`else\` you'd need a \`found = False\` flag. It's a nice tool, used rarely — many Python developers never write one, and that's fine.

---

## while vs for

Use **\`while\`** when you don't know how many rounds you need: waiting for valid input, retrying, running until a condition changes.

Use **\`for\`** when you're walking a known collection. That's the next lesson, and it's what you'll reach for most.

---

## Try It

Run the starter code. The third block \`break\`s, so its \`else\` never prints — that's the "no break" rule.
`,
    },

    /* ── 2. While in Practice ── */
    {
      id: 'py-while-practice',
      slug: 'while-practice',
      title: { en: 'while in Practice', ar: 'while عمليا' },
      order: 2,
      type: 'lesson',
      sampleInput: 'abc\n-5\n21\n',
      starterCode: `# Pattern 1: keep asking until the input is valid
age = None
while age is None:
    raw = input("Age: ").strip()
    if raw.isdigit():
        age = int(raw)
    else:
        print("  not a whole number, try again")
print("Got:", age)

print("---")

# Pattern 2: a limited number of attempts
SECRET = "khana"
attempts = 0
while attempts < 3:
    attempts += 1
    if SECRET == "khana" and attempts == 2:
        print("unlocked on attempt", attempts)
        break
else:
    print("locked out")

print("---")

# Pattern 3: accumulate until a total is reached
total, n = 0, 0
while total < 20:
    n += 1
    total += n
print(f"summed 1..{n} = {total}")
`,
      markdownContent: `# while in Practice

Three patterns you'll write for real.

---

## 1. Ask until valid

The reason \`while\` exists: you don't know how many attempts a user needs.

\`\`\`python
age = None
while age is None:
    raw = input("Age: ").strip()
    if raw.isdigit():
        age = int(raw)
    else:
        print("  not a whole number, try again")
\`\`\`

\`age\` starts as \`None\` — the "no answer yet" value from Module 7. The loop's exit condition and its result are the same variable, so there's no separate flag.

Note \`is None\`, not \`== None\` — and it matters here beyond style. If the user enters \`0\`, then \`while not age\` would keep looping forever, because \`0\` is falsy. \`is None\` asks the exact question: *do we have an answer yet?*

This is the shape of every input-validation loop: assume nothing, keep asking, only accept what you've checked.

## 2. Limited attempts

\`\`\`python
attempts = 0
while attempts < 3:
    attempts += 1
    if correct:
        break
else:
    print("locked out")
\`\`\`

The counter guarantees an exit, and \`while/else\` handles "we used every attempt and never succeeded" without a flag.

Increment **first**, before the check, so an early \`break\` still leaves \`attempts\` accurate.

## 3. Accumulate until a threshold

\`\`\`python
total, n = 0, 0
while total < 20:
    n += 1
    total += n
\`\`\`

You don't know how many rounds it takes — the loop finds out. This is exactly what \`for\` can't do: with \`for\` you must know the range up front.

---

## The mistakes to know

**Forgetting to advance** → infinite loop. Every \`while\` body must move toward the exit.

**Checking a stale value.** The condition is tested at the **top**, so a change halfway through the body isn't noticed until the next round. The rest of the body still runs.

**Off-by-one.** \`while attempts < 3\` gives attempts 1, 2, 3 — three of them. \`<= 3\` would give four. Count them out when it matters.

---

## Try It

Run it: the Input box has \`abc\`, then \`-5\`, then \`21\`. The first two are rejected — \`-5\` because \`isdigit()\` is \`False\` for a minus sign, exactly as Module 3 warned — and \`21\` is accepted.
`,
    },

    /* ── 3. For ── */
    {
      id: 'py-for',
      slug: 'for-loop',
      title: { en: 'The for Loop', ar: 'حلقة for' },
      order: 3,
      type: 'lesson',
      starterCode: `for tool in ["nmap", "burp"]:
    print(tool)

# Strings are sequences too
for ch in "abc":
    print(ch, end=" ")
print()

# range(stop) / range(start, stop) / range(start, stop, step)
for i in range(3):
    print(i, end=" ")
print()
print(list(range(2, 8, 2)))

# enumerate when you need the index as well
for i, tool in enumerate(["nmap", "burp"], start=1):
    print(i, tool)

# zip walks two sequences together
for name, port in zip(["ssh", "http"], [22, 80]):
    print(f"{name} -> {port}")

# for/else — the same "no break" rule
for n in [1, 2, 3]:
    if n == 99:
        break
else:
    print("99 not found")
`,
      markdownContent: `# The for Loop

\`for\` walks through a collection, one item at a time.

\`\`\`python
for tool in ["nmap", "burp"]:
    print(tool)
\`\`\`

Read it as English: *for each tool in this list, print it.* The variable \`tool\` is created by the loop and holds each item in turn.

No counter, no index, no length. Compare with the \`while\` version:

\`\`\`python
i = 0
while i < len(tools):
    print(tools[i])
    i += 1
\`\`\`

Three places to get wrong, versus none. **If you're walking a collection, use \`for\`.**

It works on anything iterable — lists, tuples, sets, strings, dicts, files:

\`\`\`python
for ch in "abc":
    print(ch)
\`\`\`

---

## range()

For "do this N times", when there's no collection to walk:

\`\`\`python
range(3)         # 0, 1, 2
range(2, 5)      # 2, 3, 4
range(2, 8, 2)   # 2, 4, 6
\`\`\`

The **stop is excluded**, exactly like slicing. \`range(3)\` gives three numbers starting at 0 — which lines up with indexes being 0-based.

\`range\` doesn't build a list; it generates numbers as needed. So \`range(1000000)\` costs nothing until you loop it. \`print(range(3))\` shows \`range(0, 3)\` rather than the numbers — wrap it in \`list()\` to see them.

## enumerate()

When you need the position **and** the item:

\`\`\`python
for i, tool in enumerate(tools, start=1):
    print(i, tool)
\`\`\`

Better than \`range(len(tools))\` and indexing back in. \`start=1\` is for humans who count from one.

Each round hands back an \`(index, item)\` tuple, unpacked into \`i, tool\` — tuple unpacking again.

## zip()

Walks two collections in step:

\`\`\`python
for name, port in zip(["ssh", "http"], [22, 80]):
    print(f"{name} -> {port}")
\`\`\`

It stops at the **shorter** one, silently. That's usually what you want, and occasionally hides a bug — pass \`strict=True\` (3.10+) to raise on a length mismatch.

## for/else

Same "no break" rule as \`while\`:

\`\`\`python
for n in items:
    if n == target:
        break
else:
    print("not found")
\`\`\`

The classic search-and-report-failure, with no flag variable.

---

## Try It

Run the starter code. \`print(x, end=" ")\` replaces the newline with a space — handy for printing a loop's results on one line.
`,
    },

    /* ── 4. Break, Continue, Pass ── */
    {
      id: 'py-break-continue',
      slug: 'break-continue-pass',
      title: { en: 'break, continue, pass', ar: 'break و continue و pass' },
      order: 4,
      type: 'lesson',
      starterCode: `# break — leave the loop entirely
for n in [1, 2, 3, 4, 5]:
    if n == 3:
        break
    print("break demo:", n)

# continue — skip the rest of THIS round only
for n in [1, 2, 3, 4, 5]:
    if n % 2 == 0:
        continue
    print("continue demo:", n)

# pass — do nothing; a placeholder to keep the syntax valid
for n in [1, 2]:
    pass

if True:
    pass    # "handle this later"

# break only leaves the INNERMOST loop
for i in range(2):
    for j in range(5):
        if j == 1:
            break
        print(f"i={i} j={j}")
`,
      markdownContent: `# break, continue, pass

Three keywords, often confused.

---

## break — get out

Leaves the loop **immediately**. Nothing else in the body runs, and no further rounds happen:

\`\`\`python
for n in [1, 2, 3, 4, 5]:
    if n == 3:
        break
    print(n)      # 1, 2
\`\`\`

Its job is "I found what I came for" or "something's wrong, stop." Remember it also **skips the loop's \`else\`**.

## continue — skip this one

Jumps straight to the **next round**. The rest of the body is skipped; the loop itself keeps going:

\`\`\`python
for n in [1, 2, 3, 4, 5]:
    if n % 2 == 0:
        continue
    print(n)      # 1, 3, 5
\`\`\`

Its job is "not interested in this item." It's a filter, and it saves you a level of indentation:

\`\`\`python
for line in lines:
    if not line.strip():
        continue          # skip blanks
    if line.startswith("#"):
        continue          # skip comments
    process(line)         # the real work, unindented
\`\`\`

That's the guard-clause idea from Module 9, applied to loops: reject early, keep the real work flat.

## pass — do nothing

Not a loop keyword at all. It's a **placeholder** where Python's grammar demands a block but you have nothing to put there:

\`\`\`python
if True:
    pass    # TODO
\`\`\`

Without it that's an \`IndentationError\` — Python has no \`{}\` to leave empty. \`pass\` lets you sketch structure now and fill it in later.

**\`pass\` is not \`continue\`.** \`pass\` does nothing and execution carries on to the next line in the body. \`continue\` jumps to the next round. In a loop they look similar and behave differently:

\`\`\`python
for n in [1, 2]:
    pass
    print(n)      # prints 1, 2 — pass did nothing

for n in [1, 2]:
    continue
    print(n)      # prints NOTHING — continue skipped it
\`\`\`

---

## break only leaves one level

In nested loops, \`break\` exits the **innermost** loop only:

\`\`\`python
for i in range(2):
    for j in range(5):
        if j == 1:
            break      # leaves the j loop; the i loop continues
\`\`\`

There's no "break out of both" in Python. To do that, put the loops in a function and \`return\`, or use a flag. Wanting it is usually a sign the loops belong in their own function.

---

## Try It

Run the starter code and compare the first two blocks: \`break\` stops at 1, 2 — \`continue\` prints 1, 3, 5.
`,
    },

    /* ── 5. Nested Loops ── */
    {
      id: 'py-nested-loops',
      slug: 'nested-loops',
      title: { en: 'Nested Loops', ar: 'الحلقات المتداخلة' },
      order: 5,
      type: 'lesson',
      starterCode: `# The inner loop runs FULLY for each outer round
for host in ["10.0.0.5", "10.0.0.6"]:
    for port in [22, 80]:
        print(f"{host}:{port}")

print("---")

# A grid
for row in range(1, 4):
    for col in range(1, 4):
        print(f"{row * col:3}", end="")
    print()

print("---")

# Walking nested data
scan = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
for host, ports in scan.items():
    print(host)
    for port in ports:
        print("  -", port)
`,
      markdownContent: `# Nested Loops

A loop inside a loop. The **inner loop runs completely for every single round of the outer one**.

\`\`\`python
for host in ["10.0.0.5", "10.0.0.6"]:
    for port in [22, 80]:
        print(f"{host}:{port}")
\`\`\`

Four lines of output: two hosts × two ports. The inner loop restarts from the beginning each time the outer one advances.

That multiplication is the thing to keep in mind. Two lists of 1,000 items each is **a million** rounds. Nested loops are where slow programs come from — and where a bad idea becomes an expensive one.

---

## Building a grid

\`\`\`python
for row in range(1, 4):
    for col in range(1, 4):
        print(f"{row * col:3}", end="")
    print()
\`\`\`

Note where the bare \`print()\` sits: indented to the **outer** loop, so it runs once per row and ends the line. Move it in one level and every number gets its own line. Indentation is the logic.

\`{row * col:3}\` pads each number to width 3, so the columns line up — the format spec from Module 3.

## Walking nested data

The common real use: a dict whose values are lists.

\`\`\`python
scan = {"10.0.0.5": [22, 80], "10.0.0.6": [443]}
for host, ports in scan.items():
    print(host)
    for port in ports:
        print("  -", port)
\`\`\`

\`.items()\` gives \`(key, value)\` pairs, unpacked into \`host, ports\`. \`ports\` is a list, so the inner loop walks it. The structure of the loops mirrors the structure of the data — that's how you should read them.

## Before you nest

Nesting is often the wrong tool. If you're comparing two collections:

\`\`\`python
for a in list_a:            # slow: len(a) x len(b) checks
    for b in list_b:
        if a == b: ...

set(list_a) & set(list_b)   # fast, and one line
\`\`\`

Module 6 already gave you the better answer. Ask what you're really doing before writing the second \`for\`.

---

## Try It

Run the starter code. Then move the bare \`print()\` in the grid block one level deeper and watch the layout collapse — that's indentation carrying the meaning.
`,
    },

    /* ── 6. Looping Over Dictionaries ── */
    {
      id: 'py-loops-dicts',
      slug: 'loops-over-dicts',
      title: { en: 'Looping Over Dictionaries', ar: 'المرور على القواميس' },
      order: 6,
      type: 'lesson',
      starterCode: `host = {"ip": "10.0.0.5", "port": 8080, "up": True}

# Looping a dict directly gives its KEYS
for key in host:
    print(key, end=" ")
print()

for key, value in host.items():
    print(f"{key} = {value}")

for value in host.values():
    print(value, end=" ")
print()

# Building a dict with a loop
scan = [443, 22, 443, 80, 22, 22]
counts = {}
for port in scan:
    counts[port] = counts.get(port, 0) + 1
print(counts)

# Never resize a dict while looping it — loop a copy of the keys
for key in list(counts.keys()):
    if counts[key] < 2:
        del counts[key]
print(counts)
`,
      markdownContent: `# Looping Over Dictionaries

---

## The three ways

Looping a dict **directly gives its keys**:

\`\`\`python
for key in host:        # ip, port, up
\`\`\`

Same as \`for key in host.keys()\` — the shorter form is idiomatic. Consistent with \`in\`, which also checks keys.

For both parts, use \`.items()\`:

\`\`\`python
for key, value in host.items():
    print(f"{key} = {value}")
\`\`\`

This is the one you'll write most. Each round yields a \`(key, value)\` tuple, unpacked into two names.

And for values alone:

\`\`\`python
for value in host.values():
\`\`\`

Since 3.7 all three follow **insertion order**.

---

## Counting with a dict

The pattern worth memorising:

\`\`\`python
counts = {}
for port in scan:
    counts[port] = counts.get(port, 0) + 1
\`\`\`

\`.get(port, 0)\` is what makes it work. The first time a port appears it isn't a key yet, so \`counts[port]\` would raise \`KeyError\` — \`.get\` returns \`0\` instead, and \`0 + 1\` starts the count.

The clumsy version:

\`\`\`python
if port in counts:
    counts[port] += 1
else:
    counts[port] = 1
\`\`\`

Same result, four lines. \`.get(key, default)\` collapses it to one. (The standard library has \`collections.Counter\` for exactly this — Module 13.)

---

## Never resize while looping

The rule that bites:

\`\`\`python
for key in counts:
    if counts[key] < 2:
        del counts[key]     # RuntimeError: dictionary changed size during iteration
\`\`\`

The loop walks a **live view** (Module 6). Removing a key while it's being walked pulls the floor out. Python detects it and raises rather than silently skipping items.

The fix is to loop a **snapshot**:

\`\`\`python
for key in list(counts.keys()):
    if counts[key] < 2:
        del counts[key]
\`\`\`

\`list()\` copies the keys, so the loop reads the copy while you edit the original.

The same applies to lists — removing from a list you're looping makes items get skipped, and there it happens **silently**, which is worse. Loop a copy, or build a new list of what you want to keep.

---

## Try It

Run the starter code. Then remove the \`list()\` from the last loop and read the \`RuntimeError\` — Python protecting you from yourself.
`,
    },

    /* ── 7. Challenge: Log Summary ── */
    {
      id: 'py-ch-log-summary',
      slug: 'challenge-log-summary',
      title: { en: 'Challenge: Log Summary', ar: 'تحدي: ملخص السجل' },
      order: 7,
      type: 'challenge',
      starterCode: `lines = [
    "GET /home 200",
    "",
    "# a comment",
    "POST /login 401",
    "GET /admin 403",
    "GET /home 200",
    "POST /login 200",
]

# Summarise the log and print exactly:
#
#   Processed: 5
#   GET: 3
#   POST: 2
#   Errors: 2
#   Top path: /home (2)
#
# Rules:
#   - Skip blank lines and lines starting with "#". Use continue.
#   - "Processed" counts only the real lines.
#   - Count methods (the first word) and paths (the second word).
#   - "Errors" are lines whose status (third word) is 400 or above.
#   - "Top path" is the most frequent path, with its count.
#   - Hard-code nothing.

# Write your code below:
`,
      testCases: [
        {
          id: 'tc-1',
          description: 'Skips noise, counts methods and errors, and finds the top path',
          expectedOutput: 'Processed: 5\nGET: 3\nPOST: 2\nErrors: 2\nTop path: /home (2)',
        },
      ],
      hints: [
        'Loop the lines. First strip each one, then use continue to skip it when it is empty or starts with "#".',
        'line.split() gives [method, path, status]. Count methods and paths in two dicts using the counts[k] = counts.get(k, 0) + 1 pattern. int(status) >= 400 is an error.',
        'For the top path: max(paths, key=paths.get) returns the key with the highest count — the same key= idea as sorted() and max() in Module 5.',
      ],
      solution: `lines = [
    "GET /home 200",
    "",
    "# a comment",
    "POST /login 401",
    "GET /admin 403",
    "GET /home 200",
    "POST /login 200",
]

methods = {}
paths = {}
processed = 0
errors = 0

for line in lines:
    line = line.strip()
    if not line or line.startswith("#"):
        continue

    processed += 1
    method, path, status = line.split()

    methods[method] = methods.get(method, 0) + 1
    paths[path] = paths.get(path, 0) + 1

    if int(status) >= 400:
        errors += 1

top = max(paths, key=paths.get)

print(f"Processed: {processed}")
print(f"GET: {methods['GET']}")
print(f"POST: {methods['POST']}")
print(f"Errors: {errors}")
print(f"Top path: {top} ({paths[top]})")
`,
      markdownContent: `# Challenge: Log Summary

Reading a log and reporting on it — loops, \`continue\`, dict counting and \`max\` together. This is a real script.

---

## Instructions

Given the \`lines\` list in the editor, print **exactly**:

\`\`\`
Processed: 5
GET: 3
POST: 2
Errors: 2
Top path: /home (2)
\`\`\`

## Rules

- **Skip** blank lines and lines starting with \`#\`, using \`continue\`.
- **Processed** counts only the real lines.
- Count **methods** (first word) and **paths** (second word).
- **Errors** are lines whose status (third word) is **400 or above**.
- **Top path** is the most frequent path, with its count in brackets.
- Hard-code nothing.

## What you need

\`\`\`python
line.split()                          # ['GET', '/home', '200']
counts[k] = counts.get(k, 0) + 1      # the counting pattern
max(paths, key=paths.get)             # the key with the biggest value
\`\`\`

That last line deserves a look: \`max\` over a dict walks its **keys**, and \`key=paths.get\` tells it to rank each key by its value. Same \`key=\` idea as \`sorted()\`.

## Watch out

\`.strip()\` each line **before** testing it, or a line of spaces won't look blank. And the status is text — \`int()\` it before comparing to 400.

---

Click **Submit** when ready.
`,
    },
  ],
};

export default loops;
