import sys, json, struct, io
sys.path.insert(0, sys.argv[1])
import numpy as np
from PIL import Image
out = sys.argv[2]; files = sys.argv[3:]
CT = {5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def load(p):
    b = open(p,'rb').read(); L = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20+L]); o = 20+L; l2 = struct.unpack('<I', b[o:o+4])[0]; return j, b[o+8:o+8+l2]
def acc(j, bin_, i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; n = NC[a['type']]; dt = CT[a['componentType']]
    off = bv.get('byteOffset',0)+a.get('byteOffset',0); stride = bv.get('byteStride') or n*np.dtype(dt).itemsize
    arr = np.ndarray((a['count'],n), dtype=dt, buffer=bin_, offset=off, strides=(stride, np.dtype(dt).itemsize)); return arr.astype(np.float64)
def render(p, W=256, H=384):
    j, bin_ = load(p)
    tex = None
    if j.get('images'):
        bv = j['bufferViews'][j['images'][0]['bufferView']]; o = bv.get('byteOffset',0)
        tex = np.asarray(Image.open(io.BytesIO(bin_[o:o+bv['byteLength']])).convert('RGB'))
    P=[];C=[]
    for m in j['meshes']:
        for pr in m['primitives']:
            pos = acc(j,bin_,pr['attributes']['POSITION']); uv = acc(j,bin_,pr['attributes']['TEXCOORD_0']) if 'TEXCOORD_0' in pr['attributes'] else None
            idx = acc(j,bin_,pr['indices'])[:,0].astype(int).reshape(-1,3)
            mat = j['materials'][pr.get('material',0)] if j.get('materials') else {}
            bc = mat.get('pbrMetallicRoughness',{}).get('baseColorFactor',[.7,.7,.7,1])[:3]
            rng = np.random.default_rng(1)
            for k in range(6):
                r1 = rng.random((len(idx),1)); r2 = rng.random((len(idx),1)); f = r1+r2>1; r1[f]=1-r1[f]; r2[f]=1-r2[f]
                w0 = 1-r1-r2
                pp = pos[idx[:,0]]*w0+pos[idx[:,1]]*r1+pos[idx[:,2]]*r2
                if uv is not None and tex is not None:
                    u = uv[idx[:,0]]*w0+uv[idx[:,1]]*r1+uv[idx[:,2]]*r2
                    x = np.clip((u[:,0]%1)*tex.shape[1],0,tex.shape[1]-1).astype(int); y = np.clip((u[:,1]%1)*tex.shape[0],0,tex.shape[0]-1).astype(int)
                    cc = tex[y,x]/255.0
                else: cc = np.tile(bc,(len(pp),1))
                P.append(pp); C.append(cc)
    P=np.concatenate(P); C=np.concatenate(C)
    if np.ptp(P[:,2])>np.ptp(P[:,1]): P=np.stack([P[:,0],P[:,2],-P[:,1]],1); C=C**(1/2.2)
    # glTF Y up, front is +Z. view from +Z
    mn=P.min(0); mx=P.max(0); s=(H-20)/(mx[1]-mn[1]); 
    X=((P[:,0]-(mn[0]+mx[0])/2)*s+W/2).astype(int); Y=(H-10-(P[:,1]-mn[1])*s).astype(int); Z=P[:,2]
    img=np.full((H,W,3),235,np.uint8); zb=np.full((H,W),-1e9)
    order=np.argsort(Z)
    for i in order:
        x,y=X[i],Y[i]
        if 0<=x<W and 0<=y<H: img[y,x]=(C[i]*255).astype(np.uint8)
    # fill gaps by simple dilation
    img2=img.copy()
    for dy in (-1,0,1):
        for dx in (-1,0,1):
            sh=np.roll(np.roll(img,dy,0),dx,1); m=(img2==235).all(2)&~(sh==235).all(2); img2[m]=sh[m]
    return Image.fromarray(img2)
ims=[render(f) for f in files]
sheet=Image.new('RGB',(256*len(ims),384),(235,235,235))
for i,im in enumerate(ims): sheet.paste(im,(256*i,0))
sheet.save(out)
