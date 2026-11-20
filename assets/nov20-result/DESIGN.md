# Latest Result — final summary

Source: Prototype 2, Figma file dKoCb6c2rwf886Er4wnlJ4, MacBook Air45 frame581:802 (1421×832). Design context and screenshot read directly from Figma. This revision supersedes the Perception Map report; the map controller, graphic model, UI controls and map-specific tests have been removed. Information-page corrections from the preceding revision remain intact.

## Layout and type

- Data Analysis title67/103; Report component67/164,710×187 collapsed. Condition(s), Structure and Focus retain the existing design and300ms Ease Out disclosure transitions. The second label remains Structure as explicitly requested in the previous revision, despite the older Color Tone label in the Figma instance.
- Report heading65/416 (implemented at the shared67px column edge),24px Manrope Medium. Summary copy67/499,739px wide and up to263px high,16px Medium at the1421px design width. Desktop type and geometry scale together; mobile body stays16px. There is no gray map/panel background. Opening a disclosure pushes the Report down; the left column can scroll so expanded content never overlaps the summary. A particularly long summary can scroll within its own text area when the disclosures are closed.
- The personal paragraph is deterministically generated from selected conditions, viewing distance, tone and display settings,100–180 words. All32 valid condition selections (Normal, or a nonempty subset of the five conditions) are checked across three distances, three tones and two display contexts. The final thesis paragraph is constant across all reports, with one grammar correction to “understands and experiences.” Figma placeholder brackets and editorial instructions are not rendered.
- Gray ticket864/110,487×652; live crop882/126,450×450; original clipped eye layers and yellow question retained. Metadata starts905/589; two columns hold Visual Condition / View Distance / Color Tone / Study Type. The names, distance and tone come from the same captured state as the visible crop. No inferred psychological score is produced.

## Original assets and saving

Original SVGs3e344,86ecf,e796d,b64e3 were downloaded through Figma's design-context asset URLs. Native root dimensions remain intact. `result-eye.svg` composes those originals at their design positions: white eye lines−34.29/−17.13 (including export stroke extents); outer circle159/167; pink glow163/170; yellow glow191/198. The last three layers share one restrained gaze group. The earlier exact full-screen cross and original control artwork are reused.

The live report preserves the captured focus and tone and continues its particles and independent Visual Snow. Native right-click saving is supported through a ready PNG image hit target over the ticket, without covering the live visual. The small blue save instruction also works as a keyboard-accessible download button. The generated974×1304 PNG includes the actual crop, original eye, question and all four metadata fields, rather than the eye alone. The native browser context-menu action itself is not automated; PNG readiness, hit-target source and the download action are verified.

## Verification

52 Node tests pass. Chrome/Playwright used because no Browser plugin is available. Desktop1421×832, smaller laptop1280×800 and phone390×844 checked: no map,710px component width,187px collapsed height, intermediate/final disclosure heights, text and ticket slots, nonoverlapping expansions, fixed closing text, summary word count, full PNG export, continuing fixed-focus visual effects, mobile and reverse resize, reduced motion and Back to Information at scrollTop0. Two-condition and all-five-condition reports exercised. Screenshots and saved PNGs are outside the repository in work/nov20-summary-qa.
