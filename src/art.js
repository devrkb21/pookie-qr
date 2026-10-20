// "ছবির QR": the photo itself becomes the QR code (halftone QR).
//
// Every QR module is split into a 3×3 grid. The outer 8 cells take the photo's colors,
// the center cell keeps the real QR color, which is what a scanner reads.
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

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
const css = ([r, g, b]) => `rgb(${r},${g},${b})`;
const lum = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

/**
 * @param {object} o
 *   qr     qrcode-generator object (getModuleCount, isDark)
 *   photo  drawable image
 *   size   output px
 *   style  "color" | "mono" | "tint"
 *   safety 0..1 — bigger, cleaner center dots = easier scanning
 *   dark   hex color for dark modules / eyes
 *   tint   hex color used by the "tint" style
 */
export function renderArtQr({ qr, photo, size, style = "color", safety = 0.5, dark = "#1d1d1f", tint = "#e8457a" }) {
  const n = qr.getModuleCount();
  const fn = functionMap(n);
  const S = n * 3;

  // sample the photo (center-cropped to a square) at 3 px per module
  const sc = document.createElement("canvas");
  sc.width = sc.height = S;
  const sx = sc.getContext("2d", { willReadFrequently: true });
  const pw = photo.width || photo.naturalWidth, ph = photo.height || photo.naturalHeight;
  const side = Math.min(pw, ph);
  sx.drawImage(photo, (pw - side) / 2, (ph - side) / 2, side, side, 0, 0, S, S);
  const px = sx.getImageData(0, 0, S, S).data;

  const DARK = hex(dark), LIGHT = [255, 255, 255], TINT = hex(tint);
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);

  const cell = size / n, sub = cell / 3;
  // the photo is pushed a little toward the module color so contrast survives
  const push = 0.12 + safety * 0.33;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const isDark = qr.isDark(r, c);
      const x = c * cell, y = r * cell;
      if (fn[r][c]) {
        ctx.fillStyle = css(isDark ? DARK : LIGHT);
        ctx.fillRect(x - 0.5, y - 0.5, cell + 1, cell + 1);
        continue;
      }
      const target = isDark ? DARK : LIGHT;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (i === 1 && j === 1) continue;
          const k = ((r * 3 + i) * S + (c * 3 + j)) * 4;
          let col = [px[k], px[k + 1], px[k + 2]];
          if (style === "mono") {
            const l = lum(col);
            col = l > 0.5 ? mix(LIGHT, [200, 200, 200], 1 - (l - 0.5) * 2) : mix(DARK, [70, 70, 70], l * 2);
          } else if (style === "tint") {
            const l = lum(col);
            col = mix(mix(DARK, TINT, 0.55), [255, 240, 246], l);
          }
          col = mix(col, target, push);
          ctx.fillStyle = css(col);
          ctx.fillRect(x + j * sub - 0.25, y + i * sub - 0.25, sub + 0.5, sub + 0.5);
        }
      }
      // the readable center dot
      const d = sub * (1 + safety * 0.75);
      ctx.fillStyle = css(target);
      ctx.beginPath();
      ctx.roundRect(x + (cell - d) / 2, y + (cell - d) / 2, d, d, d * 0.28);
      ctx.fill();
    }
  }

  // round, softly-styled finder eyes drawn on top
  const eye = (r0, c0) => {
    const x = c0 * cell, y = r0 * cell;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - cell, y - cell, cell * 9, cell * 9);
    ctx.fillStyle = css(DARK);
    ctx.beginPath(); ctx.roundRect(x, y, cell * 7, cell * 7, cell * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.roundRect(x + cell, y + cell, cell * 5, cell * 5, cell * 1.4); ctx.fill();
    ctx.fillStyle = css(DARK);
    ctx.beginPath(); ctx.roundRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell); ctx.fill();
  };
  eye(0, 0); eye(0, n - 7); eye(n - 7, 0);
  return out;
}
