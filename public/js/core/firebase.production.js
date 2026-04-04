import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBh6CIne05dCuO0mu7JX6icZv8l7c2bw_8",
  authDomain: "meu-app-edson.firebaseapp.com",
  projectId: "meu-app-edson",
  storageBucket: "meu-app-edson.firebasestorage.app",
  messagingSenderId: "555388653411",
  appId: "1:555388653411:web:e9184f7f5e443174934d56"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Offline persistence falhou: múltiplas abas abertas.");
  } else if (err.code === "unimplemented") {
    console.warn("Offline persistence não suportada neste browser.");
  }
});

export { app, auth, db };