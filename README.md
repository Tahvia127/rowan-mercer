# Rowan Mercer — Wedding Photography

A photography portfolio built to prove one thing: a big gallery does not have to be slow.

**Status:** unpublished demo. Not on GitHub Pages, not linked from the studio site.
**Built by:** Framework Studio.

---

## What this one proves

Photographers lose bookings to slow sites. The person browsing at 11pm on a phone does not wait, and a gallery of full-resolution JPEGs is the most common way a beautiful portfolio becomes unusable.

Measured on this build, not claimed:

| | |
|---|---|
| Original photographs | **11.7 MB** |
| Entire grid, if every frame loads | **1,376 KB** |
| Average per photograph in the grid | **60 KB** |
| Fetched on a real page load | **607 KB across 24 files** |

The page also reports its own number. A line under the figures runs `performance.getEntriesByType('resource')` after load and prints what your browser actually fetched, so a prospective client can check the claim on their own connection rather than take it on faith.

## How

`tools/images.mjs` takes a folder of camera exports and produces, for each photograph:

- **Three WebP renditions** at 480, 900 and 1600 px.
- **A 20-pixel placeholder**, base64-encoded and written straight into the HTML, so it costs no request and there is something to look at immediately.
- **Real pixel dimensions**, written onto every `<img>` so the browser reserves the right space and the page never shifts as photographs arrive.

The grid then serves `srcset` with `sizes`, so a phone downloads the 480 file and a laptop the 900. The 1600 version is only fetched when a frame is opened in the lightbox. Everything below the fold waits for `loading="lazy"`.

```bash
node tools/images.mjs ~/photos/wedding-exports   # regenerate renditions + manifest
node build.mjs                                    # rebuild the page
```

## The lightbox

Click any frame, or tab to it and press Enter. Arrow keys move, Escape closes, focus returns to the frame you opened. It preloads the next photograph so moving through the set feels instant, and it respects the active collection filter, so "3 of 6" means three of the six you are actually looking at.

## Repository layout

```
tools/images.mjs   The pipeline. Run when the photographs change.
data/images.json   Generated manifest: dimensions, renditions, placeholders.
data/gallery.json  Collection and caption per photograph. Order here is order on the page.
data/site.json     Name, packages, contact, demo notice.
build.mjs          Renders the template. No dependencies.
index.html         Generated. Do not edit by hand.
```

## Design notes

- **Type:** Marcellus for display, Inter for body.
- **Color:** paper `#F7F5F1`, ink `#1A1A18`, clay `#9B5C46`. Every text pairing clears WCAG AA; the lowest is 4.81:1.
- **Motion** is limited to the fade from placeholder to photograph, and it is disabled under `prefers-reduced-motion`, which also shows every photograph immediately.

## Before this goes to a real client

1. Point `tools/images.mjs` at the photographer's own exports and re-run. Nothing else changes.
2. Set `demo.show` to `false` in `data/site.json`.
3. At a few hundred photographs, add pagination or an infinite scroll to the grid. The pipeline scales; a single page with 300 frames does not, however small each one is.

## A note on the photographs

Rowan Mercer is fictional and the photographs are from [Unsplash](https://unsplash.com), used under the Unsplash License. They stand in for a real photographer's work, which is the one thing a portfolio like this cannot borrow.
