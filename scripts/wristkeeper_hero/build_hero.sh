#!/bin/sh
# Rebuilds wristkeeper/assets/hero/hero.js from hero.src.js (job 33).
# The page itself has no build step; this only regenerates the committed bundle.
# Needs: npm i three@0.186.1 esbuild in a scratch folder, then NODE_PATH=<that folder>/node_modules.
#
# The model: copy wristbox tools/opener-render/watch.py beside export_glb.py as watch_copy.py,
# point its FONT at the wristbox font, guard its render call with WK_EXPORT, then run
#   WK_EXPORT=1 WK_GLB=watch.glb blender -b --factory-startup --python watch_copy.py \
#     --python export_glb.py -- --mode dark --still --seconds --out /tmp/x
# centre.py finds the camera target that centres the watch on its alpha (hero.src.js TARGET).
# Draco decoder: three/examples/jsm/libs/draco/gltf/draco_decoder.wasm and draco_wasm_wrapper.js.
set -e
cd "$(dirname "$0")/../../wristkeeper/assets/hero"
npx esbuild hero.src.js --bundle --format=esm --minify --target=es2020 --legal-comments=none \
  --banner:js="/* Wristkeeper hero. Includes three.js 0.186.1 (MIT License, Copyright 2010-2025 three.js authors, https://github.com/mrdoob/three.js). */" \
  --outfile=hero.js
