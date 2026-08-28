// =============================================================
// FILE: src/components/sim/road/textures.js
// Texture / material system for the PathPhalt-style road editor.
//
// HOW TO ADD YOUR TEXTURES:
//   Drop image files into  src/components/roadtextures/  using the exact file
//   names listed in TEXTURE_FILES below (e.g. "asphalte.jpg", "wear2.webp",
//   "zebra.png", "arrow.png", ...). They are picked up automatically.
//   Until a file exists, a themed flat-color / procedural fallback is used, so
//   the editor works with zero texture files.
//
// Names mirror PathPhalt's material keys so its JSON loads unchanged.
// =============================================================
import * as THREE from 'three';

// PathPhalt texture key  →  expected file name in ./roadtex/
// (matches the `map:` values in the PathPhalt source).
export const TEXTURE_FILES = {
  // road surfaces  (PathPhalt spells asphalt the French way: asphalte.jpg)
  asphalt:        'asphalte.jpg',
  wear:           'trace.webp',
  wear2:          'wear2.webp',
  crossing:       'crossing.png',
  bus:            'bus.png',
  bike:           'bike.png',
  // surface fills
  zebra:          'zebra.png',
  damier:         'damier.png',
  plain:          'plain.jpg',
  // lines
  lineContinuous: 'continue.png',
  lineT1:         't1.png',
  lineT2:         't2.png',
  lineYield:      'cedez.png',
  lineStop:       'stop.png',
  lineUsed:       'line.png',
  lineParking:    'line_parking.png',
  // markings
  arrow:          'arrow.png',
  arrow_left:     'arrow_left.png',
  arrow_right:    'arrow_right.png',
  bus_place:      'bus_place.png',
  bus_text:       'bus_text.webp',
  bike_sign:      'bike_sign.png',
  // medians
  medianBorder:   'median_border.jpg',
  medianBevel:    'median_bevel.jpg',
};

// Themed flat-color fallback per key (used when the file isn't present yet).
// Tuned to the app's dark UI: dark asphalt, bright markings.
export const FALLBACK_COLOR = {
  asphalt: '#2b2b2b', wear: '#323232', wear2: '#3a3a3a',
  crossing: '#2b2b2b', bus: '#2f3540', bike: '#2b3530',
  zebra: '#e9e9e9', damier: '#cfcfcf', plain: '#2b2b2b',
  lineContinuous: '#f2f2f2', lineT1: '#f2f2f2', lineT2: '#f2f2f2',
  lineYield: '#f2f2f2', lineStop: '#f2f2f2', lineUsed: '#f2f2f2', lineParking: '#f2f2f2',
  arrow: '#f2f2f2', arrow_left: '#f2f2f2', arrow_right: '#f2f2f2',
  bus_place: '#f2c200', bus_text: '#f2f2f2', bike_sign: '#22d3ee',
  medianBorder: '#3a4a3a', medianBevel: '#444444',
};

// Webpack require.context: eagerly map any files the user has dropped into
// ./roadtex so we can resolve a URL by file name at runtime. Missing files
// simply aren't in the map → we fall back to a flat color.
let FILE_URLS = {};
try {
  // The user's textures live in src/components/roadtextures/.
  // eslint-disable-next-line no-undef
  const ctx = require.context('../../roadtextures', false, /\.(png|jpe?g|webp)$/);
  ctx.keys().forEach((k) => { FILE_URLS[k.replace('./', '')] = ctx(k); });
} catch (e) {
  FILE_URLS = {}; // folder may not exist yet — fine, all fallbacks
}

// Optional road-edge alpha mask (PathPhalt's road_alpha.png) — fades road sides.
export function getRoadAlpha() {
  const url = FILE_URLS['road_alpha.png'];
  if (!url) return null;
  if (_texCache.__alpha) return _texCache.__alpha;
  const t = _loader.load(url);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  _texCache.__alpha = t;
  return t;
}

const _loader = new THREE.TextureLoader();
const _texCache = {};
const _matCache = {};

// Returns a loaded THREE.Texture for a key, or null if no file is present.
export function getTexture(key) {
  if (key in _texCache) return _texCache[key];
  const file = TEXTURE_FILES[key];
  const url = file && FILE_URLS[file];
  if (!url) { _texCache[key] = null; return null; }
  const tex = _loader.load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  _texCache[key] = tex;
  return tex;
}

// True once the user has supplied a real file for this key.
export function hasTexture(key) {
  const file = TEXTURE_FILES[key];
  return !!(file && FILE_URLS[file]);
}

// Returns material props for a road/line/marking key: textured if available,
// else a themed flat color. `tint` (#rrggbb) optionally recolors.
export function materialProps(key, { transparent = false, tint = null } = {}) {
  const cacheKey = `${key}|${transparent}|${tint || ''}`;
  if (_matCache[cacheKey]) return _matCache[cacheKey];
  const tex = getTexture(key);
  const props = {
    map: tex || null,
    color: tint || (tex ? '#ffffff' : (FALLBACK_COLOR[key] || '#888888')),
    transparent: transparent || !!tex,
    roughness: 0.95,
    metalness: 0,
  };
  _matCache[cacheKey] = props;
  return props;
}

// List of textures the user still needs to add (for an in-UI hint).
export function missingTextures() {
  return Object.keys(TEXTURE_FILES).filter((k) => !hasTexture(k));
}
