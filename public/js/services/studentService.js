import { db } from "../core/firebase.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const colStudents = collection(db, "alunos");

async function addStudent(data) {
  return addDoc(colStudents, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

async function updateStudent(id, data) {
  return updateDoc(doc(db, "alunos", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

async function deleteStudent(id) {
  return deleteDoc(doc(db, "alunos", id));
}

export { addStudent, updateStudent, deleteStudent };
