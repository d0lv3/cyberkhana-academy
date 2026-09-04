# CyberKhana Academy — Creator Studio Guide

The Creator Studio (`/creators`) is where creators and admins author everything students see
in the Academy. This document explains how the Studio is structured, what every content type
is made of, and exactly what each field needs before the content is ready to publish.

> **Access**: the Studio is visible only to accounts with the `creator` or `admin` role.
> Admins promote members from **Members** (`/admin/members`).

---

## Table of Contents

1. [How the Studio is organized](#1-how-the-studio-is-organized)
2. [Concepts shared by every content type](#2-concepts-shared-by-every-content-type)
3. [Networking Lesson](#3-networking-lesson)
4. [Programming Content (modules & concepts)](#4-programming-content)
5. [Module (standalone) & OS Module](#5-module-standalone--os-module)
6. [Labs](#6-labs)
7. [Learning Path](#7-learning-path)
8. [Markdown reference](#8-markdown-reference)
9. [Where published content appears](#9-where-published-content-appears)

---

## 1. How the Studio is organized

The Studio dashboard (`/creators`) shows:

- **Pipeline tiles** — counts of your content by lifecycle stage (Total / Published / In Review / Drafts).
- **Create New cards** — one card per content type (below).
- **Your Content** — every item you've authored, filterable by status and searchable.

| Content type | Editor route | What it is |
|---|---|---|
| Networking Lesson | `/creators/networking/new` | Markdown explainer, with an optional interactive packet-flow simulation (+ optional quiz) |
| Programming Content | `/creators/programming` | Modules and lesson/challenge concepts inside a language (Python) |
| Module | `/creators/modules/new` | Standalone chapter/section module for the Modules hub, with optional hands-on labs |
| OS Module | `/creators/os-modules/new` | Same structure, surfaced in OS Fundamentals |
| Learning Path | `/creators/paths/new` | An ordered curriculum built from existing published content |

---

## 2. Concepts shared by every content type

### Lifecycle status

Every item carries one of three statuses, set from the dropdown in the editor header:

| Status | Who sees it |
|---|---|
| **Draft** | Only you (in the Studio) |
| **In Review** | Only you — marks it as submitted for approval |
| **Published** | Every student, everywhere the type surfaces |

Saving syncs your content to your account on the server. Published items reach all
students; drafts never leave your account.

### Bilingual fields

Titles and descriptions always have **English + Arabic** inputs.
**The English title is required everywhere** — it generates the slug and is the fallback
when an Arabic value is empty. Section/lesson *bodies* (markdown) are currently
single-language.

### Slug

- Auto-generated from the English title: lowercase, `a–z 0–9 -` only, max 60 chars
  (e.g. *"IP Addressing & NAT"* → `ip-addressing-nat`).
- Editable while creating; avoid changing it after publishing — it is the lesson's URL.

### Markdown input

Every markdown field offers two tabs:

- **Editor** — write/paste markdown directly.
- **Upload** — drag & drop a `.md` / `.markdown` / `.txt` file (its content replaces the field).

Plus an **Insert Image** button: uploads a PNG/JPEG/WebP/GIF (max **2 MB**) to the server
and inserts `![name](url)` at your cursor. SVG is not accepted.

A **live preview** next to (or below) the editor renders exactly what students will see —
the preview and the student page share one renderer, so there are no surprises.

### Quizzes (where available)

Multiple-choice questions with **2–6 options** and exactly **one correct answer**
(click the circle to mark it). Options are **shuffled for every attempt**. Blank
questions/options are silently dropped on save.

---

## 3. Networking Lesson

*Editor:* **Lesson** tab (content) + **Simulation** tab (builder + live preview).

The simulation is **opt-in**. A new lesson starts without one, and the Simulation
tab offers a single **Add a simulation** button; the banner above the builder
removes it again. A lesson with no simulation is a normal lesson: students read it
full width, with no side panel and no Content/Simulation tabs on mobile.

### Lesson tab fields

| Field | Required | Notes |
|---|---|---|
| Title (EN) | ✅ | Generates the slug |
| Title (AR) | recommended | Shown to Arabic users |
| Description (EN/AR) | recommended | Card text on the Networking page |
| Slug | auto | URL: `/fundamentals/networking/lesson/<slug>` |
| Order | ✅ (default 100) | Position in the lesson list, and the order the in-lesson **Continue** button follows |
| Est. Minutes | ✅ (default 10) | Shown on the lesson card |
| Tags | optional | Up to ~5 shown on the card |
| Markdown Content | ✅ (English) | Bilingual: EN/العربية tabs, and the preview beside it follows the tab you are on. Arabic is optional and falls back to English, so English is the one you cannot skip. The reading pane takes the whole screen when the lesson has no simulation, and students can drag the divider or minimise the simulation when it has one |
| Lesson Quiz | optional | **With** a quiz: students must score ≥ 70 % to complete the lesson. **Without**: they get a manual "Mark as complete" button |

### Simulation tab (the builder)

**Labels in EN / العربية** sits at the top of the builder and retargets *every*
text box below it at once, rather than each field carrying its own pair of
inputs. Lay the topology out in English, switch to العربية, and make a second
pass over the same form; the live preview follows the tab you are on. On the
Arabic tab an untranslated box shows its English greyed out as the
placeholder, so the gaps are visible without switching back to check.
Everything a student reads is covered: device labels and sublabels, zone
labels, connection labels, step titles and descriptions, and packet labels.
IP addresses are not, since an address is the same in every language.

| Section | What you define |
|---|---|
| **Devices** | The nodes. Type (`pc`, `laptop`, `server`, `router`, `switch`, `firewall`, `cloud`, `dns-server`, `phone`), label, IP, optional sublabel, and X/Y position (0–100 grid — you can also drag devices in the live preview to set defaults) |
| **Network Zones** | Labeled background regions (e.g. *HOME NETWORK*, `192.168.1.0/24`), with tint color and X/Y/W/H |
| **Connections** | Edges between devices: from → to, optional label, solid or dashed |
| **Steps** | The story. Each step has a title, a description, optional node highlights/annotations, and **packets** (from → to, label like `GET /`, optional sublabel like `dst: 93.184.216.34`, and a color) |

**Packet color convention:** Neon `#9fef00` = request · Green `#00a859` = response ·
Gold `#f3a43a` = highlight · Red = blocked/dropped.

### Publish checklist

- [ ] English title
- [ ] English markdown body (Arabic optional; Arabic alone is refused, because
      every fallback in the app runs towards English)
- [ ] **At least one simulation step**, if the lesson has a simulation at all
      (publishing is blocked on a simulation with no steps; turn it off to publish
      a prose-only lesson)
- [ ] Devices positioned sensibly inside their zones
- [ ] Quiz added if you want completion to be earned, not self-claimed

---

## 4. Programming Content

Programming content lives *inside a language* (currently **Python**). Two levels:

### 4a. Programming Module

A module is a folder of concepts (e.g. *"Control Flow"*).

| Field | Required | Notes |
|---|---|---|
| Title (EN/AR) | EN ✅ | |
| Description (EN/AR) | recommended | Shown on the language page |
| Slug | auto, **locked after creation** | Concepts attach to it |
| Order | ✅ | Position among the language's modules |

### 4b. Programming Concept (lesson or challenge)

| Field | Required | Notes |
|---|---|---|
| Title (EN/AR) | EN ✅ | |
| Slug | auto | URL: `/fundamentals/programming/python/<module>/<slug>` |
| Order | ✅ | Position inside the module |
| Type | ✅ | `lesson` (reading + sandbox) or `challenge` (graded by tests) |
| Markdown Content | ✅ to publish | Templates available: **Lesson template** / **Challenge template** insert a ready structure |
| Starter Code | ✅ to publish | What appears in the student's editor |
| Test Cases | ✅ for challenges | Each case = **stdin** (what the program receives) + **expected output** (exact match). Multiline supported |
| Hints | recommended | Revealed one at a time by the student |
| Solution Code | recommended | Needed to use **Verify** — runs your solution against your own tests in the browser |

**Editor tabs:** *Editor* and *Student Preview* — the preview runs the real coding
environment, so you can solve your own challenge before publishing. Changing code or
tests invalidates a previous verification.

**How completion works:** lessons complete via the **Complete & Continue** button;
challenges complete when the student's code **passes all test cases**.

### Publish checklist (hard blocks shown by the editor)

- [ ] English title
- [ ] Markdown content
- [ ] Starter code
- [ ] Challenges: at least one test case
- [ ] Recommended: Verify passes (solution beats your tests), hints written

> The test runner is **Python-only** for now — C and Bash tracks are placeholders.

---

## 5. Module (standalone) & OS Module

Both use the same editor and the same structure: **Chapters → Sections**
(mirroring the Linux course's course → modules → lectures division).
The difference is only *where they surface* (see §9).

### Module details

| Field | Required | Notes |
|---|---|---|
| Title (EN/AR) | EN ✅ | |
| Description (EN/AR) | recommended | Card text |
| Slug | auto | URL: `/fundamentals/module/<slug>` |
| Category | ✅ | **Offensive**, **Defensive**, or **General** — shown as a colored tag on the tile and used by the Modules-hub category filter (defaults to General) |
| Difficulty | ✅ | Beginner / Easy / Medium / Hard / Expert — shown on the tile |
| Est. Hours | ✅ | Shown on the tile |
| Accent color | ✅ | Tints the tile's fallback background when no cover image is set |
| Cover Image | optional | Upload a PNG/JPEG/WebP/GIF (max **2 MB**). Fills the square module tile; without one the tile falls back to an accent-tinted gradient |
| Author | ✅ | Display name |
| Tags | optional | |
| "Also show on Modules page" | OS modules only | Toggle to surface the OS module in the Modules hub too |

### Structure (the heart of the module)

- **Chapters** — named groups, reorderable. At least one.
- **Sections** — the units students actually open. Each section has:

| Section field | Required | Notes |
|---|---|---|
| Title | ✅ | Shows in the course sidebar |
| Subtitle | optional | Secondary line in the viewer |
| YouTube Video ID | optional | e.g. `dQw4w9WgXcQ` — embeds above the markdown |
| Markdown Content | ✅ (unless video-only) | The section body |
| Section Quiz | optional | MCQs gated at the end of the section; counted in the module's quiz total |

Reading time per section is estimated automatically (~180 words/min, +4 min if there's
a video). The module's content type badge (Video / Text / Mixed) is derived from what
the sections contain.

### Publish checklist

- [ ] English title
- [ ] **At least one section** (saving is blocked without it)
- [ ] Every section has either markdown or a video
- [ ] Quizzes on sections that deserve a knowledge check

> Standalone modules are free-topic — web security, cryptography, forensics, anything.
> Use **tags** to describe the subject. The **Category** (Offensive / Defensive / General)
> is a coarse classification students can filter by on the Modules hub.

---

## 6. Labs

A lab is the part of a module students **do** rather than read. Almost none of it
runs on this platform: the work happens on a room somewhere else, a VM, a CTF box.
What the Studio owns is the brief, the way in, the files students need, and the
record that they finished. A network simulation is the one exception, and runs
inside the page.

Labs live on the **Lab** tab of the module editor, next to Details and Structure.
A module without one is a normal module; the tab shows a count when it has any.

### Where a lab appears

A lab is a **stop in the course sidebar**, not a separate screen, so students reach
one by working through the module. Two placements:

- **At the end of the module** — the lab gets its own "Lab" group after the last chapter.
- **After a section** — the lab sits inline, right below that section.

Delete the section a lab was pinned to and the lab moves to the end rather than
disappearing with it.

### Lab fields

| Field | Required | Notes |
|---|---|---|
| Lab title | ✅ | Shows in the course sidebar, like a section title |
| Minutes | ✅ | The estimate students see, and the sidebar duration |
| Where it appears | ✅ | End of the module, or after a chosen section |
| Before you start | optional | What to have ready, e.g. "Wireshark and a free TryHackMe account" |
| What they'll do | recommended | Objectives students tick off while working. On a link-out lab this is the only thing in the page they touch |
| The brief (EN/AR) | recommended | The task, in markdown. Bilingual like every lesson body |
| Where the lab runs | optional | Links out. The **first becomes the main button** |
| Files students download | optional | Attachments, max **25 MB** each |
| How it gets marked done | ✅ | A finish button, or flags |

### Links

`https://` addresses only. Students always see the **host** a link leads to
(`tryhackme.com`) under the button before they click, and the link opens in a new
tab. Anything that is not http or https is dropped when the module is saved.

### Files

Accepted: `pdf, zip, gz, tar, txt, md, csv, json, log, pcap, pcapng, cap, yaml,
yml, conf, sh, py, sql`. Everything is served as a forced download and never opens
in the page. Host a VM image somewhere else and add it as a link instead: a
multi-gigabyte `.ova` does not belong on the app server.

### Completion

- **A finish button** — students say when they are done. Nothing is verified, and
  the page does not pretend otherwise.
- **Flags** — one or more values students extract from the lab environment. Add as
  many as the lab needs; each has a prompt, the expected answer, an optional hint,
  and an optional case-sensitivity toggle. Getting **all** of them right finishes
  the lab, with no second button to press.

> Flags are checked in the student's browser, which means a determined one can read
> the answers from the page. That is fine for a self-check and wrong for a graded
> exam. Do not use a flag as the only thing standing between a student and a
> certificate.

### Network simulation

The same builder the networking lessons use, on the lab. Use it when a topic is
better shown than described: packets moving through a topology, a handshake step
by step. It renders in the lab page with a full-screen toggle.

### The preview beside the form

The right-hand column of the Lab tab is not a mock-up, it is the same lab page
students get, rendering live as you type. What you see there is what they see.

### Publish checklist

- [ ] A brief, or objectives, or both. A lab with only a title is dropped on save
- [ ] Every link tested and reachable
- [ ] "Before you start" mentions any account or tool the lab assumes
- [ ] Flag answers match exactly what the environment produces
- [ ] Placement makes sense: after the section that teaches what the lab practises

---

## 7. Learning Path

A path sequences **existing published content** into a guided curriculum. It contains no
content of its own — only ordered references.

| Field | Required | Notes |
|---|---|---|
| Title (EN/AR) | EN ✅ | |
| Description (EN/AR) | recommended | "What will a student achieve?" |
| Slug | auto | URL: `/paths/<slug>` |
| Difficulty | ✅ | |
| Est. Hours | ✅ | Total for the whole path |
| Accent color | ✅ | |
| Tags | optional | |
| **Steps** | ✅ at least one | Pick from the catalog (searchable): OS & standalone modules, networking lessons, programming modules. Reorder with ↑/↓ |

The editor includes a **Student Preview** of the path hero + numbered curriculum.

**How it behaves for students:** they enroll, each step lights up automatically when its
underlying content is completed (finishing a lesson anywhere counts), and a Continue
button jumps to the first incomplete step. If a step's content is later unpublished, the
step shows as *Unavailable* instead of breaking.

### Publish checklist

- [ ] English title + description
- [ ] Steps ordered from fundamentals → advanced
- [ ] Every step's content is itself **published** (unpublished steps appear locked to students)
- [ ] Estimated hours roughly match the sum of the steps

---

## 8. Markdown reference

All markdown fields support GitHub-Flavored Markdown, rendered identically everywhere:

````markdown
# Lesson title          ← one H1 at the top
## Section heading      ← main structure
### Sub-heading

**bold** · *italic* · `inline code`

- bullet lists
1. numbered lists

> Blockquotes for callouts / important notes

| Tables | Work |
|--------|------|
| yes    | ✅   |

```python
# fenced code blocks with language tag
print("hello")
```

![diagram](https://...)   ← or use the Insert Image button
````

Conventions that keep lessons consistent:

- One `#` H1 at the top, then `##` for sections.
- Code blocks always carry a language tag (`python`, `bash`, `text`).
- Use blockquotes for warnings/notes, not bold paragraphs.
- Images: prefer **Insert Image** (uploads to the Academy) over hotlinking external sites.
- Code and IPs render left-to-right automatically, even in Arabic UI.

---

## 9. Where published content appears

| Type | Student surfaces |
|---|---|
| Networking Lesson | Fundamentals → Networking (list) · dashboard counts · path catalog |
| Programming Module/Concept | Fundamentals → Programming → Python · "Jump back in" · path catalog |
| OS Module | Fundamentals → Operating Systems (+ Modules hub if toggled) · path catalog |
| Standalone Module | Modules hub · path catalog |
| Lab | Inside its module, as a stop in the course sidebar. Modules with one carry a **Lab** badge on their tile and answer the Modules hub's "Has a lab" filter |
| Learning Path | Paths page → path detail with enrollment & progress |

Everything published also feeds the dashboard's totals, XP, and progress bars.
