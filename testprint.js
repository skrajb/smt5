/* ============================================================
   Smartech Typing Tutor — Exercise printing (SmartechPrint)
   ------------------------------------------------------------
   Prints exercises as A4 sheets:
     - Smartech Education Computer Institute logo header
     - test name, exercise, language, time and pass rule
     - Name / Roll No. / Date lines
     - the WHOLE exercise on ONE page: the font size is reduced
       automatically (from 15pt down to 6.5pt) until it fits
     - one exercise per page, so a batch is just many pages

   Used by:
     testexercises.html  (print one exercise / all of one test)
     index.html          (Manage panel: print every exercise)
     paragraph.html      (Print Paper button in Paper-Based mode)

   API
     SmartechPrint.print(items, { title })   items = [{ group, title, no, text, lang, test, minutes, rule }]
     SmartechPrint.forTest(testId)           -> items of one test
     SmartechPrint.collect(scope)            -> "all" | "tests" | "practice" | "demo" | "test:<ID>"
   ============================================================ */
(function (global) {
  "use strict";

  var LOGO = "print-logo.png";
  var ROOT_ID = "smt-print-root";
  var STYLE_ID = "smt-print-style";
  var MAX_PT = 15, MIN_PT = 6.5, STEP_PT = 0.25;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var CSS = [
    "#" + ROOT_ID + "{display:none}",
    /* measured off-screen so the page layout is untouched */
    "@media screen{#" + ROOT_ID + ".smt-measure{display:block;position:fixed;left:-10000px;top:0;width:210mm;visibility:hidden;pointer-events:none}}",
    "@media print{",
    "@page{size:A4;margin:0}",
    "html,body{background:#fff!important;margin:0!important;padding:0!important;height:auto!important;min-height:0!important;overflow:visible!important}",
    "body.smt-printing>*:not(#" + ROOT_ID + "){display:none!important}",
    "body.smt-printing #" + ROOT_ID + "{display:block!important;position:static!important;width:210mm;visibility:visible!important}",
    "}",
    "#" + ROOT_ID + " .ps-page{box-sizing:border-box;width:210mm;height:296mm;padding:11mm 14mm 9mm;display:flex;flex-direction:column;background:#fff;color:#000;overflow:hidden;page-break-after:always;break-after:page;font-family:'Segoe UI',Arial,Helvetica,sans-serif}",
    "#" + ROOT_ID + " .ps-page:last-child{page-break-after:auto;break-after:auto}",
    "#" + ROOT_ID + " .ps-head{display:flex;align-items:center;justify-content:space-between;gap:8mm}",
    "#" + ROOT_ID + " .ps-logo{height:17mm;width:auto;display:block}",
    "#" + ROOT_ID + " .ps-headr{text-align:right;line-height:1.25}",
    "#" + ROOT_ID + " .ps-doc{font-size:12.5pt;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0B1E36}",
    "#" + ROOT_ID + " .ps-inst{font-size:8.5pt;color:#444}",
    "#" + ROOT_ID + " .ps-rule{height:0;border-top:2.2pt solid #0B1E36;border-bottom:.7pt solid #B8862E;padding-top:.8mm;margin:2.5mm 0 3mm}",
    "#" + ROOT_ID + " .ps-title{font-size:13.5pt;font-weight:800;color:#0B1E36;margin:0 0 1.5mm}",
    "#" + ROOT_ID + " .ps-info{display:flex;flex-wrap:wrap;gap:1mm 6mm;font-size:9.5pt;color:#222;margin-bottom:3mm}",
    "#" + ROOT_ID + " .ps-info b{color:#0B1E36}",
    "#" + ROOT_ID + " .ps-fields{display:flex;gap:8mm;font-size:10.5pt;margin-bottom:3.5mm}",
    "#" + ROOT_ID + " .ps-fields span{flex:1;border-bottom:.8pt solid #000;padding-bottom:.8mm;white-space:nowrap}",
    "#" + ROOT_ID + " .ps-body{flex:1 1 auto;min-height:0;overflow:hidden;border:.7pt solid #9aa4b2;border-radius:1.5mm;padding:4mm 5mm}",
    "#" + ROOT_ID + " .ps-text{white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere;text-align:justify;line-height:1.6;margin:0}",
    "#" + ROOT_ID + " .ps-foot{display:flex;justify-content:space-between;gap:6mm;font-size:8pt;color:#555;border-top:.5pt solid #bbb;padding-top:1.5mm;margin-top:2.5mm}"
  ].join("\n");

  function fontFor(lang) {
    if (lang === "Punjabi") return "'Noto Sans Gurmukhi','Raavi','Gurmukhi MN','Nirmala UI','Arial Unicode MS',sans-serif";
    if (lang === "Hindi") return "'Noto Sans Devanagari','Mangal','Nirmala UI','Kokila','Arial Unicode MS',sans-serif";
    return "Georgia,'Times New Roman',serif";
  }

  function ruleText(it) {
    if (it.rule) return it.rule;
    var T = global.SmartechTests;
    if (it.test && T && T.summary) return T.summary(it.test);
    return "";
  }

  function sheetHTML(it, n, total) {
    var chars = String(it.text || "").length;
    var mins = it.minutes || (it.test && it.test.minutes) || "";
    var info = [];
    info.push("<span><b>Exercise:</b> " + esc((it.no ? it.no + ". " : "") + (it.title || "")) + "</span>");
    if (it.lang) info.push("<span><b>Language:</b> " + esc(it.lang) + "</span>");
    if (mins) info.push("<span><b>Time:</b> " + esc(mins) + " min</span>");
    info.push("<span><b>Characters:</b> " + chars.toLocaleString() + "</span>");
    var rule = ruleText(it);
    return '<section class="ps-page">' +
      '<header class="ps-head"><img class="ps-logo" src="' + LOGO + '" alt="Smartech Education Computer Institute">' +
      '<div class="ps-headr"><div class="ps-doc">Typing Test &mdash; Exercise Sheet</div>' +
      '<div class="ps-inst">Type the passage exactly as printed.</div></div></header>' +
      '<div class="ps-rule"></div>' +
      '<div class="ps-title">' + esc(it.group || it.title || "") + "</div>" +
      '<div class="ps-info">' + info.join("") + "</div>" +
      (rule ? '<div class="ps-info" style="margin-top:-1.5mm"><span><b>Pass rule:</b> ' + esc(rule) + "</span></div>" : "") +
      '<div class="ps-fields"><span>Name:</span><span>Roll No.:</span><span>Date:</span></div>' +
      '<div class="ps-body"><div class="ps-text" style="font-family:' + fontFor(it.lang) + '">' + esc(it.text) + "</div></div>" +
      '<footer class="ps-foot"><span>Smartech Education Computer Institute, Patiala</span><span>Sheet ' + n + " of " + total + "</span></footer>" +
      "</section>";
  }

  // Largest font size (pt) at which the whole text fits inside its box
  function fit(page) {
    var body = page.querySelector(".ps-body");
    var text = page.querySelector(".ps-text");
    var avail = body.clientHeight - 2;
    var pt = MAX_PT;
    for (; pt > MIN_PT; pt -= STEP_PT) {
      text.style.fontSize = pt + "pt";
      if (text.offsetHeight <= avail) return pt;
    }
    text.style.fontSize = MIN_PT + "pt";
    return MIN_PT;
  }

  function preloadLogo() {
    return new Promise(function (resolve) {
      var img = new Image();
      var done = false;
      function fin() { if (!done) { done = true; resolve(); } }
      img.onload = fin; img.onerror = fin;
      img.src = LOGO;
      setTimeout(fin, 2500);
    });
  }

  function cleanup() {
    var root = document.getElementById(ROOT_ID);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    document.body.classList.remove("smt-printing");
  }

  function print(items) {
    items = (items || []).filter(function (it) { return it && it.text; });
    if (!items.length) { alert("There are no exercises to print yet."); return Promise.resolve(0); }

    cleanup();
    if (!document.getElementById(STYLE_ID)) {
      var st = document.createElement("style");
      st.id = STYLE_ID;
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "smt-measure";
    root.innerHTML = items.map(function (it, i) { return sheetHTML(it, i + 1, items.length); }).join("");
    document.body.appendChild(root);

    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return Promise.all([preloadLogo(), fontsReady]).then(function () {
      var pages = root.querySelectorAll(".ps-page");
      for (var i = 0; i < pages.length; i++) fit(pages[i]);
      root.className = "";
      document.body.classList.add("smt-printing");
      window.addEventListener("afterprint", function once() {
        window.removeEventListener("afterprint", once);
        cleanup();
      });
      global.print();
      return items.length;
    });
  }

  /* ---------- gathering exercises ---------- */
  function forTest(testId) {
    var E = global.SmartechExercises;
    var t = E.testById(testId);
    if (!t) return [];
    return E.testExercises(t.id).map(function (ex, i) {
      return { group: t.name, title: ex.title, no: i + 1, text: ex.text, lang: ex.lang || t.lang, test: t, minutes: t.minutes };
    });
  }

  function practice() {
    var E = global.SmartechExercises, out = [];
    ["English", "Punjabi", "Hindi"].forEach(function (lang) {
      var seen = {}, list = [];
      ["chunk", "paragraph"].forEach(function (mode) {
        E.list(lang, mode).forEach(function (ex) {
          var k = ex.title + "\u0001" + ex.text;
          if (!seen[k]) { seen[k] = 1; list.push(ex); }
        });
      });
      list.forEach(function (ex, i) {
        out.push({ group: lang + " Practice", title: ex.title, no: i + 1, text: ex.text, lang: lang, rule: "Practice exercise (no pass rule)." });
      });
    });
    return out;
  }

  function demos() {
    var E = global.SmartechExercises;
    return E.demos().map(function (ex, i) {
      return { group: "Demo Test", title: ex.title, no: i + 1, text: ex.text, lang: ex.lang, minutes: 5, rule: "5-minute demo test." };
    });
  }

  function collect(scope) {
    var E = global.SmartechExercises;
    scope = String(scope || "all");
    if (scope.indexOf("test:") === 0) return forTest(scope.slice(5));
    var tests = [];
    if (scope === "all" || scope === "tests") {
      E.tests().forEach(function (t) { tests = tests.concat(forTest(t.id)); });
    }
    if (scope === "tests") return tests;
    if (scope === "practice") return practice();
    if (scope === "demo") return demos();
    return tests.concat(practice(), demos());
  }

  global.SmartechPrint = { print: print, forTest: forTest, collect: collect, esc: esc };
})(window);
