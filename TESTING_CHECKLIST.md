# EduBridge Manual Testing Checklist

A step-by-step guide for testing every feature yourself — no coding
required. Use this after any change to confirm things actually work,
rather than taking anyone's (including an AI's) word for it.

---

## 0. Before you start: 2-minute DevTools primer

You'll open these in every browser (Chrome/Edge/Firefox all work the same way).

**To open DevTools:** Press `F12`, or right-click anywhere on the page → **Inspect**.

You'll use two tabs:

### Console tab
Shows errors in red. After loading any page, glance here.
- **Pass:** empty, or only gray/blue informational lines.
- **Fail:** any red text. Screenshot it — that's a real bug.

### Network tab
Shows every request the page makes to load data.
- Refresh the page with this tab open (so it captures everything).
- Each row is one request. The **Status** column is what matters:
  - `200` = success (green/black)
  - `401` = not logged in (expected on some pages if you're logged out)
  - `403` = logged in, but not allowed (expected if testing admin features as a regular user)
  - `404` = not found (usually a real bug)
  - `500` = server error (**always** a real bug — screenshot the row, click it, check the "Response" or "Preview" sub-tab for the error message)
- Type part of a URL (e.g. `jombeelajar-api` or `api/`) into the filter box at the top to find relevant requests quickly.

That's all you need. Every checklist item below tells you exactly what
to click and what "pass" looks like — you won't need to read any code.

---

## 1. Authentication

| # | Steps | Expected result |
|---|---|---|
| 1.1 | Go to `/auth`. Enter a real email/password, click **Sign In**. | Redirects to `/dashboard`. No red Console errors. |
| 1.2 | On `/auth`, click **Sign Up**, fill in a new email/password, submit. | Either redirects to dashboard, or shows "check your email" message. |
| 1.3 | While logged in, go to `/auth/logout` (or click Sign Out in profile settings). | Redirects to `/auth` or home. Refreshing any page now shows you as a guest. |
| 1.4 | Close the browser tab, reopen the site. | You're still logged in (session persisted) — no need to log in again. |
| 1.5 | Try Sign In with a wrong password. | A clear error message appears (not a blank screen, not stuck on "Signing in..."). |

---

## 2. Dashboard (`/dashboard`)

| # | Steps | Expected result |
|---|---|---|
| 2.1 | Load `/dashboard` logged in. | Your display name, streak, and subjects list appear. Network tab: `api/dashboard` returns `200`. |
| 2.2 | Type a subject name into the search box. | List filters to matching subjects only. |
| 2.3 | Use the category dropdown filter. | List filters to that category only. |
| 2.4 | Click through pagination (if more than 9 subjects). | Page changes, list updates, no errors. |
| 2.5 | Click a subject card. | Navigates to that subject's chapters page. |
| 2.6 | Load `/dashboard` logged **out** (guest). | Page still loads with "Guest User" and subjects — doesn't crash or redirect. |

---

## 3. Quiz flow (student side)

| # | Steps | Expected result |
|---|---|---|
| 3.1 | From dashboard, click a subject → chapters page loads. | Chapters grouped by Form, each showing a topic count. Network: `api/subjects/{slug}/chapters` (or similar) returns `200`. |
| 3.2 | Click a chapter → then a topic. | Topic page loads with description, difficulty, and a quiz list (or "No quizzes available yet"). |
| 3.3 | Click a quiz to play it (must be logged in). | Loads within a few seconds — if it hangs more than ~20s, that's a bug (should show an error instead of spinning forever). |
| 3.4 | Answer all questions, submit. | Results page shows your score, correct/incorrect per question, and any XP awarded. |
| 3.5 | Go back to your dashboard/profile after submitting. | XP/level/streak reflect the quiz you just took (may take a refresh). |
| 3.6 | Try loading a quiz **not logged in**. | Redirects to `/auth` rather than showing a broken page. |

---

## 4. Quiz creation (student side)

| # | Steps | Expected result |
|---|---|---|
| 4.1 | On a topic page, click **Create a Quiz**. | Create-quiz form loads instantly (subject/chapter/topic context shown). |
| 4.2 | Fill in description, pick difficulty, time limit, toggle "Make public", submit. | Quiz created, redirects to the question-editor page. |
| 4.3 | Add 2+ questions with answers, mark correct answers, save. | Saves without error; going back to the topic page shows the new quiz. |
| 4.4 | Take the quiz you just created. | Playable, scores correctly based on the answers you marked correct. |

---

## 5. Leaderboard

| # | Steps | Expected result |
|---|---|---|
| 5.1 | Go to `/leaderboard`. | Student rankings load (or "no data yet" message — not a crash). |
| 5.2 | Switch between Daily / Weekly / All Time tabs. | List updates for each. |
| 5.3 | Go to `/leaderboard/schools`. | School rankings load with average score and participation rate per school. |
| 5.4 | Click a school name. | Navigates to that school's public profile page (`/schools/{id}`) showing stats, student/teacher counts, and a "Hall of Fame" list. |

---

## 6. Profile

| # | Steps | Expected result |
|---|---|---|
| 6.1 | Go to `/profile` while logged in. | Shows your stats, achievements tab, created-quizzes tab. |
| 6.2 | Go to Settings tab, change display name, save. | Success message; refreshing shows the new name. |
| 6.3 | Upload a new avatar image. | Preview updates immediately; after saving, it persists on refresh. |
| 6.4 | Pick a school from the school search/filter, save. | School is saved to your profile. |
| 6.5 | View someone else's profile via `/profile/[their-user-id]` (or a leaderboard link). | Public view loads (no email shown), achievements visible if not private. |

---

## 7. Achievements

| # | Steps | Expected result |
|---|---|---|
| 7.1 | On your own profile, open the Achievements tab. | Shows any achievements you've earned (empty state if none). |
| 7.2 | **(Admin only)** Go to `/admin/achievements`. | Lists the achievement catalog. Search and type-filter work. |
| 7.3 | **(Admin only)** Click **Create New Achievement**, fill in type/title/description/icon, save. | Appears in the catalog list immediately. |
| 7.4 | **(Admin only)** Edit an existing catalog achievement, change the title, save. | List reflects the new title. |
| 7.5 | **(Admin only)** Delete a catalog achievement. | Disappears from the list. |
| 7.6 | **(Admin only)** Go to `/admin/users/{id}`, click **Award Achievement**, pick "From catalog", select one, submit. | Achievement appears in that user's achievements tab. |
| 7.7 | **(Admin only)** Same as above but "One-off / custom" mode with a typed title. | Custom achievement awarded, shows in their profile. |

---

## 8. Schools

| # | Steps | Expected result |
|---|---|---|
| 8.1 | Go to `/schools/{id}` for any school (via leaderboard link). | Loads school detail: type, district, state, stats, hall of fame. |
| 8.2 | **(Admin only)** Go to `/admin/schools`. | Lists all schools with average score/participation. Search/filter work. |
| 8.3 | **(Admin only)** Create a new school with name/type/district/state. | Appears in the list. |
| 8.4 | **(Admin only)** Edit a school, change its name, save. | List reflects new name. |
| 8.5 | **(Admin only)** Delete a school that has no data under it. | Removed from the list. |

---

## 9. Admin — Content management (`/admin/content`)

| # | Steps | Expected result |
|---|---|---|
| 9.1 | Open the **Subjects** tab. | Lists all subjects with topic/quiz counts. |
| 9.2 | Create a new subject (name, description, icon). | Appears in the list. |
| 9.3 | Click into a subject's edit page. Change its name, save. | Success; name updates. |
| 9.4 | From a subject's edit page, add a new chapter. | Chapter appears under that subject. |
| 9.5 | Edit a chapter (name, form, order), save. | Updates correctly. |
| 9.6 | Try deleting a chapter that **has topics under it**. | Blocked with a clear error message (not a silent failure or a crash). |
| 9.7 | Delete a chapter with **no topics** under it. | Successfully removed. |
| 9.8 | From a chapter's edit page, add a new topic. | Topic appears under that chapter. |
| 9.9 | Try deleting a topic that **has quizzes under it**. | Blocked with a clear error message. |

---

## 10. Admin — Quiz moderation

| # | Steps | Expected result |
|---|---|---|
| 10.1 | Go to `/admin/quizzes/pending`. | Lists unverified quizzes. |
| 10.2 | Open a quiz's audit page (`/admin/quizzes/{id}/audit`). | Shows quiz info, comments, and verification history. |
| 10.3 | Add an audit comment. | Appears in the comment list immediately. |
| 10.4 | Click **Verify Quiz**, optionally add feedback, confirm. | Quiz flips to "Verified"; a new entry appears in Verification History. |
| 10.5 | Click **Unverify Quiz** on a verified quiz. | Flips back to "Unverified"; logged in history. |
| 10.6 | Go to `/admin/quizzes/{id}/questions` (audit view). | Shows all questions/answers read-only with comment threads per question/answer. |

---

## 11. Career guidance & Education pathway

| # | Steps | Expected result |
|---|---|---|
| 11.1 | Go to `/career-guidance`. | Career list/details load. |
| 11.2 | Submit a comment on a career page. | Appears in the comment thread. |
| 11.3 | Go to `/education-pathway`. | Pathway content loads. |
| 11.4 | Submit a comment there too. | Appears in the thread. |

---

## 12. Things to check on **every** page, always

- [ ] No red errors in Console.
- [ ] No `500` responses in Network tab.
- [ ] Page doesn't spin/load forever (more than ~10-15s with nothing happening = bug).
- [ ] Dark/light mode toggle (top-right) doesn't break the layout.
- [ ] Resize the browser narrow (or use DevTools' device toolbar, `Ctrl+Shift+M`) to sanity-check mobile view.

---

## How to report a bug you find

For each failure, note:
1. Which numbered item (e.g. "9.6").
2. What you clicked/typed.
3. What happened vs. what this doc said should happen.
4. If there's a red Console error or a non-200 Network response, screenshot it — that's usually enough for a fix without any further digging.
