import fs from 'fs';
const p=process.argv[2];const j=JSON.parse(fs.readFileSync(p,'utf8'));const acc=j.accessors;
let tris=0;(j.meshes||[]).forEach(m=>m.primitives.forEach(pr=>{tris+=(pr.indices!==undefined?acc[pr.indices].count:acc[pr.attributes.POSITION].count)/3}));
console.log('meshes',(j.meshes||[]).map(m=>m.name),'tris',tris,'skins',(j.skins||[]).map(s=>s.joints.length),'images',(j.images||[]).length);
console.log((j.animations||[]).map(a=>{let d=0;a.samplers.forEach(s=>{const m=acc[s.input].max;if(m)d=Math.max(d,m[0])});return a.name+':'+d.toFixed(2)}).join(' | '));
if(j.skins)console.log('JOINTS',j.skins[0].joints.map(i=>j.nodes[i].name).join(','));
