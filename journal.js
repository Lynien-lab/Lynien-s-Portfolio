/* ============================================================
   THE WORKING JOURNAL — shared behavior across every page.
   Page-turn navigation, CMS-driven project grid, filters,
   scroll reveal, case-study extras.
   ============================================================ */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- CMS: project index, published as a Google Sheet ----------
     Publish the sheet's first tab to the web (Share → General access →
     Anyone with the link → Viewer) and it renders here automatically.
     If the fetch fails for any reason, the FALLBACK_PROJECTS below is
     used instead, so the page never breaks.
  ------------------------------------------------------------------- */
  var PROJECTS_SHEET_ID = "18tlDd3XJ-0KD57aCCAwdPt3Tg1R461ySZ4WACaGsKrU";
  var PROJECTS_CSV_URL = PROJECTS_SHEET_ID
    ? "https://docs.google.com/spreadsheets/d/" + PROJECTS_SHEET_ID + "/export?format=csv&gid=0"
    : null;

  var FALLBACK_PROJECTS = [
    { order:"1", title:"My HyprT: Medical App Case Study", slug:"medical-app", category:"UX Design",
      tools:"Figma, Qualtrics", role:"Designer, Researcher",
      summary:"A CeHRes Roadmap-driven redesign of a self-management app for cardiovascular patients, from stakeholder interviews to a usability-tested prototype.",
      featured:"TRUE", page_url:"case-study-medical-app.html" },
    { order:"2", title:"Thesis: Chatbot Dialogue Design", slug:"chatbot-dialogue", category:"UX Design",
      tools:"Figma, ATLAS.ti, GPT-4", role:"Researcher, Designer",
      summary:"Co-creating conversational strategies for a student mental well-being chatbot, validated with 10 student co-designers into 11 design guidelines.",
      featured:"TRUE", page_url:"case-study-chatbot.html" },
    { order:"3", title:"Memory Spice", slug:"memory-spice", category:"UX Design",
      tools:"Figma, Premiere Pro", role:"Concept Video Production, Interviewing",
      summary:"A Research-through-Design study on multi-sensory food memory, iterating from a restrictive cooking machine into a sensory memory device.",
      featured:"TRUE", page_url:"case-study-memory-spice.html" },
    { order:"4", title:"FIN-tastic Rescue", slug:"fin-tastic-rescue", category:"UX Design",
      tools:"Figma, Canva, FinalCut Pro", role:"Concept Video, Design",
      summary:"An interactive fish-tank display that visualizes campus water waste in real time, paired with a concept video.",
      featured:"TRUE", page_url:"case-study-fin-tastic-rescue.html" },
    { order:"5", title:"Spirit Magazine: Board Game Design", slug:"spirit-magazine", category:"Craft",
      tools:"", role:"",
      summary:"A tabletop board game prototype exploring investigative journalism as game mechanics. Case study write-up coming soon.",
      featured:"FALSE", page_url:"" }
  ];

  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += c;
        }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ""; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
        else if (c === '\r') { /* skip */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1 || (r[0] && r[0].trim()); });
  }

  function rowsToObjects(rows) {
    if (!rows.length) return [];
    var headers = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (r) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = (r[i] || "").trim(); });
      return obj;
    });
  }

  function renderProjects(list) {
    var grid = document.getElementById("projectsGrid");
    if (!grid) return;

    var sorted = list.slice().sort(function (a, b) {
      return (parseFloat(a.order) || 0) - (parseFloat(b.order) || 0);
    });

    grid.innerHTML = "";
    sorted.forEach(function (p) {
      var href = p.page_url && p.page_url.trim() ? p.page_url.trim() : null;
      var card = document.createElement(href ? "a" : "div");
      card.className = "project-card";
      if (href) card.href = href;
      card.setAttribute("data-category", (p.category || "").trim());

      var cat = document.createElement("div");
      cat.className = "cat";
      cat.textContent = p.category || "Project";
      card.appendChild(cat);

      var h3 = document.createElement("h3");
      h3.textContent = p.title || "Untitled";
      card.appendChild(h3);

      var summary = document.createElement("p");
      summary.textContent = p.summary || "";
      card.appendChild(summary);

      if (p.tools || p.role) {
        var meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = [p.role, p.tools].filter(Boolean).join(" · ");
        card.appendChild(meta);
      }

      if (href) {
        var arrow = document.createElement("span");
        arrow.className = "project-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "↗";
        card.appendChild(arrow);
      }

      grid.appendChild(card);
    });

    wireProjectFilters(sorted);
  }

  function wireProjectFilters(projects) {
    var chips = Array.prototype.slice.call(document.querySelectorAll(".project-filter"));
    if (!chips.length) return;
    var cats = {};
    projects.forEach(function (p) { if (p.category) cats[p.category.trim()] = true; });

    function apply(cat) {
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.dataset.category === cat));
      });
      var cards = document.querySelectorAll(".project-card");
      var visible = 0;
      cards.forEach(function (card) {
        var show = cat === "all" || card.getAttribute("data-category") === cat;
        card.classList.toggle("is-hidden", !show);
        if (show) visible++;
      });
      var empty = document.getElementById("projectsEmpty");
      if (empty) empty.style.display = visible ? "none" : "block";
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        apply(c.dataset.category);
      });
    });
  }

  function loadProjects() {
    var grid = document.getElementById("projectsGrid");
    if (!grid) return;

    if (!PROJECTS_CSV_URL) { renderProjects(FALLBACK_PROJECTS); return; }

    fetch(PROJECTS_CSV_URL, { cache: "no-store" })
      .then(function (res) { if (!res.ok) throw new Error("sheet fetch failed"); return res.text(); })
      .then(function (text) {
        var objs = rowsToObjects(parseCSV(text));
        renderProjects(objs.length ? objs : FALLBACK_PROJECTS);
      })
      .catch(function () {
        renderProjects(FALLBACK_PROJECTS);
      });
  }

  /* ---------- margins toggle (home page) ---------- */
  function initMargins() {
    var toggle = document.getElementById("marginToggle");
    if (!toggle) return;
    function apply() { document.body.classList.toggle("margins-off", !toggle.checked); }
    toggle.addEventListener("change", apply);
    apply();
  }

  /* ---------- ledger thread filter (home page) ---------- */
  function initThreadFilter() {
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-thread]"));
    var entries = Array.prototype.slice.call(document.querySelectorAll(".entry"));
    if (!chips.length || !entries.length) return;

    function setThread(thread) {
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.dataset.thread === thread));
      });
      entries.forEach(function (e) {
        var has = thread === "all" || (e.dataset.threads || "").split(" ").indexOf(thread) > -1;
        e.classList.toggle("is-dim", !has);
      });
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var next = c.getAttribute("aria-pressed") === "true" ? "all" : c.dataset.thread;
        setThread(next);
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (rows) {
        rows.forEach(function (row) {
          if (row.isIntersecting) {
            row.target.classList.add("seen");
            io.unobserve(row.target);
          }
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
      reveals.forEach(function (r) { io.observe(r); });
    } else {
      reveals.forEach(function (r) { r.classList.add("seen"); });
    }
  }

  /* ---------- contact form (home page) ---------- */
  function initContactForm() {
    var form = document.getElementById("noteForm");
    var status = document.getElementById("formStatus");
    if (!form || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var msg = form.message.value.trim();
      if (!name || !email || !msg) {
        status.textContent = "Fill in all three fields and try again.";
        return;
      }
      var subject = "A note from " + name;
      var body = msg + "\n\n" + name + "\n" + email;
      window.location.href = "mailto:yjulin2407@gmail.com"
        + "?subject=" + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(body);
      status.textContent = "Opening your mail app.";
    });
  }

  /* ---------- case study: sticky section nav ---------- */
  function initCaseStudyNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".cs-nav a"));
    var sections = links.map(function (a) {
      return document.getElementById(a.getAttribute("href").slice(1));
    }).filter(Boolean);
    if (!links.length || !sections.length) return;

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (rows) {
        rows.forEach(function (row) {
          if (row.isIntersecting) {
            var id = row.target.id;
            links.forEach(function (a) {
              a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
            });
          }
        });
      }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- media slots: fall back to a placeholder ----------
     Lets you write the <img> tag before the photo exists. If the
     file is missing the slot shows the expected path instead of a
     broken image icon.
  ------------------------------------------------------------- */
  function initMediaSlots() {
    var slots = document.querySelectorAll(".media");
    slots.forEach(function (slot) {
      var media = slot.querySelector("img, video");
      if (!media) { slot.classList.add("is-empty"); return; }

      var ph = slot.querySelector(".media-placeholder");
      if (ph && !ph.querySelector("code")) {
        var src = media.getAttribute("src") || media.querySelector("source")?.getAttribute("src") || "";
        var code = document.createElement("code");
        code.textContent = src;
        ph.appendChild(code);
      }

      function markEmpty() { slot.classList.add("is-empty"); }

      if (media.tagName === "IMG") {
        if (media.complete && media.naturalWidth === 0) markEmpty();
        media.addEventListener("error", markEmpty);
      } else {
        media.addEventListener("error", markEmpty);
        media.querySelectorAll("source").forEach(function (s) {
          s.addEventListener("error", function () {
            if (media.networkState === 3 || media.readyState === 0) markEmpty();
          });
        });
      }
    });
  }

  /* ---------- case study: before/after compare slider ---------- */
  function initCompareSliders() {
    var sliders = document.querySelectorAll(".cs-compare");
    sliders.forEach(function (el) {
      var range = el.querySelector(".cs-compare-range");
      var after = el.querySelector(".after");
      var handle = el.querySelector(".handle");
      if (!range || !after || !handle) return;

      /* no images yet, or one failed to load → show the written
         description instead of two blank boxes */
      var imgs = Array.prototype.slice.call(el.querySelectorAll(".side img"));
      function markEmpty() { el.classList.add("is-empty"); }
      if (imgs.length < 2) {
        markEmpty();
      } else {
        imgs.forEach(function (img) {
          if (img.complete) {
            if (!img.naturalWidth) markEmpty();
          } else {
            img.addEventListener("error", markEmpty);
          }
        });
      }

      function update() {
        var v = range.value;
        after.style.clipPath = "inset(0 0 0 " + v + "%)";
        handle.style.left = v + "%";
      }
      range.addEventListener("input", update);
      update();
    });
  }

  /* ============================================================
     PAGE-TURN NAVIGATION
     Modern Chromium honors the CSS `@view-transition` rule in
     style.css natively on same-origin navigations. Everywhere
     else, this JS plays an equivalent "turning leaf" overlay
     before following the link.
     ============================================================ */
  var nativeCrossDocTransitions = "startViewTransition" in document;

  function isPlainInternalNav(a) {
    if (!a || !a.getAttribute("href")) return false;
    if (a.target && a.target !== "" && a.target !== "_self") return false;
    if (a.hasAttribute("download")) return false;
    var href = a.getAttribute("href");
    if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return false;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return false; }
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    return true;
  }

  function initPageTurns() {
    if (prefersReducedMotion || nativeCrossDocTransitions) return;

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest("a");
      if (!isPlainInternalNav(a)) return;

      e.preventDefault();
      var dest = a.href;
      var overlay = document.createElement("div");
      overlay.className = "leaf-overlay is-turning";
      document.body.appendChild(overlay);
      window.setTimeout(function () { window.location.href = dest; }, 380);
    });

    window.addEventListener("pageshow", function () {
      document.body.classList.add("leaf-enter");
      window.setTimeout(function () { document.body.classList.remove("leaf-enter"); }, 520);
    });
  }

  /* ---------- boot ---------- */
  initPageTurns();
  document.addEventListener("DOMContentLoaded", function () {
    initMargins();
    initThreadFilter();
    initContactForm();
    initCaseStudyNav();
    initMediaSlots();
    initCompareSliders();
    loadProjects();
    initReveal();
  });
})();
