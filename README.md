# The Receipt of Us — CHERMO

A mint-green heart-token machine, two different memory receipts, a separate 35mm film roll, and a personal final statement. This is an independent static product in the existing catalogue, with no new runtime dependencies.

## Run and build

Use Node 22 or newer. `npm run dev` serves the source at http://127.0.0.1:4189. `npm run build` validates JavaScript and copies the four public files to `dist`. `npm run preview` serves that production folder. No installation is required for the product or build. Vercel config explicitly selects a static build with `dist` output.

`npm test` reuses the existing sibling Autumn album's happy-dom installation. On another checkout, set `RECEIPT_TEST_DOM` to an installed happy-dom/lib/index.js; this is a test-only dependency.

## Editing and gifting

Choose **Make it yours** to edit names, occasion, opening, both receipts, final statement, letter and closing line. Receipt entries use one `memory | value` per line. Add 3–10 JPEG, PNG or WebP photographs (15 MB input limit each); images are compressed locally to a maximum 1400-pixel edge. Each has editable caption, date and accessible description, with replace, reorder and remove controls.

Drafts use this browser's localStorage under `chermo.receipt-of-us.draft.v1`. Storage can fill up or be unavailable; the editor reports this and keeps the session draft. Photos are not uploaded to any server. No authentication, API, storage service or database is invented or changed.

**Download gift** creates a standalone HTML file containing the actual photographs, styles, app and personalised data. It requires both names, 3–10 real photographs and confirmation that the creator reviewed all sample copy. Demo placeholders cannot be exported as customer memories. Keep the file private if the memories are private. Send the file to the recipient, who can open it in a modern browser. Web fonts are optional online resources and have system fallbacks. A file manager may preview HTML without running it; open it in the browser instead. No hosted sharing URL is generated.

## Data and source

- `js/config.js`: serializable content model / clearly marked demonstration defaults.
- `js/app.js`: state sequence, SVG machine hearts, receipts, film, dialogs, editor, local image processing and standalone export. Text is escaped; image data is limited to supported image data URLs.
- `css/styles.css`: machine materials, editorial layout, distinct receipt types, film strip, reduced-motion and responsive rules.
- `index.html`: document, creator editor and accessible photo modal.

Future integration can supply `window.RECEIPT_CONFIG` before config.js, with compressed photo data URLs. `window.RECEIPT_GIFT=true` enables recipient mode. Do not put private service credentials in either object. Existing technical namespaces in other products are unchanged.

## Interaction

Tap any token or the primary button, then insert it. Both tap actions are keyboard buttons. Skip controls bypass activation and printing; reduced-motion preferences remove those waits. Unlock each next keepsake, then use the keepsake navigation to revisit it independently. Film supports touch scroll, arrow buttons and arrow keys; a modal keeps the underlying scroll position. Escape closes native dialogs. The ending works without photos in labelled preview mode and without animations. Replay resets the sequence but retains personalisation.

Detailed build and browser QA results are recorded in the root `RECEIPT-OF-US-CHECKPOINT.md`.
