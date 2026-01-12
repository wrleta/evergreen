# RK Portal — TSX Blocks Zip

This zip contains the TSX scripts exactly as they exist in the current workspace (`/mnt/data`).
Each file typically represents one Softr custom-code block (often Block 1) for its page.

## Included files

### Bulletins.tsx
```
BULLETINS / BOLETINES (Reporter+)
Updates per your latest notes:
- Removed "Updates | avisos"
- Pills moved UNDER the main title
- Filter label simplified to: Filter (all)  (no newest/oldest shown)
- Keeps Spanish-muted = italic rule where used
- Banner + nav row match newest format
```

### FAQ.tsx
```
FAQ / AYUDA (Worker+ + Office+)
Intent:
- One-card list with divider rows (no nested card-in-card)
- Search + Category filter
- Bilingual display (Spanish muted => italic)
- Banner + pills + nav row aligned with your newest pages

Slugs aligned to your app:
/home /today /stop-detail /reports /profile /bulletins /office-review
/stop-requests /jobsite-edit-requests /user-update-requests /faq
```

### Home.tsx
```
HOME (Unified, role-tiered)

Intent:
- One Home layout for all roles (Field/Reporter+, Manager+, Admin+)
- Key marker differences render by roleTier (no duplicate pages)

Layout rules (per chat history):
- Top banner: RK + FIELD REPORTING SYSTEM (left) + avatar (right)
- Title: "Home | inicio" on ONE line (inicio gray, lighter)
- Reporter name on right: cyan, same size as Home; NO email shown
- Search row
- Count chips below search (gray when 0)
- Row BELOW chips: Filter (all/filtered) • Today (calendar + Today) • FAQ
- Reports access included (button in Quick Nav)
- Office+ chip shown for office roles
- Office/Admin cards appear only for non-field roles (placeholders now; wire data later)
- Bulletins preview card
- Today preview card (no redundant Open button)
```

### JobsiteEditRequests.tsx
```
JOBSITE EDIT REQUESTS (Worker+ + Office+)
New standard (aligned to latest pages):
- Banner matches newest pages (no Home in banner)
- Shared bg/banner/accentLine/cardStyle/linkBtn/thinGray
- Nav row is 4-col grid: Filter (all) / Home / Today / FAQ
- Status naming aligned to: Open / In Progress / Insufficient / Approved / Rejected / Closed
```

### OfficeReview.tsx
```
OFFICE REVIEW QUEUE (Office+)
Key fix:
- Do NOT hard-block the page with isOffice by default (Softr should control access).
- If role fields are missing from useCurrentUser, isOffice would be false for everyone.
```

### Profile.tsx
```
PROFILE / PERFIL (Reporter+)
Updates per newest intent:
- Banner matches newest format (FIELD REPORTING SYSTEM + avatar, no Home in banner)
- Title uses bilingual formatting: "Profile | perfil" (Spanish muted + italic)
- Nav row is: Edit (name) + Home + Today + FAQ (equidistant)
- Worker term updated to Reporter (labels + fallback role)
- Direct edit lane for Display Name only via routes.profileEdit
- All other edits go through User Update Requests
- Divider rows (no nested cards)
```

### Reports.tsx
```
REPORTS / REPORTES (Worker+)
Updates per chat history:
- Banner matches newest format (FIELD REPORTING SYSTEM + avatar, no Home in banner)
- Remove redundant "SYSTEM" label above title
- Title uses new bilingual formatting: "Reports | reportes"
- Removed "History | historial" (was not a button)
- Nav row is: Filter + Home + Today + FAQ (equidistant)
- Keep "(all)" gray (lowercase), but Filter is not faded vs others
- One-card list w/ divider rows (no nested cards)
```

### StopDetail.tsx
_No header comment found._

### StopRequests.tsx
```
STOP REQUESTS (Worker+ + Office+)
New standard (per attached):
- Banner matches newest pages (no Home in banner)
- Shared bg/banner/accentLine/cardStyle/linkBtn/thinGray
- Nav row is 4-col grid: Filter (all) / Home / Today / FAQ
- Status naming aligned to: Open / In Progress / Insufficient / Closed
```

### Today.tsx
```
TODAY / HOY
Intent (per project):
- Show today's stops for logged-in worker (Login_Email and/or Worker_ID)
- Office+ can toggle "My" vs "Crew" view + apply Crew/Status filters
- Pinned follow-up when any stop is "Insufficient"
- “Missing stop” + “Report different site”
- Day actions: general note, time log, reports history

Layout alignment:
- Filter + Home + FAQ row is BELOW the colored pills (chips)
```

### UserUpdateRequests.tsx
```
USER UPDATE REQUESTS (Worker+ + Office+)
New standard (aligned to latest pages):
- Banner matches newest pages (no Home in banner)
- Shared bg/banner/accentLine/cardStyle/linkBtn/thinGray
- Nav row is 4-col grid: Filter (all) / Home / Today / FAQ
- Status naming aligned to: Open / In Progress / Insufficient / Approved / Rejected / Closed
```
