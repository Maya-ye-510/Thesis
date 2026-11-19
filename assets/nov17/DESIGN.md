# November 17 design update

Source: Maya Ye’s Prototype 2, dKoCb6c2rwf886Er4wnlJ4. Unchanged home and introduction were not reworked.

- Information frame 440:891: 1421×1854. Read through Figma design context and checked against the logged-in canvas after MCP quota was reached. Frame 500:422 is the shifted comparison state; the connected main information layout stays 440:891.
- Body copy and condition names: Manrope Regular, 16px and 24px respectively. Impact badges and original vector component titles: Manrope Medium 16px. Report action: SemiBold 18px; Back: Medium 18px. Body line height: Auto.
- Photographic row: copy x297, width523; image x852, width487, height423; 32px gap. Square corners; gray introduction and white Impact area. Longer prose scrolls inside the fixed copy areas. Keyboard focus permits reading all text.
- Original Color and Field exports: default 416:723 / 416:793, hover 416:725 / 416:795. These four SVGs were downloaded through Figma’s own Export action. Original files are retained unchanged. The runtime map omits only outlined placeholder body prose, replaced with accessible selected-view text.
- Color and Field interactions were inspected in the Prototype panel: While hovering → Change to Variant2 → Smart animate → Ease out → 300ms. Hover body: Manrope Regular 16px, Auto. Color body position21/52, 276×143; Field23/48, 276×143.
- Figma’s yellow/cyan/pink component palette remains independent of photographic white balance. Source SVG dimensions are preserved.
- Analyze/counter background circles now have native diameters336/261/294, at561/531,767/375,587/20. Existing original vectors are scaled in wrappers by1.15; their root dimensions stay unchanged. Small, independent CSS drift and breathing bring them together gently. Analyze button moves to634/458. Reduced motion disables ornamental movement.
- Information navigation sits at the end of the scrolling page: Back returns to Analyze; Create Report retains the established loading sequence and original captured report image.

## Photographic scenes

All six scenes are existing credited real photographs; no AI imagery is added. See `assets/nov10/PHOTOGRAPHY.md` and `photography.js` for authors, original sources and reuse licences. Each condition uses a different original. Color uses colour-05 (a flower in its surrounding foliage); the other five source choices are unchanged.

`scene-study.js` adds a restrained 2.5D view with a full background, a soft middle plane and a foreground mask. Masks follow foreground features; they do not generate unseen scenery. Myopia uses the existing traced near-rock mask with clear source pixels over the distance-defocused study. Astigmatism keeps the existing highlight trails, color uses the selected subtype, Hemianopia keeps its selected soft field mask, and Visual Snow retains independent noise/floaters over the moving photograph. Drag or arrow keys change the view within ±3° yaw and ±2° pitch; Home resets it. Touch keeps vertical page scrolling. All geometry stays inside the original image slot. This is a photographic depth study, not a full reconstructed 3D environment.

## Fonts

`assets/Manrope.ttf` is the self-hosted variable font, weight axis200–800. `style.css` declares that range. A local preload warms the font before the information page; Regular400 and Medium500 require no installed system font or external font service. Manrope and Hubot font files and SIL OFL notices were already tracked in GitHub and remain included.

## November 17 video follow-up

Reference recording: `Screen Recording 2026-11-17 at 04.23.08.mov` (19.9s). Keyframes reviewed outside the repository. The blue crop opens the comparison layout shown in frame500:422: crop moves fromx−320 tox46, while the information content and eye spine shift366px right; clicking again reverses it without changing scroll position or the captured scene. The source rectangle440:916 was checked in the Prototype panel: On click → MacBook Air44 → Smart Animate → Ease out →500ms. The Structure component414:667 was also checked: While hovering → Variant2 → Smart Animate → Ease out →300ms, matching Color and Field.

`topic-motion.js` keeps one visible original SVG per component. Circle positions, radii, fills and blur filter bounds interpolate continuously; Field line coordinates, colours and stroke widths morph together. Structure’s solid line changes endpoints; its segmented dotted path transforms between the original bounds. The white hover veil fades in over the same interval, while title vectors remain original and live body text stays Regular16px. Interrupted hovers reverse from the current interpolated state. The original gray rectangle stroke is removed from the live Structure artwork; original asset files stay untouched.

Introduction and Impact use identically inset scrolling text areas. Their scrollbar right edges align32px inside each desktop copy panel (20px at tablet width,22px on mobile). The introduction thumb and information page’s main scrollbar use#FFE96D; Impact retains gray. Keyboard scrolling and reduced-motion behavior remain supported.
