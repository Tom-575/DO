# DO Design Grill

> Last updated: 2026-09-12

This document records confirmed design choices before implementation. It is not a replacement for `intent.md`, `CONTEXT.md`, or `PRD.md`.

## Working method

- Ask no more than three questions per round.
- Mark one recommended answer and explain the tradeoff.
- Stop asking once a product surface is sufficiently defined.
- Implement that surface, inspect screenshots, then ask only about visible problems.
- Do not silently translate “ugly” into colors or spacing. Break it into structure, hierarchy, interaction, typography, color, and platform fit.

## Confirmed direction

- Platform feel: native iOS app rather than a responsive marketing page.
- Primary feeling: calm and private like Apple Journal, but action-first.
- Home focus: one clear DO action.
- Home support: show the previous DO, not a task or pending-item list.
- Previous DO content: show only the original thought.
- DO control: a wide, rounded iOS primary button labelled `DO`.
- Navigation: `Today` and `Memories`. Exploration is postponed and absent from the current prototype.
- Theme: follow the iOS light and dark appearance.
- Previous DO presentation: an inset grouped-list row.
- Memories: a chronological vertical record stream.
- Input: tapping DO pushes a focused full-screen input page.
- Understanding: generate one minimum action directly; ask one question only when interpretations materially differ.
- Minimum action: one action, expected time, and a clear stopping condition.

## Screenshot feedback

### 2026-09-12

- The Today layout still needs refinement, but the current product hierarchy is retained.
- “Previous DO” means the most recent DO, not a pending-task state.
- Show one DO by default and allow the section to expand to reveal more DOs.
- Memories should demonstrate both valid record forms: one text-only record and one image-plus-text record.
- Replace the textual “更多/收起” control with a compact iOS-style disclosure button while keeping an accessible label.
- Today copy should be direct and operational: “现在想做什么？” and “先写下来。DO 会把它变成可以开始的一步。”
- Today spacing should use a deliberate 44px separation between the primary DO block and “上一条 DO”, instead of pushing the previous section to the bottom.
- Memories bug: the Tab Bar was absolutely positioned inside the page scroll container, causing it to float between an image and its text. The page now separates scrollable content from a fixed bottom Tab Bar sibling.
- 2026-09-12: Add restrained interaction motion for route changes, disclosure, sheet entry, and press feedback. Respect reduced motion.
- 2026-09-12: Add manual appearance choices: 白天, 黑夜, 跟随系统. Keep system preference as the default.
- 2026-09-12: Add background choices through a compact appearance sheet: 纯净, 薄雾, 夜色, and local photo import. Prototype state remains in memory only.
- 2026-09-12: Treat light and dark as two authored visual systems, not a mechanical inversion. Dark mode now has its own surface, text, separator, accent, and background-overlay tokens.
- 2026-09-12: Set the prototype's initial preview background to the local mountain landscape image so the material treatment can be judged in context.
- 2026-09-12: Background preview was initially hidden by opaque page surfaces. Make page layers translucent with blur and add text/shadow contrast protection so the landscape is visibly part of the composition.
- 2026-09-12: Visual audit found a dark-mode inheritance bug: headings stayed dark because `color` was computed on `body`; move the text token to the prototype container. Reduce stacked overlays so the landscape remains visible, and keep dark-mode CTA text white for contrast.

## Product boundaries preserved

- No completion score, streak, or success pressure.
- “Recorded” describes the record lifecycle, not whether the action was completed.
- Memories can be created without linking a DO.
- No social feed, likes, comments, or following in the current prototype.
