import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-TRHY5ZKieCJTs-2P0TbPhEav76adK3Y",
  authDomain: "meu-app-edson-staging.firebaseapp.com",
  projectId: "meu-app-edson-staging",
  storageBucket: "meu-app-edson-staging.firebasestorage.app",
  messagingSenderId: "345449703927",
  appId: "1:345449703927:web:2cb57412df43b9afc3e6f2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };