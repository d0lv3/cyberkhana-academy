# CyberKhana Academy — Full Review

_Point-in-time audit of the live codebase (academy.cyberkhana.tech). Grouped by
priority. Every item was verified against current code, not older notes._

---

## 🔴 Biggest needs (block real usage)

### 1. Content — the platform is built but nearly empty
Students currently hit "Coming Soon" on Paths, Modules, and the Networking
category (`pages/paths/PathsPage.tsx`, `pages/modules/ModulesPage.tsx`,
`pages/fundamentals/NetworkingPage.tsx`). Only the built-in **Linux for
Cybersecurity** course + a couple of Python modules exist. The whole creator
pipeline works — it just has almost nothing published. This is the #1 thing
between "impressive demo" and "usable product."

### 2. Flag validation is a stub
The module "Submit Flag" button just returns _"validation will be enabled
soon"_ (`pages/fundamentals/ModuleViewerPage.tsx`). For a platform whose brand
is hands-on / CTF-style, the capture-the-flag hook doesn't actually work. Needs
a backend endpoint that checks a (hashed) flag, awards points, and marks
completion.

### 3. Leaderboard points are client-trusted → spoofable
The server takes the `points` total straight from the client payload (clamped to
100M) and books the delta (`backend/src/routes/progress.ts`). A competitive
leaderboard tied to universities/ambassadors can be inflated by anyone editing a
request. Points should be recomputed server-side from verified completions.

### 4. Zero automated tests and no CI
No test script in either `package.json`, no `.github/workflows`. Every change
ships to production unguarded. Even a thin smoke test + a build-check GitHub
Action would catch regressions before they're live.

---

## 🟠 Incomplete features that undercut the value prop

### 5. C and Bash are visible but non-functional
Shown as "Coming Soon" locks (`pages/creators/ProgrammingCreator.tsx`); the code
runner is Python-only (`docs/CREATOR_STUDIO_GUIDE.md`). Either wire a runner for
them or hide them until ready — advertising locked tracks reads as unfinished.

### 6. Creator Studio editors are English-only
The management/list pages are bilingual, but every in-editor field label and
placeholder is hardcoded English (ModuleEditor, PathEditor,
ProgrammingConceptEditor, NetworkingEditor…). For an Iraqi/Arab creator audience
that's a real barrier.

### 7. No moderation / review queue
Content has a `draft → in_review → published` lifecycle, but admins have no queue
to review `in_review` submissions — creators just self-publish. If quality
control before go-live matters, that workflow doesn't exist yet.

---

## 🟡 Missing from the product brief

### 8. Certificates / badges / streaks
None exist. These are the retention + credential layer ("finished the SOC path →
here's proof") that a CV-building student audience needs.

### 9. Ambassador / university-club system
The brief's whole distribution model (students hosting clubs, university
leaderboards) has the leaderboard university filter but no ambassador roles, club
pages, or invite/attribution flow.

### 10. Real CTF labs
The "hands-on labs" pillar (spin-up target machines, VPN, live exploitation like
HTB) doesn't exist — only quizzes, a Python sandbox, and the network simulator.
Large architectural item, worth naming even if it's later.

---

## 🟢 Reliability & ops

- **No error monitoring or analytics** (no Sentry / GA / PostHog) — blind to
  production errors and to what students actually use.
- **No email / notifications** — no welcome, no "new content in your path," no
  re-engagement.
- **No documented DB backup/restore** routine for the Mongo content/progress.
- **Minor DX:** no `.gitattributes`, so every commit warns about LF→CRLF.

---

## Suggested sequencing

The engine is solid (auth, roles, permissions, content sync, points, deploy).
What it needs most isn't more features — it's:

1. **Content** (get real modules/paths published)
2. **Make the flag/CTF loop actually work** (#2)
3. **Server-side points** so the leaderboard is trustworthy (#3)
4. **A test/CI safety net** before scaling (#4)

Those four turn a great skeleton into something students can be handed.
