# Test types, pass rules and per-test access codes

You now manage **everything from two places**:

| What | Where |
|---|---|
| Test types, pass criteria, which exercise belongs to which test | **GitHub text file** (the same one the app already downloads) |
| Who may open a test (one code type per test) | **Google Sheet** → `TestAccess` tab |

No app update is needed to add a test type, change a pass rule, add an exercise or issue codes.

## 1. Define test types in the GitHub file

Add a `### TEST` block per test type (see `test_types_format.txt` for a full sample):

```
### TEST CHSL-ENG
name: SSC CHSL English
language: English
mode: paragraph
minutes: 10
wpm: 35
accuracy: 93
code: CHSL
```

| Field | Meaning |
|---|---|
| `minutes` | Fixed test time for this test |
| `wpm` **or** `chars` | Minimum speed (1 word = 5 chars) or minimum characters |
| `accuracy` | Minimum accuracy % (default 90) |
| `basis` | `gross` (default) or `net` – which count must reach the speed target |
| `mode` | `paragraph` (long passage page) or `chunk` (chunk page) |
| `code` | Access-code **type** in the sheet. `FREE` = no code. Omitted = the test ID is the type (locked) |
| `description`, `note`, `active` | Card text, extra result note, `no` to hide |

**Pass = speed target reached AND accuracy reached.** The result page, history, certificate and the results sheet all record which test it was.

## 2. Mark exercises for a test

Put `@TESTID` in the exercise header. A tagged exercise appears **only** in that test (not in the normal Chunk/Long lists):

```
### English @CHSL-ENG Passage 1
---
text...
---

### English @CHSL-ENG @CGL-ENG Passage 2     <- one exercise, two tests
```

Order in the file = order of the buttons. The language word is optional with an `@tag` (it is detected from the text).

## 3. Access codes in Google Sheets (one type per test)

1. Open your **Licenses** spreadsheet → *Extensions ▸ Apps Script*.
2. Replace the script with `GoogleAppsScript_Activation_Backend.gs` and save.
3. *Deploy ▸ Manage deployments ▸ Edit ▸ New version ▸ Deploy* (same `/exec` URL, so the app needs no change).
4. Reload the sheet. A **Smartech** menu appears → *Generate access codes…* → enter the test **type** (e.g. `CHSL`), how many, and validity days. A `TestAccess` tab is created with columns  
   `Type | Code | Status | Device | Expiry | Days | Student / Note | Last Activity`.

Day-to-day:
- **New student** → give them one unused code of that type. First use binds it to their computer and starts the validity clock (`Days`, or 90 if empty).
- **Extend / shorten** → edit the `Expiry` cell. Read live.
- **Revoke** → type `BLOCKED` in `Status`. The app re-checks every 6 hours when the Test Centre is opened online, and locks that test again.
- **Move to another computer** → the student presses deactivate (or set Status back to `NEW` and clear Device).
- ENG / PBI / HIN keep working on the old `Licenses` tab, unchanged. A test can reuse them with `code: ENG`.

> Note: the GitHub raw file is public, so the code gate controls access **inside the app**. Do not rely on it to keep exercise text secret.

## 4. Results sheet (optional but recommended)

Replace the script behind the **results** sheet with `GoogleAppsScript_Code.gs` and redeploy. It adds `ExerciseNo`, `TestId`, `TestName` columns at the end (old rows are untouched) and supports `?action=top10&test=CHSL-ENG` for per-test leaderboards.

## What changed in the app
`tests.html` (new Test Centre page, in the sidebar), `tests.js` (rules + access), `exercises.js` (reads `### TEST` blocks and `@tags`), `activation.js` (any code type), `script.js` / `script2.js` (use the test's time and pass rule), `paragraph.html`, `testpage.html`, `sidebar.js`, `sheet-sync.js`, `db.js`.
