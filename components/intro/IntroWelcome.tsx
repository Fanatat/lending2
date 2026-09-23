"use client";

import { useEffect, useRef, useState } from "react";
import { Literata } from "next/font/google";
import { INTRO_CTA, INTRO_T, INTRO_TITLE } from "@/lib/introConfig";

const serif = Literata({
  subsets: ["latin", "cyrillic"],
  weight: ["300"],
  display: "swap",
});

/**
 * The intro's last scene (from ~11 s): teal nebula light, a grainy planet
 * whose painted surface slowly turns (teal → black → red/orange → teal...),
 * the welcome line and the "Начать" button that lets the visitor in.
 *
 * Nebula + planet + film grain are one full-screen fragment shader; the
 * text/button are plain DOM laid out against the same sphere geometry
 * (CSS vars set from JS), so they can't drift apart on resize.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uNebula;
uniform float uSphere;
uniform vec3 uBall;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v / 0.9375;
}
float fbm2(vec3 p) {
  return (noise(p) * 0.66 + noise(p * 2.1 + 17.1) * 0.34);
}
vec3 rotateAxis(vec3 v, vec3 k, float a) {
  float c = cos(a);
  float s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}

// Diagonal teal light falling from the upper left to the right, dusty warm
// light low on the right, black corners — the reference's backdrop.
vec3 nebula(vec2 p) {
  vec2 dir = normalize(vec2(1.0, -0.38));
  vec2 nrm = vec2(-dir.y, dir.x);
  float d = dot(p - vec2(0.0, 0.02), nrm);
  float along = dot(p, dir);
  float band = exp(-d * d / 0.07);
  band *= 0.55 + 0.55 * smoothstep(-1.0, 0.7, along);
  band *= 0.8 + 0.4 * fbm(vec3(p * 1.4, uTime * 0.025));
  vec3 col = vec3(0.12, 0.31, 0.32) * band;
  vec2 wp = p - vec2(0.62, -0.58);
  col += vec3(0.31, 0.31, 0.26) * exp(-dot(wp, wp) / 0.2) * 0.8;
  col += vec3(0.02, 0.07, 0.07) * smoothstep(-0.1, 0.55, p.y) * (1.0 - smoothstep(0.1, 0.9, p.x));
  return col;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - 0.5 * uRes) / uRes.y;
  vec3 col = nebula(p) * uNebula;

  vec2 q = (frag - uBall.xy) / uBall.z;
  float r = length(q);
  float grain = hash12(frag + floor(uTime * 24.0) * vec2(37.0, 17.0)) - 0.5;

  if (uSphere > 0.0) {
    if (r < 1.0) {
      float z = sqrt(max(0.0, 1.0 - r * r));
      vec3 n = vec3(q, z);
      vec3 rn = rotateAxis(n, normalize(vec3(0.45, 1.0, 0.25)), uTime * 0.23);
      // Big, soft continents of colour — two octaves only, gently warped.
      vec3 w = rn * 0.7 + 0.3 * vec3(noise(rn + 3.0), noise(rn + 7.0), noise(rn + 11.0));
      float hue = fbm2(w * 0.75 + 1.7);
      float lum = fbm2(w * 0.7 + 5.3);
      float tone = fbm2(w * 1.1 + 9.1);
      vec3 tealC = mix(vec3(0.05, 0.2, 0.18), vec3(0.16, 0.44, 0.39), smoothstep(0.3, 0.7, tone));
      vec3 warmC = mix(vec3(0.36, 0.06, 0.05), vec3(0.72, 0.27, 0.1), smoothstep(0.35, 0.65, tone));
      vec3 c = mix(tealC, warmC, smoothstep(0.54, 0.76, hue));
      c *= mix(1.0, 0.1, smoothstep(0.46, 0.7, lum));

      float rim = pow(1.0 - z, 2.2);
      c *= 0.6 + 0.4 * smoothstep(0.0, 1.0, r);
      c += (c * 1.2 + vec3(0.17, 0.23, 0.22)) * rim * 0.8;
      c *= 0.88 + 0.2 * n.y;

      // Fuzzy, grain-dithered limb rather than a hard vector edge.
      float edge = 1.0 - smoothstep(0.975, 1.0, r + grain * 0.006);
      col = mix(col, c, edge * uSphere);
    } else {
      col += vec3(0.3, 0.38, 0.37) * exp(-(r - 1.0) * 26.0) * 0.45 * uSphere;
    }
  }

  float luma = dot(col, vec3(0.3, 0.55, 0.15));
  // Just a whisper of film grain: enough to break up gradient banding.
  col += grain * (0.008 + luma * 0.09);
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

function sphereLayout(w: number, h: number) {
  const d = Math.min(h * 0.57, w * 0.84);
  const cy = w < h ? h * 0.53 : h * 0.565;
  return { cx: w / 2, cy, d };
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn("[intro] shader:", gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export type WelcomeStage = "nebula" | "chrome" | "title" | "ready";

export default function IntroWelcome({
  origin,
  mobile,
  stage,
  exitStart,
  onStart,
}: {
  origin: number;
  mobile: boolean;
  stage: WelcomeStage;
  /** performance.now() when "Начать" was pressed, or null. */
  exitStart: number | null;
  onStart: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<number | null>(exitStart);
  exitRef.current = exitStart;
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    const vs = gl && compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl && vs && fs ? gl.createProgram() : null;
    if (gl && prog && vs && fs) {
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
    }
    const ok = !!(gl && prog && gl.getProgramParameter(prog, gl.LINK_STATUS));
    // No WebGL: a static CSS version of the same scene (see globals.css).
    if (!ok) setFallback(true);

    let scale = 1;
    let layout = sphereLayout(window.innerWidth, window.innerHeight);

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      layout = sphereLayout(w, h);
      root!.style.setProperty("--sphere-cx", `${layout.cx}px`);
      root!.style.setProperty("--sphere-cy", `${layout.cy}px`);
      root!.style.setProperty("--sphere-d", `${layout.d}px`);
      // The shader is fill-rate bound: cap the backing store at ~2.4 MP.
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
      scale = Math.min(dpr, Math.sqrt(2_400_000 / (w * h)));
      canvas!.width = Math.round(w * scale);
      canvas!.height = Math.round(h * scale);
      if (gl) gl.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    if (!ok || !gl || !prog) {
      return () => window.removeEventListener("resize", resize);
    }

    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = {
      res: gl.getUniformLocation(prog, "uRes"),
      time: gl.getUniformLocation(prog, "uTime"),
      nebula: gl.getUniformLocation(prog, "uNebula"),
      sphere: gl.getUniformLocation(prog, "uSphere"),
      ball: gl.getUniformLocation(prog, "uBall"),
    };

    let raf = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const t = now - origin;
      const W = canvas!.width;
      const H = canvas!.height;
      const nebula = smooth((t - INTRO_T.nebula) / (INTRO_T.nebulaFull - INTRO_T.nebula));
      const sphere = smooth((t - INTRO_T.sphere) / (INTRO_T.sphereFull - INTRO_T.sphere));

      // "Начать": the planet swells until the screen is inside it.
      let radius = (layout.d / 2) * scale;
      const exitAt = exitRef.current;
      if (exitAt !== null) {
        const k = clamp01((now - exitAt - 120) / 1100);
        const cover = Math.hypot(W, H);
        radius += (cover - radius) * k * k * k;
      }

      gl!.uniform2f(u.res, W, H);
      // Surface turn starts from a fixed phase so every visit opens teal.
      gl!.uniform1f(u.time, 10 + Math.max(0, t - INTRO_T.nebula) / 1000);
      gl!.uniform1f(u.nebula, nebula);
      gl!.uniform1f(u.sphere, sphere);
      gl!.uniform3f(u.ball, layout.cx * scale, H - layout.cy * scale, radius);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }
    raf = requestAnimationFrame(frame);

    // No loseContext() here: StrictMode re-runs this effect on the same
    // canvas, and getContext() would hand back the dead context.
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [origin, mobile]);

  const at = (s: WelcomeStage) => {
    const order: WelcomeStage[] = ["nebula", "chrome", "title", "ready"];
    return order.indexOf(stage) >= order.indexOf(s);
  };

  const rootClass = [
    "intro-welcome",
    fallback && "intro-welcome--fallback",
    exitStart !== null && "intro-welcome--leaving",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={rootClass}>
      <canvas ref={canvasRef} className="intro-welcome-canvas" aria-hidden="true" />
      {fallback && <div className="intro-welcome-fallback-sphere" aria-hidden="true" />}

      <h1 className={`intro-title ${serif.className}${at("title") ? " intro-title--on" : ""}`}>{INTRO_TITLE}</h1>

      <button
        type="button"
        data-cursor="interactive"
        className={at("ready") ? "intro-start intro-start--on" : "intro-start"}
        onClick={onStart}
        disabled={!at("ready") || exitStart !== null}
      >
        <span className="intro-start-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M5 12h13M13 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="intro-start-label">{INTRO_CTA}</span>
      </button>

      <p className={at("chrome") ? "intro-legal intro-legal--on" : "intro-legal"}>
        Продолжая, вы увидите нечто.
      </p>
    </div>
  );
}
