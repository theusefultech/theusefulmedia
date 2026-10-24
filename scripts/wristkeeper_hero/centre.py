# Iterate the camera target so the watch (no floor, no shadow) is centred on its alpha at rest 0.
import subprocess, sys, math, json, os
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
tx, ty, tz = 0.0, 0.3, 1.97
res = 400
fov = 2 * math.atan(18 / 70)
for it in range(4):
    out = f"{here}/centre/it{it}"
    cmd = ["blender", "-b", "--factory-startup", "--python", f"{here}/watch_copy.py", "--", "--mode", "dark", "--still", "--seconds",
           "--rest", "0", "--res", str(res), "--samples", "8", "--out", out, "--hide", "floor", "--tx", str(tx), "--ty", str(ty), "--tz", str(tz)]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    im = Image.open(out + "/f_0000.png").getchannel("A").point(lambda a: 255 if a > 128 else 0)
    x0, y0, x1, y1 = im.getbbox()
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = cx - res / 2, cy - res / 2
    # world units per pixel at the target distance
    upp = 2 * 8.7 * math.tan(fov / 2) / res
    print(it, "bbox", (x0, y0, x1, y1), "off px", round(dx, 1), round(dy, 1), "target", (round(tx, 4), round(ty, 4), round(tz, 4)), flush=True)
    if abs(dx) < 0.6 and abs(dy) < 0.6:
        break
    # image right = world +x; image down = world -z (camera looks along +y, 13 deg down)
    tx += dx * upp
    tz -= dy * upp / math.cos(math.radians(13))
json.dump({"tx": tx, "ty": ty, "tz": tz, "bbox": [x0, y0, x1, y1], "res": res}, open(f"{here}/centre/target.json", "w"))
