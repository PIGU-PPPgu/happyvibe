# 青铜鼎 · Blender headless 程序化生成（纯 bmesh 数据 API，无 context 依赖）
# 用法：<blender> -b --factory-startup --python gen.py -- --out ding.glb
# 产物：GLB（回转鼎身+饕餮凸纹 displacement+三足二耳+程序青铜绿锈 PBR）
import bpy, sys, math, bmesh

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = next((a.split("=")[1] for a in argv if a.startswith("--out=")), "/tmp/ding.glb")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
SEG = 40

def revolve(prof, seg=SEG):
    mesh = bpy.data.meshes.new("rev")
    bm = bmesh.new()
    rings, centers = [], []
    for r, y in prof:
        if r < 1e-6:
            centers.append(bm.verts.new((0, 0, y)))
            rings.append(None)
        else:
            rings.append([bm.verts.new((math.cos(a / seg * 2 * math.pi) * r,
                                        math.sin(a / seg * 2 * math.pi) * r, y)) for a in range(seg)])
            centers.append(None)
    for i in range(len(prof) - 1):
        if rings[i] is None:
            c = centers[i]
            for j in range(seg):
                bm.faces.new((c, rings[i + 1][(j + 1) % seg], rings[i + 1][j]))
        elif rings[i + 1] is None:
            c = centers[i + 1]
            for j in range(seg):
                bm.faces.new((c, rings[i][j], rings[i][(j + 1) % seg]))
        else:
            for j in range(seg):
                j2 = (j + 1) % seg
                bm.faces.new((rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]))
    bm.to_mesh(mesh); bm.free()
    return mesh

def cylinder(r, depth, seg=20, taper=0.0):
    mesh = bpy.data.meshes.new("cyl")
    bm = bmesh.new()
    h = depth / 2
    rt, rb = r * (1 - taper), r
    top = [bm.verts.new((math.cos(a / seg * 2 * math.pi) * rt, math.sin(a / seg * 2 * math.pi) * rt, h)) for a in range(seg)]
    bot = [bm.verts.new((math.cos(a / seg * 2 * math.pi) * rb, math.sin(a / seg * 2 * math.pi) * rb, -h)) for a in range(seg)]
    ct, cb = bm.verts.new((0, 0, h)), bm.verts.new((0, 0, -h))
    for j in range(seg):
        j2 = (j + 1) % seg
        bm.faces.new((top[j], top[j2], bot[j2], bot[j]))
        bm.faces.new((ct, top[j2], top[j]))
        bm.faces.new((cb, bot[j], bot[j2]))
    bm.to_mesh(mesh); bm.free()
    return mesh

def torus(R, r, maj=24, mnr=10):
    mesh = bpy.data.meshes.new("tor")
    bm = bmesh.new()
    for i in range(maj):
        u = i / maj * 2 * math.pi
        for j in range(mnr):
            v = j / mnr * 2 * math.pi
            cx, cz = (R + r * math.cos(v)) * math.cos(u), (R + r * math.cos(v)) * math.sin(u)
            y = r * math.sin(v)
            bm.verts.new((cx, y, cz))
    bm.verts.ensure_lookup_table()
    vs = bm.verts
    def V(i, j): return vs[i * mnr + (j % mnr)]
    for i in range(maj):
        i2 = (i + 1) % maj
        for j in range(mnr):
            bm.faces.new((V(i, j), V(i2, j), V(i2, j + 1), V(i, j + 1)))
    bm.to_mesh(mesh); bm.free()
    return mesh

def add_obj(name, mesh, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    ob = bpy.data.objects.new(name, mesh)
    ob.location = loc; ob.rotation_euler = rot; ob.scale = scale
    scene.collection.objects.link(ob)
    return ob

prof = [(0.00, -0.62), (0.42, -0.62), (0.50, -0.50), (0.545, -0.30), (0.56, -0.05),
        (0.545, 0.18), (0.50, 0.36), (0.455, 0.44), (0.44, 0.50), (0.452, 0.545), (0.47, 0.575)]
body = add_obj("body", revolve([(r * 1.55, y * 1.55) for r, y in prof]))

solid = body.modifiers.new("thick", "SOLIDIFY")
solid.thickness = 0.07; solid.offset = -1
body.modifiers.new("sub", "SUBSURF").levels = 1
disp = body.modifiers.new("disp", "DISPLACE")
tex = bpy.data.textures.new("taotie", type="CLOUDS")
tex.noise_scale = 0.34
disp.texture = tex; disp.strength = 0.045; disp.mid_level = 0.5
vg = body.vertex_groups.new(name="band")
for v in body.data.vertices:
    ny = v.co.z / 1.55
    w = max(0.0, 1.0 - abs(ny + 0.05) / 0.62) ** 1.5
    vg.add([v.index], w, "REPLACE")
disp.vertex_group = "band"

for i in range(3):
    ang = i * math.radians(120) - math.radians(90)
    add_obj(f"foot{i}", cylinder(0.16, 0.78, taper=0.14),
            loc=(math.cos(ang) * 1.30, math.sin(ang) * 1.30, -0.95),
            rot=(0, 0, ang + math.radians(90)))
for sx in (-1, 1):
    add_obj(f"ear{sx}", torus(0.24, 0.055),
            loc=(sx * 0.95, 0, 1.05), rot=(math.radians(90), 0, 0), scale=(1, 1, 1.3))

# ── 青铜质感：顶点色（mathutils.noise 连续 3D 噪声混铜绿与金铜；glTF COLOR_0 原生支持） ──
from mathutils import noise as mbnoise
A = (0.255, 0.335, 0.225)   # 铜绿
B = (0.44, 0.31, 0.155)     # 金铜
mat = bpy.data.materials.new("bronze")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Metallic"].default_value = 0.85
bsdf.inputs["Roughness"].default_value = 0.55
for ob in scene.objects:
    ob.data.materials.append(mat)
    # 只保留一层顶点色（多余层会被导出成 COLOR_1，three.js 只认 COLOR_0）
    while len(ob.data.color_attributes) > 0:
        ob.data.color_attributes.remove(ob.data.color_attributes[0])
    lc = ob.data.color_attributes.new(name="rust", type="BYTE_COLOR", domain="CORNER")
    ob.data.color_attributes.active_color = lc   # 必须：非激活层会被导出成 COLOR_1（three 不读）
    try: lc.active_render = True
    except AttributeError: pass
    vcol = lc.data
    rng = __import__("random").Random(ob.name)
    for i, v in enumerate(ob.data.vertices):
        n = mbnoise.noise(v.co * 2.6) * 0.5 + 0.5          # 大块斑驳
        n2 = mbnoise.noise(v.co * 9.0) * 0.5 + 0.5         # 细颗粒
        m = min(1.0, max(0.0, n * 0.72 + n2 * 0.28 + rng.random() * 0.08 - 0.04))
        col = tuple(A[k] * m + B[k] * (1 - m) for k in range(3)) + (1.0,)
        vcol[i].color = col

bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True,
                          export_texcoords=True, export_normals=True,
                          export_materials="EXPORT", export_yup=True)
print("GLB OK", OUT)
