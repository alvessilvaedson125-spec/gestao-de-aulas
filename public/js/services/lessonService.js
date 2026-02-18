import { db } from "../core/firebase.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const colLessons = collection(db, "aulas");

async function addLesson(data) {
  return addDoc(colLessons, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

async function updateLesson(id, data) {
  return updateDoc(doc(db, "aulas", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}


async function deleteLesson(id) {
  return deleteDoc(doc(db, "aulas", id));
}

export { addLesson, updateLesson, deleteLesson };