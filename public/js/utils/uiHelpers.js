// public/js/utils/uiHelpers.js

/* ===================================================
   UI HELPERS
   ---------------------------------------------------
   - Manipulação leve de DOM
   - Helpers visuais
   - Não acessa estado global
   - Funções puras (quando possível)
=================================================== */

export const $ = (id) => document.getElementById(id);

export const els = (selector, context = document) =>
  Array.from(context.querySelectorAll(selector));

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function ymdKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
