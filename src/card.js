// Draws the final "card": the QR code inside a decorative frame with title + caption.
// Everything is laid out in base units (QR = 520) and multiplied by `scale` for HD export.

export const QR_BASE = 520;

export const FRAMES = ["plain", "polaroid", "card", "scanme", "letter"];

const FONTS = {
  script: { family: '"Great Vibes", "Galada", "Hind Siliguri", cursive', size: 66, style: "" },
  serif: { family: '"Playfair Display", "Hind Siliguri", serif', size: 46, style: "italic 500" },
  clean: { family: '"Poppins", "Hind Siliguri", sans-serif', size: 40, style: "500" },
  bangla: { family: '"Galada", "Hind Siliguri", cursive', size: 54, style: "" },
};

let fontsReady;
export function ensureFonts() {
  fontsReady ??= Promise.all([
    document.fonts.load('66px "Great Vibes"'),
    document.fonts.load('italic 500 46px "Playfair Display"'),
    document.fonts.load('600 46px "Playfair Display"'),
    document.fonts.load('500 40px "Poppins"'),
    document.fonts.load('700 40px "Poppins"'),
    document.fonts.load('54px "Galada"', "ভালোবাসা"),
    document.fonts.load('500 40px "Hind Siliguri"', "ভালোবাসা"),
  ]).catch(() => {});
  return fontsReady;
}

/* ---------- small drawing helpers ---------- */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function heart(ctx, cx, cy, size) {
  const s = size / 100;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 36 * s);
  ctx.bezierCurveTo(cx - 70 * s, cy - 10 * s, cx - 40 * s, cy - 62 * s, cx, cy - 30 * s);
  ctx.bezierCurveTo(cx + 40 * s, cy - 62 * s, cx + 70 * s, cy - 10 * s, cx, cy + 36 * s);
  ctx.closePath();
}
function grad(ctx, x, y, w, h, a, b) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}
function text(ctx, str, x, y, maxW, { family, size, style = "", color, align = "center", spacing = 0 }) {
  if (!str) return;
  let s = size;
  ctx.font = `${style} ${s}px ${family}`;
  if (spacing) ctx.letterSpacing = spacing + "px";
  while (ctx.measureText(str).width > maxW && s > 14) {
    s -= 2;
    ctx.font = `${style} ${s}px ${family}`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(str, x, y);
  ctx.letterSpacing = "0px";
}
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* ---------- frames ---------- */
// Each returns { w, h, draw(ctx) } in base units. `qr` is an image at QR_BASE*scale px.
const LAYOUTS = {
  plain(o) {
    const S = QR_BASE, pad = 36;
    const top = o.title ? 92 : 0, bottom = o.caption ? 104 : 0;
    const w = S + pad * 2, h = S + pad * 2 + top + bottom;
    return {
      w, h,
      draw(ctx) {
        if (!o.transparent) {
          ctx.fillStyle = o.bg;
          rr(ctx, 0, 0, w, h, 36);
          ctx.fill();
        }
        text(ctx, o.title, w / 2, pad + top / 2, w - pad * 2, { family: FONTS.serif.family, size: 48, style: "600", color: o.c2 });
        ctx.drawImage(o.qr, pad, pad + top, S, S);
        text(ctx, o.caption, w / 2, pad + top + S + bottom / 2 + 6, w - pad * 2, { ...o.font, color: o.c1 });
      },
    };
  },

  polaroid(o) {
    const S = QR_BASE, side = 46, topPad = 70 + (o.title ? 76 : 0), bottom = 190;
    const w = S + side * 2, h = topPad + S + bottom;
    return {
      w, h,
      draw(ctx, k) {
        ctx.fillStyle = "#fffdf9";
        rr(ctx, 0, 0, w, h, 14);
        ctx.fill();
        ctx.strokeStyle = "rgba(120, 70, 90, .12)";
        ctx.lineWidth = 2;
        ctx.stroke();
        // washi tape
        ctx.save();
        ctx.translate(w / 2, 22);
        ctx.rotate(-0.05);
        ctx.fillStyle = o.c1 + "55";
        ctx.fillRect(-95, -20, 190, 46);
        ctx.fillStyle = "rgba(255,255,255,.35)";
        for (let i = -90; i < 95; i += 18) ctx.fillRect(i, -20, 6, 46);
        ctx.restore();
        text(ctx, o.title, w / 2, 70 + 34, w - side * 2, { family: FONTS.serif.family, size: 44, style: "italic 500", color: o.c2 });
        ctx.save();
        ctx.shadowColor = "rgba(80, 30, 50, .18)";
        ctx.shadowBlur = 18 * k;
        ctx.shadowOffsetY = 6 * k;
        ctx.fillStyle = o.bg;
        rr(ctx, side - 10, topPad - 10, S + 20, S + 20, 10);
        ctx.fill();
        ctx.restore();
        ctx.drawImage(o.qr, side, topPad, S, S);
        text(ctx, o.caption, w / 2, topPad + S + bottom / 2, w - side * 2, { ...o.font, color: "#3d2a33" });
        if (!o.caption) {
          ctx.fillStyle = o.c1;
          heart(ctx, w / 2, topPad + S + bottom / 2 + 6, 60);
          ctx.fill();
        }
      },
    };
  },

  card(o) {
    const S = QR_BASE, pad = 60, inner = 30;
    const top = o.title ? 124 : 60, bottom = o.caption ? 124 : 60;
    const w = S + inner * 2 + pad * 2, h = top + S + inner * 2 + bottom;
    return {
      w, h,
      draw(ctx, k) {
        ctx.fillStyle = grad(ctx, 0, 0, w, h, o.c1, o.c2);
        rr(ctx, 0, 0, w, h, 48);
        ctx.fill();
        // glow + scattered hearts
        const rg = ctx.createRadialGradient(w * 0.2, h * 0.1, 10, w * 0.2, h * 0.1, w * 0.8);
        rg.addColorStop(0, "rgba(255,255,255,.28)");
        rg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = rg;
        rr(ctx, 0, 0, w, h, 48);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.16)";
        [[0.08, 0.06, 46], [0.9, 0.1, 64], [0.06, 0.9, 58], [0.93, 0.93, 40], [0.5, 0.97, 26], [0.97, 0.5, 30], [0.03, 0.45, 28]]
          .forEach(([x, y, s]) => { heart(ctx, w * x, h * y, s); ctx.fill(); });
        text(ctx, o.title, w / 2, top / 2 + 6, w - pad * 2, { family: FONTS.serif.family, size: 52, style: "600", color: "#fff" });
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.22)";
        ctx.shadowBlur = 30 * k;
        ctx.shadowOffsetY = 12 * k;
        ctx.fillStyle = o.bg;
        rr(ctx, pad, top, S + inner * 2, S + inner * 2, 34);
        ctx.fill();
        ctx.restore();
        ctx.drawImage(o.qr, pad + inner, top + inner, S, S);
        text(ctx, o.caption, w / 2, top + S + inner * 2 + bottom / 2 + 4, w - pad * 2, { ...o.font, color: "#fff" });
      },
    };
  },

  scanme(o) {
    const S = QR_BASE, pad = 40, inner = 30, border = 14;
    const box = S + inner * 2 + border;
    const pillH = 104, gap = 34, capH = o.caption ? 100 : 0;
    const w = box + pad * 2, h = pad + box + gap + pillH + capH + pad;
    return {
      w, h,
      draw(ctx) {
        ctx.fillStyle = o.transparent ? "#ffffff" : o.bg;
        rr(ctx, 0, 0, w, h, 44);
        ctx.fill();
        const fill = grad(ctx, pad, pad, box, box, o.c1, o.c2);
        ctx.strokeStyle = fill;
        ctx.lineWidth = border;
        rr(ctx, pad + border / 2, pad + border / 2, box - border, box - border, 40);
        ctx.stroke();
        ctx.drawImage(o.qr, pad + border / 2 + inner, pad + border / 2 + inner, S, S);
        // arrow + pill
        const py = pad + box + gap, pw = box * 0.78, px = (w - pw) / 2;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 22, py + 2);
        ctx.lineTo(w / 2, py - 22);
        ctx.lineTo(w / 2 + 22, py + 2);
        ctx.fill();
        ctx.fillStyle = grad(ctx, px, py, pw, pillH, o.c1, o.c2);
        rr(ctx, px, py, pw, pillH, pillH / 2);
        ctx.fill();
        const label = (o.title || "Scan me ♥").toLocaleUpperCase();
        text(ctx, label, w / 2, py + pillH / 2 + 2, pw - 60, { family: FONTS.clean.family, size: 46, style: "700", color: "#fff", spacing: 4 });
        text(ctx, o.caption, w / 2, py + pillH + capH / 2 + 8, w - pad * 2, { ...o.font, color: o.c2 });
      },
    };
  },

  letter(o) {
    const S = QR_BASE, stripe = 24, pad = 58, inner = 22;
    const top = 150, bottom = o.caption ? 130 : 60;
    const w = S + inner * 2 + (stripe + pad) * 2, h = stripe + top + S + inner * 2 + bottom + stripe;
    return {
      w, h,
      draw(ctx, k) {
        // airmail stripes
        ctx.save();
        rr(ctx, 0, 0, w, h, 22);
        ctx.clip();
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 4);
        const L = Math.hypot(w, h);
        for (let i = -L, n = 0; i < L; i += 34, n++) {
          ctx.fillStyle = n % 3 === 0 ? o.c1 : n % 3 === 1 ? "#ffffff" : o.c2;
          ctx.fillRect(i, -L, 34, L * 2);
        }
        ctx.restore();
        ctx.fillStyle = "#fbf4ea";
        rr(ctx, stripe, stripe, w - stripe * 2, h - stripe * 2, 10);
        ctx.fill();
        // stamp
        const sw = 112, sh = 132, sx = w - stripe - 34 - sw, sy = stripe + 26;
        ctx.save();
        ctx.translate(sx + sw / 2, sy + sh / 2);
        ctx.rotate(0.06);
        ctx.fillStyle = "#fff";
        ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
        ctx.fillStyle = "#fbf4ea";
        for (let x = -sw / 2; x <= sw / 2; x += 14) {
          ctx.beginPath(); ctx.arc(x, -sh / 2, 5, 0, 7); ctx.arc(x, sh / 2, 5, 0, 7); ctx.fill();
        }
        for (let y = -sh / 2; y <= sh / 2; y += 14) {
          ctx.beginPath(); ctx.arc(-sw / 2, y, 5, 0, 7); ctx.arc(sw / 2, y, 5, 0, 7); ctx.fill();
        }
        ctx.fillStyle = grad(ctx, -sw / 2 + 12, -sh / 2 + 12, sw - 24, sh - 24, o.c1, o.c2);
        ctx.fillRect(-sw / 2 + 12, -sh / 2 + 12, sw - 24, sh - 24);
        ctx.fillStyle = "#fff";
        heart(ctx, 0, 4, 66);
        ctx.fill();
        ctx.restore();
        // postmark
        ctx.strokeStyle = o.c2 + "66";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx - 30, sy + 70, 44, 0, 7); ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(sx - 150, sy + 48 + i * 14);
          ctx.bezierCurveTo(sx - 120, sy + 38 + i * 14, sx - 100, sy + 58 + i * 14, sx - 74, sy + 48 + i * 14);
          ctx.stroke();
        }
        text(ctx, o.title, stripe + pad, stripe + top / 2 + 4, sx - 180 - stripe - pad, { family: FONTS.serif.family, size: 48, style: "italic 500", color: o.c2, align: "left" });
        // QR panel
        const qx = stripe + pad, qy = stripe + top;
        ctx.save();
        ctx.shadowColor = "rgba(90, 50, 30, .16)";
        ctx.shadowBlur = 16 * k;
        ctx.shadowOffsetY = 6 * k;
        ctx.fillStyle = o.bg;
        rr(ctx, qx, qy, S + inner * 2, S + inner * 2, 16);
        ctx.fill();
        ctx.restore();
        ctx.drawImage(o.qr, qx + inner, qy + inner, S, S);
        text(ctx, o.caption, w / 2, qy + S + inner * 2 + bottom / 2 + 4, w - (stripe + pad) * 2, { ...o.font, color: o.c1 });
      },
    };
  },
};

/**
 * @param {object} o  { qr, frame, c1, c2, bg, title, caption, font, transparent, scale }
 * @returns {HTMLCanvasElement}
 */
export function renderCard(o) {
  const k = o.scale || 1;
  const opts = { ...o, font: FONTS[o.font] || FONTS.script };
  const layout = (LAYOUTS[o.frame] || LAYOUTS.plain)(opts);
  const c = document.createElement("canvas");
  c.width = Math.round(layout.w * k);
  c.height = Math.round(layout.h * k);
  const ctx = c.getContext("2d");
  ctx.scale(k, k);
  ctx.imageSmoothingQuality = "high";
  layout.draw(ctx, k);
  return c;
}
