// Obsidian No. 4: an animated background. Fills its parent; put content on top with position: relative.
// ObsidianNo4.usage.tsx, saved with this file, shows it on a page.
import { type CSSProperties, useEffect, useRef } from "react";

export type ShapeKind =
  | "curl"
  | "folds"
  | "veins"
  | "wisps"
  | "liquid"
  | "threads"
  | "web"
  | "dunes"
  | "halo"
  | "mesh"
  | "noise"
  | "spots"
  | "blobs"
  | "horizon"
  | "leak"
  | "orb"
  | "cells"
  | "crystal"
  | "topo"
  | "ripples"
  | "plasma"
  | "caustics"
  | "lava"
  | "kaleido"
  | "vortex"
  | "rays"
  | "holo"
  | "chrome"
  | "bars"
  | "linear"
  | "radial"
  | "conic";

export type EffectId =
  | "overlay"
  | "vignette"
  | "grain"
  | "dither"
  | "fringe"
  | "iridescence"
  | "flare"
  | "glow"
  | "blur"
  | "retro"
  | "ascii"
  | "engrave"
  | "halftone"
  | "ripple"
  | "lens"
  | "reeded"
  | "mosaic"
  | "bend"
  | "streak"
  | "paint"
  | "recolor"
  | "wash"
  | "texture"
  | "kaleido"
  | "relief"
  | "neon"
  | "contour"
  | "led"
  | "rain"
  | "shatter"
  | "weave"
  | "twirl"
  | "glitch"
  | "pixelsort"
  | "stretch"
  | "prism"
  | "thermal"
  | "anaglyph"
  | "crosshatch"
  | "stipple"
  | "riso";

export type Swatch = { hex: string; at: number };

export type Anchor = { x: number; y: number };

export type Ratio = { w: number; h: number };

export type Shape = {
  kind: ShapeKind;
  angle: number;
  size: number;
  thickness: number;
  distort: number;
  zoom: number;
  octaves: number;
  feather: number;
  bands: number;
  drift: number;
  animate: boolean;
  period: number;
};

export type Tone = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  posterize: number;
  solarize: number;
};

export type Layers = {
  stack: EffectId[];
  overlay: {
    on: boolean;
    fit: "cover" | "contain" | "stretch";
    scale: number;
    x: number;
    y: number;
    blend: "normal" | "multiply" | "screen" | "overlay" | "softLight" | "lighten" | "darken" | "difference";
    opacity: number;
    src: string | null;
    name: string;
  };
  vignette: {
    on: boolean;
    amount: number;
    feather: number;
  };
  grain: {
    on: boolean;
    amount: number;
    size: number;
    live: boolean;
  };
  dither: {
    on: boolean;
    pattern: "blue" | "random" | "bayer2" | "bayer4" | "bayer8";
    size: number;
    levels: number;
    palette: "colour" | "mono";
    paper: string;
    ink: string;
  };
  fringe: {
    on: boolean;
    kind: "radial" | "directional";
    amount: number;
    angle: number;
  };
  iridescence: {
    on: boolean;
    strength: number;
    film: number;
    hue: number;
  };
  flare: {
    on: boolean;
    x: number;
    y: number;
    strength: number;
    reach: number;
    color: string;
  };
  glow: {
    on: boolean;
    amount: number;
    spread: number;
    cutoff: number;
    color: string;
  };
  blur: {
    on: boolean;
    kind: "gaussian" | "directional" | "progressive" | "tiltShift";
    amount: number;
    angle: number;
    center: number;
    band: number;
  };
  retro: {
    on: boolean;
    kind: "crt" | "vhs" | "glitch";
    amount: number;
    lines: number;
    noise: number;
    bleed: number;
  };
  ascii: {
    on: boolean;
    glyphs: "standard" | "dense" | "blocks" | "binary";
    size: number;
    mode: "source" | "mono";
    ink: string;
    paper: string;
  };
  engrave: {
    on: boolean;
    size: number;
    angle: number;
    weight: number;
    mode: "source" | "ink";
    ink: string;
    paper: string;
  };
  halftone: {
    on: boolean;
    layout: "square" | "hex";
    size: number;
    angle: number;
    contrast: number;
    mode: "source" | "ink";
    ink: string;
    paper: string;
  };
  ripple: {
    on: boolean;
    size: number;
    height: number;
    sparkle: number;
    speed: number;
  };
  lens: {
    on: boolean;
    size: number;
    bend: number;
    rim: number;
    haze: number;
    spectrum: number;
    shine: number;
  };
  reeded: {
    on: boolean;
    finish: "fluted" | "frosted";
    pattern: "lines" | "wave" | "rings" | "tiles";
    ridge: "prism" | "lens" | "flat";
    size: number;
    angle: number;
    depth: number;
    offset: number;
    blur: number;
    spectrum: number;
    speed: number;
    shade: number;
    shine: number;
    haze: number;
    shadeColor: string;
    shineColor: string;
  };
  mosaic: {
    on: boolean;
    cell: "square" | "circle" | "hex";
    size: number;
    gap: number;
    gapColor: string;
  };
  bend: {
    on: boolean;
    kind: "sine" | "zigzag" | "ripple" | "swirl" | "turbulence" | "bulge" | "mirror" | "slices";
    amount: number;
    waves: number;
    angle: number;
    speed: number;
  };
  streak: {
    on: boolean;
    length: number;
    angle: number;
    churn: number;
  };
  paint: {
    on: boolean;
    brush: number;
  };
  recolor: {
    on: boolean;
    low: string;
    mid: string;
    high: string;
    pivot: number;
    amount: number;
  };
  wash: {
    on: boolean;
    bleed: number;
    edges: number;
    texture: number;
    paper: string;
  };
  texture: {
    on: boolean;
    tooth: number;
    scale: number;
    emboss: number;
  };
  kaleido: {
    on: boolean;
    segments: number;
    angle: number;
    zoom: number;
    speed: number;
  };
  relief: {
    on: boolean;
    depth: number;
    angle: number;
    shine: number;
    gloss: number;
  };
  neon: {
    on: boolean;
    amount: number;
    width: number;
    dim: number;
    tint: number;
    color: string;
  };
  contour: {
    on: boolean;
    lines: number;
    weight: number;
    mode: "source" | "ink";
    ink: string;
    paper: string;
  };
  led: {
    on: boolean;
    size: number;
    gap: number;
    glow: number;
    off: string;
  };
  rain: {
    on: boolean;
    size: number;
    amount: number;
    frost: number;
    speed: number;
  };
  shatter: {
    on: boolean;
    pieces: number;
    shift: number;
    edges: number;
    drift: number;
  };
  weave: {
    on: boolean;
    size: number;
    depth: number;
  };
  twirl: {
    on: boolean;
    twist: number;
    radius: number;
    x: number;
    y: number;
    sway: number;
  };
  glitch: {
    on: boolean;
    amount: number;
    slices: number;
    split: number;
    rate: number;
  };
  pixelsort: {
    on: boolean;
    cutoff: number;
    length: number;
    angle: number;
  };
  stretch: {
    on: boolean;
    side: "down" | "up" | "left" | "right";
    at: number;
    wave: number;
  };
  prism: {
    on: boolean;
    kind: "radial" | "linear";
    spread: number;
    angle: number;
  };
  thermal: {
    on: boolean;
    amount: number;
    contrast: number;
    heat: number;
  };
  anaglyph: {
    on: boolean;
    shift: number;
    depth: number;
    mono: number;
  };
  crosshatch: {
    on: boolean;
    spacing: number;
    weight: number;
    mode: "source" | "ink";
    ink: string;
    paper: string;
  };
  stipple: {
    on: boolean;
    size: number;
    density: number;
    mode: "source" | "ink";
    ink: string;
    paper: string;
  };
  riso: {
    on: boolean;
    size: number;
    offset: number;
    grain: number;
    ink: string;
    ink2: string;
    paper: string;
  };
};

export type Source = { kind: "shape" } | { kind: "image"; src: string; name: string; flow: number; tint: number; zoom: number };

export type Interact = {
  on: boolean;
  mode: "liquid" | "comet" | "blackhole" | "lens" | "prism" | "shards" | "shockwave" | "xray" | "pixels" | "glitch" | "ripple" | "swirl" | "repel" | "push" | "spotlight";
  strength: number;
  radius: number;
};

export type Look = {
  format: 2;
  name: string;
  seed: number;
  ratio: Ratio;
  palette: Swatch[];
  anchors: Anchor[];
  shape: Shape;
  tone: Tone;
  layers: Layers;
  source: Source;
  interact: Interact;
};

// Render runtime. HTML and React exports embed this file (imported with ?raw), so it has no runtime imports and
// an exported background matches the studio preview. Its only import is a type; exports strip it and declare
// the same types inline, and HTML exports strip the types too.
//
// A frame is drawn in three steps. The base pass renders look.shape, coloured by the palette and toned, into
// an offscreen sRGB texture. Each switched-on layer in look.layers.stack then reads that texture and writes
// the other of a pair. Finally the result is presented on the canvas.
//
// Every animated term is a function of a loop phase in [0, 2pi), so frame 0 and the frame after the
// last one are identical and a loop repeats seamlessly.

const VERT = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const COMMON = `
#define PI 3.14159265359
#define TAU 6.28318530718
uniform vec4 u_tone;   // brightness, contrast, saturation, hue (rad)
uniform vec4 u_tone2;  // posterize levels (0 off), solarize, unused, unused

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash22(vec2 p) { float n = hash21(p); return vec2(n, hash21(p + n + 17.31)); }
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c) * p; }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 toSrgb(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 toLinear(vec3 s) { s = clamp(s, 0.0, 1.0); return mix(s / 12.92, pow((s + 0.055) / 1.055, vec3(2.4)), step(0.04045, s)); }

vec3 toOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0); m = pow(max(m, 0.0), 1.0 / 3.0); s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
              1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
              0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 fromOklab(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
             -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
             -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

// Adjust works on sRGB-encoded colour, the way an image editor's sliders do.
vec3 adjust(vec3 c) {
  c = c + u_tone.x;
  c = (c - 0.5) * u_tone.y + 0.5;
  float l = luma(c);
  c = mix(vec3(l), c, u_tone.z);
  if (abs(u_tone.w) > 1e-4) {
    vec3 lab = toOklab(toLinear(c));
    lab.yz = rot(lab.yz, u_tone.w);
    c = toSrgb(fromOklab(lab));
  }
  if (u_tone2.x > 1.5) c = floor(c * u_tone2.x) / (u_tone2.x - 1.0);
  if (u_tone2.y > 0.0) c = mix(c, abs(c - 0.5) * 2.0 * step(0.5, c) + c * (1.0 - step(0.5, c)) * 2.0 * (1.0 - c), u_tone2.y);
  return clamp(c, 0.0, 1.0);
}
`;

const BASE_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform vec2  u_res;
uniform float u_phase;
uniform int   u_count;
uniform vec3  u_colors[8];  // linear sRGB
uniform float u_at[8];
uniform vec2  u_anchors[8];
uniform int   u_kind;
uniform float u_angle;
uniform float u_size;
uniform vec4  u_form;       // distort, zoom, feather, drift
uniform int   u_octaves;
uniform float u_bands;
uniform float u_seed;
uniform float u_thickness;
uniform vec4  u_pointer;    // x, y (centred, aspect space), presence 0..1, seconds since it arrived
uniform vec2  u_pvel;       // pointer velocity, aspect space per second
uniform vec4  u_interact;   // mode, strength, radius, unused
uniform sampler2D u_image;  // the picture, when the look draws one
uniform vec4  u_source;     // flow, palette tint, zoom, picture aspect
${COMMON}

vec4 permute4(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute4(permute4(permute4(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3 ns = (1.0 / 7.0) * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// The loop: noise is sampled while x, y and z travel round circles driven by the phase, so the
// field morphs (not just slides) and returns exactly to its start.
vec2 LC;
float lnoise(vec2 p) {
  float m = u_form.w;
  return snoise(vec3(p + LC * m * 0.45, u_seed * 3.17 + LC.y * m * 0.8 + LC.x * m * 0.3));
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5, n = 0.0;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    if (i >= u_octaves) break;
    v += a * lnoise(p); n += a;
    p = r * p * 2.03 + 17.0; a *= 0.5;
  }
  return v / max(n, 1e-4);
}

vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0);
  if (u_bands > 1.5) t = min(floor(t * u_bands), u_bands - 1.0) / (u_bands - 1.0);
  if (t <= u_at[0]) return u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (i + 1 >= u_count) break;
    if (t <= u_at[i + 1]) {
      float f = (t - u_at[i]) / max(u_at[i + 1] - u_at[i], 1e-4);
      f = mix(f, f * f * (3.0 - 2.0 * f), u_form.z);
      return fromOklab(mix(toOklab(u_colors[i]), toOklab(u_colors[i + 1]), f));
    }
  }
  return u_colors[u_count - 1];
}

vec2 movingPoint(int i) {
  float fi = float(i);
  return u_anchors[i] + u_form.w * 0.16 * vec2(sin(u_phase + fi * 1.7 + 0.4), cos(u_phase + fi * 2.3));
}

// Voronoi with looping points: returns F1, F2 and the nearest cell id.
vec4 voronoi(vec2 x) {
  vec2 n = floor(x), f = fract(x);
  float f1 = 8.0, f2 = 8.0; vec2 id = vec2(0.0);
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 h = hash22(n + g + u_seed);
    vec2 o = 0.5 + 0.38 * sin(u_phase * u_form.w + TAU * h);
    float d = length(g + o - f);
    if (d < f1) { f2 = f1; f1 = d; id = n + g; } else if (d < f2) { f2 = d; }
  }
  return vec4(f1, f2, id);
}

vec3 meshColor(vec2 p) {
  float aspect = u_res.x / u_res.y;
  vec3 acc = vec3(0.0); float wsum = 0.0;
  float k = mix(5.0, 1.5, u_form.z);
  for (int i = 0; i < 8; i++) {
    if (i >= u_count) break;
    vec2 pt = (movingPoint(i) - 0.5) * vec2(aspect, 1.0);
    float w = 1.0 / pow(dot(p - pt, p - pt) + 1e-3, k * 0.5);
    acc += toOklab(u_colors[i]) * w; wsum += w;
  }
  return fromOklab(acc / wsum);
}

// Centred shapes (radial, conic, rays, orb) drift gently round the middle of the frame.
vec2 center() { return u_form.w * 0.05 * vec2(sin(u_phase), cos(u_phase)); }

float shape(vec2 p) {
  vec2 dir = vec2(cos(u_angle), sin(u_angle));
  vec2 q = rot(p, u_angle) * u_form.y;
  // Domain warp with single-octave noise: two samples instead of two full fbm chains.
  if (u_form.x > 0.0) q += u_form.x * 0.6 * vec2(lnoise(q * 0.7 + 3.1), lnoise(q * 0.7 + 8.7));
  float ph = u_phase, m = u_form.w;

  if (u_kind == 1) { // linear
    return dot(p, dir) + 0.5 + 0.15 * u_form.x * fbm(p * u_form.y) + 0.06 * m * sin(ph);
  }
  if (u_kind == 2) { // radial
    vec2 c = center();
    return length(p - c) / max(u_size, 0.05) + 0.12 * u_form.x * fbm(q);
  }
  if (u_kind == 3) { // conic
    vec2 c = center();
    float a = (atan(p.y - c.y, p.x - c.x) + u_angle) / TAU + 0.12 * u_form.x * fbm(q) + 0.08 * m * sin(ph);
    return abs(fract(a) - 0.5) * 2.0;
  }
  if (u_kind == 4) { // noise
    return fbm(q) * 0.75 + 0.5;
  }
  if (u_kind == 5) { // flow
    vec2 fq = q * 0.6;
    vec2 a = vec2(lnoise(fq), lnoise(fq + vec2(5.2, 1.3)));
    vec2 b = vec2(lnoise(fq * 1.3 + 1.6 * a + vec2(1.7, 9.2)), lnoise(fq * 1.3 + 1.6 * a + vec2(8.3, 2.8)));
    return fbm(fq + 1.8 * b) * 0.7 + 0.5 + 0.15 * length(a);
  }
  if (u_kind == 6) { // ribbons
    float y = q.y + 0.6 * sin(q.x * 1.3 + ph) + 0.3 * sin(q.x * 2.7 - ph + 1.7) + 0.35 * fbm(q * 0.5);
    return 0.5 + 0.5 * sin(y * PI * mix(0.6, 2.0, u_thickness));
  }
  if (u_kind == 7) { // cells
    vec4 v = voronoi(q * 1.5);
    return mix(v.x * 1.2, hash21(v.zw + u_seed), 0.35);
  }
  if (u_kind == 8) { // spots
    float n = fbm(q);
    return smoothstep(-0.05, 0.05 + u_form.z * 0.35, n) * 0.7 + (n * 0.5 + 0.5) * 0.35;
  }
  if (u_kind == 9) { // marble
    return 0.5 + 0.5 * sin(q.x * 2.0 + q.y + 5.0 * fbm(q * 1.2));
  }
  if (u_kind == 10) { // rays
    vec2 c = center();
    vec2 d = p - c;
    float a = atan(d.y, d.x);
    float n = floor(4.0 + u_form.y * 4.0);
    return 0.5 + 0.45 * sin(a * n + u_form.x * 2.0 * fbm(vec2(cos(a), sin(a)) * 2.0 + length(d)) + m * 0.4 * sin(ph)) - length(d) * 0.3;
  }
  if (u_kind == 11) { // topo
    float n = fbm(q * 0.6) * 0.5 + 0.5;
    float bands = 6.0 + u_thickness * 10.0;
    float line = smoothstep(0.06, 0.0, abs(fract(n * bands) - 0.5) - 0.44);
    return floor(n * bands) / bands + line * 0.15;
  }
  if (u_kind == 12) { // ripples
    float aspect = u_res.x / u_res.y;
    float v = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= min(u_count, 4)) break;
      vec2 pt = (movingPoint(i) - 0.5) * vec2(aspect, 1.0);
      float d = length(p - pt);
      v += sin(d * u_form.y * 14.0 - ph * (1.0 + mod(float(i), 2.0))) / (1.0 + d * 2.0);
    }
    return 0.5 + 0.35 * v;
  }
  if (u_kind == 13) { // plasma
    float v = sin(q.x + ph) + sin(q.y - ph) + sin((q.x + q.y) * 0.7 + ph) + sin(length(q) * 1.3 - 2.0 * ph);
    return 0.5 + 0.5 * sin(v * PI * 0.5);
  }
  if (u_kind == 14) { // wisps
    float n = 1.0 - abs(fbm(q));
    return pow(n, mix(6.0, 1.5, u_thickness));
  }
  if (u_kind == 15) { // liquid lines
    float n = fbm(q * vec2(0.4, 1.6));
    return 0.5 + 0.5 * sin(q.y * 5.0 + 4.0 * n);
  }
  if (u_kind == 16) { // aura
    float aspect = u_res.x / u_res.y;
    float v = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= u_count) break;
      vec2 pt = (movingPoint(i) - 0.5) * vec2(aspect, 1.0);
      float r = mix(0.25, 0.7, u_thickness);
      v += exp(-dot(p - pt, p - pt) / (r * r)) * (float(i) + 1.0) / float(u_count);
    }
    return v * 0.9 + 0.08 * fbm(q);
  }
  if (u_kind == 17) { // threads
    float v = 0.0;
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      float y = 0.35 * sin(q.x * (0.8 + fi * 0.21) + ph + fi * 1.9) + 0.25 * fbm(vec2(q.x * 0.5, fi * 3.1)) + (fi - 3.0) * 0.12;
      v += exp(-abs(q.y - y) * mix(90.0, 18.0, u_thickness));
    }
    return v * 0.7;
  }
  if (u_kind == 18) { // light web
    float a = 1.0 - abs(fbm(q));
    float b = 1.0 - abs(fbm(rot(q, 1.1) + 7.0));
    return max(pow(a, 8.0), pow(b, 8.0)) + 0.15 * a;
  }
  if (u_kind == 19) { // lava
    vec4 v = voronoi(q * 1.4);
    float crack = 1.0 - smoothstep(0.0, mix(0.04, 0.25, u_thickness), v.y - v.x);
    return crack * 0.85 + (fbm(q * 2.0) * 0.5 + 0.5) * 0.25;
  }
  if (u_kind == 20) { // caustics
    float a = 1.0 - abs(fbm(q * 1.2));
    float b = 1.0 - abs(fbm(q * 1.2 + vec2(3.7, 1.9)));
    return pow(a, 10.0) + pow(b, 10.0) * 0.8 + 0.25 * (fbm(q * 0.5) * 0.5 + 0.5);
  }
  if (u_kind == 21) { // holo
    float x = dot(p, dir) * 0.6 + fbm(q) * 0.8;
    return abs(fract(x * (1.0 + u_thickness * 3.0) + ph / TAU) - 0.5) * 2.0;
  }
  if (u_kind == 22) { // chrome
    float n = fbm(q);
    return pow(abs(sin(n * 7.0 + q.y * 1.5)), mix(0.6, 3.0, u_thickness));
  }
  if (u_kind == 23) { // blobs
    float aspect = u_res.x / u_res.y;
    float v = 0.0;
    for (int i = 0; i < 8; i++) {
      vec2 pt = (movingPoint(i) - 0.5) * vec2(aspect, 1.0);
      float r = mix(0.1, 0.3, u_thickness);
      v += r * r / max(dot(p - pt, p - pt), 1e-4);
    }
    return smoothstep(0.8, 1.2 + u_form.z, v) * 0.85 + 0.1 * v / (v + 1.0);
  }
  if (u_kind == 24) { // kaleido
    float n = floor(3.0 + u_thickness * 9.0);
    float a = atan(p.y, p.x);
    float seg = TAU / n;
    a = abs(mod(a, seg) - seg * 0.5);
    vec2 kp = vec2(cos(a), sin(a)) * length(p) * u_form.y * 1.5;
    return fbm(kp + u_form.x * 0.4) * 0.8 + 0.5;
  }
  if (u_kind == 25) { // vortex
    float r = length(p);
    float a = atan(p.y, p.x) + u_form.x * 1.5 / (r + 0.25);
    return 0.5 + 0.5 * sin(a * 3.0 + log(r + 0.01) * u_form.y * 3.0 - ph + fbm(q) * 0.6);
  }
  if (u_kind == 26) { // crystal
    vec4 v = voronoi(q * 1.2);
    return hash21(v.zw + u_seed * 1.3) * 0.8 + v.x * 0.2;
  }
  if (u_kind == 27) { // horizon
    return 0.55 - p.y * 1.1 + 0.08 * u_form.x * fbm(q * vec2(0.6, 2.5)) + 0.03 * m * sin(ph);
  }
  if (u_kind == 28) { // orb
    vec2 c = center();
    float r = length(p - c) / max(u_size * 0.5, 0.05);
    float rim = fbm(vec2(atan(p.y - c.y, p.x - c.x) * 1.5, r * 2.0)) * smoothstep(0.2, 1.0, r);
    return 1.0 - smoothstep(0.0, 1.3, r) + 0.25 * u_form.x * rim;
  }
  if (u_kind == 29) { // light leak
    float aspect = u_res.x / u_res.y;
    vec2 a = vec2(-0.55 * aspect, 0.55) + 0.06 * m * vec2(sin(ph), cos(ph));
    vec2 b = vec2(0.6 * aspect, -0.5) + 0.06 * m * vec2(cos(ph), sin(ph));
    float la = exp(-dot(rot(p - a, 0.6) * vec2(0.6, 2.2), rot(p - a, 0.6) * vec2(0.6, 2.2)) / mix(0.1, 0.5, u_thickness));
    float lb = exp(-dot(rot(p - b, -0.4) * vec2(0.7, 2.0), rot(p - b, -0.4) * vec2(0.7, 2.0)) / mix(0.1, 0.5, u_thickness));
    return la * 0.95 + lb * 0.7 + 0.1 * fbm(q);
  }
  if (u_kind == 30) { // dunes
    float h = sin(q.y * 3.0 + fbm(q * 0.5) * 3.0 + 0.3 * sin(q.x * 2.0 + ph));
    float hx = sin((q.y + 0.01) * 3.0 + fbm((q + vec2(0.0, 0.01)) * 0.5) * 3.0 + 0.3 * sin(q.x * 2.0 + ph));
    return 0.5 + 0.35 * h + (hx - h) * 12.0;
  }
  if (u_kind == 31) { // bars
    float n = floor(6.0 + u_thickness * 30.0);
    float cell = floor((p.x / (u_res.x / u_res.y) + 0.5) * n);
    return fbm(vec2(cell * 0.37, q.y * 0.35)) * 0.8 + 0.5;
  }
  return 0.5;
}

// The pointer: how near it is (1 under it, fading out over the radius), times how present it is.
float pointerNear(vec2 p) {
  vec2 d = p - u_pointer.xy;
  float r = max(u_interact.z, 0.02) * 0.9;
  return exp(-dot(d, d) / (r * r)) * u_pointer.z;
}

// Moves the point the pattern is read at, so the pattern answers the pointer. Spotlight moves nothing.
vec2 bendToPointer(vec2 p) {
  float f = pointerNear(p) * u_interact.y;
  if (f < 1e-4) return p;
  vec2 d = p - u_pointer.xy;
  float r = max(u_interact.z, 0.02) * 0.9;
  int mode = int(u_interact.x);
  if (mode == 0) return p - u_pvel * 0.12 * f;
  if (mode == 1) return p - normalize(d + 1e-5) * f * r * 0.7;
  if (mode == 2) return u_pointer.xy + rot(d, f * 3.0);
  if (mode == 3) return p + normalize(d + 1e-5) * sin(length(d) / r * 18.0 - u_pointer.w * 7.0) * 0.035 * f;
  return p;
}

vec3 lightToPointer(vec3 col, vec2 p) {
  if (int(u_interact.x) != 4) return col;
  float k = u_pointer.z * u_interact.y;
  return col * mix(1.0 - 0.6 * k, 1.0 + 0.9 * k, pointerNear(p) / max(u_pointer.z, 1e-4));
}

// The picture, filling the frame like CSS cover. p is in the centred, aspect-corrected space shapes use.
vec3 imageAt(vec2 p) {
  float aspect = u_res.x / u_res.y, ia = u_source.w;
  vec2 s = aspect > ia ? vec2(1.0, ia / aspect) : vec2(aspect / ia, 1.0);
  vec2 uv = p / vec2(aspect, 1.0) * s / max(u_source.z, 0.01) + 0.5;
  // Mirrored past its edges, so a flow that pushes off the picture finds more picture rather than a smear.
  uv = 1.0 - abs(mod(uv, 2.0) - 1.0);
  return toLinear(texture(u_image, vec2(uv.x, 1.0 - uv.y)).rgb);
}

void main() {
  LC = vec2(cos(u_phase), sin(u_phase));
  vec2 p = (v_uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
  vec2 bent = bendToPointer(p);
  vec3 col;
#ifdef IMAGE
  // The shape's field pushes the picture around: downhill along its slope, so any shape becomes a way to flow.
  vec2 flow;
  if (u_kind == 0) {
    flow = vec2(lnoise(bent * u_form.y + 3.1), lnoise(bent * u_form.y + 8.7)) * 0.12;
  } else {
    // The slope comes from screen derivatives, so the shape is worked out once per pixel, not three times.
    float f0 = shape(bent);
    vec2 g = vec2(dFdx(f0), dFdy(f0)) * u_res.y;
    flow = g / (1.0 + length(g) * 0.25) * 0.04;
  }
  vec3 im = imageAt(bent + flow * u_source.x * 2.0);
  col = u_source.y > 0.0 ? mix(im, ramp(luma(toSrgb(im))), u_source.y) : im;
#else
  if (u_kind == 0) {
    vec2 q = bent + u_form.x * 0.25 * vec2(lnoise(bent * u_form.y + 3.1), lnoise(bent * u_form.y + 8.7));
    col = meshColor(q);
    if (u_bands > 1.5) col = floor(col * u_bands) / (u_bands - 1.0);
  } else {
    col = ramp(shape(bent));
  }
#endif
  col = lightToPointer(col, p);
  fragColor = vec4(adjust(toSrgb(col)), 1.0);
}`;

const LAYER_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform sampler2D u_aux;    // overlay image or ASCII glyph atlas
uniform vec2  u_res;
uniform float u_phase;
uniform float u_frame;
uniform float u_seed;
uniform vec4  u_p[4];
uniform vec3  u_c[3];
uniform int   u_layer;
${COMMON}

vec3 tex(vec2 uv) { return texture(u_tex, uv).rgb; }
float px() { return u_res.y / 1080.0; }

vec3 discBlur(vec2 uv, float radius) {
  vec3 acc = tex(uv); float n = 1.0;
  float aspect = u_res.x / u_res.y;
  for (int i = 1; i < 40; i++) {
    float fi = float(i);
    float r = sqrt(fi / 40.0) * radius;
    vec2 o = vec2(cos(fi * 2.39996), sin(fi * 2.39996)) * r;
    acc += tex(uv + o * vec2(1.0 / aspect, 1.0)); n += 1.0;
  }
  return acc / n;
}

float bayer(vec2 p, int size) {
  ivec2 ip = ivec2(mod(p, float(size)));
  if (size == 2) { int m[4] = int[4](0, 2, 3, 1); return float(m[ip.y * 2 + ip.x]) / 4.0; }
  if (size == 4) { int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5); return float(m[ip.y * 4 + ip.x]) / 16.0; }
  // 8x8 from the recursive construction
  int x = ip.x, y = ip.y, v = 0;
  for (int bit = 0; bit < 3; bit++) {
    int xb = (x >> bit) & 1, yb = (y >> bit) & 1;
    v |= (((xb ^ yb) << 1) | yb) << (2 * (2 - bit));
  }
  return float(v) / 64.0;
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}
// Looping value noise: the sample point circles once per loop.
float lvnoise(vec2 p, float speed) { return vnoise(p + speed * vec2(cos(u_phase), sin(u_phase))); }

vec3 blendMode(vec3 b, vec3 s, int mode) {
  if (mode == 1) return b * s;
  if (mode == 2) return 1.0 - (1.0 - b) * (1.0 - s);
  if (mode == 3) return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
  if (mode == 4) return mix(2.0 * b * s + b * b * (1.0 - 2.0 * s), sqrt(b) * (2.0 * s - 1.0) + 2.0 * b * (1.0 - s), step(0.5, s));
  if (mode == 5) return max(b, s);
  if (mode == 6) return min(b, s);
  if (mode == 7) return abs(b - s);
  return s;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_res.x / u_res.y;
  vec2 frag = uv * u_res;
  vec3 c = tex(uv);
  vec4 P0 = u_p[0], P1 = u_p[1], P2 = u_p[2], P3 = u_p[3];

  if (u_layer == 1) { // grain
    vec2 g = floor(frag / max(P0.y * px(), 1.0));
    float n = hash21(g + (P0.z > 0.5 ? u_frame * 13.7 : 0.0)) - 0.5;
    c += n * P0.x * 0.5;
  }
  else if (u_layer == 2) { // vignette
    float d = length((uv - 0.5) * vec2(aspect, 1.0)) / length(vec2(aspect, 1.0) * 0.5);
    c *= 1.0 - P0.x * smoothstep(1.0 - P0.y, 1.0 + P0.y * 0.2, d);
  }
  else if (u_layer == 3) { // dither: pattern, size, levels, palette / paper, ink
    float s = max(P0.y * px(), 1.0);
    vec2 cell = floor(frag / s);
    vec3 src = tex((cell + 0.5) * s / u_res);
    int t = int(P0.x);
    float th = t == 0 ? hash21(cell + u_seed) : t == 4 ? fract(hash21(cell) + 0.618 * mod(cell.x + cell.y, 7.0)) : bayer(cell, t == 1 ? 2 : t == 2 ? 4 : 8);
    float steps = max(P0.z, 2.0) - 1.0;
    if (P0.w > 0.5) {
      float l = luma(src);
      float q = floor(l * steps + th) / steps;
      c = mix(u_c[1], u_c[0], q);
    } else {
      c = floor(src * steps + th) / steps;
    }
  }
  else if (u_layer == 4) { // fringe: kind, amount, angle
    vec2 d = P0.x > 0.5 ? vec2(cos(P0.z), sin(P0.z)) * 0.02 : (uv - 0.5) * 0.06;
    d *= P0.y;
    c = vec3(tex(uv + d).r, tex(uv).g, tex(uv - d).b);
  }
  else if (u_layer == 5) { // iridescence: strength, film, hue
    float l = luma(c);
    float t = l * (1.0 + P0.y * 4.0) + P0.z + 0.08 * sin(u_phase);
    vec3 film = 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
    c = mix(c, c * (0.6 + film * 0.8) + film * 0.15, P0.x);
  }
  else if (u_layer == 6) { // flare: x, y, strength, reach / color
    vec2 lp = vec2(P0.x, 1.0 - P0.y);
    vec2 d = (uv - lp) / 48.0 * (0.4 + P0.w);
    vec2 s = uv; float acc = 0.0, decay = 1.0;
    for (int i = 0; i < 48; i++) {
      s -= d;
      vec3 t = tex(s);
      acc += max(luma(t) - 0.45, 0.0) * decay;
      decay *= 0.965;
    }
    c += acc / 48.0 * P0.z * 6.0 * u_c[0];
  }
  else if (u_layer == 7) { // glow: amount, spread, cutoff / color
    vec3 acc = vec3(0.0);
    float r = P0.y * 0.08;
    for (int i = 0; i < 40; i++) {
      float fi = float(i);
      vec2 o = vec2(cos(fi * 2.39996), sin(fi * 2.39996)) * sqrt(fi / 40.0) * r;
      vec3 t = tex(uv + o * vec2(1.0 / aspect, 1.0));
      acc += max(t - P0.z, 0.0);
    }
    c += acc / 40.0 * P0.x * 3.0 * u_c[0];
  }
  else if (u_layer == 8) { // blur: kind, amount, angle, center / band
    int t = int(P0.x);
    if (t == 1) {
      vec2 d = vec2(cos(P0.z), sin(P0.z)) * P0.y * 0.06 / vec2(aspect, 1.0);
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 32; i++) acc += tex(uv + d * (float(i) / 31.0 - 0.5));
      c = acc / 32.0;
    } else {
      float amt = P0.y;
      if (t == 2) amt *= smoothstep(1.0 - P0.w, 1.0, 1.0 - uv.y + (1.0 - P0.w) * 0.0) + smoothstep(0.0, 1.0, abs(uv.y - (1.0 - P0.w)));
      if (t == 3) amt *= smoothstep(P1.x * 0.5, P1.x * 0.5 + 0.25, abs(uv.y - (1.0 - P0.w)));
      c = discBlur(uv, amt * 0.04);
    }
  }
  else if (u_layer == 9) { // retro: kind, amount, lines, noise / bleed
    int t = int(P0.x);
    vec2 u = uv;
    if (t == 0) {
      vec2 cc = u - 0.5;
      u = 0.5 + cc * (1.0 + P0.y * 0.18 * dot(cc, cc));
    } else if (t == 1) {
      float line = floor(frag.y / (3.0 * px()));
      u.x += (hash21(vec2(line, u_frame)) - 0.5) * 0.004 * P0.y + sin(uv.y * 30.0 + u_phase) * 0.002 * P0.y;
    } else {
      vec2 blk = floor(uv * vec2(8.0, 24.0));
      float h = hash21(blk + floor(u_frame / 3.0));
      if (h > 1.0 - P0.y * 0.25) u.x += (hash21(blk + 3.1) - 0.5) * 0.15;
    }
    float sh = P1.x * 0.006 * (t == 0 ? 1.0 : 2.0);
    c = vec3(tex(u + vec2(sh, 0.0)).r, tex(u).g, tex(u - vec2(sh, 0.0)).b);
    float scan = 0.5 + 0.5 * sin(frag.y / px() * PI * 0.5);
    c *= 1.0 - P0.z * 0.5 * scan;
    c += (hash21(frag + u_frame * 7.3) - 0.5) * P0.w * 0.2;
    if (t == 0) {
      vec3 mask = vec3(mod(floor(frag.x / px()), 3.0) == 0.0 ? 1.0 : 0.75, mod(floor(frag.x / px()), 3.0) == 1.0 ? 1.0 : 0.75, mod(floor(frag.x / px()), 3.0) == 2.0 ? 1.0 : 0.75);
      c *= mix(vec3(1.0), mask, P0.y * 0.6);
      if (u.x < 0.0 || u.x > 1.0 || u.y < 0.0 || u.y > 1.0) c = vec3(0.0);
    }
  }
  else if (u_layer == 10) { // ascii: size, glyph count, colour mode / ink, paper
    float s = max(P0.x * px(), 4.0);
    vec2 cell = floor(frag / vec2(s * 0.6, s));
    vec2 cuv = fract(frag / vec2(s * 0.6, s));
    vec3 src = tex((cell + 0.5) * vec2(s * 0.6, s) / u_res);
    float l = luma(src);
    float idx = floor(clamp(l, 0.0, 0.999) * P0.y);
    float g = texture(u_aux, vec2((idx + cuv.x) / P0.y, 1.0 - cuv.y)).r;
    c = P0.z > 0.5 ? mix(u_c[1], u_c[0], g) : mix(u_c[1], src * 1.2, g);
  }
  else if (u_layer == 11) { // engrave: spacing, angle, weight, mode / ink, paper
    float s = max(P0.x * px(), 2.0);
    vec2 r = rot(frag, P0.y);
    float l = luma(tex(uv));
    float d = abs(fract(r.y / s) - 0.5);
    float w = (1.0 - l) * 0.5 * P0.z;
    float ink = 1.0 - smoothstep(w - 0.06, w + 0.06, d);
    c = mix(u_c[1], P0.w > 0.5 ? u_c[0] : tex(uv) * 0.85, ink);
  }
  else if (u_layer == 12) { // halftone: size, angle, layout, mode / contrast / ink, paper
    float s = max(P0.x * px(), 3.0);
    vec2 r = rot(frag, P0.y) / s;
    vec2 cell, f;
    if (P0.z > 0.5) {
      vec2 rr = vec2(r.x, r.y / 0.8660254);
      float row = floor(rr.y);
      rr.x += mod(row, 2.0) * 0.5;
      cell = floor(rr); f = fract(rr) - 0.5; f.y *= 0.8660254;
      cell.x -= mod(row, 2.0) * 0.5;
      cell.y *= 0.8660254;
    } else {
      cell = floor(r); f = fract(r) - 0.5;
    }
    vec2 center = rot((cell + 0.5) * s, -P0.y) / u_res;
    vec3 src = tex(center);
    float l = pow(clamp(luma(src), 0.0, 1.0), P1.x);
    float rad = sqrt(1.0 - l) * 0.62;
    float dot_ = 1.0 - smoothstep(rad - 0.05, rad + 0.05, length(f));
    c = mix(u_c[1], P0.w > 0.5 ? u_c[0] : src, dot_);
  }
  else if (u_layer == 13) { // ripple: size, height, sparkle, speed
    vec2 q = uv * vec2(aspect, 1.0) * (3.0 / max(P0.x, 0.1));
    float sp = max(P0.w, 1.0);
    vec2 off = vec2(lvnoise(q, sp) - 0.5, lvnoise(q + 7.3, sp) - 0.5) + 0.5 * vec2(sin(q.y * 2.0 + u_phase * sp), cos(q.x * 2.0 - u_phase * sp));
    c = tex(uv + off * P0.y * 0.03);
    float ca = pow(1.0 - abs(lvnoise(q * 2.0, sp) - lvnoise(q * 2.0 + 3.7, sp)), 12.0);
    c += ca * P0.z;
  }
  else if (u_layer == 14) { // lens: size, bend, rim, haze / spectrum, shine
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 b = vec2(aspect, 1.0) * 0.5 * P0.x;
    float rr = min(b.x, b.y) * 0.45;
    vec2 qd = abs(p) - b + rr;
    float sd = length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0) - rr;
    if (sd < 0.0) {
      float e = max(P0.z * 0.25, 0.01);
      float k = smoothstep(-e, 0.0, sd);
      vec2 n = normalize(p + 1e-5) * k * k;
      vec2 o = -n * P0.y * 0.12 / vec2(aspect, 1.0);
      vec3 base = P0.w > 0.01 ? discBlur(uv + o, P0.w * 0.03) : tex(uv + o);
      float disp = P1.x * 0.01;
      c = vec3(tex(uv + o * (1.0 + disp * 10.0)).r, base.g, tex(uv + o * (1.0 - disp * 10.0)).b);
      c = mix(c, base, 0.5);
      c += smoothstep(-0.006, 0.0, sd) * P1.y * 0.8 + k * P1.y * 0.12 * max(dot(normalize(p + 1e-5), vec2(-0.6, 0.8)), 0.0);
    } else {
      c *= 1.0 - 0.25 * exp(-sd * 40.0) * P0.y;
    }
  }
  else if (u_layer == 15) { // reeded glass: finish, pattern, ridge, size / angle, depth, offset, blur / spectrum, speed, shade, shine / haze / shade, shine colours
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 r = rot(p, P1.x);
    float w = mix(0.012, 0.2, P0.w);
    int sh = int(P0.y);
    float coord;
    if (sh == 1) coord = r.x + 0.04 * sin(r.y * 10.0);
    else if (sh == 2) coord = length(p);
    else coord = r.x;
    coord += P2.y * w * u_phase / TAU + P1.z * w;
    float x = fract(coord / w) - 0.5;
    float y2 = sh == 3 ? fract(r.y / w) - 0.5 : 0.0;
    int prof = int(P0.z);
    float bend = prof == 0 ? x : prof == 1 ? sin(x * PI) * 0.5 : sign(x) * 0.25;
    vec2 dirv = sh == 2 ? normalize(p + 1e-5) : rot(vec2(1.0, 0.0), -P1.x);
    vec2 o = (dirv * bend + (sh == 3 ? rot(vec2(0.0, 1.0), -P1.x) * y2 : vec2(0.0))) * P1.y * w * 2.0 / vec2(aspect, 1.0);
    if (P0.x > 0.5) o += (hash22(floor(frag / max(px(), 1.0)) + u_frame * 0.0) - 0.5) * P3.x * 0.04;
    float disp = P2.x * 0.3;
    vec3 base = P1.w > 0.01 ? discBlur(uv + o, P1.w * 0.02) : tex(uv + o);
    c = vec3(tex(uv + o * (1.0 + disp)).r, base.g, tex(uv + o * (1.0 - disp)).b);
    float edge = abs(x) * 2.0;
    c = mix(c, u_c[0], P2.z * smoothstep(0.6, 1.0, edge) * 0.8);
    c = mix(c, u_c[1], P2.w * (1.0 - smoothstep(0.0, 0.25, abs(x + 0.2))) * 0.7);
  }
  else if (u_layer == 16) { // mosaic: size, cell, gap / gap colour
    float s = max(P0.x * px(), 2.0);
    int shp = int(P0.y);
    vec2 cell, f;
    if (shp == 2) {
      vec2 rr = vec2(frag.x / s, frag.y / (s * 0.8660254));
      float row = floor(rr.y);
      rr.x += mod(row, 2.0) * 0.5;
      cell = vec2(floor(rr.x) - mod(row, 2.0) * 0.5, row);
      f = fract(rr) - 0.5;
      cell = (cell + 0.5) * vec2(s, s * 0.8660254);
    } else {
      cell = (floor(frag / s) + 0.5) * s;
      f = fract(frag / s) - 0.5;
    }
    c = tex(cell / u_res);
    float g = P0.z * 0.5;
    float inside = shp == 1 ? step(length(f), 0.5 - g * 0.5) : step(max(abs(f.x), abs(f.y)), 0.5 - g * 0.5);
    c = mix(u_c[0], c, inside);
  }
  else if (u_layer == 17) { // bend: kind, amount, waves, angle / speed
    int t = int(P0.x);
    vec2 p = rot((uv - 0.5) * vec2(aspect, 1.0), P0.w);
    float ph = u_phase * P1.x;
    float a = P0.y, f = P0.z;
    if (t == 0) p.x += sin(p.y * f * TAU + ph) * a * 0.06;
    else if (t == 1) p.x += (abs(fract(p.y * f + ph / TAU) - 0.5) * 4.0 - 1.0) * a * 0.05;
    else if (t == 2) { float r = length(p); p += normalize(p + 1e-5) * sin(r * f * 20.0 - ph) * a * 0.02; }
    else if (t == 3) { float r = length(p); p = rot(p, a * 3.0 * smoothstep(0.7, 0.0, r) + 0.2 * a * sin(ph)); }
    else if (t == 4) p += (vec2(lvnoise(p * f * 3.0, 1.0), lvnoise(p * f * 3.0 + 9.1, 1.0)) - 0.5) * a * 0.12;
    else if (t == 5) { float r = length(p); p *= pow(r / 0.6 + 1e-4, a * 0.6) / (r / 0.6 + 1e-4) ; }
    else if (t == 6) p = abs(p);
    else if (t == 7) { float row = floor((p.y + 0.5) * f * 8.0); p.x += (hash21(vec2(row, u_seed)) - 0.5) * a * 0.15 * (1.0 + 0.3 * sin(ph + row)); }
    p = rot(p, -P0.w);
    c = tex(p / vec2(aspect, 1.0) + 0.5);
  }
  else if (u_layer == 18) { // streak: length, angle, churn
    vec2 d = vec2(cos(P0.y), sin(P0.y)) / vec2(aspect, 1.0);
    float n = lvnoise(uv * vec2(aspect, 1.0) * 4.0, 0.6) * P0.z;
    vec3 acc = vec3(0.0); float wsum = 0.0;
    for (int i = 0; i < 32; i++) {
      float t = float(i) / 31.0;
      float w = 1.0 - t * 0.6;
      acc += tex(uv - d * t * P0.x * (0.1 + n * 0.2)) * w; wsum += w;
    }
    c = acc / wsum;
  }
  else if (u_layer == 19) { // paint (Kuwahara filter): brush
    int r = int(clamp(P0.x * 6.0 * px(), 1.0, 6.0));
    vec2 tx = 1.0 / u_res;
    vec3 m[4]; vec3 s[4];
    for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); }
    for (int j = -6; j <= 6; j++) {
      if (abs(j) > r) continue;
      for (int i = -6; i <= 6; i++) {
        if (abs(i) > r) continue;
        vec3 t = tex(uv + vec2(float(i), float(j)) * tx);
        int q = (i <= 0 ? 0 : 1) + (j <= 0 ? 0 : 2);
        m[q] += t; s[q] += t * t;
      }
    }
    float n = float((r + 1) * (r + 1));
    float best = 1e9;
    for (int k = 0; k < 4; k++) {
      vec3 mu = m[k] / n;
      vec3 v = abs(s[k] / n - mu * mu);
      float vs = v.r + v.g + v.b;
      if (vs < best) { best = vs; c = mu; }
    }
  }
  else if (u_layer == 20) { // recolor: pivot, amount / low, mid, high
    float l = clamp(luma(c), 0.0, 1.0);
    float b = clamp(P0.x, 0.05, 0.95);
    vec3 g = l < b ? mix(u_c[0], u_c[1], l / b) : mix(u_c[1], u_c[2], (l - b) / (1.0 - b));
    c = mix(c, g, P0.y);
  }
  else if (u_layer == 21) { // wash: bleed, edges, texture / paper
    vec3 soft = discBlur(uv + (vec2(lvnoise(uv * 20.0, 0.3), lvnoise(uv * 20.0 + 4.0, 0.3)) - 0.5) * 0.01 * P0.x, P0.x * 0.012);
    vec2 tx = 2.0 / u_res;
    float e = abs(luma(tex(uv + vec2(tx.x, 0.0))) - luma(tex(uv - vec2(tx.x, 0.0)))) + abs(luma(tex(uv + vec2(0.0, tx.y))) - luma(tex(uv - vec2(0.0, tx.y))));
    c = soft * (1.0 - e * P0.y * 2.5);
    float pn = vnoise(frag / (3.0 * px())) * 0.5 + vnoise(frag / (11.0 * px())) * 0.5;
    c = mix(c, c * u_c[0] * (0.85 + pn * 0.3), P0.z);
  }
  else if (u_layer == 22) { // paper texture: tooth, scale, emboss
    vec2 q = frag / (px() * 4.0 * max(P0.y, 0.2));
    float n = vnoise(q) * 0.5 + vnoise(q * 2.7) * 0.3 + vnoise(q * 7.1) * 0.2;
    float fib = vnoise(vec2(q.x * 0.3, q.y * 6.0));
    c = tex(uv + (vec2(n, fib) - 0.5) * P0.z * 0.01);
    c *= 1.0 - (n * 0.6 + fib * 0.4 - 0.5) * P0.x * 0.5;
  }
  else if (u_layer == 23) { // overlay: opacity, blend, fit, scale / x, y, image aspect, loaded
    if (P1.w > 0.5) {
      float ia = P1.z;
      vec2 s = vec2(1.0);
      int fit = int(P0.z);
      if (fit == 0) s = aspect > ia ? vec2(1.0, ia / aspect) : vec2(aspect / ia, 1.0);
      else if (fit == 1) s = aspect > ia ? vec2(aspect / ia, 1.0) : vec2(1.0, ia / aspect);
      vec2 iuv = (uv - 0.5 - vec2(P1.x, -P1.y) * 0.5) * s / max(P0.w, 0.01) + 0.5;
      if (iuv.x >= 0.0 && iuv.x <= 1.0 && iuv.y >= 0.0 && iuv.y <= 1.0) {
        vec4 im = texture(u_aux, vec2(iuv.x, 1.0 - iuv.y));
        vec3 ic = adjust(im.rgb);
        c = mix(c, blendMode(c, ic, int(P0.y)), im.a * P0.x);
      }
    }
  }
  else if (u_layer == 24) { // kaleido: segments, angle, zoom, turns per loop
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float n = max(P0.x, 2.0);
    float seg = TAU / n;
    // Turning by whole segments per loop lands back on the same picture, so the loop stays seamless.
    float a = mod(atan(p.y, p.x) + P0.y + u_phase * P0.w / n, seg);
    a = abs(a - seg * 0.5);
    p = vec2(cos(a), sin(a)) * length(p) / max(P0.z, 0.05);
    c = tex(p / vec2(aspect, 1.0) + 0.5);
  }
  else if (u_layer == 25) { // relief: depth, light angle, shine, gloss
    vec2 tx = 3.0 * px() / u_res;
    float hx = luma(tex(uv + vec2(tx.x, 0.0))) - luma(tex(uv - vec2(tx.x, 0.0)));
    float hy = luma(tex(uv + vec2(0.0, tx.y))) - luma(tex(uv - vec2(0.0, tx.y)));
    vec3 n = normalize(vec3(-hx, -hy, mix(0.2, 0.008, P0.x)));
    vec3 L = normalize(vec3(cos(P0.y), sin(P0.y), 0.9));
    float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), mix(4.0, 60.0, P0.w));
    c = c * (0.55 + 0.6 * dot(n, L)) + spec * P0.z * 0.9;
  }
  else if (u_layer == 26) { // neon edges: amount, width, dim, tint / colour
    vec2 tx = (1.0 + P0.y * 4.0) * px() / u_res;
    vec2 g = vec2(luma(tex(uv + vec2(tx.x, 0.0))) - luma(tex(uv - vec2(tx.x, 0.0))), luma(tex(uv + vec2(0.0, tx.y))) - luma(tex(uv - vec2(0.0, tx.y))));
    vec2 t2 = tx * 4.0;
    vec2 g2 = vec2(luma(tex(uv + vec2(t2.x, 0.0))) - luma(tex(uv - vec2(t2.x, 0.0))), luma(tex(uv + vec2(0.0, t2.y))) - luma(tex(uv - vec2(0.0, t2.y))));
    float e = smoothstep(0.004, 0.05, length(g));
    float halo = smoothstep(0.01, 0.12, length(g2));
    vec3 glow = mix(c * 1.6 + 0.08, u_c[0], P0.w);
    c = c * (1.0 - P0.z * 0.85) + glow * (e + halo * 0.45) * P0.x * 1.4;
  }
  else if (u_layer == 27) { // contour lines: lines, weight, mode / ink, paper
    float l = luma(c) * P0.x;
    float d = min(fract(l), 1.0 - fract(l));
    float w = fwidth(l) * P0.y * max(px(), 1.0);
    float line = 1.0 - smoothstep(w * 0.5, w * 1.5, d);
    vec3 bg = P0.z > 0.5 ? u_c[1] : c;
    vec3 ink = P0.z > 0.5 ? u_c[0] : c * 0.3;
    c = mix(bg, ink, line);
  }
  else if (u_layer == 28) { // LED wall: size, gap, glow / backing
    float s = max(P0.x * px(), 3.0);
    vec2 cell = floor(frag / s);
    vec2 f = fract(frag / s) - 0.5;
    vec3 src = tex((cell + 0.5) * s / u_res);
    float r = 0.5 - P0.y * 0.35;
    float d = length(f);
    float lamp = 1.0 - smoothstep(r - 0.06, r, d);
    float halo = exp(-d * d / max(r * r, 1e-3) * 1.5) * P0.z;
    c = u_c[0] + src * (lamp * 1.1 + halo * 0.6);
  }
  else if (u_layer == 29) { // rain on glass: size, drops, frost, falls per loop
    vec2 n = vec2(0.0);
    float wet = 0.0, shine = 0.0;
    // The rows repeat every 8, and a loop scrolls whole repeats, so the last frame meets the first.
    float t = u_phase / TAU * P0.w * 8.0;
    for (int l = 0; l < 2; l++) {
      float fl = float(l);
      vec2 g = vec2(uv.x * aspect, uv.y * 0.5) * mix(11.0, 3.0, P0.x) * (1.0 + fl * 0.8) + fl * 3.7;
      float col = floor(g.x);
      g.y += t * (1.0 + mod(col, 2.0)) + floor(hash21(vec2(col, fl)) * 8.0);
      vec2 id = vec2(col, mod(floor(g.y), 8.0));
      float h = hash21(id + fl * 13.0 + u_seed);
      if (h < P0.y) {
        vec2 f = fract(g) - 0.5;
        vec2 d = (f - (hash22(id + fl) - 0.5) * 0.5) * vec2(1.0, 2.0);
        float r = 0.14 + 0.16 * h / max(P0.y, 0.05);
        float m = smoothstep(r, r * 0.7, length(d));
        n += d / r * m;
        wet = max(wet, m);
        shine = max(shine, smoothstep(r * 0.3, 0.0, length(d - vec2(-0.3, 0.3) * r)));
      }
    }
    vec3 pane = P0.z > 0.0 ? discBlur(uv, P0.z * 0.035) : c;
    c = mix(pane, tex(uv - n * 0.09) * 1.08, wet) + shine * 0.3;
  }
  else if (u_layer == 30) { // shattered glass: pieces, shift, edges, drift
    vec2 q = (uv - 0.5) * vec2(aspect, 1.0) * P0.x;
    vec2 ip = floor(q), fp = fract(q), id = vec2(0.0);
    float d1 = 9.0, d2 = 9.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 r = g + hash22(ip + g + u_seed) - fp;
        float d = dot(r, r);
        if (d < d1) { d2 = d1; d1 = d; id = ip + g; }
        else if (d < d2) { d2 = d; }
      }
    }
    float edge = sqrt(d2) - sqrt(d1);
    float h = hash21(id + 7.3);
    vec2 off = (hash22(id + 3.1) - 0.5) * (P0.y * 0.14 + sin(u_phase + h * TAU) * P0.w * 0.03);
    c = tex(uv + off / vec2(aspect, 1.0)) * (0.82 + h * 0.36);
    c += (1.0 - smoothstep(0.0, 0.05, edge)) * P0.z * (0.35 + h * 0.65);
  }
  else if (u_layer == 31) { // woven thread: thread size, depth
    float s = max(P0.x * px(), 2.0);
    vec2 cell = floor(frag / s), f = fract(frag / s);
    vec3 src = tex((cell + 0.5) * s / u_res);
    float over = mod(cell.x + cell.y, 2.0);
    float round_ = sin(PI * (over > 0.5 ? f.x : f.y));
    float along = 0.75 + 0.25 * sin(PI * (over > 0.5 ? f.y : f.x));
    c = src * mix(1.0, (0.45 + 0.75 * round_) * along, P0.y);
  }
  else if (u_layer == 32) { // twirl: turns, radius, sway / across, down
    vec2 ctr = vec2(P1.x, 1.0 - P1.y);
    vec2 d = (uv - ctr) * vec2(aspect, 1.0);
    float fall = 1.0 - smoothstep(0.0, 1.0, length(d) / max(P0.y, 0.01));
    vec2 r = rot(d, (P0.x + sin(u_phase) * P0.z * 0.25) * TAU * fall * fall);
    c = tex(r / vec2(aspect, 1.0) + ctr);
  }
  else if (u_layer == 33) { // glitch: amount, slices, colour split, jumps per loop
    float k = floor(u_phase / TAU * P0.w) + u_seed;
    float row = floor(uv.y * P0.y);
    float hit = step(1.0 - P0.x * 0.7, hash21(vec2(row, k)));
    float big = step(1.0 - P0.x * 0.3, hash21(vec2(floor(uv.y * P0.y * 0.2), k + 5.0)));
    float shift = (hash21(vec2(row + 3.0, k)) - 0.5) * 0.3 * P0.x * hit + (hash21(vec2(floor(uv.y * P0.y * 0.2), k + 9.0)) - 0.5) * 0.2 * big;
    float sp = P0.z * 0.012 * (1.0 + (hit + big) * 2.5);
    c = vec3(tex(vec2(uv.x + shift + sp, uv.y)).r, tex(vec2(uv.x + shift, uv.y)).g, tex(vec2(uv.x + shift - sp, uv.y)).b);
  }
  else if (u_layer == 34) { // pixel sort: cutoff, length, angle
    vec2 dir = vec2(cos(P0.z), sin(P0.z));
    // Each line of pixels runs its own length, so the streaks stay uneven like a real sort.
    float line = floor(dot(frag, vec2(-dir.y, dir.x)) / max(2.0 * px(), 1.0));
    vec2 st = dir / vec2(aspect, 1.0) * P0.y * (0.15 + 0.85 * hash21(vec2(line, u_seed))) * 0.4 / 32.0;
    float best = luma(c);
    if (best > P0.x) {
      for (int i = 1; i <= 32; i++) {
        vec3 s = tex(uv - st * float(i));
        float l = luma(s);
        if (l < P0.x) break;
        if (l > best) { best = l; c = s; }
      }
    }
  }
  else if (u_layer == 35) { // pixel stretch: side, starts at, wave
    int side = int(P0.x);
    float at = side == 0 || side == 1 ? 1.0 - P0.y : P0.y;
    float along = side < 2 ? uv.y : uv.x;
    float across = side < 2 ? uv.x : uv.y;
    if (side == 0 || side == 2 ? along < at : along > at) {
      float w = sin(across * 9.0 + u_phase) * 0.5 + sin(across * 23.0 - u_phase) * 0.25;
      float line = at + w * P0.z * 0.03;
      c = tex(side < 2 ? vec2(across, line) : vec2(line, across));
    }
  }
  else if (u_layer == 36) { // prism: kind, spread, angle
    vec2 d = P0.x > 0.5 ? vec2(cos(P0.z), sin(P0.z)) * 0.05 : (uv - 0.5) * 0.28;
    d *= P0.y;
    vec3 acc = vec3(0.0), weight = vec3(0.0);
    for (int i = 0; i < 12; i++) {
      float w = float(i) / 11.0;
      vec3 band = clamp(vec3(1.5 - abs(w * 4.0 - 3.2), 1.5 - abs(w * 4.0 - 2.0), 1.5 - abs(w * 4.0 - 0.8)), 0.0, 1.0);
      acc += tex(uv + d * (w - 0.5)) * band;
      weight += band;
    }
    c = acc / weight;
  }
  else if (u_layer == 37) { // thermal camera: amount, contrast, heat
    float t = clamp((luma(c) - 0.5) * P0.y + 0.5 + P0.z + 0.012 * sin(u_phase), 0.0, 1.0) * 6.0;
    vec3 m[7] = vec3[7](vec3(0.02, 0.0, 0.1), vec3(0.15, 0.05, 0.6), vec3(0.65, 0.05, 0.65), vec3(0.95, 0.15, 0.2), vec3(1.0, 0.55, 0.05), vec3(1.0, 0.9, 0.2), vec3(1.0, 1.0, 0.92));
    int i = int(min(floor(t), 5.0));
    c = mix(c, mix(m[i], m[i + 1], t - float(i)), P0.x);
  }
  else if (u_layer == 38) { // 3D glasses: shift, depth, mono
    vec2 d = vec2((0.2 + (luma(c) - 0.5) * P0.y * 1.6) * P0.x * 0.05, 0.0);
    vec3 l = tex(uv + d), r = tex(uv - d);
    l = mix(l, vec3(luma(l)), P0.z);
    r = mix(r, vec3(luma(r)), P0.z);
    c = vec3(l.r, r.g, r.b);
  }
  else if (u_layer == 39) { // crosshatch: spacing, weight, mode / ink, paper
    float l = luma(c), s = max(P0.x * px(), 2.0), ink = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float a = 0.6 + fi * 0.8;
      float v = dot(frag / s, vec2(cos(a), sin(a)));
      float w = 0.06 + P0.y * 0.2;
      float dark = smoothstep(0.85 - fi * 0.2, 0.7 - fi * 0.2, l);
      ink = max(ink, dark * (1.0 - smoothstep(w, w + 0.1, abs(fract(v) - 0.5))));
    }
    vec3 bg = P0.z > 0.5 ? u_c[1] : c;
    vec3 fg = P0.z > 0.5 ? u_c[0] : c * 0.22;
    c = mix(bg, fg, ink);
  }
  else if (u_layer == 40) { // stipple: size, density, mode / ink, paper
    float s = max(P0.x * px(), 2.0);
    vec2 cell = floor(frag / s), f = fract(frag / s) - 0.5;
    vec3 src = tex((cell + 0.5) * s / u_res);
    float dark = 1.0 - luma(src);
    vec2 h = hash22(cell + u_seed);
    float r = sqrt(dark) * mix(0.15, 0.55, P0.y);
    float dots = step(hash21(cell + 9.1), dark * 1.1 + 0.1 + P0.y * 0.3) * (1.0 - smoothstep(r - 0.08, r, length(f - (h - 0.5) * 0.35)));
    vec3 bg = P0.z > 0.5 ? u_c[1] : src * 1.15 + 0.1;
    vec3 fg = P0.z > 0.5 ? u_c[0] : src * 0.25;
    c = mix(bg, fg, dots);
  }
  else if (u_layer == 41) { // risograph: dots, misprint, grain / first ink, second ink, paper
    float s = max(P0.x * px(), 2.0);
    vec2 off = vec2(P0.y * 0.012, -P0.y * 0.008);
    vec2 q1 = rot(frag, 0.26) / s * PI, q2 = rot(frag, 1.13) / s * PI;
    float d1 = 0.5 + 0.5 * cos(q1.x) * cos(q1.y), d2 = 0.5 + 0.5 * cos(q2.x) * cos(q2.y);
    float grain = (hash21(floor(frag) + u_seed) - 0.5) * P0.z * 0.5;
    vec3 a = tex(uv + off), b = tex(uv - off);
    float m1 = smoothstep(d1 - 0.12, d1 + 0.12, 1.0 - a.g + grain);
    float m2 = smoothstep(d2 - 0.12, d2 + 0.12, 1.0 - b.r + grain);
    c = u_c[2] * mix(vec3(1.0), u_c[0], m1) * mix(vec3(1.0), u_c[1], m2);
  }
  fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

// The cursor's wake, in a small buffer that feeds itself: xy is how fast the look is being dragged there, z is how
// much ink has been laid. The pointer stirs it, it carries itself along and it fades, so a move keeps swirling after it.
const FIELD_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_prev;
uniform vec4 u_pointer;  // x, y (centred, aspect space), presence
uniform vec2 u_pvel;
uniform vec3 u_step;     // seconds, aspect, radius
void main() {
  float dt = u_step.x, aspect = u_step.y, r = u_step.z;
  vec2 v = texture(u_prev, v_uv).xy;
  vec3 s = texture(u_prev, v_uv - v / vec2(aspect, 1.0) * dt).xyz;
  vec2 p = (v_uv - 0.5) * vec2(aspect, 1.0);
  // A slow turn that differs from place to place, so the wake curls instead of sliding.
  float a = dt * 2.4 * sin(p.x * 7.0 + p.y * 5.0);
  s.xy = mat2(cos(a), sin(a), -sin(a), cos(a)) * s.xy;
  s *= exp(-dt * vec3(1.2, 1.2, 1.0));
  vec2 d = p - u_pointer.xy;
  float g = exp(-dot(d, d) / (r * r)) * u_pointer.z;
  s.xy += u_pvel * g * dt * 10.0;
  s.z = min(s.z + g * length(u_pvel) * dt * 6.0, 1.0);
  fragColor = vec4(s, 1.0);
}`;

// The interactions that work on the finished picture, drawn last, so they hold on any shape, effect or image.
const POINTER_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
#define TAU 6.28318530718
uniform sampler2D u_tex;
uniform sampler2D u_field;
uniform vec2 u_res;
uniform vec4 u_pointer;   // x, y (centred, aspect space), presence, seconds since it arrived
uniform vec2 u_pvel;
uniform vec4 u_interact;  // mode, strength, radius, 1 when the wake buffer is live
uniform vec3 u_burst;     // x, y, seconds since the click (below 0: none yet)
uniform int u_mode;

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash22(vec2 p) { float n = hash21(p); return vec2(n, hash21(p + n + 17.31)); }
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c) * p; }
float aspect() { return u_res.x / u_res.y; }
vec3 at(vec2 q) { return texture(u_tex, q / vec2(aspect(), 1.0) + 0.5).rgb; }

void main() {
  vec2 p = (v_uv - 0.5) * vec2(aspect(), 1.0);
  vec2 d = p - u_pointer.xy;
  float l = length(d), s = u_interact.y, here = u_pointer.z;
  float r = max(u_interact.z, 0.02) * 0.9;
  float near = exp(-dot(d, d) / (r * r)) * here;
  vec2 out_ = d / max(l, 1e-4);
  float speed = length(u_pvel);
  vec3 c = at(p);

  if (u_mode == 5 || u_mode == 6) { // liquid, comet: the wake
    vec3 w = texture(u_field, v_uv).xyz;
    if (u_interact.w < 0.5) w = vec3(u_pvel * near * 0.5, near * speed * 0.3);
    if (u_mode == 5) {
      c = at(p - w.xy * (0.06 + s * 0.18));
    } else {
      vec2 o = w.xy * (0.02 + s * 0.05);
      c = vec3(at(p - o * 2.0).r, at(p - o).g, at(p).b);
      c += w.z * (0.3 + s) * (c * 1.6 + 0.12);
    }
  }
  else if (u_mode == 7) { // black hole: light bends round it, and nothing comes out of the middle
    float rs = r * (0.12 + s * 0.3) * here;
    if (rs > 1e-4) {
      vec2 q = rot(d, here * (0.4 + s * 2.2) / (1.0 + l / r * 2.5));
      q -= (q / max(l, 1e-4)) * rs * rs * 1.4 / max(l, rs * 0.5);
      c = at(u_pointer.xy + q);
      float ringWidth = rs * 0.16;
      float ring = exp(-pow((l - rs * 1.25) / ringWidth, 2.0));
      c += ring * (c * 2.2 + 0.2);
      c *= smoothstep(rs * 0.95, rs * 1.1, l);
    }
  }
  else if (u_mode == 8) { // glass lens: a bead of glass that magnifies, with colour at its rim
    float R = r * 1.15 * here;
    if (R > 1e-3 && l < R * 1.3) {
      float t = min(l / R, 1.0);
      float k = mix(0.35 + (1.0 - s) * 0.4, 1.0, t * t * t);
      float fringe = 0.05 * t * t * t * t;
      vec3 g = vec3(at(u_pointer.xy + d * k * (1.0 + fringe)).r, at(u_pointer.xy + d * k).g, at(u_pointer.xy + d * k * (1.0 - fringe)).b);
      float edge = max(fwidth(l), 1e-3);
      float inside = 1.0 - smoothstep(R - edge, R + edge, l);
      float shade = 1.0 - 0.35 * exp(-pow((l - R) / (R * 0.12), 2.0)) * step(R, l);
      c = mix(c * shade, g + pow(t, 7.0) * 0.45 + exp(-pow((l - R * 0.72) / (R * 0.1), 2.0)) * max(dot(out_, vec2(-0.7, 0.7)), 0.0) * 0.35, inside);
    }
  }
  else if (u_mode == 9) { // prism: colours come apart near the pointer, and further the faster it moves
    vec2 o = out_ * near * (0.015 + s * 0.05 + speed * 0.025);
    vec3 acc = vec3(0.0), sum = vec3(0.0);
    for (int i = 0; i < 7; i++) {
      float w = float(i) / 6.0;
      vec3 band = clamp(vec3(1.5 - abs(w * 4.0 - 3.2), 1.5 - abs(w * 4.0 - 2.0), 1.5 - abs(w * 4.0 - 0.8)), 0.0, 1.0);
      acc += at(p + o * (w - 0.5) * 2.0) * band;
      sum += band;
    }
    c = acc / sum;
  }
  else if (u_mode == 10) { // pixels: the picture breaks into bigger blocks the closer the pointer is
    if (near > 0.08) {
      float size = pow(2.0, floor(near * 3.99)) * (0.012 + s * 0.02);
      c = at((floor(p / size) + 0.5) * size);
    }
  }
  else if (u_mode == 11) { // x-ray: a wobbling window onto the picture's negative
    float a = atan(d.y, d.x);
    float R = r * 0.95 * here * (1.0 + 0.07 * sin(a * 5.0 + u_pointer.w * 1.8) + 0.04 * sin(a * 9.0 - u_pointer.w * 2.7));
    float inside = 1.0 - smoothstep(R - 0.006, R + 0.006, l);
    float rim = exp(-pow((l - R) / 0.012, 2.0)) * here;
    vec3 neg = 1.0 - c;
    c = mix(c, mix(neg, neg * vec3(0.55, 0.95, 1.2), s), inside) + rim * vec3(0.5, 0.9, 1.0) * (0.3 + s * 0.5);
  }
  else if (u_mode == 12) { // shockwave: each click sends a ring through the picture
    if (u_burst.z >= 0.0) {
      vec2 b = p - u_burst.xy;
      float bl = length(b);
      float front = u_burst.z * (0.5 + r * 1.2);
      float width = 0.05 + u_burst.z * 0.05;
      float ring = exp(-pow((bl - front) / width, 2.0)) * exp(-u_burst.z * 1.5);
      vec2 o = (b / max(bl, 1e-4)) * ring * (0.03 + s * 0.14);
      c = vec3(at(p - o * 1.25).r, at(p - o).g, at(p - o * 0.75).b) + ring * ring * 0.25;
    }
  }
  else if (u_mode == 13) { // shards: the picture cracks round the pointer and the pieces lift away
    vec2 q = p * mix(22.0, 7.0, u_interact.z);
    vec2 ip = floor(q), fp = fract(q), id = vec2(0.0);
    float d1 = 9.0, d2 = 9.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 v = g + hash22(ip + g) - fp;
        float e = dot(v, v);
        if (e < d1) { d2 = d1; d1 = e; id = ip + g; }
        else if (e < d2) { d2 = e; }
      }
    }
    vec2 centre = (id + hash22(id)) / mix(22.0, 7.0, u_interact.z);
    vec2 cd = centre - u_pointer.xy;
    float lift = exp(-dot(cd, cd) / (r * r)) * here;
    if (lift > 0.01) {
      float h = hash21(id + 4.0);
      vec2 o = (cd / max(length(cd), 1e-4)) * lift * (0.02 + s * 0.12) * (0.5 + h);
      c = at(u_pointer.xy + rot(p - u_pointer.xy, (h - 0.5) * lift * s * 0.5) - o) * (1.0 + (h - 0.5) * lift * 0.6);
      c += (1.0 - smoothstep(0.0, 0.06, sqrt(d2) - sqrt(d1))) * lift * 0.5;
    }
  }
  else if (u_mode == 14) { // glitch: rows near the pointer jump sideways and split into colour
    float band = exp(-pow((p.y - u_pointer.y) / r, 2.0)) * here;
    if (band > 0.01) {
      float tick = floor(u_pointer.w * 14.0);
      float row = floor(p.y * 44.0);
      float h = hash21(vec2(row, tick));
      float shift = (hash21(vec2(row + 7.0, tick)) - 0.5) * step(0.45, h) * band * (0.06 + s * 0.3 + speed * 0.05);
      float split = band * (0.003 + s * 0.012);
      c = vec3(at(p + vec2(shift + split, 0.0)).r, at(p + vec2(shift, 0.0)).g, at(p + vec2(shift - split, 0.0)).b);
    }
  }
  fragColor = vec4(c, 1.0);
}`;

const PRESENT_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
void main() { fragColor = vec4(texture(u_tex, v_uv).rgb, 1.0); }`;

const SHAPE_INDEX = {
  mesh: 0,
  linear: 1,
  radial: 2,
  conic: 3,
  noise: 4,
  curl: 5,
  folds: 6,
  cells: 7,
  spots: 8,
  veins: 9,
  rays: 10,
  topo: 11,
  ripples: 12,
  plasma: 13,
  wisps: 14,
  liquid: 15,
  halo: 16,
  threads: 17,
  web: 18,
  lava: 19,
  caustics: 20,
  holo: 21,
  chrome: 22,
  blobs: 23,
  kaleido: 24,
  vortex: 25,
  crystal: 26,
  horizon: 27,
  orb: 28,
  leak: 29,
  dunes: 30,
  bars: 31,
};

const EFFECT_INDEX = {
  grain: 1,
  vignette: 2,
  dither: 3,
  fringe: 4,
  iridescence: 5,
  flare: 6,
  glow: 7,
  blur: 8,
  retro: 9,
  ascii: 10,
  engrave: 11,
  halftone: 12,
  ripple: 13,
  lens: 14,
  reeded: 15,
  mosaic: 16,
  bend: 17,
  streak: 18,
  paint: 19,
  recolor: 20,
  wash: 21,
  texture: 22,
  overlay: 23,
  kaleido: 24,
  relief: 25,
  neon: 26,
  contour: 27,
  led: 28,
  rain: 29,
  shatter: 30,
  weave: 31,
  twirl: 32,
  glitch: 33,
  pixelsort: 34,
  stretch: 35,
  prism: 36,
  thermal: 37,
  anaglyph: 38,
  crosshatch: 39,
  stipple: 40,
  riso: 41,
};

const INTERACT_INDEX = {
  push: 0,
  repel: 1,
  swirl: 2,
  ripple: 3,
  spotlight: 4,
  liquid: 5,
  comet: 6,
  blackhole: 7,
  lens: 8,
  prism: 9,
  pixels: 10,
  xray: 11,
  shockwave: 12,
  shards: 13,
  glitch: 14,
};
type InteractKey = keyof typeof INTERACT_INDEX;
/** From this index on, an interaction is drawn over the finished picture instead of bending the shape. */
const FIRST_POINTER_PASS = 5;
/** The interactions that stir the wake buffer. */
const usesWake = (m: InteractKey) => m === "liquid" || m === "comet";
/** How long a look keeps drawing after the pointer stops: not at all, while its wake fades, or for as long as the pointer is there. */
const UPKEEP: Record<InteractKey, "rest" | "wake" | "always"> = {
  push: "rest",
  repel: "rest",
  swirl: "rest",
  ripple: "always",
  spotlight: "rest",
  liquid: "wake",
  comet: "wake",
  blackhole: "rest",
  lens: "rest",
  prism: "rest",
  pixels: "rest",
  xray: "always",
  shockwave: "rest",
  shards: "rest",
  glitch: "always",
};
/** Seconds a wake takes to fade out, and a click's ring to leave the picture. */
const WAKE_SECONDS = 4;
const BURST_SECONDS = 3;
/** The wake buffer's width and height: it only ever holds soft shapes. */
const WAKE_SIZE = 256;

/**
 * The pointer as the renderer sees it. x and y are fractions of the canvas (0..1, y down) and the velocity is
 * in canvas heights per second. presence eases from 0 to 1 as the pointer arrives and back as it leaves.
 */
type PointerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  presence: number;
  time: number;
  /** Seconds passed that the wake has not been told about yet. */
  dt: number;
  /** The last click, and how long ago it was, until its ring has left the picture. */
  burst: { x: number; y: number; age: number } | null;
};

/** Fastest the pointer is taken to move, so a flick cannot throw the pattern off the canvas. */
const MAX_SPEED = 4;

/**
 * Follows the pointer with a little lag and momentum, so a look answers it like something with weight: the
 * pattern trails a fast move, settles when the pointer stops and eases back when it leaves.
 */
function createPointer() {
  const state: PointerState = { x: 0.5, y: 0.5, vx: 0, vy: 0, presence: 0, time: 0, dt: 0, burst: null };
  let tx = 0.5;
  let ty = 0.5;
  let inside = false;
  let rested = 0;
  return {
    state,
    /** Where the pointer is now, as a fraction of the canvas, or null once it has left. */
    aim(at: { x: number; y: number } | null) {
      if (!at) {
        inside = false;
        return;
      }
      // Arriving from nowhere: start under the pointer instead of sweeping across from the last place.
      if (!inside && state.presence < 0.01) {
        state.x = at.x;
        state.y = at.y;
      }
      inside = true;
      tx = at.x;
      ty = at.y;
    },
    /** A click at this place, as a fraction of the canvas. */
    press(at: { x: number; y: number }) {
      state.burst = { x: at.x, y: at.y, age: 0 };
    },
    /**
     * Advances dt seconds. Returns true while the pointer still changes the picture under this interaction, so a
     * resting pointer costs nothing unless what it set going is still moving (see UPKEEP).
     */
    step(dt: number, aspect: number, mode: InteractKey) {
      const k = 1 - Math.exp(-dt * 14);
      const nx = state.x + (tx - state.x) * k;
      const ny = state.y + (ty - state.y) * k;
      const d = Math.max(dt, 1e-3);
      let vx = ((nx - state.x) * aspect) / d;
      let vy = (ny - state.y) / d;
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_SPEED) {
        vx *= MAX_SPEED / speed;
        vy *= MAX_SPEED / speed;
      }
      const follow = Math.min(1, dt * 10);
      state.vx += (vx - state.vx) * follow;
      state.vy += (vy - state.vy) * follow;
      state.x = nx;
      state.y = ny;
      state.presence += ((inside ? 1 : 0) - state.presence) * (1 - Math.exp(-dt * (inside ? 6 : 2.5)));
      if (!inside && state.presence < 0.002) state.presence = 0;
      state.time = inside || state.presence > 0 ? state.time + dt : 0;
      state.dt += dt;
      if (state.burst) {
        state.burst.age += dt;
        if (state.burst.age > BURST_SECONDS) state.burst = null;
      }
      const still = Math.hypot(state.vx, state.vy) < 1e-3 && Math.hypot(tx - state.x, ty - state.y) < 1e-4;
      const changing = !still || Math.abs((inside ? 1 : 0) - state.presence) > 0.002;
      rested = changing ? 0 : rested + dt;
      if (changing || state.burst) return true;
      const keep = UPKEEP[mode];
      return keep === "always" ? state.presence > 0 : keep === "wake" ? rested < WAKE_SECONDS : false;
    },
  };
}

/** Where a pointer event falls on a canvas, as a fraction of it, or null when it is outside. */
function pointerOn(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const r = canvas.getBoundingClientRect();
  const x = (clientX - r.left) / Math.max(r.width, 1);
  const y = (clientY - r.top) / Math.max(r.height, 1);
  return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
}

const ASCII_CHARSETS = {
  standard: " .:-=+*#%@",
  dense: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
  binary: " 01",
};

const rad = (d: number) => (d * Math.PI) / 180;

function hexToSrgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h.slice(0, 6),
    16,
  );
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function hexToLinear(hex: string): number[] {
  return hexToSrgb(hex).map((s) => (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4));
}

type Aux = { aspect: number; loaded: boolean; glyphs: number };

/** Packs one effect's settings into the generic post uniforms (4 vec4 + 3 colours). */
function packEffect(id: EffectId, look: Look, aux: Aux) {
  const p = new Float32Array(16);
  const c = new Float32Array(9);
  const col = (i: number, hex: string) => c.set(hexToSrgb(hex), i * 3);
  const L = look.layers;
  switch (id) {
    case "grain":
      p.set([L.grain.amount, L.grain.size, L.grain.live ? 1 : 0]);
      break;
    case "vignette":
      p.set([L.vignette.amount, L.vignette.feather]);
      break;
    case "dither": {
      const t = { random: 0, bayer2: 1, bayer4: 2, bayer8: 3, blue: 4 }[L.dither.pattern];
      p.set([t, L.dither.size, L.dither.levels, L.dither.palette === "mono" ? 1 : 0]);
      col(0, L.dither.paper);
      col(1, L.dither.ink);
      break;
    }
    case "fringe":
      p.set([L.fringe.kind === "directional" ? 1 : 0, L.fringe.amount, rad(L.fringe.angle)]);
      break;
    case "iridescence":
      p.set([L.iridescence.strength, L.iridescence.film, L.iridescence.hue]);
      break;
    case "flare":
      p.set([L.flare.x, L.flare.y, L.flare.strength, L.flare.reach]);
      col(0, L.flare.color);
      break;
    case "glow":
      p.set([L.glow.amount, L.glow.spread, L.glow.cutoff]);
      col(0, L.glow.color);
      break;
    case "blur": {
      const t = { gaussian: 0, directional: 1, progressive: 2, tiltShift: 3 }[L.blur.kind];
      p.set([t, L.blur.amount, rad(L.blur.angle), L.blur.center, L.blur.band]);
      break;
    }
    case "retro": {
      const t = { crt: 0, vhs: 1, glitch: 2 }[L.retro.kind];
      p.set([t, L.retro.amount, L.retro.lines, L.retro.noise, L.retro.bleed]);
      break;
    }
    case "ascii":
      p.set([L.ascii.size, aux.glyphs, L.ascii.mode === "mono" ? 1 : 0]);
      col(0, L.ascii.ink);
      col(1, L.ascii.paper);
      break;
    case "engrave":
      p.set([L.engrave.size, rad(L.engrave.angle), L.engrave.weight, L.engrave.mode === "ink" ? 1 : 0]);
      col(0, L.engrave.ink);
      col(1, L.engrave.paper);
      break;
    case "halftone":
      p.set([L.halftone.size, rad(L.halftone.angle), L.halftone.layout === "hex" ? 1 : 0, L.halftone.mode === "ink" ? 1 : 0, L.halftone.contrast]);
      col(0, L.halftone.ink);
      col(1, L.halftone.paper);
      break;
    case "ripple":
      p.set([L.ripple.size, L.ripple.height, L.ripple.sparkle, L.ripple.speed]);
      break;
    case "lens": {
      const g = L.lens;
      p.set([g.size, g.bend, g.rim, g.haze, g.spectrum, g.shine]);
      break;
    }
    case "reeded": {
      const g = L.reeded;
      const pattern = { lines: 0, wave: 1, rings: 2, tiles: 3 }[g.pattern];
      const ridge = { prism: 0, lens: 1, flat: 2 }[g.ridge];
      p.set([g.finish === "frosted" ? 1 : 0, pattern, ridge, g.size, rad(g.angle), g.depth, g.offset, g.blur, g.spectrum, g.speed, g.shade, g.shine, g.haze]);
      col(0, g.shadeColor);
      col(1, g.shineColor);
      break;
    }
    case "mosaic":
      p.set([L.mosaic.size, { square: 0, circle: 1, hex: 2 }[L.mosaic.cell], L.mosaic.gap]);
      col(0, L.mosaic.gapColor);
      break;
    case "bend": {
      const t = { sine: 0, zigzag: 1, ripple: 2, swirl: 3, turbulence: 4, bulge: 5, mirror: 6, slices: 7 }[L.bend.kind];
      p.set([t, L.bend.amount, L.bend.waves, rad(L.bend.angle), L.bend.speed]);
      break;
    }
    case "streak":
      p.set([L.streak.length, rad(L.streak.angle), L.streak.churn]);
      break;
    case "paint":
      p.set([L.paint.brush]);
      break;
    case "recolor":
      p.set([L.recolor.pivot, L.recolor.amount]);
      col(0, L.recolor.low);
      col(1, L.recolor.mid);
      col(2, L.recolor.high);
      break;
    case "wash":
      p.set([L.wash.bleed, L.wash.edges, L.wash.texture]);
      col(0, L.wash.paper);
      break;
    case "texture":
      p.set([L.texture.tooth, L.texture.scale, L.texture.emboss]);
      break;
    case "kaleido":
      p.set([L.kaleido.segments, rad(L.kaleido.angle), L.kaleido.zoom, L.kaleido.speed]);
      break;
    case "relief":
      p.set([L.relief.depth, rad(L.relief.angle), L.relief.shine, L.relief.gloss]);
      break;
    case "neon":
      p.set([L.neon.amount, L.neon.width, L.neon.dim, L.neon.tint]);
      col(0, L.neon.color);
      break;
    case "contour":
      p.set([L.contour.lines, L.contour.weight, L.contour.mode === "ink" ? 1 : 0]);
      col(0, L.contour.ink);
      col(1, L.contour.paper);
      break;
    case "led":
      p.set([L.led.size, L.led.gap, L.led.glow]);
      col(0, L.led.off);
      break;
    case "rain":
      p.set([L.rain.size, L.rain.amount, L.rain.frost, L.rain.speed]);
      break;
    case "shatter":
      p.set([L.shatter.pieces, L.shatter.shift, L.shatter.edges, L.shatter.drift]);
      break;
    case "weave":
      p.set([L.weave.size, L.weave.depth]);
      break;
    case "twirl":
      p.set([L.twirl.twist, L.twirl.radius, L.twirl.sway, 0, L.twirl.x, L.twirl.y]);
      break;
    case "glitch":
      p.set([L.glitch.amount, L.glitch.slices, L.glitch.split, L.glitch.rate]);
      break;
    case "pixelsort":
      p.set([L.pixelsort.cutoff, L.pixelsort.length, rad(L.pixelsort.angle)]);
      break;
    case "stretch":
      p.set([{ down: 0, up: 1, left: 2, right: 3 }[L.stretch.side], L.stretch.at, L.stretch.wave]);
      break;
    case "prism":
      p.set([L.prism.kind === "linear" ? 1 : 0, L.prism.spread, rad(L.prism.angle)]);
      break;
    case "thermal":
      p.set([L.thermal.amount, L.thermal.contrast, L.thermal.heat]);
      break;
    case "anaglyph":
      p.set([L.anaglyph.shift, L.anaglyph.depth, L.anaglyph.mono]);
      break;
    case "crosshatch":
      p.set([L.crosshatch.spacing, L.crosshatch.weight, L.crosshatch.mode === "ink" ? 1 : 0]);
      col(0, L.crosshatch.ink);
      col(1, L.crosshatch.paper);
      break;
    case "stipple":
      p.set([L.stipple.size, L.stipple.density, L.stipple.mode === "ink" ? 1 : 0]);
      col(0, L.stipple.ink);
      col(1, L.stipple.paper);
      break;
    case "riso":
      p.set([L.riso.size, L.riso.offset, L.riso.grain]);
      col(0, L.riso.ink);
      col(1, L.riso.ink2);
      col(2, L.riso.paper);
      break;
    case "overlay": {
      const im = L.overlay;
      const blend = { normal: 0, multiply: 1, screen: 2, overlay: 3, softLight: 4, lighten: 5, darken: 6, difference: 7 }[im.blend];
      const fit = { cover: 0, contain: 1, stretch: 2 }[im.fit];
      p.set([im.opacity, blend, fit, im.scale, im.x, im.y, aux.aspect, aux.loaded ? 1 : 0]);
      break;
    }
  }
  return { p, c };
}

/** `imageEdge` caps the longest edge of a picture's texture: a live preview or tile needs less than an export does. */
type RendererOptions = { preserveDrawingBuffer?: boolean; imageEdge?: number };

/** Creates a WebGL2 renderer on a canvas. Throws when WebGL2 is unavailable: callers decide the fallback. */
function createRenderer(canvas: HTMLCanvasElement | OffscreenCanvas, opts?: RendererOptions) {
  const ctx = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: !!opts?.preserveDrawingBuffer,
    powerPreference: "high-performance",
  });
  if (!(ctx instanceof WebGL2RenderingContext)) throw new Error("WebGL2 is not available in this browser, so backgrounds cannot be drawn.");
  const gl = ctx;

  // Shader compiles are the slowest thing a WebGL page does, and asking for a compile's status blocks
  // the main thread until the driver is done. So programs are queued without asking, and with
  // KHR_parallel_shader_compile the renderer checks COMPLETION_STATUS (non-blocking) and simply skips
  // a frame until the program is ready, instead of freezing the page.
  const parallel = gl.getExtension("KHR_parallel_shader_compile");

  function shader(type: number, src: string): WebGLShader {
    const s = gl.createShader(type);
    if (!s) throw new Error("WebGL could not create a shader object (context lost?).");
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, VERT);

  type Program = { key: string; prog: WebGLProgram; fs: WebGLShader; linked: boolean; loc: (name: string) => WebGLUniformLocation | null };
  const programs = new Map<string, Program>();
  /** One program per gradient type and per effect, with the selector baked in so the compiler drops every other branch. */
  function program(key: string, source: () => string): Program {
    const hit = programs.get(key);
    if (hit) return hit;
    const fs = shader(gl.FRAGMENT_SHADER, source());
    const prog = gl.createProgram();
    if (!prog) throw new Error("WebGL could not create a program object (context lost?).");
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    const cache = new Map<string, WebGLUniformLocation | null>();
    const loc = (name: string) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
      return cache.get(name) ?? null;
    };
    const entry: Program = { key, prog, fs, linked: false, loc };
    programs.set(key, entry);
    return entry;
  }
  /** True once a program can be used. Without the extension this waits for the driver. Throws on a broken shader. */
  function ready(p: Program): boolean {
    if (p.linked) return true;
    if (parallel && !gl.getProgramParameter(p.prog, parallel.COMPLETION_STATUS_KHR)) return false;
    if (!gl.getProgramParameter(p.prog, gl.LINK_STATUS) && !gl.isContextLost()) {
      throw new Error(`Shader "${p.key}" failed to build: ${gl.getShaderInfoLog(p.fs) || gl.getProgramInfoLog(p.prog)}`);
    }
    p.linked = true;
    return true;
  }
  /** `picture` builds the variant that draws the look's picture through the shape instead of the palette. */
  const baseProgram = (n: number, picture = false) =>
    program(`base${n}${picture ? "i" : ""}`, () =>
      BASE_FRAG.replace(/uniform int\s+u_kind;/, `const int u_kind = ${n};`).replace("#version 300 es\n", picture ? "#version 300 es\n#define IMAGE 1\n" : "#version 300 es\n"),
    );
  const layerProgram = (n: number) => program(`layer${n}`, () => LAYER_FRAG.replace(/uniform int\s+u_layer;/, `const int u_layer = ${n};`));
  const presentProgram = () => program("present", () => PRESENT_FRAG);
  const pointerProgram = (n: number) => program(`pointer${n}`, () => POINTER_FRAG.replace(/uniform int u_mode;/, `const int u_mode = ${n};`));
  const wakeProgram = () => program("wake", () => FIELD_FRAG);
  /** Half-float targets, or null where the browser cannot draw to them; the wake then follows the pointer without lingering. */
  const wakeFormat = gl.getExtension("EXT_color_buffer_float") ?? gl.getExtension("EXT_color_buffer_half_float");

  /** The programs a look needs, queued for compiling. */
  function programsFor(look: Look): Program[] {
    const list = [baseProgram(SHAPE_INDEX[look.shape.kind], picture(look) !== null), presentProgram()];
    for (const id of look.layers.stack) if (look.layers[id].on) list.push(layerProgram(EFFECT_INDEX[id]));
    const { on, mode } = look.interact;
    if (on && INTERACT_INDEX[mode] >= FIRST_POINTER_PASS) list.push(pointerProgram(INTERACT_INDEX[mode]));
    if (on && usesWake(mode) && wakeFormat) list.push(wakeProgram());
    return list;
  }

  /** Resolves once the look's pictures have loaded and every program it needs is built, so exports never skip a frame. */
  async function prepare(look: Look): Promise<void> {
    // The picture comes first: whether it has loaded decides which base program the look needs.
    const srcs = [look.source.kind === "image" ? look.source.src : null, look.layers.overlay.on ? look.layers.overlay.src : null];
    await Promise.all(srcs.map((src) => (src ? image(src).settled : undefined)));
    const list = programsFor(look);
    return new Promise((resolve, reject) => {
      const poll = () => {
        try {
          if (list.every(ready)) resolve();
          else setTimeout(poll, 8);
        } catch (e) {
          reject(e);
        }
      };
      poll();
    });
  }

  let destroyed = false;

  /** True when every program the look needs is built (queues any that are missing). Never blocks with parallel compiling. */
  function isReady(look: Look): boolean {
    return programsFor(look).every(ready);
  }

  /**
   * Builds the other shapes and effects in the background so switching later is instant. The driver
   * compiles in queue order, so this adds one program at a time and only while nothing else is
   * compiling: a shader the user actually asked for never waits behind more than one of these.
   * Only worth it with parallel compiling; without it the queue would block.
   */
  function warmup() {
    if (!parallel) return;
    const keys: (() => Program)[] = [...Object.values(SHAPE_INDEX).map((n) => () => baseProgram(n)), ...Object.values(EFFECT_INDEX).map((n) => () => layerProgram(n))];
    const idle = () => [...programs.values()].every((p) => p.linked || gl.getProgramParameter(p.prog, parallel.COMPLETION_STATUS_KHR));
    const step = () => {
      if (destroyed || gl.isContextLost()) return;
      if (idle()) keys.shift()?.();
      if (keys.length) setTimeout(step, 120);
    };
    setTimeout(step, 1500);
  }

  const vao = gl.createVertexArray();

  function target(): { tex: WebGLTexture; fb: WebGLFramebuffer } {
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    if (!tex || !fb) throw new Error("WebGL could not allocate a render target (out of GPU memory or context lost).");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    return { tex, fb };
  }
  const targets = [target(), target()];
  let tw = 0,
    th = 0;
  function resizeTargets(w: number, h: number) {
    if (w === tw && h === th) return;
    tw = w;
    th = h;
    for (const t of targets) {
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
    }
  }

  let wake: [ReturnType<typeof target>, ReturnType<typeof target>] | null = null;
  function wakeTargets() {
    if (wake || !wakeFormat) return wake;
    const pair: [ReturnType<typeof target>, ReturnType<typeof target>] = [target(), target()];
    gl.clearColor(0, 0, 0, 0);
    for (const t of pair) {
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, WAKE_SIZE, WAKE_SIZE, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    wake = pair;
    return wake;
  }

  /** Moves the wake on by the time passed since it last moved, and lets the pointer stir it. */
  function stirWake(pt: PointerState, aspect: number, radius: number) {
    const pair = wakeTargets();
    if (!pair) return;
    const P = wakeProgram();
    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL call, not a React hook
    gl.useProgram(P.prog);
    gl.viewport(0, 0, WAKE_SIZE, WAKE_SIZE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pair[1].fb);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pair[0].tex);
    gl.uniform1i(P.loc("u_prev"), 0);
    gl.uniform4f(P.loc("u_pointer"), (pt.x - 0.5) * aspect, 0.5 - pt.y, pt.presence, 0);
    gl.uniform2f(P.loc("u_pvel"), pt.vx, -pt.vy);
    gl.uniform3f(P.loc("u_step"), Math.min(pt.dt, 0.05), aspect, Math.max(radius, 0.02) * 0.32);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    wake = [pair[1], pair[0]];
    pt.dt = 0;
  }

  function uploadTexture(source: TexImageSource): WebGLTexture {
    const tex = gl.createTexture();
    if (!tex) throw new Error("WebGL could not allocate a texture.");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  // Overlay images load asynchronously; render() draws without them until they arrive.
  /** `settled` resolves when the image has loaded or failed; a failed one stays without a texture. */
  type ImageEntry = { tex: WebGLTexture | null; aspect: number; settled: Promise<void> };
  const images = new Map<string, ImageEntry>();
  let onImageLoaded: () => void = () => {};
  function image(src: string): ImageEntry {
    const hit = images.get(src);
    if (hit) return hit;
    const img = new Image();
    img.crossOrigin = "anonymous";
    const entry: ImageEntry = {
      tex: null,
      aspect: 1,
      settled: new Promise((resolve) => {
        img.onload = async () => {
          const k = Math.min(1, (opts?.imageEdge ?? Number.POSITIVE_INFINITY) / Math.max(img.naturalWidth, img.naturalHeight, 1));
          // Decoded and resized off the main thread, so a large picture does not stall the frame that uploads it.
          const bitmap = await createImageBitmap(img, {
            premultiplyAlpha: "none",
            resizeWidth: Math.max(1, Math.round(img.naturalWidth * k)),
            resizeHeight: Math.max(1, Math.round(img.naturalHeight * k)),
            resizeQuality: "high",
          }).catch(() => null);
          if (destroyed) {
            bitmap?.close();
            return resolve();
          }
          entry.tex = uploadTexture(bitmap ?? img);
          bitmap?.close();
          // Mipmaps keep a big picture steady and quick to sample when it is drawn smaller than it is.
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          entry.aspect = img.naturalWidth / Math.max(img.naturalHeight, 1);
          onImageLoaded();
          resolve();
        };
        img.onerror = () => resolve();
      }),
    };
    images.set(src, entry);
    img.src = src;
    return entry;
  }

  const atlases = new Map<string, { tex: WebGLTexture; count: number }>();
  function glyphAtlas(set: keyof typeof ASCII_CHARSETS) {
    const hit = atlases.get(set);
    if (hit) return hit;
    const chars = ASCII_CHARSETS[set];
    const cw = 48,
      ch = 80;
    const cv: OffscreenCanvas | HTMLCanvasElement = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(cw * chars.length, ch) : document.createElement("canvas");
    cv.width = cw * chars.length;
    cv.height = ch;
    const g = cv.getContext("2d");
    if (!(g instanceof CanvasRenderingContext2D || g instanceof OffscreenCanvasRenderingContext2D)) {
      throw new Error("A 2D canvas is needed to draw the ASCII glyphs and none could be created.");
    }
    g.fillStyle = "#000";
    g.fillRect(0, 0, cv.width, ch);
    g.fillStyle = "#fff";
    g.font = `${ch * 0.82}px ui-monospace, Menlo, Consolas, monospace`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    [...chars].forEach((chr, i) => {
      g.fillText(chr, i * cw + cw / 2, ch / 2);
    });
    const entry = { tex: uploadTexture(cv), count: chars.length };
    atlases.set(set, entry);
    return entry;
  }

  const blank = uploadTexture(new ImageData(1, 1));

  /** The look's own picture once it has loaded, else null (and the shape is drawn until it arrives). */
  function picture(look: Look): ImageEntry | null {
    if (look.source.kind !== "image") return null;
    const im = image(look.source.src);
    return im.tex ? im : null;
  }

  /**
   * Draws one frame of a look at `time` seconds into the canvas's current size. Returns false, and
   * leaves the canvas as it was, while a shader the look needs is still compiling.
   */
  function render(look: Look, time: number, pointer?: PointerState): boolean {
    if (!programsFor(look).every(ready)) return false;
    const w = canvas.width,
      h = canvas.height;
    resizeTargets(w, h);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(vao);

    const s = look.shape;
    const loop = Math.max(s.period, 0.5);
    const phase = s.animate ? ((time % loop) / loop) * Math.PI * 2 : 0;
    const frame = Math.floor((time % loop) * 24);
    const T = look.tone;
    const tone = [T.brightness, T.contrast, T.saturation, rad(T.hue)];
    const tone2 = [T.posterize, T.solarize, 0, 0];

    // Base: the shape, coloured by the palette, into the first target.
    const palette = [...look.palette].sort((a, b) => a.at - b.at).slice(0, 8);
    const colors = new Float32Array(24),
      at = new Float32Array(8),
      anchors = new Float32Array(16);
    palette.forEach((sw, i) => {
      colors.set(hexToLinear(sw.hex), i * 3);
      at[i] = sw.at;
    });
    for (let i = 0; i < 8; i++) {
      const a = look.anchors[i % Math.max(look.anchors.length, 1)] ?? { x: 0.5, y: 0.5 };
      anchors[i * 2] = a.x;
      anchors[i * 2 + 1] = 1 - a.y;
    }
    const pic = picture(look);
    const F = baseProgram(SHAPE_INDEX[s.kind], pic !== null);
    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL call, not a React hook
    gl.useProgram(F.prog);
    const aspect = w / h;
    const I = look.interact;
    const pt = I.on && pointer ? pointer : null;
    if (pt && usesWake(I.mode)) {
      stirWake(pt, aspect, I.radius);
      gl.viewport(0, 0, w, h);
      // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL call, not a React hook
      gl.useProgram(F.prog);
    }
    gl.uniform4f(F.loc("u_pointer"), pt ? (pt.x - 0.5) * aspect : 0, pt ? 0.5 - pt.y : 0, pt ? pt.presence : 0, pt ? pt.time : 0);
    gl.uniform2f(F.loc("u_pvel"), pt ? pt.vx : 0, pt ? -pt.vy : 0);
    gl.uniform4f(F.loc("u_interact"), INTERACT_INDEX[I.mode], I.strength, I.radius, 0);
    const so = look.source.kind === "image" ? look.source : null;
    gl.uniform4f(F.loc("u_source"), so ? so.flow : 0, so ? so.tint : 0, so ? so.zoom : 1, pic ? pic.aspect : 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, pic?.tex ?? blank);
    gl.uniform1i(F.loc("u_image"), 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, targets[0].fb);
    gl.uniform2f(F.loc("u_res"), w, h);
    gl.uniform1f(F.loc("u_phase"), phase);
    gl.uniform1i(F.loc("u_count"), palette.length);
    gl.uniform3fv(F.loc("u_colors"), colors);
    gl.uniform1fv(F.loc("u_at"), at);
    gl.uniform2fv(F.loc("u_anchors"), anchors);
    gl.uniform1f(F.loc("u_angle"), rad(s.angle));
    gl.uniform1f(F.loc("u_size"), s.size);
    gl.uniform4f(F.loc("u_form"), s.distort, s.zoom, s.feather, s.animate ? s.drift : 0);
    gl.uniform1i(F.loc("u_octaves"), s.octaves);
    gl.uniform1f(F.loc("u_bands"), s.bands);
    gl.uniform1f(F.loc("u_seed"), look.seed % 997);
    gl.uniform1f(F.loc("u_thickness"), s.thickness);
    gl.uniform4fv(F.loc("u_tone"), tone);
    gl.uniform4fv(F.loc("u_tone2"), tone2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Layers: each switched-on effect reads the last target and writes the other.
    let src = 0;
    for (const id of look.layers.stack) {
      const e = look.layers[id];
      if (!e.on) continue;
      let auxTex: WebGLTexture = blank;
      const aux = { aspect: 1, loaded: false, glyphs: 1 };
      if (id === "overlay") {
        const imgSrc = look.layers.overlay.src;
        if (!imgSrc) continue;
        const im = image(imgSrc);
        if (!im.tex) continue;
        auxTex = im.tex;
        aux.aspect = im.aspect;
        aux.loaded = true;
      } else if (id === "ascii") {
        const atlas = glyphAtlas(look.layers.ascii.glyphs);
        auxTex = atlas.tex;
        aux.glyphs = atlas.count;
      }
      const P = layerProgram(EFFECT_INDEX[id]);
      const { p, c } = packEffect(id, look, aux);
      // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL call, not a React hook
      gl.useProgram(P.prog);
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1 - src].fb);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, targets[src].tex);
      gl.uniform1i(P.loc("u_tex"), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, auxTex);
      gl.uniform1i(P.loc("u_aux"), 1);
      gl.uniform2f(P.loc("u_res"), w, h);
      gl.uniform1f(P.loc("u_phase"), phase);
      gl.uniform1f(P.loc("u_frame"), frame);
      gl.uniform1f(P.loc("u_seed"), look.seed % 997);
      gl.uniform4fv(P.loc("u_p"), p);
      gl.uniform3fv(P.loc("u_c"), c);
      gl.uniform4fv(P.loc("u_tone"), tone);
      gl.uniform4fv(P.loc("u_tone2"), tone2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      src = 1 - src;
    }

    // The pointer's own pass, over the finished picture. Stills and videos have no pointer, so they skip it.
    if (pt && INTERACT_INDEX[I.mode] >= FIRST_POINTER_PASS) {
      const P = pointerProgram(INTERACT_INDEX[I.mode]);
      // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL call, not a React hook
      gl.useProgram(P.prog);
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1 - src].fb);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, targets[src].tex);
      gl.uniform1i(P.loc("u_tex"), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, wake?.[0].tex ?? blank);
      gl.uniform1i(P.loc("u_field"), 1);
      gl.uniform2f(P.loc("u_res"), w, h);
      gl.uniform4f(P.loc("u_pointer"), (pt.x - 0.5) * aspect, 0.5 - pt.y, pt.presence, pt.time);
      gl.uniform2f(P.loc("u_pvel"), pt.vx, -pt.vy);
      gl.uniform4f(P.loc("u_interact"), INTERACT_INDEX[I.mode], I.strength, I.radius, wake ? 1 : 0);
      const b = pt.burst;
      gl.uniform3f(P.loc("u_burst"), b ? (b.x - 0.5) * aspect : 0, b ? 0.5 - b.y : 0, b ? b.age : -1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      src = 1 - src;
    }

    // Present: the last target onto the canvas.
    const C = presentProgram();
    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL call, not a React hook
    gl.useProgram(C.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets[src].tex);
    gl.uniform1i(C.loc("u_tex"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }

  /**
   * Frees GPU resources. Pass `release: true` only for a canvas that is being thrown away (exports):
   * a lost context stays lost, and a canvas that is used again (React re-running an effect on the
   * same element) would hand the next renderer that dead context and draw nothing.
   */
  function destroy(release = false) {
    destroyed = true;
    for (const p of programs.values()) {
      gl.deleteProgram(p.prog);
      gl.deleteShader(p.fs);
    }
    gl.deleteShader(vs);
    for (const t of [...targets, ...(wake ?? [])]) {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fb);
    }
    for (const im of images.values()) if (im.tex) gl.deleteTexture(im.tex);
    for (const a of atlases.values()) gl.deleteTexture(a.tex);
    gl.deleteTexture(blank);
    gl.deleteVertexArray(vao);
    programs.clear();
    if (release) gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  return {
    gl,
    render,
    isReady,
    prepare,
    warmup,
    destroy,
    /** Called when an overlay image finishes loading, so a paused preview can redraw. */
    set onImageLoaded(fn: () => void) {
      onImageLoaded = fn;
    },
  };
}

/** Plays a look on a canvas, sized to its CSS box. Used by HTML and React exports. */
function mount(canvas: HTMLCanvasElement, look: Look, opts?: { maxDpr?: number }) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const playing: Look = reduce ? { ...look, shape: { ...look.shape, animate: false }, interact: { ...look.interact, on: false } } : look;
  const r = createRenderer(canvas);
  const maxDpr = opts?.maxDpr || 2;
  let raf = 0;
  let visible = true;
  const start = performance.now();
  let last = start;
  const animated = playing.shape.animate || (playing.layers.grain.on && playing.layers.grain.live);
  const pointer = playing.interact.on ? createPointer() : null;
  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const moving = pointer ? pointer.step(dt, w / h, playing.interact.mode) : false;
    const drawn = r.render(playing, (now - start) / 1000, pointer?.state);
    // Keep going while animated, answering the pointer, or still compiling, and only while on screen.
    if (visible && (animated || moving || !drawn)) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  // Backgrounds usually sit behind the page, so the pointer is followed over the whole window, not the canvas.
  const onMove = (e: PointerEvent) => {
    pointer?.aim(pointerOn(canvas, e.clientX, e.clientY));
    kick();
  };
  const onLeave = () => pointer?.aim(null);
  const onDown = (e: PointerEvent) => {
    const at = pointerOn(canvas, e.clientX, e.clientY);
    if (!at) return;
    pointer?.press(at);
    kick();
  };
  if (pointer) {
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
  }
  r.onImageLoaded = kick;
  // Off-screen backgrounds stop drawing, so a long page does not burn the GPU on what nobody sees.
  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([e]) => {
          visible = !!e && e.isIntersecting;
          if (visible) kick();
        })
      : null;
  io?.observe(canvas);
  kick();
  return {
    stop: () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      io?.disconnect();
      cancelAnimationFrame(raf);
      r.destroy();
    },
  };
}

export type BackgroundProps = {
  look: Look;
  className?: string;
  style?: CSSProperties;
  /** The cursor effect. Leave it out to keep the look's own, pass false to turn it off, or pass fields to change it. */
  interact?: Partial<Interact> | false;
};

/**
 * Draws a look into a canvas that fills its parent. The CSS gradient shows until WebGL2 draws, or if it cannot.
 * The cursor effect follows the pointer over the whole page, so it still answers while you hover content on top.
 */
export function Background({ look, className, style, interact }: BackgroundProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pick: Partial<Interact> = interact === false ? { on: false } : (interact ?? {});
  const on = pick.on ?? look.interact.on;
  const mode = pick.mode ?? look.interact.mode;
  const strength = pick.strength ?? look.interact.strength;
  const radius = pick.radius ?? look.interact.radius;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    try {
      const m = mount(canvas, { ...look, interact: { on, mode, strength, radius } }, { maxDpr: 1.5 });
      return () => m.stop();
    } catch (e) {
      console.warn("Background fell back to CSS:", e);
      return undefined;
    }
  }, [look, on, mode, strength, radius]);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", background: fallbackGradient(look), ...style }}
    />
  );
}

function fallbackGradient(look: Look) {
  const stops = [...look.palette].sort((a, b) => a.at - b.at).map((s) => `${s.hex} ${Math.round(s.at * 100)}%`);
  return `linear-gradient(${(look.shape.angle + 90) % 360}deg, ${stops.join(", ")})`;
}

/** The cursor effect: Liquid. Stirs the look like paint in water. The swirl keeps going after you stop. Set on to false to turn it off, or override it per use with the interact prop. */
const INTERACT: Interact = {
  on: true,
  mode: "liquid",
  strength: 0.5,
  radius: 0.35,
};

const LOOK: Look = {
  format: 2,
  name: "Obsidian No. 4",
  seed: 688,
  ratio: {
    w: 16,
    h: 9,
  },
  palette: [
    {
      hex: "#000000",
      at: 0,
    },
    {
      hex: "#0d0d10",
      at: 0.3333333333333333,
    },
    {
      hex: "#1a1a20",
      at: 0.6666666666666666,
    },
    {
      hex: "#3a3a44",
      at: 1,
    },
  ],
  anchors: [
    {
      x: 0.19,
      y: 0.27,
    },
    {
      x: 0.93,
      y: 0.18,
    },
    {
      x: 0.31,
      y: 0.72,
    },
    {
      x: 0.68,
      y: 0.61,
    },
    {
      x: 0.6,
      y: 0.51,
    },
    {
      x: 0.2,
      y: 0.43,
    },
    {
      x: 0.7,
      y: 0.44,
    },
    {
      x: 0.79,
      y: 0.59,
    },
  ],
  shape: {
    kind: "plasma",
    angle: 34,
    size: 1.02,
    thickness: 0.42,
    distort: 0.6,
    zoom: 1.82,
    octaves: 3,
    feather: 1,
    bands: 0,
    drift: 0.5,
    animate: true,
    period: 10,
  },
  tone: {
    brightness: 0,
    contrast: 1,
    saturation: 1,
    hue: 0,
    posterize: 0,
    solarize: 0,
  },
  layers: {
    stack: [
      "overlay",
      "vignette",
      "grain",
      "dither",
      "fringe",
      "iridescence",
      "flare",
      "glow",
      "blur",
      "retro",
      "ascii",
      "engrave",
      "halftone",
      "ripple",
      "lens",
      "reeded",
      "mosaic",
      "bend",
      "streak",
      "paint",
      "recolor",
      "wash",
      "texture",
      "kaleido",
      "relief",
      "neon",
      "contour",
      "led",
      "rain",
      "shatter",
      "weave",
      "twirl",
      "glitch",
      "pixelsort",
      "prism",
      "thermal",
      "anaglyph",
      "stipple",
      "riso",
      "stretch",
      "crosshatch",
    ],
    overlay: {
      on: false,
      fit: "cover",
      scale: 1,
      x: 0,
      y: 0,
      blend: "normal",
      opacity: 1,
      src: null,
      name: "",
    },
    vignette: {
      on: false,
      amount: 0.4,
      feather: 0.6,
    },
    grain: {
      on: false,
      amount: 0.12,
      size: 1,
      live: true,
    },
    dither: {
      on: false,
      pattern: "bayer4",
      size: 2,
      levels: 3,
      palette: "colour",
      paper: "#f4f1e8",
      ink: "#14121a",
    },
    fringe: {
      on: false,
      kind: "radial",
      amount: 0.3,
      angle: 0,
    },
    iridescence: {
      on: false,
      strength: 0.6,
      film: 0.5,
      hue: 0,
    },
    flare: {
      on: false,
      x: 0.5,
      y: 0,
      strength: 0.6,
      reach: 0.4,
      color: "#ffe9c4",
    },
    glow: {
      on: false,
      amount: 0.5,
      spread: 0.4,
      cutoff: 0.55,
      color: "#ffffff",
    },
    blur: {
      on: false,
      kind: "gaussian",
      amount: 0.3,
      angle: 0,
      center: 0.5,
      band: 0.3,
    },
    retro: {
      on: false,
      kind: "crt",
      amount: 0.5,
      lines: 0.3,
      noise: 0.3,
      bleed: 0.3,
    },
    ascii: {
      on: false,
      glyphs: "standard",
      size: 14,
      mode: "source",
      ink: "#e8e8f0",
      paper: "#08080c",
    },
    engrave: {
      on: false,
      size: 8,
      angle: 45,
      weight: 1,
      mode: "source",
      ink: "#1b1b22",
      paper: "#f7f4ec",
    },
    halftone: {
      on: false,
      layout: "square",
      size: 10,
      angle: 45,
      contrast: 1,
      mode: "source",
      ink: "#231f20",
      paper: "#fbfaf4",
    },
    ripple: {
      on: false,
      size: 1,
      height: 0.3,
      sparkle: 0.1,
      speed: 1,
    },
    lens: {
      on: false,
      size: 0.6,
      bend: 0.5,
      rim: 0.35,
      haze: 0.1,
      spectrum: 0.3,
      shine: 0.5,
    },
    reeded: {
      on: false,
      finish: "fluted",
      pattern: "lines",
      ridge: "prism",
      size: 0.4,
      angle: 0,
      depth: 0.5,
      offset: 0,
      blur: 0,
      spectrum: 0,
      speed: 0,
      shade: 0.25,
      shine: 0.1,
      haze: 0.4,
      shadeColor: "#000000",
      shineColor: "#ffffff",
    },
    mosaic: {
      on: false,
      cell: "square",
      size: 16,
      gap: 0,
      gapColor: "#000000",
    },
    bend: {
      on: false,
      kind: "sine",
      amount: 0.3,
      waves: 2,
      angle: 0,
      speed: 1,
    },
    streak: {
      on: false,
      length: 0.4,
      angle: 90,
      churn: 0.3,
    },
    paint: {
      on: false,
      brush: 0.5,
    },
    recolor: {
      on: false,
      low: "#140a2e",
      mid: "#d6457a",
      high: "#ffe6b0",
      pivot: 0.5,
      amount: 1,
    },
    wash: {
      on: false,
      bleed: 0.5,
      edges: 0.5,
      texture: 0.35,
      paper: "#fbf7ec",
    },
    texture: {
      on: false,
      tooth: 0.3,
      scale: 1,
      emboss: 0.15,
    },
    kaleido: {
      on: false,
      segments: 6,
      angle: 0,
      zoom: 1,
      speed: 0,
    },
    relief: {
      on: false,
      depth: 0.5,
      angle: 135,
      shine: 0.4,
      gloss: 0.6,
    },
    neon: {
      on: false,
      amount: 0.6,
      width: 0.3,
      dim: 0.5,
      tint: 0,
      color: "#7cf8ff",
    },
    contour: {
      on: false,
      lines: 12,
      weight: 1,
      mode: "source",
      ink: "#16151a",
      paper: "#f6f3ea",
    },
    led: {
      on: false,
      size: 12,
      gap: 0.35,
      glow: 0.4,
      off: "#050507",
    },
    rain: {
      on: false,
      size: 0.45,
      amount: 0.55,
      frost: 0.35,
      speed: 1,
    },
    shatter: {
      on: false,
      pieces: 12,
      shift: 0.4,
      edges: 0.5,
      drift: 0.2,
    },
    weave: {
      on: false,
      size: 10,
      depth: 0.6,
    },
    twirl: {
      on: false,
      twist: 0.7,
      radius: 0.7,
      x: 0.5,
      y: 0.5,
      sway: 0.2,
    },
    glitch: {
      on: false,
      amount: 0.5,
      slices: 24,
      split: 0.4,
      rate: 16,
    },
    pixelsort: {
      on: false,
      cutoff: 0.4,
      length: 0.5,
      angle: 90,
    },
    stretch: {
      on: true,
      side: "down",
      at: 0.63,
      wave: 0.08,
    },
    prism: {
      on: false,
      kind: "radial",
      spread: 0.35,
      angle: 0,
    },
    thermal: {
      on: false,
      amount: 1,
      contrast: 1.2,
      heat: 0,
    },
    anaglyph: {
      on: false,
      shift: 0.35,
      depth: 0.5,
      mono: 0.6,
    },
    crosshatch: {
      on: true,
      spacing: 8,
      weight: 0.12,
      mode: "ink",
      ink: "#d0d0d8",
      paper: "#000000",
    },
    stipple: {
      on: false,
      size: 6,
      density: 0.6,
      mode: "ink",
      ink: "#16151a",
      paper: "#f6f3ea",
    },
    riso: {
      on: false,
      size: 6,
      offset: 0.3,
      grain: 0.35,
      ink: "#ff4d6d",
      ink2: "#2747d8",
      paper: "#f5f0e4",
    },
  },
  source: {
    kind: "shape",
  },
  interact: INTERACT,
};

export default function ObsidianNo4(props: Omit<BackgroundProps, "look">) {
  return <Background look={LOOK} {...props} />;
}
