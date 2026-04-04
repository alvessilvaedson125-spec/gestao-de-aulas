import { parseISODateLocal } from "../utils/dateService.js";
import { formatBRL, parseBRLToNumber } from "../utils/formatService.js";
import { $, pad2 } from "../utils/uiHelpers.js";
import { toInputDate, toLocalDateTimeString, showAlert } from "./helpers.js";
import { addLesson, updateLesson, deleteLesson } from "../services/lessonService.js";
import {
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { validateLessonForm } from "./formValidation.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get lessons()    { return []; },
  get students()   { return []; },
  get db()         { return null; },
  get user()       { return null; },
  get colLessons() { return null; },
  fillStudentSelects: ()=>{},
  openReceiptFromLesson: ()=>{}
};

export function initLessons(ctx) {
  _ctx = ctx;
}

/* ======================= Estado local ======================= */
let editingLessonId = null;

/* ======================= Modal ======================= */
export function openLessonModal(data) {
  _ctx.fillStudentSelects();
  editingLessonId = data?.id || null;
  const recBox = document.getElementById("recurrenceBox");
  if (recBox) recBox.style.display = editingLessonId ? "none" : "grid";
  $("lessonTitle").textContent  = editingLessonId ? "Editar aula" : "Nova aula";
  const nowLocal = toLocalDateTimeString(new Date());
  $("lessonDate").value     = data?.date?.slice(0, 16) ?? nowLocal;
  $("lessonStudent").value  = data?.studentId || "";
  $("lessonStyle").value    = data?.style || "";
  $("lessonLevel").value    = data?.level || "Iniciante";
  $("lessonType").value     = data?.type  || "Particular";
  $("lessonModel").value    = data?.model || "Padrão";
  $("lessonDuration").value = data?.duration || 60;
  $("lessonPrice").value    = Number.isFinite(+data?.price) ? formatBRL(data.price) : formatBRL(0);
  $("lessonPlace").value    = data?.place || "";
  $("lessonStatus").value   = String(data?.status ?? 0);
  $("lessonNotes").value    = data?.notes || "";
  $("btnDelLesson").style.display = editingLessonId ? "inline-flex" : "none";
  $("recEnabled").checked = false; $("recEvery").value = "7"; $("recCount").value = 0;
  document.body.classList.add("modal-open");
  $("lessonModal").classList.add("show");
}

export function editLesson(id) {
  const a = _ctx.lessons.find(x => x.id === id);
  if (a) openLessonModal(a);
}

export function requestDeleteLesson(id) {
  const a = _ctx.lessons.find(x => x.id === id);
  if (a) openLessonModal(a);
}

/* ======================= Salvar ======================= */



export async function saveLesson() {
   if (!validateLessonForm()) return;
  const dateLocal = $("lessonDate").value;
  const recOn     = $("recEnabled")?.checked;
  const recDays   = Number($("recEvery")?.value || 7);
  const recQty    = Number($("recCount")?.value || 0);
  const recurrenceGroupId = recOn && recQty > 0 ? crypto.randomUUID() : undefined;

  const payload = {
    date:      dateLocal,
    studentId: $("lessonStudent").value,
    style:     $("lessonStyle").value,
    level:     $("lessonLevel").value,
    type:      $("lessonType").value,
    model:     $("lessonModel").value,
    duration:  +$("lessonDuration").value || 60,
    price:     parseBRLToNumber($("lessonPrice").value),
    place:     $("lessonPlace").value,
    status:    +$("lessonStatus").value || 0,
    notes:     $("lessonNotes").value,
    ownerUid:  _ctx.user?.uid || "dev",
    updatedAt: serverTimestamp()
  };

  try {
    if (editingLessonId) {
      await updateDoc(doc(_ctx.db, "aulas", editingLessonId), payload);
    } else {
      await addDoc(_ctx.colLessons, { ...payload, ...(recurrenceGroupId && { recurrenceGroupId }), createdAt: serverTimestamp() });
      if (recurrenceGroupId) {
        const base = new Date(dateLocal);
        for (let i = 1; i <= recQty; i++) {
          const d = new Date(base); d.setDate(d.getDate() + i * recDays);
          await addDoc(_ctx.colLessons, { ...payload, date: toLocalDateTimeString(d), status: 0, recurrenceGroupId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
      }
    }
    $("lessonModal").classList.remove("show");
    document.body.classList.remove("modal-open");
    showAlert("Salvo com sucesso.");
  } catch (e) { console.error(e); showAlert("Erro ao salvar aula", "error"); }
}

/* ======================= Excluir ======================= */
export async function deleteLessonConfirmed() {
  if (!editingLessonId) return;
  if (!confirm("Excluir esta aula?")) return;
  try {
    await deleteLesson(editingLessonId);
    $("lessonModal").classList.remove("show");
    document.body.classList.remove("modal-open");
    editingLessonId = null;
    showAlert("Aula excluída.");
  } catch (e) { console.error("ERRO REAL:", e); showAlert("Erro ao excluir aula", "error"); }
}

/* ======================= Bind de botões ======================= */
export function bindLessonButtons() {
  $("btnNewLesson").onclick   = () => openLessonModal();
  $("btnCloseLesson").onclick = () => { $("lessonModal").classList.remove("show"); document.body.classList.remove("modal-open"); };
  $("btnSaveLesson").onclick  = saveLesson;
  $("btnDelLesson").onclick   = deleteLessonConfirmed;
}