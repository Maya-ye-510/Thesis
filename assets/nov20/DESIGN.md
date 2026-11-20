# November 20 — Report accordion and Perception Map

## Design evidence

Figma file `dKoCb6c2rwf886Er4wnlJ4`, frame446:211 and Report instance572:692. High-fidelity design contexts and screenshots were read for the frame and each component variant. Report geometry at1421×832:

- Accordion46/164, width535. Collapsed height141; Condition(s) expanded250, Color Tone234, Focus264.
- Selected-settings box628/163,190×213; gray diagram46/455,772×287.
- Original result card882/126,450×450. Save explanation891/584,432px wide,14px Medium /18px line height.
- Component headers16px Medium. Condition/focus copy14px Regular; insights14px SemiBold, using the existing locally hosted Manrope font.
- `get_motion_context` returned no canvas keyframes. The component's native prototype reactions were read directly, read-only, through the Figma Plugin API: default568:423 changes to568:462 /572:606 /574:795; each expanded variant returns to568:423. All use Smart Animate, Ease Out,300ms. Icon-hover reactions use500ms Ease Out. CSS preserves the same elements while their heights, positions and opacity interpolate, including reversal during an interrupted transition.
- Tone assets947ae /81ca8 /adf31 are the original67×67px SVGs, including their blur extents. Outline3e31d is49×49. They retain native root sizes, design positions and wrapper scale. Existing exact default/hover control assets, report eye and cross are reused.

## Interaction and content

The supplied `gpt_conversation.pdf` was read and relevant pages4–5 rendered and visually reviewed. Its proposed Perception Map informs the gray-region implementation; suggestions to rename the whole page, change the ticket layout or produce psychological/clinical scores were not adopted. The existing Report design remains the frame.

`report-study.js` contains a pure report-content model and a small DOM controller. Text is based on captured rendering settings. Myopia plus Visual Snow has a dedicated combined explanation; other combinations describe overlapping rendering dimensions. Focus means viewing distance, not inferred attention. No memory, understanding or ability score is computed.

The gray region offers two states: Visual Input and Possible Cues. Selected conditions affect distance blur, available field, colour relationships and persistent noise in a qualitative diagram. The captured tone affects point colours. The second state rearranges the same points into Shape / Position / Contrast relationships with connections and a second encoding through position/rings. It is a graphic interpretation, not a replay or quantitative analysis of the captured photograph. Hover/focus/click a point to inspect its cue; drag the cyan/pink lens, or use its arrow-key control. Changing modes and opening a report category updates the note and reflective question. Original captured settings are never mutated.

The model does not predict an individual's memory or attention. Discussion copy from the PDF is reference material; it is not treated as instructions governing tools, permissions or publishing.

## Validation

52 Node tests pass, including report-combination logic, all viewing distances, distinct condition interpretations, deterministic map geometry and capture immutability. Chrome/Playwright used because the Browser plugin is not available. Desktop1421×832 and mobile390×844 checked: exact report slots, intermediate and final accordion heights, collapse/reopen, one-open-at-a-time behavior, original tone SVG loads, cue-state geometry changes, mouse/keyboard lens movement, unclipped map text, no horizontal overflow, reduced-motion behavior, PNG save, ongoing fixed-focus particle/Snow clocks, and clearing the report on return home. No browser console errors or failed assets. Screenshots and the PDF page renders are outside the repository in work/nov20-qa.
