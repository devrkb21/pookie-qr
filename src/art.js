// "ছবির QR": the photo itself becomes the QR code (halftone QR).
//
// The photo is drawn smooth and full-size; on top of it every QR module gets a small round dot
// in the real QR color (that is what a scanner reads) plus a faint veil toward that color.
// Finder "eyes", timing lines, alignment and format areas stay solid so phones lock on fast.

// Alignment pattern centers per QR version (1–40)
const ALIGN = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]];

function functionMap(n) {
  const v = (n - 17) / 4;
  const f = Array.from({ length: n }, () => new Uint8Array(n));
  const mark = (r, c) => { if (r >= 0 && c >= 0 && r < n && c < n) f[r][c] = 1; };
  // finders + separators + format info
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { mark(r, c); mark(r, n - 9 + c); mark(n - 9 + r, c); }
  // timing
  for (let i = 0; i < n; i++) { mark(6, i); mark(i, 6); }
  // alignment
  const pos = ALIGN[v] || [];
  for (const r of pos) for (const c of pos) {
    if ((r < 9 && c < 9) || (r < 9 && c > n - 10) || (r > n - 10 && c < 9)) continue;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) mark(r + dr, c + dc);
  }
  // version info (v7+)
  if (v >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { mark(i, n - 11 + j); mark(n - 11 + j, i); }
  return f;
}

const css = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const lumOf = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

// Same hue as the photo, but dark enough (≤ maxL) to read as a QR "dark" module…
function darkOf(p, maxL) {
  const l = lumOf(p);
  if (l <= maxL) return p;
  const k = maxL / l;
  return p.map((v) => v * k);
}
// …or light enough (≥ minL) to read as a "light" module.
function lightOf(p, minL) {
  const l = lumOf(p);
  if (l >= minL) return p;
  const t = (minL - l) / (1 - l);
  return p.map((v) => v + (255 - v) * t);
}

/**
 * @param {object} o
 *   qr     qrcode-generator object (getModuleCount, isDark)
 *   photo  drawable image
 *   size   output px
 *   style  "color" | "mono" | "tint"
 *   safety 0..1 — bigger dots and stronger contrast = easier scanning
 *   tint   hex color used by the "tint" style
 */
export function renderArtQr({ qr, photo, size, style = "color", safety = 0.5, tint = "#e8457a" }) {
  const n = qr.getModuleCount();
  const fn = functionMap(n);
  const cell = size / n;

  const out = document.createElement("canvas");
  out.width = out.height = size;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);

  // 1) the photo, drawn smooth and full-resolution (center-cropped to a square)
  const pw = photo.width || photo.naturalWidth, ph = photo.height || photo.naturalHeight;
  const side = Math.min(pw, ph);
  ctx.save();
  ctx.imageSmoothingQuality = "high";
  ctx.filter = style === "color" ? "saturate(1.15) contrast(1.06)" : "grayscale(1) contrast(1.2)";
  ctx.drawImage(photo, (pw - side) / 2, (ph - side) / 2, side, side, 0, 0, size, size);
  ctx.filter = "none";
  if (style === "tint") {
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.restore();

  // the photo's own color under every module, so the QR is painted in the picture's colors
  const sc = document.createElement("canvas");
  sc.width = sc.height = n;
  const sx = sc.getContext("2d", { willReadFrequently: true });
  sx.drawImage(out, 0, 0, n, n);
  const px = sx.getImageData(0, 0, n, n).data;
  const colorAt = (r, c) => { const k = (r * n + c) * 4; return [px[k], px[k + 1], px[k + 2]]; };

  // contrast targets: more safety = darker darks, lighter lights and a stronger veil
  const maxDark = 0.16 - safety * 0.08;
  const minLight = 0.86 + safety * 0.1;
  const veil = 0.08 + safety * 0.5;
  const dot = cell * 0.34; // a fixed size scans best; bigger dots confuse scanners over dark areas

  const isEye = (r, c) => (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (isEye(r, c)) continue;
      const isDark = qr.isDark(r, c);
      const base = colorAt(r, c);
      const col = isDark ? darkOf(base, maxDark) : lightOf(base, minLight);
      const x = c * cell, y = r * cell;
      if (fn[r][c] && r !== 6 && c !== 6) {
        // format / alignment / version areas: whole module, in the photo's tones
        ctx.fillStyle = css(col, 0.92);
        ctx.fillRect(x, y, cell, cell);
        continue;
      }
      ctx.fillStyle = css(col, veil);
      ctx.fillRect(x, y, cell, cell);
      const d = fn[r][c] ? cell * 0.6 : dot; // timing lines get slightly bigger dots
      ctx.fillStyle = css(col);
      ctx.beginPath();
      ctx.arc(x + cell / 2, y + cell / 2, d / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // finder eyes: see-through light parts and dark parts tinted from the photo underneath
  const eye = (r0, c0) => {
    let sum = [0, 0, 0];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) sum = sum.map((v, i) => v + colorAt(r0 + r, c0 + c)[i]);
    const avg = sum.map((v) => v / 49);
    const dk = darkOf(avg, Math.min(maxDark, 0.16));
    const lt = lightOf(avg, Math.max(minLight, 0.88));
    const x = c0 * cell, y = r0 * cell;
    const ring = (outer, inner, fill) => {
      ctx.beginPath();
      outer();
      inner();
      ctx.fillStyle = fill;
      ctx.fill("evenodd");
    };
    // one-module light separator around the eye
    ring(() => ctx.rect(x - cell, y - cell, cell * 9, cell * 9), () => ctx.rect(x, y, cell * 7, cell * 7), css(lt, 0.97));
    // dark outer ring
    ring(() => ctx.roundRect(x, y, cell * 7, cell * 7, cell * 2), () => ctx.roundRect(x + cell, y + cell, cell * 5, cell * 5, cell * 1.4), css(dk));
    // light inner ring: the photo still shows through
    ring(() => ctx.roundRect(x + cell, y + cell, cell * 5, cell * 5, cell * 1.4), () => ctx.roundRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell), css(lt, 0.97));
    // dark center
    ctx.fillStyle = css(dk);
    ctx.beginPath(); ctx.roundRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell); ctx.fill();
  };
  eye(0, 0); eye(0, n - 7); eye(n - 7, 0);
  return out;
}
