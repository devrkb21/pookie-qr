// Every content type: its form fields and how they become the QR payload.
// Field: { id, label (i18n key), type, ph?, options?, half? }

const esc = (s) => String(s).replace(/([\\;,:"])/g, "\\$1");
const digits = (s) => String(s).replace(/[^\d+]/g, "");
const enc = encodeURIComponent;

function icsDate(local) {
  // "2026-10-17T19:30" (local) -> "20261017T133000Z" (UTC)
  const d = new Date(local);
  if (isNaN(d)) return "";
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const SOCIAL = {
  instagram: (u) => `https://instagram.com/${u}`,
  facebook: (u) => `https://facebook.com/${u}`,
  youtube: (u) => `https://youtube.com/@${u}`,
  tiktok: (u) => `https://tiktok.com/@${u}`,
  telegram: (u) => `https://t.me/${u}`,
  x: (u) => `https://x.com/${u}`,
  linkedin: (u) => `https://linkedin.com/in/${u}`,
  pinterest: (u) => `https://pinterest.com/${u}`,
};

export const TYPES = [
  {
    id: "link", icon: "🔗",
    fields: [{ id: "url", label: "f_url", type: "url", ph: "https://example.com" }],
    build: (v) => {
      const u = v.url.trim();
      if (!u) return "";
      return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : "https://" + u;
    },
  },
  {
    id: "text", icon: "💌",
    fields: [{ id: "message", label: "f_message", type: "textarea", ph: "ph_message" }],
    build: (v) => v.message,
  },
  {
    id: "photo", icon: "📷", custom: true,
    fields: [
      { id: "thumb", type: "hidden" }, { id: "msg", type: "hidden" },
      { id: "url", type: "hidden" }, { id: "upMsg", type: "hidden" },
    ],
    build: (v) => v.url || "",
  },
  {
    id: "wifi", icon: "📶",
    fields: [
      { id: "ssid", label: "f_ssid", type: "text", ph: "ph_ssid", half: true },
      { id: "password", label: "f_password", type: "text", half: true },
      { id: "security", label: "f_security", type: "select", options: [["WPA", "WPA / WPA2 / WPA3"], ["WEP", "WEP"], ["nopass", "sec_none"]] },
      { id: "hidden", label: "f_hidden", type: "checkbox" },
    ],
    build: (v) => {
      if (!v.ssid.trim()) return "";
      const pass = v.security !== "nopass" ? `P:${esc(v.password)};` : "";
      return `WIFI:T:${v.security};S:${esc(v.ssid)};${pass}${v.hidden ? "H:true;" : ""};`;
    },
  },
  {
    id: "phone", icon: "📞",
    fields: [{ id: "phone", label: "f_phone", type: "tel", ph: "+8801XXXXXXXXX" }],
    build: (v) => (digits(v.phone) ? "tel:" + digits(v.phone) : ""),
  },
  {
    id: "sms", icon: "✉️",
    fields: [
      { id: "phone", label: "f_phone", type: "tel", ph: "+8801XXXXXXXXX" },
      { id: "body", label: "f_body", type: "textarea", ph: "ph_message" },
    ],
    build: (v) => (digits(v.phone) ? `SMSTO:${digits(v.phone)}:${v.body}` : ""),
  },
  {
    id: "whatsapp", icon: "💬",
    fields: [
      { id: "phone", label: "f_waNumber", type: "tel", ph: "8801XXXXXXXXX" },
      { id: "text", label: "f_prefill", type: "text", ph: "ph_hi" },
    ],
    build: (v) => {
      const n = v.phone.replace(/\D/g, "");
      return n ? `https://wa.me/${n}${v.text ? "?text=" + enc(v.text) : ""}` : "";
    },
  },
  {
    id: "email", icon: "📧",
    fields: [
      { id: "to", label: "f_emailTo", type: "email", ph: "hello@example.com" },
      { id: "subject", label: "f_subject", type: "text" },
      { id: "body", label: "f_body", type: "textarea" },
    ],
    build: (v) => {
      if (!v.to.trim()) return "";
      const q = [v.subject && "subject=" + enc(v.subject), v.body && "body=" + enc(v.body)].filter(Boolean);
      return `mailto:${v.to.trim()}${q.length ? "?" + q.join("&") : ""}`;
    },
  },
  {
    id: "contact", icon: "👤",
    fields: [
      { id: "first", label: "f_first", type: "text", half: true },
      { id: "last", label: "f_last", type: "text", half: true },
      { id: "phone", label: "f_phone", type: "tel", half: true },
      { id: "email", label: "f_email", type: "email", half: true },
      { id: "org", label: "f_org", type: "text", half: true },
      { id: "title", label: "f_jobTitle", type: "text", half: true },
      { id: "url", label: "f_website", type: "url" },
      { id: "address", label: "f_address", type: "text" },
    ],
    build: (v) => {
      const name = `${v.first} ${v.last}`.trim();
      if (!name && !v.phone && !v.email) return "";
      return [
        "BEGIN:VCARD", "VERSION:3.0",
        `N:${esc(v.last)};${esc(v.first)};;;`, `FN:${esc(name)}`,
        v.org && `ORG:${esc(v.org)}`, v.title && `TITLE:${esc(v.title)}`,
        v.phone && `TEL;TYPE=CELL:${v.phone}`, v.email && `EMAIL:${v.email}`,
        v.url && `URL:${v.url}`, v.address && `ADR:;;${esc(v.address)};;;;`,
        "END:VCARD",
      ].filter(Boolean).join("\n");
    },
  },
  {
    id: "location", icon: "📍",
    fields: [
      { id: "place", label: "f_place", type: "text", ph: "ph_place" },
      { id: "lat", label: "f_lat", type: "text", ph: "21.4272", half: true, note: "or_coords" },
      { id: "lng", label: "f_lng", type: "text", ph: "92.0058", half: true },
      { id: "_geo", label: "useMyLocation", type: "button" },
    ],
    build: (v) => {
      const lat = parseFloat(v.lat), lng = parseFloat(v.lng);
      if (!isNaN(lat) && !isNaN(lng)) return `https://maps.google.com/?q=${lat},${lng}`;
      return v.place.trim() ? `https://maps.google.com/?q=${enc(v.place.trim())}` : "";
    },
  },
  {
    id: "event", icon: "📅",
    fields: [
      { id: "title", label: "f_eventTitle", type: "text", ph: "ph_eventTitle" },
      { id: "place", label: "f_eventPlace", type: "text" },
      { id: "start", label: "f_start", type: "datetime-local", half: true },
      { id: "end", label: "f_end", type: "datetime-local", half: true },
      { id: "notes", label: "f_notes", type: "textarea" },
    ],
    build: (v) => {
      if (!v.title.trim() || !v.start) return "";
      const start = icsDate(v.start);
      const end = icsDate(v.end) || icsDate(new Date(new Date(v.start).getTime() + 3600e3));
      return [
        "BEGIN:VEVENT", `SUMMARY:${esc(v.title)}`, `DTSTART:${start}`, `DTEND:${end}`,
        v.place && `LOCATION:${esc(v.place)}`, v.notes && `DESCRIPTION:${esc(v.notes)}`, "END:VEVENT",
      ].filter(Boolean).join("\n");
    },
  },
  {
    id: "social", icon: "🌐",
    fields: [
      { id: "platform", label: "f_platform", type: "select",
        options: [["instagram", "Instagram"], ["facebook", "Facebook"], ["youtube", "YouTube"], ["tiktok", "TikTok"],
          ["telegram", "Telegram"], ["x", "X (Twitter)"], ["linkedin", "LinkedIn"], ["pinterest", "Pinterest"]] },
      { id: "username", label: "f_username", type: "text", ph: "ph_username" },
    ],
    build: (v) => {
      const u = v.username.trim().replace(/^@/, "");
      return u ? SOCIAL[v.platform](u) : "";
    },
  },
];

export const typeById = (id) => TYPES.find((x) => x.id === id) || TYPES[0];

/** Turn a decoded payload into something friendly for the scanner result card. */
export function describePayload(text) {
  if (/^https?:\/\//i.test(text)) return { kind: "link", open: text };
  if (/^WIFI:/i.test(text)) {
    const get = (k) => (text.match(new RegExp(`[;:]${k}:((?:\\\\.|[^;])*)`)) || [])[1]?.replace(/\\(.)/g, "$1") || "";
    return { kind: "wifi", lines: [["t_wifi", get("S")], ["f_password", get("P")], ["f_security", get("T")]] };
  }
  if (/^(tel|mailto|sms|smsto):/i.test(text)) return { kind: "action", open: text.replace(/^SMSTO:([^:]+):/i, "sms:$1?body=") };
  if (/^BEGIN:VCARD/i.test(text)) return { kind: "contact" };
  return { kind: "text" };
}
