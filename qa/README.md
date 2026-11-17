# Browser verification

Checked locally in headless Microsoft Edge on 17 November 2026.

- All eight counters activate in their specified order.
- Reverse scrolling returns to stages 4 and 1 after stage 8.
- No uncaught browser page errors after the loading-overlay fix.
- No horizontal document overflow at 390, 768, and 1440 pixels.
- Design-preview dialog opens and closes with Escape.
- Photo input updates the case preview with a browser-local blob URL.
- Save downloads `my-case-design.jpg`.
- Disabling WebGL renders the photographic fallback.

`stage-1.png` through `stage-8.png` record the manufacturing sequence. The other screenshots record desktop, mobile, dialog, and reference inspections. Earlier `preview-*` screenshots may show the development error indicator from before the loading fix; stage captures and the final browser run followed that fix.

These checks verify functionality and layout, not manufacturer model accuracy or performance on physical mobile devices.
