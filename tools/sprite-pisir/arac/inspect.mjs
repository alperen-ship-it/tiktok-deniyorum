import fs from 'fs';
function load(p){const b=fs.readFileSync(p);const len=b.readUInt32LE(12);const j=JSON.parse(b.slice(20,20+len).toString());
 let bin=null;let o=20+len;if(o<b.length){const l2=b.readUInt32LE(o);bin=b.slice(o+8,o+8+l2);}return {j,bin};}
for(const p of process.argv.slice(2)){
 const {j,bin}=load(p);const acc=j.accessors||[];
 let tris=0;(j.meshes||[]).forEach(m=>m.primitives.forEach(pr=>{if(pr.indices!==undefined)tris+=acc[pr.indices].count/3;else if(pr.attributes.POSITION!==undefined)tris+=acc[pr.attributes.POSITION].count/3;}));
 const skins=(j.skins||[]).map(s=>s.joints.length);
 const rootJ=(j.skins||[]).map(s=>s.joints.slice(0,1).map(i=>j.nodes[i].name));
 let anims=(j.animations||[]).map(a=>{let d=0;a.samplers.forEach(s=>{const m=acc[s.input].max;if(m)d=Math.max(d,m[0]);});return a.name+':'+d.toFixed(2)});
 const imgs=(j.images||[]).length; const mats=(j.materials||[]).map(m=>m.name);
 console.log(JSON.stringify({file:p.split('/').slice(-2).join('/'),kb:Math.round(fs.statSync(p).size/1024),tris,meshes:(j.meshes||[]).length,skins,root:rootJ[0],imgs,mats:mats.length,nAnim:anims.length}));
 if(process.env.ANIMS&&anims.length)console.log('  ANIMS',anims.join(' | '));
 if(process.env.JOINTS&&j.skins)console.log('  JOINTS',j.skins[0].joints.map(i=>j.nodes[i].name).join(','));
}
