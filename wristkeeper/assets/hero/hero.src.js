// Wristkeeper hero: the app's opener watch, exported from tools/opener-render
// (Blender) to GLB, drawn live with three.js 0.186.1.
// Built into hero.js by scripts/build_wk_hero.sh (esbuild, one minified file).
// The page loads it only when WebGL works, motion is allowed and the device
// is not on a slow connection; everyone else keeps the path traced still.
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, NeutralToneMapping,
  SRGBColorSpace, DirectionalLight, Vector3, Quaternion, Color, MeshPhysicalMaterial,
  FrontSide, CanvasTexture, LinearFilter
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const BASE = "/wristkeeper/assets/hero/";
// The Blender camera (watch.py): 70 mm lens on a 36 mm sensor, square frame,
// 8.7 units from the target, 13 degrees above it. Blender z up becomes y up.
// The page shows the render zoomed 1.3 about its centre, so the live camera
// narrows its field of view by the same factor.
const ZOOM = 1.3;
const FOV = 2 * Math.atan(18 / 70 / ZOOM) * 180 / Math.PI;
const DIST = 8.7, EL = 13 * Math.PI / 180;
// The target centres the watch on its alpha at rest (render/centre.py):
// Blender (0.0951, 0.3, 2.0791), the same target as the still.
const TARGET = new Vector3(0.0951, 2.0791, -0.3);
const REST = 0;                      // dial to the camera; the swing is symmetric about it
const SWING = 11 * Math.PI / 180;    // the slow idle turn
const PERIOD = 9;                    // seconds per idle swing

export function start(host, still) {
  const canvas = document.createElement("canvas");
  canvas.className = "hero-canvas";
  canvas.setAttribute("aria-hidden", "true");
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    return Promise.reject(e);
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.38;
  const key = new DirectionalLight(0xffffff, 1.7); key.position.set(-3.5, 8, 3.5); scene.add(key);
  const rim = new DirectionalLight(0xc8d4ff, 2.6); rim.position.set(2, 4.5, -6.5); scene.add(rim);
  const strip = new DirectionalLight(0xfff4ea, 0.9); strip.position.set(6.2, 2.6, 0.6); scene.add(strip);
  const lav = new DirectionalLight(0x9c88f2, 0.9); lav.position.set(-5.5, 2.4, -0.5); scene.add(lav);

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(TARGET.x, TARGET.y + DIST * Math.sin(EL), TARGET.z + DIST * Math.cos(EL));
  camera.lookAt(TARGET);

  const draco = new DRACOLoader().setDecoderPath(BASE + "draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);

  return new Promise((resolve, reject) => {
    loader.load(BASE + "watch.glb", (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      const turntable = model.getObjectByName("turntable") || model;
      const pivot = model.getObjectByName("second_pivot");
      
      model.traverse((o) => {
        if (!o.isMesh) return;
        const m = o.material;
        if (m.name === "sapphire") {
          // A clear crystal that only reflects: cheaper than transmission
          // and close to the path traced dome.
          o.material = new MeshPhysicalMaterial({
            color: 0xffffff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.1,
            depthWrite: false, envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0.02, side: FrontSide
          });
          o.renderOrder = 10;
        } else if (/^(leather|thread)/.test(m.name) && m.isMeshPhysicalMaterial) {
          // Blender's sheen weight (0.04 to 0.3) arrives as a white sheen colour.
          const w = m.name === "thread" ? 0.3 : m.name === "leather_lining" ? 0.15 : 0.06;
          m.sheenColor = new Color(w, w, w);
          m.envMapIntensity = 0.8;
        } else if (m.name === "dial") {
          m.envMapIntensity = 0.75;
          // The sunburst: anisotropy running out from the centre.
          m.anisotropy = 0.6;
          m.anisotropyMap = radialMap();
        } else if (/polished|satin|brushed|opaline/.test(m.name)) {
          m.envMapIntensity = /polished/.test(m.name) ? 0.8 : 1.1;
        }
      });

      // The seconds hand turns about the dial's own axis.
      // The glTF axis change leaves the pivot with a rest rotation, so the
      // tick is applied after it, about the dial normal in the pivot's frame.
      let axis = new Vector3(0, 0, 1);
      const rest = pivot ? pivot.quaternion.clone() : null;
      const tick = new Quaternion();
      if (pivot) {
        model.updateMatrixWorld(true);
        const q = new Quaternion();
        pivot.getWorldQuaternion(q);
        axis = new Vector3(0, 0, 1).applyQuaternion(q.invert()).normalize();
      }

      host.appendChild(canvas);
      let w = 0, h = 0;
      const size = () => {
        const r = host.getBoundingClientRect();
        if (r.width === w && r.height === h) return;
        w = r.width; h = r.height;
        const dpr = Math.min(window.devicePixelRatio || 1, w < 600 ? 1.75 : 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Keep the Blender framing on the shorter side.
        camera.fov = w >= h ? FOV : 2 * Math.atan(Math.tan(FOV * Math.PI / 360) / (w / h)) * 180 / Math.PI;
        camera.updateProjectionMatrix();
      };
      size();
      new ResizeObserver(size).observe(host);

      // Scroll: as the hero leaves, the watch turns its dial to the camera.
      let progress = 0, eased = 0;
      const onScroll = () => {
        const r = host.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        progress = Math.min(1, Math.max(0, (vh * 0.5 - (r.top + r.height * 0.5)) / (vh * 0.75)));
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      let visible = true, running = false, raf = 0;
      const t0 = performance.now();
      const loop = () => {
        raf = 0;
        if (!visible || document.hidden) { running = false; return; }
        const t = (performance.now() - t0) / 1000;
        eased += (progress - eased) * 0.12;
        const idle = Math.sin(2 * Math.PI * t / PERIOD) * SWING * (1 - eased);
        turntable.rotation.y = REST * (1 - eased) + idle;
        turntable.rotation.x = -EL * eased;   // leans back until the dial faces the camera square on
        // A quartz tick: one step a second, with a short settle.
        if (pivot) {
          const s = (performance.now() - t0) / 1000;
          const whole = Math.floor(s), f = s - whole;
          const step = whole + Math.min(1, f / 0.12) - Math.max(0, Math.sin(Math.min(1, f / 0.24) * Math.PI)) * 0.04 * (f < 0.24 ? 1 : 0);
          pivot.quaternion.copy(rest).multiply(tick.setFromAxisAngle(axis, -step * Math.PI / 30));
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };
      const run = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) run(); }).observe(host);
      document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) run(); });

      // First frame, then fade over the still.
      renderer.render(scene, camera);
      requestAnimationFrame(() => {
        host.classList.add("is-live");
        run();
        resolve();
      });
    }, undefined, reject);
  });
}

// RG: the direction (radial), B: strength. Tangent space of the dial's planar UVs.
function radialMap() {
  const n = 128, c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d"), img = g.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = (x + 0.5) / n - 0.5, v = 0.5 - (y + 0.5) / n;
    const l = Math.hypot(u, v) || 1;
    const i = (y * n + x) * 4;
    img.data[i] = Math.round((u / l * 0.5 + 0.5) * 255);
    img.data[i + 1] = Math.round((-v / l * 0.5 + 0.5) * 255); // glTF v runs down
    img.data[i + 2] = 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.flipY = false;
  t.minFilter = t.magFilter = LinearFilter;
  t.generateMipmaps = false;
  return t;
}
