---
name: Security fixes
description: Security decisions made during hardening — ImgBB key, XSS, TLS
---

## ImgBB API Key
All 5 frontend files previously hardcoded `baf409d03cf4975986f6d44b5a1a2919`.
Moved to `VITE_IMGBB_KEY` env var (shared environment). Files now use `import.meta.env.VITE_IMGBB_KEY`.
Files: ActivitiesPage.tsx, ReportPage.tsx, ProfilePage.tsx, AdminAnnouncements.tsx, AdminRewards.tsx.

**Why:** Hardcoded frontend keys are visible in source/git history and bundle.

## XSS Fix — AdminReports.tsx
`onError` handler was using `el.parentElement!.innerHTML = \`<a href="${imageToShow}"...\`` — injecting unsanitized URL into DOM.
Fixed: added `failedImages` Set state + `onImageError` callback; conditionally renders a React `<a>` element instead.

**Why:** `innerHTML` with user/external URL data is a DOM XSS vector.
**How to apply:** Any image `onError` fallback must use React state, not innerHTML.

## Neon TLS
Changed `rejectUnauthorized: false` → `true` in server/db.ts.
Neon's standard TLS certificates are verifiable with Node.js default CA bundle.
If DB connection fails after this change, revert to `false` with a comment explaining it's a Neon pooler requirement.
