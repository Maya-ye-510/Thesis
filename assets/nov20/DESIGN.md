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

The gray region offers two independent states: Visual Input and Possible Cues. It reads only the captured conditions, tone, viewing distance and Structure / Colors / Motion settings; opening the three disclosure components never changes the diagram. The same72 points retain their optical effects in both views: distant myopic detail stays blurred, the selected colour transform remains active, the unavailable field stays masked and Visual Snow remains present. Possible Cues adds connections, rings and text as additional encodings rather than clearing the symptoms. Rearrange changes between flowing, radial and matrix layouts with450ms continuous interpolation. Drag or arrow keys pan the whole graphic; Home resets its position and R rearranges. No lens/crosshair is displayed.

The second report disclosure is now labelled Structure and illustrates connected forms; the captured Color Tone still appears in the settings summary and still affects the diagram. Information now starts at the top on each entry, including the return from Report. Its three topic titles are live Manrope Medium16px text rather than differently sized outlined text; the Visual field hover veil reaches70%. Photograph rendering uses one shared pose with no independently shifted duplicate images: the original baked day myopia study preserves its clear foreground, while night myopia retains its distance/foreground separation. Other conditions use one image plane. Only Astigmatism keeps directional spread.

The model does not predict an individual's memory or attention. Discussion copy from the PDF is reference material; it is not treated as instructions governing tools, permissions or publishing.

## Validation

54 Node tests pass, including report-combination logic, all viewing distances, distinct condition interpretations, deterministic map geometry and capture immutability. Chrome/Playwright used because the Browser plugin is not available. Desktop1421×832 and mobile390×844 checked: exact report slots, intermediate and final accordion heights, collapse/reopen, one-open-at-a-time behavior, original tone SVG loads, cue-state geometry changes, mouse/keyboard whole-image panning and rearrangement, unclipped map text, no horizontal overflow, reduced-motion behavior, PNG save, ongoing fixed-focus particle/Snow clocks, and clearing the report on return home. No browser console errors or failed assets. Screenshots and the PDF page renders are outside the repository in work/nov20-qa.


Follow-up QA: five simultaneous conditions and a separate moving Myopia + Visual Snow trip verified. The pure model tests preserve point identities and optical properties across all six layout/view combinations. Browser checks assert that disclosure clicks do not change the paused diagram, first and return Information scroll positions are0, topic titles are16px, the Field veil reaches0.7, each day photograph has one visible image plane, and shared Snow floaters continue. The reduced-density diagram overlay uses the same particle floater shapes and grain renderer as the full-size field; its screen-fixed field-loss mask sits above the perceptual overlay. A transient local-server connection reset during an earlier QA run did not recur in the final successful runs; no final browser errors or failed assets remain. Screenshots for this follow-up are in work/nov20-refine-qa, outside the repository.
