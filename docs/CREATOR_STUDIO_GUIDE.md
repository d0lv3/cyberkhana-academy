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
6. [Learning Path](#6-learning-path)
7. [Markdown reference](#7-markdown-reference)
8. [Where published content appears](#8-where-published-content-appears)

---

## 1. How the Studio is organized

The Studio dashboard (`/creators`) shows:

- **Pipeline tiles** — counts of your content by lifecycle stage (Total / Published / In Review / Drafts).
- **Create New cards** — one card per content type (below).
- **Your Content** — every item you've authored, filterable by status and searchable.

| Content type | Editor route | What it is |
|---|---|---|
| Networking Lesson | `/creators/networking/new` | Markdown explainer + interactive packet-flow simulation (+ optional quiz) |
| Programming Content | `/creators/programming` | Modules and lesson/challenge concepts inside a language (Python) |
| Module | `/creators/modules/new` | Standalone chapter/section module for the Modules hub |
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

### Lesson tab fields

| Field | Required | Notes |
|---|---|---|
| Title (EN) | ✅ | Generates the slug |
| Title (AR) | recommended | Shown to Arabic users |
| Description (EN/AR) | recommended | Card text on the Networking page |
| Slug | auto | URL: `/fundamentals/networking/lesson/<slug>` |
| Order | ✅ (default 100) | Position in the lesson list — the built-in IP lesson is `1` |
| Est. Minutes | ✅ (default 10) | Shown on the lesson card |
| Tags | optional | Up to ~5 shown on the card |
| Markdown Content | ✅ | The left-hand reading pane of the lesson |
| Lesson Quiz | optional | **With** a quiz: students must score ≥ 70 % to complete the lesson. **Without**: they get a manual "Mark as complete" button |

### Simulation tab (the builder)

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
- [ ] Markdown content written
- [ ] **At least one simulation step** (publishing is blocked without it)
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
The difference is only *where they surface* (see §8).

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

## 6. Learning Path

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

## 7. Markdown reference

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

## 8. Where published content appears

| Type | Student surfaces |
|---|---|
| Networking Lesson | Fundamentals → Networking (list) · dashboard counts · path catalog |
| Programming Module/Concept | Fundamentals → Programming → Python · "Jump back in" · path catalog |
| OS Module | Fundamentals → Operating Systems (+ Modules hub if toggled) · path catalog |
| Standalone Module | Modules hub · path catalog |
| Learning Path | Paths page → path detail with enrollment & progress |

Everything published also feeds the dashboard's totals, XP, and progress bars.
