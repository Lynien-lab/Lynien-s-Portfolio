# How to edit this site

Three kinds of edits, from easiest to most involved.

---

## 1. Project list on the home page → Google Sheet

The grid of project cards on the home page is driven by a spreadsheet, not by code.

**Sheet:** [Portfolio CMS — Projects](https://docs.google.com/spreadsheets/d/18tlDd3XJ-0KD57aCCAwdPt3Tg1R461ySZ4WACaGsKrU/edit)

**One-time setup (required before it works live):**
Open the sheet → Share → General access → change "Restricted" to **Anyone with the link**, role **Viewer**.
Until you do this the site quietly falls back to a built-in copy of the list, so nothing breaks — but your edits won't show up.

**Columns:**

| Column | What it does |
|---|---|
| `order` | Sort order in the grid. Lower numbers first. |
| `title` | Card heading. |
| `slug` | Short id. Also the name of the asset folder. |
| `category` | Must match a filter chip: `UX Design` or `Craft`. |
| `tools` | Shown in small type at the bottom of the card. |
| `role` | Shown next to tools. |
| `summary` | The paragraph on the card. |
| `featured` | Not currently used for display — a flag for later. |
| `page_url` | The case study file, e.g. `case-study-medical-app.html`. Leave blank and the card becomes non-clickable ("coming soon"). |

To add a project: add a row. To hide one: delete the row. To reorder: change `order`.

---

## 2. Photos and videos → drop files in `assets/`

Each project has its own folder:

```
assets/
  medical-app/
  chatbot-dialogue/
  memory-spice/
  fin-tastic-rescue/
  spirit-magazine/
```

The case study pages already contain **media slots**. A slot is written before the file exists — if the file is missing you see a dashed placeholder box naming the file it's looking for, instead of a broken image. Drop a file with that exact name into the folder and it appears on next reload.

### Currently waiting for files

Every path below already has a slot on the page. Save a file at the exact path and it
appears on next reload — no HTML editing needed.

| Put this file here | Shows up on |
|---|---|
| `assets/medical-app/hero.jpg` | Medical app — big image under the cover |
| `assets/medical-app/dashboard.jpg` | Medical app — "Key design features", left |
| `assets/medical-app/reminders.jpg` | Medical app — "Key design features", right |
| `assets/chatbot-dialogue/workshop.jpg` | Chatbot — "Design & research process", left |
| `assets/chatbot-dialogue/platform.jpg` | Chatbot — "Design & research process", right |
| `assets/chatbot-dialogue/dialogue-example.jpg` | Chatbot — "Result", above the design principle |
| `assets/memory-spice/autobite.jpg` | Memory Spice — "Artefact 1: AutoBite" |
| `assets/memory-spice/device.jpg` | Memory Spice — "Artefact 2", left |
| `assets/memory-spice/app.jpg` | Memory Spice — "Artefact 2", right |
| `assets/memory-spice/concept-video.mp4` | Memory Spice — concept video |
| `assets/memory-spice/video-poster.jpg` | Memory Spice — video thumbnail before play |
| `assets/fin-tastic-rescue/concept-video.mp4` | FIN-tastic — the concept video |
| `assets/fin-tastic-rescue/video-poster.jpg` | FIN-tastic — video thumbnail before play |

You don't have to fill all of them. Any slot without a file just stays a neat
placeholder, so you can add visuals a few at a time.

### Adding a new image somewhere

Paste this into any case study page where you want it, and change the two paths/labels:

```html
<div class="media">
  <figure>
    <img src="assets/PROJECT/FILENAME.jpg" alt="Describe the image for screen readers">
    <div class="media-placeholder">Short label</div>
    <figcaption>Optional caption under the image.</figcaption>
  </figure>
</div>
```

### Two or three images side by side

```html
<div class="media-row cols-2">   <!-- or cols-3 -->
  <div class="media">
    <figure>
      <img src="assets/PROJECT/one.jpg" alt="...">
      <div class="media-placeholder">One</div>
    </figure>
  </div>
  <div class="media">
    <figure>
      <img src="assets/PROJECT/two.jpg" alt="...">
      <div class="media-placeholder">Two</div>
    </figure>
  </div>
</div>
```

### A video

```html
<div class="media">
  <figure>
    <video controls preload="metadata" poster="assets/PROJECT/poster.jpg">
      <source src="assets/PROJECT/video.mp4" type="video/mp4">
    </video>
    <div class="media-placeholder">Label</div>
    <figcaption>Optional caption.</figcaption>
  </figure>
</div>
```

**File tips:** use `.jpg` for photos, `.png` for screenshots with text, `.mp4` for video. Resize images to about 1600px wide before adding them — full-size phone/camera exports are many megabytes and will make the page slow. For long videos, consider uploading to YouTube/Vimeo and embedding instead of committing a large file.

---

## 3. Case study text → edit the HTML directly

Each case study is one file:

- `case-study-medical-app.html`
- `case-study-chatbot.html`
- `case-study-memory-spice.html`
- `case-study-fin-tastic-rescue.html`

The text sits between tags. Change what's *between* the tags, leave the tags alone:

```html
<p>This sentence you can freely rewrite.</p>
```

Useful blocks already in the pages:

- `<section class="cs-section" id="...">` — one numbered section. The `id` must match its entry in the `<nav class="cs-nav">` list at the top of the file, otherwise the sidebar link breaks.
- `<blockquote class="cs-quote">` — a participant quote, with `<cite>` for attribution.
- `<div class="cs-diagram">` — the numbered process steps.
- `<div class="cs-table">` — two-column table. Cells alternate: every `<div class="c">` is one cell, filling left-to-right.
- `<ul class="cs-findings">` — the arrow-bulleted list.

To add a whole new case study: duplicate an existing file, rename it, replace the content, then add a row to the Google Sheet with `page_url` set to your new filename.

---

## Previewing your changes

Open a terminal in this folder and run:

```bash
python3 -m http.server 8811
```

Then visit `http://localhost:8811` in a browser. Edit a file, save, reload the page.

(Opening the `.html` file directly by double-clicking mostly works too, but the Google Sheet fetch will be blocked by the browser, so you'll see the fallback project list.)

---

## Files you generally shouldn't need to touch

- `style.css` — all the visual design
- `journal.js` — filters, page-turn transitions, sheet loading, media placeholders
