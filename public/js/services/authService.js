import { auth } from "../core/firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}

function logout() {
  return signOut(auth);
}

function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export { loginWithGoogle, logout, observeAuthState };
