/* Exact X-set recurrence. No dependencies; exported to browser and Node. */
function createNakayamaCore() {
  'use strict';
  const bit = i => 1n << BigInt(i), has = (s,i) => (s & bit(i)) !== 0n;
  const gcd = (a,b) => { while(b) [a,b]=[b,a%b]; return a; };
  const fact = n => {let x=1n; for(let i=2;i<=n;i++) x*=BigInt(i); return x;};
  const ratio = (a,b) => {const d=gcd(a,b); return b/d===1n ? String(a/d) : `${a/d}/${b/d}`;};
  const integer = Number.isSafeInteger;
  function normalize({n,kind='directed',relations=[],kupisch=null}) {
    if(!integer(n)||n<1||n>200) throw Error('n 必须是 1–200 的整数。');
    if(!['directed','cyclic'].includes(kind)) throw Error('类型须为 directed 或 cyclic。');
    const cyc=kind==='cyclic';
    if(kupisch!==null) {
      const c=kupisch;
      if(!Array.isArray(c)||c.length!==n||c.some(x=>!integer(x)||x<1||x>1e9)) throw Error('Kupisch 列须含 n 个正整数，每项不超过 10⁹。');
      if(cyc ? (c.some(x=>x<2)||c.some((x,i)=>x>c[(i+1)%n]+1)) :
        (c[n-1]!==1||c.slice(0,-1).some((x,i)=>x<2||x>n-i||x>c[i+1]+1))) throw Error('Kupisch 列不满足所选连通 Nakayama 类型的容许条件。');
      relations=c.flatMap((x,i)=>(cyc||i<n-1)&&c[(i+1)%n]!==x-1?[[i+1,x]]:[]);
    }
    if(!Array.isArray(relations)||relations.length>1000) throw Error('关系须为数组，最多输入 1000 条。');
    relations.forEach(r=>{if(!Array.isArray(r)||r.length!==2||!r.every(integer)||r[0]<1||r[0]>n||r[1]<2||r[1]>1e9||(!cyc&&r[0]+r[1]>n)) throw Error('每条关系为 [起点,箭头数]；箭头数 ≥2，线性型起点+箭头数 ≤n。');});
    const unique=[...new Map(relations.map(r=>[r.join(','),r])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const minimal=unique.filter(([s,l],i)=>!unique.some(([t,k],j)=>{const d=cyc?(t-s+n)%n:t-s;return i!==j&&d>=0&&d+k<=l;}));
    if(cyc&&!minimal.length) throw Error('循环箭图必须有零关系：零理想对应无限维路径代数。');
    const removed=relations.length-minimal.length;
    return {n,kind,relations:minimal,warnings:removed?[`已去除 ${removed} 条重复或冗余关系；仅对最小生成元施加判据。`]:[]};
  }
  function masks(a) {
    const {n}=a,all=bit(n)-1n;
    const vs=(s,start,len)=>{if(len>=n)return all;let z=0n;for(let j=start;j<start+len;j++)z|=bit((s-1+j)%n);return z;};
    return a.relations.map(([s,l])=>[vs(s,0,l+1),vs(s,1,l-1),bit(s-1)|bit((s+l-1)%n)]);
  }
  function checkOrder(input,descending) {
    const a=normalize(input);
    if(!Array.isArray(descending)||descending.length!==a.n||!descending.every(integer)||new Set(descending).size!==a.n||descending.some(x=>x<1||x>a.n)) throw Error('请从大到小输入 1 至 n，每个顶点恰出现一次。');
    const bad=[];masks(a).forEach(([h,it],i)=>{const v=descending.find(x=>has(h,x-1));if(has(it,v-1))bad.push({relation:i+1,maximum:v});});
    return {valid:!bad.length,violations:bad};
  }
  function count(input,{maxStates=150000,timeoutMs=15000}={}) {
    const a=normalize(input),{n,kind,relations}=a,ms=masks(a),total=fact(n),memo=new Map(),started=Date.now();let states=0;
    const fastT2=kind==='directed'&&relations.length>0&&relations.every(([s,l],i)=>l===2&&(i===0||s===relations[i-1][0]+2));
    const t2Values=fastT2?t2(relations.length).map(v=>{const [a,b='1']=v.probability.split('/');return [BigInt(a),BigInt(b)];}):[];
    function t2State(state){let num=total,den=1n,run=0;for(let i=0;i<=relations.length;i++){if(i<relations.length&&has(state,i)){run++;continue;}if(run){const [a,b]=t2Values[run];num*=a;den*=b;run=0;}}return divide(num,den);}
    const decompose=state=>{let h=0n,it=0n,e=Array(n).fill(0n);ms.forEach(([hh,ii,ee],j)=>{if(has(state,j)){h|=hh;it|=ii;for(let x=0;x<n;x++)if(has(ee,x))e[x]|=bit(j);}});return [h,it,e];};
    const divide=(v,d)=>{if(v%d)throw Error('内部整除校验失败。');return v/d;};
    function f(state) {
      if(memo.has(state))return memo.get(state);
      if(++states>maxStates||Date.now()-started>timeoutMs)throw Error('超过计算预算，未返回近似值。请减少关系数或使用 Python 提高预算。');
      if(!state){memo.set(state,total);return total;}
      if(fastT2){const v=t2State(state);memo.set(state,v);return v;}
      const [h,it,e]=decompose(state);let sum=0n,den=0n;
      for(let x=0;x<n;x++)if(has(h,x)){den++;if(!has(it,x))sum+=f(state&~e[x]);}
      const v=divide(sum,den);memo.set(state,v);return v;
    }
    const full=bit(ms.length)-1n,q=f(full),[h,it,e]=decompose(full),xs=[],x0=[],branches=[];
    for(let x=0;x<n;x++)if(!has(it,x)){
      xs.push(x+1);if(!has(h,x))x0.push(x+1);
      const sub=full&~e[x];branches.push({vertex:x+1,type:!e[x]?'X0':!sub?'Z':'Y',deleted:ms.flatMap((_,i)=>has(e[x],i)?[i+1]:[]),count:String(divide(!e[x]?q:f(sub),BigInt(n)))});
    }
    const witness=[];let available=bit(n)-1n,state=full;
    if(q)while(available){const [,inner,ends]=decompose(state);let found=false;for(let x=0;x<n;x++)if(has(available,x)&&!has(inner,x)&&f(state&~ends[x])){witness.push(x+1);available^=bit(x);state&=~ends[x];found=true;break;}if(!found)throw Error('内部见证构造失败。');}
    const kupisch=Array.from({length:n},(_,i)=>{const v=i+1,options=relations.filter(([s])=>kind==='cyclic'||s>=v).map(([s,l])=>(kind==='cyclic'?(s-v+n)%n:s-v)+l);if(kind==='directed')options.push(n-v+1);return Math.min(...options);});
    return {...a,kupisch,m:ms.length,q:String(q),factorial:String(total),probability:ratio(q,total),x_set:xs,x0_set:x0,branches,witness_descending:witness,algorithm:fastT2?'T2 closed recurrence':'X-set memoized recurrence',states,seconds:(Date.now()-started)/1000};
  }
  function t2(m){
    if(!integer(m)||m<0||m>99)throw Error('T2 的 m 须为 0–99 的整数。');
    const qs=[1n];
    for(let k=1;k<=m;k++){
      let q=BigInt(4*k)*qs[k-1];
      for(let i=1;i<k;i++)q+=fact(2*k)/fact(2*i)/fact(2*k-2*i)*BigInt(2*i)*BigInt(2*k-2*i)*qs[i-1]*qs[k-i-1];
      qs.push(q);
    }
    return qs.map((q,i)=>({m:i,n:2*i+1,q:String(q),probability:ratio(q,fact(2*i+1))}));
  }
  return {normalize,count,checkOrder,t2};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createNakayamaCore();
else globalThis.Nakayama=createNakayamaCore();
