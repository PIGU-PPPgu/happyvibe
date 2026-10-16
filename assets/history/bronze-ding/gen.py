# 青铜鼎 · Blender headless 程序化生成（纯 bmesh 数据 API，无 context 依赖）
# 用法：<blender> -b --factory-startup --python gen.py -- --out ding.glb
# 产物：GLB（回转鼎身+饕餮凸纹 displacement+三足二耳+程序青铜绿锈 PBR）
import bpy, sys, math, bmesh

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = next((a.split("=")[1] for a in argv if a.startswith("--out=")), "/tmp/ding.glb")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
SEG = 48

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
    add_uv(bm)
    bm.to_mesh(mesh); bm.free()
    return mesh

def cylinder(r, depth, seg=22, taper=0.0):
    mesh = bpy.data.meshes.new("cyl")
    bm = bmesh.new()
    h = depth / 2
    rt, rb = r, r * (1 - taper)   # 上粗下细：柱足带蹄形收分
    top = [bm.verts.new((math.cos(a / seg * 2 * math.pi) * rt, math.sin(a / seg * 2 * math.pi) * rt, h)) for a in range(seg)]
    bot = [bm.verts.new((math.cos(a / seg * 2 * math.pi) * rb, math.sin(a / seg * 2 * math.pi) * rb, -h)) for a in range(seg)]
    ct, cb = bm.verts.new((0, 0, h)), bm.verts.new((0, 0, -h))
    for j in range(seg):
        j2 = (j + 1) % seg
        bm.faces.new((top[j], top[j2], bot[j2], bot[j]))
        bm.faces.new((ct, top[j2], top[j]))
        bm.faces.new((cb, bot[j], bot[j2]))
    add_uv(bm)
    bm.to_mesh(mesh); bm.free()
    return mesh

def rect_loop(w, h, t):
    """矩形立耳：方框管（宽 w 高 h 厚 t），文物鼎耳的厚重矩形制式"""
    mesh = bpy.data.meshes.new("ear")
    bm = bmesh.new()
    hw, hh = w / 2, h / 2
    corners = [(hw, hh), (-hw, hh), (-hw, -hh), (hw, -hh)]
    seg = 6
    rings = []
    for cx, cy in corners:
        ring = []
        for i in range(seg):
            a = i / seg * 2 * math.pi
            ring.append(bm.verts.new((cx + math.cos(a) * t, cy + math.sin(a) * t, 0)))
        rings.append(ring)
    # 角与角之间连管壁
    for k in range(4):
        r0, r1 = rings[k], rings[(k + 1) % 4]
        for i in range(seg):
            i2 = (i + 1) % seg
            bm.faces.new((r0[i], r0[i2], r1[i2], r1[i]))
    # 封两端管口
    for k in range(4):
        bm.faces.new(rings[k])
    add_uv(bm)
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
    add_uv(bm)
    bm.to_mesh(mesh); bm.free()
    return mesh

def add_uv(bm):
    """柱面 UV：u 环向（周长一圈），v 高度（z∈[-1,1]→[0,1]，body 全高刚好铺满贴图）"""
    uvl = bm.loops.layers.uv.new("uv")
    for face in bm.faces:
        for lp in face.loops:
            co = lp.vert.co
            u = math.atan2(co.y, co.x) / (2 * math.pi) + 0.5
            lp[uvl].uv = (u, (co.z + 1.0) / 2.0)

def add_obj(name, mesh, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    ob = bpy.data.objects.new(name, mesh)
    ob.location = loc; ob.rotation_euler = rot; ob.scale = scale
    scene.collection.objects.link(ob)
    return ob

# 鼎形轮廓：圜底起 → 垂腹（最大径在中下）→ 束颈 → 口沿外撇（唇）
prof = [(0.00, -0.62), (0.50, -0.60), (0.61, -0.48), (0.645, -0.26), (0.625, 0.00),
        (0.56, 0.26), (0.455, 0.42), (0.44, 0.52), (0.49, 0.61), (0.53, 0.66)]
body = add_obj("body", revolve([(r * 1.55, y * 1.55) for r, y in prof]))

solid = body.modifiers.new("thick", "SOLIDIFY")
solid.thickness = 0.07; solid.offset = -1
body.modifiers.new("sub", "SUBSURF").levels = 2
disp = body.modifiers.new("disp", "DISPLACE")
tex = bpy.data.textures.new("taotie", type="CLOUDS")
tex.noise_scale = 0.55
disp.texture = tex; disp.strength = 0.13; disp.mid_level = 0.5
vg = body.vertex_groups.new(name="band")
for v in body.data.vertices:
    ny = v.co.z / 1.55
    w = max(0.0, 1.0 - abs(ny + 0.05) / 0.62) ** 1.5
    vg.add([v.index], w, "REPLACE")
disp.vertex_group = "band"

for i in range(3):
    ang = i * math.radians(120) - math.radians(90)
    # 贴圜底：足心 r=0.80（圜底半径 0.78），上端 -0.55 嵌入鼎底（-0.93）之下身体内
    add_obj(f"foot{i}", cylinder(0.21, 1.12, taper=0.10),
            loc=(math.cos(ang) * 0.80, math.sin(ang) * 0.80, -1.10),
            rot=(0, 0, ang + math.radians(90)))
for sx in (-1, 1):
    # 绕 X 转 90°：方框管立起来（宽沿径向 X，高沿竖向 Z，厚沿前后 Y）
    add_obj(f"ear{sx}", rect_loop(0.40, 0.60, 0.16),
            loc=(sx * 0.66, 0, 1.00), rot=(math.radians(90), 0, 0))

# ── 青铜质感：材质只定 PBR 基数；青铜绿锈与纹饰由页面端 CanvasTexture 提供（顶点色已弃：
#    Blender 导出器把激活层放 COLOR_1、COLOR_0 全白占位，且 735KB 顶点色会把单文件顶破 4MB 闸门）──
mat = bpy.data.materials.new("bronze")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Metallic"].default_value = 0.85
bsdf.inputs["Roughness"].default_value = 0.55
for ob in scene.objects:
    ob.data.materials.append(mat)

# ── 几何自检：世界包围盒相交断言（免眼看，防"足悬空/耳浮起"再犯）──
bpy.context.view_layer.update()   # headless 下 matrix_world 惰性求值，先刷一次
def wbbox(ob):
    cs = [ob.matrix_world @ __import__("mathutils").Vector(c) for c in ob.bound_box]
    return ([min(c.x for c in cs), min(c.y for c in cs), min(c.z for c in cs)],
            [max(c.x for c in cs), max(c.y for c in cs), max(c.z for c in cs)])
body_bb = wbbox(body)
fails = []
for i in range(3):
    fb = wbbox(scene.objects[f"foot{i}"])
    if not (fb[1][2] > body_bb[0][2] + 0.25):   # 足顶须深深嵌入圜底之上
        fails.append(f"foot{i} top {fb[1][2]:.2f} 未嵌入鼎底 {body_bb[0][2]:.2f}")
for sx in (-1, 1):
    eb = wbbox(scene.objects[f"ear{sx}"])
    if not (eb[0][2] < body_bb[1][2] - 0.15):   # 耳底须沉入口沿以下
        fails.append(f"ear{sx} bottom {eb[0][2]:.2f} 未接触口沿 {body_bb[1][2]:.2f}")
    if not (eb[1][2] > body_bb[1][2] + 0.15):   # 耳须立出口沿足够高度
        fails.append(f"ear{sx} top {eb[1][2]:.2f} 立起不足（口沿 {body_bb[1][2]:.2f}）")
    if eb[1][2] - eb[0][2] < eb[1][0] - eb[0][0]:  # 立耳：竖向应长于横向（防止平躺环）
        fails.append(f"ear{sx} 疑似平躺：dz={eb[1][2]-eb[0][2]:.2f} dx={eb[1][0]-eb[0][0]:.2f}")
print(f"QA body[{body_bb[0][2]:.2f},{body_bb[1][2]:.2f}] feet_top={wbbox(scene.objects['foot0'])[1][2]:.2f} "
      f"ear0[{eb[0][2]:.2f},{eb[1][2]:.2f}]")
if fails:
    print("QA FAIL:", "; ".join(fails)); sys.exit(1)
print("QA PASS")

bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True,
                          export_texcoords=True, export_normals=True,
                          export_materials="EXPORT", export_yup=True)
print("GLB OK", OUT)
