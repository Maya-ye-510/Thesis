# I SEE — Prototype 2

Maya Ye's interactive website exploring how ways of seeing shape interpretation. The layout, typography, copy, and original SVG controls come from the Figma design, with responsive layouts, motion, and an explorable particle field added for the web.

## Run locally

Open `index.html` in a modern browser. All website assets are local; no API key, account, package installation, or network connection is required.

For a local HTTP preview, run this command in the project directory:

```sh
python3 -m http.server 4190
```

Then visit `http://localhost:4190`.

## Experience

1. Enter from the I SEE screen. The eye follows the pointer within a bounded area.
2. Read the introduction and select **Click To Start**.
3. Choose at least one personal condition. **Normal** is exclusive; Myopia, Color Blind, Astigmatism, Vision Snow, and Hemianopia can be combined. Clicking a colour-vision or visual-field illustration opens its blue-bordered side menu and turns the arrow right. The category is selected only after choosing a subtype. Escape cancels; Clear selection removes an existing choice. Selected names use 12px blue text. Next Page shows a yellow reminder if nothing is selected.
4. Select **Next Page** to enter the blue particle field. The upper-left list shows the chosen conditions and subtypes.
5. Choose **Crop the world in your eyes**, move the portrait frame, resize it from any corner, and confirm **Use this frame**. The selected view moves into the result page beside the original anatomical eye artwork. The result stays interactive: drag to rotate, with zoom locked. A single symptom is centred on the dotted line.
6. Click a symptom to open its explanation: the cropped world moves left and the eye diagram opens into its side profile. The particle conditions stay unchanged. Click the heading again or press Escape to return to the result.

In the field:

- **Drag horizontally** to look all around the particle space through 360° and continue into another turn. Drag vertically to tilt it. Mouse, touch, and pen use the same interaction.
- **Scroll** over the field to change viewing/focus distance. Browser Ctrl+wheel zoom is preserved.
- Moving through the space changes actual viewing distance. With Myopia selected, approaching a distant blurred circle brings that same circle into the clear near range.
- Focus the field and use **Left / Right** to rotate, **Up / Down** or **+ / −** to change distance, and **Home** to reset the view.
- **Structure** reveals connections and emphasizes outlines.
- **Colors** enables evolving palette changes.
- **Motion** pauses particle movement when selected; press it again to resume. All three lower controls start unselected on entering the field. Base drift is moderately faster; manual rotation and camera travel continue to work while paused.
- **Back** is the only in-field control that returns to the condition selector. The lower-left eye/music control is a reserved placeholder and does not navigate.
- Clicking the grey surround keeps the current page open. Navigation uses the explicit buttons.
- Returning to the home screen clears all personal conditions and restores default display controls, focus distance, rotation, tilt, and animation time for a fresh round.

The crop frame also supports arrow keys to move, Shift+arrow keys to resize, Alt for one-pixel steps, Enter to confirm, and Escape to cancel. On the result canvas, arrow keys rotate/tilt and Home restores the captured pose; wheel and +/− cannot change its zoom.

On the result page, the anatomical optical layers gently track the pointer; the outline remains fixed. Result buttons have a softly blurred centre that contracts on hover.

The site respects the system's reduced-motion setting, pauses rendering in hidden tabs, and reduces the particle count on narrow screens.

## Design and optical effects

Each screen fits the available viewport height, including the introduction's full text and start button. The eye composition is fitted against both available width and height; its diagonal lines extend to the screen edges. The six-condition selector preserves its two-row, three-column arrangement on mobile. Typography and spacing adapt to shorter screens without requiring page scrolling.

Motion preserves the original Figma vectors and the supplied video reference:

- **Home → introduction:** 700 ms, ease-in-out. The logo moves, the small circle grows into the large eye using shared geometry without an iris dissolve, and the background rings and diagonal cross appear with a rotating reveal.
- **Introduction → conditions:** 700 ms, ease-in-out. The two cross lines independently translate, rotate, and resize; the dotted circle shrinks and moves into its new position.
- **Result → explanation:** 700 ms, ease-in-out. The live portrait slides left, the selected symptom moves to the heading, and the anatomical illustration scales and shifts to show the full profile and light paths.
- **Field → result:** 700 ms, ease-in-out. The captured portrait frame moves left and expands to its result size as the original eye artwork enters from the right. The live 3D renderer inherits the exact camera, time, projection, conditions, and particle count of the selected region.
- **Hover / keyboard focus:** 700 ms for page 3 conditions; 450 ms for other controls, all ease-in-out. Matched SVG parts move and resize between the original variants. Texture differences crossfade during the same motion.
- **Click / selection / other page changes:** 300 ms, ease-in.
- **I SEE logo → home:** 500 ms dissolve, with no shared-element movement.

Browsers without the View Transition API use a page fade and the introduction's background reveal. System reduced-motion preferences disable transitions and vector interpolation. No animation library is required.

The field uses Canvas 2D with cached shape sprites and a repeating three-dimensional world. The viewer stays inside it at every distance and angle; there is no external cloud silhouette. World seams sit beyond the distance fog. The expanded bright palette includes red, green, cyan, orange, violet, pink, yellow, blue, and cream; dark grey/navy particles have been removed. More than 94% of elements are circular: filled discs, rings, double rings, dashed rings, halos, arcs, and rings with central dots. A small minority are triangles or lines. Perspective, back-to-front drawing, size variation, and distance-dependent opacity establish depth. It has no third-party JavaScript runtime dependencies.

These effects are artistic studies, not diagnostic or prescription-accurate simulations:

- **Myopia** keeps nearby objects clear and progressively blurs more distant ones. Camera movement changes each object's actual viewing distance, so walking closer can reveal it clearly. This replaces the previous focus-plane blur.
- **Color Blind** offers deuteranopia, protanopia, tritanopia, and a partial deuteranomaly approximation, using Machado matrices in linear RGB.
- **Astigmatism** adds radial light streaks and a stronger offset image to circular forms. The option preview uses the same radiant motif.
- **Hemianopia** masks the selected left, right, or both peripheral areas in black. A feathered luminous boundary and small glowing rings soften the edge. The Side setting is an artistic central-view study, not a distinct diagnostic subtype. Black denotes information withheld in this artwork, rather than claiming literal black vision in clinical hemianopia.
- **Vision Snow** adds drifting grey dust in front of the view, subtle grain, and a buffered scene delay with a faint older afterimage. The target delay is about 130 ms, quantized by the capture/render cadence. Reduced-motion mode keeps a static dust layer and skips the temporal effect. This is an artistic interpretation, not a clinical assessment or every person's experience.

Condition selections stay in memory for the current page session. They are not saved, uploaded, or tracked. There is no camera access, backend, analytics, or authentication.

## Project structure

- `index.html` — page structure and original content.
- `style.css` — responsive layouts, fonts, and control/page motion.
- `app.js` — navigation, condition menus, crop interaction, result comparisons, original control states, and eye tracking.
- `flow-state.js` — subtype selection, crop constraints, and preservation of the selected projection.
- `flow.css` — updated Figma layouts and motion for pages 3–5.
- `refinements.css` — symptom previews, side menus, pupil growth transition, result controls, and explanation layout/motion.
- `condition-notes.js` — concise condition explanations and interpretation prompts for page 6.
- `condition-artwork.js` — original new condition SVGs with stable motion keys.
- `control-artwork.js` — original SVG variants with stable vector keys for geometry interpolation.
- `particle-field.js` — interactive canvas field and its rendering lifecycle.
- `field-math.js` — condition selection, projection, focus, and colour math.
- `assets/` — original exported SVGs, fonts, and font licences.
- `tests/` — condition exclusivity and reset, subtype selection, crop bounds and aspect ratio, exact crop projection, locked result zoom, perspective, optical effects, and delayed rendering.

## Checks

With Node.js installed:

```sh
npm test
npm run check
```

The app itself does not require Node.js. No dependencies need to be installed to run the checks.

## Sources and asset rights

- [Original Figma design](https://www.figma.com/design/dKoCb6c2rwf886Er4wnlJ4/Prototype-2?node-id=0-1).
- Hubot Sans and Manrope are included with their SIL Open Font License notices in `assets/licenses/`.
- Original SVG artwork is exported from the author's Figma file; the reference video and inspiration screenshot are not distributed in this repository.
- [Colour Science — Machado colour-vision matrices](https://github.com/colour-science/colour/blob/develop/colour/blindness/datasets/machado2010.py).
- [Machado, Oliveira & Fernandes, 2009 — A physiologically-based model for simulation of color vision deficiency](https://pubmed.ncbi.nlm.nih.gov/19834201/).
- [National Eye Institute — Myopia](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/nearsightedness-myopia).
- [National Eye Institute — Types of Refractive Errors](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/refractive-errors/types-refractive-errors).
- [NIH GARD — Visual Snow Syndrome](https://rarediseases.info.nih.gov/diseases/12062/visual-snow-syndrome).
- [NHS Christie — Hemianopia](https://www.christie.nhs.uk/media/zr5hxwla/1084-hemianopia-ot-april-2022.pdf).
- [National Eye Institute — Types of Color Vision Deficiency](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/color-blindness/types-color-vision-deficiency).

## Repository hygiene

`.gitignore` excludes credentials, `.env` files, private keys, deployment-local configuration, dependency caches, reference videos, archives, editor files, and generated QA artifacts. There are no API keys or deployment credentials required by this project. No automatic deployment workflow is included.
