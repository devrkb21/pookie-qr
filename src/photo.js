// "ছবি" content: pick a photo, shrink it, upload it to our Cloudflare worker,
// and the QR becomes a link to qr.czbd.app/p/#<id> where the photo is shown.
import { CONFIG } from "./config.js";
import { t } from "./i18n.js";

let pending = null; // the compressed photo waiting to be uploaded (kept in memory only)

function el(tag, props = {}, children = []) {
  const n = Object.assign(document.createElement(tag), props);
  for (const ch of [].concat(children)) if (ch != null) n.append(ch);
  return n;
}

const toBlob = (c, type, q) => new Promise((r) => c.toBlob(r, type, q));

/** Shrink a photo so it uploads fast but still looks sharp on a phone. */
export async function compressPhoto(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => createImageBitmap(file));
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);

  let q = 0.84, blob = await toBlob(c, "image/webp", q);
  const type = blob?.type === "image/webp" ? "image/webp" : "image/jpeg";
  if (type !== "image/webp") blob = await toBlob(c, type, q);
  while (blob.size > 1.4 * 1024 * 1024 && q > 0.5) {
    q -= 0.08;
    blob = await toBlob(c, type, q);
  }
  // small preview that can be remembered between visits
  const s = Math.min(1, 360 / Math.max(c.width, c.height));
  const p = document.createElement("canvas");
  p.width = Math.round(c.width * s);
  p.height = Math.round(c.height * s);
  p.getContext("2d").drawImage(c, 0, 0, p.width, p.height);
  return { blob, thumb: p.toDataURL("image/jpeg", 0.8) };
}

async function upload(blob, msg) {
  const res = await fetch(`${CONFIG.imageApi}/upload`, {
    method: "POST",
    headers: { "Content-Type": blob.type, "X-Message": encodeURIComponent(msg) },
    body: blob,
  });
  if (res.status === 429) throw new Error("slow-down");
  if (res.status === 413) throw new Error("too-big");
  if (!res.ok) throw new Error("fail");
  return (await res.json()).id;
}

/**
 * Builds the form for the photo content type.
 * vals: { thumb, msg, url, upMsg }   ctx: { update, rebuild, toast, celebrate, useAsArt }
 */
export function buildPhotoForm(vals, ctx) {
  const nodes = [];
  const dirty = !!pending || (vals.url && vals.msg !== vals.upMsg);

  // picker
  const file = el("input", { type: "file", accept: "image/*" });
  const pick = el("label", { className: "photo-pick" + (vals.thumb ? " has" : "") }, [
    file,
    vals.thumb ? el("img", { src: vals.thumb, alt: "" }) : el("span", { className: "pp-icon", textContent: "📷" }),
    el("span", { className: "pp-text", textContent: t(vals.thumb ? "ph_change" : "ph_choose") }),
  ]);
  const onFile = async (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    try {
      const { blob, thumb } = await compressPhoto(f);
      pending = blob;
      vals.thumb = thumb;
      ctx.rebuild();
      ctx.update();
    } catch {
      ctx.toast(t("up_fail"));
    }
  };
  file.addEventListener("change", () => { onFile(file.files[0]); file.value = ""; });
  ["dragenter", "dragover"].forEach((ev) => pick.addEventListener(ev, (e) => { e.preventDefault(); pick.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => pick.addEventListener(ev, () => pick.classList.remove("drag")));
  pick.addEventListener("drop", (e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); });
  nodes.push(pick);

  // message
  const msg = el("input", { type: "text", maxLength: 120, value: vals.msg || "", placeholder: t("ph_photoMsg") });
  msg.addEventListener("input", () => {
    vals.msg = msg.value;
    const btnNow = document.querySelector("#form .up-btn");
    if (btnNow && vals.url) btnNow.hidden = vals.msg === vals.upMsg && !pending;
    ctx.save();
  });
  nodes.push(el("label", { className: "fld" }, [el("span", { textContent: t("f_photoMsg") }), msg]));

  // upload button
  const btn = el("button", { className: "btn primary up-btn", type: "button", textContent: t(vals.url ? "up_again" : "up_btn") });
  btn.hidden = !!vals.url && !dirty;
  btn.addEventListener("click", async () => {
    if (!pending) return ctx.toast(t(vals.thumb ? "up_reselect" : "up_need"));
    btn.disabled = true;
    btn.textContent = t("up_busy");
    try {
      const id = await upload(pending, vals.msg || "");
      pending = null;
      vals.url = CONFIG.photoPage + id;
      vals.upMsg = vals.msg || "";
      ctx.rebuild();
      ctx.update(true);
      ctx.celebrate(document.querySelector("#form .photo-pick"));
      ctx.toast(t("up_done"));
    } catch (e) {
      ctx.toast(t(e.message === "slow-down" ? "up_slow" : e.message === "too-big" ? "up_tooBig" : "up_fail"));
      btn.disabled = false;
      btn.textContent = t(vals.url ? "up_again" : "up_btn");
    }
  });
  nodes.push(btn);

  // done state
  if (vals.url) {
    nodes.push(el("div", { className: "up-done" }, [
      el("span", { textContent: "✓ " + t("up_ready") }),
      el("a", { href: vals.url, target: "_blank", rel: "noopener", textContent: t("up_open") }),
    ]));
  }
  if (vals.thumb) {
    nodes.push(el("button", { className: "btn ghost", type: "button", textContent: t("use_as_art"), onclick: () => ctx.useAsArt(vals.thumb) }));
  }
  return nodes;
}
