# GLB 后处理：把 Blender 导出的 COLOR_1（我们的锈色层）提升为 COLOR_0（three.js 只读 COLOR_0）
# 用法：python3 swap_color0.py in.glb out.glb
import struct, json, sys

src, dst = sys.argv[1], sys.argv[2]
d = open(src, 'rb').read()
magic, ver, _ = struct.unpack('<III', d[:12])
assert magic == 0x46546C67, 'not glb'
clen, ctype = struct.unpack('<II', d[12:20])
j = json.loads(d[20:20 + clen])
blen, btype = struct.unpack('<II', d[20 + clen:20 + clen + 8])
bin0 = 20 + clen + 8
bindata = bytearray(d[bin0:bin0 + blen])

# 找出所有有 COLOR_1 的 primitive：把 COLOR_1(VEC3) 转 VEC4(+alpha) 作为新 COLOR_0
new_accessors = []
for mesh in j.get('meshes', []):
    for prim in mesh.get('primitives', []):
        attrs = prim.get('attributes', {})
        if 'COLOR_1' not in attrs or 'COLOR_0' not in attrs:
            continue
        acc = dict(j['accessors'][attrs['COLOR_1']])
        bv = j['bufferViews'][acc['bufferView']]
        off = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
        cnt = acc['count']
        comp = acc.get('componentType', 5126)
        if comp == 5121:
            raw = struct.unpack_from('<%dB' % (cnt * 3), bindata, off)
            rgb = [v / 255 for v in raw]
        else:
            rgb = list(struct.unpack_from('<%df' % (cnt * 3), bindata, off))
        # VEC4 数据追加到 bin 尾（4 字节对齐）
        while len(bindata) % 4:
            bindata.append(0)
        new_off = len(bindata)
        if comp == 5121:
            # 逐点补 alpha=1
            out = []
            for i in range(cnt):
                out += [round(rgb[i * 3] * 255), round(rgb[i * 3 + 1] * 255), round(rgb[i * 3 + 2] * 255), 255]
            bindata += struct.pack('<%dB' % (cnt * 4), *out)
        else:
            out = []
            for i in range(cnt):
                out += [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2], 1.0]
            bindata += struct.pack('<%df' % (cnt * 4), *out)
        new_bv_idx = len(j['bufferViews'])
        j['bufferViews'].append({
            'buffer': 0, 'byteOffset': new_off,
            'byteLength': cnt * (1 if comp == 5121 else 4) * 4,
        })
        new_acc_idx = len(j['accessors'])
        j['accessors'].append({
            'bufferView': new_bv_idx, 'componentType': comp, 'count': cnt,
            'type': 'VEC4', 'normalized': comp == 5121,
        })
        # 覆盖 COLOR_0，删 COLOR_1
        attrs['COLOR_0'] = new_acc_idx
        del attrs['COLOR_1']
        new_accessors.append(new_acc_idx)

jstr = json.dumps(j, separators=(',', ':')).encode()
pad = (4 - len(jstr) % 4) % 4
jstr += b' ' * pad
binpad = (4 - len(bindata) % 4) % 4
bindata += b'\x00' * binpad
total = 12 + 8 + len(jstr) + 8 + len(bindata)
out = struct.pack('<III', 0x46546C67, 2, total)
out += struct.pack('<II', len(jstr), 0x4E4F534A) + jstr
out += struct.pack('<II', len(bindata), 0x004E4942) + bytes(bindata)
open(dst, 'wb').write(out)
print('swapped %d prims, out %d bytes' % (len(new_accessors), total))
