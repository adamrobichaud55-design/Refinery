# A house that assembles itself from building blocks: the plain grey "guide" animation for an AI video service.
#
#   python3 tools/blender/blocks_house.py <out-folder> [--frames 144] [--w 720 --h 1280] [--samples 24] [--only 0 143] [--step 1]
#   ffmpeg -framerate 24 -i <out-folder>/f%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p house-blocks-guide.mp4
#
# Needs Blender as a Python module (pip install bpy). It draws on the processor alone; no graphics card is needed.
#
# What it makes: about a thousand blocks drop into place in building order (floor, walls course by course with real
# brick bond and openings for the door and windows, gables, roof tiles, chimney, two trees) while the camera circles
# slowly and moves in. Everything is one matte grey, lit softly: the shapes and the motion are exact and there is
# nothing else to distract. A video-to-video service is then given this clip and a description of the look wanted
# (glossy toy bricks, timber and glass, anything), and repaints it while keeping the shapes and the camera move.
# Change the house in pieces() and the timing in the calls to add().
import bpy, bmesh, math, random, sys, os
from mathutils import Vector, Euler

args = sys.argv[1:]; opt = {}
for k in ('--frames', '--w', '--h', '--samples', '--step'):
    if k in args: i = args.index(k); opt[k[2:]] = int(args[i + 1]); del args[i:i + 2]
only = None
if '--only' in args: i = args.index('--only'); only = (int(args[i + 1]), int(args[i + 2])); del args[i:i + 3]
if len(args) != 1: sys.exit('usage: blocks_house.py <out-folder> [--frames 144] [--w 720 --h 1280] [--samples 24] [--only a b] [--step 1]')
out = args[0]; os.makedirs(out, exist_ok=True)
FRAMES = opt.get('frames', 144); T = FRAMES / 144.0; random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ---- the kinds of block: each is one small mesh, shared by every block of its kind ----
def block(name, sx, sy, sz, round_=0.012):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=round_, segments=2, affect='EDGES')      # a softened edge catches the light, as a real moulded block does
    m = bpy.data.meshes.new(name); bm.to_mesh(m); bm.free()
    for p in m.polygons: p.use_smooth = False
    return m
BRICK = block('brick', 0.492, 0.242, 0.242, 0.018); HALF = block('half', 0.242, 0.242, 0.242, 0.018); PLATE = block('plate', 0.99, 0.99, 0.1); TILE = block('tile', 0.49, 0.445, 0.07, 0.012)
SLAB = block('slab', 0.5, 0.5, 0.06); BEAM = block('beam', 1.0, 0.08, 0.08, 0.006); LEAF = block('leaf', 0.5, 0.5, 0.5, 0.03); DOOR = block('door', 0.95, 0.07, 2.05, 0.01)

clay = bpy.data.materials.new('clay'); clay.use_nodes = True; b = clay.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.6, 0.6, 0.6, 1); b.inputs['Roughness'].default_value = 0.55
floor_m = bpy.data.materials.new('floor'); floor_m.use_nodes = True; b = floor_m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.42, 0.42, 0.42, 1); b.inputs['Roughness'].default_value = 0.85
for m in (BRICK, HALF, PLATE, TILE, SLAB, BEAM, LEAF, DOOR): m.materials.append(clay)

# ---- the house, as a list of blocks: where each ends up, and when it sets off ----
P = []   # each: mesh, place, turn (Euler), frame it sets off, scale
def add(mesh, x, y, z, start, rz=0.0, rx=0.0, scale=(1, 1, 1)): P.append({'mesh': mesh, 'at': Vector((x, y, z)), 'rot': Euler((rx, 0.0, rz)), 'start': start * T, 'scale': scale})
HX, HY, Z0, C = 4.0, 3.0, 0.1, 0.25                      # half the length and the depth of the house; the top of the floor; the height of a course
def hole(wall, u, z):
    """is this spot of a wall a door or a window? u runs along the wall"""
    if wall == 'front' and abs(u) < 0.5 and z < 2.15: return True
    if wall in ('front', 'back') and 1.75 < abs(u) < 3.25 and 0.95 < z < 2.15: return True
    if wall in ('left', 'right') and abs(u) < 1.0 and 0.95 < z < 2.15: return True
    return False
def course(wall, u0, cells, z, place):
    """one course of one wall: whole bricks where there is room for one, half bricks beside a door or window"""
    solid = [not hole(wall, u0 + 0.125 + 0.25 * c, z) for c in range(cells)]
    for c in range(0, cells, 2):
        if solid[c] and c + 1 < cells and solid[c + 1]: place(BRICK, u0 + 0.25 + 0.25 * c, c / cells)
        else:
            for d in (c, c + 1):
                if d < cells and solid[d]: place(HALF, u0 + 0.125 + 0.25 * d, d / cells)
def pieces():
    for i in range(8):                                   # the floor: plates, laid from the front corner
        for j in range(6): add(PLATE, -HX + 0.5 + i, -HY + 0.5 + j, Z0 - 0.05, 2 + (i + j) * 1.25)
    for k in range(11):                                  # the walls: eleven courses, the corners locked together as in real brickwork
        z = Z0 + C / 2 + C * k; t0 = 16 + k * 6.2; long_x = k % 2 == 0
        ux, uy = (-HX, -HY + 0.25) if long_x else (-HX + 0.25, -HY); cx, cy = (32, 22) if long_x else (30, 24)
        for wall, y, late in (('front', -HY + 0.125, 0), ('back', HY - 0.125, 2.5)): course(wall, ux, cx, z, lambda mesh, u, f, y=y, late=late: add(mesh, u, y, z, t0 + f * 5 + late))
        for wall, x, late in (('left', -HX + 0.125, 0), ('right', HX - 0.125, 2.5)): course(wall, uy, cy, z, lambda mesh, u, f, x=x, late=late: add(mesh, x, u, z, t0 + 1.2 + f * 5 + late, rz=math.pi / 2))
    top = Z0 + C * 11; pitch = math.radians(35)
    for wall, u in (('front', -2.4), ('front', 2.4), ('back', -2.4), ('back', 2.4)):          # window frames and the door
        y = (-HY + 0.125) if wall == 'front' else (HY - 0.125)
        for dz in (0.89, 2.06): add(BEAM, u * 2.5 / 2.4, y, dz, 84 + random.random() * 6, scale=(1.5, 1.6, 1))
        add(BEAM, u * 2.5 / 2.4, y, 1.48, 86 + random.random() * 6, scale=(1.5, 0.8, 0.6)); add(BEAM, u * 2.5 / 2.4, y, 1.48, 87 + random.random() * 6, scale=(0.06, 0.8, 14))
    for x in (-HX + 0.125, HX - 0.125):
        for dz in (0.89, 2.06): add(BEAM, x, 0, dz, 86 + random.random() * 6, rz=math.pi / 2, scale=(2.0, 1.6, 1))
        add(BEAM, x, 0, 1.48, 87 + random.random() * 6, rz=math.pi / 2, scale=(2.0, 0.8, 0.6))
    add(DOOR, 0, -HY + 0.125, Z0 + 1.03, 90)
    for k in range(9):                                   # the gables: the end walls carried up to the ridge
        h = C * (k + 0.5); half = HY - (h + C / 2) / math.tan(pitch); n = int(half / 0.5)
        for j in range(-n, n + 1):
            for x in (-HX + 0.125, HX - 0.125): add(BRICK if abs(j) < n or half - n * 0.5 > 0.2 else HALF, x, j * 0.5, top + h, 86 + k * 2.2 + random.random() * 2, rz=math.pi / 2)
    rows = 9; run = (HY + 0.4) / math.cos(pitch) / rows            # the roof: tiles laid up each slope, sweeping along the house
    for side in (-1, 1):
        for r in range(rows):
            d = (r + 0.5) * run; y = side * (HY + 0.4 - d * math.cos(pitch)); z = top - 0.4 * math.tan(pitch) + d * math.sin(pitch) + 0.1
            for i in range(18): add(TILE, -HX - 0.25 + 0.5 * i, y, z, 100 + i * 0.9 + r * 1.3 + (0 if side < 0 else 4), rx=side * -pitch)
    ridge = top + HY * math.tan(pitch) + 0.16
    for i in range(18): add(SLAB, -HX - 0.25 + 0.5 * i, 0, ridge, 124 + i * 0.35)
    for k in range(9):                                   # the chimney
        z = top + 1.0 + C * k; a = k % 2
        for dx, dy, rz in ((-0.125, -0.25 if a else 0.25, 0), (0.125 if a else -0.125, 0.25 if a else -0.25, 0), (-0.25 if a else 0.25, 0.125, math.pi / 2), (0.25 if a else -0.25, -0.125, math.pi / 2)):
            add(BRICK, 2.3 + dx * 1.0, 1.25 + dy * 1.0, z, 112 + k * 1.6 + random.random(), rz=rz)
    for (tx, ty, t0) in ((-3.9, -5.0, 40), (4.3, -4.4, 62)):          # two trees, and stepping stones to the door
        for k in range(5): add(HALF, tx, ty, 0.125 + 0.25 * k, t0 + k * 1.5)
        for (dx, dy, dz) in [(a, b_, c) for a in (-0.5, 0, 0.5) for b_ in (-0.5, 0, 0.5) for c in (0, 0.5, 1.0) if abs(a) + abs(b_) + abs(c - 0.5) < 1.3]: add(LEAF, tx + dx, ty + dy, 1.5 + dz, t0 + 9 + random.random() * 14)
    for i in range(5): add(SLAB, 0.15 * (-1) ** i, -HY - 0.6 - 0.75 * i, 0.03, 24 + i * 3, scale=(1.2, 1.2, 1))
pieces()

objs = []
for i, p in enumerate(P):
    o = bpy.data.objects.new(f'b{i:04d}', p['mesh']); sc.collection.objects.link(o); o.rotation_euler = p['rot']; o.scale = p['scale']; objs.append(o)
    p['from'] = p['at'] + Vector((random.uniform(-0.7, 0.7), random.uniform(-0.7, 0.7), random.uniform(3.2, 5.0))); p['spin'] = Vector((random.uniform(-1.4, 1.4), random.uniform(-1.4, 1.4), random.uniform(-0.9, 0.9)))
print(len(P), 'blocks', flush=True)

# the ground, the light, the camera
bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, 0)); bpy.context.object.data.materials.append(floor_m)
bpy.ops.object.light_add(type='SUN', location=(8, -10, 14)); sun = bpy.context.object; sun.data.energy = 3.4; sun.data.angle = math.radians(5); sun.rotation_euler = (math.radians(52), 0, math.radians(28))
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.78, 0.8, 0.84, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.55
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 38; cam.data.clip_end = 500
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = opt.get('samples', 24); sc.cycles.use_denoising = True; sc.cycles.max_bounces = 4; sc.render.use_persistent_data = True
sc.render.resolution_x, sc.render.resolution_y = opt.get('w', 720), opt.get('h', 1280); sc.view_settings.view_transform = 'Standard'

ease = lambda u: 1 - (1 - u) ** 3
def pose(f):
    """put every block where it is at frame f: waiting out of sight, on its way down, or home (with the small settle of a block clicking in)"""
    for p, o in zip(P, objs):
        u = (f - p['start']) / (9.0 * T)
        if u <= 0: o.hide_render = True; continue
        o.hide_render = False
        if u >= 1:
            v = (f - p['start'] - 9.0 * T) / (4.0 * T); dip = -0.035 * math.sin(math.pi * min(v, 1.0)) if v < 1 else 0.0; o.location = p['at'] + Vector((0, 0, dip)); o.rotation_euler = p['rot']
        else:
            e = ease(u); o.location = p['from'].lerp(p['at'], e); k = 1 - e; o.rotation_euler = Euler((p['rot'].x + p['spin'].x * k, p['spin'].y * k, p['rot'].z + p['spin'].z * k))
    u = f / max(1, FRAMES - 1); s = u * u * (3 - 2 * u); ang = math.radians(-118 + 34 * s); dist = 20.5 - 2.5 * s             # the camera: a slow quarter-circle, moving in and rising a little
    cam.location = (dist * math.cos(ang), dist * math.sin(ang), 4.6 + 1.8 * s); aim = Vector((0, 0, 2.9)) - cam.location; cam.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()

a, b_ = only if only else (0, FRAMES - 1)
for f in range(a, b_ + 1, opt.get('step', 1)):
    path = os.path.join(out, f'f{f:04d}.png')
    if os.path.exists(path): continue
    pose(f); sc.render.filepath = path; bpy.ops.render.render(write_still=True); print('frame', f, flush=True)
