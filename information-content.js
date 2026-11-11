/* Independent short text blocks and eight distinct photographic studies per condition. */
(function(root){
 const card=(image,label,text,focus=0,effect='',spread=1)=>({image,label,text,focus,effect,spread});
 const studies={
  myopia:{stats:[['2.6B','People with myopia worldwide','2020 projection · Holden et al., 2016'],['1 IN 2','Could be myopic by 2050','49.8% projected in the same model']],
   intro:'Myopia changes clarity with distance. A nearby leaf can stay sharply defined while the trees beyond it lose their edges.',
   facts:[
    'Light focuses in front of the retina, rather than directly on it. The eye may be too long, or bend light too strongly.',
    'A soft horizon does not make the whole world soft. The closest surfaces can still hold fine texture.',
    'Glasses and contact lenses change how light is focused, helping distant details become clearer.',
    'At dusk, a distant point of light can become a patch of brightness. Its location remains; its boundary changes.',
    '20/100 describes visual acuity. It is not a fixed glasses prescription or a single amount of image blur.',
    'Myopia often begins in childhood. The amount of distance defocus can change as the eye grows.',
    'Which would you remember more precisely: the shape of the mountain, or the small leaf directly in front of you?'
   ],cards:[
    card('myopia-01','Leaves within reach','The bilberry leaves and moss stay crisp. The woodland behind them falls out of focus, rather than the whole photograph becoming blurred.',.28),
    card('myopia-02','Across the lake','The nearest rocks keep their rough surfaces. Across the lake, the mountain ridge loses its fine contours.',.45),
    card('myopia-03','Wood and distant water','The driftwood at the shore remains legible. Beyond it, waves and the opposite mountain soften into larger areas of colour.',.72),
    card('myopia-04','Along the boardwalk','The closest pine trunks, railing and path retain detail. The trees farther along the bend become harder to separate.',.55),
    card('myopia-05','Beyond the roadside','Nearby snow and boulders stay distinct. The road’s vanishing point and distant slopes fall into stronger defocus.',.88),
    card('myopia-06','Shrubs before the cliffs','Leaves and ground in the foreground stay clear. The tall rock formations beyond them become softer silhouettes.',.9),
    card('myopia-07','A railing at dusk','The nearest wooden rail remains clear. Its farther posts, the opposite shore and the evening sky lose definition gradually.',.68),
    card('myopia-08','A sculpture, a distant building','The nearby sculpture keeps its edges. The church and its reflected lights become diffuse, even though part of the scene is still sharp.',.95)
   ]},
  astigmatism:{stats:[['1','Point of light, several impressions','A bright edge may extend beyond its source'],['NEAR / FAR','Uneven focusing can affect both','Distance is not the only factor']],
   intro:'Astigmatism can blur or distort vision when the cornea or lens has an uneven shape. Different directions do not focus in the same way.',
   facts:[
    'A point of light can appear stretched or smeared. The impression is not always a symmetrical star.',
    'Near and distant objects can both be affected. Astigmatism is different from distance defocus alone.',
    'Bright points against a dark background make the spread of light easier to notice.',
    'The direction and extent of a light trail can vary between people. These photographs explore several slanted impressions.',
    'Blur, squinting, eye strain and difficulty seeing at night can accompany astigmatism.',
    'Glasses or contact lenses can improve focusing. A photograph cannot determine a person’s prescription.',
    'If a light leaves a trace, do you remember the source — or the shape of the trace around it?'
   ],cards:[
    card('astigmatism-01','Light around a dome','Small lights extend into soft diagonal traces around the cathedral. Notice how they change the edges of an otherwise solid building.',.42,'',1.4),
    card('astigmatism-02','An illuminated town','A roofline remains a roofline, but bright windows and street lights spread beyond their original boundaries.',.5,'',1.6),
    card('astigmatism-03','The tower after dark','The tower’s bright details leave faint parallel impressions. The effect follows light sources rather than adding a separate star pattern.',.6,'',1.8),
    card('astigmatism-04','An industrial horizon','Many small lamps become overlapping traces. Which lights still read as individual points, and which merge into a luminous band?',.7,'',1.7),
    card('astigmatism-05','A city on the hillside','The city is still recognisable. Its sharpest highlights begin to compete with the outlines of the buildings.',.55,'',1.5),
    card('astigmatism-06','A bright stone arch','Light from the illuminated arch softens into a directional glow. Brightness seems to occupy more space than the stone itself.',.38,'',1.3),
    card('astigmatism-07','Port lights','Cranes and lamps make a repeated rhythm. Optical trails pull that rhythm into a second, slanted direction.',.65,'',1.8),
    card('astigmatism-08','Bridge and reflection','The photographed reflection belongs to the water. The soft trails around the lights add another kind of extension to the scene.',.75,'',1.9)
   ]},
  colour:{stats:[['3','Types of cone photopigment','Different sensitivities contribute to colour vision'],['≠','A difference in colour is not a loss of everything','Brightness, texture and shape remain available']],
   intro:'Colour vision differences change which hues are easy to distinguish. Your selected subtype is used across this collection of different photographs.',
   facts:[
    'Red–green differences are the most common type. They do not mean that every red or green object simply disappears.',
    'Protanopia and deuteranopia affect red–green distinctions differently. Similar labels do not guarantee identical views.',
    'Blue–yellow differences affect another set of relationships, including blue and green, or yellow and pink.',
    'Colour weakness can be milder than the complete absence of a cone channel’s function.',
    'Seeing only shades of grey is rare. Most colour vision differences leave many colour distinctions available.',
    'A boundary can remain clear through lightness or shape even when two hues become harder to tell apart.',
    'If you could not use colour to group these objects, which other clue would you choose first?'
   ],cards:[
    card('colour-01','Tomatoes at different stages','Colour suggests ripeness in this arrangement. When some hues draw closer together, the shiny skins and repeated shapes become stronger clues.',0,'selected-colour'),
    card('colour-02','Slices of citrus','The circles repeat, but their peels and interiors differ. Look for distinctions carried by brightness as well as hue.',0,'selected-colour'),
    card('colour-03','A bowl of blueberries','A familiar fruit has a familiar expected colour. Does that expectation influence what you believe you are seeing?',0,'selected-colour'),
    card('colour-04','Butterfly and flowers','Wing, flower and foliage share the frame. Their outlines survive even when some colour relationships change.',0,'selected-colour'),
    card('colour-05','A violet among leaves','A small flower becomes easier or harder to separate from its leaves according to the selected colour view.',0,'selected-colour'),
    card('colour-06','White petals','The pale petals offer a different cue from the coloured centre. The flower remains organised through contrast and contour.',0,'selected-colour'),
    card('colour-07','Grapes on the vine','Several stages of colour sit within one cluster. Try grouping the grapes by lightness instead of by the colour names you expect.',0,'selected-colour'),
    card('colour-08','Inside a pepper','The cut surface, seeds and glossy skin provide several kinds of evidence. Colour is one way of understanding the object.',0,'selected-colour')
   ]},
  snow:{stats:[['1,100','Cases described in a 2020 study','Puledda and colleagues · not a population prevalence'],['CONTINUOUS','A quiet scene can still contain visual activity','The perceptual layer does not stop with the landscape']],
   intro:'Visual snow is persistent visual static: tiny flickering dots across the visual field. Other visual disturbances can accompany it.',
   facts:[
    'The dots can be light or dark. A still landscape does not necessarily create a still visual experience.',
    'Floaters and visual static are different phenomena. Some people with visual snow report excessive floaters as well.',
    'Afterimages can persist after looking away. A previous impression may overlap the present view.',
    'Light sensitivity can accompany visual snow. A bright setting can change how comfortable the scene feels.',
    'Some people also report difficulty seeing at night. The same layer can feel different against light and dark backgrounds.',
    'Symptoms and intensity vary. A clinical case series describes its participants, rather than every person’s experience.',
    'What belongs to the landscape, and what belongs to the act of seeing it? Can you keep those layers separate in memory?'
   ],cards:[
    card('snow-01','Mist above the trees','The pale mountain and mist give the flickering points room to become visible. The underlying scenery remains still.',0,'snow-photo floaters-photo'),
    card('snow-02','An open sky','Fine static sits across the blue while translucent shapes drift independently. The empty sky is no longer visually empty.',0,'snow-photo floaters-photo'),
    card('snow-03','A forest reflected','The lake repeats the forest’s shapes. A faint delayed impression adds a different kind of repetition to the view.',0,'snow-photo afterimage-photo'),
    card('snow-04','Lines over water','The pylons and their reflections stay fixed. Small wandering forms pass in front of their regular structure.',0,'snow-photo floaters-photo'),
    card('snow-05','A dark shore','The darker beach changes the contrast of the static. Notice how the light and dark points compete differently here.',0,'snow-photo'),
    card('snow-06','A hut in the snow','Large pale areas make the perceptual layer conspicuous. Texture appears where the photographed surface is otherwise smooth.',0,'snow-photo floaters-photo'),
    card('snow-07','Ice at sunset','The bright edges of the ice are already complex. An afterimage can make those edges seem to continue beyond the present moment.',0,'snow-photo afterimage-photo'),
    card('snow-08','Blossom against sky','The blossom stays in one place. Transparent threads move across it without belonging to the branch, the petals or the sky.',0,'snow-photo floaters-photo')
   ]},
  hemianopia:{stats:[['½','Part of a visual field can be missing','Left or right: the same side may be affected in both eyes'],['2','Eyes can share a field difference','A missing field is different from closing one eye']],
   intro:'Hemianopia is loss of half of the visual field, often after damage to visual pathways in the brain. The selected side is withheld in these studies.',
   facts:[
    'The same side of the visual field can be affected in both eyes. The difference concerns access to part of the scene.',
    'The black mask marks missing information in this artwork. An absence is not necessarily experienced as a literal black shape.',
    'A clear object can still fall outside the available field. Sharpness and the extent of vision are different things.',
    'Reading and finding objects can become harder when information falls within a missing field.',
    'People may learn scanning strategies to explore the affected side. Movement can reveal information that a fixed view withholds.',
    'The central-window option is an additional framing study. It does not describe every form of hemianopia.',
    'How much of the hidden landscape do you infer from the fragment that remains? At what point does inference become reconstruction?'
   ],cards:[
    card('hemianopia-01','A path with a missing side','A path suggests somewhere beyond the frame. Which part of its continuation do you imagine from the visible ground?',0,'selected-field'),
    card('hemianopia-02','A bridge in fragments','Only part of the bridge and heather remains available. The visible structure still invites you to complete a crossing.',0,'selected-field'),
    card('hemianopia-03','A bend in the road','The road leads attention toward an area you may not fully see. Try separating what is visible from what you assume continues.',0,'selected-field'),
    card('hemianopia-04','Cliff and shoreline','The boundary withholds part of the cliff and beach. A partial contour may be enough to suggest a much larger place.',0,'selected-field'),
    card('hemianopia-05','A mountain valley','The valley’s scale extends beyond the available field. Does the fragment feel complete while you are looking directly at it?',0,'selected-field'),
    card('hemianopia-06','A mist-filled landscape','Mist already conceals detail in the photograph. The field mask removes another kind of information from the same scene.',0,'selected-field'),
    card('hemianopia-07','An avenue of trees','Repetition offers a clue to what could be missing. Would you reconstruct more trees, or leave that part of the image unresolved?',0,'selected-field'),
    card('hemianopia-08','Trees before a mountain','Branches interrupt the view even before the mask is applied. Consider how several different boundaries organise the landscape.',0,'selected-field')
   ]},
  normal:{stats:[['1','Shared photograph','Many possible points of attention'],['∞','Ways to describe a view','What becomes important depends on where you look']],
   intro:'A clear image still contains more than one possible subject. A colour, a contour or a familiar shape can become the centre of your account.',
   facts:[
    'Begin with the brightest area. Then begin again with the darkest one. Does the photograph seem to tell the same story?',
    'Look for a small detail at the edge instead of the object in the centre. What becomes newly important?',
    'Give the photograph a title made from colour alone. Now give it a title made from shape.',
    'Look away for a moment. Which parts return easily, and which parts require you to fill in gaps?',
    'A horizon can divide an image into two fields. Follow that line before looking at the objects around it.',
    'Try describing the scene without naming its place. Which visual evidence remains in your description?',
    'Is the image you remember a recording of everything here — or a reconstruction of what mattered to you?'
   ],cards:[
    card('normal-01','Lake and mountain','Turquoise water pulls the eye toward the centre. Try beginning instead with the small dark trees nearest the edge.'),
    card('normal-02','Pillars in the forest','Repeated rock forms can read as individual objects or as one textured field. Switch between those two ways of looking.'),
    card('normal-03','Inside a forest','Vertical trunks organise the frame. The spaces between them create another pattern that is just as present.'),
    card('normal-04','A pale cliff','The cliff meets sea, sky and beach. Which boundary do you notice first, and which one holds your attention longest?'),
    card('normal-05','Water below a peak','Reflection and rock offer different kinds of detail. Imagine describing this photograph through only one of them.'),
    card('normal-06','A single tree','The solitary tree can become a symbol, a silhouette or a collection of branches. The photograph allows all three readings.'),
    card('normal-07','Fallen wood','The broken tree is both an object and a small landscape of its own. Move your attention between its outline and its surfaces.'),
    card('normal-08','Cliffs and open water','The open sea gives the rock its edge. Consider how the quieter part of an image helps define its most dramatic shape.')
   ]}
 };
 root.SeeInformationContent={studies};if(typeof module!=='undefined'&&module.exports)module.exports={studies};
})(globalThis);
