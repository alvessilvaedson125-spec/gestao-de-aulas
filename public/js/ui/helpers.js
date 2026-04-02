import { formatBRLFromCents } from "../utils/formatService.js";
import { pad2 } from "../utils/uiHelpers.js";
import { parseISODateLocal } from "../utils/dateService.js";

/* ======================= Config ======================= */
export const BRAND_NAME = "Edson Silva";

/* ======================= Formatação de datas ======================= */
export function toInputDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

export function toLocalDateTimeString(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function hhmmLocal(iso) {
  const s = String(iso || "");
  if (s.length >= 16) return s.slice(11, 16);
  const d = parseISODateLocal(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* ======================= Alerta ======================= */
export function showAlert(txt, kind = "ok") {
  const a = document.getElementById("appAlert");
  if (!a) return;
  a.textContent = txt;
  a.style.display = "block";
  setTimeout(() => a.style.display = "none", 1800);
}

/* ======================= Máscara BRL ======================= */
export function onlyDigits(s) {
  return String(s || "").replace(/\D+/g, "");
}

export function maskBRLInput(e) {
  const cents = Number(onlyDigits(e.target.value) || 0);
  e.target.value = formatBRLFromCents(cents);
}

export function bindBRLMasks() {
  ["lessonPrice", "recAvulsaValue"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value) el.value = formatBRLFromCents(0);
    el.addEventListener("input", maskBRLInput);
    el.addEventListener("paste", () => setTimeout(() => maskBRLInput({ target: el }), 0));
    el.addEventListener("focus", () => { if (!el.value) el.value = formatBRLFromCents(0); });
  });
}

/* ======================= WhatsApp ======================= */
export function firstName(full = "") {
  const t = (full || "").trim().split(/\s+/)[0] || "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function normalizePhoneBR(raw = "") {
  const d = String(raw).replace(/\D+/g, "");
  if (!d) return "";
  if (d.startsWith("55")) return d;
  return "55" + d;
}

export function buildWhatsAppMessage({ studentName, when, style, level, place }) {
  const dia  = pad2(when.getDate()) + "/" + pad2(when.getMonth()+1) + "/" + when.getFullYear();
  const hora = pad2(when.getHours()) + ":" + pad2(when.getMinutes());
  return `Oi, ${firstName(studentName)}! Tudo bem? 😊\n\nConfirmação da sua aula:\n• Data: ${dia} às ${hora}\n• Estilo: ${style||"—"} — Nível: ${level||"—"}\n• Local: ${place||"—"}\n\nNos vemos em breve!\n— ${BRAND_NAME}`;
}