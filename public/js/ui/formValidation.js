/* ======================= Validação de formulários ======================= */

/* Aplica erro visual em um campo */
function setFieldError(fieldEl, message) {
  if (!fieldEl) return;
  fieldEl.classList.add("field-error");
  let msg = fieldEl.parentElement.querySelector(".field-error-msg");
  if (!msg) {
    msg = document.createElement("div");
    msg.className = "field-error-msg";
    fieldEl.parentElement.appendChild(msg);
  }
  msg.textContent = message;
  // Limpa ao digitar/mudar
  const clear = () => {
    clearFieldError(fieldEl);
    fieldEl.removeEventListener("input", clear);
    fieldEl.removeEventListener("change", clear);
  };
  fieldEl.addEventListener("input", clear);
  fieldEl.addEventListener("change", clear);
}

/* Remove erro visual de um campo */
function clearFieldError(fieldEl) {
  if (!fieldEl) return;
  fieldEl.classList.remove("field-error");
  const msg = fieldEl.parentElement.querySelector(".field-error-msg");
  if (msg) msg.remove();
}

/* Valida se campo está preenchido */
function required(fieldEl, message) {
  const val = fieldEl?.value?.trim?.() ?? fieldEl?.value ?? "";
  if (!val) {
    setFieldError(fieldEl, message || "Campo obrigatório");
    return false;
  }
  clearFieldError(fieldEl);
  return true;
}

/* Valida se valor é número positivo */
function positiveNumber(fieldEl, message) {
  const val = parseFloat(fieldEl?.value?.replace?.(/[^\d,]/g, "")?.replace?.(",", ".") ?? fieldEl?.value);
  if (isNaN(val) || val < 0) {
    setFieldError(fieldEl, message || "Valor inválido");
    return false;
  }
  clearFieldError(fieldEl);
  return true;
}

/* Valida se data fim é depois da data início */
function dateAfter(startEl, endEl, message) {
  const start = startEl?.value;
  const end   = endEl?.value;
  if (!start || !end) return true; // já validado por required
  const s = new Date(start.includes("/") ? start.split("/").reverse().join("-") : start);
  const e = new Date(end.includes("/")   ? end.split("/").reverse().join("-")   : end);
  if (e < s) {
    setFieldError(endEl, message || "Data fim deve ser após a data início");
    return false;
  }
  clearFieldError(endEl);
  return true;
}

/* ======================= Validações por formulário ======================= */

export function validateLessonForm() {
  const $ = (id) => document.getElementById(id);
  let ok = true;
  if (!required($("lessonStudent"), "Selecione um aluno"))       ok = false;
  if (!required($("lessonDate"),    "Informe a data e horário")) ok = false;
  if (!required($("lessonStyle"),   "Informe o estilo"))         ok = false;
  return ok;
}

export function validatePackageForm() {
  const $ = (id) => document.getElementById(id);
  let ok = true;
  if (!required($("pkgStart"), "Informe a data de início"))  ok = false;
  if (!required($("pkgEnd"),   "Informe a data de fim"))     ok = false;
  if (!required($("pkgTotal"), "Informe o total de aulas"))  ok = false;
  if (!dateAfter($("pkgStart"), $("pkgEnd")))                ok = false;
  return ok;
}

export function validateCashForm() {
  const $ = (id) => document.getElementById(id);
  let ok = true;
  if (!required($("cashDate"),        "Informe a data"))      ok = false;
  if (!required($("cashDescription"), "Informe a descrição")) ok = false;
  const amountEl = $("cashAmount");
  const raw = amountEl?.value?.replace(/[^\d]/g, "") || "";
  if (!raw || raw === "0" || raw === "00") {
    setFieldError(amountEl, "Informe um valor maior que zero");
    ok = false;
  }
  return ok;
}

export function validateStudentForm() {
  const $ = (id) => document.getElementById(id);
  let ok = true;
  if (!required($("studentName"), "Informe o nome do aluno")) ok = false;
  return ok;
}

export function validateEvolutionForm() {
  const $ = (id) => document.getElementById(id);
  let ok = true;
  if (!required($("evolutionStudent"), "Selecione um aluno")) ok = false;
  if (!required($("evolutionDate"),    "Informe a data"))     ok = false;
  return ok;
}