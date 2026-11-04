/* ============================================================
   Smartech Typing Tutor — Test types (SmartechTests)
   ------------------------------------------------------------
   Everything about "which rules does this test follow" and
   "is this test unlocked on this computer":

     - the active test's pass rule (read by script.js / script2.js)
     - pass / fail evaluation
     - access: each test type has its own code TYPE in the Google
       Sheet ("TestAccess" tab); this file unlocks / re-checks it
     - start(): opens an exercise of a test with the right page,
       language and time

   Test definitions themselves (name, minutes, speed, accuracy,
   code type, exercises) come from the GitHub text file and are
   parsed in exercises.js (see the doc comment at the top there).
   ============================================================ */
(function (global) {
  "use strict";

  var ACTIVE_KEY = "smartechActiveTest";
  var CHECK_EVERY_MS = 6 * 60 * 60 * 1000; // re-ask the sheet at most every 6 hours

  /* ---------- the test currently being taken ---------- */
  function activeCriteria() {
    try {
      var c = JSON.parse(localStorage.getItem(ACTIVE_KEY));
      return c && c.id && c.minutes ? c : null;
    } catch (e) { return null; }
  }
  function clearActive() { try { localStorage.removeItem(ACTIVE_KEY); } catch (e) {} }

  /* ---------- pass rule ---------- */
  function requiredChars(c) {
    return c.chars ? Math.round(c.chars) : Math.round((c.wpm || 0) * 5 * c.minutes);
  }
  function requiredWpm(c) {
    return c.wpm ? c.wpm : (c.chars ? Math.round((c.chars / (5 * c.minutes)) * 10) / 10 : 0);
  }

  // gross / net are character counts; accuracy is a percentage (number or numeric string)
  function evaluate(c, gross, net, accuracy) {
    var need = requiredChars(c);
    var counted = c.basis === "net" ? Number(net) : Number(gross);
    var speedOk = counted >= need;
    var accOk = Number(accuracy) >= c.accuracy;
    return { passed: speedOk && accOk, speedOk: speedOk, accOk: accOk, requiredChars: need, requiredWpm: requiredWpm(c) };
  }

  function summary(c) {
    var parts = [c.minutes + " min"];
    var need = requiredChars(c);
    if (need) parts.push("min " + requiredWpm(c) + " WPM (" + need + " " + (c.basis === "net" ? "net" : "gross") + " chars)");
    parts.push(c.accuracy + "% accuracy");
    return parts.join(" \u00B7 ");
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  // Text shown under the result table
  function noteHTML(c) {
    var need = requiredChars(c);
    var rule = need
      ? "you need at least " + need + " " + (c.basis === "net" ? "net" : "gross") + " characters (" + requiredWpm(c) + " WPM) with " + c.accuracy + "% accuracy."
      : "you need at least " + c.accuracy + "% accuracy.";
    return '<span class="red-asterisk">*</span>' + esc(c.name) + " (" + c.minutes + " min): " + rule +
      (c.note ? " " + esc(c.note) : "");
  }

  /* ---------- access (Google Sheet codes) ---------- */
  function needsCode(t) { return !!t && !!t.code && t.code !== "FREE"; }

  function isUnlocked(t) {
    if (!needsCode(t)) return true;
    return typeof global.isActivationValid === "function" ? global.isActivationValid(t.code) : false;
  }

  // Enter a code for the test's code type. Resolves { ok, reason }.
  function unlock(t, code) {
    code = String(code || "").trim();
    if (!code) return Promise.resolve({ ok: false, reason: "EMPTY" });
    return global.activateProduct(code, t.code).then(function (r) {
      if (r.ok) global.markActivated(t.code, code.toUpperCase(), r.expiresAt);
      return r;
    });
  }

  // Quietly asks the sheet whether an already-activated code is still good, so
  // BLOCKING a code (or removing its row) in the sheet takes effect on the next
  // check. Offline / server trouble never locks anyone out, and a "device
  // mismatch" is left alone (screen-size changes alter the device string).
  // Resolves true when the local state changed (re-render the page).
  function revalidate(t) {
    if (!needsCode(t) || typeof global.checkProduct !== "function") return Promise.resolve(false);
    var info = global.getActivationInfo(t.code);
    if (!info.code) return Promise.resolve(false);
    var key = "smartechLastCheck_" + t.code;
    var last = 0;
    try { last = Number(localStorage.getItem(key)) || 0; } catch (e) {}
    if (Date.now() - last < CHECK_EVERY_MS) return Promise.resolve(false);

    return global.checkProduct(info.code, t.code).then(function (r) {
      if (r.reason === "NETWORK" || r.reason === "BUSY") return false;
      try { localStorage.setItem(key, String(Date.now())); } catch (e) {}
      if (r.ok) {
        if (r.expiresAt && r.expiresAt !== info.expiresAt) {
          global.markActivated(t.code, info.code, r.expiresAt);
          return true;
        }
        return false;
      }
      if (r.reason === "BLOCKED" || r.reason === "EXPIRED" || r.reason === "INVALID") {
        global.clearActivation(t.code);
        return true;
      }
      return false;
    });
  }

  /* ---------- start a test exercise ---------- */
  function pageFor(mode) { return mode === "chunk" ? "testpage.html" : "paragraph.html"; }

  function start(t, ex, index) {
    var snapshot = {
      id: t.id, name: t.name, lang: ex.lang || t.lang || "English", mode: t.mode,
      minutes: t.minutes, wpm: t.wpm, chars: t.chars, accuracy: t.accuracy,
      basis: t.basis, note: t.note, code: t.code
    };
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(snapshot));
      localStorage.setItem("selectedExerciseText", ex.text);
      localStorage.setItem("selectedExerciseLanguage", snapshot.lang);
      localStorage.setItem("selectedExerciseNo", String(index + 1));
      localStorage.setItem("selectedExerciseTitle", ex.title || "");
      localStorage.setItem("selectedExerciseMode", t.mode);
    } catch (e) {
      alert("Could not start the test: browser storage is full or unavailable.");
      return;
    }
    global.location.href = pageFor(t.mode);
  }

  global.SmartechTests = {
    activeCriteria: activeCriteria,
    clearActive: clearActive,
    requiredChars: requiredChars,
    requiredWpm: requiredWpm,
    evaluate: evaluate,
    summary: summary,
    noteHTML: noteHTML,
    needsCode: needsCode,
    isUnlocked: isUnlocked,
    unlock: unlock,
    revalidate: revalidate,
    start: start,
    pageFor: pageFor,
    esc: esc
  };
})(window);
