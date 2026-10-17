// "Scan" mode: read QR codes from the camera, a chosen file, drag & drop, or a pasted image.
import jsQR from "jsqr";
import { t } from "./i18n.js";
import { describePayload } from "./qr-data.js";

const $ = (s) => document.querySelector(s);

/** Decode a QR from any drawable (image, bitmap, video frame). Tries a couple of sizes. */
export function decodeDrawable(src, w, h, sizes = [800, 500, 1200]) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true });
  for (const max of sizes) {
    const k = Math.min(1, max / Math.max(w, h));
    c.width = Math.round(w * k);
    c.height = Math.round(h * k);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(src, 0, 0, c.width, c.height);
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const res = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    if (res) return res;
  }
  return null;
}

export function initScanner({ toast, onEdit, celebrate }) {
  const vf = $("#viewfinder"), video = $("#video"), camBtn = $("#camBtn");
  const frameCanvas = document.createElement("canvas");
  const fctx = frameCanvas.getContext("2d", { willReadFrequently: true });
  let stream = null, raf = 0, lastText = "";

  function setCamLabel(on) {
    camBtn.dataset.i18n = on ? "sc_stop" : "sc_start";
    camBtn.textContent = t(camBtn.dataset.i18n);
  }

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false });
    } catch {
      toast(t("sc_noCam"));
      return;
    }
    video.srcObject = stream;
    await video.play().catch(() => {});
    vf.classList.add("live");
    setCamLabel(true);
    tick();
  }

  function stop() {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((tr) => tr.stop());
    stream = null;
    video.srcObject = null;
    vf.classList.remove("live");
    setCamLabel(false);
  }

  function tick() {
    if (!stream) return;
    if (video.readyState >= 2 && video.videoWidth) {
      const k = Math.min(1, 640 / video.videoWidth);
      frameCanvas.width = video.videoWidth * k;
      frameCanvas.height = video.videoHeight * k;
      fctx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
      const img = fctx.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
      const res = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
      if (res?.data) {
        navigator.vibrate?.(60);
        show(res.data);
        stop();
        return;
      }
    }
    raf = requestAnimationFrame(tick);
  }

  async function decodeFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const bmp = await createImageBitmap(file);
      const res = decodeDrawable(bmp, bmp.width, bmp.height);
      res?.data ? show(res.data) : toast(t("sc_none"));
    } catch {
      toast(t("sc_none"));
    }
  }

  function show(text) {
    lastText = text;
    $("#resultText").textContent = text;
    const info = describePayload(text);
    const open = $("#resOpen");
    open.hidden = !info.open;
    if (info.open) open.href = info.open;
    if (info.lines) $("#resultText").textContent = info.lines.map(([k, v]) => `${k}: ${v}`).join("\n");
    $("#result").hidden = false;
    $("#result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    celebrate($("#result"));
  }

  camBtn.addEventListener("click", () => (stream ? stop() : start()));
  $("#scanFile").addEventListener("change", (e) => { decodeFile(e.target.files[0]); e.target.value = ""; });
  $("#resCopy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(lastText); toast(t("copied")); } catch { toast(t("copyFail")); }
  });
  $("#resEdit").addEventListener("click", () => onEdit(lastText));

  ["dragenter", "dragover"].forEach((ev) => vf.addEventListener(ev, (e) => { e.preventDefault(); vf.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => vf.addEventListener(ev, () => vf.classList.remove("drag")));
  vf.addEventListener("drop", (e) => { e.preventDefault(); decodeFile(e.dataTransfer.files[0]); });

  window.addEventListener("paste", (e) => {
    if ($("#scanView").hidden) return;
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
    if (item) decodeFile(item.getAsFile());
  });

  return { stop };
}
