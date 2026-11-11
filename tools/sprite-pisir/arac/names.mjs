import fs from 'fs';
for(const p of process.argv.slice(2)){const b=fs.readFileSync(p);const len=b.readUInt32LE(12);const j=JSON.parse(b.slice(20,20+len).toString());
const png=(j.images||[]).map(i=>{const bv=j.bufferViews[i.bufferView];if(bv===undefined)return i.uri;const o=20+len+8+(bv.byteOffset||0);const s=b.slice(o,o+bv.byteLength);return s.readUInt32BE(16)+'x'+s.readUInt32BE(20)});
console.log(p.split('/').pop(),'| meshes:',(j.meshes||[]).map(m=>m.name).join(','),'| tex:',png.join(','));}
