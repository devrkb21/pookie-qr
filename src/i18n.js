import { CONFIG } from "./config.js";

const en = {
  brand: "Love QR Studio",
  for: "For",
  subtitle: "a little QR studio, made just for you",
  create: "Create", scan: "Scan",
  tabContent: "Content", tabDesign: "Design", tabFrame: "Frame", tabBadge: "Badge",

  // types
  t_link: "Link", t_text: "Message", t_wifi: "Wi-Fi", t_phone: "Call", t_sms: "SMS",
  t_whatsapp: "WhatsApp", t_email: "Email", t_contact: "Contact", t_location: "Location",
  t_event: "Event", t_social: "Social",

  // fields
  f_url: "Website or link", f_message: "Your message", ph_message: "Write something sweet…",
  f_ssid: "Network name", f_password: "Password", f_security: "Security", f_hidden: "Hidden network",
  sec_none: "No password",
  f_phone: "Phone number", f_waNumber: "WhatsApp number (with country code)", f_prefill: "Pre-filled message (optional)",
  f_emailTo: "Email address", f_subject: "Subject", f_body: "Message",
  f_first: "First name", f_last: "Last name", f_email: "Email", f_org: "Company", f_jobTitle: "Job title",
  f_website: "Website", f_address: "Address",
  f_place: "Place name or address", ph_place: "e.g. Cox's Bazar Sea Beach", f_lat: "Latitude", f_lng: "Longitude",
  or_coords: "…or exact coordinates", useMyLocation: "📍 Use my location",
  f_eventTitle: "Event title", ph_eventTitle: "Our anniversary dinner ♥", f_eventPlace: "Where",
  f_start: "Starts", f_end: "Ends", f_notes: "Notes",
  f_platform: "Platform", f_username: "Username",
  ph_ssid: "Home Wi-Fi", ph_hi: "Hi! 👋", ph_username: "username",

  // design
  d_mood: "Mood", d_shape: "QR shape", shape_square: "Square", shape_circle: "Circle",
  d_dots: "Dot style", d_eyes: "Eye frame", d_eyeDots: "Eye center",
  d_colors: "Colors", c_dots: "Dots", c_blend: "Blend", c_eyes: "Eyes", c_bg: "Background",
  d_gradient: "Gradient", g_none: "Solid", g_linear: "Linear", g_radial: "Radial", d_angle: "Angle",
  d_transparent: "Transparent background (plain frame only)",
  surprise: "✨ Surprise me",

  st_rounded: "Rounded", st_dots: "Dots", st_classy: "Classy", st_classyRounded: "Classy soft",
  st_extraRounded: "Extra soft", st_square: "Square", st_dot: "Circle",

  // frame
  fr_style: "Frame style", fr_plain: "Plain", fr_polaroid: "Polaroid", fr_card: "Love card",
  fr_scanme: "Scan me", fr_letter: "Love letter",
  f_title: "Title (top)", ph_title: "Scan me ♥", f_caption: "Caption (bottom)", ph_caption: "With love",
  f_font: "Caption font", font_script: "Script", font_serif: "Elegant", font_clean: "Clean", font_bangla: "বাংলা",

  // badge
  b_choose: "Center badge", b_none: "None", b_upload: "📷 Upload photo", b_size: "Badge size",
  b_round: "Round photo",

  // preview
  dl_png: "Download PNG", quality: "Quality", q1: "Normal", q2: "HD", q4: "Ultra HD",
  copy: "Copy", share: "Share", chars: "characters",
  m_download: "Download", m_save: "Save to phone",
  chk_checking: "Checking…", chk_ok: "Scans perfectly", chk_bad: "Hard to scan — try more contrast or a smaller badge",
  chk_empty: "Fill in the content to begin", chk_inverted: "Scans, but light-on-dark may fail on old phones",
  chk_contrast: "Scans, but more contrast would be safer",
  recent: "Recently made", clear: "Clear",
  preview: "Preview",

  // scan
  sc_title: "Scan any QR code", sc_sub: "Use the camera, or drop / paste a picture of a QR code.",
  sc_start: "📷 Start camera", sc_stop: "Stop camera", sc_upload: "🖼 Choose a picture",
  sc_drop: "Drop an image here, or press Ctrl+V to paste", sc_result: "Found it!",
  sc_open: "Open", sc_copy: "Copy", sc_none: "No QR code found in that picture",
  sc_noCam: "Couldn't open the camera", sc_edit: "Edit in studio",

  // toasts
  saved: "Saved! ♥", copied: "Copied — paste it anywhere ♥", copyFail: "Copy isn't supported here — try Download",
  photoAdded: "Photo added ♥", shareFail: "Sharing isn't supported here",
  locFail: "Couldn't get your location",

  // welcome
  w_hi: "Hi", w_open: "Open your gift ♥", replay: "Read my note again",
  footer: "made with all my love, just for you",
};

const bn = {
  brand: "লাভ QR স্টুডিও",
  for: "",
  subtitle: "শুধু তোমার জন্য বানানো ছোট্ট একটা QR স্টুডিও",
  create: "বানাও", scan: "স্ক্যান",
  tabContent: "কনটেন্ট", tabDesign: "ডিজাইন", tabFrame: "ফ্রেম", tabBadge: "ব্যাজ",

  t_link: "লিংক", t_text: "মেসেজ", t_wifi: "ওয়াই-ফাই", t_phone: "কল", t_sms: "এসএমএস",
  t_whatsapp: "হোয়াটসঅ্যাপ", t_email: "ইমেইল", t_contact: "কন্টাক্ট", t_location: "লোকেশন",
  t_event: "ইভেন্ট", t_social: "সোশ্যাল",

  f_url: "ওয়েবসাইট বা লিংক", f_message: "তোমার মেসেজ", ph_message: "মিষ্টি কিছু লেখো…",
  f_ssid: "নেটওয়ার্কের নাম", f_password: "পাসওয়ার্ড", f_security: "সিকিউরিটি", f_hidden: "লুকানো নেটওয়ার্ক",
  sec_none: "পাসওয়ার্ড নেই",
  f_phone: "ফোন নম্বর", f_waNumber: "হোয়াটসঅ্যাপ নম্বর (কান্ট্রি কোডসহ)", f_prefill: "আগে থেকে লেখা মেসেজ (ঐচ্ছিক)",
  f_emailTo: "ইমেইল ঠিকানা", f_subject: "বিষয়", f_body: "মেসেজ",
  f_first: "নামের প্রথম অংশ", f_last: "নামের শেষ অংশ", f_email: "ইমেইল", f_org: "প্রতিষ্ঠান", f_jobTitle: "পদবি",
  f_website: "ওয়েবসাইট", f_address: "ঠিকানা",
  f_place: "জায়গার নাম বা ঠিকানা", ph_place: "যেমন: কক্সবাজার সমুদ্র সৈকত", f_lat: "অক্ষাংশ", f_lng: "দ্রাঘিমাংশ",
  or_coords: "…অথবা সঠিক কো-অর্ডিনেট", useMyLocation: "📍 আমার লোকেশন",
  f_eventTitle: "ইভেন্টের নাম", ph_eventTitle: "আমাদের অ্যানিভার্সারি ডিনার ♥", f_eventPlace: "কোথায়",
  f_start: "শুরু", f_end: "শেষ", f_notes: "নোট",
  f_platform: "প্ল্যাটফর্ম", f_username: "ইউজারনেম",
  ph_ssid: "বাসার ওয়াই-ফাই", ph_hi: "হাই! 👋", ph_username: "ইউজারনেম",

  d_mood: "মুড", d_shape: "QR এর আকার", shape_square: "চারকোনা", shape_circle: "গোল",
  d_dots: "ডটের স্টাইল", d_eyes: "চোখের ফ্রেম", d_eyeDots: "চোখের মাঝখান",
  d_colors: "রং", c_dots: "ডট", c_blend: "মিশ্রণ", c_eyes: "চোখ", c_bg: "ব্যাকগ্রাউন্ড",
  d_gradient: "গ্রেডিয়েন্ট", g_none: "এক রং", g_linear: "সোজা", g_radial: "গোলাকার", d_angle: "কোণ",
  d_transparent: "স্বচ্ছ ব্যাকগ্রাউন্ড (শুধু প্লেইন ফ্রেমে)",
  surprise: "✨ চমকে দাও",

  st_rounded: "গোলাকার", st_dots: "ডট", st_classy: "ক্লাসি", st_classyRounded: "নরম ক্লাসি",
  st_extraRounded: "খুব নরম", st_square: "চারকোনা", st_dot: "বৃত্ত",

  fr_style: "ফ্রেমের স্টাইল", fr_plain: "প্লেইন", fr_polaroid: "পোলারয়েড", fr_card: "লাভ কার্ড",
  fr_scanme: "স্ক্যান মি", fr_letter: "প্রেমপত্র",
  f_title: "শিরোনাম (উপরে)", ph_title: "স্ক্যান করো ♥", f_caption: "ক্যাপশন (নিচে)", ph_caption: "ভালোবাসা নিয়ে",
  f_font: "ক্যাপশনের ফন্ট", font_script: "হাতের লেখা", font_serif: "এলিগ্যান্ট", font_clean: "সাধারণ", font_bangla: "বাংলা",

  b_choose: "মাঝখানের ব্যাজ", b_none: "কিছু না", b_upload: "📷 ছবি দাও", b_size: "ব্যাজের সাইজ",
  b_round: "গোল ছবি",

  dl_png: "PNG ডাউনলোড", quality: "কোয়ালিটি", q1: "সাধারণ", q2: "HD", q4: "আল্ট্রা HD",
  copy: "কপি", share: "শেয়ার", chars: "অক্ষর",
  m_download: "ডাউনলোড", m_save: "ফোনে সেভ করো",
  chk_checking: "চেক করছি…", chk_ok: "একদম ঠিকঠাক স্ক্যান হয়", chk_bad: "স্ক্যান করা কঠিন — রং আরও গাঢ় করো বা ব্যাজ ছোট করো",
  chk_empty: "শুরু করতে কনটেন্ট লেখো", chk_inverted: "স্ক্যান হয়, তবে পুরনো ফোনে কালো ব্যাকগ্রাউন্ডে সমস্যা হতে পারে",
  chk_contrast: "স্ক্যান হয়, তবে আরেকটু কনট্রাস্ট দিলে ভালো",
  recent: "সাম্প্রতিক", clear: "মুছে ফেলো",
  preview: "প্রিভিউ",

  sc_title: "যেকোনো QR কোড স্ক্যান করো", sc_sub: "ক্যামেরা ব্যবহার করো, অথবা QR কোডের ছবি দাও / পেস্ট করো।",
  sc_start: "📷 ক্যামেরা চালু", sc_stop: "ক্যামেরা বন্ধ", sc_upload: "🖼 ছবি বেছে নাও",
  sc_drop: "এখানে ছবি ছেড়ে দাও, অথবা Ctrl+V চেপে পেস্ট করো", sc_result: "পেয়েছি!",
  sc_open: "খোলো", sc_copy: "কপি", sc_none: "ছবিতে কোনো QR কোড পাইনি",
  sc_noCam: "ক্যামেরা চালু করা গেল না", sc_edit: "স্টুডিওতে এডিট করো",

  saved: "সেভ হয়েছে! ♥", copied: "কপি হয়েছে — যেকোনো জায়গায় পেস্ট করো ♥", copyFail: "এখানে কপি হয় না — ডাউনলোড করো",
  photoAdded: "ছবি যোগ হয়েছে ♥", shareFail: "এখানে শেয়ার করা যায় না",
  locFail: "লোকেশন পাওয়া গেল না",

  w_hi: "হাই", w_open: "তোমার উপহার খোলো ♥", replay: "আমার চিঠিটা আবার পড়ো",
  footer: "অনেক ভালোবাসা দিয়ে, শুধু তোমার জন্য বানানো",
};

const DICTS = { en, bn };
let lang = CONFIG.defaultLang;

export const getLang = () => lang;
export const t = (key) => DICTS[lang][key] ?? en[key] ?? key;
export const tc = (obj) => obj[lang] ?? obj.en; // pick from a CONFIG {en, bn} pair
// numbers in Bangla digits when the app is in Bangla
export const num = (n) => (lang === "bn" ? String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]) : String(n));

export function setLang(next) {
  lang = DICTS[next] ? next : "en";
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  document.querySelectorAll("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
}
