(function(root){
 'use strict';
 const extras={
  myopia:{intro:'The difference is most noticeable when small details are far away. A nearby object may remain clear, so one scene can contain both precise and uncertain information.',impact:'You might step closer, look for a familiar outline, or use where something is located to recognise it. A place can feel familiar before all its details are available; what you notice first may depend on how close you can get.'},
  astigmatism:{intro:'The effect can be especially noticeable around a bright light against a dark background. It is not simply a single amount of blur: the direction, contrast, and lighting of an edge can change its appearance.',impact:'A reflection or a stretched light may catch your attention before the object behind it. You might pause, change where you look, or compare neighbouring shapes. The most memorable part of a night scene could be its light rather than its precise outline.'},
  colour:{intro:'Different types affect different colour relationships, rather than removing every colour. In this experience, your chosen subtype changes which hues remain easy to distinguish while brightness and texture still offer useful clues.',impact:'You may separate objects by their position, pattern, or lightness when colour alone is less helpful. A colour-coded distinction that seems immediate to someone else may require a different clue. That changes the route to understanding, rather than deciding how much you can understand.'},
  snow:{intro:'This visual activity can remain present even when the person and the scene are still. It is distinct from objects moving in the environment. Its visibility can change with the background, contrast, and lighting.',impact:'A plain wall or open sky may feel visually busy even when there is little happening in the scene. You might look for a stable shape to settle your attention, or notice the perceptual layer instead. What feels quiet to one viewer can feel less quiet to another.'},
  hemianopia:{intro:'A person may need to turn their eyes or head to discover information outside the available field. The experience is not equivalent to simply closing one eye, and its appearance and practical effects differ between people.',impact:'The first impression of a room may leave out an object or relationship that becomes clear after looking again. You might scan, turn, or rely on a familiar arrangement. Revisiting a view can therefore change its meaning, even though the room itself has not changed.'},
  normal:{intro:'The baseline does not add a visual-condition filter to the world. It still depends on a chosen viewpoint, distance, lighting, and frame. Having information available does not mean that every part receives the same attention.',impact:'You might notice a vivid colour, a repeated shape, or an unexpected gap first. Someone else may remember a different part of the same scene. Your crop records one choice about what mattered at that moment, rather than an objective record of everything around you.'}
 };
 const effects={
  structure:{
   myopia:'Near detail stays clear while distant outlines become clues.',
   astigmatism:'Light trails can draw attention away from an object’s outline.',
   colour:'Shape and pattern can carry distinctions that colour does not.',
   snow:'Stable edges offer anchors within a visually busy scene.',
   hemianopia:'Partial outlines invite you to infer what lies beyond the frame.',
   normal:'Familiar outlines help separate objects from their surroundings.'
  },
  color:{
   myopia:'Broad colour areas can identify a place before fine detail does.',
   astigmatism:'Glowing highlights may become more memorable than their source.',
   colour:'Some hues become less distinct, making brightness and texture useful.',
   snow:'Grain can make a plain area feel visually active.',
   hemianopia:'Only part of the colour composition shapes a first impression.',
   normal:'A vivid colour can become the detail you remember first.'
  },
  field:{
   myopia:'Moving closer can change which details enter your understanding.',
   astigmatism:'Changing where you look can help separate objects from light trails.',
   colour:'The field stays available, but different colour clues guide attention.',
   snow:'An active perceptual layer can compete with a still scene for attention.',
   hemianopia:'Scanning can reveal relationships absent from the first impression.',
   normal:'An open field still leaves attention selective.'
  }
 };
 const priority={structure:['myopia','astigmatism','hemianopia','snow','colour','normal'],color:['colour','astigmatism','myopia','snow','hemianopia','normal'],field:['hemianopia','snow','myopia','astigmatism','colour','normal']};
 const endings={structure:'Recognition also draws on experience.',color:'Context offers another way to understand what you see.',field:'What does a second look add?'};
 function combined(entries,kind,settings={}){
  const selected=new Set(entries.map(c=>c.id));
  const sentences=priority[kind].filter(id=>selected.has(id)).slice(0,2).map(id=>{
   if(id==='colour'&&kind==='color')return settings.details?.colour==='tritan'?'Blue–yellow relationships may be harder to separate.':settings.details?.colour==='weak'?'Subtle red–green differences may need another visual clue.':'Red–green relationships may be harder to separate.';
   if(id==='hemianopia'&&kind==='field')return settings.details?.hemianopia==='side'?'A narrower peripheral view changes which relationships appear at once.':'Information '+(settings.details?.hemianopia==='right'?'on the right':'on the left')+' may be absent from the first impression.';
   return effects[kind][id];
  });
  if(kind==='color'&&Math.abs(settings.tone||0)>.1)sentences.push(settings.tone>0?'Lighting adds a warmer cast.':'Lighting adds a cooler cast.');
  else if(kind==='structure'&&settings.controls?.structure)sentences.push('Connections emphasise spatial relationships.');
  else sentences.push(endings[kind]);
  return sentences.join(' ');
 }
 function toneLabel(value=0){return Math.abs(value)<.05?'Neutral':(value>0?'Warm':'Cool')+' · '+Math.round(Math.abs(value)*100)+'%';}
 function study(id){const source=root.PerspectiveContent.notes[id];return{intro:source.intro+' '+extras[id].intro,impact:source.perspective+' '+extras[id].impact};}
 const photographs={myopia:'myopia-02',astigmatism:'astigmatism-01',colour:'colour-05',snow:'snow-02',hemianopia:'hemianopia-01',normal:'normal-01'};
 const api={extras,effects,combined,toneLabel,study,photographs};root.JourneyContent=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
