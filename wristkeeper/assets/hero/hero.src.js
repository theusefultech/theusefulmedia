// Wristkeeper hero: the app's opener watch, exported from tools/opener-render
// (Blender) to GLB, drawn live with three.js 0.186.1.
// Built into hero.js by scripts/build_wk_hero.sh (esbuild, one minified file).
// The page loads it only when WebGL works, motion is allowed and the device
// is not on a slow connection; everyone else keeps the path traced still.
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, NeutralToneMapping,
  SRGBColorSpace, DirectionalLight, Vector3, Quaternion, Color, MeshPhysicalMaterial,
  FrontSide, CanvasTexture, LinearFilter, Mesh, PlaneGeometry, MeshBasicMaterial,
  AdditiveBlending, DoubleSide
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const BASE = "/wristkeeper/assets/hero/";
// The Blender camera of the app's opener (wristbox tools/opener-render/watch.py
// at cd20c36, job 34's centred composition): 70 mm lens on a 36 mm sensor,
// square frame, 8.0 units from the target, 18 degrees above it. Blender z up
// becomes y up. watch.py's own centring pass sets the target and shifts the
// turntable sideways by a smooth fit over the swing (centring.json, job 33b).
const FOV = 2 * Math.atan(18 / 70) * 180 / Math.PI;
const DIST = 8.0, EL = 18 * Math.PI / 180;
// Blender (0, 0.3, 1.8414): the camera pan that puts the watch's height at 0.47.
const TARGET = new Vector3(0, 1.8414, -0.3);
// The page crops the render: zoom 1.1 about (0.5, CY), the watch's vertical
// centre, the same crop as the path traced still (hero-watch-*.webp).
const ZOOM = 1.1, CY = 0.47056;
const REST = -6 * Math.PI / 180;     // the dial faces the camera, turned a touch from the crown
const SWING = 10 * Math.PI / 180;    // plus or minus 10, as the app's loop
const PERIOD = 6;                    // seconds per swing, as the app's loop
// The turntable's sideways shift (Blender x, units) as a cubic in the turn
// from rest (radians): keeps the whole watch centred on every frame.
const XFIT = [-0.050276, 0.183924, -0.469674, 0.925710];
// Blender's aim (-0.306, -0.926, -0.221) for the soft box, in three's axes.
const AIM = new Vector3(-0.30597, -0.22092, 0.92605);
// Reflection strengths, tuned against the path traced still at rest (job 33b):
// the studio's black flags keep the polished bezel dark, the overhead box
// lights the hands and indices, the crystal shows only the soft box bar.
const ENV = 0.38, CARD = 800, CRYSTAL = 0.12, DIAL = 0.9, DIAL_ENV = 1.0, ANISO = 0.2;
const POLISHED = 0.3, OPALINE = 3.5, SATIN = 2.6, LUME = 2.2, LEATHER = 2.5;
const xoff = (d) => XFIT[0] + d * (XFIT[1] + d * (XFIT[2] + d * XFIT[3]));

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
  // The studio, plus the soft box the sapphire mirrors in the path traced
  // still (watch.py's crystal_card: 4 by 1.9, 7 units out along the mirror
  // of the camera off the crystal at rest, bright along its top). Here it
  // sits 1.5 units out at the same angular size, above the room's floor.
  const room = new RoomEnvironment();
  const card = new Mesh(new PlaneGeometry(4.0 * 1.5 / 7, 1.9 * 1.5 / 7), new MeshBasicMaterial({ map: cardMap(), color: new Color(CARD, CARD, CARD), side: DoubleSide }));
  card.position.copy(AIM).multiplyScalar(1.5);
  card.lookAt(0, 0, 0);
  room.add(card);
  // Each material gets the map as its own envMap: three.js ignores a
  // material's envMapIntensity when it only inherits scene.environment.
  const env = pmrem.fromScene(room, 0.006).texture;
  // Blender's key at (0, -3.5, 8): centred, so the light falls evenly.
  const key = new DirectionalLight(0xffffff, 1.7); key.position.set(0, 8, 3.5); scene.add(key);
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
          // A clear crystal that only reflects: a black base added on top,
          // so only its Fresnel reflection (the soft box bar) shows, as in
          // the path traced dome. Cheaper than transmission.
          o.material = new MeshPhysicalMaterial({
            color: 0x000000, metalness: 0, roughness: 0, ior: 1.77, transparent: true, blending: AdditiveBlending,
            depthWrite: false, envMapIntensity: CRYSTAL, side: DoubleSide
          });
          o.renderOrder = 10;
          // The dome's exported normals face into the watch, which made it a
          // concave mirror; turned out, it reflects like the path traced dome.
          const n = o.geometry.attributes.normal;
          for (let i = 0; i < n.array.length; i++) n.array[i] *= -1;
          n.needsUpdate = true;
        } else if (/^(leather|thread)/.test(m.name) && m.isMeshPhysicalMaterial) {
          // Blender's sheen weight (0.04 to 0.3) arrives as a white sheen colour.
          const w = m.name === "thread" ? 0.3 : m.name === "leather_lining" ? 0.15 : 0.06;
          m.sheenColor = new Color(w, w, w);
          m.envMapIntensity = LEATHER;
        } else if (m.name === "dial") {
          m.envMapIntensity = DIAL_ENV;
          m.color.multiplyScalar(DIAL);   // the path traced dial's value
          // The sunburst: anisotropy running out from the centre.
          m.anisotropy = ANISO;
          m.anisotropyMap = radialMap();
        } else if (/polished|satin|brushed|opaline/.test(m.name)) {
          m.envMapIntensity = /polished/.test(m.name) ? POLISHED : m.name === "opaline" ? OPALINE : m.name === "satin" ? SATIN : 1.1;
        } else if (m.name === "lume") {
          m.envMapIntensity = LUME;
        }
        const mm = o.material;
        if (mm.isMeshStandardMaterial) { mm.envMap = env; mm.envMapIntensity *= ENV; }
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
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // The Blender frame, cropped like the still: zoom about (0.5, CY).
        // The stage is square, so the crop is too.
        const s = Math.min(w, h);
        camera.setViewOffset(s * ZOOM, s * ZOOM, (s * ZOOM - w) / 2, CY * s * ZOOM - h / 2, w, h);
      };
      size();
      new ResizeObserver(size).observe(host);

      // Scroll: as the hero leaves, the watch turns its dial to the camera.
      let progress = 0, eased = 0;
      // Measured from the top of the page, so the watch rests centred and
      // upright until the reader scrolls (on phones the stacked hero sits
      // above the middle of the screen from the start).
      const onScroll = () => {
        const vh = window.innerHeight || 1;
        progress = Math.min(1, Math.max(0, window.scrollY / (vh * 0.75)));
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
        const yaw = REST * (1 - eased) + idle;
        turntable.rotation.y = yaw;
        turntable.position.x = xoff(yaw - REST);
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

// The soft box's face: v^2.2 from the bottom (bright top) times a soft bell
// across, as watch.py's gradient_card.
function cardMap() {
  const w = 128, h = 64, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d"), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x + 0.5) / w, v = 1 - (y + 0.5) / h;
    const k = Math.pow(v, 2.2) * Math.pow(Math.max(0, 1 - Math.abs(u - 0.5) * 2), 0.6);
    const i = (y * w + x) * 4, b = Math.round(255 * k);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
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
