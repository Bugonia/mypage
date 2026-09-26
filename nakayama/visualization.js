'use strict';
// Presentation only. All counts and relation semantics come from core.js.
let selectedRelation=-1, selectedVertex=null, graphZoom=1;
const label=(zh,en)=>isEnglish?en:zh;
const graphColors={ink:'#243b53',muted:'#64748b',line:'#b8c7d3',teal:'#087f79',coral:'#bf654c',blue:'#4169a1',gold:'#9b721c'};
const svgText=(x,y,text,attrs='')=>`<text x="${x}" y="${y}" font-family="Arial, sans-serif" ${attrs.includes('font-size=')?'':'font-size="12"'} ${attrs.includes('fill=')?'':`fill="${graphColors.ink}"`} ${attrs}>${text}</text>`;
function resetVisualization(){selectedRelation=-1;selectedVertex=null;graphZoom=1;$('#graphView').value='auto';}
function svgRoot(w,h,body,title){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}"><title>${title}</title><rect width="100%" height="100%" fill="#fbfcfe"/>${body}</svg>`;}
function arrowDefs(){return `<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,1 L7,4 L1,7" fill="none" stroke="${graphColors.muted}" stroke-width="1.4"/></marker><marker id="activeArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,1 L7,4 L1,7" fill="none" stroke="${graphColors.blue}" stroke-width="1.5"/></marker></defs>`;}
function bindGraphicActions(root){
  root.querySelectorAll('[data-graph-relation]').forEach(el=>{const action=()=>drawAlgebra(Number(el.dataset.graphRelation));el.onclick=action;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};});
  root.querySelectorAll('[data-vertex]').forEach(el=>{const action=()=>{selectedVertex=Number(el.dataset.vertex);drawAlgebra(selectedRelation);};el.onclick=action;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};});
}
function drawAlgebra(selected=selectedRelation){
  if(!result)return;
  selectedRelation=selected;
  const r=result,n=r.n,cyc=r.kind==='cyclic',view=$('#graphView').value;
  const ring=cyc&&(view==='ring'||view==='auto'&&n<=24);
  $('#graphView').querySelector('[value="ring"]').disabled=!cyc;
  const sel=selected<0?null:relationSets(r.relations[selected],n);
  // Pack directed relation intervals into non-overlapping lanes; contacts use separate lanes.
  const lanes=[],levels=[];
  if(!ring)r.relations.forEach(([s,l])=>{const end=cyc?Math.min(n,s+l):s+l;let k=lanes.findIndex(last=>last<s);if(k<0)k=lanes.length;lanes[k]=end;levels.push(k);});
  const w=ring?Math.max(460,n*20):Math.max(460,(n-1)*68+100);
  const h=ring?w:Math.max(210,145+lanes.length*32+(cyc?36:0));
  const nodeY=ring?0:70+lanes.length*32;
  const radius=w*.36;
  const pts=Array.from({length:n},(_,i)=>ring?[w/2+radius*Math.cos(2*Math.PI*i/n-Math.PI/2),h/2+radius*Math.sin(2*Math.PI*i/n-Math.PI/2)]:[n===1?w/2:50+i*68,nodeY]);
  if(n===1&&ring)pts[0]=[w/2,h/2];
  let body=arrowDefs();
  if(!ring){
    body+=svgText(22,24,label('零关系支撑','Zero-relation supports'),'font-weight="600" fill="#64748b"');
    r.relations.forEach(([s,l],i)=>{
      const y=48+levels[i]*32,x=pts[s-1][0],end=cyc?Math.min(n,s+l):s+l,u=pts[end-1][0],active=i===selected,opacity=selected<0||active?1:.28;
      // A cyclic interval cut at n is explicitly marked; its complete path appears below on selection.
      body+=`<g data-graph-relation="${i}" tabindex="0" role="button" aria-label="g${i+1}" opacity="${opacity}" style="cursor:pointer"><title>g${i+1}: [${s}, ${l}]</title><path d="M${x},${y+6}V${y}H${u}V${y+6}" stroke="${active?graphColors.blue:graphColors.teal}" stroke-width="${active?3:1.6}" fill="none"/><path d="M${x},${y}H${Math.max(x+20,u)}" stroke="transparent" stroke-width="25"/>${svgText((x+u)/2,y-7,`g${i+1}${cyc&&s+l>n?' ↻':''}`,'text-anchor="middle"')}</g>`;
    });
    if(!r.m)body+=svgText(22,40,label('无零关系','No zero relations'),'fill="#64748b"');
    if(cyc)body+=svgText(22,h-38,label('↻ 表示在 n 处截断；选择关系查看完整路径次序','↻ marks a cut at n; select a relation to inspect its path sequence'),'font-size="11" fill="#64748b"');
  } else if(n>1){
    body+=svgText(w/2,h/2-7,`Q · ${n} ${label('个顶点','vertices')}`,'text-anchor="middle" font-size="16" font-weight="600"');
    body+=svgText(w/2,h/2+18,`${r.m} ${label('条最小关系','minimal relations')}`,'text-anchor="middle" fill="#64748b"');
  }
  function edgeActive(i){if(!sel)return false;const [s,l]=r.relations[selected];return cyc?(i+1-s+n)%n<Math.min(n,l):i+1>=s&&i+1<s+l;}
  for(let i=0;i<(cyc?n:n-1);i++){
    const [x,y]=pts[i],[u,v]=pts[(i+1)%n],active=edgeActive(i),stroke=active?graphColors.blue:graphColors.line;
    let d;
    if(n===1){d=`M${x-13},${y-13}C${x-65},${y-90} ${x+65},${y-90} ${x+13},${y-13}`;}
    else if(cyc&&!ring&&i===n-1){d=`M${x},${y+23}C${x},${y+67} ${u},${v+67} ${u},${v+23}`;}
    else if(ring){
      const theta=2*Math.PI*i/n-Math.PI/2,delta=23/radius,end=theta+2*Math.PI/n-delta;
      const sx=w/2+radius*Math.cos(theta+delta),sy=h/2+radius*Math.sin(theta+delta),ex=w/2+radius*Math.cos(end),ey=h/2+radius*Math.sin(end);
      d=`M${sx},${sy}A${radius},${radius} 0 0 1 ${ex},${ey}`;
    }else {d=`M${x+22},${y}L${u-24},${v}`;}
    body+=`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${active?3:1.6}" marker-end="url(#${active?'activeArrow':'arrow'})"/>`;
  }
  pts.forEach(([x,y],i)=>{
    const v=i+1,inX=r.x_set.includes(v),color=inX?graphColors.teal:graphColors.coral,opacity=sel&&!sel.hood.has(v)?.26:1;
    const status=inX?'X':label('内部','interior');
    body+=`<g data-vertex="${v}" tabindex="0" role="button" aria-label="${label('顶点','Vertex')} ${v}, ${status}" style="cursor:pointer" opacity="${opacity}"><title>${label('顶点','Vertex')} ${v} · ${status}</title>`;
    if(sel&&sel.ends.has(v))body+=`<circle cx="${x}" cy="${y}" r="23" fill="none" stroke="${graphColors.blue}" stroke-width="2"/>`;
    if(selectedVertex===v)body+=`<circle cx="${x}" cy="${y}" r="27" fill="none" stroke="${graphColors.gold}" stroke-width="2" stroke-dasharray="3 3"/>`;
    body+=`<circle cx="${x}" cy="${y}" r="18" fill="${inX?'#e5f3f1':'#fff0e9'}" stroke="${color}" stroke-width="1.5" ${!inX?'stroke-dasharray="3 2"':''}/>${svgText(x,y+4,v,`text-anchor="middle" fill="${color}" font-weight="600"`)}</g>`;
  });
  body+=`<circle cx="22" cy="${h-16}" r="4" fill="#e5f3f1" stroke="#087f79"/>${svgText(33,h-12,label('X：无内部约束','X: outside all interiors'),'font-size="10" fill="#64748b"')}<circle cx="202" cy="${h-16}" r="4" fill="#fff0e9" stroke="#bf654c" stroke-dasharray="2 1"/>${svgText(213,h-12,label('内部顶点','Interior vertex'),'font-size="10" fill="#64748b"')}<circle cx="337" cy="${h-16}" r="5" fill="none" stroke="#4169a1"/>${svgText(348,h-12,label('所选端点','Selected endpoints'),'font-size="10" fill="#64748b"')}`;
  const graph=$('#algebraDiagram');graph.innerHTML=svgRoot(w,h,body,label('箭图、零关系支撑与 X-set','Quiver, zero-relation supports, and X-set'));
  const displayWidth=ring?(n>24?w:Math.min(w,graph.clientWidth-2)):n<=10?Math.min(w,Math.max(440,graph.clientWidth-2)):w;
  const svg=graph.querySelector('svg');svg.style.width=(displayWidth*graphZoom)+'px';svg.style.height='auto';
  $('#zoomValue').textContent=Math.round(graphZoom*100)+'%';
  $('#zoomOut').disabled=graphZoom<=.6;$('#zoomIn').disabled=graphZoom>=2;
  document.querySelectorAll('[data-relation]').forEach(b=>{const active=Number(b.dataset.relation)===selected;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
  bindGraphicActions(graph);renderRelationDetail(sel);renderVertexDetail();
}
function renderRelationDetail(sel){
  const r=result,n=r.n,cyc=r.kind==='cyclic';
  if(!sel){$('#relationDetail').textContent=r.m?label('选择关系以高亮路径；选择顶点以查看最大元分支。','Select a relation to highlight its path; select a vertex to inspect its greatest-element branch.'):tr('没有零关系：所有 n! 个全序都符合判据。');$('#relationPath').replaceChildren();return;}
  const [s,l]=r.relations[selectedRelation],end=(s+l-1)%n+1;
  $('#relationDetail').textContent=`g${selectedRelation+1}: ${label('起点','start')} ${s}, ${l} ${label('条箭头；终点','arrows; endpoint')} ${end}. Hod = {${[...sel.hood].join(', ')}}; Int = {${[...sel.inside].join(', ')}}. ${cyc&&l>=n?tr('路径发生绕圈：同一顶点可同时出现在端点与内部，内部约束仍保留。'):''}`;
  // Render occurrences, not just distinct labels. Long paths are explicitly abbreviated.
  const indices=l<=24?Array.from({length:l+1},(_,i)=>i):[0,1,2,3,4,null,l-4,l-3,l-2,l-1,l];
  $('#relationPath').innerHTML=`<div class="path-heading">${label('路径中的出现次序','Occurrences along the path')} · ${l+1} ${label('项','terms')}</div><div class="path-sequence">${indices.map((j,k)=>`${k?'<span class="path-arrow" aria-hidden="true">→</span>':''}${j===null?`<span class="path-ellipsis" title="${label('中间出现项已省略','Intermediate occurrences omitted')}">…</span>`:`<span class="path-node ${j===0||j===l?'endpoint':'interior'}"><b>${(s-1+j)%n+1}</b><small>${j===0?'h(g)':j===l?'d(g)':label('内部','interior')}</small></span>`}`).join('')}</div>${l>24?`<p class="hint">${label('仅显示首尾各 5 项；省略项仍全部参与判定与计数。','Only the first and last 5 terms are shown; all omitted occurrences still enter the criterion and count.')}</p>`:''}`;
}
function renderVertexDetail(){
  document.querySelectorAll('#branchRows tr[data-branch]').forEach(row=>row.classList.toggle('selected-branch',Number(row.dataset.branch)===selectedVertex));
  const box=$('#vertexDetail');box.hidden=selectedVertex===null;if(selectedVertex===null)return;
  const b=result.branches.find(x=>x.vertex===selectedVertex);
  box.textContent=b?`${label('顶点','Vertex')} ${selectedVertex} · ${b.type} · ${label('贡献','Contribution')} ${comma(b.count)} / ${comma(result.q)}${result.q==='0'?'':` (${(100*fracOf(b.count,result.q)).toFixed(2)}%)`}`:`${label('顶点','Vertex')} ${selectedVertex}: ${label('位于某条零关系的内部，不能成为拟遗传全序的最大元。','lies in the interior of a zero relation and cannot be the greatest element of a quasi-hereditary ordering.')}`;
}
function renderBranches(){
  const r=result;
  $('#branchRows').innerHTML=r.branches.length?r.branches.map(b=>`<tr data-branch="${b.vertex}"><td><button class="branch-select" data-select-vertex="${b.vertex}" aria-label="${label('选择顶点','Select vertex')} ${b.vertex}">${b.vertex}</button></td><td><span class="branch-type">${b.type}</span></td><td>${b.deleted.map(i=>'g'+i).join(', ')||'—'}</td><td><span class="branch-count">${comma(b.count)}</span><small class="branch-share">${r.q==='0'?'—':(100*fracOf(b.count,r.q)).toFixed(2)+'%'}</small><div class="branch-track"><div class="branch-fill" style="width:${100*fracOf(b.count,r.q)}%"></div></div></td></tr>`).join(''):`<tr><td colspan="4">${tr('X 为空，无可行最大元，因此 q(A) = 0。')}</td></tr>`;
  document.querySelectorAll('[data-select-vertex]').forEach(b=>b.onclick=()=>{selectedVertex=Number(b.dataset.selectVertex);drawAlgebra(selectedRelation);});
}
function renderT2(){
  let m=Number($('#t2M').value);if(!Number.isInteger(m)||m<1||m>30){$('#t2M').value=3;m=3;}
  const ps=C.t2(Math.max(m,8)),p=ps[m];$('#t2P').textContent=p.probability;$('#t2Q').textContent=comma(p.q);$('#t2N').textContent=p.n;
  const w=560,h=300,l=52,t=30,b=45,r=26,xx=i=>l+(w-l-r)*i/(ps.length-1),yy=v=>t+(h-t-b)*(1-v);
  let body='';
  for(let i=0;i<=4;i++){const v=i/4,y=yy(v);body+=`<path d="M${l},${y}H${w-r}" stroke="#e1e7ee" stroke-dasharray="3 4"/>${svgText(l-10,y+4,v.toFixed(2),'text-anchor="end" fill="#64748b"')}`;}
  body+=`<path d="M${l},${t}V${h-b}H${w-r}" stroke="#9cabbc" fill="none"/>`;
  body+=svgText(16,16,'pₘ','font-style="italic"')+svgText(w-r,h-8,'m','font-style="italic" text-anchor="end"');
  const pts=ps.map((p,i)=>[xx(i),yy(fractionNumber(p.probability))]);
  body+=`<path d="M${l},${h-b}L${pts.map(p=>p.join(',')).join(' L')}L${w-r},${h-b}Z" fill="#087f79" opacity=".055"/><path d="M${pts.map(p=>p.join(',')).join(' L')}" fill="none" stroke="#087f79" stroke-width="2"/>`;
  body+=`<path d="M${xx(m)},${t}V${h-b}" stroke="#4169a1" stroke-dasharray="4 4" opacity=".5"/>`;
  ps.forEach((p,i)=>{const [x,y]=pts[i];body+=`<g ${i>0?`data-t2-m="${i}" tabindex="0" role="button" aria-label="m=${i}, p=${p.probability}" style="cursor:pointer"`:''}><title>m=${i}; p=${p.probability}</title><circle cx="${x}" cy="${y}" r="10" fill="transparent"/><circle cx="${x}" cy="${y}" r="${i===m?5.5:3}" fill="${i===m?'#4169a1':'#fff'}" stroke="${i===m?'#4169a1':'#087f79'}" stroke-width="1.7"/></g>`;if(ps.length<14||i%5===0||i===m)body+=svgText(x,h-b+22,i,`text-anchor="middle" fill="${i===m?'#4169a1':'#64748b'}"`);});
  body+=svgText(w-r,16,`m = ${m} · p ≈ ${fractionNumber(p.probability).toFixed(6)}`,'text-anchor="end" fill="#4169a1"');
  $('#t2Chart').innerHTML=svgRoot(w,h,body,tr('T2拟遗传全序比例随关系数下降的曲线'));
  $('#t2Chart').querySelectorAll('[data-t2-m]').forEach(el=>{const action=()=>{$('#t2M').value=el.dataset.t2M;renderT2();};el.onclick=action;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};});
}
function saveSvg(selector,name){
  const source=$(selector).querySelector('svg').cloneNode(true);source.removeAttribute('style');
  source.querySelectorAll('[tabindex]').forEach(el=>{el.removeAttribute('tabindex');el.removeAttribute('role');});
  const url=URL.createObjectURL(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(source)],{type:'image/svg+xml;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function initVisualization(){
  $('#graphView').onchange=()=>{graphZoom=1;drawAlgebra();};
  $('#zoomIn').onclick=()=>{graphZoom=Math.min(2,Math.round((graphZoom+.2)*10)/10);drawAlgebra();};
  $('#zoomOut').onclick=()=>{graphZoom=Math.max(.6,Math.round((graphZoom-.2)*10)/10);drawAlgebra();};
  $('#resetGraph').onclick=()=>{selectedRelation=-1;selectedVertex=null;graphZoom=1;drawAlgebra();};
  $('#exportGraph').onclick=()=>saveSvg('#algebraDiagram','nakayama-quiver.svg');
  $('#exportT2').onclick=()=>saveSvg('#t2Chart','nakayama-t2-proportions.svg');
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(result)drawAlgebra();},120);});
}
