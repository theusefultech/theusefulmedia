# Job 33: export the opener watch (leather strap) to GLB for the web.
# Runs after watch_copy.py in the same Blender session:
#   WK_EXPORT=1 WK_GLB=out.glb blender -b --factory-startup \
#     --python watch_copy.py --python export_glb.py -- --mode dark --still --seconds --out DIR
# Procedural materials become glTF materials: constant factors where the
# node tree is constant, and baked textures (Cycles) where it is not
# (the dial's radial gradient, the leather's grain normal and roughness).
import bpy, bmesh, math, os, json
from mathutils import Vector

OUT = os.environ["WK_GLB"]
BAKE = int(os.environ.get("WK_BAKE", "2048"))
scene = bpy.context.scene

# ---------------------------------------------------------------- strip the stage
keep_roots = {"turntable"}
def is_model(o):
    p = o
    while p.parent:
        p = p.parent
    return p.name in keep_roots
for o in list(scene.objects):
    if not is_model(o):
        bpy.data.objects.remove(o, do_unlink=True)

root = bpy.data.objects["turntable"]
root.rotation_euler = (0, 0, 0)   # the yaw is applied live in three.js
watch = bpy.data.objects["watch"]
bpy.context.view_layer.update()

# ---------------------------------------------------------------- text to mesh
for o in list(scene.objects):
    if o.type == "FONT":
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.convert(target="MESH")

# ---------------------------------------------------------------- seconds pivot
piv = bpy.data.objects.new("second_pivot", None)
scene.collection.objects.link(piv)
piv.parent = watch
bpy.context.view_layer.update()
for n in ("second", "weight"):
    o = bpy.data.objects.get(n)
    if o:
        mw = o.matrix_world.copy()
        o.parent = piv
        o.matrix_world = mw
bpy.context.view_layer.update()

def nodes_of(m):
    return m.node_tree.nodes, m.node_tree.links

def bsdf(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")

def unlink_input(m, name):
    p = bsdf(m)
    for l in list(p.inputs[name].links):
        m.node_tree.links.remove(l)

# ---------------------------------------------------------------- constant steel
for name in ("brushed_round", "brushed_long"):
    m = bpy.data.materials.get(name)
    if not m:
        continue
    for inp in ("Roughness", "Normal", "Tangent"):
        unlink_input(m, inp)
    p = bsdf(m)
    p.inputs["Roughness"].default_value = 0.30
    p.inputs["Anisotropic"].default_value = 0.0
for name in ("polished", "satin", "opaline"):
    m = bpy.data.materials.get(name)
    if m:
        unlink_input(m, "Tangent")
        bsdf(m).inputs["Anisotropic"].default_value = 0.0

# ---------------------------------------------------------------- sapphire
g = bpy.data.materials["sapphire"]
nt = g.node_tree
p = bsdf(g)
out = nt.nodes["Material Output"]
for l in list(out.inputs["Surface"].links):
    nt.links.remove(l)
nt.links.new(p.outputs[0], out.inputs["Surface"])
p.inputs["Base Color"].default_value = (1, 1, 1, 1)
p.inputs["Alpha"].default_value = 0.12
g.blend_method = "BLEND" if hasattr(g, "blend_method") else None
try:
    g.surface_render_method = "BLENDED"
except Exception:
    pass

# ---------------------------------------------------------------- UV helpers
def planar_uv(o, R):
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uv = me.uv_layers.active.data
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uv[li].uv = (v.x / (2 * R) + 0.5, v.y / (2 * R) + 0.5)

def smart_uv(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.003, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")

# ---------------------------------------------------------------- bake setup
scene.render.engine = "CYCLES"
scene.cycles.samples = 8
scene.cycles.use_denoising = False
scene.render.bake.margin = 8

def bake_into(objs, mats, img, kind):
    for m in mats:
        nt = m.node_tree
        n = nt.nodes.get("bake_target") or nt.nodes.new("ShaderNodeTexImage")
        n.name = "bake_target"
        n.image = img
        for x in nt.nodes:
            x.select = False
        n.select = True
        nt.nodes.active = n
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if kind == "NORMAL":
        bpy.ops.object.bake(type="NORMAL", normal_space="TANGENT", use_clear=True, margin=8)
    elif kind == "ROUGHNESS":
        bpy.ops.object.bake(type="ROUGHNESS", use_clear=True, margin=8)
    elif kind == "EMIT":
        bpy.ops.object.bake(type="EMIT", use_clear=True, margin=8)

# ---------------------------------------------------------------- the dial
dial = bpy.data.objects["dial"]
planar_uv(dial, 0.845)
dm = bpy.data.materials["dial"]
dial_img = bpy.data.images.new("dial_color", 512, 512, alpha=False)
nt = dm.node_tree; p = bsdf(dm)
# Bake the base colour exactly: route the ramp into an emission shader for the bake.
ramp_link = p.inputs["Base Color"].links[0]
em = nt.nodes.new("ShaderNodeEmission")
nt.links.new(ramp_link.from_socket, em.inputs["Color"])
mo = nt.nodes["Material Output"]
nt.links.new(em.outputs[0], mo.inputs["Surface"])
bake_into([dial], [dm], dial_img, "EMIT")
nt.links.new(p.outputs[0], mo.inputs["Surface"])
nt.nodes.remove(em)
for inp in ("Base Color", "Tangent"):
    unlink_input(dm, inp)
p.inputs["Anisotropic"].default_value = 0.0
tex = nt.nodes["bake_target"]; tex.name = "dial_tex"
nt.links.new(tex.outputs["Color"], p.inputs["Base Color"])
dial_img.pack()

# ---------------------------------------------------------------- the leather
LEATHER = {"leather_top", "leather_edge", "leather_lining", "thread"}
strap_objs = [o for o in scene.objects if o.type == "MESH" and any(s.material and s.material.name in LEATHER for s in o.material_slots)]
print("strap objects", [o.name for o in strap_objs], flush=True)
# Bake needs single user meshes with UVs.
for o in strap_objs:
    if o.data.users > 1:
        o.data = o.data.copy()
# Apply modifiers first so the bake matches the exported mesh.
for o in strap_objs:
    bpy.context.view_layer.objects.active = o
    for mod in list(o.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception as e:
            print("modifier", o.name, mod.name, e)
smart_uv(strap_objs)
lmats = [bpy.data.materials[n] for n in LEATHER if n in bpy.data.materials]
nimg = bpy.data.images.new("leather_normal", BAKE, BAKE, alpha=False, float_buffer=False)
nimg.colorspace_settings.name = "Non-Color"
bake_into(strap_objs, lmats, nimg, "NORMAL")
rimg = bpy.data.images.new("leather_rough", BAKE, BAKE, alpha=False)
rimg.colorspace_settings.name = "Non-Color"
bake_into(strap_objs, lmats, rimg, "ROUGHNESS")
for m in lmats:
    nt = m.node_tree; p = bsdf(m)
    for inp in ("Roughness", "Normal"):
        unlink_input(m, inp)
    tgt = nt.nodes["bake_target"]; nt.nodes.remove(tgt)
    tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = nimg
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 1.0
    nt.links.new(tn.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    tr = nt.nodes.new("ShaderNodeTexImage"); tr.image = rimg
    sp = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(tr.outputs["Color"], sp.inputs["Color"]); nt.links.new(sp.outputs["Green"], p.inputs["Roughness"])
    # Sheen and coat stay as glTF extensions (KHR_materials_sheen / clearcoat).
nimg.pack(); rimg.pack()

# Remove leftover bake nodes elsewhere.
for m in bpy.data.materials:
    if m.node_tree:
        n = m.node_tree.nodes.get("bake_target")
        if n:
            m.node_tree.nodes.remove(n)

# ---------------------------------------------------------------- export
bpy.ops.object.select_all(action="DESELECT")
for o in scene.objects:
    if is_model(o):
        o.select_set(True)
stats = {"objects": 0, "verts": 0, "tris": 0}
dg = bpy.context.evaluated_depsgraph_get()
for o in scene.objects:
    if o.type == "MESH" and is_model(o):
        e = o.evaluated_get(dg); me = e.to_mesh()
        me.calc_loop_triangles()
        stats["objects"] += 1; stats["verts"] += len(me.vertices); stats["tris"] += len(me.loop_triangles)
        e.to_mesh_clear()
print("stats", stats, flush=True)

bpy.ops.export_scene.gltf(
    filepath=OUT, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
    export_cameras=False, export_lights=False,
    export_image_format=os.environ.get("WK_IMGFMT", "WEBP"), export_image_quality=int(os.environ.get("WK_Q", "82")),
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=10,
    export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12,
)
meta = {"pivotH": root.location.z, "stats": stats}
with open(OUT + ".json", "w") as fh:
    json.dump(meta, fh)
print("exported", OUT, os.path.getsize(OUT), flush=True)
