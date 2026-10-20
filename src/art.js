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

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const css = ([r, g, b]) => `rgb(${r},${g},${b})`;

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
  const cell = size / n;
  const DARK = hex(dark);

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

  // 2) a light veil per module nudges each area toward its QR color (keeps the photo visible)
  const veil = 0.06 + safety * 0.26;
  // 3) a round dot in the middle of each module is what the scanner actually reads
  const dot = cell * (0.3 + safety * 0.24);
  const darkCss = css(DARK);

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const isDark = qr.isDark(r, c);
      const x = c * cell, y = r * cell;
      if (fn[r][c] && r !== 6 && c !== 6) {
        ctx.fillStyle = isDark ? darkCss : "#fff";
        ctx.fillRect(x - 0.5, y - 0.5, cell + 1, cell + 1);
        continue;
      }
      ctx.fillStyle = isDark ? `rgba(${DARK},${veil})` : `rgba(255,255,255,${veil + 0.06})`;
      ctx.fillRect(x, y, cell, cell);
      const d = fn[r][c] ? cell * 0.6 : dot; // timing lines get slightly bigger dots
      ctx.fillStyle = isDark ? darkCss : "#fff";
      ctx.beginPath();
      ctx.arc(x + cell / 2, y + cell / 2, d / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // round, softly-styled finder eyes drawn on top
  const eye = (r0, c0) => {
    const x = c0 * cell, y = r0 * cell;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - cell, y - cell, cell * 9, cell * 9);
    ctx.fillStyle = darkCss;
    ctx.beginPath(); ctx.roundRect(x, y, cell * 7, cell * 7, cell * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.roundRect(x + cell, y + cell, cell * 5, cell * 5, cell * 1.4); ctx.fill();
    ctx.fillStyle = darkCss;
    ctx.beginPath(); ctx.roundRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell); ctx.fill();
  };
  eye(0, 0); eye(0, n - 7); eye(n - 7, 0);
  return out;
}
