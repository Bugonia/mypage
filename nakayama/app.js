'use strict';
const $=s=>document.querySelector(s), C=Nakayama;
let result=null,worker=null,workerUrl=null,lastInput=null;
const comma=x=>String(x).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const fractionNumber=s=>{const [a,b='1']=s.split('/');return Number(BigInt(a)*1000000000n/BigInt(b))/1e9;};
const fracOf=(a,b)=>b==='0'?0:Number(BigInt(a)*100000n/BigInt(b))/100000;
function inputValue(){let data;try{data=JSON.parse($('#algebraInput').value);}catch{throw Error(tr("请输入有效的 JSON 数组。"));}return {n:Number($('#nInput').value),kind:$('#kindInput').value,[$('#modeInput').value]:data};}
function stop(){if(worker)worker.terminate();if(workerUrl)URL.revokeObjectURL(workerUrl);worker=null;workerUrl=null;$('#busy').hidden=true;$('#cancelButton').hidden=true;$('#runButton').disabled=false;}
function run(){
  stop();result=null;$('#resultContent').hidden=true;$('#exportButton').disabled=true;$('#error').hidden=true;
  try{lastInput=inputValue();C.normalize(lastInput);}catch(e){$('#error').textContent=localizeMessage(e.message);$('#error').hidden=false;return;}
  $('#busy').hidden=false;$('#cancelButton').hidden=false;$('#runButton').disabled=true;
  try{
    const source=`const C=(${createNakayamaCore.toString()})();onmessage=e=>{try{postMessage({result:C.count(e.data)})}catch(x){postMessage({error:x.message})}};`;
    workerUrl=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));worker=new Worker(workerUrl);
    worker.onmessage=e=>{stop();if(e.data.error){$('#error').textContent=localizeMessage(e.data.error);$('#error').hidden=false;}else{result=e.data.result;renderResult();}};
    worker.onerror=e=>{stop();$('#error').textContent=tr("浏览器后台计算失败。请使用支持 Web Worker 的现代浏览器。");$('#error').hidden=false;};
    worker.postMessage(lastInput);
  }catch(e){stop();$('#error').textContent=localizeMessage(e.message);$('#error').hidden=false;}
}
function relationSets(r,n){const [s,l]=r,hood=new Set(),inside=new Set();for(let j=0;j<Math.min(n,l+1);j++)hood.add((s-1+j)%n+1);for(let j=1;j<=Math.min(n,l-1);j++)inside.add((s-1+j)%n+1);return{hood,inside,ends:new Set([s,(s+l-1)%n+1])};}
function renderResult(){
  const r=result;resetVisualization();$('#resultContent').hidden=false;$('#exportButton').disabled=false;
  $('#qValue').textContent=comma(r.q);$('#ratioValue').textContent=r.probability;$('#percentValue').textContent=(100*fractionNumber(r.probability)).toFixed(4)+'%';$('#mValue').textContent=r.m;$('#statesValue').textContent=r.states;$('#timeValue').textContent=r.seconds.toFixed(3)+' s';$('#algorithmValue').textContent=tr("精确算法：")+(r.algorithm==='T2 closed recurrence'?tr("T2 组合递推快速路径"):tr("X-set 关系子集迭代"));
  $('#warnings').replaceChildren();r.warnings.forEach(s=>{const p=document.createElement('p');p.className='note';p.textContent=localizeMessage(s);$('#warnings').append(p);});
  $('#sets').textContent=`X = {${r.x_set.join(', ')}}　 X₀ = {${r.x0_set.join(', ')}}`;
  $('#kupischValue').textContent='Kupisch = ['+r.kupisch.join(', ')+']';
  $('#relationChips').innerHTML=r.relations.map(([s,l],i)=>`<button data-relation="${i}">g${i+1} · [${s},${l}]</button>`).join('');
  $('#relationChips').querySelectorAll('button').forEach(b=>b.onclick=()=>drawAlgebra(Number(b.dataset.relation)));
  $('#relationDetail').textContent=r.m?tr("点击一条最小关系查看其 hood 与内部顶点。"):tr("没有零关系：所有 n! 个全序都符合判据。");drawAlgebra();
  renderBranches();
  $('#orderInput').value=r.witness_descending.join(', ');$('#orderResult').textContent=r.q==='0'?tr("此代数没有拟遗传全序。"):tr("已构造一个通过判据的全序（从大到小）。");
}
function preset(name){
  const p={t2:[7,'directed',[[1,2],[3,2],[5,2]]],dense:[7,'directed',[[1,2],[2,2],[3,2]]],cyclic:[4,'cyclic',[[4,2]]],zero:[3,'cyclic',[[1,4]]],hereditary:[7,'directed',[]]}[name];
  $('#nInput').value=p[0];$('#kindInput').value=p[1];$('#modeInput').value='relations';updateLabel();$('#algebraInput').value=JSON.stringify(p[2]);run();
}
function updateLabel(){const k=$('#modeInput').value==='kupisch';$('#inputLabel').textContent=k?tr("Kupisch 列（各顶点射影模的长度）"):tr("零关系数组（第二项不是终点）");$('#inputHint').textContent=k?tr("线性型：cₙ=1；循环型：所有 cᵢ≥2。均需满足相邻容许条件。"):tr("例：[3,2] 是路径 3 → 4 → 5 = 0。重复和冗余关系会自动去除。");}
$('#runButton').onclick=run;$('#cancelButton').onclick=()=>{stop();$('#error').textContent=tr("已取消，未输出不完整结果。");$('#error').hidden=false;};
$('#modeInput').onchange=updateLabel;document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>preset(b.dataset.preset));
$('#checkButton').onclick=()=>{try{const ord=$('#orderInput').value.trim().split(/[\s,，]+/).map(Number),v=C.checkOrder(result,ord);$('#orderResult').textContent=v.valid?tr("✓ 这是拟遗传全序。"):tr("不满足判据：")+v.violations.map(x=>(isEnglish?`the greatest vertex ${x.maximum} in the hood of g${x.relation} lies in its interior`:`g${x.relation} 的 hood 最大元 ${x.maximum} 位于内部`)).join(isEnglish?'; ':'；');}catch(e){$('#orderResult').textContent=localizeMessage(e.message);}};
$('#exportButton').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({...result,warnings:result.warnings.map(localizeMessage)},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='nakayama-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#t2M').onchange=renderT2;$('#loadT2').onclick=()=>{const m=Number($('#t2M').value);$('#nInput').value=2*m+1;$('#kindInput').value='directed';$('#modeInput').value='relations';updateLabel();$('#algebraInput').value=JSON.stringify(Array.from({length:m},(_,i)=>[2*i+1,2]));run();$('.workspace').scrollIntoView({behavior:'smooth'});};
initVisualization();updateLabel();renderT2();run();
