'use strict';
const $=s=>document.querySelector(s), C=Nakayama;
let result=null,worker=null,workerUrl=null,lastInput=null;
const comma=x=>String(x).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const fractionNumber=s=>{const [a,b='1']=s.split('/');return Number(BigInt(a)*1000000000n/BigInt(b))/1e9;};
const fracOf=(a,b)=>b==='0'?0:Number(BigInt(a)*100000n/BigInt(b))/100000;
function inputValue(){const data=JSON.parse($('#algebraInput').value);return {n:Number($('#nInput').value),kind:$('#kindInput').value,[$('#modeInput').value]:data};}
function stop(){if(worker)worker.terminate();if(workerUrl)URL.revokeObjectURL(workerUrl);worker=null;workerUrl=null;$('#busy').hidden=true;$('#cancelButton').hidden=true;$('#runButton').disabled=false;}
function run(){
  stop();result=null;$('#resultContent').hidden=true;$('#exportButton').disabled=true;$('#error').hidden=true;
  try{lastInput=inputValue();C.normalize(lastInput);}catch(e){$('#error').textContent=e.message;$('#error').hidden=false;return;}
  $('#busy').hidden=false;$('#cancelButton').hidden=false;$('#runButton').disabled=true;
  try{
    const source=`const C=(${createNakayamaCore.toString()})();onmessage=e=>{try{postMessage({result:C.count(e.data)})}catch(x){postMessage({error:x.message})}};`;
    workerUrl=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));worker=new Worker(workerUrl);
    worker.onmessage=e=>{stop();if(e.data.error){$('#error').textContent=e.data.error;$('#error').hidden=false;}else{result=e.data.result;renderResult();}};
    worker.onerror=e=>{stop();$('#error').textContent='浏览器后台计算失败：'+e.message+'。请使用现代浏览器，或运行 Python 版本。';$('#error').hidden=false;};
    worker.postMessage(lastInput);
  }catch(e){stop();$('#error').textContent=e.message;$('#error').hidden=false;}
}
function relationSets(r,n){const [s,l]=r,hood=new Set(),inside=new Set();for(let j=0;j<Math.min(n,l+1);j++)hood.add((s-1+j)%n+1);for(let j=1;j<=Math.min(n,l-1);j++)inside.add((s-1+j)%n+1);return{hood,inside,ends:new Set([s,(s+l-1)%n+1])};}
function drawAlgebra(selected=-1){
  const r=result,n=r.n,cyc=r.kind==='cyclic',ring=cyc&&n<=24,w=ring?Math.max(320,Math.min(650,n*30)):Math.max(500,n*62+24),h=ring?Math.max(260,w*.65):155;
  let pts=Array.from({length:n},(_,i)=>ring?[w/2+Math.min(w*.4,h*.37)*Math.cos(2*Math.PI*i/n-Math.PI/2),h/2+Math.min(w*.4,h*.37)*Math.sin(2*Math.PI*i/n-Math.PI/2)]:[42+i*62,85]);
  if(n===1)pts=[[w/2,h/2]];
  let svg='<defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0L6,3L0,6" fill="none" stroke="#97aaa1"/></marker></defs>';
  for(let i=0;i<(cyc?n:n-1);i++){
    const [x,y]=pts[i],[u,v]=pts[(i+1)%n];
    if(n===1){svg+=`<path d="M${x-12},${y-12} C${x-62},${y-75} ${x+62},${y-75} ${x+12},${y-12}" fill="none" stroke="#97aaa1" marker-end="url(#arrow)"/>`;continue;}
    if(cyc&&!ring&&i===n-1){svg+=`<text x="20" y="132" fill="#647779" font-size="11">循环展开：${n} → 1；水平滚动查看全部顶点</text>`;continue;}
    const d=Math.hypot(u-x,v-y),dx=(u-x)/d,dy=(v-y)/d;
    if(n===2&&cyc){svg+=`<path d="M${x+16},${y} Q${w*.82},${h/2} ${u+16},${v}" fill="none" stroke="#97aaa1" marker-end="url(#arrow)" transform="${i?'translate('+w+',0) scale(-1,1)':''}"/>`;continue;}
    svg+=`<path d="M${x+18*dx},${y+18*dy} L${u-21*dx},${v-21*dy}" stroke="#97aaa1" stroke-width="1.6" marker-end="url(#arrow)"/>`;
  }
  const sel=selected<0?null:relationSets(r.relations[selected],n);
  pts.forEach(([x,y],i)=>{const v=i+1,fill=r.x_set.includes(v)?'#087f79':'#d07157',opacity=sel&&!sel.hood.has(v)?.23:1;svg+=`<g opacity="${opacity}"><circle cx="${x}" cy="${y}" r="16" fill="${fill}" ${sel&&sel.hood.has(v)?'stroke="#bc8f26" stroke-width="4"':''}/><text x="${x}" y="${y+4}" text-anchor="middle" fill="white" font-size="11" font-family="sans-serif">${v}</text>${sel&&sel.inside.has(v)?`<text x="${x}" y="${y+32}" text-anchor="middle" fill="#9c672c" font-size="10">内部</text>`:''}</g>`;});
  $('#algebraDiagram').innerHTML=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="输入代数的箭图与X-set">${svg}</svg>`;
  document.querySelectorAll('[data-relation]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.relation)===selected));
  if(sel){const [s,l]=r.relations[selected];$('#relationDetail').textContent=`g${selected+1}：起点 ${s}，${l} 条箭头，终点 ${(s+l-1)%n+1}。Hod = {${[...sel.hood].join(', ')}}；Int = {${[...sel.inside].join(', ')}}。${cyc&&l>=n?'路径发生绕圈：同一顶点可同时出现在端点与内部，内部约束仍保留。':''}`;}
}
function renderResult(){
  const r=result;$('#resultContent').hidden=false;$('#exportButton').disabled=false;
  $('#qValue').textContent=comma(r.q);$('#ratioValue').textContent=r.probability;$('#percentValue').textContent=(100*fractionNumber(r.probability)).toFixed(4)+'%';$('#mValue').textContent=r.m;$('#statesValue').textContent=r.states;$('#timeValue').textContent=r.seconds.toFixed(3)+' s';$('#algorithmValue').textContent='精确算法：'+(r.algorithm==='T2 closed recurrence'?'T2 组合递推快速路径':'X-set 关系子集迭代');
  if(r.kind==='directed'&&r.m>0){const t=C.t2(r.m)[r.m],lim=BigInt(r.factorial)*BigInt(t.probability.split('/')[0])/BigInt(t.probability.split('/')[1]||'1');$('#boundValue').textContent=r.n>=2*r.m+1?`固定 m=${r.m} 的 T2 最大值为 ${comma(lim)}；当前达到上界：${r.q===String(lim)?'是':'否'}。`:`T2 需至少 ${2*r.m+1} 个顶点；当前 n=${r.n}，仍有概率上界 pₘ=${t.probability}，但不可达。`;}else $('#boundValue').textContent=r.kind==='cyclic'?'固定 m 的 T2 极值定理仅针对 directed 类型。':'';
  $('#warnings').replaceChildren();r.warnings.forEach(s=>{const p=document.createElement('p');p.className='note';p.textContent=s;$('#warnings').append(p);});
  $('#sets').textContent=`X = {${r.x_set.join(', ')}}　 X₀ = {${r.x0_set.join(', ')}}`;
  $('#kupischValue').textContent='Kupisch = ['+r.kupisch.join(', ')+']';
  $('#relationChips').innerHTML=r.relations.map(([s,l],i)=>`<button data-relation="${i}">g${i+1} · [${s},${l}]</button>`).join('');
  $('#relationChips').querySelectorAll('button').forEach(b=>b.onclick=()=>drawAlgebra(Number(b.dataset.relation)));
  $('#relationDetail').textContent=r.m?'点击一条最小关系查看其 hood 与内部顶点。':'没有零关系：所有 n! 个全序都符合判据。';drawAlgebra();
  $('#branchRows').innerHTML=r.branches.length?r.branches.map(b=>`<tr><td>${b.vertex}</td><td>${b.type}</td><td>${b.deleted.map(i=>'g'+i).join(', ')||'—'}</td><td>${comma(b.count)}<div class="branch-track"><div class="branch-fill" style="width:${100*fracOf(b.count,r.q)}%"></div></div></td></tr>`).join(''):'<tr><td colspan="4">X 为空，无可行最大元，因此 q(A) = 0。</td></tr>';
  $('#orderInput').value=r.witness_descending.join(', ');$('#orderResult').textContent=r.q==='0'?'此代数没有拟遗传全序。':'已构造一个通过判据的全序（从大到小）。';
}
function preset(name){
  const p={t2:[7,'directed',[[1,2],[3,2],[5,2]]],dense:[7,'directed',[[1,2],[2,2],[3,2]]],cyclic:[4,'cyclic',[[4,2]]],zero:[3,'cyclic',[[1,4]]],hereditary:[7,'directed',[]]}[name];
  $('#nInput').value=p[0];$('#kindInput').value=p[1];$('#modeInput').value='relations';updateLabel();$('#algebraInput').value=JSON.stringify(p[2]);run();
}
function updateLabel(){const k=$('#modeInput').value==='kupisch';$('#inputLabel').textContent=k?'Kupisch 列（各顶点射影模的长度）':'零关系数组（第二项不是终点）';$('#inputHint').textContent=k?'线性型：cₙ=1；循环型：所有 cᵢ≥2。均需满足相邻容许条件。':'例：[3,2] 是路径 3 → 4 → 5 = 0。重复和冗余关系会自动去除。';}
function renderT2(){
  let m=Number($('#t2M').value);if(!Number.isInteger(m)||m<1||m>30){$('#t2M').value=3;m=3;}
  const ps=C.t2(Math.max(m,8)),p=ps[m];$('#t2P').textContent=p.probability;$('#t2Q').textContent=comma(p.q);$('#t2N').textContent=p.n;
  const w=540,h=265,l=42,t=16,b=33,r=20,xx=i=>l+(w-l-r)*i/(ps.length-1),yy=v=>t+(h-t-b)*(1-v);
  let svg='';for(let i=0;i<=4;i++){const v=i/4,y=yy(v);svg+=`<path d="M${l},${y}H${w-r}" stroke="#dce3db"/><text x="3" y="${y+4}" font-size="10" fill="#647779">${v.toFixed(2)}</text>`;}
  const pts=ps.map((p,i)=>[xx(i),yy(fractionNumber(p.probability))]);svg+=`<path d="M${pts.map(p=>p.join(',')).join(' L')}" fill="none" stroke="#087f79" stroke-width="2.5"/>`;
  ps.forEach((p,i)=>{const [x,y]=pts[i];svg+=`<circle cx="${x}" cy="${y}" r="${i===m?6:3}" fill="${i===m?'#bc8f26':'#087f79'}"><title>m=${i}：p=${p.probability}</title></circle>`;if(ps.length<14||i%3===0||i===m)svg+=`<text x="${x}" y="${h-10}" text-anchor="middle" font-size="10" fill="#647779">${i}</text>`;});
  $('#t2Chart').innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="T2拟遗传全序比例随关系数下降的曲线">${svg}</svg>`;
}
function pairFraction(n,d){const gcd=(a,b)=>b?gcd(b,a%b):a,g=gcd(n,d);return n/g+(d/g===1?'':'/'+d/g);}
function renderPair(){
  let a=Number($('#lengthA').value),b=Number($('#lengthB').value);
  if(!Number.isInteger(a)||a<3||a>40)a=3;if(!Number.isInteger(b)||b<3||b>40)b=3;
  $('#lengthA').value=a;$('#lengthB').value=b;
  const min=Math.max(1,a-b+1),max=a-2;
  $('#offsetD').min=min;$('#offsetD').max=max;
  let d=Number($('#offsetD').value);if(!Number.isInteger(d)||d<min||d>max)d=min;$('#offsetD').value=d;
  const data=[
    {name:'内部交叠',fraction:pairFraction(2*(a+b),a*b*(d+b)),start:d+1,tag:`偏移 d=${d} · 并集 ${d+b} 点`},
    {name:'完全分离',fraction:pairFraction(4,a*b),start:a+1,tag:`两组顶点支撑不相交`},
    {name:'端点相接',fraction:pairFraction(a*b+2*(a+b),a*b*(a+b-1)),start:a,tag:`共享一个双方端点`}
  ];
  const value=f=>fractionNumber(f);
  $('#compareHint').textContent=`允许的交叠偏移：${min}–${max}；当前长度 a=${a}、b=${b}。三种摆放都放在 n=${a+b} 的箭图中。`;
  $('#pairChart').replaceChildren();
  for(let i=0;i<data.length;i++){
    const x=data[i],card=document.createElement('div');card.className='pair-card'+(i===2?' best':'');
    const title=document.createElement('h3');title.textContent=x.name;card.append(title);
    const strong=document.createElement('strong');strong.textContent=x.fraction;card.append(strong);
    const small=document.createElement('small');small.textContent=x.tag;card.append(small);
    const track=document.createElement('div');track.className='pair-track';const fill=document.createElement('div');fill.className='pair-fill';fill.style.width=(100*value(x.fraction)/value(data[2].fraction))+'%';track.append(fill);card.append(track);
    const button=document.createElement('button');button.textContent='载入计算器 ↗';button.onclick=()=>{$('#nInput').value=a+b;$('#kindInput').value='directed';$('#modeInput').value='relations';updateLabel();$('#algebraInput').value=JSON.stringify([[1,a-1],[x.start,b-1]]);run();$('.workspace').scrollIntoView({behavior:'smooth'});};card.append(button);$('#pairChart').append(card);
  }
}
['#lengthA','#lengthB','#offsetD'].forEach(id=>$(id).addEventListener('change',renderPair));
$('#runButton').onclick=run;$('#cancelButton').onclick=()=>{stop();$('#error').textContent='已取消，未输出不完整结果。';$('#error').hidden=false;};
$('#modeInput').onchange=updateLabel;document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>preset(b.dataset.preset));
$('#checkButton').onclick=()=>{try{const ord=$('#orderInput').value.trim().split(/[\s,，]+/).map(Number),v=C.checkOrder(result,ord);$('#orderResult').textContent=v.valid?'✓ 这是拟遗传全序。':'不满足判据：'+v.violations.map(x=>`g${x.relation} 的 hood 最大元 ${x.maximum} 位于内部`).join('；');}catch(e){$('#orderResult').textContent=e.message;}};
$('#exportButton').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='nakayama-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#t2M').onchange=renderT2;$('#loadT2').onclick=()=>{const m=Number($('#t2M').value);$('#nInput').value=2*m+1;$('#kindInput').value='directed';$('#modeInput').value='relations';updateLabel();$('#algebraInput').value=JSON.stringify(Array.from({length:m},(_,i)=>[2*i+1,2]));run();$('.workspace').scrollIntoView({behavior:'smooth'});};
renderT2();renderPair();run();
