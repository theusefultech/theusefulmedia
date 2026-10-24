#!/bin/sh
# Rebuilds wristkeeper/assets/hero/hero.js from hero.src.js (job 33).
# The page itself has no build step; this only regenerates the committed bundle.
# Needs: npm i three@0.186.1 esbuild in a scratch folder, then NODE_PATH=<that folder>/node_modules.
#
# The model (job 33b): copy wristbox tools/opener-render (main cd20c36, job 34's
# centred composition, run with its defaults) to a scratch folder. In the copy,
# watch_copy.py: point FONT at the wristbox font, and when WK_EXPORT is set write
# the centring (target, xfit over the swing) to WK_CENTRING and skip the Cycles
# render loop. Then
#   WK_EXPORT=1 WK_GLB=watch.glb WK_CENTRING=centring.json blender -b --factory-startup \
#     --python watch_copy.py --python export_glb.py -- --mode dark --seconds --out /tmp/x
# (no --still, so the centring fits the whole swing). centring.json gives
# TARGET and XFIT in hero.src.js. The still: watch_copy.py -- --mode dark --still
# --seconds --res 1800 --samples 256 --hide floor, cropped at zoom 1.1 about
# (0.5, the watch's height centre) to hero-watch-{720,1080,1440}.{avif,webp}.
# Draco decoder: three/examples/jsm/libs/draco/gltf/draco_decoder.wasm and draco_wasm_wrapper.js.
set -e
cd "$(dirname "$0")/../../wristkeeper/assets/hero"
npx esbuild hero.src.js --bundle --format=esm --minify --target=es2020 --legal-comments=none \
  --banner:js="/* Wristkeeper hero. Includes three.js 0.186.1 (MIT License, Copyright 2010-2025 three.js authors, https://github.com/mrdoob/three.js). */" \
  --outfile=hero.js
