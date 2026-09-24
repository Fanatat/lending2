"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { INTRO_DUST, INTRO_T } from "@/lib/introConfig";
import { cosmosImage, type CosmosTexture } from "@/lib/cosmosAssets";

/**
 * First half of the intro: a planet parade, rendered for real in WebGL
 * (three.js). The Sun and the eight planets stand in one gently curving
 * line — textured spheres (Solar System Scope, CC BY 4.0) lit by a single
 * light at the Sun, turning on their own tilted axes, with atmospheric rims
 * and Saturn's ring. The camera glides outward along the line past Earth
 * and the Moon, Mars, Jupiter and Saturn, cranes up to show the whole
 * parade from the Sun's glare to Neptune, then pulls away until it is
 * lost among the stars of the Milky Way.
 *
 * Everything is a pure function of `t` (ms since `origin`), so the picture
 * stays on the same clock as the DOM stages and the sound cues. In
 * development `?introT=<ms>` freezes the shot at that moment (screenshots).
 */

type Vec3 = [number, number, number];

interface BodySpec {
  tex: CosmosTexture;
  radius: number;
  pos: Vec3;
  /** Axial tilt, rad. */
  tilt: number;
  /** Own rotation, rad/s — exaggerated so the turning reads on screen. */
  spin: number;
  /** Flat colour shown if the texture failed to load. */
  color: string;
  /** Atmosphere tint + strength; none for airless bodies. */
  atmo?: [string, number];
  /** Thin glow past the limb — only where the air is thick enough to see. */
  halo?: boolean;
  ring?: boolean;
  clouds?: boolean;
}

// Not to scale — sizes are picked so Jupiter reads as the giant and Mercury
// as the pebble, distances so the line fits one shot. The line bends a
// little up and sideways, like the real ecliptic seen from off-plane.
const BODIES: BodySpec[] = [
  { tex: "mercury", radius: 0.45, pos: [10, 0.1, -0.4], tilt: 0.03, spin: 0.2, color: "#8c8680" },
  { tex: "venus_atmosphere", radius: 0.85, pos: [14.5, 0.2, -0.2], tilt: 0.05, spin: 0.12, color: "#e3c48f", atmo: ["#ffd9a0", 0.9], halo: true },
  { tex: "earth_daymap", radius: 1, pos: [21, 0.1, 0], tilt: 0.41, spin: 0.3, color: "#3a64a8", atmo: ["#6aa8ff", 1.4], halo: true, clouds: true },
  { tex: "mars", radius: 0.62, pos: [27, 0.3, 0.4], tilt: 0.44, spin: 0.3, color: "#b5552f", atmo: ["#ff9a6a", 0.4] },
  { tex: "jupiter", radius: 3.3, pos: [37, 0.5, 0.8], tilt: 0.05, spin: 0.22, color: "#c9a27a", atmo: ["#ffe2bd", 0.5] },
  { tex: "saturn", radius: 2.7, pos: [50, 0.8, 1.2], tilt: 0.47, spin: 0.2, color: "#d8c08f", atmo: ["#ffe8b8", 0.45], ring: true },
  { tex: "uranus", radius: 1.7, pos: [62, 1.1, 1.5], tilt: 1.71, spin: 0.25, color: "#9fd8e0", atmo: ["#a8f0ff", 0.8] },
  { tex: "neptune", radius: 1.6, pos: [72, 1.4, 1.7], tilt: 0.49, spin: 0.25, color: "#3f66d8", atmo: ["#6f90ff", 0.9] },
];
const SUN_RADIUS = 4.2;
/**
 * The Sun sits off the line, behind and to the left of the flight path:
 * lit straight from behind the camera the planets would read as flat
 * discs, from here every one shows a terminator.
 */
const SUN_POS: Vec3 = [-30, 10, -32];
const EARTH = BODIES[2]!;
const MOON_OFFSET: Vec3 = [1.9, 0.35, -2.1];

// Camera keyframes: [t ms, x, y, z] for the eye and for the point it looks
// at. Interpolated with a time-aware Catmull-Rom, so speed stays continuous
// through every key.
type Key = [number, number, number, number];
// After Saturn the camera climbs over the line to the Sun's side, so the
// wide shot sees the planets lit, and the Sun drifts into frame as it recedes.
const EYE: Key[] = [
  [0, 12.5, 0.9, 4.2],
  [1500, 20.5, 1.3, 3.9],
  [2700, 33.5, 2.1, 8.6],
  [3700, 46.5, 3.6, 10.8],
  [INTRO_T.reveal + 1000, 46, 30, -50],
  [INTRO_T.pullback, 44, 36, -60],
  [INTRO_T.pullback + 1200, 40, 60, -100],
  [INTRO_T.cosmosGone, 30, 120, -220],
];
const LOOK: Key[] = [
  [0, 24, 0.3, 0.4],
  [1500, 34, 0.5, 0],
  [2700, 48, 0.8, 0],
  [3700, 60, 1, 0],
  [INTRO_T.reveal + 1000, 34, 2, -4],
  [INTRO_T.pullback, 30, 2, -6],
  [INTRO_T.pullback + 1200, 24, 0, -10],
  [INTRO_T.cosmosGone, 20, 0, -12],
];

function hermite(keys: Key[], t: number, out: Vec3): Vec3 {
  const n = keys.length;
  if (t <= keys[0]![0]) return copyKey(keys[0]!, out);
  if (t >= keys[n - 1]![0]) return copyKey(keys[n - 1]!, out);
  let i = 0;
  while (keys[i + 1]![0] < t) i++;
  const k0 = keys[i]!;
  const k1 = keys[i + 1]!;
  const h = k1[0] - k0[0];
  const s = (t - k0[0]) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;
  for (let c = 1; c <= 3; c++) {
    const m0 = tangent(keys, i, c);
    const m1 = tangent(keys, i + 1, c);
    out[c - 1] = h00 * k0[c]! + h10 * h * m0 + h01 * k1[c]! + h11 * h * m1;
  }
  return out;
}

function tangent(keys: Key[], i: number, c: number) {
  const a = keys[Math.max(0, i - 1)]!;
  const b = keys[Math.min(keys.length - 1, i + 1)]!;
  return (b[c]! - a[c]!) / (b[0] - a[0]);
}

function copyKey(k: Key, out: Vec3): Vec3 {
  out[0] = k[1];
  out[1] = k[2];
  out[2] = k[3];
  return out;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** Radial glow sprite, drawn once on a 2D canvas. */
function glowCanvas(stops: [number, string][], w = 256, h = 256) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  return c;
}

const ATMO_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

// Two layers per planet: a haze on the disc that thickens toward the limb,
// and a halo just outside it. Both only on the day side.
const ATMO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uSun;
uniform float uStrength;
uniform float uHalo;
uniform float uLimb;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vP);
  vec3 l = normalize(uSun - vP);
  float d = dot(n, v);
  float a;
  if (uHalo > 0.5) {
    a = pow(clamp(-d / uLimb, 0.0, 1.0), 3.0);
  } else {
    a = pow(1.0 - max(d, 0.0), 3.0) * 0.9;
  }
  float lit = smoothstep(-0.3, 0.45, dot(n, l));
  gl_FragColor = vec4(uColor * a * lit * uStrength, 1.0);
}
`;

export default function IntroCosmos({ origin, mobile }: { origin: number; mobile: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let raf = 0;
    let cleanup = () => {};

    // Dev-only: ?introT=<ms> freezes the shot, ?introDbg=a,b toggles layers.
    const params =
      process.env.NODE_ENV !== "production" ? new URLSearchParams(window.location.search) : null;
    const frozenParam = params?.get("introT") ?? null;
    const frozen = frozenParam !== null ? Number(frozenParam) : null;
    const debug = (params?.get("introDbg") ?? "").split(",");

    void import("three").then((THREE) => {
      if (disposed) return;
      cleanup = build(THREE, canvas, origin, mobile, frozen, debug, (id) => (raf = id));
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [origin, mobile]);

  return (
    <>
      <canvas ref={canvasRef} className="intro-cosmos" aria-hidden="true" style={{ opacity: 0 }} />
      <div className="intro-cosmos-vignette" aria-hidden="true" />
    </>
  );
}

function build(
  THREE: typeof THREE_NS,
  canvas: HTMLCanvasElement,
  origin: number,
  mobile: boolean,
  frozen: number | null,
  debug: string[],
  setRaf: (id: number) => void
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 4000);
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  function texture(name: CosmosTexture, color = true) {
    const img = cosmosImage(name);
    if (!img) return null;
    const t = keep(new THREE.Texture(img));
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = maxAniso;
    t.needsUpdate = true;
    return t;
  }

  // --- light: one sun, a whisper of fill so night sides aren't a hole ----
  const sunLight = new THREE.PointLight(0xfff4e6, 2.6, 0, 0);
  sunLight.position.set(...SUN_POS);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x8899bb, 0.035));

  // --- sky -----------------------------------------------------------------
  const skyTex = texture("stars_milky_way");
  const sky = new THREE.Mesh(
    keep(new THREE.SphereGeometry(1500, 48, 24)),
    keep(
      new THREE.MeshBasicMaterial({
        map: skyTex,
        color: skyTex ? new THREE.Color(0.32, 0.32, 0.36) : new THREE.Color(0, 0, 0),
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
      })
    )
  );
  sky.rotation.set(0.5, 0.3, 0.9);
  // Backdrop first, always: nothing may depth-test against it.
  sky.renderOrder = -2;
  scene.add(sky);

  const dotTex = keep(
    new THREE.CanvasTexture(
      glowCanvas([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.6)"], [1, "rgba(255,255,255,0)"]], 32, 32)
    )
  );
  const STAR_COUNT = mobile ? 1600 : 3200;
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starCol = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    starPos.set([Math.cos(a) * r * 1200, u * 1200, Math.sin(a) * r * 1200], i * 3);
    const warm = Math.random();
    const b = 0.35 + Math.pow(Math.random(), 3) * 0.9;
    starCol.set([b * (0.85 + 0.15 * warm), b * 0.92, b * (1.05 - 0.2 * warm)], i * 3);
  }
  const starGeo = keep(new THREE.BufferGeometry());
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
  const stars = new THREE.Points(
    starGeo,
    keep(
      new THREE.PointsMaterial({
        size: mobile ? 2.2 : 2.6,
        sizeAttenuation: false,
        map: dotTex,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      })
    )
  );
  stars.renderOrder = -1;
  scene.add(stars);

  // Dust motes along the camera path: tiny, but they whip past and sell the speed.
  const dustCount = mobile ? INTRO_DUST.mobile : INTRO_DUST.desktop;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos.set([5 + Math.random() * 70, -5 + Math.random() * 16, -8 + Math.random() * 26], i * 3);
  }
  const dustGeo = keep(new THREE.BufferGeometry());
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = keep(
    new THREE.PointsMaterial({
      size: 0.05,
      map: dotTex,
      color: 0xc8d4ff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  scene.add(new THREE.Points(dustGeo, dustMat));

  // --- sun -----------------------------------------------------------------
  const sun = new THREE.Mesh(
    keep(new THREE.SphereGeometry(SUN_RADIUS, 64, 32)),
    keep(
      new THREE.MeshBasicMaterial({
        map: texture("sun"),
        color: new THREE.Color(2.2, 1.6, 1.0),
      })
    )
  );
  sun.position.set(...SUN_POS);
  scene.add(sun);
  const glowTex = keep(
    new THREE.CanvasTexture(
      glowCanvas([
        [0, "rgba(255,245,225,1)"],
        [0.12, "rgba(255,220,160,0.85)"],
        [0.35, "rgba(255,170,80,0.25)"],
        [1, "rgba(255,120,40,0)"],
      ])
    )
  );
  const streakTex = keep(
    new THREE.CanvasTexture(
      glowCanvas([[0, "rgba(255,235,210,0.9)"], [0.3, "rgba(255,200,150,0.25)"], [1, "rgba(255,160,90,0)"]])
    )
  );
  const sunGlows: THREE_NS.Sprite[] = [];
  for (const [tex, sx, sy, opacity] of [
    [glowTex, 34, 34, 1],
    [glowTex, 110, 110, 0.35],
    [streakTex, 260, 5, 0.55],
  ] as const) {
    const sprite = new THREE.Sprite(
      keep(
        new THREE.SpriteMaterial({
          map: tex,
          color: 0xffffff,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity,
          depthWrite: false,
        })
      )
    );
    sprite.scale.set(sx, sy, 1);
    sprite.position.set(...SUN_POS);
    sunGlows.push(sprite);
    scene.add(sprite);
  }

  // --- planets -------------------------------------------------------------
  const sunPos = new THREE.Vector3(...SUN_POS);
  const spinners: { mesh: THREE_NS.Object3D; rate: number }[] = [];

  function atmosphere(radius: number, color: string, strength: number, halo: boolean) {
    const scale = halo ? 1.035 : 1.004;
    const mat = keep(
      new THREE.ShaderMaterial({
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uSun: { value: sunPos },
          uStrength: { value: strength * (halo ? 0.7 : 1) },
          uHalo: { value: halo ? 1 : 0 },
          uLimb: { value: Math.sqrt(1 - 1 / (scale * scale)) },
        },
        side: halo ? THREE.BackSide : THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    const mesh = new THREE.Mesh(keep(new THREE.SphereGeometry(radius * scale, 64, 32)), mat);
    mesh.renderOrder = 2;
    return mesh;
  }

  for (const b of BODIES) {
    const group = new THREE.Group();
    group.position.set(...b.pos);
    group.rotation.z = b.tilt;
    scene.add(group);

    const map = texture(b.tex);
    const body = new THREE.Mesh(
      keep(new THREE.SphereGeometry(b.radius, 96, 48)),
      keep(
        new THREE.MeshStandardMaterial({
          map,
          color: map ? 0xffffff : b.color,
          roughness: 1,
          metalness: 0,
        })
      )
    );
    body.rotation.y = Math.random() * Math.PI * 2;
    group.add(body);
    spinners.push({ mesh: body, rate: b.spin });

    if (b.clouds) {
      const alpha = texture("earth_clouds", false);
      if (alpha) {
        const clouds = new THREE.Mesh(
          keep(new THREE.SphereGeometry(b.radius * 1.012, 96, 48)),
          keep(
            new THREE.MeshStandardMaterial({
              color: 0xffffff,
              alphaMap: alpha,
              transparent: true,
              depthWrite: false,
              roughness: 1,
            })
          )
        );
        group.add(clouds);
        spinners.push({ mesh: clouds, rate: b.spin * 1.25 });
      }
    }

    if (b.atmo && !debug.includes("noatmo")) {
      if (!debug.includes("nohaze")) group.add(atmosphere(b.radius, b.atmo[0], b.atmo[1], false));
      if (b.halo && !debug.includes("nohalo")) group.add(atmosphere(b.radius, b.atmo[0], b.atmo[1], true));
    }

    if (b.ring) {
      const inner = b.radius * 1.24;
      const outer = b.radius * 2.3;
      const geo = keep(new THREE.RingGeometry(inner, outer, 192, 1));
      const p = geo.attributes.position!;
      const uv = geo.attributes.uv!;
      for (let i = 0; i < p.count; i++) {
        const len = Math.hypot(p.getX(i), p.getY(i));
        uv.setXY(i, (len - inner) / (outer - inner), 0.5);
      }
      const ringTex = texture("saturn_ring");
      const ring = new THREE.Mesh(
        geo,
        keep(
          new THREE.MeshStandardMaterial({
            map: ringTex,
            color: ringTex ? 0xffffff : 0xcbb58c,
            emissive: 0xffffff,
            emissiveMap: ringTex,
            emissiveIntensity: 0.18,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: ringTex ? 1 : 0.5,
            depthWrite: false,
            roughness: 1,
          })
        )
      );
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
    }
  }

  const moonMap = texture("moon");
  const moon = new THREE.Mesh(
    keep(new THREE.SphereGeometry(0.27, 64, 32)),
    keep(new THREE.MeshStandardMaterial({ map: moonMap, color: moonMap ? 0xffffff : 0x999999, roughness: 1 }))
  );
  moon.position.set(EARTH.pos[0] + MOON_OFFSET[0], EARTH.pos[1] + MOON_OFFSET[1], EARTH.pos[2] + MOON_OFFSET[2]);
  scene.add(moon);
  spinners.push({ mesh: moon, rate: 0.05 });

  // --- sizing --------------------------------------------------------------
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep roughly the landscape horizontal field on portrait screens, so
    // the parade still fits across — but don't go fish-eye.
    const hfov = 2 * Math.atan(Math.tan((45 * Math.PI) / 360) * (16 / 9));
    const vfov = camera.aspect < 1.2 ? 2 * Math.atan(Math.tan(hfov / 2) / camera.aspect) : (45 * Math.PI) / 180;
    camera.fov = Math.min(80, (vfov * 180) / Math.PI);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // --- frame ---------------------------------------------------------------
  const eye: Vec3 = [0, 0, 0];
  const look: Vec3 = [0, 0, 0];
  const lookV = new THREE.Vector3();
  const toSun = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const end = INTRO_T.cosmosGone + 300;
  let lastOpacity = -1;

  function frame(now: number) {
    const t = frozen ?? now - origin;
    const sec = t / 1000;

    hermite(EYE, t, eye);
    hermite(LOOK, t, look);
    // A little hand-held float, fading out as the camera settles into the reveal.
    const shake = 0.06 * (1 - smooth((t - INTRO_T.reveal) / 1200));
    camera.position.set(eye[0], eye[1], eye[2]);
    lookV.set(
      look[0] + Math.sin(sec * 1.7) * shake,
      look[1] + Math.sin(sec * 2.3 + 1) * shake,
      look[2] + Math.sin(sec * 1.3 + 2) * shake
    );
    // Slight bank into the crane, levelling out for the wide shot.
    const bank = 0.06 * smooth((t - 3000) / 2000) * (1 - smooth((t - INTRO_T.pullback) / 1500));
    camera.up.set(Math.sin(sec * 0.6) * 0.02 - bank, 1, 0);
    camera.lookAt(lookV);

    for (let i = 0; i < spinners.length; i++) {
      const s = spinners[i]!;
      s.mesh.rotation.y = i * 1.7 + sec * s.rate;
    }
    sky.rotation.y = 0.3 + sec * 0.004;

    // The anamorphic streak and glare swell as the Sun comes into view.
    toSun.copy(sunPos).sub(camera.position).normalize();
    camera.getWorldDirection(forward);
    const facing = clamp01((forward.dot(toSun) - 0.6) / 0.4);
    sunGlows[1]!.material.opacity = 0.2 + 0.3 * facing;
    sunGlows[2]!.material.opacity = 0.15 + 0.5 * facing;

    dustMat.opacity = 0.55 * (1 - smooth((t - INTRO_T.reveal) / 1500));

    const opacity = smooth(t / 700) * (1 - smooth((t - INTRO_T.cosmosOut) / (INTRO_T.cosmosGone - INTRO_T.cosmosOut)));
    if (Math.abs(opacity - lastOpacity) > 0.002) {
      canvas.style.opacity = opacity.toFixed(3);
      lastOpacity = opacity;
    }

    renderer.render(scene, camera);
    if (frozen !== null || t < end) setRaf(requestAnimationFrame(frame));
  }
  setRaf(requestAnimationFrame(frame));

  return () => {
    window.removeEventListener("resize", resize);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };
}
