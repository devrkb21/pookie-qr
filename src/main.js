import "@fontsource/great-vibes/latin-400.css";
import "@fontsource/playfair-display/latin-500.css";
import "@fontsource/playfair-display/latin-600.css";
import "@fontsource/playfair-display/latin-500-italic.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/baloo-da-2/bengali-400.css";
import "@fontsource/baloo-da-2/bengali-500.css";
import "@fontsource/baloo-da-2/bengali-600.css";
import "@fontsource/baloo-da-2/bengali-700.css";
import "@fontsource/baloo-da-2/latin-400.css";
import "@fontsource/baloo-da-2/latin-500.css";
import "@fontsource/baloo-da-2/latin-600.css";
import "@fontsource/baloo-da-2/latin-700.css";
import "@fontsource/tiro-bangla/bengali-400.css";
import "@fontsource/tiro-bangla/bengali-400-italic.css";
import "@fontsource/galada/bengali-400.css";
import "@fontsource/galada/latin-400.css";
import "./styles.css";

import QRCodeStyling from "qr-code-styling";
import { CONFIG } from "./config.js";
import { t, tc, num, setLang } from "./i18n.js";
import { TYPES, typeById } from "./qr-data.js";
import { renderCard, ensureFonts, contrast, FRAMES, QR_BASE } from "./card.js";
import { initScanner, decodeDrawable } from "./scanner.js";
import { buildPhotoForm, compressPhoto, hasAlpha } from "./photo.js";
import { renderArtQr } from "./art.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ================================================================
   Data
   ================================================================ */
const MOODS = [
  { en: "Rose", bn: "গোলাপ", c1: "#e8457a", c2: "#9b2c6f", eye: "#c2185b", bg: "#ffffff" },
  { en: "Blush", bn: "লাজুক", c1: "#ff8fab", c2: "#e05780", eye: "#d6336c", bg: "#fff5f8" },
  { en: "Lavender", bn: "ল্যাভেন্ডার", c1: "#8e6bd8", c2: "#d65db1", eye: "#6a4bc4", bg: "#ffffff" },
  { en: "Sunset", bn: "গোধূলি", c1: "#ff7a59", c2: "#c2185b", eye: "#d6336c", bg: "#fffaf6" },
  { en: "Cherry", bn: "চেরি", c1: "#d00000", c2: "#6a040f", eye: "#9d0208", bg: "#fff8f6" },
  { en: "Ocean", bn: "সমুদ্র", c1: "#2b8cbe", c2: "#5b4bd6", eye: "#1e5aa8", bg: "#ffffff" },
  { en: "Mint", bn: "পুদিনা", c1: "#1a9e7a", c2: "#2b6f8e", eye: "#13795b", bg: "#f6fffb" },
  { en: "Gold", bn: "সোনালি", c1: "#c48a1b", c2: "#8a4b12", eye: "#a8650f", bg: "#fffdf6" },
  { en: "Night", bn: "রাত", c1: "#ffb3c8", c2: "#c9b6ff", eye: "#ffd6e3", bg: "#24131c" },
  { en: "Classic", bn: "ক্লাসিক", c1: "#1d1d1f", c2: "#1d1d1f", eye: "#1d1d1f", bg: "#ffffff" },
];

const DOT_STYLES = [["rounded", "st_rounded"], ["dots", "st_dots"], ["classy-rounded", "st_classyRounded"], ["extra-rounded", "st_extraRounded"], ["classy", "st_classy"], ["square", "st_square"]];
const EYE_STYLES = [["extra-rounded", "st_extraRounded"], ["dot", "st_dot"], ["rounded", "st_rounded"], ["classy-rounded", "st_classy"], ["square", "st_square"]];
const EYE_DOT_STYLES = [["dot", "st_dot"], ["rounded", "st_rounded"], ["classy", "st_classy"], ["square", "st_square"]];
const FRAME_LABELS = { plain: "fr_plain", polaroid: "fr_polaroid", card: "fr_card", scanme: "fr_scanme", letter: "fr_letter" };

const SHAPE_BADGES = {
  heart: '<path d="M50 88C18 64 6 48 6 31 6 17 17 7 31 7c8 0 15 4 19 11 4-7 11-11 19-11 14 0 25 10 25 24 0 17-12 33-44 57z"/>',
  star: '<path d="M50 5l13 30 33 3-25 22 8 32-29-17-29 17 8-32L4 38l33-3z"/>',
  flower: '<circle cx="50" cy="24" r="19"/><circle cx="76" cy="44" r="19"/><circle cx="66" cy="74" r="19"/><circle cx="34" cy="74" r="19"/><circle cx="24" cy="44" r="19"/><circle cx="50" cy="51" r="11" fill="#fff"/>',
  infinity: '<path fill="none" stroke="url(#g)" stroke-width="13" stroke-linecap="round" d="M50 50c-10-13-20-20-29-20a20 20 0 0 0 0 40c9 0 19-7 29-20s20-20 29-20a20 20 0 0 1 0 40c-9 0-19-7-29-20z"/>',
  ring: '<circle cx="50" cy="60" r="28" fill="none" stroke="url(#g)" stroke-width="9"/><path d="M38 26l12-18 12 18-12 12z"/>',
};
const EMOJI_BADGES = ["💍", "🌹", "🌸", "🦋", "🐱", "🧸", "🎀", "☕", "🌙", "✨", "🍓", "🎂", "🏠", "📶", "🎵", "📞"];

const PLACEHOLDER = CONFIG.defaultMessage;
const STORE_KEY = "lqr-state-v2";
const HIST_KEY = "lqr-history-v2";

/* ================================================================
   State
   ================================================================ */
const DEFAULT_STATE = {
  type: "text",
  fields: { text: { message: CONFIG.defaultMessage } },
  mood: 0,
  c1: MOODS[0].c1, c2: MOODS[0].c2, eye: MOODS[0].eye, bg: MOODS[0].bg,
  shape: "square", dot: "rounded", eyeStyle: "extra-rounded", eyeDot: "dot",
  gradient: "linear", angle: 45, transparent: false,
  frame: "card", title: "", caption: "", font: "bangla",
  badge: "heart", badgeSize: 0.3, roundPhoto: true, photo: null,
  quality: 2,
  art: false, artPhoto: null, artStyle: "color", artSafety: 0.35,
  lang: CONFIG.defaultLang,
};

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};

const state = { ...structuredClone(DEFAULT_STATE), ...store.get(STORE_KEY, {}) };
let payload = "";
let lastQr = null;

function fieldsFor(typeId) {
  const type = typeById(typeId);
  const saved = (state.fields[typeId] ||= {});
  for (const f of type.fields) {
    if (saved[f.id] === undefined) saved[f.id] = f.type === "checkbox" ? false : f.type === "select" ? f.options[0][0] : "";
  }
  return saved;
}

/* ================================================================
   Badge images
   ================================================================ */
function svgBadge(kind) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${state.c1}"/><stop offset="1" stop-color="${state.c2}"/></linearGradient></defs><g fill="url(#g)">${SHAPE_BADGES[kind]}</g></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
const emojiCache = new Map();
function emojiBadge(e) {
  if (!emojiCache.has(e)) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    x.font = '200px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(e, 128, 140);
    emojiCache.set(e, c.toDataURL("image/png"));
  }
  return emojiCache.get(e);
}
let photoCache = { key: "", url: "" };
async function photoBadge() {
  const key = state.photo + state.roundPhoto + state.c1;
  if (photoCache.key === key) return photoCache.url;
  const img = await loadImage(state.photo);
  const c = document.createElement("canvas");
  c.width = c.height = 400;
  const x = c.getContext("2d");
  if (state.roundPhoto) {
    x.beginPath(); x.arc(200, 200, 200, 0, Math.PI * 2);
    const g = x.createLinearGradient(0, 0, 400, 400);
    g.addColorStop(0, state.c1); g.addColorStop(1, state.c2);
    x.fillStyle = g; x.fill();
    x.beginPath(); x.arc(200, 200, 184, 0, Math.PI * 2); x.fillStyle = "#fff"; x.fill();
    x.beginPath(); x.arc(200, 200, 174, 0, Math.PI * 2); x.clip();
  }
  x.drawImage(img, 0, 0, 400, 400);
  photoCache = { key, url: c.toDataURL("image/png") };
  return photoCache.url;
}
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
async function badgeUrl() {
  if (state.badge === "none") return "";
  if (state.badge === "photo") return state.photo ? photoBadge() : "";
  if (SHAPE_BADGES[state.badge]) return svgBadge(state.badge);
  return emojiBadge(state.badge);
}

/* ================================================================
   QR + card rendering
   ================================================================ */
async function qrOptions(size, data, type = "canvas") {
  const image = await badgeUrl();
  const dotsFill = state.gradient === "none"
    ? { color: state.c1 }
    : { gradient: { type: state.gradient, rotation: (state.angle * Math.PI) / 180, colorStops: [{ offset: 0, color: state.c1 }, { offset: 1, color: state.c2 }] } };
  const transparent = state.transparent && state.frame === "plain";
  return {
    type, width: size, height: size, data, margin: 0, shape: state.shape,
    image: image || undefined,
    qrOptions: { errorCorrectionLevel: image ? "H" : "Q" },
    dotsOptions: { type: state.dot, ...dotsFill },
    cornersSquareOptions: { type: state.eyeStyle, color: state.eye },
    cornersDotOptions: { type: state.eyeDot, color: state.eye },
    backgroundOptions: { color: transparent ? "rgba(0,0,0,0)" : state.bg },
    imageOptions: { hideBackgroundDots: true, imageSize: state.badgeSize, margin: Math.round(size / 90), crossOrigin: "anonymous" },
  };
}

// The QR encoder works on bytes; send UTF-8 so Bangla and emoji survive.
const toUtf8Bytes = (s) => (/[^\x00-\x7f]/.test(s) ? unescape(encodeURIComponent(s)) : s);

let artCache = { src: "", img: null };
async function artImage() {
  if (artCache.src !== state.artPhoto) artCache = { src: state.artPhoto, img: await loadImage(state.artPhoto) };
  return artCache.img;
}
function darken(hexColor, k) {
  const n = parseInt(hexColor.slice(1), 16);
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - k)).toString(16).padStart(2, "0")).join("");
}
const artOn = () => state.art && !!state.artPhoto;

// Build as SVG (fast), then rasterize once at the exact size we need.
async function makeQr(data, size) {
  if (artOn()) {
    const q = new QRCodeStyling({ type: "svg", width: 64, height: 64, data: toUtf8Bytes(data), qrOptions: { errorCorrectionLevel: "H" } });
    return renderArtQr({ qr: q._qr, photo: await artImage(), size, style: state.artStyle, safety: state.artSafety, dark: darken(state.eye, 0.55), tint: state.c1 });
  }
  const qr = new QRCodeStyling(await qrOptions(size, toUtf8Bytes(data), "svg"));
  const blob = await qr.getRawData("svg");
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    await img.decode?.().catch(() => {});
    const c = el("canvas", { width: size, height: size });
    c.getContext("2d").drawImage(img, 0, 0, size, size);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cardOptions(qr, scale) {
  return {
    qr, scale, frame: state.frame, c1: state.c1, c2: state.c2, bg: state.bg,
    title: state.title.trim(), caption: state.caption.trim(), font: state.font, scanLabel: t("ph_title"),
    transparent: state.transparent && state.frame === "plain",
  };
}

let renderToken = 0, renderTimer = 0;
function update(immediate) {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, immediate ? 0 : 90);
  saveState();
}

async function render() {
  const token = ++renderToken;
  payload = typeById(state.type).build(fieldsFor(state.type)) || "";
  const data = payload || PLACEHOLDER;
  await ensureFonts();
  let qr;
  try {
    qr = await makeQr(data, QR_BASE * 2);
  } catch (err) {
    console.error(err);
    setCheck("bad", t("chk_bad"));
    return;
  }
  if (token !== renderToken) return;
  lastQr = qr;

  const card = renderCard(cardOptions(qr, 2));
  const view = $("#view");
  view.width = card.width;
  view.height = card.height;
  view.style.width = card.width / 2 + "px";
  view.getContext("2d").drawImage(card, 0, 0);
  view.classList.toggle("dim", !payload && !artOn());
  view.classList.remove("pop"); void view.offsetWidth; view.classList.add("pop");

  renderFrameThumbs(qr);
  drawPip();
  const bytes = new TextEncoder().encode(payload).length;
  $("#count").textContent = payload ? `${num(bytes)} ${t("chars")}` : "";
  ["#dlPng", "#dlJpg", "#dlSvg", "#copyBtn", "#shareBtn", "#mDl", "#mShare"].forEach((s) => ($(s).disabled = !payload));
  if (artOn()) $("#dlSvg").disabled = true;
  scheduleCheck(qr, payload, token);
}

function renderFrameThumbs(qr) {
  $$(".frame-opt").forEach((btn) => {
    const c = renderCard({ ...cardOptions(qr, 0.3), frame: btn.dataset.v });
    const box = $(".thumb", btn);
    box.replaceChildren(c);
  });
}

/* ---------- scannability check ---------- */
let checkTimer = 0;
function setCheck(kind, text) {
  const chip = $("#checkChip");
  chip.className = "chip " + kind;
  $("#checkText").textContent = text;
}
function scheduleCheck(qr, data, token) {
  clearTimeout(checkTimer);
  if (!data) return setCheck("", t("chk_empty"));
  setCheck("busy", t("chk_checking"));
  checkTimer = setTimeout(() => {
    if (token !== renderToken) return;
    // draw on the real background so light-on-dark designs are tested honestly
    const c = document.createElement("canvas");
    c.width = c.height = 560;
    const x = c.getContext("2d");
    x.fillStyle = state.transparent && state.frame === "plain" ? "#ffffff" : state.bg;
    x.fillRect(0, 0, 560, 560);
    x.drawImage(qr, 20, 20, 520, 520);
    const res = decodeDrawable(c, 560, 560, [560, 400, 300]);
    const ok = res && (res.data === data || res.binaryData?.length === new TextEncoder().encode(data).length);
    if (!ok) return setCheck("bad", t("chk_bad"));
    const minC = Math.min(contrast(state.c1, state.bg), contrast(state.c2, state.bg), contrast(state.eye, state.bg));
    const inverted = contrast(state.bg, "#000000") < contrast(state.c1, "#000000");
    if (inverted) setCheck("warn", t("chk_inverted"));
    else if (minC < 3) setCheck("warn", t("chk_contrast"));
    else setCheck("ok", t("chk_ok"));
  }, 250);
}

/* ================================================================
   UI builders
   ================================================================ */
function el(tag, props = {}, children = []) {
  const n = Object.assign(document.createElement(tag), props);
  for (const ch of [].concat(children)) if (ch != null) n.append(ch);
  return n;
}

function buildTypes() {
  $("#types").replaceChildren(...TYPES.map((ty) =>
    el("button", { className: "type" + (ty.id === state.type ? " on" : ""), type: "button", onclick: () => selectType(ty.id) }, [
      el("span", { className: "ic", textContent: ty.icon }),
      el("span", { textContent: t("t_" + ty.id) }),
    ])));
}

function selectType(id) {
  state.type = id;
  buildTypes();
  buildForm();
  update(true);
  $("#form input, #form textarea")?.focus({ preventScroll: true });
}

function buildForm() {
  const type = typeById(state.type);
  const vals = fieldsFor(state.type);
  if (type.custom) {
    $("#form").replaceChildren(...buildPhotoForm(vals, {
      update, toast, celebrate, save: saveState, rebuild: buildForm,
      useAsArt: (src) => { Object.assign(state, { art: true, artPhoto: src }); syncControls(); $('#tabs button[data-tab="design"]').click(); update(true); },
    }));
    return;
  }
  const nodes = [];
  for (const f of type.fields) {
    if (f.note) nodes.push(el("div", { className: "note", textContent: t(f.note) }));
    if (f.type === "button") {
      nodes.push(el("button", { className: "btn ghost", type: "button", textContent: t(f.label), onclick: useMyLocation }));
      continue;
    }
    if (f.type === "checkbox") {
      const input = el("input", { type: "checkbox", checked: !!vals[f.id] });
      input.addEventListener("change", () => { vals[f.id] = input.checked; update(); });
      nodes.push(el("label", { className: "check" }, [input, el("span", { textContent: t(f.label) })]));
      continue;
    }
    let input;
    if (f.type === "textarea") input = el("textarea");
    else if (f.type === "select") input = el("select", {}, f.options.map(([v, l]) => el("option", { value: v, textContent: t(l) })));
    else input = el("input", { type: f.type });
    input.value = vals[f.id];
    input.dataset.k = f.id;
    if (f.ph) input.placeholder = t(f.ph);
    input.addEventListener("input", () => { vals[f.id] = input.value; update(); });
    nodes.push(el("label", { className: "fld" + (f.half ? " half" : "") }, [el("span", { textContent: t(f.label) }), input]));
  }
  $("#form").replaceChildren(...nodes);
}

function useMyLocation() {
  if (!navigator.geolocation) return toast(t("locFail"));
  navigator.geolocation.getCurrentPosition(
    (p) => {
      const v = fieldsFor("location");
      v.lat = p.coords.latitude.toFixed(6);
      v.lng = p.coords.longitude.toFixed(6);
      buildForm();
      update(true);
    },
    () => toast(t("locFail")),
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

function buildMoods() {
  $("#moods").replaceChildren(...MOODS.map((m, i) => {
    const dot = el("span", { className: "dot" });
    dot.style.background = `linear-gradient(135deg, ${m.c1}, ${m.c2})`;
    dot.style.setProperty("--bgc", m.bg);
    return el("button", { className: "mood" + (state.mood === i ? " on" : ""), type: "button", onclick: () => applyMood(i) }, [dot, el("span", { textContent: tc(m) })]);
  }));
}
function applyMood(i) {
  const m = MOODS[i];
  Object.assign(state, { mood: i, c1: m.c1, c2: m.c2, eye: m.eye, bg: m.bg });
  syncControls();
  update(true);
}

/* tiny SVG pictograms for the style pickers */
function leaf(x, y, s, r) {
  return `<path d="M${x + r} ${y}H${x + s}V${y + s - r}Q${x + s} ${y + s} ${x + s - r} ${y + s}H${x}V${y + r}Q${x} ${y} ${x + r} ${y}Z"/>`;
}
function dotIcon(type) {
  const on = [[0, 0], [1, 0], [0, 1], [2, 1], [1, 2], [2, 2], [0, 2]];
  const cell = (x, y) => {
    const px = 5 + x * 10.5, py = 5 + y * 10.5, s = 9.5;
    switch (type) {
      case "dots": return `<circle cx="${px + s / 2}" cy="${py + s / 2}" r="${s / 2}"/>`;
      case "rounded": return `<rect x="${px}" y="${py}" width="${s}" height="${s}" rx="2.6"/>`;
      case "extra-rounded": return `<rect x="${px}" y="${py}" width="${s}" height="${s}" rx="4"/>`;
      case "classy": return leaf(px, py, s, 3.5);
      case "classy-rounded": return leaf(px, py, s, 5);
      default: return `<rect x="${px}" y="${py}" width="${s}" height="${s}"/>`;
    }
  };
  return `<svg viewBox="0 0 40 40" fill="currentColor">${on.map(([x, y]) => cell(x, y)).join("")}</svg>`;
}
function eyeIcon(type) {
  const o = (() => {
    switch (type) {
      case "dot": return `<circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="5"/>`;
      case "extra-rounded": return `<rect x="6" y="6" width="28" height="28" rx="10" fill="none" stroke="currentColor" stroke-width="5"/>`;
      case "rounded": return `<rect x="6" y="6" width="28" height="28" rx="5" fill="none" stroke="currentColor" stroke-width="5"/>`;
      case "classy-rounded": return `<path d="M16 6H34V24Q34 34 24 34H6V16Q6 6 16 6Z" fill="none" stroke="currentColor" stroke-width="5"/>`;
      default: return `<rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" stroke-width="5"/>`;
    }
  })();
  return `<svg viewBox="0 0 40 40">${o}<rect x="15" y="15" width="10" height="10" rx="2" fill="currentColor"/></svg>`;
}
function eyeDotIcon(type) {
  const d = (() => {
    switch (type) {
      case "dot": return `<circle cx="20" cy="20" r="7"/>`;
      case "rounded": return `<rect x="13" y="13" width="14" height="14" rx="4"/>`;
      case "classy": return leaf(13, 13, 14, 6);
      default: return `<rect x="13" y="13" width="14" height="14"/>`;
    }
  })();
  return `<svg viewBox="0 0 40 40"><rect x="6" y="6" width="28" height="28" rx="6" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="4"/><g fill="currentColor">${d}</g></svg>`;
}

function buildStylePicker(rootSel, list, key, iconFn) {
  $(rootSel).replaceChildren(...list.map(([v, label]) => {
    const b = el("button", { className: "style" + (state[key] === v ? " on" : ""), type: "button" });
    b.innerHTML = iconFn(v);
    b.append(el("span", { textContent: t(label) }));
    b.onclick = () => { state[key] = v; $$(".style", $(rootSel)).forEach((x) => x.classList.toggle("on", x === b)); update(true); };
    return b;
  }));
}

function buildFrames() {
  $("#frames").replaceChildren(...FRAMES.map((f) =>
    el("button", { className: "frame-opt" + (state.frame === f ? " on" : ""), type: "button", onclick: () => {
      state.frame = f;
      $$(".frame-opt").forEach((x) => x.classList.toggle("on", x.dataset.v === f));
      update(true);
    } }, [el("div", { className: "thumb" }), el("span", { textContent: t(FRAME_LABELS[f]) })])));
  $$(".frame-opt").forEach((b, i) => (b.dataset.v = FRAMES[i]));
  if (lastQr) renderFrameThumbs(lastQr);
}

function buildBadges() {
  const items = [["none", null], ...Object.keys(SHAPE_BADGES).map((k) => [k, "shape"]), ...EMOJI_BADGES.map((e) => [e, "emoji"])];
  $("#badges").replaceChildren(...items.map(([v, kind]) => {
    const b = el("button", { className: "badge" + (state.badge === v ? " on" : "") + (kind ? "" : " none"), type: "button", title: v });
    if (!kind) b.textContent = t("b_none");
    else if (kind === "shape") b.append(el("img", { src: svgBadge(v), alt: v }));
    else b.textContent = v;
    b.onclick = () => selectBadge(v);
    return b;
  }));
  $("#uploadTile").classList.toggle("on", state.badge === "photo");
  $("#upPreview").style.backgroundImage = state.photo ? `url(${state.photo})` : "";
  $("#upPreview").textContent = state.photo ? " " : "";
}
function selectBadge(v) {
  state.badge = v;
  buildBadges();
  update(true);
}

async function onPhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    // square-crop to the center, keep it small so it can be remembered
    const s = Math.min(img.width, img.height);
    const c = document.createElement("canvas");
    c.width = c.height = 400;
    c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 400, 400);
    state.photo = hasAlpha(c) ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.88);
    state.badge = "photo";
    buildBadges();
    update(true);
    toast(t("photoAdded"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* sync all static controls with state */
function setSeg(sel, value) { $$(sel + " button").forEach((b) => b.classList.toggle("on", b.dataset.v === String(value))); }
function syncControls() {
  $$(".mood").forEach((m, i) => m.classList.toggle("on", i === state.mood));
  ["c1", "c2", "eye", "bg"].forEach((k) => ($("#" + k).value = state[k]));
  setSeg("#shapeSeg", state.shape);
  setSeg("#gradSeg", state.gradient);
  setSeg("#fontSeg", state.font);
  setSeg("#qualitySeg", state.quality);
  $("#angle").value = state.angle;
  $("#angleOut").textContent = num(state.angle) + "°";
  $("#angleWrap").hidden = state.gradient !== "linear";
  $("#transparent").checked = state.transparent;
  $("#title").value = state.title;
  $("#caption").value = state.caption;
  $("#badgeSize").value = state.badgeSize;
  $("#badgeSizeOut").textContent = num(Math.round(state.badgeSize * 100)) + "%";
  $("#roundPhoto").checked = state.roundPhoto;
  setSeg("#kindSeg", state.art ? "art" : "classic");
  setSeg("#artStyleSeg", state.artStyle);
  document.body.classList.toggle("art-on", !!state.art);
  $("#artSafety").value = state.artSafety;
  $("#artSafetyOut").textContent = num(Math.round(state.artSafety * 100)) + "%";
  $("#artTile").classList.toggle("on", !!state.artPhoto);
  $("#artPreview").style.backgroundImage = state.artPhoto ? `url(${state.artPhoto})` : "";
  $("#artPreview").textContent = state.artPhoto ? " " : "";
}

function buildAll() {
  buildTypes();
  buildForm();
  buildMoods();
  buildStylePicker("#dotStyles", DOT_STYLES, "dot", dotIcon);
  buildStylePicker("#eyeStyles", EYE_STYLES, "eyeStyle", eyeIcon);
  buildStylePicker("#eyeDotStyles", EYE_DOT_STYLES, "eyeDot", eyeDotIcon);
  buildFrames();
  buildBadges();
  syncControls();
}

/* ================================================================
   Static control wiring
   ================================================================ */
function wireSeg(sel, key, cast = (v) => v, after) {
  $(sel).addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    state[key] = cast(b.dataset.v);
    setSeg(sel, state[key]);
    after?.();
    update(true);
  });
}
wireSeg("#shapeSeg", "shape");
wireSeg("#gradSeg", "gradient", undefined, () => ($("#angleWrap").hidden = state.gradient !== "linear"));
wireSeg("#fontSeg", "font");
wireSeg("#qualitySeg", "quality", Number);
wireSeg("#artStyleSeg", "artStyle");
$("#kindSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-v]");
  if (!b) return;
  state.art = b.dataset.v === "art";
  syncControls();
  update(true);
});
$("#artSafety").addEventListener("input", (e) => {
  state.artSafety = +e.target.value;
  $("#artSafetyOut").textContent = num(Math.round(state.artSafety * 100)) + "%";
  update();
});
async function onArtPhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const { thumb } = await compressPhoto(file);
  Object.assign(state, { art: true, artPhoto: thumb });
  syncControls();
  update(true);
  toast(t("photoAdded"));
}
$("#artFile").addEventListener("change", (e) => { onArtPhoto(e.target.files[0]); e.target.value = ""; });
const artTile = $("#artTile");
["dragenter", "dragover"].forEach((ev) => artTile.addEventListener(ev, (e) => { e.preventDefault(); artTile.classList.add("drag"); }));
["dragleave", "drop"].forEach((ev) => artTile.addEventListener(ev, () => artTile.classList.remove("drag")));
artTile.addEventListener("drop", (e) => { e.preventDefault(); onArtPhoto(e.dataTransfer.files[0]); });

["c1", "c2", "eye", "bg"].forEach((k) => $("#" + k).addEventListener("input", (e) => {
  state[k] = e.target.value;
  state.mood = -1;
  $$(".mood").forEach((m) => m.classList.remove("on"));
  if (SHAPE_BADGES[state.badge]) buildBadges();
  update();
}));
$("#angle").addEventListener("input", (e) => { state.angle = +e.target.value; $("#angleOut").textContent = num(state.angle) + "°"; update(); });
$("#transparent").addEventListener("change", (e) => { state.transparent = e.target.checked; update(true); });
$("#title").addEventListener("input", (e) => { state.title = e.target.value; update(); });
$("#caption").addEventListener("input", (e) => { state.caption = e.target.value; update(); });
$("#badgeSize").addEventListener("input", (e) => { state.badgeSize = +e.target.value; $("#badgeSizeOut").textContent = num(Math.round(state.badgeSize * 100)) + "%"; update(); });
$("#roundPhoto").addEventListener("change", (e) => { state.roundPhoto = e.target.checked; update(true); });
$("#badgeFile").addEventListener("change", (e) => { onPhoto(e.target.files[0]); e.target.value = ""; });
const tile = $("#uploadTile");
["dragenter", "dragover"].forEach((ev) => tile.addEventListener(ev, (e) => { e.preventDefault(); tile.classList.add("drag"); }));
["dragleave", "drop"].forEach((ev) => tile.addEventListener(ev, () => tile.classList.remove("drag")));
tile.addEventListener("drop", (e) => { e.preventDefault(); onPhoto(e.dataTransfer.files[0]); });

$("#tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]");
  if (!b) return;
  $$("#tabs button").forEach((x) => x.classList.toggle("on", x === b));
  $$(".panel").forEach((p) => p.classList.toggle("on", p.dataset.panel === b.dataset.tab));
  // on a phone the tabs are stuck to the top: jump to the start of the new panel
  const card = $(".controls");
  if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#surprise").addEventListener("click", (e) => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const m = Math.floor(Math.random() * (MOODS.length - 1)); // skip Classic
  Object.assign(state, {
    mood: m, c1: MOODS[m].c1, c2: MOODS[m].c2, eye: MOODS[m].eye, bg: MOODS[m].bg,
    dot: pick(DOT_STYLES)[0], eyeStyle: pick(EYE_STYLES)[0], eyeDot: pick(EYE_DOT_STYLES)[0],
    gradient: pick(["linear", "linear", "radial"]), angle: Math.floor(Math.random() * 72) * 5,
    frame: pick(FRAMES.slice(1)),
  });
  if (state.badge !== "photo") state.badge = pick(["heart", "heart", "star", "flower", "infinity", ...EMOJI_BADGES.slice(0, 6)]);
  buildAll();
  update(true);
  celebrate(e.currentTarget);
});

/* ================================================================
   Export
   ================================================================ */
async function exportCanvas() {
  const k = state.quality;
  const qr = await makeQr(payload, QR_BASE * k);
  return renderCard(cardOptions(qr, k));
}
const fileName = (ext) => `love-qr-${state.type}-${new Date().toISOString().slice(0, 10)}.${ext}`;
function saveBlob(blob, name) {
  const a = el("a", { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const toBlob = (c, type = "image/png", q) => new Promise((r) => c.toBlob(r, type, q));

async function busy(btn, fn) {
  if (!payload || btn.disabled) return;
  btn.disabled = true;
  try { await fn(); } finally { btn.disabled = false; }
}

const downloadPng = (btn) => busy(btn, async () => {
  const c = await exportCanvas();
  saveBlob(await toBlob(c), fileName("png"));
  done(btn, t("saved"));
});
$("#dlPng").addEventListener("click", (e) => downloadPng(e.currentTarget));
$("#mDl").addEventListener("click", (e) => downloadPng(e.currentTarget));
$("#dlJpg").addEventListener("click", (e) => busy(e.currentTarget, async () => {
  const c = await exportCanvas();
  const j = el("canvas", { width: c.width, height: c.height });
  const x = j.getContext("2d");
  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, j.width, j.height);
  x.drawImage(c, 0, 0);
  saveBlob(await toBlob(j, "image/jpeg", 0.95), fileName("jpg"));
  done(e.currentTarget, t("saved"));
}));
$("#dlSvg").addEventListener("click", (e) => busy(e.currentTarget, async () => {
  if (artOn()) return toast(t("svgArt"));
  const qr = new QRCodeStyling(await qrOptions(1024, toUtf8Bytes(payload), "svg"));
  saveBlob(await qr.getRawData("svg"), fileName("svg"));
  done(e.currentTarget, t("saved"));
}));
$("#copyBtn").addEventListener("click", (e) => busy(e.currentTarget, async () => {
  try {
    const blob = toBlob(await exportCanvas());
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    done(e.currentTarget, t("copied"));
  } catch { toast(t("copyFail")); }
}));
// On phones the share sheet is the nicest way to "Save Image" into the gallery / Photos.
const shareImage = (btn, fallbackToDownload) => busy(btn, async () => {
  const file = new File([await toBlob(await exportCanvas())], fileName("png"), { type: "image/png" });
  if (!navigator.canShare?.({ files: [file] })) {
    if (!fallbackToDownload) return toast(t("shareFail"));
    saveBlob(file, file.name);
    return done(btn, t("saved"));
  }
  try { await navigator.share({ files: [file], title: t("brand") }); done(btn); } catch {}
});
$("#shareBtn").addEventListener("click", (e) => shareImage(e.currentTarget));
$("#mShare").addEventListener("click", (e) => shareImage(e.currentTarget, true));
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !$("#createView").hidden) {
    e.preventDefault();
    downloadPng($("#dlPng"));
  }
});

function done(btn, msg) {
  celebrate(btn);
  navigator.vibrate?.([18, 40, 18]);
  if (msg) toast(msg);
  addHistory();
}

/* ================================================================
   History
   ================================================================ */
function addHistory() {
  if (!payload) return;
  const view = $("#view");
  const th = el("canvas", { width: 160, height: Math.round((160 * view.height) / view.width) });
  th.getContext("2d").drawImage(view, 0, 0, th.width, th.height);
  const snap = structuredClone({ ...state, fields: { [state.type]: fieldsFor(state.type) } });
  delete snap.lang;
  const entry = { id: Date.now(), payload, thumb: th.toDataURL("image/webp", 0.8), snap };
  let list = store.get(HIST_KEY, []).filter((h) => h.payload !== payload);
  list.unshift(entry);
  list = list.slice(0, 15);
  // photos are large: if storage is full, drop the oldest until it fits
  while (!store.set(HIST_KEY, list) && list.length > 1) list.pop();
  renderHistory();
}
function renderHistory() {
  const list = store.get(HIST_KEY, []);
  $("#historyBox").hidden = !list.length;
  $("#hgrid").replaceChildren(...list.map((h) => {
    const b = el("button", { className: "hitem", type: "button", title: h.payload.slice(0, 120) },
      el("span", { textContent: typeById(h.snap.type).icon }));
    b.style.backgroundImage = `url(${h.thumb})`;
    b.onclick = () => {
      const fields = { ...state.fields, ...h.snap.fields };
      Object.assign(state, h.snap, { fields, lang: state.lang });
      buildAll();
      update(true);
      scrollTo({ top: phone.matches ? 0 : scrollY, behavior: "smooth" });
    };
    return b;
  }));
}
$("#clearHist").addEventListener("click", () => { store.set(HIST_KEY, []); renderHistory(); });

let saveTimer = 0;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!store.set(STORE_KEY, state)) store.set(STORE_KEY, { ...state, photo: null });
  }, 400);
}

/* ================================================================
   Delights: toast, heart burst, petals, welcome letter, dark mode
   ================================================================ */
let toastTimer = 0;
function toast(msg) {
  const tEl = $("#toast");
  tEl.textContent = msg;
  tEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => tEl.classList.remove("show"), 2400);
}

function celebrate(target, n = 18) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = target.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const s = el("span", { className: "burst", textContent: ["♥", "💖", "✨", "💕", "🌸"][i % 5] });
    s.style.left = r.left + r.width / 2 + "px";
    s.style.top = r.top + r.height / 2 + "px";
    const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 110;
    s.style.setProperty("--x", Math.cos(a) * d + "px");
    s.style.setProperty("--y", Math.sin(a) * d - 50 + "px");
    s.style.setProperty("--r", Math.random() * 200 - 100 + "deg");
    s.style.fontSize = 14 + Math.random() * 14 + "px";
    document.body.append(s);
    setTimeout(() => s.remove(), 1200);
  }
}

function startPetals() {
  const cv = $("#petals");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = cv.getContext("2d");
  let W, H, dpr;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener("resize", resize);
  const colors = ["#ff8fb1", "#ffb3c8", "#e8457a", "#d9a7ff", "#ffc6a8"];
  const N = innerWidth < 600 ? 14 : 26;
  const make = (y) => ({
    x: Math.random() * W, y: y ?? -20 - Math.random() * H,
    s: 6 + Math.random() * 11, vy: 0.25 + Math.random() * 0.55, sway: Math.random() * Math.PI * 2,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.02, heart: Math.random() < 0.45,
    c: colors[Math.floor(Math.random() * colors.length)], a: 0.25 + Math.random() * 0.35,
  });
  const ps = Array.from({ length: N }, () => make(Math.random() * H));
  function heartPath(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.5, -s, 0, -s * 0.4);
    ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.2, 0, s * 0.35);
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.y += p.vy; p.sway += 0.012; p.rot += p.vr;
      const x = p.x + Math.sin(p.sway) * 24;
      if (p.y > H + 30) Object.assign(p, make(-20));
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      if (p.heart) heartPath(p.s);
      else { ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.45, p.s * 0.8, 0, 0, Math.PI * 2); }
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  $("#themeBtn").textContent = mode === "dark" ? "☀️" : "🌙";
  $('meta[name="theme-color"]').content = mode === "dark" ? "#1a0b15" : "#fff1f5";
}
$("#themeBtn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  store.set("lqr-theme", next);
});

function applyLanguage(lang) {
  state.lang = lang;
  setLang(lang);
  $$("#langSeg button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
  $$(".her-name").forEach((n) => (n.textContent = tc(CONFIG.herName)));
  document.title = t("brand");
  $("#letterBody").textContent = tc(CONFIG.welcome);
  $("#letterFrom").textContent = tc(CONFIG.from);
  buildAll();
  update(true);
}
$("#langSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-lang]");
  if (b) applyLanguage(b.dataset.lang);
});

function showWelcome() {
  const w = $("#welcome");
  w.hidden = false;
  w.classList.remove("out");
  $("#envelope").classList.remove("open");
}
$("#seal").addEventListener("click", () => $("#envelope").classList.add("open"));
$("#envelope").addEventListener("click", (e) => { if (!e.target.closest(".btn")) $("#envelope").classList.add("open"); });
$("#openGift").addEventListener("click", (e) => {
  celebrate(e.currentTarget, 30);
  $("#welcome").classList.add("out");
  store.set("lqr-welcomed", true);
  setTimeout(() => ($("#welcome").hidden = true), 700);
});
$("#replayBtn").addEventListener("click", showWelcome);

/* ================================================================
   Modes: Create / Scan
   ================================================================ */
const scanner = initScanner({ toast, celebrate, onEdit: importPayload });
function setMode(mode) {
  $$("#modeSeg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
  $("#createView").hidden = mode !== "create";
  $("#scanView").hidden = mode !== "scan";
  if (mode !== "scan") scanner.stop();
  updateFab();
}
$("#modeSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-mode]");
  if (b) setMode(b.dataset.mode);
});

function importPayload(text) {
  if (/^WIFI:/i.test(text)) {
    const get = (k) => (text.match(new RegExp(`[;:]${k}:((?:\\\\.|[^;])*)`)) || [])[1]?.replace(/\\(.)/g, "$1") || "";
    Object.assign(fieldsFor("wifi"), { ssid: get("S"), password: get("P"), security: get("T") || "WPA", hidden: get("H") === "true" });
    state.type = "wifi";
  } else if (/^https?:\/\//i.test(text)) {
    fieldsFor("link").url = text;
    state.type = "link";
  } else {
    fieldsFor("text").message = text;
    state.type = "text";
  }
  setMode("create");
  $('#tabs button[data-tab="content"]').click();
  buildTypes();
  buildForm();
  update(true);
  scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- phone layout: mini live preview, bottom bar, history placement ---------- */
const phone = matchMedia("(max-width: 900px)");
let previewVisible = true;
new IntersectionObserver(([en]) => { previewVisible = en.isIntersecting; updateFab(); }, { threshold: 0.2 }).observe($("#stage"));
function updateFab() {
  const create = !$("#createView").hidden;
  $("#pip").classList.toggle("show", create && !previewVisible);
  document.body.classList.toggle("in-create", create);
}
$("#pip").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
function drawPip() {
  const view = $("#view"), pc = $("#pipCanvas");
  const k = 168 / Math.max(view.width, view.height);
  pc.width = Math.round(view.width * k);
  pc.height = Math.round(view.height * k);
  pc.getContext("2d").drawImage(view, 0, 0, pc.width, pc.height);
}
function placeHistory() {
  (phone.matches ? $("#historySlot") : $("#previewCard")).append($("#historyBox"));
}
phone.addEventListener("change", placeHistory);
placeHistory();
// the on-screen keyboard should not be covered by floating bars
document.addEventListener("focusin", (e) => {
  if (e.target.matches("input:not([type=checkbox]):not([type=range]):not([type=color]):not([type=file]), textarea, select")) document.body.classList.add("typing");
});
document.addEventListener("focusout", () => document.body.classList.remove("typing"));

/* ================================================================
   Boot
   ================================================================ */
applyTheme(store.get("lqr-theme", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
applyLanguage(state.lang || CONFIG.defaultLang);
renderHistory();
startPetals();
if (!store.get("lqr-welcomed", false)) showWelcome();

// installable + offline when served over https (GitHub Pages)
if ("serviceWorker" in navigator && location.protocol === "https:") {
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
