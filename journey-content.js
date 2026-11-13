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
 const fragments={
  structure:{myopia:'a difference between near and distant clarity',astigmatism:'directional light trails',colour:'shape cues beyond colour',snow:'visual activity around stable edges',hemianopia:'partly available outlines',normal:'a shared set of visible outlines'},
  color:{myopia:'large areas of colour without every fine edge',astigmatism:'glowing highlights',colour:'different relationships between hues',snow:'grain against areas of colour',hemianopia:'a selected part of the colour composition',normal:'the full baseline palette'},
  field:{myopia:'clarity that changes with distance',astigmatism:'uneven focus across the scene',colour:'colour distinctions within an otherwise available field',snow:'a persistent perceptual layer',hemianopia:'the visual-field boundary you selected',normal:'an available frame with selective attention'}
 };
 const endings={
  structure:'Familiar silhouettes and spatial relationships can become useful clues. Which parts did you recognise through detail, and which did you infer from context?',
  color:'Lighting and contrast can change what attracts your attention without changing the objects themselves. What became important because of its colour, and what needed another kind of clue?',
  field:'Moving, scanning, and choosing a frame change the information available at once. What did your first view leave out, and how did another look change your understanding?'
 };
 function join(parts){return parts.length<2?(parts[0]||''):parts.slice(0,-1).join(', ')+' and '+parts[parts.length-1];}
 function combined(entries,kind,settings={}){
  const parts=entries.map(c=>{
    if(c.id==='colour'&&kind==='color')return settings.details?.colour==='tritan'?'less distinct blue–yellow relationships':settings.details?.colour==='weak'?'subtler red–green distinctions':'less distinct red–green relationships';
    if(c.id==='hemianopia'&&kind==='field')return settings.details?.hemianopia==='right'?'less available information on the right':settings.details?.hemianopia==='side'?'a more limited peripheral view':'less available information on the left';
    return fragments[kind][c.id];
   }).filter(Boolean);
  let extra='';
  if(kind==='color'){extra=settings.tone>.1?' Your chosen lighting adds a warmer cast.':settings.tone<-.1?' Your chosen lighting adds a cooler cast.':'';}
  if(kind==='structure'&&settings.controls?.structure)extra=' The visible connections also emphasise relationships between points.';
  return (parts.length===1?'In this view, you can notice ':'Your selected view brings together ')+join(parts)+'.'+extra+' '+endings[kind];
 }
 function toneLabel(value=0){return Math.abs(value)<.05?'Neutral':(value>0?'Warm':'Cool')+' · '+Math.round(Math.abs(value)*100)+'%';}
 function study(id){const source=root.PerspectiveContent.notes[id];return{intro:source.intro+' '+extras[id].intro,impact:source.perspective+' '+extras[id].impact};}
 const photographs={myopia:'myopia-02',astigmatism:'astigmatism-01',colour:'colour-01',snow:'snow-02',hemianopia:'hemianopia-01',normal:'normal-01'};
 const api={extras,fragments,combined,toneLabel,study,photographs};root.JourneyContent=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
